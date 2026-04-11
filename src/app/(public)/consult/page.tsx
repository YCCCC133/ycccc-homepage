'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  legalReferences?: Array<{
    name: string;
    fullName: string;
    url: string;
  }>;
}

const quickQuestions = [
  { icon: '💰', text: '老板拖欠工资' },
  { icon: '📋', text: '劳动合同内容' },
  { icon: '⚠️', text: '工伤如何赔偿' },
  { icon: '⚖️', text: '申请法律援助' },
  { icon: '🔧', text: '加班费计算' },
  { icon: '🏢', text: '不签合同违法' },
];

export default function ConsultPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。请问有什么可以帮助您的？',
      timestamp: Date.now(),
    }]);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, ready]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(m => [...m, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const asstId = `a-${Date.now()}`;
    setMessages(m => [...m, { id: asstId, role: 'assistant', content: '', timestamp: Date.now() }]);

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    abortRef.current = new AbortController();
    let content = '';
    let refs: Message['legalReferences'] = [];

    try {
      const res = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.filter(m => m.id !== 'welcome').concat([userMsg]).map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('请求失败');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('读取失败');
      const dec = new TextDecoder();
      let last = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = dec.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const p = JSON.parse(data);
              if (p.content) {
                content += p.content;
                if (p.legalReferences) refs = p.legalReferences;
                const now = Date.now();
                if (now - last > 30) {
                  last = now;
                  setMessages(m => m.map(x => x.id === asstId ? { ...x, content, legalReferences: refs } : x));
                  setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 0);
                }
              }
            } catch {}
          }
        }
      }

      setMessages(m => m.map(x => x.id === asstId ? { ...x, content, legalReferences: refs } : x));
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages(m => m.map(x => x.id === asstId ? { ...x, content: x.content || '请求已取消' } : x));
      } else {
        setError('咨询失败，请稍后重试');
        setMessages(m => m.map(x => x.id === asstId ? { ...x, content: '抱歉，服务暂时不可用。' } : x));
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancel = () => abortRef.current?.abort();

  const keyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const quick = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const lastMsg = messages[messages.length - 1];
  const streaming = isLoading && lastMsg?.role === 'assistant' && lastMsg?.content === '';

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex-none px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">智能法律咨询</h1>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">
              <Sparkles className="w-4 h-4" />
              护薪平台法律助手
            </span>
          </div>

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isLast = msg.id === lastMsg?.id;
            const showCursor = streaming && isLast;

            return (
              <div key={msg.id} className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-slate-600' : 'bg-emerald-500'}`}>
                  {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`flex-1 min-w-0 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm text-left ${
                    isUser ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div>
                        <MarkdownRenderer content={msg.content} isStreaming={showCursor} />
                        {showCursor && <span className="inline-block w-1 h-4 ml-0.5 bg-emerald-500 animate-pulse" />}
                      </div>
                    )}
                  </div>
                  {!isUser && msg.legalReferences && msg.legalReferences.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {msg.legalReferences.slice(0, 2).map((r, i) => (
                        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {r.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && !streaming && (
            <div className="flex gap-3 mb-4">
              <div className="flex-none w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="inline-block px-4 py-2.5 rounded-2xl rounded-tl-sm bg-slate-100">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 rounded-full">
                <AlertCircle className="w-4 h-4" />
                {error}
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-none bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {messages.length <= 2 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
              {quickQuestions.map((q, i) => (
                <button key={i} type="button" onClick={() => quick(q.text)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors disabled:opacity-50">
                  <span>{q.icon}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={keyDown}
                placeholder="输入您的法律问题..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-colors"
                rows={1}
                style={{ maxHeight: 100, minHeight: 48, height: 'auto' }}
                disabled={isLoading}
              />
              {isLoading && (
                <button type="button" onClick={cancel}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-full">
                  <X className="w-3 h-3" />
                  取消
                </button>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !input.trim()}
              className="flex-none h-12 w-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-2">
            AI辅助建议仅供参考，具体法律问题请咨询专业律师
          </p>
        </div>
      </div>
    </div>
  );
}
