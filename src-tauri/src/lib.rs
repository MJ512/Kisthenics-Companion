use chrono::{Datelike, NaiveDate, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Condvar, Mutex};
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, PhysicalPosition, PhysicalSize,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Reminder {
    pub id: String,
    pub title: String,
    pub message: String,
    pub time: String,
    pub date: String,
    pub trigger_timestamp: i64,
    pub character_id: String,
    pub resolved_character_id: Option<String>,
    pub recurrence: String,
    pub custom_days: Option<String>,
    pub priority: String,
    pub status: String,
    pub snooze_until: Option<i64>,
    pub snooze_count: i64,
    pub created_at: i64,
    pub completed_at: Option<i64>,
    pub category: Option<String>,
    pub sound_type: Option<String>,
    pub duration_seconds: Option<i64>,
}

pub struct DbState {
    pub db_path: PathBuf,
}

pub struct SchedulerNotifier {
    pub condvar: Condvar,
    pub lock: Mutex<()>,
}

impl SchedulerNotifier {
    pub fn new() -> Self {
        Self {
            condvar: Condvar::new(),
            lock: Mutex::new(()),
        }
    }

    pub fn notify(&self) {
        self.condvar.notify_all();
    }
}

fn advance_date_by_days(date_str: &str, days: i64) -> String {
    if let Ok(d) = NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        let new_d = d + chrono::Duration::days(days);
        new_d.format("%Y-%m-%d").to_string()
    } else {
        date_str.to_string()
    }
}

fn advance_date_next_weekday(date_str: &str) -> (String, i64) {
    if let Ok(mut d) = NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        let mut days_added = 0;
        loop {
            d = d + chrono::Duration::days(1);
            days_added += 1;
            let weekday = d.weekday();
            if weekday != chrono::Weekday::Sat && weekday != chrono::Weekday::Sun {
                break;
            }
        }
        (d.format("%Y-%m-%d").to_string(), days_added)
    } else {
        (date_str.to_string(), 1)
    }
}

fn open_db_safe(db_path: &PathBuf) -> Result<Connection, rusqlite::Error> {
    if let Some(parent) = db_path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    if db_path.exists() {
        match Connection::open(db_path) {
            Ok(conn) => {
                let integrity: Result<String, _> =
                    conn.query_row("PRAGMA quick_check(1)", [], |r| r.get(0));
                match integrity {
                    Ok(ref s) if s == "ok" => Ok(conn),
                    _ => {
                        let timestamp = Utc::now().timestamp();
                        let backup_path = db_path.with_extension(format!("corrupt.{}.db", timestamp));
                        log::error!("Database corrupted! Backing up original to {:?}", backup_path);
                        let _ = fs::copy(db_path, &backup_path);
                        let _ = fs::remove_file(db_path);
                        Connection::open(db_path)
                    }
                }
            }
            Err(e) => {
                let timestamp = Utc::now().timestamp();
                let backup_path = db_path.with_extension(format!("corrupt.{}.db", timestamp));
                log::error!("Failed to open SQLite ({:?})! Backing up to {:?}", e, backup_path);
                let _ = fs::copy(db_path, &backup_path);
                let _ = fs::remove_file(db_path);
                Connection::open(db_path)
            }
        }
    } else {
        Connection::open(db_path)
    }
}

fn init_db(db_path: &PathBuf) -> Result<(), rusqlite::Error> {
    let conn = open_db_safe(db_path)?;

    // PRAGMA user_version schema migration system
    let current_version: i32 = conn
        .query_row("PRAGMA user_version", [], |r| r.get(0))
        .unwrap_or(0);

    if current_version < 1 {
        conn.execute(
            "CREATE TABLE IF NOT EXISTS reminders (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                time TEXT NOT NULL,
                date TEXT NOT NULL,
                trigger_timestamp INTEGER NOT NULL,
                character_id TEXT NOT NULL,
                resolved_character_id TEXT,
                recurrence TEXT NOT NULL,
                custom_days TEXT,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                snooze_until INTEGER,
                snooze_count INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                completed_at INTEGER,
                category TEXT,
                sound_type TEXT,
                duration_seconds INTEGER
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );",
            [],
        )?;

        // Ensure columns exist on older DBs
        let _ = conn.execute("ALTER TABLE reminders ADD COLUMN sound_type TEXT;", []);
        let _ = conn.execute("ALTER TABLE reminders ADD COLUMN duration_seconds INTEGER;", []);

        conn.execute("PRAGMA user_version = 1;", [])?;
        log::info!("Applied database migration: user_version = 1");
    }

    // Startup recovery: any reminders marked 'alerted' that were never completed are reset to 'pending'
    let _ = conn.execute(
        "UPDATE reminders SET status = 'pending' WHERE status = 'alerted' AND completed_at IS NULL",
        [],
    );

    Ok(())
}

