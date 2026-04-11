"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, RefreshCw } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const quickQuestions = [
  "用人单位拖欠工资怎么办？",
  "如何申请劳动仲裁？",
  "支持起诉需要准备哪些材料？",
  "法律援助如何申请？",
];

export default function ConsultPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    ]);

    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content.trim() }),
      });

      if (!response.ok) throw new Error("请求失败");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
                )
              );
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullContent }
                        : msg
                    )
                  );
                }
              } catch {}
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "抱歉，服务暂时不可用，请稍后再试。",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* 装饰背景 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-20 w-60 h-60 bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-20 w-72 h-72 bg-emerald-50/40 rounded-full blur-3xl" />
      </div>

      {/* 页面标题 */}
      <div className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">智能法律咨询</h1>
              <p className="text-sm text-stone-600 mt-1">
                AI 智能顾问，为您解答劳动权益相关问题
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  text-sm text-stone-500
                  rounded-lg
                  hover:bg-stone-100
                  transition-colors
                "
              >
                <RefreshCw className="w-4 h-4" />
                <span>重新开始</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="relative flex-1 overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {messages.length === 0 ? (
            /* 欢迎界面 */
            <div className="flex-1 flex flex-col items-center justify-center -mt-16">
              <div className="
                w-16 h-16
                rounded-2xl
                bg-gradient-to-br from-emerald-500 to-emerald-600
                flex items-center justify-center
                shadow-lg shadow-emerald-500/20
                mb-6
              ">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">
                您好，我是法律智能助手
              </h2>
              <p className="text-sm text-stone-600 mb-8 text-center max-w-md">
                可以向我咨询劳动法相关问题，如工资拖欠、劳动合同、劳动仲裁等
              </p>
              
              {/* 快捷问题 */}
              <div className="w-full max-w-lg">
                <p className="text-xs text-stone-500 mb-3 text-center">
                  试试这些问题：
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="
                        p-3
                        text-left text-sm
                        text-stone-600
                        rounded-xl
                        bg-white/70 backdrop-blur-sm
                        border border-stone-200/50
                        hover:bg-white hover:border-emerald-300
                        hover:text-emerald-700
                        transition-all duration-200
                      "
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* 消息列表 */
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`
                    flex gap-3
                    ${message.role === "user" ? "flex-row-reverse" : ""}
                  `}
                >
                  {/* 头像 */}
                  <div
                    className={`
                      flex-shrink-0
                      w-9 h-9
                      rounded-xl
                      flex items-center justify-center
                      ${
                        message.role === "user"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                      }
                    `}
                  >
                    {message.role === "user" ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>

                  {/* 消息气泡 */}
                  <div
                    className={`
                      max-w-[85%] sm:max-w-[75%]
                      px-4 py-3
                      rounded-2xl
                      ${
                        message.role === "user"
                          ? "bg-emerald-500 text-white rounded-tr-md"
                          : "bg-white/80 backdrop-blur-sm border border-stone-200/50 text-stone-700 rounded-tl-md"
                      }
                    `}
                  >
                    {message.role === "assistant" ? (
                      <div className="markdown-content">
                        <MarkdownRenderer content={message.content} />
                        {message.isStreaming && (
                          <span className="inline-block ml-1 animate-pulse">▌</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="relative px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="
            p-3 sm:p-4
            rounded-2xl
            bg-white/80 backdrop-blur-xl
            border border-stone-200/60
            shadow-lg shadow-stone-200/30
          ">
            <div className="flex items-end gap-2 sm:gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题，按 Enter 发送..."
                rows={1}
                className="
                  flex-1
                  px-2 py-2
                  text-sm sm:text-base
                  bg-transparent
                  border-none
                  resize-none
                  focus:outline-none
                  text-stone-800
                  placeholder:text-stone-400
                "
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className={`
                  flex-shrink-0
                  w-10 h-10 sm:w-11 sm:h-11
                  rounded-xl
                  flex items-center justify-center
                  transition-all duration-200
                  ${
                    input.trim() && !isLoading
                      ? `bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700`
                      : `bg-stone-100 text-stone-400`
                  }
                `}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-stone-400 text-center mt-2">
            AI 辅助解答，仅供参考，具体法律问题请咨询专业律师
          </p>
        </div>
      </div>
    </div>
  );
}
