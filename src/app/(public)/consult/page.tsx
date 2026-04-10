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
  // Use a stable timestamp for SSR/CSR consistency
  // The actual timestamp will be updated client-side
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。请问有什么可以帮助您的？',
      timestamp: new Date(0), // Stable initial date for hydration
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackToBottom, setShowBackToBottom] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  
  // Refs for scroll control
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  
  // Dynamic bottom padding state
  const [bottomPadding, setBottomPadding] = useState(0);
  
  // Quick questions
  const quickQuestions = [
    { icon: '💰', text: '老板拖欠工资怎么办？' },
    { icon: '📋', text: '劳动合同应该包含哪些内容？' },
    { icon: '⚠️', text: '遭遇工伤如何申请赔偿？' },
    { icon: '⚖️', text: '如何申请法律援助？' },
    { icon: '🔧', text: '加班费怎么计算？' },
    { icon: '🏢', text: '公司不签劳动合同违法吗？' },
  ];

  // --------------------------------------------------------
  // Calculate dynamic bottom padding for message area
  // --------------------------------------------------------
  const calculateBottomPadding = useCallback(() => {
    if (inputAreaRef.current) {
      const inputHeight = inputAreaRef.current.offsetHeight;
      // Add 24px safe margin (16px min + 8px extra)
      const padding = inputHeight + 24;
      setBottomPadding(padding);
    }
  }, []);

  // --------------------------------------------------------
  // Monitor input area height changes
  // --------------------------------------------------------
  useEffect(() => {
    calculateBottomPadding();
    
    const resizeObserver = new ResizeObserver(() => {
      calculateBottomPadding();
    });
    
    if (inputAreaRef.current) {
      resizeObserver.observe(inputAreaRef.current);
    }
    
    // Also observe individual elements that might change height
    const textarea = inputRef.current;
    if (textarea) {
      resizeObserver.observe(textarea);
    }
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateBottomPadding);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateBottomPadding);
    };
  }, [calculateBottomPadding]);

  // --------------------------------------------------------
  // Scroll to bottom with safety margin
  // --------------------------------------------------------
  const scrollToBottom = useCallback((smooth = true) => {
    const container = messagesContainerRef.current;
    const lastMessage = lastMessageRef.current;
    
    if (!container) return;
    
    if (lastMessage) {
      // Scroll to the last message with enough padding
      lastMessage.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    } else {
      // Fallback to simple scroll
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // --------------------------------------------------------
  // Auto-scroll when messages change (only if enabled)
  // --------------------------------------------------------
  useEffect(() => {
    if (autoScrollEnabled) {
      // Small delay to ensure DOM is updated
      const timeout = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [messages.length, scrollToBottom, autoScrollEnabled]);

  // --------------------------------------------------------
  // Continuous scroll during AI streaming
  // --------------------------------------------------------
  useEffect(() => {
    if (!autoScrollEnabled || !isLoading) return;
    
    // Scroll frequently during loading
    const intervalId = setInterval(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [isLoading, autoScrollEnabled, scrollToBottom]);

  // --------------------------------------------------------
  // Scroll event listener - detect if user is near bottom
  // --------------------------------------------------------
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Show button when user is > 150px from bottom
      if (distanceFromBottom > 150) {
        setShowBackToBottom(true);
      } else {
        setShowBackToBottom(false);
        // User is near bottom, re-enable auto-scroll
        if (!autoScrollEnabled) {
          setAutoScrollEnabled(true);
        }
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [autoScrollEnabled]);

  // --------------------------------------------------------
  // Back to bottom handler
  // --------------------------------------------------------
  const handleBackToBottom = useCallback(() => {
    scrollToBottom(true);
    setShowBackToBottom(false);
  }, [scrollToBottom]);

  // --------------------------------------------------------
  // Quick question handler
  // --------------------------------------------------------
  const handleQuickQuestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // --------------------------------------------------------
  // Submit handler
  // --------------------------------------------------------
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setShowBackToBottom(false);
    setAutoScrollEnabled(true);

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

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

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

    // Scroll to show new user message
    setTimeout(() => scrollToBottom(true), 100);

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
                  if (autoScrollEnabled) {
                    scrollToBottom(true);
                  }
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
      scrollToBottom(true);
    }
  };

  // --------------------------------------------------------
  // Handle textarea input with auto-resize
  // --------------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // --------------------------------------------------------
  // Handle Enter key
  // --------------------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // --------------------------------------------------------
  // Cancel handler
  // --------------------------------------------------------
  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div 
      className="h-[100dvh] flex flex-col bg-gradient-to-b from-slate-50/50 to-white selection-primary overflow-hidden"
      style={{ contain: 'layout' }}
    >
      {/* Header - Fixed at top */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200/50 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">智能法律咨询</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">AI助手 · 专业解答</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages Area - Independent Scroll */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          paddingBottom: `${bottomPadding}px`,
          contain: 'layout style',
        }}
      >
        <div ref={messagesListRef} className="container mx-auto max-w-3xl px-4 py-4 sm:py-6">
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isStreaming = isLoading && msg.role === 'assistant' && msg.id === messages[messages.length - 1]?.id && msg.content === '';
              const isLastMessage = index === messages.length - 1;
              
              return (
                <div
                  key={msg.id}
                  ref={isLastMessage ? lastMessageRef : null}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`flex gap-2 sm:gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className={`rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-white/90 text-foreground border border-slate-200/50 shadow-sm'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="text-sm leading-relaxed">
                            <MarkdownRenderer content={msg.content} isStreaming={isStreaming} />
                            {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse" />}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm break-words">{msg.content}</p>
                        )}
                      </div>
                      
                      {msg.role === 'assistant' && msg.legalReferences && msg.legalReferences.length > 0 && (
                        <div className="px-1">
                          <div className="text-[10px] sm:text-[11px] text-gray-400">
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
                      
                      <span className={`text-[10px] sm:text-[11px] text-gray-400 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                        {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.content !== '' && (
              <div className="flex justify-start">
                <div className="flex gap-2 sm:gap-3 max-w-[85%]">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white/90 text-foreground border border-slate-200/50 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span>思考中...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs sm:text-sm">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
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
          className="fixed bottom-[140px] sm:bottom-[160px] right-4 sm:right-6 z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
          aria-label="滚动到底部"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}

      {/* Fixed Bottom Input Area */}
      <div 
        ref={inputAreaRef}
        className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200/50 z-40 safe-area-bottom"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        <div className="container mx-auto max-w-3xl px-3 sm:px-4 py-2 sm:py-3">
          
          {/* Quick Questions - Horizontally Scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-3 scrollbar-hide mb-2 sm:mb-3 -mx-1 px-1">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(q.text)}
                disabled={isLoading}
                className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-[11px] sm:text-xs text-slate-700 flex items-center gap-1 sm:gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm">{q.icon}</span>
                <span className="whitespace-nowrap max-w-[120px] sm:max-w-[150px] truncate">
                  {q.text.length > 12 ? q.text.slice(0, 12) + '...' : q.text}
                </span>
              </button>
            ))}
          </div>
          
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入您的法律问题..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white/90 px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all"
                rows={1}
                style={{ 
                  maxHeight: '120px',
                  minHeight: '44px',
                  height: 'auto',
                }}
                disabled={isLoading}
              />
              {isLoading && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-full hover:bg-red-50 transition-colors"
                >
                  取消
                </button>
              )}
            </div>
            <Button 
              type="submit" 
              size="icon"
              disabled={isLoading || !input.trim()}
              className="shrink-0 h-11 w-11 sm:h-12 sm:w-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </form>
          
          {/* Disclaimer */}
          <p className="text-[9px] sm:text-[10px] text-center text-gray-400 mt-2 px-2">
            AI辅助建议仅供参考，具体法律问题请咨询专业律师
          </p>
        </div>
      </div>

      {/* CSS for hiding scrollbar but keeping functionality */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Ensure proper bounce on iOS */
        .overscroll-contain {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        
        /* Safe area padding for notched devices */
        .safe-area-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 8px);
        }
      `}</style>
    </div>
  );
}
