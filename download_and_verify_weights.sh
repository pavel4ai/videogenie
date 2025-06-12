#!/bin/bash

echo "=== Starting model weights download ==="

# Define the target directory (ensure consistency with Dockerfile)
MODEL_NAME="Wan-AI/Wan2.1-I2V-14B-720P"
MAX_RETRIES=5
RETRY_DELAY=10  # seconds
DOWNLOAD_SUCCESS=false # Flag to track success
WEIGHTS_DIR="/workspace/Wan2.1/Wan2.1-I2V-14B-720P"

for ((i=1; i<=MAX_RETRIES; i++)); do
    echo "Attempt $i of $MAX_RETRIES..."
    huggingface-cli download "$MODEL_NAME" --local-dir ${WEIGHTS_DIR} --resume-download
    if [ $? -eq 0 ]; then
        echo "Download completed successfully."
        DOWNLOAD_SUCCESS=true
        break # Exit the loop on success
    else
        echo "Download failed on attempt $i. Retrying in $RETRY_DELAY seconds..."
        sleep $RETRY_DELAY
    fi
done

# Check if download ultimately failed
if [ "$DOWNLOAD_SUCCESS" = false ]; then
    echo "Download failed after $MAX_RETRIES attempts."
    exit 1
fi



echo "=== Handing over execution to CMD: [$@] ==="
# Execute the command passed as arguments (the CMD from Dockerfile)
exec "$@"