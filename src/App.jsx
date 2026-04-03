import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Trash2, Copy, Check, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ---------------------------------------------------------------------------
// Constants (outside component — never cause re-renders)
// ---------------------------------------------------------------------------
const OPENROUTER_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.proutgpt.com';

const OPENROUTER_MODELS = [
    'stepfun/step-3.5-flash:free',
    'z-ai/glm-4.5-air:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'nvidia/nemotron-nano-9b-v2:free',
    'liquid/lfm-2.5-1.2b-instruct:free',
    'arcee-ai/trinity-mini:free',
];

const INITIAL_MESSAGE = {
    role: 'assistant',
    content: '🎉 Salut! Je suis ProutGPT! Prêt pour des blagues de pets trop cool? Haha! 💨',
};

const STORAGE_KEY = 'proutgpt_messages';
const STORAGE_SETTINGS_KEY = 'proutgpt_settings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadMessages() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch { /* ignore */ }
    return [INITIAL_MESSAGE];
}

function saveMessages(messages) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch { /* ignore */ }
}

function loadSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
        if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return {};
}

function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Markdown renderer component — renders assistant messages as rich text
// ---------------------------------------------------------------------------
function MarkdownMessage({ content }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Code blocks with language label
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match) {
                        return (
                            <div className="my-2">
                                <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-t font-mono">
                                    {match[1]}
                                </div>
                                <pre className="bg-gray-800 text-green-300 text-xs p-3 rounded-b overflow-x-auto">
                                    <code {...props}>{children}</code>
                                </pre>
                            </div>
                        );
                    }
                    return (
                        <code className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                        </code>
                    );
                },
                // Paragraph
                p({ children }) {
                    return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
                },
                // Lists
                ul({ children }) {
                    return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                    return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                },
                // Headings
                h1({ children }) { return <h1 className="text-lg font-bold mb-2">{children}</h1>; },
                h2({ children }) { return <h2 className="text-base font-bold mb-1">{children}</h2>; },
                h3({ children }) { return <h3 className="text-sm font-bold mb-1">{children}</h3>; },
                // Blockquote
                blockquote({ children }) {
                    return (
                        <blockquote className="border-l-4 border-blue-300 pl-3 italic text-gray-600 my-2">
                            {children}
                        </blockquote>
                    );
                },
                // Bold / Italic
                strong({ children }) { return <strong className="font-bold">{children}</strong>; },
                em({ children }) { return <em className="italic">{children}</em>; },
                // Horizontal rule
                hr() { return <hr className="border-gray-200 my-2" />; },
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

