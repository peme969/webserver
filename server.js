const express = require('express');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/term' });

wss.on('connection', (ws, req) => {
    console.log('Client connected');

    // Parse query parameters (e.g., mode=script)
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const mode = urlParams.get('mode') || 'default';
    console.log(`Connection mode: ${mode}`);

    // Create a buffer to accumulate received data
    let codeBuffer = '';

    // Handle messages from the client
    ws.on('message', (data) => {
        // Decode the message type
        const message = new Uint8Array(data);
        const messageType = message[0];

        if (messageType === 0) { // Data input
            const input = new TextDecoder().decode(message.slice(1));
            codeBuffer += input;

            // If the input contains a newline, process it as a command
            if (input.includes('\n')) {
                processPythonCode(codeBuffer, ws);
                codeBuffer = ''; // Clear the buffer
            }
        } else if (messageType === 1) { // Resize
            const resizeData = JSON.parse(new TextDecoder().decode(message.slice(1)));
            console.log(`Resize event: ${JSON.stringify(resizeData)}`);
            // Handle resize (optional)
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Function to process Python code
function processPythonCode(code, ws) {
    console.log(`Received Python code:\n${code}`);

    // Define the absolute path for the temporary Python script
    const tempFile = path.join(__dirname, 'temp_script.py');

    try {
        // Write the code to the temporary file
        fs.writeFileSync(tempFile, code, { encoding: 'utf8' });
        console.log(`Python script written to: ${tempFile}`);

        // Execute the Python script
        const pythonProcess = spawn('python3', [tempFile]);

        // Send Python stdout to WebSocket
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python Output: ${data.toString()}`);
            ws.send(new Uint8Array(Buffer.from(data.toString())));
        });

        // Send Python stderr to WebSocket
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data.toString()}`);
            ws.send(new Uint8Array(Buffer.from(`ERROR: ${data.toString()}`)));
        });

        // Handle Python process exit
        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
            ws.send(new Uint8Array(Buffer.from(`Python process exited with code ${code}`)));

            // Delete the temporary file after execution
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
                console.log(`Temporary file deleted: ${tempFile}`);
            } else {
                console.error(`Temporary file not found: ${tempFile}`);
            }
        });

    } catch (err) {
        ws.send(new Uint8Array(Buffer.from(`ERROR: ${err.message}`)));
        console.error(`Failed to process Python code: ${err.message}`);
    }
}
