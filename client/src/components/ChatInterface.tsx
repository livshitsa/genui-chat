import React, { useState } from 'react';
import DynamicRenderer from './DynamicRenderer';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    isComponent?: boolean;
}

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeComponentCode, setActiveComponentCode] = useState<string | null>(null);

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
                    content: "I've generated the component for you. Check the canvas on the right!",
                };
                setMessages(prev => [...prev, aiMessage]);
                setActiveComponentCode(data.code);
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
        <div className="flex h-screen bg-gray-100">
            {/* Left Panel: Chat */}
            <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
                <header className="bg-white shadow-sm p-4 border-b">
                    <h1 className="text-xl font-bold text-gray-800">Gemini React Generator</h1>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg p-4">
                                <p className="text-gray-500 animate-pulse">Generating component...</p>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Describe a UI component..."
                            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>

            {/* Right Panel: Canvas */}
            <div className="w-1/2 bg-gray-50 flex flex-col">
                <header className="bg-white shadow-sm p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-700">Canvas</h2>
                    {activeComponentCode && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    )}
                </header>
                <div className="flex-1 p-8 overflow-hidden flex items-center justify-center">
                    {activeComponentCode ? (
                        <div className="w-full h-full shadow-lg rounded-lg overflow-hidden bg-white">
                            <DynamicRenderer code={activeComponentCode} />
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <p>Generated components will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