fn get_reminders_internal(conn: &Connection) -> Result<Vec<Reminder>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, message, time, date, trigger_timestamp, character_id, 
                    resolved_character_id, recurrence, custom_days, priority, status, 
                    snooze_until, snooze_count, created_at, completed_at, category,
                    sound_type, duration_seconds 
             FROM reminders ORDER BY trigger_timestamp ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Reminder {
                id: row.get(0)?,
                title: row.get(1)?,
                message: row.get(2)?,
                time: row.get(3)?,
                date: row.get(4)?,
                trigger_timestamp: row.get(5)?,
                character_id: row.get(6)?,
                resolved_character_id: row.get(7)?,
                recurrence: row.get(8)?,
                custom_days: row.get(9)?,
                priority: row.get(10)?,
                status: row.get(11)?,
                snooze_until: row.get(12)?,
                snooze_count: row.get(13)?,
                created_at: row.get(14)?,
                completed_at: row.get(15)?,
                category: row.get(16)?,
                sound_type: row.get(17).ok(),
                duration_seconds: row.get(18).ok(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for r in rows {
        if let Ok(item) = r {
            result.push(item);
        }
    }
    Ok(result)
}

#[tauri::command]
fn get_character_files(_app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let mut files = Vec::new();

    let candidates = vec![
        PathBuf::from("public/images"),
        PathBuf::from("../public/images"),
    ];

    for candidate in candidates {
        if candidate.exists() && candidate.is_dir() {
            if let Ok(entries) = fs::read_dir(candidate) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()).map(|s| s.to_lowercase()) == Some("png".to_string()) {
                        if let Some(file_name) = path.file_name().and_then(|s| s.to_str()) {
                            files.push(file_name.to_string());
                        }
                    }
                }
            }
            if !files.is_empty() {
                break;
            }
        }
    }

    if files.is_empty() {
        files = vec![
            "Laugh.png".into(),
            "angry.png".into(),
            "cool.png".into(),
            "cry.png".into(),
            "heart eye.png".into(),
            "kadinama irunga.png".into(),
            "question .png".into(),
            "shock.png".into(),
            "silence.png".into(),
            "sleepy.png".into(),
            "thumbsup cool.png".into(),
            "thumbsup.png".into(),
        ];
    }

    Ok(files)
}

#[tauri::command]
fn get_reminders(state: tauri::State<Arc<Mutex<DbState>>>) -> Result<Vec<Reminder>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let conn = Connection::open(&state.db_path).map_err(|e| e.to_string())?;
    get_reminders_internal(&conn)
}

#[tauri::command]
fn load_demo_reminders(
    state: tauri::State<Arc<Mutex<DbState>>>,
    notifier: tauri::State<Arc<SchedulerNotifier>>,
) -> Result<Vec<Reminder>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let conn = Connection::open(&state.db_path).map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp_millis();
    let today = Utc::now().format("%Y-%m-%d").to_string();

    let samples = [
        (
            "sample-1",
            "Client Strategy Meeting",
            "Review final website deliverables and present next milestones with the engineering lead.",
            "17:00",
            &today,
            now + 300_000,
            "shock",
            "once",
            "high",
            "Work",
            "alert",
        ),
        (
            "sample-2",
            "Calisthenics & Pushups",
            "Time for evening strength training! Push for 5 sets of dips, pullups and hollow body holds.",
            "19:00",
            &today,
            now + 1_800_000,
            "kadinama_irunga",
            "daily",
            "urgent",
            "Fitness",
            "motivational",
        ),
        (
            "sample-3",
            "Hydrate & Rest Eyes",
            "You have been staring at the monitor for 2 hours. Drink a tall glass of water and stretch!",
            "20:30",
            &today,
            now + 3_600_000,
            "sleepy",
            "daily",
            "medium",
            "Health",
            "gentle",
        ),
        (
            "sample-4",
            "Call Family & Check In",
            "Send love and see how their week has been going ❤️",
            "21:15",
            &today,
            now + 7_200_000,
            "heart_eye",
            "weekly",
            "medium",
            "Personal",
            "gentle",
        ),
    ];

    for (id, title, message, time, date, trigger_ts, char_id, recurrence, priority, category, sound) in samples {
        let _ = conn.execute(
            "INSERT INTO reminders (
                id, title, message, time, date, trigger_timestamp, character_id,
                resolved_character_id, recurrence, priority, status, snooze_count,
                created_at, category, sound_type, duration_seconds
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7, ?8, ?9, 'pending', 0, ?10, ?11, ?12, 0)
            ON CONFLICT(id) DO NOTHING",
            params![
                id,
                title,
                message,
                time,
                date,
                trigger_ts,
                char_id,
                recurrence,
                priority,
                now,
                category,
                sound
            ],
        );
    }

    log::info!("Loaded demo reminders upon user request");
    notifier.notify();
    get_reminders_internal(&conn)
}

