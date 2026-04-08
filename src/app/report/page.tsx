'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import {
  User,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  Loader2,
  ArrowRight,
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
  FormDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  // 个人信息
  name: z.string().min(2, '姓名至少2个字符'),
  idCard: z.string().length(18, '请输入正确的身份证号'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  address: z.string().min(5, '请输入详细地址'),
  
  // 用工信息
  employerName: z.string().min(2, '请输入用人单位名称'),
  employerAddress: z.string().min(5, '请输入用人单位地址'),
  employerContact: z.string().optional(),
  workType: z.string().min(1, '请选择工种类型'),
  workStartDate: z.string().min(1, '请选择入职时间'),
  workEndDate: z.string().optional(),
  
  // 欠薪信息
  salaryType: z.string().min(1, '请选择薪资类型'),
  salaryAmount: z.string().min(1, '请输入欠薪金额'),
  salaryMonths: z.string().min(1, '请输入欠薪月数'),
  totalAmount: z.string().min(1, '请输入欠薪总额'),
  salaryPeriod: z.string().min(1, '请选择欠薪时间段'),
  
  // 其他信息
  description: z.string().min(10, '请详细描述情况，至少10个字符'),
  hasEvidence: z.boolean().default(false),
  evidenceType: z.array(z.string()).optional(),
  
  // 承诺
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: '请阅读并同意相关条款',
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function ReportPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      idCard: '',
      phone: '',
      address: '',
      employerName: '',
      employerAddress: '',
      employerContact: '',
      workType: '',
      workStartDate: '',
      workEndDate: '',
      salaryType: '',
      salaryAmount: '',
      salaryMonths: '',
      totalAmount: '',
      salaryPeriod: '',
      description: '',
      hasEvidence: false,
      evidenceType: [],
      agreeTerms: false,
    },
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const workTypes = [
    '建筑工人',
    '装修工人',
    '环卫工人',
    '家政服务',
    '餐饮服务',
    '快递配送',
    '其他行业',
  ];

  const salaryTypes = ['月薪', '日薪', '计件工资', '包工工资'];

  const evidenceTypes = [
    '劳动合同',
    '工资条/转账记录',
    '考勤记录',
    '工作证/工作服',
    '证人证言',
    '录音/录像',
    '其他证据',
  ];

  const [reportNumber, setReportNumber] = useState<string>('');

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          id_card: data.idCard,
          address: data.address,
          company_name: data.employerName,
          company_address: data.employerAddress,
          owed_amount: parseFloat(data.totalAmount) || 0,
          owed_months: parseInt(data.salaryMonths) || 1,
          worker_count: 1,
          description: data.description,
          evidence: data.hasEvidence ? (data.evidenceType?.join(',') || '有证据') : null,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setReportNumber(result.data.reportNumber || `XC${result.data.id}`);
        setSubmitSuccess(true);
      } else {
        alert(result.error || '提交失败，请重试');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitSuccess) {
    return (
      <div className="mx-auto max-w-3xl bg-background px-4 py-16">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-green-900">
              提交成功！
            </h2>
            <p className="mb-6 text-green-700">
              您的线索已成功提交，我们将在1-3个工作日内与您联系。
            </p>
            <div className="mb-6 rounded-lg bg-white p-4 text-left">
              <div className="mb-2 text-sm text-muted-foreground">
                线索编号：<span className="font-mono font-medium text-foreground">{reportNumber || 'XC' + Date.now().toString().slice(-10)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                提交时间：{new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                继续填报
              </Button>
              <Link href="/cases">
                <Button>查看案件进度</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl bg-background px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">线索填报</h1>
        <p className="text-muted-foreground">
          请如实填写以下信息，我们将严格保护您的个人隐私
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            步骤 {step} / {totalSteps}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Indicator */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex items-center gap-3 rounded-lg border p-4 ${
              step >= s
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/30'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step >= s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
            <div className="flex-1">
              <div className="font-medium">
                {s === 1 && '个人信息'}
                {s === 2 && '用工信息'}
                {s === 3 && '欠薪详情'}
              </div>
              <div className="text-xs text-muted-foreground">
                {s === 1 && '填写个人基本信息'}
                {s === 2 && '填写用工单位信息'}
                {s === 3 && '填写欠薪情况'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  个人信息
                </CardTitle>
                <CardDescription>
                  请填写您的真实个人信息，便于我们与您联系
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          姓名 <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="请输入您的姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          手机号码 <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="请输入手机号码"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="idCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        身份证号 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="请输入18位身份证号码" {...field} />
                      </FormControl>
                      <FormDescription>
                        用于身份核实，我们将严格保密您的个人信息
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        现居住地址 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="请输入详细地址"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Employment Information */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  用工信息
                </CardTitle>
                <CardDescription>
                  请填写用人单位相关信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="employerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        用人单位名称 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入用人单位或雇主名称"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        用人单位地址 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="请输入详细地址"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="employerContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用人单位联系电话</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="选填"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          工种类型 <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择工种类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {workTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="workStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          入职时间 <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="date"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>离职时间</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="date"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>如仍在职可不填</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Salary Information */}
          {step === 3 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    欠薪详情
                  </CardTitle>
                  <CardDescription>
                    请详细填写欠薪情况，这将有助于我们更好地帮助您
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="salaryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            薪资类型 <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择薪资类型" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {salaryTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
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
                      name="salaryAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            约定薪资（元/月） <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                ¥
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-8"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="salaryMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            欠薪月数 <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                个月
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            欠薪总额 <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                ¥
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-8"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="salaryPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          欠薪时间段 <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例如：2024年10月至2024年12月"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          情况描述 <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="请详细描述欠薪经过、拖欠原因、已采取的措施等情况..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          详细描述有助于我们更快了解您的情况
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Evidence Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    证据材料
                  </CardTitle>
                  <CardDescription>
                    上传相关证据材料将有助于案件处理
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hasEvidence"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          我有相关证据材料
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {form.watch('hasEvidence') && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">已收集的证据：</div>
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {evidenceTypes.map((type) => (
                          <FormField
                            key={type}
                            control={form.control}
                            name="evidenceType"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type)}
                                    onCheckedChange={(checked) => {
                                      const value = field.value || [];
                                      if (checked) {
                                        field.onChange([...value, type]);
                                      } else {
                                        field.onChange(
                                          value.filter((v) => v !== type)
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">
                                  {type}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>

                      <div className="mt-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                        <Upload className="mx-auto h-8 w-8 text-primary mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          点击或拖拽上传证据文件
                        </p>
                        <p className="text-xs text-muted-foreground">
                          支持 PDF、JPG、PNG 格式，单个文件不超过10MB
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Agreement */}
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-2">
                        重要提示
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                        <li>• 请确保所填写信息真实有效，如有虚假将承担法律责任</li>
                        <li>• 您提交的线索将转至检察机关处理</li>
                        <li>• 我们将在1-3个工作日内与您联系</li>
                        <li>• 如有紧急情况，请拨打12345政务服务热线</li>
                      </ul>

                      <FormField
                        control={form.control}
                        name="agreeTerms"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              我已阅读并同意
                              <a href="/terms" className="text-primary hover:underline mx-1">
                                《用户协议》
                              </a>
                              和
                              <a href="/privacy" className="text-primary hover:underline mx-1">
                                《隐私政策》
                              </a>
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormMessage className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              上一步
            </Button>

            {step < totalSteps ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={isSubmitting}
                className="gap-2"
              >
                下一步
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="gap-2 min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    提交线索
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
