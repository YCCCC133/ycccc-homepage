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

// 快速问题配置
const quickQuestions = [
  { icon: '💰', text: '老板拖欠工资' },
  { icon: '📋', text: '劳动合同内容' },
  { icon: '⚠️', text: '工伤如何赔偿' },
  { icon: '⚖️', text: '申请法律援助' },
  { icon: '🔧', text: '加班费计算' },
  { icon: '🏢', text: '不签合同违法' },
];

export default function ConsultPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。请问有什么可以帮助您的？',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputAreaHeight, setInputAreaHeight] = useState(140);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 测量输入区域高度
  useEffect(() => {
    const updateHeight = () => {
      if (inputAreaRef.current) {
        const height = inputAreaRef.current.offsetHeight;
        setInputAreaHeight(height);
      }
    };
    
    updateHeight();
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateHeight);
    
    // 监听输入区域内容变化
    const observer = new ResizeObserver(updateHeight);
    if (inputAreaRef.current) {
      observer.observe(inputAreaRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      observer.disconnect();
    };
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    });
  }, []);

  // 消息变化时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // 自动调整高度
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  };

  // 提交处理
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);
    setIsLoading(true);

    // 添加用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // 重置输入框高度
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    // 创建助手消息占位
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    // 立即滚动
    setTimeout(() => scrollToBottom(), 100);

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
                if (now - lastUpdate > 30) {
                  lastUpdate = now;
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullContent, legalReferences: references }
                        : msg
                    )
                  );
                  scrollToBottom(false);
                }
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 最终更新
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

  // 取消处理
  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 快捷问题
  const handleQuickQuestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // 计算消息区域样式
  const headerHeight = 64; // 头部高度
  const bottomPadding = inputAreaHeight + 16; // 输入区域高度 + 安全边距

  return (
    <div className="h-dvh flex flex-col bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* 头部 */}
      <header className="shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">智能法律咨询</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                AI助手在线
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 消息区域 */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          paddingBottom: `${bottomPadding}px`,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* 欢迎卡片 */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full border border-emerald-100 text-emerald-700 text-sm font-medium shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>护薪平台法律助手</span>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isStreaming = isLoading && msg.id === messages[messages.length - 1].id && msg.content === '';
              
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* 头像 */}
                  <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                    isUser 
                      ? 'bg-gradient-to-br from-slate-600 to-slate-700' 
                      : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                  }`}>
                    {isUser ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* 气泡 */}
                    <div className={`px-4 py-3 rounded-2xl ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-br-sm shadow-lg shadow-emerald-500/20'
                        : 'bg-white text-slate-800 border border-slate-200/60 rounded-bl-sm shadow-sm'
                    }`}>
                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="text-sm leading-relaxed">
                          <MarkdownRenderer content={msg.content} isStreaming={isStreaming} />
                          {isStreaming && (
                            <span className="inline-block w-1.5 h-4 ml-0.5 bg-emerald-500 animate-pulse rounded" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* 法律参考 */}
                    {!isUser && msg.legalReferences && msg.legalReferences.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {msg.legalReferences.slice(0, 2).map((ref, i) => (
                          <a
                            key={i}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                          >
                            {ref.name}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* 时间戳 */}
                    <span className="text-[10px] text-slate-400 px-1">
                      {msg.id === 'welcome' 
                        ? '' 
                        : new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex gap-3 mt-6">
              <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">正在思考...</span>
                </div>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-full text-sm border border-red-100">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* 底部锚点 */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* 输入区域 - 固定在底部 */}
      <div 
        ref={inputAreaRef}
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 z-30"
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* 快捷问题 - 仅在开始时显示 */}
          {messages.length <= 2 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1 scrollbar-none">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q.text)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{q.icon}</span>
                  <span className="whitespace-nowrap">{q.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* 输入表单 */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入您的法律问题..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-14 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 focus:bg-white transition-all"
                rows={1}
                style={{ 
                  maxHeight: '100px',
                  minHeight: '48px',
                  height: 'auto',
                }}
                disabled={isLoading}
              />
              {/* 取消按钮 */}
              {isLoading && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="h-3 w-3" />
                  取消
                </button>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="shrink-0 h-12 w-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 rounded-xl transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>

          {/* 免责声明 */}
          <p className="text-center text-[10px] text-slate-400 mt-2">
            AI辅助建议仅供参考，具体法律问题请咨询专业律师
          </p>
        </div>
      </div>

      {/* 全局样式 */}
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
