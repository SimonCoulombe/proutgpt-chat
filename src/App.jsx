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
    const [backend, setBackend] = useState('openrouter'); // 'openrouter' or 'ollama'
    const [apiUrl, setApiUrl] = useState('https://api.proutgpt.com');
    const [modelName, setModelName] = useState('mistralai/devstral-2512:free');
    const [visitorCount, setVisitorCount] = useState(null);
    const [ollamaModels, setOllamaModels] = useState([]);
    const [openrouterModels] = useState([
        'mistralai/devstral-2512:free',
        'z-ai/glm-4.5-air:free',
        'qwen/qwen3-coder:free',
        'openai/gpt-oss-20b:free',
        'google/gemma-3-27b-it:free',
        'meta-llama/llama-3.3-70b-instruct:free'
    ]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Visitor counter
    useEffect(() => {
        fetch('https://api.countapi.xyz/hit/proutgpt.com/visits')
            .then(res => res.json())
            .then(data => setVisitorCount(data.value))
            .catch(err => console.error('Counter error:', err));
    }, []);

    // Fetch Ollama models when backend is set to ollama
    useEffect(() => {
        if (backend === 'ollama') {
            fetchOllamaModels();
        }
    }, [backend]);

    const fetchOllamaModels = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                setOllamaModels(data.models || []);
            } else {
                console.error('Failed to fetch Ollama models');
            }
        } catch (error) {
            console.error('Error fetching Ollama models:', error);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            let endpoint, body;

            if (backend === 'openrouter') {
                endpoint = 'https://api.proutgpt.com/api/openrouter';
                body = JSON.stringify({
                    prompt: userMessage,
                    model: modelName
                });
            } else {
                // Ollama (default)
                endpoint = `${apiUrl}/api/generate`;
                body = JSON.stringify({
                    model: modelName,
                    prompt: userMessage,
                    stream: false
                });
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body
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
                <div className="text-xs text-gray-500 flex gap-2 items-center flex-wrap">
                    <select
                        value={backend}
                        onChange={(e) => setBackend(e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                    >
                        <option value="openrouter">☁️ OpenRouter (Cloud)</option>
                        <option value="ollama">🏠 Ollama (Local)</option>
                    </select>
                    {backend === 'ollama' && (
                        <>
                            <input
                                type="text"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                                className="border rounded px-2 py-1 w-48 text-xs"
                                placeholder="API URL"
                            />
                            <select
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                className="border rounded px-2 py-1 text-xs"
                            >
                                {ollamaModels.length > 0 ? (
                                    ollamaModels.map((model, index) => (
                                        <option key={index} value={model.name}>{model.name}</option>
                                    ))
                                ) : (
                                    <option value="">Loading models...</option>
                                )}
                            </select>
                        </>
                    )}
                    {backend === 'openrouter' && (
                        <>
                            <select
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                className="border rounded px-2 py-1 text-xs"
                            >
                                {openrouterModels.map((model, index) => (
                                    <option key={index} value={model}>{model}</option>
                                ))}
                            </select>
                            <span className="text-xs text-green-600 font-semibold">
                                💰 Free Credits
                            </span>
                        </>
                    )}
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
                                <span className="text-sm">
                                    ProutGPT réfléchit... {backend === 'openrouter' ? '☁️' : '🏠'}
                                </span>
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
                <div className="text-center text-xs text-gray-600 mt-2">
                    <p>
                        Vibe codé par Benoît Coulombe, Gaëlle Coulombe et Simon Coulombe |
                        {backend === 'ollama' ? ` Propulsé par ${modelName} 🚀` : ` Propulsé par ${modelName} ☁️`} |
                        Hébergé sur une VM gratuite de Oracle Cloud ☁️
                    </p>
                    {visitorCount && (
                        <p className="mt-1">
                            👀 Visiteurs: {visitorCount.toLocaleString()} 💨
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}