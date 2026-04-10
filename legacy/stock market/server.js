const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { Worker } = require('worker_threads');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from the "public" directory (we will move them here)
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// API Routes
app.post('/api/upload', upload.single('dataset'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    console.log(`Received file: ${req.file.originalname}`);

    const results = [];

    // Parse the CSV using streams 
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            console.log(`Parsed ${results.length} rows.`);

            // Clean up the uploaded file to save space
            fs.unlinkSync(req.file.path);

            console.log("Spawning AI Worker for computation...");
            // Pass parsed results to the AI Worker Thread
            const worker = new Worker(path.join(__dirname, 'aiWorker.js'), {
                workerData: { dataset: results }
            });

            worker.on('message', (message) => {
                if (message.status === 'complete') {
                    res.json({
                        message: 'Data successfully ingested and modeled.',
                        rowsProcessed: results.length,
                        predictions: message.predictions
                    });
                } else if (message.status === 'error') {
                    res.status(500).json({ error: 'AI processing failed', details: message.error });
                }
            });

            worker.on('error', (err) => {
                console.error(err);
                res.status(500).json({ error: 'Worker thread error.' });
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`Worker stopped with exit code ${code}`);
                }
            });
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).json({ error: 'Error parsing CSV file.' });
        });
});

app.listen(PORT, () => {
    console.log(`QuantAI Server running on http://localhost:${PORT}`);
});
