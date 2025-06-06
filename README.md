# VideoGenie

VideoGenie is a web-based application that allows users to upload an image and provide a text prompt to generate a video and an animated GIF. The generation process utilizes a remotely hosted generative AI model (Wan2.1) running on a GPU-accelerated server.

## Project Specifications

This project is built based on the requirements outlined in `spec.md`.

## Features

*   **Image Upload:** Supports JPEG and PNG formats.
*   **Text Prompt Input:** Allows users to describe the desired video content.
*   **Video Generation:** Creates an MP4 video using a remote AI model.
*   **GIF Generation:** Creates an animated GIF from the generated video using `ffmpeg`.
*   **Download Options:** Provides download links for both the video and GIF.
*   **Responsive UI:** Designed with SvelteKit for a modern web experience, following the "Purple Haze" aesthetic.

## Tech Stack

*   **Frontend:** SvelteKit
*   **Styling:** CSS with "Purple Haze" design system (dark theme with purple accents)
*   **Backend Communication:** SSH for interacting with the remote GPU server.
*   **Remote GPU Server:** (Assumed) Python environment with Wan2.1 model, `ffmpeg`, and necessary dependencies, accessible via SSH.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/pavel4ai/videogenie.git
    cd videogenie
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure SSH (Important!):**
    *   Update the SSH connection details in `src/lib/server/ssh_utils.js` and/or `src/routes/api/generate/+server.js` to point to your remote GPU server.
    *   Ensure your local machine has SSH key-based access to the remote server, or configure password authentication if necessary (though key-based is recommended).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the port specified by Vite).

## Backend Setup (Remote GPU Server)

Ensure the following are set up on your remote GPU server:

*   Python environment with all dependencies for the Wan2.1 model.
*   The `Wan2.1-I2V-14B` checkpoint directory (`ckpt_dir`).
*   `ffmpeg` installed and accessible in the system PATH.
*   A `generate.py` script (or similar) that accepts arguments as specified in `spec.md`:
    ```shell
    python generate.py --task i2v-14B --size 1280*720 --ckpt_dir ./Wan2.1-I2V-14B --image /path/to/uploaded/image.jpg --prompt "User's text prompt"
    ```

## Project Structure

```
.
├── src/
│   ├── app.html             # Main HTML shell
│   ├── global.css           # Global styles (Purple Haze theme)
│   ├── lib/
│   │   ├── components/      # Reusable Svelte components (to be added)
│   │   └── server/
│   │       └── ssh_utils.js # SSH connection and command utilities
│   └── routes/
│       ├── +page.svelte     # Main UI page
│       └── api/
│           └── generate/
│               └── +server.js # API endpoint for video generation
├── static/                  # Static assets (e.g., favicon, placeholder images)
│   └── favicon.png
├── .gitignore
├── package.json
├── README.md                # This file
├── svelte.config.js
├── vite.config.js
└── spec.md                  # Project requirements and specifications
```

## Deployment

This SvelteKit application can be deployed to various platforms that support Node.js applications (e.g., Vercel, Netlify, or your own server).

1.  Build the application:
    ```bash
    npm run build
    ```
2.  Follow the deployment guide for your chosen platform using the generated `build` directory.

**Note for Remote Deployment:** Ensure the deployed backend (SvelteKit server-side functions) can securely communicate with your GPU inference server. This might involve setting up environment variables for SSH credentials and ensuring network accessibility.