// ---------------------------------------------------------------------------
// CopyButton — appears on hover, shows a check for 2s after copying
// ---------------------------------------------------------------------------
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard API not available */
        }
    };

    return (
        <button
            onClick={handleCopy}
            title="Copier"
            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500"
        >
            {copied
                ? <Check className="w-3 h-3 text-green-500" />
                : <Copy className="w-3 h-3" />
            }
        </button>
    );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
    const [messages, setMessages] = useState(loadMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');

    // Settings — persisted
    const savedSettings = loadSettings();
    const [backend, setBackend] = useState(savedSettings.backend || 'openrouter');
    const [apiUrl, setApiUrl] = useState(savedSettings.apiUrl || 'https://api.proutgpt.com');
    const [modelName, setModelName] = useState(savedSettings.modelName || OPENROUTER_MODELS[0]);
    const [useStreaming, setUseStreaming] = useState(savedSettings.useStreaming ?? true);

    const [ollamaModels, setOllamaModels] = useState([]);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Persist messages whenever they change
    useEffect(() => {
        saveMessages(messages);
    }, [messages]);

    // Persist settings whenever they change
    useEffect(() => {
        saveSettings({ backend, apiUrl, modelName, useStreaming });
    }, [backend, apiUrl, modelName, useStreaming]);

    // Auto-scroll
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent, scrollToBottom]);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }, [input]);

    // Fetch Ollama models when switching to ollama
    useEffect(() => {
        if (backend === 'ollama') {
            fetchOllamaModels();
        }
    }, [backend, apiUrl]);

    // Reset modelName when backend changes or ollama models arrive
    useEffect(() => {
        if (backend === 'openrouter') {
            if (!OPENROUTER_MODELS.includes(modelName)) {
                setModelName(OPENROUTER_MODELS[0]);
            }
        } else if (backend === 'ollama' && ollamaModels.length > 0) {
            const names = ollamaModels.map(m => m.name);
            if (!names.includes(modelName)) {
                setModelName(ollamaModels[0].name);
            }
        }
    }, [backend, ollamaModels]);

    const fetchOllamaModels = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                setOllamaModels(data.models || []);
            }
        } catch (error) {
            console.error('Error fetching Ollama models:', error);
        }
    };

    // -----------------------------------------------------------------------
    // Clear conversation
    // -----------------------------------------------------------------------
    const clearConversation = () => {
        if (isLoading) {
            abortControllerRef.current?.abort();
            setIsLoading(false);
            setStreamingContent('');
        }
        setMessages([INITIAL_MESSAGE]);
    };

    // -----------------------------------------------------------------------
    // Send message (streaming or non-streaming)
    // -----------------------------------------------------------------------
    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Skip the initial greeting (index 0) — it's UI-only
        const historyWithoutGreeting = messages.slice(1);
        const updatedHistory = [...historyWithoutGreeting, { role: 'user', content: userMessage }];
        const userMessageCount = updatedHistory.filter(m => m.role === 'user').length;

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        setStreamingContent('');

        const endpoint = backend === 'openrouter'
            ? `${OPENROUTER_BASE_URL}/api/openrouter`
            : `${apiUrl}/api/generate`;

        const body = JSON.stringify({
            messages: updatedHistory,
            model: modelName,
            userMessageCount,
            stream: useStreaming && backend === 'openrouter',
        });

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${response.status}`);
            }

            // Streaming path (SSE)
            if (useStreaming && backend === 'openrouter') {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const payload = line.slice(6);
                        if (payload === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(payload);
                            if (parsed.error) throw new Error(parsed.error);
                            if (parsed.token) {
                                accumulated += parsed.token;
                                setStreamingContent(accumulated);
                            }
                        } catch (e) {
                            if (e.message !== 'Unexpected end of JSON input') {
                                console.error('SSE parse error:', e);
                            }
                        }
                    }
                }

                if (accumulated) {
                    setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
                }
                setStreamingContent('');
            } else {
                // Non-streaming path
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Error:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: `😅 Oups! J'ai eu un problème (comme un prout qui rate!). \n\n_Erreur: ${error.message}_\n\nRéessaie!`,
                },
            ]);
            setStreamingContent('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const stopGeneration = () => {
        abortControllerRef.current?.abort();
        if (streamingContent) {
            setMessages(prev => [...prev, { role: 'assistant', content: streamingContent }]);
        }
        setStreamingContent('');
        setIsLoading(false);
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-500">

            {/* ── Header ── */}
            <div className="bg-white shadow-lg p-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="text-4xl select-none">💨</div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 leading-tight">ProutGPT</h1>
                        <p className="text-sm text-gray-500">Le chat bot le plus con du monde!</p>
                    </div>
                </div>

                <div className="flex gap-2 items-center flex-wrap text-xs text-gray-500">

                    {/* Backend selector */}
                    <select
                        value={backend}
                        onChange={(e) => setBackend(e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                    >
                        <option value="openrouter">☁️ OpenRouter</option>
                        <option value="ollama">🏠 Ollama (Local)</option>
                    </select>

                    {/* Ollama settings */}
                    {backend === 'ollama' && (
                        <>
                            <input
                                type="text"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                                className="border rounded px-2 py-1 w-44 text-xs"
                                placeholder="API URL"
                            />
                            <select
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                className="border rounded px-2 py-1 text-xs max-w-[160px]"
                            >
                                {ollamaModels.length > 0 ? (
                                    ollamaModels.map((model) => (
                                        <option key={model.name} value={model.name}>{model.name}</option>
                                    ))
                                ) : (
                                    <option value="">Chargement…</option>
                                )}
                            </select>
                        </>
                    )}

                    {/* OpenRouter model selector */}
                    {backend === 'openrouter' && (
                        <select
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            className="border rounded px-2 py-1 text-xs max-w-[200px]"
                        >
                            {OPENROUTER_MODELS.map((model) => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    )}

                    {/* Streaming toggle (OpenRouter only) */}
                    {backend === 'openrouter' && (
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={useStreaming}
                                onChange={(e) => setUseStreaming(e.target.checked)}
                                className="accent-blue-500"
                            />
                            <span>Streaming</span>
                        </label>
                    )}

                    {/* Clear chat button */}
                    <button
                        onClick={clearConversation}
                        title="Effacer la conversation"
                        className="flex items-center gap-1 border rounded px-2 py-1 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-3 h-3" />
                        <span>Effacer</span>
                    </button>
                </div>
            </div>

            {/* ── Message list ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`relative group max-w-[80%] rounded-2xl px-4 py-3 ${
                                message.role === 'user'
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

                            {message.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none text-gray-800">
                                    <MarkdownMessage content={message.content} />
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            )}

                            {/* Copy button */}
                            <CopyButton text={message.content} />
                        </div>
                    </div>
                ))}

                {/* Live streaming bubble */}
                {isLoading && streamingContent && (
                    <div className="flex justify-start">
                        <div className="relative group max-w-[80%] bg-white text-gray-800 rounded-2xl rounded-bl-none shadow-md px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">💨</span>
                                <span className="font-bold text-sm">ProutGPT</span>
                                <Loader2 className="w-3 h-3 animate-spin text-blue-400 ml-1" />
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-800">
                                <MarkdownMessage content={streamingContent} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Thinking indicator (no streaming content yet) */}
                {isLoading && !streamingContent && (
                    <div className="flex justify-start">
                        <div className="bg-white text-gray-800 rounded-2xl rounded-bl-none shadow-md px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                <span className="text-sm text-gray-500">
                                    ProutGPT réfléchit… {backend === 'openrouter' ? '☁️' : '🏠'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ── */}
            <div className="bg-white border-t p-4">
                <div className="flex gap-2 max-w-4xl mx-auto items-end">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Écris ton message… 💬  (Shift+Entrée pour nouvelle ligne)"
                        rows={1}
                        className="flex-1 border-2 border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800 resize-none overflow-hidden text-sm leading-relaxed"
                        disabled={isLoading}
                        style={{ minHeight: '48px', maxHeight: '160px' }}
                    />

                    {/* Stop / Send button */}
                    {isLoading ? (
                        <button
                            onClick={stopGeneration}
                            title="Arrêter la génération"
                            className="bg-red-400 hover:bg-red-500 text-white rounded-full p-3 transition-colors flex-shrink-0"
                        >
                            <RotateCcw className="w-6 h-6" />
                        </button>
                    ) : (
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim()}
                            title="Envoyer"
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full p-3 transition-colors flex-shrink-0"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-400 mt-2">
                    Vibe codé par Benoît, Gaëlle et Simon Coulombe &nbsp;·&nbsp;
                    {backend === 'ollama'
                        ? `${modelName} 🏠`
                        : `${modelName} ☁️`
                    }
                    &nbsp;·&nbsp; Oracle Cloud Free Tier
                </div>
            </div>
        </div>
    );
}
