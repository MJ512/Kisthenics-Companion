# Asset & Artwork Notice

This document details the licensing, origins, and usage boundaries for visual and audio media included in **Kisthenics Desktop Companion**.

---

## 1. Code vs. Media License Scope

The software source code in this repository is licensed under the [MIT License](LICENSE).

However, visual artwork and audio assets may have separate rights and attribution requirements. The MIT license grants rights to the software code and does not automatically waive third-party copyright, character identity, or trademark protections for included art assets.

---

## 2. Character Artwork (`public/images/` & `public/images/characters-trimmed/`)

The application includes 12 expressive character PNG assets:

1. `Laugh.png` (Laughing emotion)
2. `cool.png` (Cool / Confident)
3. `kadinama irunga.png` (Determined / Hardcore grit)
4. `shock.png` (Shocked / Alert)
5. `angry.png` (Angry / Anti-procrastination)
6. `sleepy.png` (Sleepy / Resting)
7. `thumbsup.png` (Thumbs Up / Encouraging)
8. `thumbsup cool.png` (Cool Approval / Stoked)
9. `heart eye.png` (Loving / Caring)
10. `cry.png` (Crying / Pleading)
11. `question .png` (Curious / Inquiring)
12. `silence.png` (Silent / Focused)

### Licensing Status & Clarification
- **Character Design**: The character illustrations feature an expressive golden mascot adorned with a straw hat (inspired by anime/manga aesthetic elements) and Tamil motivational vernacular (*"Kadinama Irunga"* / *கடினமாக இருங்கள்* — "Work Hard / Stay Strong").
- **Current Usage**: Included in this repository solely as default presentation assets for the desktop reminder companion.
- **Third-Party Rights Notice**: The character art assets are not covered under the unrestricted commercial redistribution permissions of the MIT software license. They are provided for personal, non-commercial use with the Kisthenics Desktop Companion application. If you intend to fork or commercially distribute derivatives, you are advised to substitute your own custom character artwork or obtain separate artist verification.

---

## 3. Application Icons (`src-tauri/icons/` & `public/favicon.*`)

- The desktop application icons (`icon.ico`, `icon.icns`, PNG resolutions) are derived directly from the `kadinama irunga.png` master artwork.
- All derived branding follows the same terms as the character artwork above.

---

## 4. Synthesizer & Audio

- Audible alerts are synthesized programmatically using the browser/WebView **Web Audio API** (`src/utils/audio.ts`). No external copyrighted sound recordings or third-party audio files are bundled. All frequency curves and musical chord synthesis are original software code covered under the MIT License.
