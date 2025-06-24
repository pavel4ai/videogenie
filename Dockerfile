# Use NVIDIA PyTorch as the base image
FROM nvcr.io/nvidia/pytorch:25.03-py3

# Set non-interactive mode to prevent prompts
ENV DEBIAN_FRONTEND=noninteractive
# Often helpful for seeing Python logs immediately
ENV PYTHONUNBUFFERED=1

# Update and install system dependencies (combine steps)
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends git ffmpeg wget curl && \
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    # Clean up apt lists
    rm -rf /var/lib/apt/lists/*

# Standardize on /workspace
WORKDIR /workspace

# Clone VideoGenie repository and set up the web application
# Use ARG to force cache invalidation for git clone
ARG CACHEBUST=1
RUN echo "=== Cloning VideoGenie repository (bypassing cache) ===" && \
    # Add timestamp to bypass Docker cache for git clone
    echo "Build timestamp: $(date)" && \
    echo "Cache bust: ${CACHEBUST}" && \
    # Clone the VideoGenie repository (force fresh clone)
    rm -rf /workspace/videogenie && \
    git clone https://github.com/pavel4ai/videogenie.git /workspace/videogenie && \
    # Copy the download script
    cp /workspace/videogenie/download_and_verify_weights.sh /workspace/download_and_verify_weights.sh && \
    # Make the script executable
    chmod +x /workspace/download_and_verify_weights.sh

# Create virtual environment with access to system packages
# Use the python from the base image to create venv
RUN echo "=== Setting up Python virtual environment and installing packages ===" && \
    # Create venv allowing access to system site packages (like the base image's torch)
    python -m venv --system-site-packages /workspace/venv && \
    # Verify torch is accessible from within the new venv
    echo "=== Verifying torch access inside venv ===" && \
    /workspace/venv/bin/python -c "import torch; print(f'Venv Python using torch {torch.__version__} from {torch.__file__}')" && \
    # Install/upgrade pip and wheel first
    /workspace/venv/bin/pip install --no-cache-dir --upgrade pip wheel && \
    # Install flash_attn (ensure compatibility with installed torch and CUDA)
    echo "=== Installing flash_attn ===" && \
    /workspace/venv/bin/pip install --no-cache-dir flash_attn --no-build-isolation && \
    # Clone Wan2.1 repository
    echo "=== Cloning Wan2.1 repository ===" && \
    git clone https://github.com/Wan-Video/Wan2.1.git /workspace/Wan2.1 && \
    # Install requirements from file, filtering torch and flash_attn
    echo "=== Installing requirements from file ===" && \
    grep -vE '^torch|^flash[-_]attn' /workspace/Wan2.1/requirements.txt > /tmp/requirements_filtered.txt && \
    if [ -s /tmp/requirements_filtered.txt ]; then \
        /workspace/venv/bin/pip install --no-cache-dir -r /tmp/requirements_filtered.txt; \
    else \
        echo "No requirements to install from filtered file."; \
    fi && \
    # Install other specific packages (including huggingface_hub[cli])
    echo "=== Installing remaining packages ===" && \
    /workspace/venv/bin/pip install --no-cache-dir "huggingface_hub[cli]" easydict gradio opencv-python-headless && \
    # Clean up temporary file
    rm /tmp/requirements_filtered.txt

# Add venv bin and user's local bin to PATH
# Ensure huggingface-cli installed in the venv is found
ENV PATH="/workspace/venv/bin:/workspace/.local/bin:${PATH}"

# Install VideoGenie Web UI dependencies
RUN echo "=== Installing VideoGenie Web UI dependencies ===" && \
    cd /workspace/videogenie && \
    npm install && \
    # Create necessary directories
    mkdir -p /workspace/uploads /workspace/outputs /workspace/temp

# Configure VideoGenie environment (OVERWRITE REPOSITORY CONFIG)
RUN echo "=== Setting up VideoGenie configuration (OVERWRITING REPOSITORY CONFIGS) ===" && \
    cd /workspace/videogenie && \
    echo "Repository vite.config.js before overwrite:" && \
    cat vite.config.js && \
    echo "" && \
    # FORCE delete any existing config files from repository
    rm -f .env vite.config.js && \
    # Create .env file with Docker container paths
    echo "# VideoGenie Configuration for Docker Container" > .env && \
    echo "CKPT_DIR=/workspace/Wan2.1/Wan2.1-I2V-14B-720P" >> .env && \
    echo "PYTHON_PATH=/workspace/venv/bin/python" >> .env && \
    echo "GENERATE_SCRIPT_PATH=/workspace/Wan2.1/generate.py" >> .env && \
    echo "WORKING_DIR=/workspace" >> .env && \
    echo "UPLOAD_DIR=/workspace/uploads" >> .env && \
    echo "OUTPUT_DIR=/workspace/outputs" >> .env && \
    echo "TEMP_DIR=/workspace/temp" >> .env && \
    echo "DEFAULT_VIDEO_SIZE=1280*720" >> .env && \
    echo "DEFAULT_I2V_TASK=i2v-14B" >> .env && \
    echo "DEFAULT_T2V_TASK=t2v-14B" >> .env && \
    echo "GIF_FPS=10" >> .env && \
    echo "GIF_SCALE=480" >> .env && \
    echo "MAX_FILE_SIZE=10485760" >> .env && \
    echo "ALLOWED_FILE_TYPES=image/jpeg,image/png" >> .env && \
    # OVERWRITE REPOSITORY vite.config.js with CONTAINER-SPECIFIC CONFIG
    echo "// DOCKER CONTAINER CONFIG - OVERWRITES REPOSITORY CONFIG" > vite.config.js && \
    echo "import { sveltekit } from '@sveltejs/kit/vite';" >> vite.config.js && \
    echo "import { defineConfig } from 'vite';" >> vite.config.js && \
    echo "" >> vite.config.js && \
    echo "export default defineConfig({" >> vite.config.js && \
    echo "  plugins: [sveltekit()]," >> vite.config.js && \
    echo "  server: {" >> vite.config.js && \
    echo "    host: '0.0.0.0'," >> vite.config.js && \
    echo "    port: 8080," >> vite.config.js && \
    echo "    strictPort: true," >> vite.config.js && \
    echo "    allowedHosts: 'all'" >> vite.config.js && \
    echo "  }," >> vite.config.js && \
    echo "  preview: {" >> vite.config.js && \
    echo "    host: '0.0.0.0'," >> vite.config.js && \
    echo "    port: 8080," >> vite.config.js && \
    echo "    strictPort: true" >> vite.config.js && \
    echo "  }" >> vite.config.js && \
    echo "});" >> vite.config.js && \
    # Verify the config was created and overwritten
    echo "=== VERIFYING vite.config.js was OVERWRITTEN ===" && \
    ls -la vite.config.js && \
    echo "=== NEW vite.config.js contents ===" && \
    cat vite.config.js

# Expose port 8080 for VideoGenie Web UI
EXPOSE 8080

# Set up non-root user, ensuring ownership of the workspace. DO NOT CHANGE THIS SECTION.
ARG USERNAME="centml"
ARG USER_UID=1024
RUN useradd -u 1024 -m -d /workspace -s /bin/bash ${USERNAME} && \
    chown -R ${USERNAME}:${USERNAME} /workspace && \
    # Ensure the user can write to necessary directories
    mkdir -p /workspace/uploads /workspace/outputs /workspace/temp && \
    chown -R ${USERNAME}:${USERNAME} /workspace/uploads /workspace/outputs /workspace/temp

# Switch to the non-root user DO NOT CHANGE THIS SECTION.
USER 1024

# Set the entrypoint to the download script
ENTRYPOINT ["/workspace/download_and_verify_weights.sh"]

# CMD provides the command FOR THE ENTRYPOINT script to execute after download
# Note: Using custom startup script that bypasses ALL host restrictions
CMD ["sh", "-c", "cd /workspace/videogenie && ./start_videogenie.sh"]


