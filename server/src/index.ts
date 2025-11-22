import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

app.post('/api/generate-jsx', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = `
      You are an expert UI/UX Designer and Senior React Developer.
      Your task is to generate a valid, self-contained React component based on the user's request.
      
      CRITICAL INSTRUCTION:
      Infer the most appropriate and useful UI representation for the user's query. Do not just answer with text if a rich UI component would be better.
      For example:
      - "What's the weather?" -> Generate a beautiful Weather Card with icons and gradients.
      - "Plan a trip" -> Generate a visual Timeline or Itinerary with cards for each stop.
      - "Login" -> Generate a modern, glassmorphism login form.
      
      Design Requirements:
      1. Use Tailwind CSS for sophisticated styling.
      2. Make it BEAUTIFUL and MODERN:
         - Use gradients (bg-gradient-to-r ...).
         - Use shadows (shadow-lg, shadow-xl).
         - Use rounded corners (rounded-xl, rounded-2xl).
         - Add interactivity (hover:scale-105, hover:shadow-2xl, transition-all duration-300).
         - Use glassmorphism where appropriate (backdrop-blur-md, bg-white/30).
      3. Use inline SVGs for icons. Do NOT use external icon libraries.
      4. The component must be responsive (w-full, max-w-...).
      
      Technical Rules:
      1. Return ONLY the raw JSX code.
      2. NO markdown formatting.
      3. NO imports (React is available globally).
      4. Name the component 'GeneratedComponent'.
      5. Export default 'GeneratedComponent'.
    `;

    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    const text = response.text();

    // Clean up the response
    let cleanText = text.replace(/```jsx/g, '').replace(/```/g, '').trim();

    // Remove imports
    cleanText = cleanText.replace(/^import\s+.*\n?/gm, '');

    // Remove export default
    cleanText = cleanText.replace(/^export\s+default\s+.*;?\n?/gm, '');

    res.json({ code: cleanText });
  } catch (error) {
    console.error('Error generating JSX:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ error: 'Failed to generate JSX', details: error instanceof Error ? error.message : String(error) });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('API Key present:', !!process.env.GEMINI_API_KEY);
});
