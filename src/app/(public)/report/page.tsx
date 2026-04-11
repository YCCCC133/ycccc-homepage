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
  ArrowLeft,
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
  name: z.string().min(2, '姓名至少2个字符'),
  idCard: z.string().length(18, '请输入正确的身份证号'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  address: z.string().min(5, '请输入详细地址'),
  employerName: z.string().min(2, '请输入用人单位名称'),
  employerAddress: z.string().min(5, '请输入用人单位地址'),
  employerContact: z.string().optional(),
  workType: z.string().min(1, '请选择工种类型'),
  workStartDate: z.string().min(1, '请选择入职时间'),
  workEndDate: z.string().optional(),
  salaryType: z.string().min(1, '请选择薪资类型'),
  salaryAmount: z.string().min(1, '请输入薪资'),
  salaryMonths: z.string().min(1, '请输入欠薪月数'),
  totalAmount: z.string().min(1, '请输入欠薪总额'),
  salaryPeriod: z.string().min(1, '请选择欠薪时间段'),
  description: z.string().min(10, '请详细描述情况'),
  hasEvidence: z.boolean().default(false),
  evidenceType: z.array(z.string()).optional(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: '请阅读并同意相关条款',
  }),
});

type FormData = z.infer<typeof formSchema>;

const workTypes = ['建筑工人', '装修工人', '环卫工人', '家政服务', '餐饮服务', '快递配送', '其他行业'];
const salaryTypes = ['月薪', '日薪', '计件工资', '包工工资'];
const evidenceTypes = ['劳动合同', '工资条/转账记录', '考勤记录', '工作证/工作服', '证人证言', '录音/录像', '其他证据'];

