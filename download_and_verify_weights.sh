#!/bin/bash

echo "=== Starting model weights download ==="

# Define the target directory (ensure consistency with Dockerfile)
MODEL_NAME="Wan-AI/Wan2.1-I2V-14B-720P"
MAX_RETRIES=5
RETRY_DELAY=10  # seconds
DOWNLOAD_SUCCESS=false # Flag to track success
WEIGHTS_DIR="/workspace/Wan2.1/Wan2.1-I2V-14B-720P"

huggingface-cli download "$MODEL_NAME" --local-dir ${WEIGHTS_DIR} --resume-download

#for ((i=1; i<=MAX_RETRIES; i++)); do
#    echo "Attempt $i of $MAX_RETRIES..."
#    huggingface-cli download "$MODEL_NAME" --local-dir ${WEIGHTS_DIR} --resume-download
#    if [ $? -eq 0 ]; then
#        echo "Download completed successfully."
#        DOWNLOAD_SUCCESS=true
#        break # Exit the loop on success
#    else
#        echo "Download failed on attempt $i. Retrying in $RETRY_DELAY seconds..."
#        sleep $RETRY_DELAY
#    fi
#done

# Check if download ultimately failed
#if [ "$DOWNLOAD_SUCCESS" = false ]; then
#    echo "Download failed after $MAX_RETRIES attempts."
#    exit 1
#fi



echo "=== Setting up VideoGenie directories ==="
# Ensure output directories exist and have proper permissions
mkdir -p /workspace/uploads /workspace/outputs /workspace/temp
chmod 755 /workspace/uploads /workspace/outputs /workspace/temp

echo "=== Verifying VideoGenie setup ==="
cd /workspace/videogenie
if [ -f "package.json" ]; then
    echo "VideoGenie package.json found"
    if [ -f ".env" ]; then
        echo "VideoGenie .env configuration found"
    else
        echo "Warning: .env configuration not found"
    fi
    
    # FORCE RECREATE vite.config.js at runtime to ensure it's correct
    echo "=== FORCE RECREATING vite.config.js at runtime ==="
    rm -f vite.config.js
    cat > vite.config.js << 'VITE_EOF'
// RUNTIME GENERATED CONFIG - ALLOWS ALL HOSTS
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: true,
    port: 8080,
    strictPort: true,
    allowedHosts: 'all',
    disableHostCheck: true,
    hmr: { host: 'localhost', port: 8080 },
    cors: true
  },
  preview: {
    host: true,
    port: 8080,
    strictPort: true
  }
});
VITE_EOF
    
    echo "=== FINAL vite.config.js contents ==="
    cat vite.config.js
    
else
    echo "Error: VideoGenie package.json not found"
    exit 1
fi

echo "=== Handing over execution to CMD: [$@] ==="
# Execute the command passed as arguments (the CMD from Dockerfile)
exec "$@"