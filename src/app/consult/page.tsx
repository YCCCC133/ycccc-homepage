'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  legalReferences?: Array<{
    name: string;
    fullName: string;
    url: string;
  }>;
}

export default function ConsultPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。请问有什么可以帮助您的？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackToBottom, setShowBackToBottom] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true); // 是否启用自动滚动
  const [userStoppedScroll, setUserStoppedScroll] = useState(false); // 用户是否手动停止了自动滚动
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --------------------------------------------------------
  // 滚动到底部
  // --------------------------------------------------------
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  // --------------------------------------------------------
  // 消息变化时滚动（仅当自动滚动启用时）
  // --------------------------------------------------------
  useEffect(() => {
    if (!autoScrollEnabled) return;
    scrollToBottom();
  }, [messages.length, scrollToBottom, autoScrollEnabled]);

  // --------------------------------------------------------
  // AI加载时持续滚动（仅当自动滚动启用时）
  // --------------------------------------------------------
  useEffect(() => {
    if (!autoScrollEnabled || !isLoading) return;
    const id = setInterval(scrollToBottom, 100);
    return () => clearInterval(id);
  }, [isLoading, scrollToBottom, autoScrollEnabled]);

  // --------------------------------------------------------
  // 滚动事件监听 - 只显示/隐藏按钮，不停止自动滚动
  // --------------------------------------------------------
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // 只显示/隐藏按钮，不改变 autoScrollEnabled
      if (distanceFromBottom > 150) {
        setShowBackToBottom(true);
      } else {
        setShowBackToBottom(false);
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // --------------------------------------------------------
  // 点击回到底部按钮 - 停止自动滚动
  // --------------------------------------------------------
  const handleBackToBottom = useCallback(() => {
    scrollToBottom();
    setShowBackToBottom(false);
    setAutoScrollEnabled(false); // 停止自动滚动
    setUserStoppedScroll(true); // 标记用户手动停止了
  }, [scrollToBottom]);

  const quickQuestions = [
    { icon: '💰', text: '老板拖欠工资怎么办？' },
    { icon: '📋', text: '劳动合同应该包含哪些内容？' },
    { icon: '⚠️', text: '遭遇工伤如何申请赔偿？' },
    { icon: '⚖️', text: '如何申请法律援助？' },
    { icon: '🔧', text: '加班费怎么计算？' },
    { icon: '🏢', text: '公司不签劳动合同违法吗？' },
  ];

  const handleQuickQuestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setShowBackToBottom(false);
    setAutoScrollEnabled(true); // 用户发送消息，恢复自动滚动
    setUserStoppedScroll(false); // 重置用户停止标记

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = '';
    let legalRefs: Message['legalReferences'] = [];

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .filter((m) => m.id !== 'welcome')
            .concat([userMessage])
            .map((m) => ({ role: m.role, content: m.content })),
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

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                if (parsed.legalReferences) {
                  legalRefs = parsed.legalReferences;
                }
                
                const now = Date.now();
                if (now - lastUpdate > 50) {
                  lastUpdate = now;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
                    )
                  );
                  scrollToBottom();
                }
              }
            } catch {}
          }
        }
      }
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, content: assistantContent, legalReferences: legalRefs } : msg
        )
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: msg.content || '请求已取消' } : msg
          )
        );
      } else {
        setError('咨询失败，请稍后重试');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: '抱歉，服务暂时不可用，请稍后重试。' } : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      scrollToBottom();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/50 to-white selection-primary flex flex-col">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-md shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">智能法律咨询</h1>
              <p className="text-xs text-muted-foreground">AI助手 · 专业解答</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="container mx-auto max-w-3xl space-y-4">
            <div className="space-y-4 pb-4">
              {messages.map((msg) => {
                const isStreaming = isLoading && msg.role === 'assistant' && msg.content === '';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        msg.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                      }`}>
                        {msg.role === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className={`rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-white/80 text-foreground border border-slate-200/50 shadow-sm'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="text-sm leading-relaxed">
                              <MarkdownRenderer content={msg.content} isStreaming={isStreaming} />
                              {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse" />}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          )}
                        </div>
                        
                        {msg.role === 'assistant' && msg.legalReferences && msg.legalReferences.length > 0 && (
                          <div className="px-1">
                            <div className="text-[10px] text-gray-400">
                              <span className="mr-1">📖 参考：</span>
                              {msg.legalReferences.map((ref, i) => (
                                <span key={i}>
                                  {i > 0 && <span className="mx-1">·</span>}
                                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 underline">
                                    {ref.name}
                                  </a>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <span className={`text-[10px] text-gray-400 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                          {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white/80 text-foreground border border-slate-200/50 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>思考中...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to bottom button */}
        {showBackToBottom && (
          <button
            onClick={handleBackToBottom}
            className="fixed bottom-[180px] right-6 z-50 w-12 h-12 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 flex items-center justify-center transition-all"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}

        {/* Fixed Bottom Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-sm border-t border-slate-200/50 z-50">
          <div className="container mx-auto max-w-3xl px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q.text)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 flex items-center gap-1.5"
                >
                  <span>{q.icon}</span>
                  <span>{q.text.slice(0, 12)}...</span>
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入您的法律问题..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                  rows={1}
                  style={{ maxHeight: '120px' }}
                  disabled={isLoading}
                />
                {isLoading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500 hover:text-red-600"
                  >
                    取消
                  </button>
                )}
              </div>
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            
            <p className="text-[10px] text-center text-gray-400 mt-2">
              AI辅助建议仅供参考，具体法律问题请咨询专业律师
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
