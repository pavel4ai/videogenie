// src/lib/server/ssh_utils.js
import { Client } from 'ssh2';

/**
 * Connects to a remote server via SSH and returns a Promise that resolves with the SSH client connection.
 * @param {object} sshConfig - SSH connection configuration (host, port, username, privateKey/password).
 * @returns {Promise<Client>} A promise that resolves with the SSH client.
 */
function connectSSH(sshConfig) {
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
 * @param {object} sshConfig - SSH connection configuration.
 * @param {string} command - The command to execute.
 * @returns {Promise<string>} A promise that resolves with the command's stdout or rejects with an error.
 */
export async function executeRemoteCommand(sshConfig, command) {
  const conn = await connectSSH(sshConfig);
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
        // Log stderr, but don't necessarily reject immediately unless command fails
        console.error('SSH Stream :: stderr :: ' + data);
        output += `STDERR: ${data.toString()}`;
      });
    });
  });
}

/**
 * Uploads a local file to a remote server via SFTP.
 * @param {object} sshConfig - SSH connection configuration.
 * @param {string} localPath - Path to the local file.
 * @param {string} remotePath - Path on the remote server where the file will be uploaded.
 * @returns {Promise<void>} A promise that resolves when the upload is complete or rejects with an error.
 */
export async function uploadFileToRemote(sshConfig, localPath, remotePath) {
  const conn = await connectSSH(sshConfig);
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
 * @param {object} sshConfig - SSH connection configuration.
 * @param {string} remotePath - Path to the file on the remote server.
 * @param {string} localPath - Local path where the file will be downloaded.
 * @returns {Promise<void>} A promise that resolves when the download is complete or rejects with an error.
 */
export async function downloadFileFromRemote(sshConfig, remotePath, localPath) {
  const conn = await connectSSH(sshConfig);
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

// Example usage (comment out or remove for production):
/*
async function testSSH() {
  const config = {
    host: 'your_server_ip_or_hostname',
    port: 22, // or your SSH port
    username: 'your_username',
    privateKey: require('fs').readFileSync('/path/to/your/private_key.pem')
    // or password: 'your_password'
  };

  try {
    const lsOutput = await executeRemoteCommand(config, 'ls -la /tmp');
    console.log('Remote ls -la /tmp output:', lsOutput);

    // Create a dummy local file for testing upload
    // require('fs').writeFileSync('./dummy.txt', 'Hello from local!');
    // await uploadFileToRemote(config, './dummy.txt', '/tmp/remote_dummy.txt');
    // console.log('Uploaded dummy.txt to /tmp/remote_dummy.txt');

    // await downloadFileFromRemote(config, '/tmp/remote_dummy.txt', './downloaded_dummy.txt');
    // console.log('Downloaded /tmp/remote_dummy.txt to ./downloaded_dummy.txt');

  } catch (error) {
    console.error('SSH test failed:', error);
  }
}

// testSSH();
*/
