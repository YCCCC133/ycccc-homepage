'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Loader2, Copy, Check, Download, ArrowLeft, ChevronRight, AlertCircle, Info, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown';
import { useRouter } from 'next/navigation';

// 文书类型
type DocumentType = 'litigation' | 'support_prosecution' | 'labor_dispute';

interface FormData {
  // 申请人信息
  applicantName: string;
  applicantGender: string;
  applicantBirthDate: string;
  applicantNation: string;
  applicantIdCard: string;
  applicantPhone: string;
  applicantAddress: string;
  
  // 被告信息
  defendantName: string;
  defendantType: 'company' | 'individual';
  defendantCode: string;
  defendantAddress: string;
  defendantLegalPerson: string;
  defendantPhone: string;
  
  // 案件信息
  projectName: string;
  workLocation: string;
  workStartDate: string;
  workEndDate: string;
  owedAmount: string;
  owedAmountCN: string;
  workDays: string;
  dailyRate: string;
  
  // 诉讼请求
  requestType: string[];
  
  // 事实与理由
  factDescription: string;
  
  // 提交法院
  courtName: string;
  
  // 其他
  hasContract: boolean;
  hasEvidence: string;
  hasWitness: boolean;
}

const initialFormData: FormData = {
  applicantName: '',
  applicantGender: '',
  applicantBirthDate: '',
  applicantNation: '汉族',
  applicantIdCard: '',
  applicantPhone: '',
  applicantAddress: '',
  
  defendantName: '',
  defendantType: 'company',
  defendantCode: '',
  defendantAddress: '',
  defendantLegalPerson: '',
  defendantPhone: '',
  
  projectName: '',
  workLocation: '',
  workStartDate: '',
  workEndDate: '',
  owedAmount: '',
  owedAmountCN: '',
  workDays: '',
  dailyRate: '',
  
  requestType: [],
  
  factDescription: '',
  
  courtName: '',
  
  hasContract: false,
  hasEvidence: '',
  hasWitness: false,
};

