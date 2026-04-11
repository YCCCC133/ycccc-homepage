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
  const [isReady, setIsReady] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 客户端初始化
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。请问有什么可以帮助您的？',
      timestamp: Date.now(),
    }]);
    setIsReady(true);
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, []);

  // 消息更新时滚动
  useEffect(() => {
    if (isReady) {
      setTimeout(scrollToBottom, 0);
    }
  }, [messages, isReady, scrollToBottom]);

  // 输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // 提交处理
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const assistantId = `asst-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }]);

    setTimeout(scrollToBottom, 50);

    abortControllerRef.current = new AbortController();
    let fullContent = '';
    let refs: Message['legalReferences'] = [];

    try {
      const res = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .filter(m => m.id !== 'welcome')
            .concat([userMessage])
            .map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error('请求失败');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应');
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
                if (now - lastUpdate > 50) {
                  lastUpdate = now;
                  setMessages(prev => prev.map(m => 
                    m.id === assistantId ? { ...m, content: fullContent, legalReferences: refs } : m
                  ));
                  scrollToBottom();
                }
              }
            } catch {}
          }
        }
      }

      setMessages(prev => prev.map(m => 
        m.id === assistantId ? { ...m, content: fullContent, legalReferences: refs } : m
      ));
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { ...m, content: m.content || '请求已取消' } : m
        ));
      } else {
        setError('咨询失败，请稍后重试');
        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { ...m, content: '抱歉，服务暂时不可用。' } : m
        ));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      scrollToBottom();
    }
  };

  const handleCancel = () => abortControllerRef.current?.abort();

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

  const lastMsg = messages[messages.length - 1];
  const isStreaming = isLoading && lastMsg?.role === 'assistant' && lastMsg?.content === '';

  if (!isReady) {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="w-full shrink-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">智能法律咨询</h1>
            <p className="text-xs text-slate-500">随时为您解答</p>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="w-full flex-1 overflow-y-auto relative">
        <div className="max-w-2xl mx-auto px-4 py-6 pb-36">
          {/* Welcome */}
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">
              <Sparkles className="w-4 h-4" />
              护薪平台法律助手
            </span>
          </div>

          {/* Messages */}
          <div className="space-y-5">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isLastAsst = msg.role === 'assistant' && idx === messages.length - 1;
              const streaming = isStreaming && isLastAsst;

              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUser ? 'bg-slate-600' : 'bg-emerald-500'
                  }`}>
                    {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 text-sm ${
                      isUser 
                        ? 'bg-emerald-500 text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm'
                    }`}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div>
                          <MarkdownRenderer content={msg.content} isStreaming={streaming} />
                          {streaming && <span className="inline-block w-1 h-4 ml-0.5 bg-emerald-500 animate-pulse" />}
                        </div>
                      )}
                    </div>
                    {!isUser && msg.legalReferences && msg.legalReferences.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {msg.legalReferences.slice(0, 2).map((r, i) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                            {r.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Loading */}
          {isLoading && !isStreaming && (
            <div className="flex gap-3 mt-5">
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
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 rounded-full">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="w-full shrink-0 bg-white border-t border-slate-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
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

          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入您的法律问题..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-16 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 focus:bg-white transition-all"
                rows={1}
                style={{ maxHeight: '120px', minHeight: '48px', height: 'auto' }}
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
