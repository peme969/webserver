const WebSocket = require('ws');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;

const server = new WebSocket.Server({ noServer: true });

server.on('connection', ws => {
  ws.on('message', message => {
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
    console.log('Client disconnected');
  });
});

const http = require('http');
const app = require('express')();

app.get('/', (req, res) => {
  res.send('Python WebSocket server is running!');
});

const httpServer = http.createServer(app);
httpServer.on('upgrade', (request, socket, head) => {
  server.handleUpgrade(request, socket, head, ws => {
    server.emit('connection', ws, request);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
