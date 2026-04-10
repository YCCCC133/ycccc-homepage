'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ============================================================
// 配置常量
// ============================================================
const MARKDOWN_CONFIG = {
  // 节流时间(ms)：避免频繁渲染
  renderThrottleMs: 50,
  
  // 最大缓冲文本长度（超过后强制渲染）
  maxBufferLength: 500,
  
  // Markdown 渲染超时(ms)
  renderTimeoutMs: 1000,
};

// ============================================================
// 类型定义
// ============================================================
interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

// ============================================================
// MarkdownRenderer 组件
// 功能：安全的 Markdown 到 React 组件渲染
// ============================================================
export function MarkdownRenderer({ content, className = '', isStreaming = false }: MarkdownRendererProps) {
  // 流式输出时的样式：文字渐显效果
  const streamingStyle = isStreaming ? {
    animation: 'fadeIn 0.1s ease-in',
  } : {};

  return (
    <div className={`markdown-renderer ${className}`} style={streamingStyle}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 段落
          p: ({ children }) => (
            <p style={{ marginBottom: '8px', lineHeight: 1.6 }}>
              {children}
            </p>
          ),
          // 标题层级
          h1: ({ children }) => (
            <h1 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              marginTop: '16px', 
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 600, 
              marginTop: '14px', 
              marginBottom: '6px',
              color: '#374151'
            }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 600, 
              marginTop: '12px', 
              marginBottom: '4px',
              color: '#4b5563'
            }}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 style={{ 
              fontSize: '0.9375rem', 
              fontWeight: 600, 
              marginTop: '10px', 
              marginBottom: '4px',
              color: '#4b5563'
            }}>
              {children}
            </h4>
          ),
          // 列表
          ul: ({ children }) => (
            <ul style={{ 
              paddingLeft: '1.5rem', 
              marginBottom: '8px',
              listStyleType: 'disc'
            }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ 
              paddingLeft: '1.5rem', 
              marginBottom: '8px',
              listStyleType: 'decimal'
            }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ 
              marginBottom: '4px', 
              lineHeight: 1.6 
            }}>
              {children}
            </li>
          ),
          // 强调
          strong: ({ children }) => (
            <strong style={{ 
              fontWeight: 600, 
              color: '#1f2937' 
            }}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em style={{ fontStyle: 'italic' }}>
              {children}
            </em>
          ),
          // 代码
          code: ({ node, className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  style={{
                    backgroundColor: '#f3f4f6',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.875em',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    color: '#1f2937'
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre style={{
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              padding: '12px 16px',
              borderRadius: '8px',
              overflow: 'auto',
              marginBottom: '12px',
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}>
              {children}
            </pre>
          ),
          // 引用
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '4px solid #10b981',
              paddingLeft: '12px',
              marginLeft: 0,
              marginBottom: '8px',
              color: '#4b5563',
              fontStyle: 'italic'
            }}>
              {children}
            </blockquote>
          ),
          // 链接
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                color: '#059669',
                textDecoration: 'underline',
                textUnderlineOffset: '2px'
              }}
            >
              {children}
            </a>
          ),
          // 分隔线
          hr: () => (
            <hr style={{
              border: 'none',
              borderTop: '1px solid #e5e7eb',
              margin: '16px 0'
            }} />
          ),
          // 表格
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ backgroundColor: '#f9fafb' }}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              fontWeight: 600,
              textAlign: 'left'
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb'
            }}>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* 渐显动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0.95; }
          to { opacity: 1; }
        }
        .markdown-renderer p:last-child {
          margin-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
}

// ============================================================
// StreamingMessage 组件
// 功能：处理流式输出的 Markdown 消息
// ============================================================
interface StreamingMessageProps {
  content: string;
  isStreaming?: boolean;
  onRenderComplete?: () => void;
}

export function StreamingMessage({ content, isStreaming = false, onRenderComplete }: StreamingMessageProps) {
  const [renderedContent, setRenderedContent] = useState('');
  const lastRenderTime = useRef<number>(0);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 节流渲染逻辑
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;

    // 如果距离上次渲染时间小于节流时间，延迟执行
    if (timeSinceLastRender < MARKDOWN_CONFIG.renderThrottleMs) {
      // 清除之前的延迟
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      // 设置新的延迟
      renderTimeoutRef.current = setTimeout(() => {
        lastRenderTime.current = Date.now();
        setRenderedContent(content);
      }, MARKDOWN_CONFIG.renderThrottleMs - timeSinceLastRender);
    } else {
      // 直接渲染
      lastRenderTime.current = now;
      setRenderedContent(content);
    }

    // 清理函数
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [content]);

  // 流式结束时的回调
  useEffect(() => {
    if (!isStreaming && renderedContent === content) {
      onRenderComplete?.();
    }
  }, [isStreaming, renderedContent, content, onRenderComplete]);

  return (
    <MarkdownRenderer 
      content={renderedContent} 
      isStreaming={isStreaming}
    />
  );
}

// ============================================================
// ChatBubble 组件
// 功能：渲染用户/AI 消息气泡
// ============================================================
interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  legalReferences?: Array<{
    name: string;
    fullName: string;
    url: string;
  }>;
}

export function ChatBubble({ role, content, isStreaming = false, legalReferences }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[85%]">
        {/* 消息气泡 */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white/80 text-foreground border border-emerald-100/50 shadow-sm'
          }`}
        >
          {isUser ? (
            // 用户消息：纯文本
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {content}
            </p>
          ) : (
            // AI 消息：Markdown 渲染（支持流式）
            <MarkdownRenderer 
              content={content} 
              isStreaming={isStreaming}
            />
          )}
          
          {/* 流式输出时的光标 */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse" />
          )}
        </div>

        {/* 法律引用标注（仅AI消息） */}
        {!isUser && legalReferences && legalReferences.length > 0 && (
          <div className="mt-2 px-1">
            <div className="text-[10px] text-gray-400 leading-relaxed">
              <span className="mr-1">📖 参考：</span>
              {legalReferences.map((ref, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1">·</span>}
                  <a 
                    href={ref.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-gray-500 underline underline-offset-2 transition-colors"
                    title={ref.fullName}
                  >
                    {ref.name}
                  </a>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MessageList 组件
// 功能：渲染消息列表
// ============================================================
interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  legalReferences?: Array<{
    name: string;
    fullName: string;
    url: string;
  }>;
}

interface MessageListProps {
  messages: Message[];
  streamingMessageId?: number;
}

export function MessageList({ messages, streamingMessageId }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((msg, idx) => {
        const isStreaming = streamingMessageId === idx;
        return (
          <ChatBubble
            key={idx}
            role={msg.role}
            content={msg.content}
            isStreaming={isStreaming}
            legalReferences={msg.legalReferences}
          />
        );
      })}
    </div>
  );
}
