// src/lib/server/ssh_utils.js
import { Client } from 'ssh2';
import fs from 'fs';
import {
    PRIVATE_SSH_HOST,
    PRIVATE_SSH_PORT,
    PRIVATE_SSH_USERNAME,
    PRIVATE_SSH_PASSWORD,
    PRIVATE_SSH_PRIVATE_KEY_PATH,
    PRIVATE_SSH_PASSPHRASE
} from '$env/static/private';

/**
 * Constructs the SSH configuration object from environment variables.
 * Reads the private key file if a path is provided.
 * @returns {object} SSH connection configuration.
 * @throws {Error} If required environment variables are missing or private key cannot be read.
 */
function getSshConfig() {
    if (!PRIVATE_SSH_HOST || !PRIVATE_SSH_USERNAME) {
        throw new Error('Missing required SSH environment variables (PRIVATE_SSH_HOST, PRIVATE_SSH_USERNAME).');
    }

    const config = {
        host: PRIVATE_SSH_HOST,
        port: parseInt(PRIVATE_SSH_PORT || '22', 10),
        username: PRIVATE_SSH_USERNAME,
    };

    if (PRIVATE_SSH_PRIVATE_KEY_PATH) {
        try {
            config.privateKey = fs.readFileSync(PRIVATE_SSH_PRIVATE_KEY_PATH);
            if (PRIVATE_SSH_PASSPHRASE) {
                config.passphrase = PRIVATE_SSH_PASSPHRASE;
            }
        } catch (err) {
            throw new Error(`Failed to read private key file at ${PRIVATE_SSH_PRIVATE_KEY_PATH}: ${err.message}`);
        }
    } else if (PRIVATE_SSH_PASSWORD) {
        config.password = PRIVATE_SSH_PASSWORD;
    } else {
        throw new Error('Missing SSH authentication method. Please define either PRIVATE_SSH_PRIVATE_KEY_PATH or PRIVATE_SSH_PASSWORD in your .env file.');
    }
    return config;
}

/**
 * Connects to a remote server via SSH using configuration from .env file.
 * @returns {Promise<Client>} A promise that resolves with the SSH client connection.
 */
function connectSSH() {
    const sshConfig = getSshConfig(); // Get config from .env
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log('SSH Client :: ready');
            resolve(conn);
        }).on('error', (err) => {
            console.error('SSH Client :: error', err);
            reject(err);
        }).connect(sshConfig);
    });
}

/**
 * Executes a command on the remote server via SSH.
 * @param {string} command - The command to execute.
 * @returns {Promise<string>} A promise that resolves with the command's stdout or rejects with an error.
 */
export async function executeRemoteCommand(command) {
    const conn = await connectSSH(); // sshConfig is now handled internally
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) {
                conn.end();
                return reject(err);
            }
            let output = '';
            stream.on('close', (code, signal) => {
                console.log(`SSH Stream :: close :: code: ${code}, signal: ${signal}`);
                conn.end();
                if (code !== 0) {
                    return reject(new Error(`Command failed with code ${code}: ${output}`));
                }
                resolve(output.trim());
            }).on('data', (data) => {
                output += data.toString();
            }).stderr.on('data', (data) => {
                console.error('SSH Stream :: stderr :: ' + data);
                output += `STDERR: ${data.toString()}`;
            });
        });
    });
}

/**
 * Uploads a local file to a remote server via SFTP.
 * @param {string} localPath - Path to the local file.
 * @param {string} remotePath - Path on the remote server where the file will be uploaded.
 * @returns {Promise<void>} A promise that resolves when the upload is complete or rejects with an error.
 */
export async function uploadFileToRemote(localPath, remotePath) {
    const conn = await connectSSH(); // sshConfig is now handled internally
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) {
                conn.end();
                return reject(err);
            }
            sftp.fastPut(localPath, remotePath, (sftpError) => {
                conn.end();
                if (sftpError) {
                    return reject(sftpError);
                }
                console.log(`SFTP :: Uploaded ${localPath} to ${remotePath}`);
                resolve();
            });
        });
    });
}

/**
 * Downloads a file from a remote server to a local path via SFTP.
 * @param {string} remotePath - Path to the file on the remote server.
 * @param {string} localPath - Local path where the file will be downloaded.
 * @returns {Promise<void>} A promise that resolves when the download is complete or rejects with an error.
 */
export async function downloadFileFromRemote(remotePath, localPath) {
    const conn = await connectSSH(); // sshConfig is now handled internally
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) {
                conn.end();
                return reject(err);
            }
            sftp.fastGet(remotePath, localPath, (sftpError) => {
                conn.end();
                if (sftpError) {
                    return reject(sftpError);
                }
                console.log(`SFTP :: Downloaded ${remotePath} to ${localPath}`);
                resolve();
            });
        });
    });
}
