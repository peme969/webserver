const express = require('express');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server, path: '/term' });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (code) => {
        console.log(`Executing Python code:\n${code}`);

        // Spawn a Python process and execute the received code
        const pythonProcess = spawn('python3', ['-c', code.toString()]);

        // Capture stdout and send back to the client
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python Output: ${data}`);
            ws.send(data.toString());
        });

        // Capture stderr and send back as error
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
            ws.send(`ERROR: ${data}`);
        });

        // Handle process exit
        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
            ws.send(`Process exited with code ${code}`);
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
