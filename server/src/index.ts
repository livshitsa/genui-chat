import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { LLMFactory } from './llm/llm-factory';
import { cleanJSX } from './utils/text-cleaner';
import { initializeDatabase } from './db/database';
import { ConversationService } from './services/conversation-service';
import type { ConversationMessage } from './llm/llm-provider';
import { BraveSearchTool } from './tools/brave-search';

dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

app.post('/api/generate-jsx', async (req, res) => {
  try {
    const { prompt, model = 'gemini', sessionId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get current date for context
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const systemPrompt = `
      You are a helpful AI assistant in a chat application.
      Your goal is to answer the user's question or request comprehensively and accurately.
      
      CURRENT DATE: ${currentDate}
      Use this date as reference when the user asks for "latest", "current", "recent", or "today's" information.
      
      TOOL USAGE - CRITICAL:
      You have access to tools including a web search tool (brave_web_search).
      - When the user asks for current information, news, latest updates, or real-time data, YOU MUST USE THE SEARCH TOOL FIRST.
      - DO NOT generate code that calls the search tool - YOU directly call the tool yourself before generating the UI.
      - DO NOT include API calls or tool calls in the generated JSX component.
      - Use the tool, get the results, then create a beautiful UI component that displays those results.
      
      CRITICAL INSTRUCTION:
      Instead of plain text, you MUST represent your entire response as a rich, interactive React component.
      Think of this as "Chat UI": the content is the answer, but the presentation is a beautiful, custom UI.
      
      Examples:
      - User: "How do I make a cake?" -> Return a Recipe Card component with ingredients list, step-by-step instructions, and perhaps a "Start Baking" button (that could just be a visual element or link to a video).
      - User: "Explain quantum physics" -> Return an interactive "Concept Card" or "Educational Slide" with clear typography, perhaps an accordion for details, or a visual analogy.
      - User: "Show me the latest news" -> USE THE SEARCH TOOL to get actual news, then return a "News Feed" component with real headlines, summaries, and "Read More" links.
      
      Functionality Rules:
      1. LINKS & BUTTONS: If you generate links (<a> tags) or buttons that imply navigation:
         - They MUST be functional.
         - External links MUST use \`target="_blank"\` and \`rel="noopener noreferrer"\` to open in a new tab.
      
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
      5. The component must be responsive (w-full, max-w...).
      6. The content (the answer to the user) must be high-quality, helpful, and easy to read within the UI.
      
      Technical Rules:
      1. Return ONLY the raw JSX code.
      2. NO markdown formatting.
      3. NO imports (React is available globally).
      4. Name the component 'GeneratedComponent'.
      5. Export default 'GeneratedComponent' at the end (e.g. "export default GeneratedComponent;").
      6. DO NOT use "export default function" or "export default () =>". Define the component first, then export it.
      7. Ensure all tags are properly closed and JSX is valid.
      8. DO NOT include any tool calls or API calls in the JSX - all data should come from the tool results you already obtained.
      
      JSX SYNTAX VALIDATION - CRITICAL:
      - Every opening tag MUST have a matching closing tag with the EXACT same name
      - Check every <div>, <span>, <button>, <a>, etc. has its corresponding </div>, </span>, </button>, </a>
      - Self-closing tags like <img />, <br />, <hr /> must end with />
      - Tag names are case-sensitive in JSX - double-check all closing tags match their opening tags exactly
      - Before finishing, mentally validate: count opening tags vs closing tags for each element type
      - Common mistakes to avoid: </space> instead of </div>, missing closing tags, typos in tag names
    `;

    // Save user message to database
    await ConversationService.addMessage(sessionId, 'user', prompt);

    // Get conversation history
    const dbMessages = await ConversationService.getConversationHistory(sessionId);

    // Convert database messages to LLM format
    // Strategy: "Active Component"
    // - Keep full code for the MOST RECENT AI message (to allow iteration)
    // - Replace code in older AI messages with a placeholder (to save tokens)

    // Find the index of the last AI message
    const lastAiIndex = dbMessages.map(m => m.role).lastIndexOf('ai');

    const conversationMessages: ConversationMessage[] = dbMessages.map((msg, index) => {
      // Check if this is the last AI message in the history
      const isLastAiMessage = index === lastAiIndex;

      let content = msg.content;

      if (msg.role === 'ai' && msg.component_code) {
        if (isLastAiMessage) {
          // Keep full code for the latest component so we can iterate on it
          content = msg.component_code;
        } else {
          // Summarize older components to save tokens
          content = `[Previous Component Code Hidden] (Description: ${msg.content})`;
        }
      }

      return {
        role: msg.role,
        content: content
      };
    });

    console.log(`📝 Processing conversation ${sessionId} with ${conversationMessages.length} messages`);

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const provider = LLMFactory.getProvider(model);
    const searchTool = new BraveSearchTool();

    try {
      // Use the new history-aware stream method
      const stream = provider.generateStreamWithHistory(systemPrompt, conversationMessages, [searchTool]);

      let accumulatedCode = '';

      for await (const chunk of stream) {
        accumulatedCode += chunk;
        res.write(chunk);
      }

      res.end();

      // Save AI response to database
      const cleanCode = cleanJSX(accumulatedCode);
      await ConversationService.addMessage(
        sessionId,
        'ai',
        model === 'gemini' ? 'Generated by Gemini' : 'Generated by Claude',
        cleanCode,
        model
      );

      console.log(`✅ Conversation ${sessionId} updated with AI response`);

    } catch (streamError) {
      console.error('Streaming error:', streamError);
      res.end();
    }
  } catch (error) {
    console.error('Error generating JSX:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate JSX', details: error instanceof Error ? error.message : String(error) });
    } else {
      res.end();
    }
  }
});

// Optional: Get conversation history endpoint
app.get('/api/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await ConversationService.getConversationHistory(sessionId);
    res.json({ sessionId, messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Optional: List all conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await ConversationService.getAllConversations();
    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Gemini API Key present:', !!process.env.GEMINI_API_KEY);
  console.log('Anthropic API Key present:', !!process.env.ANTHROPIC_API_KEY);
});
