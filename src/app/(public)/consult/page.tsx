'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  legalReferences?: Array<{ name: string; fullName: string; url: string }>;
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
  const [isClient, setIsClient] = useState(false);
  const [inputHeight, setInputHeight] = useState(120);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。请问有什么可以帮助您的？',
      timestamp: 0,
    }]);
  }, []);

  // 监听输入区域高度变化
  useEffect(() => {
    if (!isClient) return;
    
    const updateHeight = () => {
      if (inputAreaRef.current) {
        setInputHeight(inputAreaRef.current.offsetHeight);
      }
    };
    
    updateHeight();
    
    const observer = new ResizeObserver(updateHeight);
    if (inputAreaRef.current) {
      observer.observe(inputAreaRef.current);
    }
    
    return () => observer.disconnect();
  }, [isClient]);

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      scrollToBottom();
    }
  }, [messages, isClient, scrollToBottom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const asstId = `a-${Date.now()}`;
    setMessages(m => [...m, { id: asstId, role: 'assistant', content: '', timestamp: Date.now() }]);

    setTimeout(scrollToBottom, 50);

    abortRef.current = new AbortController();
    let fullContent = '';
    let refs: Message['legalReferences'] = [];

    try {
      const res = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.filter(m => m.id !== 'init').concat([userMsg]).map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('请求失败');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('读取失败');
      const decoder = new TextDecoder();
      let lastUpdate = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                if (parsed.legalReferences) refs = parsed.legalReferences;
                const now = Date.now();
                if (now - lastUpdate > 30) {
                  lastUpdate = now;
                  setMessages(m => m.map(x => x.id === asstId ? { ...x, content: fullContent, legalReferences: refs } : x));
                  scrollToBottom();
                }
              }
            } catch {}
          }
        }
      }

      setMessages(m => m.map(x => x.id === asstId ? { ...x, content: fullContent, legalReferences: refs } : x));
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
      scrollToBottom();
    }
  };

  const handleCancel = () => abortRef.current?.abort();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickQuestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const lastMessage = messages[messages.length - 1];
  const isStreaming = isLoading && lastMessage?.role === 'assistant' && lastMessage?.content === '';

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex flex-col bg-white overflow-hidden"
    >
      {/* Header */}
      <header 
        ref={headerRef}
        className="shrink-0 px-4 py-3 border-b border-slate-200 bg-white"
      >
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">智能法律咨询</h1>
            <p className="text-xs text-slate-500">随时为您解答</p>
          </div>
        </div>
      </header>

      {/* Messages Area - 使用flex-1占据剩余空间 */}
      <div 
        ref={messagesRef}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="max-w-xl mx-auto px-4 py-4 pb-4">
          {/* Welcome */}
          <div className="text-center mb-6 pt-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">
              <Sparkles className="w-4 h-4" />
              护薪平台法律助手
            </span>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isLast = msg.id === lastMessage?.id;
            const showCursor = isStreaming && isLast;

            return (
              <div key={msg.id} className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-slate-600' : 'bg-emerald-500'}`}>
                  {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`flex-1 min-w-0 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                    isUser 
                      ? 'bg-emerald-500 text-white rounded-tr-sm' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
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
                      {msg.legalReferences.slice(0, 2).map((ref, i) => (
                        <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {ref.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading */}
          {isLoading && !isStreaming && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 rounded-full">
                <AlertCircle className="w-4 h-4" />
                {error}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div 
        ref={inputAreaRef}
        className="shrink-0 bg-white border-t border-slate-200"
      >
        <div className="max-w-xl mx-auto px-4 py-3">
          {messages.length <= 2 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
              {quickQuestions.map((q, i) => (
                <button key={i} type="button" onClick={() => handleQuickQuestion(q.text)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors disabled:opacity-50">
                  <span>{q.icon}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入您的法律问题..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors"
                rows={1}
                style={{ maxHeight: 100, minHeight: 48, height: 'auto' }}
                disabled={isLoading}
              />
              {isLoading && (
                <button type="button" onClick={handleCancel}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-full">
                  <X className="w-3 h-3" />
                  取消
                </button>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !input.trim()}
              className="shrink-0 h-12 w-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl">
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