#[tauri::command]
fn save_reminder(
    reminder: Reminder,
    state: tauri::State<Arc<Mutex<DbState>>>,
    notifier: tauri::State<Arc<SchedulerNotifier>>,
) -> Result<Reminder, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let conn = Connection::open(&state.db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO reminders (
            id, title, message, time, date, trigger_timestamp, character_id, 
            resolved_character_id, recurrence, custom_days, priority, status, 
            snooze_until, snooze_count, created_at, completed_at, category,
            sound_type, duration_seconds
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            message = excluded.message,
            time = excluded.time,
            date = excluded.date,
            trigger_timestamp = excluded.trigger_timestamp,
            character_id = excluded.character_id,
            resolved_character_id = excluded.resolved_character_id,
            recurrence = excluded.recurrence,
            custom_days = excluded.custom_days,
            priority = excluded.priority,
            status = excluded.status,
            snooze_until = excluded.snooze_until,
            snooze_count = excluded.snooze_count,
            completed_at = excluded.completed_at,
            category = excluded.category,
            sound_type = excluded.sound_type,
            duration_seconds = excluded.duration_seconds",
        params![
            reminder.id,
            reminder.title,
            reminder.message,
            reminder.time,
            reminder.date,
            reminder.trigger_timestamp,
            reminder.character_id,
            reminder.resolved_character_id,
            reminder.recurrence,
            reminder.custom_days,
            reminder.priority,
            reminder.status,
            reminder.snooze_until,
            reminder.snooze_count,
            reminder.created_at,
            reminder.completed_at,
            reminder.category,
            reminder.sound_type,
            reminder.duration_seconds
        ],
    )
    .map_err(|e| e.to_string())?;

    log::info!("Saved reminder: id={}", reminder.id);
    notifier.notify();
    Ok(reminder)
}

#[tauri::command]
fn delete_reminder(
    id: String,
    state: tauri::State<Arc<Mutex<DbState>>>,
    notifier: tauri::State<Arc<SchedulerNotifier>>,
) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let conn = Connection::open(&state.db_path).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM reminders WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    log::info!("Deleted reminder: id={}", id);
    notifier.notify();
    Ok(())
}

