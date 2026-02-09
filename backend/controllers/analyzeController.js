import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Analyze receipt image
// @route   POST /api/expenses/analyze
// @access  Private
const analyzeReceipt = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
    }

    // Normalize path for Windows
    const imagePath = path.resolve(req.file.path);
    // Adjust path to point to backend/ml_service/main.py
    // Assuming controller is in backend/controllers
    const scriptPath = path.join(__dirname, '..', 'ml_service', 'main.py');

    console.log(`Analyzing image: ${imagePath} with script: ${scriptPath}`);

    const pythonProcess = spawn('python', [scriptPath, imagePath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('error', (err) => {
        console.error("Failed to start python process:", err);
        return res.status(500).json({ message: "Failed to start python process. Is Python installed?", error: err.message });
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}`);
            console.error(`Stderr: ${errorString}`);
            return res.status(500).json({
                message: 'Analysis failed',
                error: errorString || "Unknown error",
                details: "The OCR process encountered a fatal error."
            });
        }

        try {
            console.log("Raw Python Output:", dataString);

            // Robust JSON extraction
            // 1. Try cleaning whitespace
            let jsonCandidate = dataString.trim();

            // 2. If it contains multiple lines or noise, try to find the JSON object
            const firstBrace = jsonCandidate.indexOf('{');
            const lastBrace = jsonCandidate.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonCandidate = jsonCandidate.substring(firstBrace, lastBrace + 1);
            } else {
                // Fallback: if no braces found, it might be an issue, but let JSON.parse try or fail
            }

            const result = JSON.parse(jsonCandidate);

            if (result.error) {
                return res.status(500).json({ message: result.error });
            }

            res.json(result);
        } catch (err) {
            console.error("Failed to parse Python output:", err);
            console.error("Output was:", dataString);
            res.status(500).json({
                message: 'Failed to parse analysis result',
                raw: dataString.slice(0, 500) + "..." // Truncate for safety
            });
        }
    });
};

export { analyzeReceipt };
