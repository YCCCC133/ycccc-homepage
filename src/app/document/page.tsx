'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, FileText, Loader2, Copy, Check, Download, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

// 问题定义
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

// 意图检测
function detectIntent(text: string): 'greeting' | 'skip' | 'restart' | 'help' | 'normal' {
  const lower = text.toLowerCase().trim();
  if (['你好', '您好', 'hi', 'hello', '在', '嗨'].some(p => lower.includes(p))) return 'greeting';
  if (['重新开始', '再来', '重置'].some(p => lower.includes(p))) return 'restart';
  if (['帮助', '怎么用', '怎么操作'].some(p => lower.includes(p))) return 'help';
  if (['跳过', '不知道', '没有', '啥都'].some(p => lower.includes(p))) return 'skip';
  return 'normal';
}

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 发送消息到前端显示
  const sendMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content, timestamp: new Date() }]);
  };

  // 调用后端AI对话API
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
        sendMessage(result.data.content);
      }
    } catch (error) {
      sendMessage('抱歉，服务暂时不可用，请稍后重试。');
    }
  };

  // 初始化对话
  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);
    
    setIsTyping(true);
    sendMessage('您好！我是智能法律文书助手，可以帮您生成民事起诉状等法律文书。\n\n请放心，我会根据您的情况量身定制。准备好后请告诉我您的姓名？');
    setCurrentStep(1);
    setIsTyping(false);
  }, []);

  // 自动滚动
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 处理用户回答
  const handleAnswer = async (answer: string) => {
    const trimmed = answer.trim();
    if (!trimmed) return;

    const intent = detectIntent(trimmed);
    const currentQ = QUESTIONS[currentStep - 1];

    // 添加用户消息
    sendMessage(trimmed);

    // 根据意图处理
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

    // 正常回答
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

  // 生成法律文书
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
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-white/80 text-foreground border border-emerald-100/50 shadow-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown 
                        className="prose prose-sm prose-emerald max-w-none"
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                          li: ({children}) => <li className="text-sm">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                          code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                          blockquote: ({children}) => <blockquote className="border-l-2 border-emerald-300 pl-3 italic my-2">{children}</blockquote>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
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
              
              <div ref={messagesEndRef} />
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
