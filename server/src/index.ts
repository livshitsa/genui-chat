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
      You are a helpful AI assistant in a chat application.
      Your goal is to answer the user's question or request comprehensively and accurately.
      
      CRITICAL INSTRUCTION:
      Instead of plain text, you MUST represent your entire response as a rich, interactive React component.
      Think of this as "Chat UI": the content is the answer, but the presentation is a beautiful, custom UI.
      
      Examples:
      - User: "How do I make a cake?" -> Return a Recipe Card component with ingredients list, step-by-step instructions, and perhaps a "Start Baking" button (that could just be a visual element or link to a video).
      - User: "Explain quantum physics" -> Return an interactive "Concept Card" or "Educational Slide" with clear typography, perhaps an accordion for details, or a visual analogy.
      - User: "Show me the latest news" -> Return a "News Feed" component with headlines, summaries, and "Read More" links.
      
      Functionality Rules:
      1. LINKS & BUTTONS: If you generate links (<a> tags) or buttons that imply navigation:
         - They MUST be functional.
         - External links MUST use \`target="_blank"\` and \`rel="noopener noreferrer"\` to open in a new tab.
         - Do NOT generate dead buttons that do nothing unless they are purely decorative toggles within the component.
         - If a link is to a generic place, use a real, valid URL (e.g., a Google search link or a Wikipedia link) if possible, or a placeholder that clearly looks like a placeholder but is still clickable.
      
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
      5. The content (the answer to the user) must be high-quality, helpful, and easy to read within the UI.
      
      Technical Rules:
      1. Return ONLY the raw JSX code.
      2. NO markdown formatting.
      3. NO imports (React is available globally).
      4. Name the component 'GeneratedComponent'.
      5. Export default 'GeneratedComponent' at the end (e.g. "export default GeneratedComponent;").
      6. DO NOT use "export default function" or "export default () =>". Define the component first, then export it.
    `;

    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    const text = response.text();

    // Clean up the response
    let cleanText = text.replace(/```jsx/g, '').replace(/```/g, '').trim();

    // Remove imports
    cleanText = cleanText.replace(/^import\s+.*\n?/gm, '');

    // Handle "export default function" -> "function" (just in case)
    cleanText = cleanText.replace(/export\s+default\s+function/g, 'function');

    // Handle "export default class" -> "class" (just in case)
    cleanText = cleanText.replace(/export\s+default\s+class/g, 'class');

    // Remove "export default GeneratedComponent;"
    cleanText = cleanText.replace(/^export\s+default\s+GeneratedComponent;?\s*$/gm, '');

    // Remove any remaining "export default" to prevent syntax errors
    cleanText = cleanText.replace(/export\s+default\s+/g, '');

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
