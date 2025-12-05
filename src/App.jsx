import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function App() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '🎉 Salut! Je suis ProutGPT! Prêt pour des blagues de pets trop cool? Haha! 💨'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [apiUrl, setApiUrl] = useState('https://api.proutgpt.com');
    const [modelName, setModelName] = useState('proutgpt:latest');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch(`${apiUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    prompt: userMessage,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response
            }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '😅 Oups! J\'ai eu un problème (comme un prout qui rate!). Réessaie!'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-500">
            <div className="bg-white shadow-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-4xl">💨</div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">ProutGPT</h1>
                        <p className="text-sm text-gray-600">Le chat bot le plus con du monde!</p>
                    </div>
                </div>
                <div className="text-xs text-gray-500 flex gap-2 items-center">
                    <input
                        type="text"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="border rounded px-2 py-1 w-48 text-xs"
                        placeholder="API URL"
                    />
                    <input
                        type="text"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        className="border rounded px-2 py-1 w-32 text-xs"
                        placeholder="Model"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-white text-gray-800 rounded-bl-none shadow-md'
                                }`}
                        >
                            {message.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">💨</span>
                                    <span className="font-bold text-sm">ProutGPT</span>
                                </div>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white text-gray-800 rounded-2xl rounded-bl-none shadow-md px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">ProutGPT réfléchit...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t p-4">
                <div className="flex gap-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Écris ton message... 💬"
                        className="flex-1 border-2 border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:border-blue-500 text-gray-800"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full p-3 transition-colors"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-center text-xs text-gray-600 mt-2">
                    Vibe codé par Benoît Coulombe, Gaëlle Coulombe et Simon Coulombe | Propulsé par Llama 3.2 🚀 | Hébergé sur une VM gratuite de Oracle Cloud ☁️
                </p>
            </div>
        </div>
    );
}