#[tauri::command]
fn complete_reminder(
    id: String,
    state: tauri::State<Arc<Mutex<DbState>>>,
    notifier: tauri::State<Arc<SchedulerNotifier>>,
) -> Result<Reminder, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let conn = Connection::open(&state.db_path).map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp_millis();

    let mut stmt = conn
        .prepare(
            "SELECT id, title, message, time, date, trigger_timestamp, character_id, 
                    resolved_character_id, recurrence, custom_days, priority, status, 
                    snooze_until, snooze_count, created_at, completed_at, category,
                    sound_type, duration_seconds 
             FROM reminders WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let mut reminder = stmt
        .query_row(params![id], |row| {
            Ok(Reminder {
                id: row.get(0)?,
                title: row.get(1)?,
                message: row.get(2)?,
                time: row.get(3)?,
                date: row.get(4)?,
                trigger_timestamp: row.get(5)?,
                character_id: row.get(6)?,
                resolved_character_id: row.get(7)?,
                recurrence: row.get(8)?,
                custom_days: row.get(9)?,
                priority: row.get(10)?,
                status: row.get(11)?,
                snooze_until: row.get(12)?,
                snooze_count: row.get(13)?,
                created_at: row.get(14)?,
                completed_at: row.get(15)?,
                category: row.get(16)?,
                sound_type: row.get(17).ok(),
                duration_seconds: row.get(18).ok(),
            })
        })
        .map_err(|e| e.to_string())?;

    if reminder.recurrence == "daily" {
        reminder.trigger_timestamp += 86_400_000;
        reminder.date = advance_date_by_days(&reminder.date, 1);
        reminder.status = "pending".to_string();
        reminder.snooze_until = None;
        reminder.completed_at = Some(now);

        conn.execute(
            "UPDATE reminders SET trigger_timestamp = ?1, date = ?2, status = 'pending', snooze_until = NULL, completed_at = ?3 WHERE id = ?4",
            params![reminder.trigger_timestamp, reminder.date, now, id],
        )
        .map_err(|e| e.to_string())?;
    } else if reminder.recurrence == "weekly" {
        reminder.trigger_timestamp += 7 * 86_400_000;
        reminder.date = advance_date_by_days(&reminder.date, 7);
        reminder.status = "pending".to_string();
        reminder.snooze_until = None;
        reminder.completed_at = Some(now);

        conn.execute(
            "UPDATE reminders SET trigger_timestamp = ?1, date = ?2, status = 'pending', snooze_until = NULL, completed_at = ?3 WHERE id = ?4",
            params![reminder.trigger_timestamp, reminder.date, now, id],
        )
        .map_err(|e| e.to_string())?;
    } else if reminder.recurrence == "weekdays" {
        let (new_date, days_added) = advance_date_next_weekday(&reminder.date);
        reminder.trigger_timestamp += days_added * 86_400_000;
        reminder.date = new_date;
        reminder.status = "pending".to_string();
        reminder.snooze_until = None;
        reminder.completed_at = Some(now);

        conn.execute(
            "UPDATE reminders SET trigger_timestamp = ?1, date = ?2, status = 'pending', snooze_until = NULL, completed_at = ?3 WHERE id = ?4",
            params![reminder.trigger_timestamp, reminder.date, now, id],
        )
        .map_err(|e| e.to_string())?;
    } else {
        reminder.status = "completed".to_string();
        reminder.completed_at = Some(now);

        conn.execute(
            "UPDATE reminders SET status = 'completed', completed_at = ?1 WHERE id = ?2",
            params![now, id],
        )
        .map_err(|e| e.to_string())?;
    }

    log::info!("Completed reminder: id={}", id);
    notifier.notify();
    Ok(reminder)
}

#[tauri::command]
fn snooze_reminder(
    id: String,
    minutes: i64,
    state: tauri::State<Arc<Mutex<DbState>>>,
    notifier: tauri::State<Arc<SchedulerNotifier>>,
) -> Result<Reminder, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let conn = Connection::open(&state.db_path).map_err(|e| e.to_string())?;
    let snooze_until = Utc::now().timestamp_millis() + (minutes * 60 * 1000);

    conn.execute(
        "UPDATE reminders 
         SET status = 'pending', snooze_until = ?1, snooze_count = snooze_count + 1 
         WHERE id = ?2",
        params![snooze_until, id],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, title, message, time, date, trigger_timestamp, character_id, 
                    resolved_character_id, recurrence, custom_days, priority, status, 
                    snooze_until, snooze_count, created_at, completed_at, category,
                    sound_type, duration_seconds 
             FROM reminders WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let reminder = stmt
        .query_row(params![id], |row| {
            Ok(Reminder {
                id: row.get(0)?,
                title: row.get(1)?,
                message: row.get(2)?,
                time: row.get(3)?,
                date: row.get(4)?,
                trigger_timestamp: row.get(5)?,
                character_id: row.get(6)?,
                resolved_character_id: row.get(7)?,
                recurrence: row.get(8)?,
                custom_days: row.get(9)?,
                priority: row.get(10)?,
                status: row.get(11)?,
                snooze_until: row.get(12)?,
                snooze_count: row.get(13)?,
                created_at: row.get(14)?,
                completed_at: row.get(15)?,
                category: row.get(16)?,
                sound_type: row.get(17).ok(),
                duration_seconds: row.get(18).ok(),
            })
        })
        .map_err(|e| e.to_string())?;

    log::info!("Snoozed reminder: id={}, minutes={}", id, minutes);
    notifier.notify();
    Ok(reminder)
}

