'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, FileText, Loader2, Copy, Check, Download, Sparkles, ArrowDown } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown';

// ============================================================
// 配置常量
// ============================================================
const SCROLL_CONFIG = {
  scrollFactor: 0.15,           // 滚动系数（增大让滚动更快）
  stopThreshold: 5,             // 停止阈值
  showButtonThreshold: 150,     // 显示按钮阈值
};

// ============================================================
// 工具函数
// ============================================================
function detectIntent(text: string): 'greeting' | 'skip' | 'restart' | 'help' | 'normal' {
  const lower = text.toLowerCase().trim();
  if (['你好', '您好', 'hi', 'hello', '在', '嗨'].some(p => lower.includes(p))) return 'greeting';
  if (['重新开始', '再来', '重置'].some(p => lower.includes(p))) return 'restart';
  if (['帮助', '怎么用', '怎么操作'].some(p => lower.includes(p))) return 'help';
  if (['跳过', '不知道', '没有', '啥都'].some(p => lower.includes(p))) return 'skip';
  return 'normal';
}

// ============================================================
// 主组件
// ============================================================
export default function DocumentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showBackToBottom, setShowBackToBottom] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const userScrolledRef = useRef(false);

  // --------------------------------------------------------
  // 核心滚动函数：立即滚动到底部
  // --------------------------------------------------------
  const scrollToBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // 取消之前的动画
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const targetScrollTop = container.scrollHeight - container.clientHeight;
    const currentScrollTop = container.scrollTop;
    const distance = targetScrollTop - currentScrollTop;

    // 如果距离很小，直接滚动到底部
    if (Math.abs(distance) < SCROLL_CONFIG.stopThreshold) {
      container.scrollTop = targetScrollTop;
      isScrollingRef.current = false;
      return;
    }

    // 标记正在滚动
    isScrollingRef.current = true;

    // 使用 requestAnimationFrame 实现平滑滚动
    const animate = () => {
      const el = chatContainerRef.current;
      if (!el) return;

      const target = el.scrollHeight - el.clientHeight;
      const current = el.scrollTop;
      const remaining = target - current;

      if (Math.abs(remaining) < SCROLL_CONFIG.stopThreshold) {
        el.scrollTop = target;
        isScrollingRef.current = false;
        animationFrameRef.current = null;
        return;
      }

      // 渐进滚动
      const step = remaining * SCROLL_CONFIG.scrollFactor;
      el.scrollTop = current + step;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // --------------------------------------------------------
  // 立即滚动到底部（无动画）
  // --------------------------------------------------------
  const scrollToBottomImmediate = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    
    container.scrollTop = container.scrollHeight;
    isScrollingRef.current = false;
    userScrolledRef.current = false;
  }, []);

  // --------------------------------------------------------
  // 检测是否需要显示回到底部按钮
  // --------------------------------------------------------
  const checkShowBackButton = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const shouldShow = distanceFromBottom > SCROLL_CONFIG.showButtonThreshold;
    
    // 只有用户手动滚动过才显示按钮
    if (userScrolledRef.current && shouldShow) {
      setShowBackToBottom(true);
    } else {
      setShowBackToBottom(false);
    }
  }, []);

  // --------------------------------------------------------
  // 用户中断检测
  // --------------------------------------------------------
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      // 如果正在自动滚动，忽略这次滚动事件
      if (isScrollingRef.current) return;
      
      // 用户手动滚动了
      userScrolledRef.current = true;
      
      // 清除之前的超时
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      // 延迟检测是否需要显示按钮
      scrollTimeout = setTimeout(() => {
        checkShowBackButton();
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [checkShowBackButton]);

  // --------------------------------------------------------
  // 消息变化时触发滚动（核心：必须自动滚动）
  // --------------------------------------------------------
  useEffect(() => {
    if (messages.length === 0) return;

    // 延迟执行，等待 DOM 更新
    const timer = setTimeout(() => {
      // 始终滚动到底部，不管用户之前是否手动滚动过
      scrollToBottom();
      
      // 更新按钮显示状态
      setTimeout(() => {
        checkShowBackButton();
      }, 100);
    }, 30);

    return () => clearTimeout(timer);
  }, [messages.length, scrollToBottom, checkShowBackButton]);

  // --------------------------------------------------------
  // 回到底部按钮点击
  // --------------------------------------------------------
  const handleBackToBottom = useCallback(() => {
    scrollToBottomImmediate();
    userScrolledRef.current = false;
    setShowBackToBottom(false);
  }, [scrollToBottomImmediate]);

  // --------------------------------------------------------
  // 发送消息
  // --------------------------------------------------------
  const sendMessage = useCallback((content: string, legalRefs?: LegalReference[]) => {
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content, 
      timestamp: new Date(),
      legalReferences: legalRefs 
    }]);
  }, []);

  // --------------------------------------------------------
  // 初始化
  // --------------------------------------------------------
  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);
    
    setIsTyping(true);
    sendMessage('您好！我是智能法律文书助手，可以帮您生成民事起诉状等法律文书。\n\n请放心，我会根据您的情况量身定制。准备好后请告诉我您的姓名？');
    setCurrentStep(1);
    setIsTyping(false);
  }, [isInitialized, sendMessage]);

  // --------------------------------------------------------
  // 调用AI
  // --------------------------------------------------------
  const callAI = async (userMessage: string) => {
    try {
      const response = await fetch('/api/document/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          formData
        })
      });
      
      const result = await response.json();
      if (result.success && result.data.content) {
        sendMessage(result.data.content, result.data.legalReferences);
      }
    } catch (error) {
      sendMessage('抱歉，服务暂时不可用，请稍后重试。');
    }
  };

  // --------------------------------------------------------
  // 处理回答
  // --------------------------------------------------------
  const handleAnswer = async (answer: string) => {
    const trimmed = answer.trim();
    if (!trimmed) return;

    const intent = detectIntent(trimmed);
    const currentQ = QUESTIONS[currentStep - 1];

    sendMessage(trimmed);

    if (intent === 'greeting') {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      sendMessage('您好！我们继续吧。' + currentQ.question);
      setIsTyping(false);
      return;
    }

    if (intent === 'restart') {
      setMessages([]);
      setFormData({});
      setCurrentStep(0);
      setIsTyping(true);
      userScrolledRef.current = false;
      await new Promise(r => setTimeout(r, 500));
      sendMessage('好的，我们重新开始！请问您叫什么名字？');
      setCurrentStep(1);
      setIsTyping(false);
      return;
    }

    if (intent === 'help') {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      sendMessage('我来帮您生成法律文书。您只需要回答我的问题，如果无法回答可以说"跳过"。\n\n请问您叫什么名字？');
      setCurrentStep(1);
      setIsTyping(false);
      return;
    }

    if (intent === 'skip' && currentQ) {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      setFormData(prev => ({ ...prev, [currentQ.field]: '未提供' }));
      
      if (currentStep < QUESTIONS.length) {
        sendMessage('好的，没关系。' + QUESTIONS[currentStep].question);
        setCurrentStep(prev => prev + 1);
      } else {
        sendMessage('信息收集完毕，正在生成法律文书...');
        generateDocument({ ...formData, [currentQ.field]: '未提供' } as FormData);
      }
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    
    if (currentQ) {
      setFormData(prev => ({ ...prev, [currentQ.field]: trimmed }));
    }

    await new Promise(r => setTimeout(r, 300));

    if (currentStep < QUESTIONS.length) {
      sendMessage(QUESTIONS[currentStep].question);
      setCurrentStep(prev => prev + 1);
    } else {
      sendMessage('太好了！信息收集完毕，正在为您生成法律文书，请稍候...');
      generateDocument({ ...formData, [currentQ?.field || 'name']: trimmed } as FormData);
    }
    setIsTyping(false);
  };

  // --------------------------------------------------------
  // 生成文书
  // --------------------------------------------------------
  const generateDocument = async (data: FormData) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedDocument(result.data.document);
        sendMessage('文书已生成完成！您可以查看、复制或下载。');
      } else {
        sendMessage(`生成失败：${result.error}`);
      }
    } catch (error) {
      sendMessage('网络错误，请检查网络连接后重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isGenerating && !isTyping) {
      handleAnswer(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isGenerating && !isTyping) {
        handleAnswer(inputValue);
        setInputValue('');
      }
    }
  };

  const copyToClipboard = async () => {
    if (generatedDocument) {
      await navigator.clipboard.writeText(generatedDocument);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadDocument = () => {
    if (!generatedDocument) return;
    const blob = new Blob([generatedDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `民事起诉状_${formData.name || '未命名'}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentQ = QUESTIONS[currentStep - 1];
  const progress = currentStep > 0 ? (currentStep / QUESTIONS.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white selection-primary flex flex-col">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-md shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">文书生成</h1>
              <p className="text-xs text-muted-foreground">智能问答 · 专业规范</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 pb-[200px]"
        >
          <div className="container mx-auto max-w-3xl space-y-4">
            {/* Chat Header */}
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">智能问答</span>
              <span className="text-xs text-muted-foreground">回答问题，生成专属文书</span>
            </div>

            {/* Messages */}
            <div className="space-y-4 pb-4">
              {messages.map((msg, idx) => {
                const isLastMessage = idx === messages.length - 1;
                const isStreaming = idx === messages.length - 1 && (isGenerating || isTyping);
                return (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[85%]">
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-white/80 text-foreground border border-emerald-100/50 shadow-sm'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="text-sm leading-relaxed">
                            <MarkdownRenderer 
                              content={msg.content} 
                              isStreaming={isStreaming}
                            />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        )}
                        
                        {/* 流式输出光标 */}
                        {isStreaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse vertical-align-middle" />
                        )}
                      </div>
                      
                      {/* 法律引用标注 */}
                      {msg.role === 'assistant' && msg.legalReferences && msg.legalReferences.length > 0 && (
                        <div className="mt-2 px-1">
                          <div className="text-[10px] text-gray-400 leading-relaxed">
                            <span className="mr-1">📖 参考：</span>
                            {msg.legalReferences.map((ref, i) => (
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
              })}
              
              {(isGenerating || isTyping) && (
                <div className="flex justify-start">
                  <div className="bg-white/80 text-foreground border border-emerald-100/50 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                      {isGenerating ? '正在生成文书...' : '思考中...'}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 滚动锚点 */}
              <div ref={messagesEndRef} id="scroll-anchor" />
            </div>

            {/* Generated Document */}
            {generatedDocument && (
              <Card className="mt-6 border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white shadow-xl shadow-emerald-500/10">
                <CardHeader className="pb-2 border-b bg-gradient-to-r from-emerald-100/50 to-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    生成的法律文书
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-white/80 p-4 rounded-xl border border-emerald-100/50 max-h-[400px] overflow-y-auto">
                    {generatedDocument}
                  </pre>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex-1 gap-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                    >
                      {copied ? <><Check className="h-4 w-4" /> 已复制</> : <><Copy className="h-4 w-4" /> 复制文书</>}
                    </Button>
                    <Button
                      size="sm"
                      onClick={downloadDocument}
                      className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                    >
                      <Download className="h-4 w-4" />
                      下载文书
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 回到底部按钮 */}
        {showBackToBottom && (
          <button
            onClick={handleBackToBottom}
            className="fixed bottom-[180px] right-6 z-50 w-12 h-12 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            title="回到底部"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}

        {/* Fixed Bottom Input */}
        {!generatedDocument && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-sm border-t border-emerald-100/50 z-50">
            <div className="container mx-auto max-w-3xl px-4 py-4">
              {/* Quick Commands */}
              {currentStep > 0 && (
                <div className="flex gap-2 mb-3 text-xs">
                  <button 
                    onClick={() => handleAnswer('跳过')}
                    className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    跳过
                  </button>
                  <button 
                    onClick={() => handleAnswer('重新开始')}
                    className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    重新开始
                  </button>
                  <button 
                    onClick={() => handleAnswer('帮助')}
                    className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    帮助
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    currentQ?.options 
                      ? `请选择：${currentQ.options.join(' / ')}` 
                      : currentQ?.placeholder || '请输入您的回答'
                  }
                  className="flex-1 border-emerald-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-300 bg-white/80"
                  disabled={isGenerating || isTyping}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={isGenerating || isTyping || !inputValue.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              
              {/* Quick Options */}
              {currentQ?.options && (
                <div className="flex gap-2 mt-3 justify-center">
                  {currentQ.options.map(opt => (
                    <Button
                      key={opt}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnswer(opt)}
                      className="text-xs border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Progress */}
              {currentStep > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {currentStep}/{QUESTIONS.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 问题列表
// ============================================================
const QUESTIONS = [
  { id: 'name', field: 'name', question: '请问您叫什么名字？', placeholder: '请输入您的姓名' },
  { id: 'phone', field: 'phone', question: '请问您的联系电话是多少？', placeholder: '请输入手机号码' },
  { id: 'companyName', field: 'companyName', question: '是哪家单位或个人拖欠了您的工资？', placeholder: '如：某某建筑公司、王老板' },
  { id: 'owedAmount', field: 'owedAmount', question: '被拖欠的工资金额大概是多少？', placeholder: '如：5万元、50000元' },
  { id: 'workPeriod', field: 'workPeriod', question: '您是什么时候开始在那工作的？', placeholder: '如：2024年3月至2025年1月' },
  { id: 'hasContract', field: 'hasContract', question: '您和用人单位签订劳动合同了吗？', placeholder: '有 / 没有 / 不确定', options: ['有', '没有', '不确定'] },
  { id: 'hasEvidence', field: 'hasEvidence', question: '您有哪些证据？（工资条、聊天记录等）', placeholder: '如：工资条、微信记录' },
  { id: 'description', field: 'description', question: '请简单描述一下拖欠工资的情况', placeholder: '越详细越好' }
];

// 类型定义
interface LegalReference {
  name: string;
  fullName: string;
  url: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  legalReferences?: LegalReference[];
}

interface FormData {
  name: string;
  phone: string;
  companyName: string;
  owedAmount: string;
  workPeriod: string;
  hasContract: string;
  hasEvidence: string;
  description: string;
}
