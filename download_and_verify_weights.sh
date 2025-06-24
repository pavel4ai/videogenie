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
    host: '0.0.0.0',
    port: 8080,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true
  },
  define: {
    global: 'globalThis'
  }
});
VITE_EOF
    
    # NUCLEAR OPTION: Create a custom startup script that bypasses host checks completely
    echo "=== CREATING CUSTOM STARTUP SCRIPT ==="
    cat > start_videogenie.sh << 'START_EOF'
#!/bin/bash
echo "=== Starting VideoGenie with NO HOST RESTRICTIONS ==="

# Set environment variables to disable host checking
export VITE_HOST="0.0.0.0"
export VITE_PORT="8080"
export VITE_ALLOWED_HOSTS="all"

# Start Vite with maximum permissive settings
cd /workspace/videogenie
exec node node_modules/vite/bin/vite.js dev \
  --host 0.0.0.0 \
  --port 8080 \
  --force \
  --config vite.config.js
START_EOF
    
    chmod +x start_videogenie.sh
    
    echo "=== FINAL vite.config.js contents ==="
    cat vite.config.js
    
else
    echo "Error: VideoGenie package.json not found"
    exit 1
fi

echo "=== Handing over execution to CMD: [$@] ==="
# Execute the command passed as arguments (the CMD from Dockerfile)
exec "$@"