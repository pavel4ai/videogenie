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
    
    # VERIFY REPOSITORY CONFIG (no more runtime overwriting needed)
    echo "=== VERIFYING REPOSITORY CONFIG ==="
    echo "Current working directory: $(pwd)"
    echo ""
    
    if [ -f "vite.config.js" ]; then
        echo "✅ Repository vite.config.js found with container-compatible config:"
        cat vite.config.js
        echo ""
        echo "✅ Config should now include allowedHosts: 'all' to fix host blocking"
    else
        echo "❌ ERROR: vite.config.js not found in repository!"
        exit 1
    fi
    echo ""
    
    # DIAGNOSTIC SCRIPT: Let's understand what's happening
    echo "=== CREATING DIAGNOSTIC STARTUP SCRIPT ==="
    cat > start_videogenie.sh << 'START_EOF'
#!/bin/bash
echo "=== COMPREHENSIVE VITE DIAGNOSTICS ==="

cd /workspace/videogenie

echo "=== 1. CHECKING ALL CONFIG FILES ==="
find . -name "vite.config.*" -type f
find . -name "svelte.config.*" -type f
echo ""

echo "=== 2. CURRENT WORKING DIRECTORY ==="
pwd
ls -la
echo ""

echo "=== 3. VITE CONFIG CONTENT ==="
if [ -f "vite.config.js" ]; then
    echo "✅ vite.config.js found:"
    cat vite.config.js
else
    echo "❌ vite.config.js NOT found"
fi
echo ""

echo "=== 4. SVELTE CONFIG CONTENT ==="
if [ -f "svelte.config.js" ]; then
    echo "✅ svelte.config.js found:"
    cat svelte.config.js
else
    echo "❌ svelte.config.js NOT found"
fi
echo ""

echo "=== 5. PACKAGE.JSON SCRIPTS ==="
if [ -f "package.json" ]; then
    echo "Scripts section:"
    cat package.json | grep -A 10 '"scripts"'
else
    echo "❌ package.json NOT found"
fi
echo ""

echo "=== 6. ENVIRONMENT VARIABLES ==="
env | grep -i vite || echo "No VITE env vars found"
echo ""

echo "=== 7. NODE MODULES VITE ==="
ls -la node_modules/.bin/vite
echo "Vite version:"
node node_modules/vite/bin/vite.js --version
echo ""

echo "=== 8. TESTING VITE CONFIG LOADING ==="
echo "Testing config file loading..."
node -e "
try {
  const { loadConfigFromFile } = require('vite');
  loadConfigFromFile({ command: 'serve', mode: 'development' }, './vite.config.js').then(result => {
    console.log('Config loaded successfully:', JSON.stringify(result.config.server, null, 2));
  }).catch(err => {
    console.log('Config loading failed:', err.message);
  });
} catch(e) {
  console.log('Error loading vite:', e.message);
}
"
echo ""

echo "=== 9. STARTING VITE WITH DEBUG LOGGING ==="
export DEBUG="vite:*"
export VITE_HOST="0.0.0.0"
export VITE_PORT="8080"

echo "Starting with command: npm run dev"
npm run dev
START_EOF
    
    chmod +x start_videogenie.sh
    
    echo "=== RUNTIME CONFIGURATION SUMMARY ==="
    echo "✅ Repository vite.config.js (no runtime overwrite needed):"
    cat vite.config.js
    echo ""
    
    echo "✅ Container .env configuration:"
    cat .env
    echo ""
    
    echo "✅ All configuration files in directory:"
    find . -maxdepth 1 -name "*.config.*" -type f | head -10
    
else
    echo "Error: VideoGenie package.json not found"
    exit 1
fi

echo "=== Handing over execution to CMD: [$@] ==="
# Execute the command passed as arguments (the CMD from Dockerfile)
exec "$@"