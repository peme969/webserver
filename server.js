const express = require('express');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // Serve static files

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        console.log(`Received Python code: ${message}`);

        // Define an absolute path for the temporary Python script
        const tempFile = path.join(__dirname, 'temp_script.py');

        try {
            // Write the received code to the temporary file
            fs.writeFileSync(tempFile, message, { encoding: 'utf8' });
            console.log(`Python script written to: ${tempFile}`);

            // Execute the temporary Python file
            const pythonProcess = spawn('python3', [tempFile]);

            // Send Python process stdout to WebSocket
            pythonProcess.stdout.on('data', (data) => {
                ws.send(data.toString());
            });

            // Send Python process stderr to WebSocket
            pythonProcess.stderr.on('data', (data) => {
                ws.send(`ERROR: ${data}`);
            });

            // Handle Python process exit
            pythonProcess.on('close', (code) => {
                ws.send(`Python process exited with code ${code}`);
                console.log(`Python process exited with code ${code}`);

                // Delete the temporary file after execution
                try {
                    fs.unlinkSync(tempFile);
                    console.log(`Temporary file deleted: ${tempFile}`);
                } catch (err) {
                    console.error(`Failed to delete temp file: ${err}`);
                }
            });

        } catch (err) {
            ws.send(`ERROR: Failed to create or execute the Python script: ${err}`);
            console.error(`File operation or process error: ${err}`);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