#[tauri::command]
fn get_setting(key: String, state: tauri::State<Arc<Mutex<DbState>>>) -> Result<Option<String>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let conn = Connection::open(&state.db_path).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM settings WHERE key = ?1")
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let val: String = row.get(0).map_err(|e| e.to_string())?;
        Ok(Some(val))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn save_setting(key: String, value: String, state: tauri::State<Arc<Mutex<DbState>>>) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let conn = Connection::open(&state.db_path).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn show_reminder_window(
    app: tauri::AppHandle,
    alert_payload: String,
    margin_right: Option<i32>,
    margin_bottom: Option<i32>,
    stacked_count: Option<usize>,
) -> Result<(), String> {
    if let Some(reminder_win) = app.get_webview_window("reminder") {
        let _ = reminder_win.emit("active-reminder", alert_payload);

        let monitor = reminder_win
            .current_monitor()
            .ok()
            .flatten()
            .or_else(|| reminder_win.primary_monitor().ok().flatten());

        if let Some(m) = monitor {
            let m_pos = m.position();
            let m_size = m.size();
            let scale_factor = m.scale_factor();

            let count = stacked_count.unwrap_or(1);
            let base_height = if count > 1 { 620.0 } else { 380.0 };

            let win_width = (430.0 * scale_factor) as i32;
            let win_height = (base_height * scale_factor) as i32;
            let mr = ((margin_right.unwrap_or(24) as f64) * scale_factor) as i32;
            let mb = ((margin_bottom.unwrap_or(24) as f64) * scale_factor) as i32;
            
            let taskbar_padding = (48.0 * scale_factor) as i32;

            let x = (m_pos.x + m_size.width as i32 - win_width - mr).max(m_pos.x + (16.0 * scale_factor) as i32);
            let y = (m_pos.y + m_size.height as i32 - win_height - mb - taskbar_padding).max(m_pos.y + (16.0 * scale_factor) as i32);

            let _ = reminder_win.set_position(PhysicalPosition::new(x, y));
            let _ = reminder_win.set_size(PhysicalSize::new(win_width as u32, win_height as u32));
        }

        let _ = reminder_win.set_always_on_top(true);
        let _ = reminder_win.show();
    }
    Ok(())
}

