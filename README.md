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
*   🔗 **Backend Communication:** Direct local process execution using Node.js `child_process` module
*   🤖 **Local AI Backend:** Python environment with Wan2.1 model, `ffmpeg`, and necessary dependencies running on the same server

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

3.  **⚙️ Configure Local Environment:**
    *   Copy the example environment file: `cp .env.example .env`
    *   Open the newly created `.env` file in your text editor.
    *   Configure your local WAN2.1 model paths and settings:
        *   `CKPT_DIR`: Path to your WAN2.1 checkpoint directory (e.g., `./Wan2.1-I2V-14B`)
        *   `PYTHON_PATH`: Python executable path (usually `python` or `python3`)
        *   `GENERATE_SCRIPT_PATH`: Path to your generate.py script (e.g., `./generate.py`)
        *   `WORKING_DIR`: Working directory for the AI model execution
        *   Storage paths for uploads and outputs
    *   **Note:** The `.env` file is included in `.gitignore` and will **not** be committed to the repository.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the port specified by Vite).

## 🖥️ Local Backend Setup

Ensure the following are set up on your local server:

*   🐍 Python environment with all dependencies for the Wan2.1 model
*   The `Wan2.1-I2V-14B` checkpoint directory at the path specified in your `.env` file
*   ⚙️ `ffmpeg` installed and accessible in the system PATH
*   A `generate.py` script that accepts arguments as specified in `spec.md`:
    ```shell
    python generate.py --task i2v-14B --size 1280*720 --ckpt_dir ./Wan2.1-I2V-14B --image /path/to/uploaded/image.jpg --prompt "User's text prompt"
    ```
*   🔧 Node.js with permissions to execute shell commands via `child_process`

## 📁 Project Structure

```
.
├── .env                     # Local environment variables (gitignored)
├── .env.example             # Example environment variables
├── uploads/                 # Uploaded images (created automatically)
├── outputs/                 # Generated videos and GIFs (created automatically)
├── temp/                    # Temporary files (created automatically)
├── src/
│   ├── app.html             # Main HTML shell
│   ├── global.css           # Global styles (Purple Haze theme)
│   ├── lib/
│   │   ├── components/      # Reusable Svelte components (to be added)
│   │   └── server/
│   │       └── process_utils.js # Local process execution utilities
│   └── routes/
│       ├── +page.svelte     # Main UI page
│       └── api/
│           ├── generate/
│           │   └── +server.js # API endpoint for video generation
│           └── download/
│               └── [filename]/
│                   └── +server.js # API endpoint for file downloads
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

**Note for Deployment:** Ensure the deployed server has:
- All environment variables from your local `.env` file configured on the deployment platform