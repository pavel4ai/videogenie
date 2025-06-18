import { error } from '@sveltejs/kit';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Configuration
const config = {
    outputDir: process.env.OUTPUT_DIR || './outputs',
    allowedExtensions: ['.mp4', '.gif', '.webm', '.mov']
};

export async function GET({ params }) {
    try {
        const { filename } = params;
        
        // Security: Validate filename
        if (!filename || typeof filename !== 'string') {
            throw error(400, 'Invalid filename');
        }

        // Security: Prevent directory traversal attacks
        const sanitizedFilename = path.basename(filename);
        if (sanitizedFilename !== filename) {
            throw error(400, 'Invalid filename format');
        }

        // Security: Check file extension
        const fileExtension = path.extname(sanitizedFilename).toLowerCase();
        if (!config.allowedExtensions.includes(fileExtension)) {
            throw error(400, 'File type not allowed');
        }

        // Construct file path
        const filePath = path.join(config.outputDir, sanitizedFilename);

        // Check if file exists
        if (!existsSync(filePath)) {
            throw error(404, 'File not found');
        }

        // Get file stats
        const fileStat = await stat(filePath);
        
        // Read file
        const fileBuffer = await readFile(filePath);

        // Determine content type based on extension
        const contentTypes = {
            '.mp4': 'video/mp4',
            '.gif': 'image/gif',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime'
        };

        const contentType = contentTypes[fileExtension] || 'application/octet-stream';

        // Return file with appropriate headers
        return new Response(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileStat.size.toString(),
                'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                'Last-Modified': fileStat.mtime.toUTCString()
            }
        });

    } catch (err) {
        console.error('Download error:', err);
        
        // If it's already a SvelteKit error, re-throw it
        if (err.status) {
            throw err;
        }
        
        // Otherwise, return a generic server error
        throw error(500, 'Failed to download file');
    }
} 