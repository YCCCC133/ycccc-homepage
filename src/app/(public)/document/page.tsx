'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import {
  FileText,
  User,
  Building2,
  DollarSign,
  Calendar,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Download,
  FileDown,
  ArrowRight,
  Sparkles,
  Scale,
  Shield,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const formSchema = z.object({
  // 原告信息
  plaintiffName: z.string().min(2, '请输入正确的姓名'),
  plaintiffIdCard: z.string().length(18, '请输入正确的身份证号'),
  plaintiffPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  plaintiffAddress: z.string().min(5, '请输入详细地址'),
  
  // 被告信息
  defendantName: z.string().min(2, '请输入用人单位名称'),
  defendantIdCard: z.string().optional(),
  defendantPhone: z.string().optional(),
  defendantAddress: z.string().min(5, '请输入用人单位地址'),
  
  // 案件信息
  caseType: z.string().min(1, '请选择案由'),
  unpaidAmount: z.string().min(1, '请输入欠薪金额'),
  unpaidMonths: z.string().min(1, '请输入欠薪月数'),
  workStartDate: z.string().min(1, '请选择入职时间'),
  unpaidStartDate: z.string().min(1, '请选择欠薪开始时间'),
  
  // 事实与理由
  facts: z.string().min(20, '请详细描述事实经过，至少20个字符'),
  
  // 诉讼请求
  claims: z.string().min(10, '请填写诉讼请求，至少10个字符'),
  
  // 证据
  evidence: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const caseTypes = [
  { value: '追索劳动报酬纠纷', label: '追索劳动报酬纠纷' },
  { value: '劳务合同纠纷', label: '劳务合同纠纷' },
  { value: '劳动合同纠纷', label: '劳动合同纠纷' },
  { value: '其他劳动争议', label: '其他劳动争议' },
];

export default function DocumentPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plaintiffName: '',
      plaintiffIdCard: '',
      plaintiffPhone: '',
      plaintiffAddress: '',
      defendantName: '',
      defendantIdCard: '',
      defendantPhone: '',
      defendantAddress: '',
      caseType: '',
      unpaidAmount: '',
      unpaidMonths: '',
      workStartDate: '',
      unpaidStartDate: '',
      facts: '',
      claims: '',
      evidence: '',
    },
  });

  const watchAllFields = form.watch();
  
  // Calculate form progress
  const calculateProgress = () => {
    const fields = Object.values(watchAllFields);
    const filledFields = fields.filter(v => v && v.toString().length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  useState(() => {
    setFormProgress(calculateProgress());
  });

  const handleCopy = async () => {
    if (generatedDocument) {
      await navigator.clipboard.writeText(generatedDocument);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedDocument) {
      const blob = new Blob([generatedDocument], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `民事起诉状_${form.getValues('plaintiffName')}_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('文书已下载');
    }
  };

  const generateDocument = async (data: FormData) => {
    setIsGenerating(true);
    setGeneratedDocument(null);

    try {
      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: '民事起诉状',
          data: data,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGeneratedDocument(result.document);
        toast.success('文书生成成功');
      } else {
        // 如果 API 失败，使用模板生成
        const doc = generateTemplateDocument(data);
        setGeneratedDocument(doc);
        toast.success('文书已生成');
      }
    } catch {
      // 网络错误时使用模板
      const doc = generateTemplateDocument(data);
      setGeneratedDocument(doc);
      toast.success('文书已生成');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTemplateDocument = (data: FormData): string => {
    const today = new Date().toLocaleDateString('zh-CN');
    
    return `
民事起诉状

原告：${data.plaintiffName}
    身份证号：${data.plaintiffIdCard}
    联系电话：${data.plaintiffPhone}
    地址：${data.plaintiffAddress}

被告：${data.defendantName}
    联系电话：${data.defendantPhone || '无'}
    地址：${data.defendantAddress}

诉讼请求

一、判令被告支付原告拖欠的工资人民币${data.unpaidAmount}元（${data.unpaidMonths}个月）；

二、判令被告支付原告经济补偿金（如有）；

三、本案诉讼费用由被告承担。

事实与理由

一、原告于${data.workStartDate}入职被告处工作，担任${data.caseType}相关工作。

二、自${data.unpaidStartDate}起，被告开始无故拖欠原告工资，至今已拖欠工资共计人民币${data.unpaidAmount}元（${data.unpaidMonths}个月）。

三、原告多次向被告催讨工资，但被告以各种理由推脱，拒不支付。

四、原告认为，被告的行为严重违反了《劳动合同法》等相关法律规定，损害了原告的合法权益。

${data.facts ? `\n具体事实经过：\n${data.facts}\n` : ''}

${data.evidence ? `\n证据清单：\n${data.evidence}\n` : ''}

此致

${data.defendantAddress.split('市')[0]}人民法院

                                                                        起诉人（签名）：${data.plaintiffName}
                                                                        日    期：${today}
`;
  };

  const onSubmit = (data: FormData) => {
    generateDocument(data);
  };

  const scrollToDocument = () => {
    document.getElementById('generated-document')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 py-16 md:py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-white/10 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center text-center">
            <Badge className="mb-4 bg-white/20 text-white border-0 px-4 py-1">
              <FileDown className="mr-2 h-3.5 w-3.5" />
              法律文书服务
            </Badge>
            
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              一键生成民事起诉状
            </h1>
            
            <p className="mb-6 max-w-2xl text-lg text-white/90">
              只需填写基本信息，系统即可自动生成规范的民事起诉状文书，
              <br className="hidden md:block" />
              大幅降低维权门槛，让法律服务触手可及
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-white/90">
                <Link href="/consult">
                  <Sparkles className="mr-2 h-4 w-4" />
                  先行咨询
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                <Link href="/report">
                  填报线索
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form Section */}
          <div>
            <Card className="border-emerald-100 shadow-lg shadow-emerald-500/5">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">填写起诉信息</CardTitle>
                    <CardDescription>请填写真实有效的案件信息</CardDescription>
                  </div>
                </div>
                {formProgress > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>填写进度</span>
                      <span>{calculateProgress()}%</span>
                    </div>
                    <Progress value={calculateProgress()} className="mt-2 h-2" />
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* 原告信息 */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <User className="h-4 w-4" />
                        原告信息（您）
                      </h3>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="plaintiffName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>姓名</FormLabel>
                              <FormControl>
                                <Input placeholder="请输入您的姓名" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="plaintiffIdCard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>身份证号</FormLabel>
                              <FormControl>
                                <Input placeholder="18位身份证号" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="plaintiffPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>联系电话</FormLabel>
                              <FormControl>
                                <Input placeholder="手机号码" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="plaintiffAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>地址</FormLabel>
                              <FormControl>
                                <Input placeholder="详细地址" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* 被告信息 */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                        <Building2 className="h-4 w-4" />
                        被告信息（用人单位）
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="defendantName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>用人单位名称</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入公司/单位全称" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="defendantPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>联系电话（选填）</FormLabel>
                              <FormControl>
                                <Input placeholder="公司电话" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="defendantAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>地址</FormLabel>
                              <FormControl>
                                <Input placeholder="公司地址" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* 案件信息 */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                        <DollarSign className="h-4 w-4" />
                        案件信息
                      </h3>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="caseType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>案由</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="选择案由" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {caseTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="unpaidAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>欠薪金额（元）</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="如：50000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="unpaidMonths"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>欠薪月数</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="如：3" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="workStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>入职时间</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="unpaidStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>欠薪开始时间</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* 事实与理由 */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
                        <FileText className="h-4 w-4" />
                        事实与理由
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="facts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>事实经过</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="请详细描述欠薪的事实经过，包括工作时间、欠薪原因等..." 
                                className="min-h-[120px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="evidence"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>证据清单（选填）</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="请列出您持有的证据，如：劳动合同、工资条、考勤记录等" 
                                className="min-h-[80px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          正在生成文书...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          一键生成起诉状
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {/* 生成的文书预览 */}
            {generatedDocument && (
              <Card id="generated-document" className="border-purple-100 shadow-lg shadow-purple-500/5">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50/50 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">民事起诉状</CardTitle>
                        <CardDescription>已生成文书可直接使用</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? (
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        {copied ? '已复制' : '复制'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        下载
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg bg-slate-50 p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {generatedDocument}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 提示信息 */}
            <Card className="border-amber-100 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-amber-800">
                    <p className="font-medium">温馨提示</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-700">
                      <li>生成的文书仅供参考使用</li>
                      <li>提交法院前建议咨询专业律师</li>
                      <li>请确保填写的信息真实有效</li>
                      <li>证据材料对案件至关重要，请妥善保管</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 相关服务 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">相关服务</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/consult" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <Scale className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">智能法律咨询</p>
                    <p className="text-sm text-muted-foreground">获取专业法律建议</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                
                <Link href="/report" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">线索填报</p>
                    <p className="text-sm text-muted-foreground">登记欠薪线索</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                
                <Link href="/apply" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">申请支持起诉</p>
                    <p className="text-sm text-muted-foreground">检察支持维权</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
