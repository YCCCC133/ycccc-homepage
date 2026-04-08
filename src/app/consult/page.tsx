'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, BookOpen } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickQuestion {
  icon: string;
  text: string;
}

// 滚动配置
const SCROLL_CONFIG = {
  // 非线性插值曲线 (cubic-bezier approximation)
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  
  // 滚动速度参数
  baseDuration: 400,        // 基础动画时长 (ms)
  minDuration: 200,        // 最小动画时长 (ms)
  maxDuration: 800,        // 最大动画时长 (ms)
  
  // 文本匹配参数
  charsPerSecond: 30,       // 假设阅读速度
  scrollThreshold: 0.85,    // 滚动触发阈值 (视口高度的85%)
};

// 自定义滚动函数，使用非线性插值
function smoothScrollTo(
  container: HTMLElement,
  targetTop: number,
  duration: number,
  easeFn: (t: number) => number
): () => void {
  const startTop = container.scrollTop;
  const distance = targetTop - startTop;
  const startTime = performance.now();
  
  let animationId: number;
  let cancelled = false;
  
  const cancel = () => {
    cancelled = true;
    if (animationId) cancelAnimationFrame(animationId);
  };
  
  const animate = (currentTime: number) => {
    if (cancelled) return;
    
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeFn(progress);
    
    container.scrollTop = startTop + distance * easedProgress;
    
    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  };
  
  animationId = requestAnimationFrame(animate);
  return cancel;
}

