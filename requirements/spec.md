Dynamic React JSX Chat App
(Think “ChatGPT but every answer is a live, beautiful React app”)

Goal: A chat interface where:  User types a message (e.g. “Show me an interactive solar system”)  
LLM instantly replies with a valid React + Tailwind component (no tools, only internal knowledge)  
That component is rendered live inside the chat bubble

Core Tech Stack (minimal & production-ready)Layer

Frontend:
Vite + React 18 + TypeScript + Tailwind
Fast, modern, zero config

LLM Backend:
Node.js/Express with /generate-jsx endpoint
LLM: Gemini 

Dynamic render:
iframe + Babel standalone (safest & simplest)

Data Flow (5 steps):

User message
   ↓
POST /api/generate-jsx { prompt }
   ↓
LLM returns raw JSX string 
   ↓
Frontend receives JSX → injects into sandboxed <iframe> with React 18 + Tailwind CDN
   ↓
Live interactive component appears in the chat bubble

