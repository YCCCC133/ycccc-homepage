'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Send, CheckCircle2, FileText, Heart, Shield, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

const applicationTypes = [
  { value: 'support', label: '支持起诉', desc: '请求检察机关支持起诉', icon: Shield },
  { value: 'legal_aid', label: '法律援助', desc: '请求法律援助机构提供帮助', icon: Heart },
];

export default function ApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '', idCard: '', phone: '', address: '',
      applicationType: undefined, caseDescription: '', requestContent: '', agreeTerms: false,
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_name: data.name, applicant_phone: data.phone,
          applicant_id_card: data.idCard, applicant_address: data.address,
          application_type: data.applicationType,
          case_description: data.caseDescription,
          request_content: data.requestContent,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setApplicationNumber(result.data?.applicationNumber || `SQ${Date.now()}`);
        setSubmitSuccess(true);
      } else {
        alert(result.error || '提交失败');
      }
    } catch { alert('网络错误'); }
    finally { setIsSubmitting(false); }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -right-20 w-60 h-60 bg-emerald-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -left-20 w-72 h-72 bg-emerald-50/40 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-lg">
          <div className="p-8 sm:p-10 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-3">提交成功</h2>
            <p className="text-stone-600 mb-6">您的申请已提交，我们将在3-5个工作日内审核</p>
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 mb-6">
              <div className="text-sm text-stone-600 mb-1">申请编号</div>
              <div className="text-lg font-mono font-semibold text-emerald-700">{applicationNumber}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">继续申请</Button>
              <Link href="/cases" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600">查看进度</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">在线申请</h1>
          <p className="text-sm text-stone-600">选择申请类型并填写相关信息</p>
        </div>

        {/* Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {applicationTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = form.watch('applicationType') === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => form.setValue('applicationType', type.value as 'support' | 'legal_aid')}
                className={`
                  p-5 rounded-2xl border-2 text-left transition-all duration-200
                  ${isSelected 
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-lg shadow-emerald-100' 
                    : 'bg-white/70 backdrop-blur-lg border-white/60 hover:border-emerald-200'}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center mb-3
                  ${isSelected ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className={`font-semibold mb-1 ${isSelected ? 'text-emerald-700' : 'text-stone-700'}`}>
                  {type.label}
                </h3>
                <p className="text-sm text-stone-500">{type.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="p-5 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-lg border border-white/60 shadow-lg">
              <h2 className="text-lg font-semibold text-stone-800 mb-4">申请人信息</h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>姓名 <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="请输入姓名" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>手机号码 <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="请输入手机号" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField control={form.control} name="idCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>身份证号 <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="请输入18位身份证号" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>现居住地址 <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="请输入详细地址" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-lg border border-white/60 shadow-lg">
              <h2 className="text-lg font-semibold text-stone-800 mb-4">申请详情</h2>
              <div className="space-y-4">
                <FormField control={form.control} name="caseDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>案件情况说明 <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="请详细描述案件情况..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="requestContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>申请事项 <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="请描述您希望获得的帮助..." className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Agreement */}
            <div className="p-5 rounded-2xl bg-amber-50/60 backdrop-blur-lg border border-amber-200/50">
              <FormField control={form.control} name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mt-1 w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-sm text-stone-600">
                      我已阅读并同意
                      <a href="/terms" className="text-emerald-600 hover:underline mx-1">《用户协议》</a>
                      和
                      <a href="/privacy" className="text-emerald-600 hover:underline mx-1">《隐私政策》</a>
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormMessage className="mt-2" />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  提交申请
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
