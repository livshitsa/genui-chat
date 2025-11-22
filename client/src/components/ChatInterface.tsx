import React, { useState } from 'react';
import DynamicRenderer from './DynamicRenderer';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    isComponent?: boolean;
    componentCode?: string;
}

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeComponentCode, setActiveComponentCode] = useState<string | null>(null);
    const [isChatExpanded, setIsChatExpanded] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setIsChatExpanded(true); // Expand chat to show user message and loading state

        try {
            const response = await fetch('http://localhost:3000/api/generate-jsx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: input }),
            });

            const data = await response.json();

            if (data.code) {
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    content: "✨ Generated Component. Click to view.",
                    componentCode: data.code
                };
                setMessages(prev => [...prev, aiMessage]);
                setActiveComponentCode(data.code);
                setIsChatExpanded(false); // Collapse chat after generation to show component
            } else {
                console.error('No code returned');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-gray-50 font-sans">
            {/* Canvas Layer (Background) */}
            <div className="absolute inset-0 z-0">
                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                {activeComponentCode ? (
                    <div className={`w-full h-full transition-all duration-500 ${isChatExpanded ? 'opacity-30 scale-[0.98] blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
                        <DynamicRenderer code={activeComponentCode} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-2">Gemini React Generator</h2>
                            <p>Describe a UI component to get started</p>
                        </div>
                    </div>
                )}
            </div>

            {/* UI Layer (Foreground) */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end items-center pb-8">
                {/* Chat History (Floating & Collapsible) */}
                <div
                    className={`w-full max-w-2xl px-4 pointer-events-auto flex flex-col gap-4 transition-all duration-500 ease-in-out ${isChatExpanded ? 'max-h-[50vh] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-2 overflow-hidden'
                        }`}
                >
                    <div className="overflow-y-auto flex flex-col gap-4 mask-image-gradient pb-2">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm backdrop-blur-md ${msg.role === 'user'
                                        ? 'bg-blue-600/90 text-white'
                                        : 'bg-white/80 text-gray-800 border border-white/20'
                                        } ${msg.componentCode ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors group' : ''}`}
                                    onClick={() => {
                                        if (msg.componentCode) {
                                            setActiveComponentCode(msg.componentCode);
                                            setIsChatExpanded(false);
                                        }
                                    }}
                                >
                                    <p className="text-sm leading-relaxed flex items-center gap-2">
                                        {msg.content}
                                        {msg.componentCode && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                            </svg>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/80 backdrop-blur-md rounded-2xl px-5 py-3 shadow-sm border border-white/20">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Bar (Floating) */}
                <div className="w-full max-w-2xl px-4 pointer-events-auto relative">
                    {/* Toggle Chat Button */}
                    <button
                        onClick={() => setIsChatExpanded(!isChatExpanded)}
                        className="absolute -top-12 right-4 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-white/20 hover:bg-white transition-colors text-gray-600"
                        title={isChatExpanded ? "Collapse Chat" : "Expand Chat"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isChatExpanded ? 'rotate-180' : ''}`}>
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>

                    <form
                        onSubmit={handleSubmit}
                        className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full p-2 flex gap-2 ring-1 ring-black/5 transition-all focus-within:ring-blue-500/50 focus-within:scale-[1.01]"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Describe a UI component..."
                            className="flex-1 bg-transparent border-none px-6 py-3 focus:outline-none text-gray-800 placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