export default function ConsultPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。\n\n请问有什么可以帮助您的？您可以：\n• 咨询劳动合同相关问题\n• 了解工资拖欠维权途径\n• 询问工伤赔偿标准\n• 申请法律援助条件\n• 其他劳动权益问题',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 滚动取消函数引用
  const scrollCancelRef = useRef<(() => void) | null>(null);
  
  // 用户交互状态
  const userInteractingRef = useRef(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 检测用户主动滚动
  const handleUserScroll = useCallback(() => {
    userInteractingRef.current = true;
    setIsUserScrolling(true);
    
    // 取消当前滚动动画
    if (scrollCancelRef.current) {
      scrollCancelRef.current();
      scrollCancelRef.current = null;
    }
    
    // 清除之前的timeout
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    
    // 用户停止滚动后，恢复自动滚动
    userScrollTimeoutRef.current = setTimeout(() => {
      userInteractingRef.current = false;
      setIsUserScrolling(false);
    }, 1500); // 1.5秒后恢复自动滚动
  }, []);

  // 监听用户交互事件
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const events = ['wheel', 'touchstart', 'touchmove', 'mousedown', 'keydown'];
    
    const handleInteraction = () => {
      userInteractingRef.current = true;
      setIsUserScrolling(true);
      
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      
      userScrollTimeoutRef.current = setTimeout(() => {
        userInteractingRef.current = false;
        setIsUserScrolling(false);
      }, 2000); // 2秒后恢复
    };

    events.forEach(event => {
      container.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        container.removeEventListener(event, handleInteraction);
      });
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // 智能滚动到底部
  const smartScrollToBottom = useCallback((contentLength: number) => {
    const container = messagesContainerRef.current;
    const endRef = messagesEndRef.current;
    
    if (!container || !endRef || userInteractingRef.current) return;
    
    // 检查是否已经在视口底部
    const containerRect = container.getBoundingClientRect();
    const containerBottom = containerRect.bottom;
    const viewportHeight = window.innerHeight;
    
    // 计算元素是否在可见范围内
    const endRect = endRef.getBoundingClientRect();
    const isNearBottom = endRect.top < viewportHeight * SCROLL_CONFIG.scrollThreshold;
    
    // 如果内容已经可见，不需要滚动
    if (isNearBottom && contentLength > 0) {
      const distance = Math.abs(endRect.top - containerBottom + container.clientTop);
      
      // 如果距离太近，跳过滚动
      if (distance < 50) return;
    }
    
    // 取消之前的滚动动画
    if (scrollCancelRef.current) {
      scrollCancelRef.current();
    }
    
    // 计算目标位置
    const targetTop = endRef.offsetTop - container.clientTop;
    
    // 根据距离计算动画时长（使用easeOutQuart曲线）
    const distance = Math.abs(targetTop - container.scrollTop);
    const baseTime = (distance / 500) * SCROLL_CONFIG.baseDuration;
    const duration = Math.max(
      SCROLL_CONFIG.minDuration,
      Math.min(SCROLL_CONFIG.maxDuration, baseTime)
    );
    
    // 使用非线性插值滚动
    scrollCancelRef.current = smoothScrollTo(
      container,
      targetTop,
      duration,
      SCROLL_CONFIG.easeOutQuart
    );
  }, []);

  // 消息更新时触发智能滚动
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const contentLength = lastMessage.content.length;
      
      // 如果是AI正在生成，使用延迟滚动匹配阅读节奏
      if (isLoading && lastMessage.role === 'assistant') {
        // 延迟滚动，等待内容累积
        const delay = Math.min(contentLength / SCROLL_CONFIG.charsPerSecond * 1000, 500);
        const timer = setTimeout(() => {
          smartScrollToBottom(contentLength);
        }, delay);
        return () => clearTimeout(timer);
      } else if (!isLoading) {
        // 非加载状态，直接滚动
        smartScrollToBottom(contentLength);
      }
    }
  }, [messages, isLoading, smartScrollToBottom]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (scrollCancelRef.current) {
        scrollCancelRef.current();
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  const quickQuestions: QuickQuestion[] = [
    { icon: '💰', text: '老板拖欠工资怎么办？' },
    { icon: '📋', text: '劳动合同应该包含哪些内容？' },
    { icon: '⚠️', text: '遭遇工伤如何申请赔偿？' },
    { icon: '⚖️', text: '如何申请法律援助？' },
    { icon: '🔧', text: '加班费怎么计算？' },
    { icon: '🏢', text: '公司不签劳动合同违法吗？' },
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // 用户发送消息时，恢复自动滚动
    userInteractingRef.current = false;
    setIsUserScrolling(false);

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
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应');
      }

      let lastScrollTime = 0;
      const scrollInterval = 150; // 每150ms检查一次滚动

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
                
                // 节流更新，减少不必要的渲染
                const now = Date.now();
                if (now - lastScrollTime > 50) {
                  lastScrollTime = now;
                  
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
      // 确保最终内容更新
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: assistantContent }
            : msg
        )
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: msg.content || '请求已取消',
                }
              : msg
          )
        );
      } else {
        console.error('咨询失败:', err);
        setError('咨询失败，请稍后重试');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: '抱歉，服务暂时不可用，请稍后重试。' }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      
      // 滚动到底部
      setTimeout(() => smartScrollToBottom(assistantContent.length), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          '您好，我是护薪平台的法律智能助手，专门为您提供劳动法律咨询和维权指导服务。\n\n请问有什么可以帮助您的？您可以：\n• 咨询劳动合同相关问题\n• 了解工资拖欠维权途径\n• 询问工伤赔偿标准\n• 申请法律援助条件\n• 其他劳动权益问题',
        timestamp: new Date(),
      },
    ]);
    setError(null);
    userInteractingRef.current = false;
    setIsUserScrolling(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50">
      {/* 头部 */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">智能法律咨询</h1>
                <p className="text-sm text-gray-500">基于知识库的专业法律指导</p>
              </div>
            </div>
            {isUserScrolling && (
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                已暂停自动滚动
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 知识库提示 */}
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
          <BookOpen className="w-4 h-4" />
          <span>AI 助手基于劳动法律法规知识库为您提供解答</span>
        </div>
      </div>

      {/* 快捷问题 */}
      {messages.length === 1 && (
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <p className="text-sm text-gray-500 mb-3">快捷问题：</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(q.text)}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full hover:border-emerald-300 hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
              >
                <span>{q.icon}</span>
                <span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 消息列表 - 带滚动容器 */}
      <div className="max-w-4xl mx-auto px-4 pb-32">
        <div 
          ref={messagesContainerRef}
          className="space-y-4 py-4"
          onScroll={handleUserScroll}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                    : 'bg-white border shadow-sm'
                }`}
              >
                <div
                  className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user' ? '' : 'text-gray-700'
                  }`}
                >
                  {message.content || (
                    <span className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      正在思考...
                    </span>
                  )}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {/* 错误提示 */}
          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-full text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题，按 Enter 发送..."
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
            {isLoading ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                停止
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                发送
              </button>
            )}
          </form>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-400">
              按 Enter 发送，Shift + Enter 换行
            </p>
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                清空对话
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
