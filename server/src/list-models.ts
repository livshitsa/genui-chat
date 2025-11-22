import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
    try {
        // There isn't a direct listModels method on the client instance in the node SDK easily accessible 
        // without using the model manager or similar, but let's try to just use a known model 
        // or print the error from a simple call.
        // Actually, the error message suggested calling ListModels.
        // The SDK might not expose it directly on genAI.
        // Let's try to use the model 'gemini-1.5-flash-001' which is a specific version.

        console.log('Testing gemini-1.5-flash-001...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
        const result = await model.generateContent('Hello');
        console.log('Success with gemini-1.5-flash-001');
        console.log(result.response.text());
    } catch (error: any) {
        console.error('Error with gemini-1.5-flash-001:', error.message);

        try {
            console.log('Testing gemini-1.0-pro...');
            const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
            const result = await model.generateContent('Hello');
            console.log('Success with gemini-1.0-pro');
            console.log(result.response.text());
        } catch (e: any) {
            console.error('Error with gemini-1.0-pro:', e.message);
        }
    }
}

listModels();
