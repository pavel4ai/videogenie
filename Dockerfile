# Use NVIDIA PyTorch as the base image
FROM nvcr.io/nvidia/pytorch:25.03-py3

# Set non-interactive mode to prevent prompts
ENV DEBIAN_FRONTEND=noninteractive
# Often helpful for seeing Python logs immediately
ENV PYTHONUNBUFFERED=1

# Update and install system dependencies (combine steps)
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends git ffmpeg wget && \
    # Clean up apt lists
    rm -rf /var/lib/apt/lists/*

# Standardize on /workspace
WORKDIR /workspace

# Clone the correct repository and copy only the required script
RUN echo "=== Copying download_and_verify_weights.sh script ===" && \
    # Clone the specific repository into a temporary directory
    git clone https://github.com/pavel4ai/videogenie.git /tmp/temp-repo && \
    # Copy the required script to the workspace
    cp /tmp/temp-repo/download_and_verify_weights.sh /workspace/download_and_verify_weights.sh && \
    # Remove the temporary clone
    rm -rf /tmp/temp-repo && \
    # Make the specific script executable
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

# Modify Gradio script to use port 8080 (Use correct path)
RUN echo "=== Modifying Gradio script port ===" && \
     sed -i 's/server_port=7860/server_port=8080/' /workspace/Wan2.1/gradio/t2v_14B_singleGPU.py

# Expose the correct port
EXPOSE 8080

# Set up non-root user, ensuring ownership of the workspace. DO NOT CHANGE THIS SECTION.
ARG USERNAME="centml"
ARG USER_UID=1024
RUN useradd -u 1024 -m -d /workspace -s /bin/bash ${USERNAME} && \
    chown -R ${USERNAME}:${USERNAME} /workspace

# Switch to the non-root user DO NOT CHANGE THIS SECTION.
USER 1024

# Set the entrypoint to the download script
ENTRYPOINT ["/workspace/download_and_verify_weights.sh"]

# CMD provides the command FOR THE ENTRYPOINT script to execute after download
CMD ["/workspace/venv/bin/python", "/workspace/Wan2.1/gradio/i2v_14B_singleGPU.py", "--ckpt_dir_720p", "/workspace/Wan2.1/Wan2.1-I2V-14B-720P"]


