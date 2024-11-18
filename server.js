const fs = require('fs');
const { spawn } = require('child_process');

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        
        // Write the received Python code to a temporary file
        const tempFile = 'temp_script.py';
        fs.writeFileSync(tempFile, message);

        // Execute the temporary Python file
        const pythonProcess = spawn('python3', [tempFile]);

        // Handle Python output
        pythonProcess.stdout.on('data', (data) => {
            ws.send(data.toString());
        });

        // Handle Python errors
        pythonProcess.stderr.on('data', (data) => {
            ws.send(`ERROR: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            ws.send(`Python process exited with code ${code}`);
            fs.unlinkSync(tempFile); // Delete the temporary file
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
