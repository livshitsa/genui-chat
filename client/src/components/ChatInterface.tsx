import React, { useState, useRef } from 'react';
import DynamicRenderer, { type DynamicRendererHandle } from './DynamicRenderer';

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
    const rendererRef = useRef<DynamicRendererHandle>(null);

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
        <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans selection:bg-blue-500/30">
            {/* Canvas Layer (Background) */}
            <div className="absolute inset-0 z-0">
                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80" />

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(to right, #4f4f4f2e 1px, transparent 1px), linear-gradient(to bottom, #4f4f4f2e 1px, transparent 1px)',
                        backgroundSize: '4rem 4rem',
                        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)'
                    }}
                />

                {/* Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

                {activeComponentCode ? (
                    <div className={`w-full h-full transition-all duration-700 ease-out ${isChatExpanded ? 'opacity-20 scale-[0.95] blur-sm translate-y-4' : 'opacity-100 scale-100 blur-0 translate-y-0'}`}>
                        <DynamicRenderer ref={rendererRef} code={activeComponentCode} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <div className="text-center space-y-6 max-w-lg px-6">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                                <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-2xl ring-1 ring-white/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                                        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                                        <path d="M8.5 8.5v.01" />
                                        <path d="M16 15.5v.01" />
                                        <path d="M12 12v.01" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-3 tracking-tight">Gemini Assistant</h2>
                                <p className="text-lg text-slate-500 leading-relaxed">
                                    Ask a question or describe a UI to generate <span className="text-blue-400 font-medium">interactive components</span> instantly.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* UI Layer (Foreground) */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end items-center pb-6 sm:pb-10">
                {/* Chat History (Floating & Collapsible) */}
                <div
                    className={`w-full max-w-3xl px-4 pointer-events-auto flex flex-col gap-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isChatExpanded ? 'max-h-[60vh] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0 overflow-hidden'
                        }`}
                >
                    <div className="overflow-y-auto flex flex-col gap-6 mask-image-gradient-vertical pb-4 px-2 scrollbar-hide">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                            >
                                <div
                                    className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-6 py-4 shadow-xl backdrop-blur-md transition-all duration-300 ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-blue-900/20'
                                        : 'bg-slate-900/80 text-slate-200 border border-slate-800 shadow-black/20'
                                        } ${msg.componentCode ? 'cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:border-blue-500/30 group ring-1 ring-transparent hover:ring-blue-500/20' : ''}`}
                                    onClick={() => {
                                        if (msg.componentCode) {
                                            setActiveComponentCode(msg.componentCode);
                                            setIsChatExpanded(false);
                                        }
                                    }}
                                >
                                    <div className="text-[15px] leading-relaxed flex flex-col gap-2">
                                        {msg.content}
                                        {msg.componentCode && (
                                            <div className="flex items-center gap-2 text-xs font-medium text-blue-300/80 uppercase tracking-wider mt-1 group-hover:text-blue-200 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                                </svg>
                                                Click to view component
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl px-6 py-4 shadow-xl border border-slate-800">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Bar (Floating) */}
                <div className="w-full max-w-3xl px-4 pointer-events-auto relative group">
                    {/* Toggle Chat Button */}
                    <button
                        onClick={() => setIsChatExpanded(!isChatExpanded)}
                        className="absolute -top-16 right-4 bg-slate-900/80 backdrop-blur-xl p-3 rounded-full shadow-lg border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all duration-300 text-slate-400 hover:text-white hover:scale-110 active:scale-95"
                        title={isChatExpanded ? "Collapse Chat" : "Expand Chat"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-500 ${isChatExpanded ? 'rotate-180' : ''}`}>
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>

                    {/* Scroll to Bottom Button */}
                    {!isChatExpanded && activeComponentCode && (
                        <button
                            onClick={() => rendererRef.current?.scrollToBottom()}
                            className="absolute -top-16 right-16 bg-slate-900/80 backdrop-blur-xl p-3 rounded-full shadow-lg border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all duration-300 text-slate-400 hover:text-white hover:scale-110 active:scale-95"
                            title="Scroll to Bottom"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M19 12l-7 7-7-7" />
                            </svg>
                        </button>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="relative bg-slate-900/60 backdrop-blur-2xl border border-slate-800/60 shadow-2xl rounded-[2rem] p-2 flex gap-2 ring-1 ring-white/5 transition-all duration-300 focus-within:ring-blue-500/50 focus-within:bg-slate-900/80 focus-within:border-slate-700 focus-within:shadow-blue-900/20 hover:border-slate-700"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask a question or describe a UI..."
                            className="flex-1 bg-transparent border-none px-6 py-4 focus:outline-none text-slate-100 placeholder-slate-500 text-lg font-light"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 rounded-[1.5rem] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-lg shadow-blue-900/30 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="flex items-center gap-2">
                                Send
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
