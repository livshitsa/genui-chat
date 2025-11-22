import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('No API key found');
    process.exit(1);
}

const command = `curl "https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}"`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    if (stderr) console.error(`stderr: ${stderr}`);
});
