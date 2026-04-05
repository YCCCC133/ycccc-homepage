'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Bot,
  User,
  FileText,
  PenTool,
  Phone,
  Loader2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  '老板拖欠工资怎么办？',
  '没有签劳动合同怎么维权？',
  '工伤怎么赔偿？',
  '加班费怎么计算？',
  '如何申请法律援助？',
];

export default function ConsultPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '您好！我是护薪平台智能法律顾问，专门为农民工朋友提供法律咨询和维权指导。请问有什么可以帮助您的吗？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 自动滚动到底部 - 使用节流优化
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 快捷提问
  const handleQuickQuestion = useCallback((question: string) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 准备对话历史（不含欢迎消息）
    const conversationHistory = messages.slice(1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    conversationHistory.push({
      role: 'user',
      content: userMessage.content,
    });

    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: conversationHistory }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      // 逐块读取流式响应
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantContent += parsed.content;
                  // 实时更新消息
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content = assistantContent;
                    } else {
                      newMessages.push({
                        role: 'assistant',
                        content: assistantContent,
                        timestamp: new Date(),
                      });
                    }
                    return newMessages;
                  });
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 确保最后一条消息是完整的
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = assistantContent;
          lastMessage.timestamp = new Date();
        }
        return newMessages;
      });
    } catch (error) {
      // 忽略取消请求的错误
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '抱歉，服务暂时不可用。如需紧急帮助，请拨打12345政务服务热线。',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-foreground">智能法律咨询</h1>
        <p className="text-muted-foreground">
          AI智能应答常见法律问题，24小时在线提供专业法律指引
        </p>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-4">
        {/* Sidebar - Quick Actions */}
        <div className="hidden lg:block">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                常见问题
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left text-sm"
                  onClick={() => handleQuickQuestion(question)}
                >
                  <MessageCircle className="mr-2 h-3.5 w-3.5 text-primary" />
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                快速入口
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/report')}
              >
                <FileText className="mr-2 h-4 w-4" />
                线索填报
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/document')}
              >
                <PenTool className="mr-2 h-4 w-4" />
                文书生成
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href="tel:12345">
                  <Phone className="mr-2 h-4 w-4" />
                  12345热线
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col lg:col-span-3">
          {/* Messages */}
          <Card className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gradient-to-br from-primary to-primary/80 text-white'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`flex-1 ${
                        message.role === 'user' ? 'text-right' : ''
                      }`}
                    >
                      <div
                        className={`inline-block rounded-2xl px-4 py-3 text-sm ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-left">
                          {message.content}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-white">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        正在思考中...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Mobile Quick Questions */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {quickQuestions.slice(0, 3).map((question, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer whitespace-nowrap transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
                onClick={() => handleQuickQuestion(question)}
              >
                {question}
              </Badge>
            ))}
          </div>

          {/* Input Area */}
          <div className="mt-4">
            <Card className="border-2 border-primary/20 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <CardContent className="p-3">
                <div className="flex gap-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入您的问题，例如：老板拖欠工资怎么办？"
                    className="flex-1 resize-none border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
                    rows={2}
                    disabled={isLoading}
                    aria-label="输入您的问题"
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0 transition-transform active:scale-95"
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    aria-label="发送消息"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              按 Enter 发送，Shift + Enter 换行 ·
              <span className="text-primary"> 如需紧急帮助请拨打 12345</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
