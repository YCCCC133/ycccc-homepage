'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import {
  Send,
  CheckCircle2,
  FileText,
  Heart,
  Shield,
  Clock,
  Users,
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
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(2, '请输入姓名'),
  idCard: z.string().length(18, '请输入正确的身份证号'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  address: z.string().min(5, '请输入详细地址'),
  applicationType: z.enum(['support', 'legal_aid']),
  caseDescription: z.string().min(20, '请详细描述案件情况'),
  requestContent: z.string().min(10, '请描述申请事项'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: '请阅读并同意相关条款',
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function ApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      idCard: '',
      phone: '',
      address: '',
      applicationType: undefined,
      caseDescription: '',
      requestContent: '',
      agreeTerms: false,
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_name: data.name,
          applicant_phone: data.phone,
          applicant_id_card: data.idCard,
          applicant_address: data.address,
          application_type: data.applicationType,
          case_brief: data.caseDescription,
          request_content: data.requestContent,
        }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        setSubmitSuccess(true);
      } else {
        alert(result.error || '提交失败，请稍后重试');
      }
    } catch (error) {
      console.error('提交申请失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  const applicationTypes = [
    {
      id: 'support',
      title: '支持起诉申请',
      description: '申请检察机关支持您提起民事诉讼',
      icon: Shield,
      features: [
        '检察机关支持起诉',
        '提供法律专业支持',
        '协助收集证据',
        '出庭支持诉讼',
      ],
    },
    {
      id: 'legal_aid',
      title: '法律援助申请',
      description: '申请免费法律援助服务',
      icon: Heart,
      features: [
        '免费律师服务',
        '代写法律文书',
        '代理诉讼案件',
        '经济困难可申请',
      ],
    },
  ];

  if (submitSuccess) {
    return (
      <div className="mx-auto max-w-3xl bg-background px-4 py-16 selection-primary select-text">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-green-900">
              申请提交成功！
            </h2>
            <p className="mb-6 text-green-700">
              您的申请已成功提交，我们将在3个工作日内审核并与您联系。
            </p>
            <div className="mb-6 rounded-lg bg-white p-4 text-left">
              <div className="mb-2 text-sm text-muted-foreground">
                申请编号：<span className="font-mono font-medium text-foreground">SQ20260115001</span>
              </div>
              <div className="text-sm text-muted-foreground">
                提交时间：{new Date().toLocaleString('zh-CN')}
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                继续申请
              </Button>
              <Link href="/cases">
                <Button>查看申请进度</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl bg-background px-4 py-8 selection-primary select-text">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">在线申请</h1>
        <p className="text-muted-foreground">
          在线申请支持起诉、法律援助，全流程在线办理
        </p>
      </div>

      {/* Service Introduction */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">快速响应</h3>
            <p className="text-sm text-muted-foreground">
              3个工作日内完成审核，及时反馈申请结果
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--gold)]/30 bg-[var(--gold)]/5">
          <CardContent className="pt-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--gold)]/10">
              <Heart className="h-6 w-6 text-[var(--gold-foreground)]" />
            </div>
            <h3 className="mb-2 font-semibold">全程免费</h3>
            <p className="text-sm text-muted-foreground">
              符合条件的申请人可享受免费法律服务
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-2 font-semibold">专业团队</h3>
            <p className="text-sm text-muted-foreground">
              专业检察官和律师团队为您提供优质服务
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Application Type Selection */}
        <div className="lg:col-span-1">
          <Card className="sticky top-28 md:top-36">
            <CardHeader>
              <CardTitle className="text-lg">选择申请类型</CardTitle>
              <CardDescription>
                请根据您的需求选择合适的申请类型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {applicationTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => form.setValue('applicationType', type.id as 'support' | 'legal_aid')}
                  className={`w-full rounded-lg border p-4 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    form.watch('applicationType') === type.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        type.id === 'support'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-[var(--gold)]/10 text-[var(--gold-foreground)]'
                      }`}
                    >
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{type.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {type.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  {form.watch('applicationType') === type.id && (
                    <Badge className="mt-3" variant="secondary">
                      已选择
                    </Badge>
                  )}
                </button>
              ))}
              {form.formState.errors.applicationType && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.applicationType.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    申请人信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>姓名 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入姓名" {...field} />
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
                          <FormLabel>联系电话 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入手机号码" {...field} />
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
                        <FormLabel>身份证号 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入18位身份证号码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>联系地址 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入详细地址" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Application Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">申请详情</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="caseDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>案件情况说明 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="请详细描述您的案件情况，包括：欠薪金额、欠薪时间、已采取的措施等..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          详细描述有助于我们更快审核您的申请
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>申请事项 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="请描述您希望获得的帮助，例如：希望检察机关支持起诉、希望获得法律援助律师代理案件等..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Terms Agreement */}
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="agreeTerms"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-3">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1 h-4 w-4"
                          />
                        </FormControl>
                        <div className="flex-1">
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
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  '提交中...'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    提交申请
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
