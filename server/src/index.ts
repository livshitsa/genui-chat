import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { LLMFactory } from './llm/llm-factory';
import { cleanJSX } from './utils/text-cleaner';

dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/generate-jsx', async (req, res) => {
  try {
    const { prompt, model = 'gemini' } = req.body;
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
      2. AVOID GENERIC "AI PURPLE" THEMES. Do not use purple-500, violet-600, etc., as primary colors unless specifically requested.
      3. Make it PREMIUM and MODERN:
         - Use sophisticated color palettes: Slate, Zinc, Neutral, or vibrant accents like Emerald, Amber, Rose, Indigo (sparingly).
         - Use gradients (bg-gradient-to-br from-slate-900 to-slate-800).
         - Use subtle borders (border border-white/10).
         - Use shadows (shadow-xl, shadow-2xl).
         - Use rounded corners (rounded-2xl, rounded-3xl).
         - Add interactivity (hover:scale-[1.02], active:scale-95, transition-all duration-300).
         - Use glassmorphism where appropriate (backdrop-blur-xl, bg-white/5 or bg-black/20).
      4. Use inline SVGs for icons. Do NOT use external icon libraries.
      5. The component must be responsive (w-full, max-w-...).
      6. The content (the answer to the user) must be high-quality, helpful, and easy to read within the UI.
      
      Technical Rules:
      1. Return ONLY the raw JSX code.
      2. NO markdown formatting.
      3. NO imports (React is available globally).
      4. Name the component 'GeneratedComponent'.
      5. Export default 'GeneratedComponent' at the end (e.g. "export default GeneratedComponent;").
      6. DO NOT use "export default function" or "export default () =>". Define the component first, then export it.
      7. Ensure all tags are properly closed and JSX is valid.
    `;

    const provider = LLMFactory.getProvider(model);
    const response = await provider.generate(systemPrompt, prompt);
    const cleanText = cleanJSX(response.text);

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
  console.log('Gemini API Key present:', !!process.env.GEMINI_API_KEY);
  console.log('Anthropic API Key present:', !!process.env.ANTHROPIC_API_KEY);
});
