import { json } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { generateVideo, generateTextToVideo, generateImageToVideo, convertVideoToGif, cleanupFiles, checkDependencies } from '$lib/server/process_utils.js';

// Configuration from environment variables (Docker container paths)
const config = {
    ckptDir: process.env.CKPT_DIR || '/workspace/Wan2.1/Wan2.1-I2V-14B-720P',
    pythonPath: process.env.PYTHON_PATH || '/workspace/venv/bin/python',
    generateScriptPath: process.env.GENERATE_SCRIPT_PATH || '/workspace/Wan2.1/generate.py',
    workingDir: process.env.WORKING_DIR || '/workspace',
    uploadDir: process.env.UPLOAD_DIR || '/workspace/uploads',
    outputDir: process.env.OUTPUT_DIR || '/workspace/outputs',
    tempDir: process.env.TEMP_DIR || '/workspace/temp',
    defaultVideoSize: process.env.DEFAULT_VIDEO_SIZE || '1280*720',
    defaultI2vTask: process.env.DEFAULT_I2V_TASK || 'i2v-14B',
    defaultT2vTask: process.env.DEFAULT_T2V_TASK || 't2v-14B',
    gifFps: parseInt(process.env.GIF_FPS || '10'),
    gifScale: parseInt(process.env.GIF_SCALE || '480'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png').split(',')
};

// Ensure required directories exist
async function ensureDirectories() {
    const dirs = [config.uploadDir, config.outputDir, config.tempDir];
    for (const dir of dirs) {
        try {
            await mkdir(dir, { recursive: true });
        } catch (error) {
            console.warn(`Could not create directory ${dir}:`, error.message);
        }
    }
}

export async function POST({ request }) {
    try {
        // Ensure directories exist
        await ensureDirectories();

        // Parse the form data
        const formData = await request.formData();
        const imageFile = formData.get('image');
        const prompt = formData.get('prompt');
        const generationType = formData.get('type') || 'i2v'; // 'i2v' or 't2v'

        // Validation
        if (!prompt || prompt.trim().length === 0) {
            return json({ error: 'No prompt provided' }, { status: 400 });
        }

        // For i2v (image-to-video), require an image
        if (generationType === 'i2v') {
            if (!imageFile || imageFile.size === 0) {
                return json({ error: 'No image file provided for image-to-video generation' }, { status: 400 });
            }

            if (imageFile.size > config.maxFileSize) {
                return json({ error: `File size too large. Maximum size is ${config.maxFileSize / 1024 / 1024}MB` }, { status: 400 });
            }

            if (!config.allowedFileTypes.includes(imageFile.type)) {
                return json({ error: `Invalid file type. Allowed types: ${config.allowedFileTypes.join(', ')}` }, { status: 400 });
            }
        }

        // For t2v (text-to-video), image is optional
        if (generationType === 't2v' && imageFile && imageFile.size > 0) {
            console.log('Image provided for t2v generation - will be ignored');
        }

        // Check dependencies
        const deps = await checkDependencies();
        if (!deps.Python.available) {
            return json({ error: 'Python is not available on the system' }, { status: 500 });
        }
        if (!deps.FFmpeg.available) {
            return json({ error: 'FFmpeg is not available on the system' }, { status: 500 });
        }

        // Generate unique filenames
        const timestamp = Date.now();
        let imagePath = null;
        let imageFilename = null;
        
        // Save uploaded image if provided (for i2v)
        if (imageFile && imageFile.size > 0) {
            const imageExtension = imageFile.name.split('.').pop();
            imageFilename = `image_${timestamp}.${imageExtension}`;
            imagePath = path.join(config.uploadDir, imageFilename);
            
            const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
            await writeFile(imagePath, imageBuffer);
            console.log(`Image saved: ${imagePath}`);
        }

        console.log(`Starting ${generationType.toUpperCase()} generation with prompt: "${prompt}"`);

        // Generate video using the appropriate method
        let videoResult;
        const generationOptions = {
            size: config.defaultVideoSize,
            ckptDir: config.ckptDir,
            pythonPath: config.pythonPath,
            scriptPath: config.generateScriptPath,
            workingDir: config.workingDir,
            outputDir: config.outputDir
        };

        if (generationType === 't2v') {
            videoResult = await generateTextToVideo(prompt, {
                ...generationOptions,
                task: config.defaultT2vTask
            });
        } else {
            videoResult = await generateImageToVideo(imagePath, prompt, {
                ...generationOptions,
                task: config.defaultI2vTask
            });
        }

        if (!videoResult.success) {
            console.error('Video generation failed:', videoResult.stderr);
            // Clean up uploaded image if exists
            if (imagePath) {
                await cleanupFiles([imagePath]);
            }
            return json({ 
                error: 'Video generation failed', 
                details: videoResult.stderr || videoResult.error 
            }, { status: 500 });
        }

        // Check if video file was created (WAN2.1 generates the output file automatically)
        const videoPath = videoResult.outputPath;
        const videoFilename = videoResult.outputFilename;
        
        if (!existsSync(videoPath)) {
            console.error('Video file was not created at expected path:', videoPath);
            if (imagePath) {
                await cleanupFiles([imagePath]);
            }
            return json({ 
                error: 'Video file was not generated at expected location',
                details: `Expected: ${videoPath}`
            }, { status: 500 });
        }

        console.log(`Video generated successfully: ${videoPath}`);
        console.log('Starting GIF conversion...');

        // Generate GIF filename and path
        const gifFilename = videoFilename.replace('.mp4', '.gif');
        const gifPath = path.join(config.outputDir, gifFilename);

        // Convert video to GIF
        const gifResult = await convertVideoToGif(videoPath, gifPath, {
            fps: config.gifFps,
            scale: config.gifScale
        });

        if (!gifResult.success) {
            console.error('GIF conversion failed:', gifResult.stderr);
            // Don't fail the entire request if GIF conversion fails
            console.warn('Continuing without GIF - video generation was successful');
        }

        // Clean up uploaded image if exists
        if (imagePath) {
            await cleanupFiles([imagePath]);
        }

        const response = {
            success: true,
            message: `${generationType.toUpperCase()} generation completed successfully`,
            generationType: generationType,
            files: {
                video: {
                    filename: videoFilename,
                    path: videoPath,
                    downloadUrl: `/api/download/${videoFilename}`
                }
            }
        };

        // Add GIF info if conversion was successful
        if (gifResult.success && existsSync(gifPath)) {
            response.files.gif = {
                filename: gifFilename,
                path: gifPath,
                downloadUrl: `/api/download/${gifFilename}`
            };
            console.log(`GIF generated successfully: ${gifPath}`);
        }

        return json(response);

    } catch (error) {
        console.error('Unexpected error in video generation:', error);
        return json({ 
            error: 'An unexpected error occurred', 
            details: error.message 
        }, { status: 500 });
    }
}

// Health check endpoint
export async function GET() {
    try {
        const deps = await checkDependencies();
        
        return json({
            status: 'healthy',
            dependencies: deps,
            config: {
                ckptDir: config.ckptDir,
                workingDir: config.workingDir,
                pythonPath: config.pythonPath,
                generateScriptPath: config.generateScriptPath
            }
        });
    } catch (error) {
        return json({ 
            status: 'error', 
            error: error.message 
        }, { status: 500 });
    }
}
