'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function CosmicAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m Zenith, your cosmic intelligence assistant. Ask me anything about the sky, satellites, or celestial events above any location.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }],
          page: pathname,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection to cosmic network interrupted. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 h-[420px] flex flex-col rounded-2xl border border-cyan-500/30 bg-[#060d1f]/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-[#0a1628]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔭</span>
                <span className="text-cyan-400 font-bold text-sm tracking-wide">ZENITH AI</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600/80 text-white rounded-br-none'
                      : 'bg-[#0d1e3a] text-gray-200 border border-cyan-500/10 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#0d1e3a] border border-cyan-500/10 px-3 py-2 rounded-xl rounded-bl-none text-cyan-400 text-sm">
                    <span className="animate-pulse">Scanning cosmos...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-cyan-500/20 bg-[#0a1628] flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about the cosmos..."
                className="flex-1 bg-[#060d1f] border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/60 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded-xl text-white text-sm font-medium transition-colors"
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-4 py-3 bg-[#0a1628] border border-cyan-500/40 hover:border-cyan-500/80 rounded-2xl text-cyan-400 hover:text-cyan-300 shadow-lg shadow-cyan-500/10 transition-all duration-200 group"
      >
        <span className="text-lg">🔭</span>
        <span className="text-sm font-semibold tracking-wide">Ask Zenith</span>
      </button>
    </div>
  );
}
