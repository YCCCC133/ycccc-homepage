'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// 智能问答流程
const QUESTIONS = [
  {
    id: 'greeting',
    question: '您好！我来帮您生成法律文书。请先告诉我您的姓名？',
    field: 'name',
    placeholder: '请输入您的姓名',
    type: 'text',
    skipPatterns: ['跳过', '不知道', '匿名', '随便']
  },
  {
    id: 'phone',
    question: '好的，请问您的联系电话是多少？方便检察院联系您。',
    field: 'phone',
    placeholder: '请输入手机号码',
    type: 'text',
    skipPatterns: ['跳过', '不知道', '没电话']
  },
  {
    id: 'companyName',
    question: '了解。请告诉我是哪家单位或个人拖欠了您的工资？',
    field: 'companyName',
    placeholder: '如：某某建筑公司、王老板等',
    type: 'text',
    skipPatterns: ['跳过', '不知道', '记不清']
  },
  {
    id: 'owedAmount',
    question: '被拖欠的工资金额大概是多少？',
    field: 'owedAmount',
    placeholder: '如：50000元、5万元',
    type: 'text',
    skipPatterns: ['跳过', '不知道', '不清楚']
  },
  {
    id: 'workPeriod',
    question: '您是什么时候开始在那工作的？大概做了多久？',
    field: 'workPeriod',
    placeholder: '如：2024年3月-2025年1月',
    type: 'text',
    skipPatterns: ['跳过', '不知道', '记不清']
  },
  {
    id: 'hasContract',
    question: '您和用人单位签订劳动合同了吗？',
    field: 'hasContract',
    placeholder: '有 / 没有 / 不确定',
    type: 'select',
    options: ['有', '没有', '不确定'],
    skipPatterns: []
  },
  {
    id: 'hasEvidence',
    question: '您手上有工资条、聊天记录、考勤记录等证据吗？',
    field: 'hasEvidence',
    placeholder: '如：工资条、微信聊天记录、考勤表等',
    type: 'text',
    skipPatterns: ['跳过', '没有', '啥都没有']
  },
  {
    id: 'description',
    question: '最后，请简单描述一下拖欠工资的情况，越详细越好。',
    field: 'description',
    placeholder: '如：2024年6月完工后一直说资金紧张，至今未结清工资，老板电话也不接了',
    type: 'textarea',
    skipPatterns: []
  }
];

// 意图识别
const GREETING_PATTERNS = ['你好', '您好', 'hi', 'hello', '在', '在的', '好', '嗨', 'hey'];
const RESTART_PATTERNS = ['重新开始', '再来', '重新', 'start'];
const HELP_PATTERNS = ['怎么用', '帮助', '怎么操作', '怎么弄'];

function detectIntent(text: string): 'greeting' | 'skip' | 'restart' | 'help' | 'normal' {
  const lower = text.toLowerCase().trim();
  
  if (GREETING_PATTERNS.some(p => lower.includes(p))) return 'greeting';
  if (RESTART_PATTERNS.some(p => lower.includes(p))) return 'restart';
  if (HELP_PATTERNS.some(p => lower.includes(p))) return 'help';
  if (['跳过', '跳过这个', '不知道', '没有', '啥都没有', '记不清'].some(p => lower === p || lower.includes(p))) return 'skip';
  
  return 'normal';
}

export default function DocumentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(-1); // -1表示未开始
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 发送消息（助手）
  const sendMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content, timestamp: new Date() }]);
  };

  // 初始问候
  useEffect(() => {
    setIsTyping(true);
    setTimeout(() => {
      sendMessage('您好！我是文书生成助手，可以帮您生成起诉状等法律文书。\n\n请放心，我会根据您的情况量身定制。您可以直接回答我的问题，也可以随时说"跳过"跳过某个问题。\n\n我们开始吧——请问您叫什么名字？');
      setCurrentQuestion(0);
      setIsTyping(false);
    }, 800);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAnswer = async (answer: string) => {
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) return;

    const intent = detectIntent(trimmedAnswer);
    const currentQ = QUESTIONS[currentQuestion];

    // 添加用户消息
    sendMessage(trimmedAnswer);

    // 根据意图处理
    if (intent === 'greeting') {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      sendMessage('您好！我们继续吧。' + (currentQ?.question || ''));
      setIsTyping(false);
      return;
    }

    if (intent === 'restart') {
      setMessages([]);
      setFormData({});
      setCurrentQuestion(-1);
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      sendMessage('好的，我们重新开始！\n\n请问您叫什么名字？');
      setCurrentQuestion(0);
      setIsTyping(false);
      return;
    }

    if (intent === 'help') {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      sendMessage('我来帮您一步步生成法律文书。您只需要：\n\n1. 回答我的问题\n2. 回答不了的可以说"跳过"\n3. 想重新开始可以说"重新开始"\n\n准备好了吗？请告诉我您的姓名？');
      setIsTyping(false);
      return;
    }

    if (intent === 'skip' && currentQ?.skipPatterns) {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      
      // 跳过但记录为空
      setFormData(prev => ({ ...prev, [currentQ.field]: '未提供' }));
      
      if (currentQuestion < QUESTIONS.length - 1) {
        sendMessage('好的，跳过此项。' + QUESTIONS[currentQuestion + 1].question);
        setCurrentQuestion(prev => prev + 1);
      } else {
        // 最后一个问题，跳过直接生成
        sendMessage('好的，信息收集完毕！正在为您生成法律文书...');
        generateDocument({ ...formData, [currentQ.field]: '未提供' } as FormData);
      }
      setIsTyping(false);
      return;
    }

    // 正常回答
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 300));
    
    const newFormData = { ...formData, [currentQ.field]: trimmedAnswer };
    setFormData(newFormData);

    if (currentQuestion < QUESTIONS.length - 1) {
      sendMessage(QUESTIONS[currentQuestion + 1].question);
      setCurrentQuestion(prev => prev + 1);
    } else {
      // 所有问题回答完毕
      sendMessage('太好了！信息收集完毕，正在为您生成法律文书，请稍候...');
      generateDocument(newFormData as FormData);
    }
    setIsTyping(false);
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
        sendMessage('文书已生成完成！您可以查看、复制或下载。');
      } else {
        sendMessage(`生成失败：${result.error}。请稍后重试。`);
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

  const currentQ = QUESTIONS[currentQuestion];
  const progress = currentQuestion >= 0 ? ((currentQuestion + 1) / QUESTIONS.length) * 100 : 0;

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
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
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

        {/* Fixed Bottom Input Area */}
        {!generatedDocument && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-sm border-t border-emerald-100/50 z-50">
            <div className="container mx-auto max-w-3xl px-4 py-4">
              {/* Quick Commands */}
              {currentQuestion >= 0 && (
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
                    currentQ?.type === 'select' 
                      ? `请选择：${currentQ.options?.join(' / ')}` 
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
              {currentQuestion >= 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {currentQuestion + 1}/{QUESTIONS.length}
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
