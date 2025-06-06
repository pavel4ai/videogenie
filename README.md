# 🔮 VideoGenie ✨

VideoGenie is a web-based application that allows users to upload an image and provide a text prompt to generate a video and an animated GIF. The generation process utilizes a remotely hosted generative AI model (Wan2.1) running on a GPU-accelerated server.

## 📝 Project Specifications

This project is built based on the requirements outlined in `spec.md`.

## 🌟 Features

*   🖼️ **Image Upload:** Supports JPEG and PNG formats.
*   ✍️ **Text Prompt Input:** Allows users to describe the desired video content.
*   🎬 **Video Generation:** Creates an MP4 video using a remote AI model.
*   🎞️ **GIF Generation:** Creates an animated GIF from the generated video using `ffmpeg`.
*   💾 **Download Options:** Provides download links for both the video and GIF.
*   📱💻 **Responsive UI:** Designed with SvelteKit for a modern web experience, following the "Purple Haze" aesthetic.

## 🛠️ Tech Stack

*   🚀 **Frontend:** SvelteKit
*   🎨 **Styling:** CSS with "Purple Haze" design system (dark theme with purple accents)
*   🔒 **Backend Communication:** SSH for interacting with the remote GPU server (credentials managed via `.env` file).
*   🤖 **Remote GPU Server:** (Assumed) Python environment with Wan2.1 model, `ffmpeg`, and necessary dependencies, accessible via SSH.

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/pavel4ai/videogenie.git
    cd videogenie
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **🔑 Configure SSH (Important!):**
    *   Copy the example environment file: `cp .env.example .env`
    *   Open the newly created `.env` file in your text editor.
    *   Fill in your remote GPU server's SSH connection details:
        *   `PRIVATE_SSH_HOST`: Your server's hostname or IP address.
        *   `PRIVATE_SSH_PORT`: The SSH port (usually `22`).
        *   `PRIVATE_SSH_USERNAME`: Your username for the SSH connection.
        *   Authentication Method (choose one):
            *   `PRIVATE_SSH_PASSWORD`: Your SSH password (less secure).
            *   `PRIVATE_SSH_PRIVATE_KEY_PATH`: The absolute path to your SSH private key file (recommended). E.g., `/home/user/.ssh/id_rsa` or `C:\Users\YourUser\.ssh\id_rsa`.
            *   `PRIVATE_SSH_PASSPHRASE`: If your private key is protected by a passphrase, enter it here.
    *   **Note:** The `.env` file is included in `.gitignore` and will **not** be committed to the repository, keeping your credentials secure.
    *   Ensure your local machine has SSH key-based access to the remote server if using a private key, or that password authentication is enabled on the server if using a password.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the port specified by Vite).

## 🖥️ Backend Setup (Remote GPU Server)

Ensure the following are set up on your remote GPU server:

*   🐍 Python environment with all dependencies for the Wan2.1 model.
*   The `Wan2.1-I2V-14B` checkpoint directory (`ckpt_dir`).
*   ⚙️ `ffmpeg` installed and accessible in the system PATH.
*   A `generate.py` script (or similar) that accepts arguments as specified in `spec.md`:
    ```shell
    python generate.py --task i2v-14B --size 1280*720 --ckpt_dir ./Wan2.1-I2V-14B --image /path/to/uploaded/image.jpg --prompt "User's text prompt"
    ```

## 📁 Project Structure

```
.
├── .env                   # Local environment variables (gitignored)
├── .env.example           # Example environment variables
├── src/
│   ├── app.html             # Main HTML shell
│   ├── global.css           # Global styles (Purple Haze theme)
│   ├── lib/
│   │   ├── components/      # Reusable Svelte components (to be added)
│   │   └── server/
│   │       └── ssh_utils.js # SSH connection and command utilities (uses .env)
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

## 🌐 Deployment

This SvelteKit application can be deployed to various platforms that support Node.js applications (e.g., Vercel, Netlify, or your own server).

1.  **Build the application:** 📦
    ```bash
    npm run build
    ```
2.  Follow the deployment guide for your chosen platform using the generated `build` directory.

**Note for Remote Deployment:** Ensure the deployed backend (SvelteKit server-side functions) can securely communicate with your GPU inference server. This will involve setting up the same environment variables (e.g., `PRIVATE_SSH_HOST`, `PRIVATE_SSH_USERNAME`, etc.) on your deployment platform that you used in your local `.env` file.