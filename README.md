# 🔮 VideoGenie ✨

VideoGenie is a web-based application that allows users to generate videos and animated GIFs using the powerful WAN2.1 model. It supports two generation modes:
- **🖼️ Image-to-Video (I2V)**: Upload an image and provide a text prompt to generate a video
- **✍️ Text-to-Video (T2V)**: Provide only a text prompt to generate a video from scratch

The generation process utilizes the WAN2.1 model running in a GPU-accelerated Docker container environment.

## 📝 Project Specifications

This project is built based on the requirements outlined in `spec.md`.

## 🌟 Features

*   🖼️ **Image-to-Video (I2V):** Upload an image and add a text prompt to generate a video
*   ✍️ **Text-to-Video (T2V):** Generate videos from text prompts alone
*   🎬 **WAN2.1 Integration:** Uses the latest WAN2.1 model for high-quality video generation
*   🎞️ **Automatic GIF Generation:** Creates optimized animated GIFs from generated videos using `ffmpeg`
*   💾 **Secure Downloads:** Provides secure download links for both videos (MP4) and GIFs
*   📱💻 **Responsive UI:** Modern web interface built with SvelteKit, featuring the "Purple Haze" aesthetic
*   🐳 **Docker Ready:** Designed to run in GPU-accelerated Docker containers
*   🔒 **File Validation:** Supports JPEG and PNG formats with configurable size limits

## 🛠️ Tech Stack

*   🚀 **Frontend:** SvelteKit
*   🎨 **Styling:** CSS with "Purple Haze" design system (dark theme with purple accents)
*   🔗 **Backend Communication:** Node.js `child_process` for local command execution
*   🤖 **AI Backend:** WAN2.1-I2V-14B-720P model running in Docker container
*   🐳 **Container:** NVIDIA PyTorch Docker image with GPU acceleration
*   🎥 **Video Processing:** FFmpeg for GIF conversion and optimization
*   🔧 **Process Management:** Custom utilities for WAN2.1 command-line integration

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

3.  **⚙️ Configure Docker Environment:**
    *   Create your environment file: `cp .env.example .env`
    *   Configure the `.env` file with Docker container paths:
        ```bash
        # WAN2.1 Model Configuration (Docker Paths)
        CKPT_DIR=/workspace/Wan2.1/Wan2.1-I2V-14B-720P
        PYTHON_PATH=/workspace/venv/bin/python
        GENERATE_SCRIPT_PATH=/workspace/Wan2.1/generate.py
        WORKING_DIR=/workspace
        
        # File Storage Paths
        UPLOAD_DIR=/workspace/uploads
        OUTPUT_DIR=/workspace/outputs
        TEMP_DIR=/workspace/temp
        
        # Generation Settings
        DEFAULT_VIDEO_SIZE=1280*720
        DEFAULT_I2V_TASK=i2v-14B
        DEFAULT_T2V_TASK=t2v-14B
        ```
    *   **Note:** The `.env` file is included in `.gitignore` and will **not** be committed to the repository.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the port specified by Vite).

## 🐳 Docker Container Setup

VideoGenie is designed to run in a GPU-accelerated Docker container. The included `Dockerfile` sets up:

*   🐍 **Python Environment:** NVIDIA PyTorch base image with WAN2.1 dependencies
*   🤖 **WAN2.1 Model:** Automatically downloads `Wan2.1-I2V-14B-720P` checkpoint
*   ⚙️ **FFmpeg:** Pre-installed for video and GIF processing
*   🔧 **Script Integration:** Uses the official WAN2.1 `generate.py` script

### **Supported WAN2.1 Commands:**

**Image-to-Video (I2V):**
```bash
python generate.py --task i2v-14B --size 1280*720 \
  --ckpt_dir /workspace/Wan2.1/Wan2.1-I2V-14B-720P \
  --image /path/to/image.jpg --prompt "Your prompt here" \
  --save_file /workspace/outputs/video.mp4
```

**Text-to-Video (T2V):**
```bash
python generate.py --task t2v-14B --size 1280*720 \
  --ckpt_dir /workspace/Wan2.1/Wan2.1-I2V-14B-720P \
  --prompt "Your prompt here" \
  --save_file /workspace/outputs/video.mp4
```

## 🚀 API Usage

### **Image-to-Video Generation:**
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('prompt', 'A cat playing in the garden');
formData.append('type', 'i2v');

const response = await fetch('/api/generate', {
  method: 'POST',
  body: formData
});
```

### **Text-to-Video Generation:**
```javascript
const formData = new FormData();
formData.append('prompt', 'A beautiful sunset over the ocean');
formData.append('type', 't2v');