#[tauri::command]
fn hide_reminder_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(reminder_win) = app.get_webview_window("reminder") {
        let _ = reminder_win.hide();
    }
    Ok(())
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(main_win) = app.get_webview_window("main") {
        let _ = main_win.show();
        let _ = main_win.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn set_launch_at_startup(enable: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(exe_path) = std::env::current_exe() {
            let exe_str = exe_path.to_string_lossy().to_string();
            if enable {
                let _ = std::process::Command::new("reg")
                    .args(&[
                        "add",
                        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                        "/v",
                        "KisthenicsCompanion",
                        "/t",
                        "REG_SZ",
                        "/d",
                        &format!("\"{}\" --minimized", exe_str),
                        "/f",
                    ])
                    .output();
                log::info!("Enabled launch at startup in Windows registry");
            } else {
                let _ = std::process::Command::new("reg")
                    .args(&[
                        "delete",
                        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                        "/v",
                        "KisthenicsCompanion",
                        "/f",
                    ])
                    .output();
                log::info!("Disabled launch at startup in Windows registry");
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(exe_path) = std::env::current_exe() {
            let exe_str = exe_path.to_string_lossy().to_string();
            if enable {
                let script = format!(
                    "tell application \"System Events\" to make login item at end with properties {{path:\"{}\", hidden:true}}",
                    exe_str
                );
                let _ = std::process::Command::new("osascript")
                    .args(&["-e", &script])
                    .output();
            } else {
                let script = "tell application \"System Events\" to delete (login items whose name is \"Kisthenics Desktop Companion\")";
                let _ = std::process::Command::new("osascript")
                    .args(&["-e", &script])
                    .output();
            }
        }
    }

    Ok(())
}

#[tauri::command]
fn get_launch_at_startup() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("reg")
            .args(&[
                "query",
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                "/v",
                "KisthenicsCompanion",
            ])
            .output();

        if let Ok(out) = output {
            return Ok(out.status.success());
        }
    }

    #[cfg(target_os = "macos")]
    {
        let script = "tell application \"System Events\" to get the name of every login item";
        if let Ok(out) = std::process::Command::new("osascript").args(&["-e", script]).output() {
            let s = String::from_utf8_lossy(&out.stdout);
            return Ok(s.contains("Kisthenics") || s.contains("kisthenics"));
        }
    }

    Ok(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            log::info!("Second instance launched. Restoring existing main window.");
            let _ = show_main_window(app.clone());
        }))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Setup production SQLite DB Path in OS application data directory
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("./data"));
            let db_path = app_data_dir.join("kisthenics_reminders.db");
            if let Err(e) = init_db(&db_path) {
                log::error!("Failed to initialize SQLite: {}", e);
            }

            let db_state = Arc::new(Mutex::new(DbState {
                db_path: db_path.clone(),
            }));
            app.manage(db_state.clone());

            let scheduler_notifier = Arc::new(SchedulerNotifier::new());
            app.manage(scheduler_notifier.clone());

            // Build Tray Icon with requested menu structure
            let open_i = MenuItem::with_id(app, "open", "Open Kisthenics Companion", true, None::<&str>)?;
            let new_i = MenuItem::with_id(app, "new", "New Reminder", true, None::<&str>)?;
            let today_i = MenuItem::with_id(app, "today", "Today's Reminders", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_i, &new_i, &today_i, &settings_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        let _ = show_main_window(app.clone());
                    }
                    "new" => {
                        let _ = show_main_window(app.clone());
                        if let Some(main_win) = app.get_webview_window("main") {
                            let _ = main_win.emit("open-new-modal", ());
                        }
                    }
                    "today" => {
                        let _ = show_main_window(app.clone());
                        if let Some(main_win) = app.get_webview_window("main") {
                            let _ = main_win.emit("switch-tab-today", ());
                        }
                    }
                    "settings" => {
                        let _ = show_main_window(app.clone());
                        if let Some(main_win) = app.get_webview_window("main") {
                            let _ = main_win.emit("open-settings-modal", ());
                        }
                    }
                    "quit" => {
                        log::info!("Quit chosen from tray menu. Exiting cleanly.");
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(main_win) = app.get_webview_window("main") {
                            if let Ok(is_visible) = main_win.is_visible() {
                                if is_visible {
                                    let _ = main_win.hide();
                                } else {
                                    let _ = main_win.show();
                                    let _ = main_win.set_focus();
                                }
                            }
                        }
                    }
                })
                .build(app)?;

            // Support start minimized if launched with --minimized or configured in settings
            let args: Vec<String> = std::env::args().collect();
            let is_minimized_arg = args.iter().any(|a| a == "--minimized");
            let should_start_minimized = is_minimized_arg || {
                if let Ok(conn) = Connection::open(&db_path) {
                    conn.query_row(
                        "SELECT value FROM settings WHERE key = 'start_minimized'",
                        [],
                        |r| r.get::<_, String>(0),
                    )
                    .map(|v| v == "true")
                    .unwrap_or(false)
                } else {
                    false
                }
            };

            if let Some(main_win) = app.get_webview_window("main") {
                if let Some(icon) = app.default_window_icon() {
                    let _ = main_win.set_icon(icon.clone());
                }
                if should_start_minimized {
                    let _ = main_win.hide();
                }
            }

            // Sleep-Until-Due Background Scheduler with sleep/wake and clock drift protection
            let app_handle_scheduler = app.handle().clone();
            let db_state_scheduler = db_state.clone();
            let notifier_scheduler = scheduler_notifier.clone();

            std::thread::spawn(move || {
                log::info!("Background scheduler started");
                loop {
                    let now = Utc::now().timestamp_millis();

                    // 1. Process all due reminders right now
                    let due_reminders: Vec<Reminder> = {
                        let mut list = Vec::new();
                        if let Ok(state) = db_state_scheduler.lock() {
                            if let Ok(conn) = Connection::open(&state.db_path) {
                                if let Ok(mut stmt) = conn.prepare(
                                    "SELECT id, title, message, time, date, trigger_timestamp, character_id, 
                                            resolved_character_id, recurrence, custom_days, priority, status, 
                                            snooze_until, snooze_count, created_at, completed_at, category,
                                            sound_type, duration_seconds 
                                     FROM reminders 
                                     WHERE status = 'pending' 
                                       AND ((snooze_until IS NOT NULL AND snooze_until <= ?1) 
                                            OR (snooze_until IS NULL AND trigger_timestamp <= ?1))",
                                ) {
                                    if let Ok(rows) = stmt.query_map(params![now], |row| {
                                        Ok(Reminder {
                                            id: row.get(0)?,
                                            title: row.get(1)?,
                                            message: row.get(2)?,
                                            time: row.get(3)?,
                                            date: row.get(4)?,
                                            trigger_timestamp: row.get(5)?,
                                            character_id: row.get(6)?,
                                            resolved_character_id: row.get(7)?,
                                            recurrence: row.get(8)?,
                                            custom_days: row.get(9)?,
                                            priority: row.get(10)?,
                                            status: row.get(11)?,
                                            snooze_until: row.get(12)?,
                                            snooze_count: row.get(13)?,
                                            created_at: row.get(14)?,
                                            completed_at: row.get(15)?,
                                            category: row.get(16)?,
                                            sound_type: row.get(17).ok(),
                                            duration_seconds: row.get(18).ok(),
                                        })
                                    }) {
                                        for r in rows.flatten() {
                                            list.push(r);
                                        }
                                    }
                                }
                            }
                        }
                        list
                    };

                    let due_count = due_reminders.len();
                    for reminder in due_reminders {
                        if let Ok(state) = db_state_scheduler.lock() {
                            if let Ok(conn) = Connection::open(&state.db_path) {
                                let _ = conn.execute(
                                    "UPDATE reminders SET status = 'alerted' WHERE id = ?1",
                                    params![reminder.id],
                                );
                            }
                        }

                        log::info!("Alerting reminder: id={}, char={}", reminder.id, reminder.character_id);
                        let _ = app_handle_scheduler.emit("reminder-due", reminder.clone());
                        if let Ok(payload) = serde_json::to_string(&reminder) {
                            let _ = show_reminder_window(
                                app_handle_scheduler.clone(),
                                payload,
                                Some(24),
                                Some(24),
                                Some(due_count),
                            );
                        }
                    }

                    // 2. Query next pending reminder timestamp to calculate sleep duration
                    let next_due: Option<i64> = {
                        let mut ts = None;
                        if let Ok(state) = db_state_scheduler.lock() {
                            if let Ok(conn) = Connection::open(&state.db_path) {
                                if let Ok(mut stmt) = conn.prepare(
                                    "SELECT MIN(COALESCE(snooze_until, trigger_timestamp)) 
                                     FROM reminders 
                                     WHERE status = 'pending'",
                                ) {
                                    if let Ok(mut rows) = stmt.query([]) {
                                        if let Ok(Some(row)) = rows.next() {
                                            ts = row.get(0).ok();
                                        }
                                    }
                                }
                            }
                        }
                        ts
                    };

                    // Clamp sleep duration between 500ms and 10,000ms.
                    // This protects against system clock jumps and laptop sleep/wake events:
                    // upon waking from hours of sleep, scheduler wakes within milliseconds!
                    let sleep_duration = match next_due {
                        Some(due_ts) => {
                            let diff = due_ts - Utc::now().timestamp_millis();
                            if diff <= 0 {
                                Duration::from_millis(500)
                            } else {
                                Duration::from_millis((diff as u64).clamp(500, 10_000))
                            }
                        }
                        None => Duration::from_secs(10),
                    };

                    let lock = notifier_scheduler.lock.lock().unwrap();
                    let _ = notifier_scheduler.condvar.wait_timeout(lock, sleep_duration);
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let app = window.app_handle();
                    let close_to_tray = if let Some(db_state) = app.try_state::<Arc<Mutex<DbState>>>() {
                        if let Ok(state) = db_state.lock() {
                            if let Ok(conn) = Connection::open(&state.db_path) {
                                conn.query_row(
                                    "SELECT value FROM settings WHERE key = 'companion_settings'",
                                    [],
                                    |r| r.get::<_, String>(0),
                                )
                                .ok()
                                .and_then(|json_str| {
                                    serde_json::from_str::<serde_json::Value>(&json_str).ok()
                                })
                                .and_then(|val| {
                                    val.get("general")
                                        .and_then(|g| g.get("closeToTray"))
                                        .and_then(|c| c.as_bool())
                                })
                                .unwrap_or(true)
                            } else {
                                true
                            }
                        } else {
                            true
                        }
                    } else {
                        true
                    };

                    if close_to_tray {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_character_files,
            get_reminders,
            load_demo_reminders,
            save_reminder,
            delete_reminder,
            complete_reminder,
            snooze_reminder,
            get_setting,
            save_setting,
            show_reminder_window,
            hide_reminder_window,
            show_main_window,
            set_launch_at_startup,
            get_launch_at_startup
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
