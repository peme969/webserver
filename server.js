const WebSocket = require('ws');
const { spawn } = require('child_process');
const express = require('express');

const PORT = process.env.PORT || 3000;

// Create an Express app for basic HTTP responses
const app = express();
app.get('/', (req, res) => {
  res.send('WebSocket server is running!');
});

// Create an HTTP server and attach WebSocket
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('Client connected.');

  ws.on('message', message => {
    const codeToRun = message.trim() || "print('hello world')"; // Use default code if input is empty

    // Execute the Python code
    const python = spawn('python', ['-c', codeToRun]);

    python.stdout.on('data', data => {
      ws.send(data.toString().trim()); // Send Python output, trimmed of newlines
    });

    python.stderr.on('data', data => {
      ws.send(`Error: ${data.toString().trim()}`); // Send Python error, trimmed of newlines
    });

    python.on('close', code => {
      console.log(`Python process exited with code ${code}`);
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});
