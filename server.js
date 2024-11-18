const fs = require('fs');

// On WebSocket message
ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    
    // Write the Python code to a temporary file
    const tempFile = 'temp_script.py';
    fs.writeFileSync(tempFile, message);

    // Execute the file
    const pythonProcess = spawn('python3', [tempFile]);

    pythonProcess.stdout.on('data', (data) => {
        ws.send(data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
        ws.send(`ERROR: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        ws.send(`Python process exited with code ${code}`);
        fs.unlinkSync(tempFile); // Delete the temporary file
    });
});
