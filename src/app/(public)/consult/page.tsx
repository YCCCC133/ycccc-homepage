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
  const [clientReady, setClientReady] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。请问有什么可以帮助您的？',
      timestamp: 0,
    }]);
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (clientReady && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, clientReady]);

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

    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);

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
                  if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  if (!clientReady) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {/* Header */}
      <header style={{ flexShrink: 0, padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '672px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot style={{ width: '20px', height: '20px', color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>智能法律咨询</h1>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ maxWidth: '672px', margin: '0 auto', padding: '16px 16px 140px' }}>
          {/* Welcome */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', color: '#047857', backgroundColor: '#ecfdf5', borderRadius: '9999px', border: '1px solid #d1fae5' }}>
              <Sparkles style={{ width: '16px', height: '16px' }} />
              护薪平台法律助手
            </span>
          </div>

          {/* Message List */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isLast = msg.id === lastMessage?.id;
            const showCursor = isStreaming && isLast;

            return (
              <div key={msg.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  backgroundColor: isUser ? '#475569' : '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  {isUser ? <User style={{ width: '16px', height: '16px', color: '#fff' }} /> : <Bot style={{ width: '16px', height: '16px', color: '#fff' }} />}
                </div>

                {/* Content */}
                <div style={{ maxWidth: '80%', textAlign: isUser ? 'right' : 'left' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '10px 16px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '14px',
                    backgroundColor: isUser ? '#10b981' : '#f1f5f9',
                    color: isUser ? '#fff' : '#334155',
                    textAlign: 'left'
                  }}>
                    {isUser ? (
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.content}</p>
                    ) : (
                      <div style={{ lineHeight: 1.6 }}>
                        <MarkdownRenderer content={msg.content} isStreaming={showCursor} />
                        {showCursor && <span style={{ display: 'inline-block', width: '2px', height: '16px', marginLeft: '2px', backgroundColor: '#10b981', animation: 'pulse 1s infinite' }} />}
                      </div>
                    )}
                  </div>
                  
                  {/* Legal References */}
                  {!isUser && msg.legalReferences && msg.legalReferences.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {msg.legalReferences.slice(0, 2).map((ref, i) => (
                        <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '9999px', textDecoration: 'none' }}>
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
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot style={{ width: '16px', height: '16px', color: '#fff' }} />
              </div>
              <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', backgroundColor: '#f1f5f9' }}>
                <Loader2 style={{ width: '16px', height: '16px', color: '#64748b', animation: 'spin 1s linear infinite' }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '9999px' }}>
                <AlertCircle style={{ width: '16px', height: '16px' }} />
                {error}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', zIndex: 10 }}>
        <div style={{ maxWidth: '672px', margin: '0 auto', padding: '12px 16px' }}>
          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px', marginLeft: '-4px', marginRight: '-4px', paddingLeft: '4px', paddingRight: '4px' }}>
              {quickQuestions.map((q, i) => (
                <button key={i} type="button" onClick={() => handleQuickQuestion(q.text)}
                  disabled={isLoading}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', borderRadius: '9999px', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', opacity: isLoading ? 0.5 : 1 }}>
                  <span>{q.icon}</span>
                  <span style={{ color: '#475569' }}>{q.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入您的法律问题..."
                style={{ 
                  width: '100%', resize: 'none', borderRadius: '12px', border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc', padding: '12px 48px 12px 16px', fontSize: '14px',
                  outline: 'none', maxHeight: '100px', minHeight: '48px', height: 'auto', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}
                rows={1}
                disabled={isLoading}
              />
              {isLoading && (
                <button type="button" onClick={handleCancel}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '9999px' }}>
                  <X style={{ width: '12px', height: '12px' }} />
                  取消
                </button>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !input.trim()}
              style={{ flexShrink: 0, width: '48px', height: '48px', backgroundColor: isLoading || !input.trim() ? '#9ca3af' : '#10b981', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              {isLoading ? <Loader2 style={{ width: '20px', height: '20px', color: '#fff', animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: '20px', height: '20px', color: '#fff' }} />}
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>
            AI辅助建议仅供参考，具体法律问题请咨询专业律师
          </p>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