export default function ReportPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reportNumber, setReportNumber] = useState<string>('');
  
  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '', idCard: '', phone: '', address: '',
      employerName: '', employerAddress: '', employerContact: '',
      workType: '', workStartDate: '', workEndDate: '',
      salaryType: '', salaryAmount: '', salaryMonths: '', totalAmount: '', salaryPeriod: '',
      description: '', hasEvidence: false, evidenceType: [], agreeTerms: false,
    },
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name, phone: data.phone, id_card: data.idCard, address: data.address,
          company_name: data.employerName, company_address: data.employerAddress,
          owed_amount: parseFloat(data.totalAmount) || 0, owed_months: parseInt(data.salaryMonths) || 1,
          worker_count: 1, description: data.description,
          evidence: data.hasEvidence ? (data.evidenceType?.join(',') || '有证据') : null,
        }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        setReportNumber(result.data.reportNumber || `XC${result.data.id}`);
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
          <div className="
            p-8 sm:p-10
            rounded-3xl
            bg-white/80 backdrop-blur-xl
            border border-white/60
            shadow-xl shadow-stone-200/50
            text-center
          ">
            <div className="
              w-16 h-16
              mx-auto mb-6
              rounded-full
              bg-gradient-to-br from-emerald-400 to-emerald-500
              flex items-center justify-center
              shadow-lg shadow-emerald-500/30
            ">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-3">
              提交成功
            </h2>
            <p className="text-stone-600 mb-6">
              您的线索已成功提交，我们将在1-3个工作日内与您联系
            </p>
            <div className="
              p-4 rounded-xl
              bg-emerald-50/50
              border border-emerald-100
              mb-6
            ">
              <div className="text-sm text-stone-600 mb-1">线索编号</div>
              <div className="text-lg font-mono font-semibold text-emerald-700">
                {reportNumber || 'XC' + Date.now().toString().slice(-10)}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                继续填报
              </Button>
              <Link href="/cases" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600">
                  查看案件进度
                </Button>
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
      
      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
            欠薪线索填报
          </h1>
          <p className="text-sm text-stone-600">
            请如实填写以下信息，我们将严格保护您的个人隐私
          </p>
        </div>

        {/* Progress */}
        <div className="
          p-4 sm:p-6
          rounded-2xl
          bg-white/70 backdrop-blur-lg
          border border-white/60
          shadow-lg shadow-stone-200/30
          mb-6
        ">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-stone-700">
              步骤 {step} / {totalSteps}
            </span>
            <span className="text-sm text-emerald-600 font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          {[
            { num: 1, title: '个人信息', desc: '填写基本信息' },
            { num: 2, title: '用工信息', desc: '单位与工种' },
            { num: 3, title: '欠薪详情', desc: '欠薪情况' },
          ].map((s) => (
            <div
              key={s.num}
              className={`
                p-3 sm:p-4 rounded-xl text-center
                transition-all duration-200
                ${step >= s.num 
                  ? 'bg-emerald-50/80 border border-emerald-200/60' 
                  : 'bg-white/50 border border-stone-200/40'}
              `}
            >
              <div className={`
                w-8 h-8 mx-auto mb-2 rounded-lg
                flex items-center justify-center
                text-sm font-semibold
                ${step >= s.num 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' 
                  : 'bg-stone-100 text-stone-500'}
              `}>
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <div className={`text-sm font-medium ${step >= s.num ? 'text-emerald-700' : 'text-stone-600'}`}>
                {s.title}
              </div>
              <div className="text-xs text-stone-500 hidden sm:block">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Step 1: Personal */}
            {step === 1 && (
              <div className="
                p-5 sm:p-6
                rounded-2xl
                bg-white/70 backdrop-blur-lg
                border border-white/60
                shadow-lg
              ">
                <div className="flex items-center gap-3 mb-5">
                  <div className="
                    w-10 h-10 rounded-xl
                    bg-emerald-100
                    flex items-center justify-center
                  ">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-stone-800">个人信息</h2>
                    <p className="text-sm text-stone-500">请填写您的真实信息</p>
                  </div>
                </div>
                
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
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                              <Input placeholder="请输入手机号" className="pl-10" {...field} />
                            </div>
                          </FormControl>
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
                        <FormDescription className="text-xs">用于身份核实，信息严格保密</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField control={form.control} name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>现居住地址 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                            <Input placeholder="请输入详细地址" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Employment */}
            {step === 2 && (
              <div className="
                p-5 sm:p-6
                rounded-2xl
                bg-white/70 backdrop-blur-lg
                border border-white/60
                shadow-lg
              ">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-stone-800">用工信息</h2>
                    <p className="text-sm text-stone-500">请填写用人单位信息</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <FormField control={form.control} name="employerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用人单位名称 <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="请输入用人单位名称" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField control={form.control} name="employerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用人单位地址 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                            <Input placeholder="请输入详细地址" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="employerContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用人单位电话</FormLabel>
                          <FormControl><Input placeholder="选填" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="workType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>工种类型 <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="请选择工种" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="workStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>入职时间 <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                              <Input type="date" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="workEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>离职时间</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                              <Input type="date" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">如仍在职可不填</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Salary */}
            {step === 3 && (
              <>
                <div className="
                  p-5 sm:p-6
                  rounded-2xl
                  bg-white/70 backdrop-blur-lg
                  border border-white/60
                  shadow-lg
                ">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-stone-800">欠薪详情</h2>
                      <p className="text-sm text-stone-500">请详细填写欠薪情况</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField control={form.control} name="salaryType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>薪资类型 <span className="text-red-500">*</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {salaryTypes.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="salaryAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>约定薪资 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">¥</span>
                                <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField control={form.control} name="salaryMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>欠薪月数 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="number" placeholder="0" {...field} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">个月</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="totalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>欠薪总额 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">¥</span>
                                <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField control={form.control} name="salaryPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>欠薪时间段 <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="例如：2024年10月至2024年12月" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField control={form.control} name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>情况描述 <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Textarea placeholder="请详细描述欠薪经过..." className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Evidence */}
                <div className="
                  p-5 sm:p-6
                  rounded-2xl
                  bg-white/70 backdrop-blur-lg
                  border border-white/60
                  shadow-lg
                ">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-stone-800">证据材料</h2>
                      <p className="text-sm text-stone-500">上传证据有助于案件处理</p>
                    </div>
                  </div>
                  
                  <FormField control={form.control} name="hasEvidence"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">我有相关证据材料</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('hasEvidence') && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {evidenceTypes.map((type) => (
                          <FormField key={type} control={form.control} name="evidenceType"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type)}
                                    onCheckedChange={(checked) => {
                                      const value = field.value || [];
                                      field.onChange(checked ? [...value, type] : value.filter((v) => v !== type));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm cursor-pointer">{type}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <div className="
                        mt-4 p-6
                        rounded-xl
                        border-2 border-dashed border-emerald-200/50
                        bg-emerald-50/30
                        text-center
                      ">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                        <p className="text-sm text-stone-600">点击或拖拽上传证据文件</p>
                        <p className="text-xs text-stone-400 mt-1">支持 PDF、JPG、PNG 格式</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agreement */}
                <div className="
                  p-5 sm:p-6
                  rounded-2xl
                  bg-amber-50/60 backdrop-blur-lg
                  border border-amber-200/50
                  shadow-lg
                ">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">重要提示</h4>
                      <ul className="text-sm text-stone-600 space-y-1 mb-4">
                        <li>请确保所填信息真实有效</li>
                        <li>您提交的线索将转至检察机关处理</li>
                        <li>我们将在1-3个工作日内与您联系</li>
                      </ul>
                      <FormField control={form.control} name="agreeTerms"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              我已阅读并同意
                              <a href="/terms" className="text-emerald-600 hover:underline mx-1">《用户协议》</a>
                              和
                              <a href="/privacy" className="text-emerald-600 hover:underline mx-1">《隐私政策》</a>
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormMessage />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                上一步
              </Button>
              
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600"
                >
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 min-w-[120px] bg-gradient-to-r from-emerald-500 to-emerald-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      提交线索
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