export default function DocumentPage() {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'form' | 'preview'>('select');
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // 更新表单字段
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 验证必填字段
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    // 申请人信息验证
    if (!formData.applicantName.trim()) newErrors.applicantName = '请输入申请人姓名';
    if (!formData.applicantGender) newErrors.applicantGender = '请选择性别';
    if (!formData.applicantBirthDate) newErrors.applicantBirthDate = '请输入出生日期';
    if (!formData.applicantIdCard.trim()) newErrors.applicantIdCard = '请输入身份证号';
    if (!formData.applicantPhone.trim()) newErrors.applicantPhone = '请输入联系电话';
    
    // 被告信息验证
    if (!formData.defendantName.trim()) newErrors.defendantName = '请输入被告名称';
    if (!formData.defendantAddress.trim()) newErrors.defendantAddress = '请输入被告地址';
    
    // 案件信息验证
    if (!formData.owedAmount.trim()) newErrors.owedAmount = '请输入拖欠工资金额';
    if (!formData.workStartDate) newErrors.workStartDate = '请输入工作开始时间';
    if (!formData.workEndDate) newErrors.workEndDate = '请输入工作结束时间';
    
    // 事实描述
    if (!formData.factDescription.trim()) newErrors.factDescription = '请输入事实与理由';
    
    // 提交法院
    if (!formData.courtName.trim()) newErrors.courtName = '请输入管辖法院';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 生成文书
  const generateDocument = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          ...formData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setGeneratedDocument(result.data.document);
        setStep('preview');
      } else {
        alert(`生成失败：${result.error}`);
      }
    } catch {
      alert('网络错误，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 复制文书
  const copyToClipboard = async () => {
    if (generatedDocument) {
      await navigator.clipboard.writeText(generatedDocument);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 下载文书
  const downloadDocument = () => {
    if (!generatedDocument) return;
    const blob = new Blob([generatedDocument], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const docTypeName = documentType === 'litigation' ? '民事起诉状' : documentType === 'support_prosecution' ? '支持起诉申请书' : '劳动争议起诉状';
    a.download = `${docTypeName}_${formData.applicantName}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 返回上一步
  const goBack = () => {
    if (step === 'preview') {
      setStep('form');
    } else if (step === 'form') {
      setStep('select');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-emerald-100/50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            {step !== 'select' && (
              <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-foreground">文书生成</h1>
              <p className="text-xs text-muted-foreground">
                {step === 'select' && '选择文书类型'}
                {step === 'form' && '填写信息'}
                {step === 'preview' && '预览与下载'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Step 1: Select Document Type */}
        {step === 'select' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">选择要生成的文书类型</h2>
              <p className="text-sm text-muted-foreground">根据您的实际需求，选择相应的法律文书类型</p>
            </div>

            <div className="grid gap-4">
              {/* 民事起诉状 */}
              <Card 
                className="cursor-pointer hover:border-emerald-400 hover:shadow-lg transition-all group"
                onClick={() => { setDocumentType('litigation'); setStep('form'); }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1">民事起诉状</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        适用于直接向人民法院提起诉讼，请求判决被告支付拖欠工资等劳动报酬
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>

              {/* 支持起诉申请书 */}
              <Card 
                className="cursor-pointer hover:border-emerald-400 hover:shadow-lg transition-all group"
                onClick={() => { setDocumentType('support_prosecution'); setStep('form'); }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1">支持起诉申请书</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        适用于请求检察机关支持起诉，由检察院向法院发出支持起诉意见书
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>

              {/* 劳动争议起诉状 */}
              <Card 
                className="cursor-pointer hover:border-amber-400 hover:shadow-lg transition-all group"
                onClick={() => { setDocumentType('labor_dispute'); setStep('form'); }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1">劳动争议起诉状</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        适用于因劳动合同履行、解除等产生的劳动争议纠纷（包含工资、工伤等）
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 提示信息 */}
            <Card className="bg-blue-50/50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 space-y-1">
                    <p className="font-medium">温馨提示</p>
                    <ul className="text-xs space-y-0.5 list-disc list-inside">
                      <li>请确保填写的信息真实有效</li>
                      <li>带 * 号的字段为必填项</li>
                      <li>文书生成后可复制或下载</li>
                      <li>如需法律援助可同时申请</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Fill Form */}
        {step === 'form' && documentType && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Tabs defaultValue="applicant" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 h-auto p-1 bg-muted/50 rounded-lg">
                <TabsTrigger value="applicant" className="text-xs sm:text-sm py-2">申请人</TabsTrigger>
                <TabsTrigger value="defendant" className="text-xs sm:text-sm py-2">被告</TabsTrigger>
                <TabsTrigger value="case" className="text-xs sm:text-sm py-2">案件</TabsTrigger>
                <TabsTrigger value="request" className="text-xs sm:text-sm py-2">请求</TabsTrigger>
              </TabsList>

              {/* 申请人信息 */}
              <TabsContent value="applicant" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">申请人基本信息</CardTitle>
                    <CardDescription>请如实填写您的个人信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="applicantName">
                          姓名 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="applicantName"
                          value={formData.applicantName}
                          onChange={(e) => updateField('applicantName', e.target.value)}
                          placeholder="请输入您的真实姓名"
                        />
                        {errors.applicantName && <p className="text-xs text-red-500">{errors.applicantName}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>
                          性别 <span className="text-red-500">*</span>
                        </Label>
                        <RadioGroup
                          value={formData.applicantGender}
                          onValueChange={(v) => updateField('applicantGender', v)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="男" id="male" />
                            <Label htmlFor="male" className="font-normal cursor-pointer">男</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="女" id="female" />
                            <Label htmlFor="female" className="font-normal cursor-pointer">女</Label>
                          </div>
                        </RadioGroup>
                        {errors.applicantGender && <p className="text-xs text-red-500">{errors.applicantGender}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="applicantBirthDate">
                          出生日期 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="applicantBirthDate"
                          type="date"
                          value={formData.applicantBirthDate}
                          onChange={(e) => updateField('applicantBirthDate', e.target.value)}
                        />
                        {errors.applicantBirthDate && <p className="text-xs text-red-500">{errors.applicantBirthDate}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="applicantNation">民族</Label>
                        <Input
                          id="applicantNation"
                          value={formData.applicantNation}
                          onChange={(e) => updateField('applicantNation', e.target.value)}
                          placeholder="如：汉族"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="applicantIdCard">
                          身份证号 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="applicantIdCard"
                          value={formData.applicantIdCard}
                          onChange={(e) => updateField('applicantIdCard', e.target.value)}
                          placeholder="18位身份证号码"
                        />
                        {errors.applicantIdCard && <p className="text-xs text-red-500">{errors.applicantIdCard}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="applicantPhone">
                          联系电话 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="applicantPhone"
                          type="tel"
                          value={formData.applicantPhone}
                          onChange={(e) => updateField('applicantPhone', e.target.value)}
                          placeholder="手机号码"
                        />
                        {errors.applicantPhone && <p className="text-xs text-red-500">{errors.applicantPhone}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicantAddress">户籍地址</Label>
                      <Input
                        id="applicantAddress"
                        value={formData.applicantAddress}
                        onChange={(e) => updateField('applicantAddress', e.target.value)}
                        placeholder="请输入您的户籍地址"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={() => document.querySelector<HTMLElement>('[data-value="defendant"]')?.click()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  下一步：填写被告信息
                </Button>
              </TabsContent>

              {/* 被告信息 */}
              <TabsContent value="defendant" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">被告信息</CardTitle>
                    <CardDescription>填写拖欠工资的单位或个人信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>被告类型</Label>
                      <RadioGroup
                        value={formData.defendantType}
                        onValueChange={(v) => updateField('defendantType', v as 'company' | 'individual')}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="company" id="defCompany" />
                          <Label htmlFor="defCompany" className="font-normal cursor-pointer">单位/公司</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individual" id="defIndividual" />
                          <Label htmlFor="defIndividual" className="font-normal cursor-pointer">个人</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defendantName">
                        {formData.defendantType === 'company' ? '公司名称' : '姓名'} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="defendantName"
                        value={formData.defendantName}
                        onChange={(e) => updateField('defendantName', e.target.value)}
                        placeholder={formData.defendantType === 'company' ? '如：北京某某建筑公司' : '请输入被告姓名'}
                      />
                      {errors.defendantName && <p className="text-xs text-red-500">{errors.defendantName}</p>}
                    </div>

                    {formData.defendantType === 'company' && (
                      <div className="space-y-2">
                        <Label htmlFor="defendantCode">统一社会信用代码</Label>
                        <Input
                          id="defendantCode"
                          value={formData.defendantCode}
                          onChange={(e) => updateField('defendantCode', e.target.value)}
                          placeholder="18位统一社会信用代码"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="defendantAddress">
                        {formData.defendantType === 'company' ? '住所地' : '住址'} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="defendantAddress"
                        value={formData.defendantAddress}
                        onChange={(e) => updateField('defendantAddress', e.target.value)}
                        placeholder="被告的详细地址"
                      />
                      {errors.defendantAddress && <p className="text-xs text-red-500">{errors.defendantAddress}</p>}
                    </div>

                    {formData.defendantType === 'company' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="defendantLegalPerson">法定代表人/负责人</Label>
                            <Input
                              id="defendantLegalPerson"
                              value={formData.defendantLegalPerson}
                              onChange={(e) => updateField('defendantLegalPerson', e.target.value)}
                              placeholder="公司法定代表人姓名"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="defendantPhone">联系电话</Label>
                            <Input
                              id="defendantPhone"
                              type="tel"
                              value={formData.defendantPhone}
                              onChange={(e) => updateField('defendantPhone', e.target.value)}
                              placeholder="被告联系电话"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => document.querySelector<HTMLElement>('[data-value="applicant"]')?.click()}
                    className="flex-1"
                  >
                    上一步
                  </Button>
                  <Button 
                    onClick={() => document.querySelector<HTMLElement>('[data-value="case"]')?.click()}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  >
                    下一步：填写案件信息
                  </Button>
                </div>
              </TabsContent>

              {/* 案件信息 */}
              <TabsContent value="case" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">案件基本情况</CardTitle>
                    <CardDescription>填写与欠薪相关的详细信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName">工程/项目名称</Label>
                      <Input
                        id="projectName"
                        value={formData.projectName}
                        onChange={(e) => updateField('projectName', e.target.value)}
                        placeholder="如：某某工地 / 某某工程项目"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workLocation">工作地点</Label>
                      <Input
                        id="workLocation"
                        value={formData.workLocation}
                        onChange={(e) => updateField('workLocation', e.target.value)}
                        placeholder="具体工作地点"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workStartDate">
                          工作开始时间 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="workStartDate"
                          type="date"
                          value={formData.workStartDate}
                          onChange={(e) => updateField('workStartDate', e.target.value)}
                        />
                        {errors.workStartDate && <p className="text-xs text-red-500">{errors.workStartDate}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="workEndDate">
                          工作结束时间 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="workEndDate"
                          type="date"
                          value={formData.workEndDate}
                          onChange={(e) => updateField('workEndDate', e.target.value)}
                        />
                        {errors.workEndDate && <p className="text-xs text-red-500">{errors.workEndDate}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="owedAmount">
                          拖欠工资金额(元) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="owedAmount"
                          type="number"
                          value={formData.owedAmount}
                          onChange={(e) => updateField('owedAmount', e.target.value)}
                          placeholder="请输入金额"
                        />
                        {errors.owedAmount && <p className="text-xs text-red-500">{errors.owedAmount}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owedAmountCN">金额大写</Label>
                        <Input
                          id="owedAmountCN"
                          value={formData.owedAmountCN}
                          onChange={(e) => updateField('owedAmountCN', e.target.value)}
                          placeholder="如：伍万元整"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="factDescription">
                        事实与理由 <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="factDescription"
                        value={formData.factDescription}
                        onChange={(e) => updateField('factDescription', e.target.value)}
                        placeholder="请详细描述拖欠工资的事实经过，包括时间、地点、经过、金额等"
                        className="min-h-[120px]"
                      />
                      {errors.factDescription && <p className="text-xs text-red-500">{errors.factDescription}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>相关材料</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="hasContract" 
                          checked={formData.hasContract}
                          onCheckedChange={(v) => updateField('hasContract', v as boolean)}
                        />
                        <Label htmlFor="hasContract" className="font-normal cursor-pointer">
                          有签订劳动合同
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hasEvidence">证据材料</Label>
                      <Textarea
                        id="hasEvidence"
                        value={formData.hasEvidence}
                        onChange={(e) => updateField('hasEvidence', e.target.value)}
                        placeholder="请列出您掌握的证据，如：劳动合同、工资条、聊天记录、考勤记录等"
                        className="min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => document.querySelector<HTMLElement>('[data-value="defendant"]')?.click()}
                    className="flex-1"
                  >
                    上一步
                  </Button>
                  <Button 
                    onClick={() => document.querySelector<HTMLElement>('[data-value="request"]')?.click()}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  >
                    下一步：填写诉讼请求
                  </Button>
                </div>
              </TabsContent>

              {/* 诉讼请求 */}
              <TabsContent value="request" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">诉讼请求与提交信息</CardTitle>
                    <CardDescription>选择您的诉讼请求并填写管辖法院</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label>诉讼请求（可多选）</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            const newRequests = formData.requestType.includes('salary') 
                              ? formData.requestType.filter(r => r !== 'salary')
                              : [...formData.requestType, 'salary'];
                            updateField('requestType', newRequests);
                          }}
                        >
                          <Checkbox 
                            checked={formData.requestType.includes('salary')}
                            onCheckedChange={() => {}}
                          />
                          <Label className="font-normal cursor-pointer">支付拖欠工资</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            const newRequests = formData.requestType.includes('compensation') 
                              ? formData.requestType.filter(r => r !== 'compensation')
                              : [...formData.requestType, 'compensation'];
                            updateField('requestType', newRequests);
                          }}
                        >
                          <Checkbox 
                            checked={formData.requestType.includes('compensation')}
                            onCheckedChange={() => {}}
                          />
                          <Label className="font-normal cursor-pointer">支付赔偿金</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            const newRequests = formData.requestType.includes('economic') 
                              ? formData.requestType.filter(r => r !== 'economic')
                              : [...formData.requestType, 'economic'];
                            updateField('requestType', newRequests);
                          }}
                        >
                          <Checkbox 
                            checked={formData.requestType.includes('economic')}
                            onCheckedChange={() => {}}
                          />
                          <Label className="font-normal cursor-pointer">经济补偿金</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            const newRequests = formData.requestType.includes('double') 
                              ? formData.requestType.filter(r => r !== 'double')
                              : [...formData.requestType, 'double'];
                            updateField('requestType', newRequests);
                          }}
                        >
                          <Checkbox 
                            checked={formData.requestType.includes('double')}
                            onCheckedChange={() => {}}
                          />
                          <Label className="font-normal cursor-pointer">未签合同双倍工资</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="courtName">
                        管辖法院 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="courtName"
                        value={formData.courtName}
                        onChange={(e) => updateField('courtName', e.target.value)}
                        placeholder="如：XX区人民法院"
                      />
                      {errors.courtName && <p className="text-xs text-red-500">{errors.courtName}</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50/50 border-amber-100">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-700 space-y-1">
                        <p className="font-medium">提交前检查</p>
                        <ul className="text-xs space-y-0.5 list-disc list-inside">
                          <li>确认申请人信息填写正确</li>
                          <li>确认被告信息完整</li>
                          <li>确认欠薪金额准确</li>
                          <li>确认管辖法院正确</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={generateDocument}
                  disabled={isGenerating}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      正在生成文书...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      生成法律文书
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && generatedDocument && (
          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white shadow-xl shadow-emerald-500/10">
              <CardHeader className="pb-2 bg-gradient-to-r from-emerald-100/50 to-transparent">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                  生成的法律文书
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-white/80 p-4 rounded-xl border border-emerald-100/50 max-h-[500px] overflow-y-auto">
                  <MarkdownRenderer 
                    content={generatedDocument} 
                    className="document-preview"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={copyToClipboard} 
                    className="flex-1 gap-2 border-emerald-200 hover:bg-emerald-50"
                  >
                    {copied ? <><Check className="h-4 w-4" /> 已复制</> : <><Copy className="h-4 w-4" /> 复制文书</>}
                  </Button>
                  <Button 
                    onClick={downloadDocument} 
                    className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                  >
                    <Download className="h-4 w-4" />
                    下载.md
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 space-y-1">
                    <p className="font-medium">文书使用说明</p>
                    <ul className="text-xs space-y-0.5 list-disc list-inside">
                      <li>请仔细核对文书内容，确保信息准确</li>
                      <li>如有需要，可手动调整文书格式</li>
                      <li>下载后请打印签字，并按要求提交法院</li>
                      <li>如需帮助，请联系平台客服或前往线下服务点</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setStep('select');
                  setFormData(initialFormData);
                  setGeneratedDocument(null);
                }}
                className="flex-1"
              >
                生成新文书
              </Button>
              <Button 
                onClick={() => router.push('/apply')}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                在线申请
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
