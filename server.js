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
    console.log(`Received: ${message}`);

    // Execute the Python code
    const python = spawn('python', ['-c', message]);

    python.stdout.on('data', data => {
      ws.send(data.toString());
    });

    python.stderr.on('data', data => {
      ws.send(`Error: ${data.toString()}`);
    });

    python.on('close', () => {
      ws.send('Execution completed.\n');
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});