const response = await fetch('/api/generate', {
  method: 'POST',
  body: formData
});
```

### **API Response:**
```json
{
  "success": true,
  "message": "I2V generation completed successfully",
  "generationType": "i2v",
  "files": {
    "video": {
      "filename": "i2v_14B_1280x720_1703123456789.mp4",
      "downloadUrl": "/api/download/i2v_14B_1280x720_1703123456789.mp4"
    },
    "gif": {
      "filename": "i2v_14B_1280x720_1703123456789.gif",
      "downloadUrl": "/api/download/i2v_14B_1280x720_1703123456789.gif"
    }
  }
}
```

## 📁 Project Structure

```
videogenie/
├── .env                     # Environment variables (gitignored)
├── .env.example             # Example environment configuration
├── Dockerfile               # Docker container configuration
├── download_and_verify_weights.sh # WAN2.1 model download script
├── uploads/                 # Uploaded images (auto-created in container)
├── outputs/                 # Generated videos and GIFs (auto-created in container)
├── temp/                    # Temporary files (auto-created in container)
├── src/
│   ├── app.html             # Main HTML shell
│   ├── global.css           # Global styles (Purple Haze theme)
│   ├── lib/
│   │   ├── components/      # Reusable Svelte components
│   │   └── server/
│   │       └── process_utils.js # WAN2.1 command-line integration
│   └── routes/
│       ├── +page.svelte     # Main UI page
│       └── api/
│           ├── generate/
│           │   └── +server.js # T2V/I2V generation endpoint
│           └── download/
│               └── [filename]/
│                   └── +server.js # Secure file download endpoint
├── static/                  # Static assets
│   └── favicon.png
├── .gitignore
├── package.json
├── README.md                # This file
├── svelte.config.js
├── vite.config.js
└── spec.md                  # Project requirements and specifications
```

## 🔍 Health Check

Test your setup with the health check endpoint:

**GET** `/api/generate`
```json
{
  "status": "healthy",
  "dependencies": {
    "Python": {
      "available": true,
      "version": "Python 3.x.x"
    },
    "FFmpeg": {
      "available": true,
      "version": "ffmpeg version x.x.x"
    }
  },
  "config": {
    "ckptDir": "/workspace/Wan2.1/Wan2.1-I2V-14B-720P",
    "workingDir": "/workspace",
    "pythonPath": "/workspace/venv/bin/python",
    "generateScriptPath": "/workspace/Wan2.1/generate.py"
  }
}
```

## 🌐 Deployment

VideoGenie is designed for deployment in GPU-accelerated container environments.

### **🐳 Docker Deployment:**

1. **Build the Docker container:**
   ```bash
   docker build -t videogenie .
   ```

2. **Run with GPU support:**
   ```bash
   docker run --gpus all -p 8080:8080 -p 5173:5173 \
     -v $(pwd)/.env:/workspace/.env \
     videogenie
   ```

3. **Access the application:**
   - **Gradio Interface:** `http://localhost:8080` (original WAN2.1 interface)
   - **VideoGenie Web UI:** `http://localhost:5173` (enhanced interface)

### **☁️ Cloud Deployment:**

**Requirements for cloud deployment:**
- ✅ GPU-enabled container service (AWS ECS with GPU, Google Cloud Run on GKE, Azure Container Instances)
- ✅ Persistent storage for model checkpoints and outputs
- ✅ Sufficient memory (16GB+ recommended for WAN2.1-14B)
- ✅ Environment variables configured:
  ```bash
  CKPT_DIR=/workspace/Wan2.1/Wan2.1-I2V-14B-720P
  PYTHON_PATH=/workspace/venv/bin/python
  GENERATE_SCRIPT_PATH=/workspace/Wan2.1/generate.py
  WORKING_DIR=/workspace
  OUTPUT_DIR=/workspace/outputs
  ```

### **🔧 Production Considerations:**

- **Model Loading:** The WAN2.1 model checkpoint (~28GB) is downloaded automatically on first run
- **Storage:** Configure persistent volumes for `/workspace/outputs` to preserve generated files
- **Scaling:** Each container instance requires dedicated GPU resources
- **Monitoring:** Use the health check endpoint `/api/generate` (GET) for container health monitoring
- **Security:** Implement proper authentication and rate limiting for production use

## ✨ VideoGenie vs. Gradio Interface

VideoGenie provides an enhanced web interface compared to the default Gradio interface:

| Feature | Gradio Interface | VideoGenie Web UI |
|---------|------------------|-------------------|
| **Design** | Basic Gradio components | Modern "Purple Haze" themed UI |
| **Generation Types** | Manual task selection | Smart I2V/T2V detection |
| **File Management** | Basic upload/download | Secure file handling with validation |
| **API Integration** | Web interface only | RESTful API + Web interface |
| **Download Options** | Direct file access | Secure download links for MP4 + GIF |
| **Error Handling** | Basic error display | Comprehensive error handling and logging |
| **Mobile Support** | Limited responsiveness | Fully responsive design |
| **Customization** | Limited theming | Fully customizable SvelteKit interface |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **WAN2.1 Team** for the incredible video generation model
- **SvelteKit** for the modern web framework
- **NVIDIA** for GPU acceleration support