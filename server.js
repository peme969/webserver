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
    const request = JSON.parse(message.toString()); // Parse the message as JSON

    if (request.action === 'execute') {
      // Run the provided Python code or default code
      const codeToRun = request.code.trim() || "print('hello world')";

      // Execute the Python code
      const python = spawn('python', ['-c', codeToRun]);

      python.stdout.on('data', data => {
        ws.send(data.toString()); // Send the Python script's output
      });

      python.stderr.on('data', data => {
        ws.send(`Error: ${data.toString()}`); // Send any errors
      });

      python.on('close', code => {
        console.log(`Python process exited with code ${code}`);
      });
    } else {
      ws.send('Invalid action or no action specified.');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});
