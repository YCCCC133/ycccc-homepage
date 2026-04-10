'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, FileText, Loader2, Copy, Check, Download, Sparkles } from 'lucide-react';

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

const QUESTIONS = [
  {
    id: 'name',
    question: '请告诉我您的姓名',
    field: 'name',
    placeholder: '例如：张三',
    type: 'text'
  },
  {
    id: 'phone',
    question: '您的联系电话是多少？',
    field: 'phone',
    placeholder: '例如：13800138000',
    type: 'text'
  },
  {
    id: 'companyName',
    question: '欠您工资的公司或个人叫什么名字？',
    field: 'companyName',
    placeholder: '例如：某某建筑公司',
    type: 'text'
  },
  {
    id: 'owedAmount',
    question: '被拖欠了多少工资？',
    field: 'owedAmount',
    placeholder: '例如：50000（元）',
    type: 'text'
  },
  {
    id: 'workPeriod',
    question: '您从什么时候开始在那工作的？大概工作多久了？',
    field: 'workPeriod',
    placeholder: '例如：2024年3月至2025年1月',
    type: 'text'
  },
  {
    id: 'hasContract',
    question: '您和公司签订劳动合同了吗？',
    field: 'hasContract',
    placeholder: '有 / 没有 / 不确定',
    type: 'select',
    options: ['有', '没有', '不确定']
  },
  {
    id: 'hasEvidence',
    question: '您有哪些证据？（工资条、聊天记录、考勤记录等）',
    field: 'hasEvidence',
    placeholder: '例如：微信聊天记录、工资条、考勤表',
    type: 'text'
  },
  {
    id: 'description',
    question: '最后，请简单描述一下情况（什么时候开始欠薪、老板怎么说等）',
    field: 'description',
    placeholder: '越详细越好，可以分多条说',
    type: 'textarea'
  }
];

export default function DocumentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '您好！我是文书生成助手。我会通过几个简单的问题，帮您生成专业的法律文书。请放心回答，我会根据您的情况量身定制。',
      timestamp: new Date()
    }
  ]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 第一个问题延迟显示
  useEffect(() => {
    if (messages.length === 1) {
      const timer = setTimeout(() => {
        addMessage('assistant', QUESTIONS[0].question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  const handleAnswer = async (answer: string) => {
    const question = QUESTIONS[currentQuestion];
    addMessage('user', answer);
    
    const newFormData = { ...formData, [question.field]: answer };
    setFormData(newFormData);

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => {
        addMessage('assistant', QUESTIONS[currentQuestion + 1].question);
        setCurrentQuestion(prev => prev + 1);
      }, 300);
    } else {
      setTimeout(() => {
        addMessage('assistant', '好的，信息收集完毕！正在为您生成法律文书，请稍候...');
        generateDocument(newFormData as FormData);
      }, 300);
    }
  };

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
        addMessage('assistant', '文书已生成完成！您可以查看、复制或下载文书内容。');
      } else {
        addMessage('assistant', `生成失败：${result.error}。请稍后重试。`);
      }
    } catch (error) {
      addMessage('assistant', '网络错误，请检查网络连接后重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputValue.trim();
    if (input && !isGenerating) {
      handleAnswer(input);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const input = inputValue.trim();
      if (input && !isGenerating) {
        handleAnswer(input);
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
    a.download = `民事起诉状_${formData.name}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentQ = QUESTIONS[currentQuestion];

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
              <p className="text-xs text-muted-foreground">智能生成 · 专业规范</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Area - 可滚动区域 */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 pb-[180px]"
        >
          <div className="container mx-auto max-w-3xl space-y-4">
            {/* Chat Header */}
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">智能问答</span>
              <span className="text-xs text-muted-foreground">回答几个简单问题，我帮您生成专业文书</span>
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
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white/80 text-foreground border border-emerald-100/50 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                      正在生成文书...
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
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          复制文书
                        </>
                      )}
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

            {/* Tips */}
            {!generatedDocument && (
              <div className="mt-6 p-4 rounded-xl bg-amber-50/50 border border-amber-100/50">
                <h3 className="text-sm font-medium text-amber-800 mb-2">温馨提示</h3>
                <ul className="text-xs text-amber-700/80 space-y-1">
                  <li>• 请尽量详细描述您的遭遇，有助于生成更准确的文书</li>
                  <li>• 文书生成后可自行修改或咨询专业人士</li>
                  <li>• 如需进一步帮助，可联系当地法律援助中心</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Input Area */}
        {!generatedDocument && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-sm border-t border-emerald-100/50 z-50">
            <div className="container mx-auto max-w-3xl px-4 py-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    currentQ?.type === 'select' 
                      ? `请回复：${currentQ.options?.join(' / ')}` 
                      : currentQ?.placeholder || '请输入您的回答'
                  }
                  className="flex-1 border-emerald-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-300 bg-white/80"
                  disabled={isGenerating}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={isGenerating || !inputValue.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              
              {/* Quick Options for select type */}
              {currentQ?.type === 'select' && currentQ.options && (
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
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {currentQuestion + 1}/{QUESTIONS.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
