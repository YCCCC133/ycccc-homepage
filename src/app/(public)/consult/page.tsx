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
  const [mounted, setMounted] = useState(false);
  
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。请问有什么可以帮助您的？',
      timestamp: Date.now(),
    }]);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      scrollToBottom();
    }
  }, [messages, mounted, scrollToBottom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

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

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }]);

    setTimeout(scrollToBottom, 100);

    abortControllerRef.current = new AbortController();
    let fullContent = '';
    let references: Message['legalReferences'] = [];

    try {
      const response = await fetch('/api/consult', {
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

      if (!response.ok) throw new Error('网络请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('无法读取响应');

      let lastUpdate = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                if (parsed.legalReferences) {
                  references = parsed.legalReferences;
                }
                
                const now = Date.now();
                if (now - lastUpdate > 50) {
                  lastUpdate = now;
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullContent, legalReferences: references }
                        : msg
                    )
                  );
                  scrollToBottom();
                }
              }
            } catch {}
          }
        }
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: fullContent, legalReferences: references }
            : msg
        )
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content || '请求已取消' }
              : msg
          )
        );
      } else {
        setError('咨询失败，请稍后重试');
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: '抱歉，服务暂时不可用，请稍后重试。' }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      scrollToBottom();
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* 头部 */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">智能法律咨询</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 消息区域 */}
      <div 
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-4 py-6 pb-40"
        style={{ 
          maxWidth: '768px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* 欢迎提示 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-700 text-sm border border-emerald-100">
            <Sparkles className="h-4 w-4" />
            <span>护薪平台法律助手</span>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="space-y-6">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLastAssistant = msg.role === 'assistant' && index === messages.length - 1;
            const showStreaming = isStreaming && isLastAssistant;
            
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* 头像 */}
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isUser 
                    ? 'bg-slate-600' 
                    : 'bg-emerald-500'
                }`}>
                  {isUser ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* 消息内容 */}
                <div className={`flex flex-col gap-0.5 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* 气泡 */}
                  <div className={`px-4 py-2.5 text-sm ${
                    isUser
                      ? 'bg-emerald-500 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm'
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="leading-relaxed">
                        <MarkdownRenderer content={msg.content} isStreaming={showStreaming} />
                        {showStreaming && (
                          <span className="inline-block w-1 h-4 ml-0.5 bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* 法律参考 */}
                  {!isUser && msg.legalReferences && msg.legalReferences.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {msg.legalReferences.slice(0, 2).map((ref, i) => (
                        <a
                          key={i}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                        >
                          {ref.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 加载状态 */}
        {isLoading && !isStreaming && (
          <div className="flex gap-3 mt-6">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">正在思考...</span>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 - 固定底部 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t border-slate-200 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* 快捷问题 */}
          {messages.length <= 2 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickQuestion(q.text)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 text-xs transition-colors disabled:opacity-50"
                >
                  <span>{q.icon}</span>
                  <span className="whitespace-nowrap">{q.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* 输入框 */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入您的法律问题..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 focus:bg-white transition-all"
                rows={1}
                style={{ 
                  maxHeight: '120px',
                  minHeight: '48px',
                  height: 'auto',
                }}
                disabled={isLoading}
              />
              {isLoading && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-full"
                >
                  <X className="h-3 w-3" />
                  取消
                </button>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="shrink-0 h-12 w-12 bg-emerald-500 hover:bg-emerald-600 rounded-xl disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
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
