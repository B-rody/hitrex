# Local AI Video Studio

A local, free, open-source video recording and editing software for creators.

## Prerequisites

- **Node.js**: Version 18 or higher is recommended.
- **FFmpeg**: The project uses `ffmpeg-static`, so no manual installation is required, but having FFmpeg installed system-wide can be useful for debugging.

## Getting Started

1.  **Install Dependencies**

    ```bash
    npm install
    ```

2.  **Run Locally (Development Mode)**

    This starts the Vite dev server and launches the Electron app.

    ```bash
    npm run dev
    ```

3.  **Build for Production**

    This compiles the TypeScript code, builds the React app, and packages the Electron application into an executable (e.g., `.exe` on Windows, `.dmg` on macOS).

    ```bash
    npm run build
    ```

    The output executable will be located in the `dist` or `release` directory (depending on configuration).

## Project Structure

-   `electron/`: Main process and preload scripts.
-   `src/`: Renderer process (React app).
    -   `features/recorder/`: Recording logic and UI.
    -   `features/editor/`: Timeline editor and preview player.
    -   `features/settings/`: Settings modal.
    -   `store/`: Zustand state management.

## Key Features

-   **Dual-Stream Recording**: Records screen and camera as separate files.
-   **Smart Zoom**: Uses mouse metadata to zoom in on the cursor.
-   **Timeline Editor**: Non-destructive editing with layout keyframes.
-   **Local AI**: Integration ready for local Whisper models (or OpenAI).
