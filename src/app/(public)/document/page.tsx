'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Loader2,
  Copy,
  Download,
  AlertCircle,
  Info,
  Users,
  Briefcase,
  Scale,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/markdown';

type DocumentType = 'support' | 'labor_dispute' | 'litigation' | 'payment_order';
type Step = 'select' | 'form' | 'preview';

interface FormData {
  // 文书类型
  documentType: DocumentType;
  
  // 申请人信息
  applicantName: string;
  applicantGender: string;
  applicantBirthDate: string;
  applicantNation: string;
  applicantIdCard: string;
  applicantPhone: string;
  applicantAddress: string;
  applicantResidence: string;
  applicantWorkUnit: string;
  
  // 被告信息
  defendantName: string;
  defendantAddress: string;
  defendantCode: string;
  defendantLegalPerson: string;
  defendantPhone: string;
  
  // 第二被告（可选）
  hasSecondDefendant: boolean;
  secondDefendantName: string;
  secondDefendantIdCard: string;
  secondDefendantAddress: string;
  
  // 工作信息
  workStartDate: string;
  workEndDate: string;
  workPosition: string;
  workLocation: string;
  workContent: string;
  
  // 欠薪信息
  unpaidAmount: string;
  unpaidStartDate: string;
  unpaidReason: string;
  unpaidCompanyName: string;
  unpaidCompanyPhone: string;
  
  // 诉讼请求
  requestType: string[];
  salaryAmount: string;
  doubleWageAmount: string;
  overtimeAmount: string;
  economicCompensationAmount: string;
  otherRequests: string;
  totalAmount: string;
  courtName: string;
  
  // 证据信息
  hasEvidence: boolean;
  evidenceList: Array<{
    name: string;
    content: string;
  }>;
}

const initialFormData: FormData = {
  documentType: 'support',
  applicantName: '',
  applicantGender: '',
  applicantBirthDate: '',
  applicantNation: '',
  applicantIdCard: '',
  applicantPhone: '',
  applicantAddress: '',
  applicantResidence: '',
  applicantWorkUnit: '',
  defendantName: '',
  defendantAddress: '',
  defendantCode: '',
  defendantLegalPerson: '',
  defendantPhone: '',
  hasSecondDefendant: false,
  secondDefendantName: '',
  secondDefendantIdCard: '',
  secondDefendantAddress: '',
  workStartDate: '',
  workEndDate: '',
  workPosition: '',
  workLocation: '',
  workContent: '',
  unpaidAmount: '',
  unpaidStartDate: '',
  unpaidReason: '',
  unpaidCompanyName: '',
  unpaidCompanyPhone: '',
  requestType: [],
  salaryAmount: '',
  doubleWageAmount: '',
  overtimeAmount: '',
  economicCompensationAmount: '',
  otherRequests: '',
  totalAmount: '',
  courtName: '',
  hasEvidence: false,
  evidenceList: [{ name: '', content: '' }],
};

