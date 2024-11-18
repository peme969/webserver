const express = require('express');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('public')); // Serve static files (frontend)

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    // Spawn a Python process in interactive mode
    const pythonProcess = spawn('python', ['-i']);

    pythonProcess.stdout.on('data', (data) => {
        ws.send(data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
        ws.send(`ERROR: ${data}`);
    });

    ws.on('message', (message) => {
        pythonProcess.stdin.write(message + '\n');
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        pythonProcess.kill();
    });
});
