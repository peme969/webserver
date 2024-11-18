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
        console.log(`Received Python code:\n${message}`);

        // Define the absolute path for the temporary Python file
        const tempFile = path.join(__dirname, 'temp_script.py');

        try {
            // Write the received Python code to the temporary file
            fs.writeFileSync(tempFile, message, { encoding: 'utf8' });
            console.log(`Python script written to: ${tempFile}`);

            // Execute the temporary Python file
            const pythonProcess = spawn('python3', [tempFile]);

            // Capture Python stdout
            pythonProcess.stdout.on('data', (data) => {
                console.log(`Python Output: ${data.toString()}`);
                ws.send(data.toString());
            });

            // Capture Python stderr
            pythonProcess.stderr.on('data', (data) => {
                console.error(`Python Error: ${data.toString()}`);
                ws.send(`ERROR: ${data.toString()}`);
            });

            // Handle process close event
            pythonProcess.on('close', (code) => {
                console.log(`Python process exited with code ${code}`);
                ws.send(`Python process exited with code ${code}`);

                // Delete the temporary file after execution
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                    console.log(`Temporary file deleted: ${tempFile}`);
                } else {
                    console.error(`Temporary file not found: ${tempFile}`);
                }
            });

        } catch (err) {
            ws.send(`ERROR: Failed to create or execute the Python script: ${err.message}`);
            console.error(`File or Process Error: ${err.message}`);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