export default function DocumentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  // 根据文书类型获取标题
  const getDocumentTypeName = (type: DocumentType) => {
    switch (type) {
      case 'support': return '支持起诉申请书';
      case 'labor_dispute': return '劳动争议仲裁申请书';
      case 'litigation': return '民事起诉状';
      case 'payment_order': return '支付令申请书';
      default: return '法律文书';
    }
  };

  // 根据文书类型获取说明
  const getDocumentTypeDescription = (type: DocumentType) => {
    switch (type) {
      case 'support': return '向检察机关申请支持起诉，维护农民工合法权益';
      case 'labor_dispute': return '向劳动仲裁委员会申请劳动仲裁';
      case 'litigation': return '向人民法院提起民事诉讼';
      case 'payment_order': return '向人民法院申请支付令，督促支付拖欠工资';
      default: return '';
    }
  };

  // 更新字段
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 切换诉讼请求
  const toggleRequest = (request: string) => {
    const newRequests = formData.requestType.includes(request)
      ? formData.requestType.filter(r => r !== request)
      : [...formData.requestType, request];
    updateField('requestType', newRequests);
  };

  // 添加证据
  const addEvidence = () => {
    updateField('evidenceList', [...formData.evidenceList, { name: '', content: '' }]);
  };

  // 删除证据
  const removeEvidence = (index: number) => {
    updateField('evidenceList', formData.evidenceList.filter((_, i) => i !== index));
  };

  // 更新证据
  const updateEvidence = (index: number, field: 'name' | 'content', value: string) => {
    const newList = [...formData.evidenceList];
    newList[index] = { ...newList[index], [field]: value };
    updateField('evidenceList', newList);
  };

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 基本信息验证
    if (!formData.applicantName.trim()) newErrors.applicantName = '请输入申请人姓名';
    if (!formData.applicantGender) newErrors.applicantGender = '请选择性别';
    if (!formData.applicantBirthDate.trim()) newErrors.applicantBirthDate = '请输入出生日期';
    if (!formData.applicantIdCard.trim()) newErrors.applicantIdCard = '请输入身份证号';
    else if (!/^\d{17}[\dXx]$/.test(formData.applicantIdCard)) newErrors.applicantIdCard = '身份证号格式不正确';
    if (!formData.applicantPhone.trim()) newErrors.applicantPhone = '请输入联系电话';
    else if (!/^1[3-9]\d{9}$/.test(formData.applicantPhone)) newErrors.applicantPhone = '手机号格式不正确';

    // 被告信息验证
    if (!formData.defendantName.trim()) newErrors.defendantName = '请输入被告/被申请人名称';
    if (!formData.defendantAddress.trim()) newErrors.defendantAddress = '请输入被告地址';
    if (!formData.defendantCode.trim()) newErrors.defendantCode = '请输入统一社会信用代码';
    else if (!/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(formData.defendantCode)) {
      newErrors.defendantCode = '统一社会信用代码格式不正确';
    }

    // 欠薪信息验证
    if (!formData.unpaidAmount.trim()) newErrors.unpaidAmount = '请输入欠薪金额';
    if (!formData.unpaidCompanyName.trim()) newErrors.unpaidCompanyName = '请输入欠薪单位名称';

    // 工作信息验证
    if (!formData.workStartDate.trim()) newErrors.workStartDate = '请输入工作开始时间';

    // 诉讼请求验证
    if (formData.requestType.length === 0) newErrors.requestType = '请至少选择一项诉讼请求';
    if (!formData.courtName.trim()) newErrors.courtName = '请输入管辖法院/仲裁委名称';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 生成文书
  const generateDocument = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('生成失败');

      const data = await response.json();
      setGeneratedDocument(data.document);
      setStep('preview');
    } catch (error) {
      console.error('生成文书失败:', error);
      alert('生成文书失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 复制文书
  const copyToClipboard = async () => {
    if (!generatedDocument) return;
    try {
      await navigator.clipboard.writeText(generatedDocument);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 下载文书
  const downloadDocument = () => {
    if (!generatedDocument) return;
    const blob = new Blob([generatedDocument], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getDocumentTypeName(formData.documentType)}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 重置表单
  const resetForm = () => {
    setStep('select');
    setFormData(initialFormData);
    setGeneratedDocument(null);
    setErrors({});
    setCurrentTab('basic');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">法律文书生成</h1>
              <p className="text-xs text-slate-500">一键生成专业的法律文书</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Step 1: Select Document Type */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">选择文书类型</h2>
              <p className="text-sm text-slate-500">根据您的需求选择合适的法律文书</p>
            </div>

            <div className="grid gap-4">
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  formData.documentType === 'support' 
                    ? "border-emerald-500 bg-emerald-50/30" 
                    : "border-transparent hover:border-emerald-200"
                )}
                onClick={() => updateField('documentType', 'support')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      formData.documentType === 'support' ? "bg-emerald-500" : "bg-slate-100"
                    )}>
                      <Scale className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-1">支持起诉申请书</h3>
                      <p className="text-sm text-slate-500">向检察机关申请支持起诉，维护农民工合法权益</p>
                    </div>
                    {formData.documentType === 'support' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  formData.documentType === 'labor_dispute' 
                    ? "border-emerald-500 bg-emerald-50/30" 
                    : "border-transparent hover:border-emerald-200"
                )}
                onClick={() => updateField('documentType', 'labor_dispute')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      formData.documentType === 'labor_dispute' ? "bg-emerald-500" : "bg-slate-100"
                    )}>
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-1">劳动争议仲裁申请书</h3>
                      <p className="text-sm text-slate-500">向劳动仲裁委员会申请劳动仲裁，解决劳动争议</p>
                    </div>
                    {formData.documentType === 'labor_dispute' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  formData.documentType === 'litigation' 
                    ? "border-emerald-500 bg-emerald-50/30" 
                    : "border-transparent hover:border-emerald-200"
                )}
                onClick={() => updateField('documentType', 'litigation')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      formData.documentType === 'litigation' ? "bg-emerald-500" : "bg-slate-100"
                    )}>
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-1">民事起诉状</h3>
                      <p className="text-sm text-slate-500">向人民法院提起民事诉讼，主张合法权益</p>
                    </div>
                    {formData.documentType === 'litigation' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  formData.documentType === 'payment_order' 
                    ? "border-emerald-500 bg-emerald-50/30" 
                    : "border-transparent hover:border-emerald-200"
                )}
                onClick={() => updateField('documentType', 'payment_order')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      formData.documentType === 'payment_order' ? "bg-emerald-500" : "bg-slate-100"
                    )}>
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-1">支付令申请书</h3>
                      <p className="text-sm text-slate-500">向人民法院申请支付令，督促支付拖欠工资</p>
                    </div>
                    {formData.documentType === 'payment_order' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button 
              onClick={() => setStep('form')}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
            >
              开始填写
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Fill Form */}
        {step === 'form' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{getDocumentTypeName(formData.documentType)}</h2>
                <p className="text-xs text-slate-500">{getDocumentTypeDescription(formData.documentType)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                重新选择
              </Button>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="defendant">被告信息</TabsTrigger>
                <TabsTrigger value="work">工作信息</TabsTrigger>
                <TabsTrigger value="request">诉讼请求</TabsTrigger>
              </TabsList>

              {/* 基本信息 */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">申请人基本信息</CardTitle>
                    <CardDescription>请填写您的个人信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="applicantName">
                          姓名 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="applicantName"
                          value={formData.applicantName}
                          onChange={(e) => updateField('applicantName', e.target.value)}
                          placeholder="请输入您的姓名"
                        />
                        {errors.applicantName && <p className="text-xs text-red-500">{errors.applicantName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>性别 <span className="text-red-500">*</span></Label>
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

                    <div className="grid grid-cols-2 gap-4">
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

                    <div className="space-y-2">
                      <Label htmlFor="applicantIdCard">
                        身份证号 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="applicantIdCard"
                        value={formData.applicantIdCard}
                        onChange={(e) => updateField('applicantIdCard', e.target.value)}
                        placeholder="请输入18位身份证号"
                      />
                      {errors.applicantIdCard && <p className="text-xs text-red-500">{errors.applicantIdCard}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicantPhone">
                        联系电话 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="applicantPhone"
                        value={formData.applicantPhone}
                        onChange={(e) => updateField('applicantPhone', e.target.value)}
                        placeholder="请输入手机号"
                      />
                      {errors.applicantPhone && <p className="text-xs text-red-500">{errors.applicantPhone}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicantAddress">户籍地地址</Label>
                      <Input
                        id="applicantAddress"
                        value={formData.applicantAddress}
                        onChange={(e) => updateField('applicantAddress', e.target.value)}
                        placeholder="请输入户籍地地址"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicantResidence">经常居住地</Label>
                      <Input
                        id="applicantResidence"
                        value={formData.applicantResidence}
                        onChange={(e) => updateField('applicantResidence', e.target.value)}
                        placeholder="请输入经常居住地"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicantWorkUnit">工作单位</Label>
                      <Input
                        id="applicantWorkUnit"
                        value={formData.applicantWorkUnit}
                        onChange={(e) => updateField('applicantWorkUnit', e.target.value)}
                        placeholder="请输入工作单位（选填）"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 欠薪信息 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">欠薪情况</CardTitle>
                    <CardDescription>请详细填写欠薪信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="unpaidCompanyName">
                        欠薪单位/个人 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="unpaidCompanyName"
                        value={formData.unpaidCompanyName}
                        onChange={(e) => updateField('unpaidCompanyName', e.target.value)}
                        placeholder="请输入欠薪单位名称或个人姓名"
                      />
                      {errors.unpaidCompanyName && <p className="text-xs text-red-500">{errors.unpaidCompanyName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unpaidAmount">
                          欠薪金额（元） <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="unpaidAmount"
                          type="number"
                          value={formData.unpaidAmount}
                          onChange={(e) => updateField('unpaidAmount', e.target.value)}
                          placeholder="请输入欠薪金额"
                        />
                        {errors.unpaidAmount && <p className="text-xs text-red-500">{errors.unpaidAmount}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unpaidCompanyPhone">欠薪单位联系方式</Label>
                        <Input
                          id="unpaidCompanyPhone"
                          value={formData.unpaidCompanyPhone}
                          onChange={(e) => updateField('unpaidCompanyPhone', e.target.value)}
                          placeholder="电话"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unpaidReason">欠薪事由</Label>
                      <Textarea
                        id="unpaidReason"
                        value={formData.unpaidReason}
                        onChange={(e) => updateField('unpaidReason', e.target.value)}
                        placeholder="请详细描述欠薪情况"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    返回
                  </Button>
                  <Button onClick={() => setCurrentTab('defendant')} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                    下一步
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>

              {/* 被告信息 */}
              <TabsContent value="defendant" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">被告/被申请人信息（第一被告）</CardTitle>
                    <CardDescription>请填写被告/被申请人的基本信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="defendantName">
                        名称/姓名 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="defendantName"
                        value={formData.defendantName}
                        onChange={(e) => updateField('defendantName', e.target.value)}
                        placeholder="公司名称或个人姓名"
                      />
                      {errors.defendantName && <p className="text-xs text-red-500">{errors.defendantName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defendantCode">
                        统一社会信用代码/身份证号 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="defendantCode"
                        value={formData.defendantCode}
                        onChange={(e) => updateField('defendantCode', e.target.value)}
                        placeholder="18位统一社会信用代码或身份证号"
                      />
                      {errors.defendantCode && <p className="text-xs text-red-500">{errors.defendantCode}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defendantAddress">地址</Label>
                      <Input
                        id="defendantAddress"
                        value={formData.defendantAddress}
                        onChange={(e) => updateField('defendantAddress', e.target.value)}
                        placeholder="请输入地址"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defendantLegalPerson">法定代表人/负责人</Label>
                        <Input
                          id="defendantLegalPerson"
                          value={formData.defendantLegalPerson}
                          onChange={(e) => updateField('defendantLegalPerson', e.target.value)}
                          placeholder="如：张三"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defendantPhone">联系电话</Label>
                        <Input
                          id="defendantPhone"
                          value={formData.defendantPhone}
                          onChange={(e) => updateField('defendantPhone', e.target.value)}
                          placeholder="电话"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 第二被告 */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">是否有第二被告</h4>
                        <p className="text-xs text-slate-500">如有多个被告，请添加</p>
                      </div>
                      <Checkbox 
                        checked={formData.hasSecondDefendant}
                        onCheckedChange={(v) => updateField('hasSecondDefendant', !!v)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {formData.hasSecondDefendant && (
                  <Card className="border-dashed border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">第二被告信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="secondDefendantName">姓名</Label>
                        <Input
                          id="secondDefendantName"
                          value={formData.secondDefendantName}
                          onChange={(e) => updateField('secondDefendantName', e.target.value)}
                          placeholder="请输入第二被告姓名"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondDefendantIdCard">身份证号</Label>
                        <Input
                          id="secondDefendantIdCard"
                          value={formData.secondDefendantIdCard}
                          onChange={(e) => updateField('secondDefendantIdCard', e.target.value)}
                          placeholder="请输入身份证号"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondDefendantAddress">地址</Label>
                        <Input
                          id="secondDefendantAddress"
                          value={formData.secondDefendantAddress}
                          onChange={(e) => updateField('secondDefendantAddress', e.target.value)}
                          placeholder="请输入地址"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentTab('basic')} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    上一步
                  </Button>
                  <Button onClick={() => setCurrentTab('work')} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                    下一步
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>

              {/* 工作信息 */}
              <TabsContent value="work" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">工作情况</CardTitle>
                    <CardDescription>请填写工作时间和工作内容</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="workEndDate">工作结束时间</Label>
                        <Input
                          id="workEndDate"
                          type="date"
                          value={formData.workEndDate}
                          onChange={(e) => updateField('workEndDate', e.target.value)}
                          placeholder="至今留空"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workPosition">岗位/工种</Label>
                      <Input
                        id="workPosition"
                        value={formData.workPosition}
                        onChange={(e) => updateField('workPosition', e.target.value)}
                        placeholder="如：建筑工人、厨师、服务员"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workLocation">工作地点</Label>
                      <Input
                        id="workLocation"
                        value={formData.workLocation}
                        onChange={(e) => updateField('workLocation', e.target.value)}
                        placeholder="请输入工作地点"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workContent">工作内容</Label>
                      <Textarea
                        id="workContent"
                        value={formData.workContent}
                        onChange={(e) => updateField('workContent', e.target.value)}
                        placeholder="请描述具体工作内容"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 证据信息 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">证据材料</CardTitle>
                    <CardDescription>请填写您持有的证据材料</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">是否有证据材料</h4>
                        <p className="text-xs text-slate-500">如劳动合同、工资条、考勤记录等</p>
                      </div>
                      <Checkbox 
                        checked={formData.hasEvidence}
                        onCheckedChange={(v) => updateField('hasEvidence', !!v)}
                      />
                    </div>

                    {formData.hasEvidence && (
                      <div className="space-y-3 pt-2">
                        {formData.evidenceList.map((evidence, index) => (
                          <div key={index} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">证据 {index + 1}</span>
                              {formData.evidenceList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeEvidence(index)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <Input
                              value={evidence.name}
                              onChange={(e) => updateEvidence(index, 'name', e.target.value)}
                              placeholder="证据名称（如：劳动合同）"
                            />
                            <Input
                              value={evidence.content}
                              onChange={(e) => updateEvidence(index, 'content', e.target.value)}
                              placeholder="证明内容（如：证明劳动关系）"
                            />
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addEvidence}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          添加更多证据
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentTab('defendant')} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    上一步
                  </Button>
                  <Button onClick={() => setCurrentTab('request')} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                    下一步
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>

              {/* 诉讼请求 */}
              <TabsContent value="request" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">诉讼请求</CardTitle>
                    <CardDescription>请选择您要主张的权利</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label>诉讼请求（可多选） <span className="text-red-500">*</span></Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div 
                          className={cn(
                            "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                            formData.requestType.includes('salary')
                              ? "border-emerald-500 bg-emerald-50"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleRequest('salary')}
                        >
                          <Checkbox checked={formData.requestType.includes('salary')} onCheckedChange={() => {}} />
                          <Label className="font-normal cursor-pointer flex-1">支付拖欠工资</Label>
                        </div>
                        
                        <div 
                          className={cn(
                            "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                            formData.requestType.includes('double')
                              ? "border-emerald-500 bg-emerald-50"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleRequest('double')}
                        >
                          <Checkbox checked={formData.requestType.includes('double')} onCheckedChange={() => {}} />
                          <Label className="font-normal cursor-pointer flex-1">未签合同双倍工资</Label>
                        </div>
                        
                        <div 
                          className={cn(
                            "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                            formData.requestType.includes('overtime')
                              ? "border-emerald-500 bg-emerald-50"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleRequest('overtime')}
                        >
                          <Checkbox checked={formData.requestType.includes('overtime')} onCheckedChange={() => {}} />
                          <Label className="font-normal cursor-pointer flex-1">加班费</Label>
                        </div>
                        
                        <div 
                          className={cn(
                            "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                            formData.requestType.includes('economic')
                              ? "border-emerald-500 bg-emerald-50"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleRequest('economic')}
                        >
                          <Checkbox checked={formData.requestType.includes('economic')} onCheckedChange={() => {}} />
                          <Label className="font-normal cursor-pointer flex-1">经济补偿金</Label>
                        </div>

                        <div 
                          className={cn(
                            "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                            formData.requestType.includes('compensation')
                              ? "border-emerald-500 bg-emerald-50"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleRequest('compensation')}
                        >
                          <Checkbox checked={formData.requestType.includes('compensation')} onCheckedChange={() => {}} />
                          <Label className="font-normal cursor-pointer flex-1">赔偿金</Label>
                        </div>
                      </div>
                      {errors.requestType && <p className="text-xs text-red-500">{errors.requestType}</p>}
                    </div>

                    {/* 金额明细 */}
                    {formData.requestType.includes('salary') && (
                      <div className="space-y-2">
                        <Label htmlFor="salaryAmount">拖欠工资金额（元）</Label>
                        <Input
                          id="salaryAmount"
                          type="number"
                          value={formData.salaryAmount}
                          onChange={(e) => updateField('salaryAmount', e.target.value)}
                          placeholder="请输入金额"
                        />
                      </div>
                    )}

                    {formData.requestType.includes('double') && (
                      <div className="space-y-2">
                        <Label htmlFor="doubleWageAmount">双倍工资金额（元）</Label>
                        <Input
                          id="doubleWageAmount"
                          type="number"
                          value={formData.doubleWageAmount}
                          onChange={(e) => updateField('doubleWageAmount', e.target.value)}
                          placeholder="请输入金额"
                        />
                      </div>
                    )}

                    {formData.requestType.includes('overtime') && (
                      <div className="space-y-2">
                        <Label htmlFor="overtimeAmount">加班费金额（元）</Label>
                        <Input
                          id="overtimeAmount"
                          type="number"
                          value={formData.overtimeAmount}
                          onChange={(e) => updateField('overtimeAmount', e.target.value)}
                          placeholder="请输入金额"
                        />
                      </div>
                    )}

                    {formData.requestType.includes('economic') && (
                      <div className="space-y-2">
                        <Label htmlFor="economicCompensationAmount">经济补偿金金额（元）</Label>
                        <Input
                          id="economicCompensationAmount"
                          type="number"
                          value={formData.economicCompensationAmount}
                          onChange={(e) => updateField('economicCompensationAmount', e.target.value)}
                          placeholder="请输入金额"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="totalAmount">诉讼标的总额（元）</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        value={formData.totalAmount}
                        onChange={(e) => updateField('totalAmount', e.target.value)}
                        placeholder="请输入总金额"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otherRequests">其他诉讼请求</Label>
                      <Textarea
                        id="otherRequests"
                        value={formData.otherRequests}
                        onChange={(e) => updateField('otherRequests', e.target.value)}
                        placeholder="如有其他诉讼请求，请在此填写"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 管辖法院 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {formData.documentType === 'support' ? '受理检察院' : 
                       formData.documentType === 'labor_dispute' ? '劳动仲裁委' : '管辖法院'}
                    </CardTitle>
                    <CardDescription>请填写受理机关名称</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      id="courtName"
                      value={formData.courtName}
                      onChange={(e) => updateField('courtName', e.target.value)}
                      placeholder={formData.documentType === 'support' ? '如：XX市人民检察院' : 
                                  formData.documentType === 'labor_dispute' ? '如：XX市劳动人事争议仲裁委员会' : 
                                  '如：XX区人民法院'}
                    />
                    {errors.courtName && <p className="text-xs text-red-500">{errors.courtName}</p>}
                  </CardContent>
                </Card>

                {/* 提示 */}
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
                          <li>确认管辖机关正确</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentTab('work')} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    上一步
                  </Button>
                  <Button 
                    onClick={generateDocument}
                    disabled={isGenerating}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        正在生成...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        生成文书
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && generatedDocument && (
          <div className="space-y-4">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white shadow-xl shadow-emerald-500/10">
              <CardHeader className="pb-2 bg-gradient-to-r from-emerald-100/50 to-transparent">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                  {getDocumentTypeName(formData.documentType)}
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
                    {copied ? <><Check className="h-4 w-4" /> 已复制</> : <><Copy className="h-4 w-4" /> 复制</>}
                  </Button>
                  <Button 
                    onClick={downloadDocument} 
                    className="flex-1 gap-2 bg-emerald-500 hover:bg-emerald-600"
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
                      <li>下载后请打印签字，并按要求提交</li>
                      <li>如需帮助，请联系平台客服</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={resetForm}
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
