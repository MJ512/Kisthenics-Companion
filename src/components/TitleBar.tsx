import React from 'react';
import { isTauriEnvironment } from '../services/storage';

export const TitleBar: React.FC = () => {
  const handleMouseDown = async (e: React.MouseEvent) => {
    // Only drag with primary mouse button and not on interactive controls
    if (e.button === 0 && isTauriEnvironment()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const appWindow = getCurrentWindow();
        await appWindow.startDragging();
      } catch (err) {
        // Fallback for non-tauri or permission error
      }
    }
  };

  return (
    <div
      data-tauri-drag-region
      onMouseDown={handleMouseDown}
      className="flex items-center justify-between w-full select-none shrink-0"
      style={{
        height: '32px',
        background: 'var(--color-surface-elevated)',
        borderBottom: '1px solid var(--color-divider)',
        paddingLeft: '78px', // Reserves space for macOS traffic light buttons (close, minimize, zoom)
        paddingRight: '16px',
        WebkitAppRegion: 'drag',
        cursor: 'default',
      } as React.CSSProperties}
    >
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 pointer-events-none select-none"
      >
        <span
          data-tauri-drag-region
          style={{
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--color-text-secondary)',
          }}
        >
          Kisthenics Desktop Companion
        </span>
      </div>
    </div>
  );
};
