import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Execute a shell command locally and return the result
 * @param {string} command - The command to execute
 * @param {Object} options - Execution options
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function executeCommand(command, options = {}) {
    try {
        console.log(`Executing command: ${command}`);
        const { stdout, stderr } = await execAsync(command, {
            cwd: options.cwd || process.cwd(),
            timeout: options.timeout || 300000, // 5 minutes default timeout
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            ...options
        });
        
        console.log('Command executed successfully');
        if (stderr) {
            console.warn('Command stderr:', stderr);
        }
        
        return { stdout, stderr, success: true };
    } catch (error) {
        console.error('Command execution failed:', error);
        return { 
            stdout: error.stdout || '', 
            stderr: error.stderr || error.message, 
            success: false,
            error: error.message 
        };
    }
}

/**
 * Execute the video generation command using WAN2.1
 * @param {string} imagePath - Path to the uploaded image (optional for t2v)
 * @param {string} prompt - Text prompt for video generation
 * @param {Object} options - Generation options
 * @returns {Promise<Object>}
 */
export async function generateVideo(imagePath, prompt, options = {}) {
    const {
        task = 'i2v-14B', // or 't2v-14B' for text-to-video
        size = '1280*720',
        ckptDir = '/workspace/Wan2.1/Wan2.1-I2V-14B-720P',
        pythonPath = '/workspace/venv/bin/python',
        scriptPath = '/workspace/Wan2.1/generate.py',
        outputDir = '/workspace/outputs',
        sampleSteps = null, // Will use defaults: 40 for i2v, 50 for t2v
        sampleShift = null, // Will use defaults based on task and size
        guideScale = 5.0,
        baseSeed = -1 // -1 for random seed
    } = options;

    // Ensure paths are properly escaped for shell execution
    const escapedPrompt = `"${prompt.replace(/"/g, '\\"')}"`;
    const escapedCkptDir = `"${ckptDir}"`;
    const escapedScriptPath = `"${scriptPath}"`;
    
    // Generate output filename
    const timestamp = Date.now();
    const taskPrefix = task.replace('-', '_');
    const sizeForFilename = size.replace('*', 'x');
    const outputFilename = `${taskPrefix}_${sizeForFilename}_${timestamp}.mp4`;
    const outputPath = `${outputDir}/${outputFilename}`;
    const escapedOutputPath = `"${outputPath}"`;

    // Build command based on task type
    let command = `${pythonPath} ${escapedScriptPath} --task ${task} --size ${size} --ckpt_dir ${escapedCkptDir} --prompt ${escapedPrompt} --save_file ${escapedOutputPath}`;
    
    // Add image parameter for i2v tasks
    if (task.includes('i2v') && imagePath) {
        const escapedImagePath = `"${imagePath}"`;
        command += ` --image ${escapedImagePath}`;
    }
    
    // Add optional parameters
    if (sampleSteps !== null) {
        command += ` --sample_steps ${sampleSteps}`;
    }
    if (sampleShift !== null) {
        command += ` --sample_shift ${sampleShift}`;
    }
    command += ` --sample_guide_scale ${guideScale}`;
    command += ` --base_seed ${baseSeed}`;

    const result = await executeCommand(command, {
        timeout: 600000, // 10 minutes for video generation
        cwd: options.workingDir || '/workspace'
    });

    // Add output file information to the result
    if (result.success) {
        result.outputPath = outputPath;
        result.outputFilename = outputFilename;
    }

    return result;
}

/**
 * Generate text-to-video using WAN2.1
 * @param {string} prompt - Text prompt for video generation
 * @param {Object} options - Generation options
 * @returns {Promise<Object>}
 */
export async function generateTextToVideo(prompt, options = {}) {
    return await generateVideo(null, prompt, {
        ...options,
        task: options.task || 't2v-14B'
    });
}

/**
 * Generate image-to-video using WAN2.1
 * @param {string} imagePath - Path to the uploaded image
 * @param {string} prompt - Text prompt for video generation
 * @param {Object} options - Generation options
 * @returns {Promise<Object>}
 */
export async function generateImageToVideo(imagePath, prompt, options = {}) {
    return await generateVideo(imagePath, prompt, {
        ...options,
        task: options.task || 'i2v-14B'
    });
}

/**
 * Convert video to GIF using ffmpeg
 * @param {string} videoPath - Path to the source video
 * @param {string} gifPath - Path for the output GIF
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>}
 */
export async function convertVideoToGif(videoPath, gifPath, options = {}) {
    const {
        fps = 10,
        scale = 480,
        quality = 'medium'
    } = options;

    // ffmpeg command to convert video to GIF with optimization
    const command = `ffmpeg -i "${videoPath}" -vf "fps=${fps},scale=${scale}:-1:flags=lanczos,palettegen=stats_mode=diff" -y "${gifPath}.palette.png" && ffmpeg -i "${videoPath}" -i "${gifPath}.palette.png" -lavfi "fps=${fps},scale=${scale}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" -y "${gifPath}" && rm "${gifPath}.palette.png"`;

    return await executeCommand(command, {
        timeout: 180000 // 3 minutes for GIF conversion
    });
}

/**
 * Check if required dependencies are available
 * @returns {Promise<Object>}
 */
export async function checkDependencies() {
    const checks = [
        { name: 'Python', command: 'python --version' },
        { name: 'FFmpeg', command: 'ffmpeg -version' }
    ];

    const results = {};
    
    for (const check of checks) {
        const result = await executeCommand(check.command);
        results[check.name] = {
            available: result.success,
            version: result.success ? result.stdout.split('\n')[0] : null,
            error: result.success ? null : result.stderr
        };
    }

    return results;
}

/**
 * Clean up temporary files
 * @param {string[]} filePaths - Array of file paths to remove
 * @returns {Promise<void>}
 */
export async function cleanupFiles(filePaths) {
    for (const filePath of filePaths) {
        try {
            await executeCommand(`rm -f "${filePath}"`);
            console.log(`Cleaned up file: ${filePath}`);
        } catch (error) {
            console.warn(`Failed to cleanup file ${filePath}:`, error.message);
        }
    }
} 