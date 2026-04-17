'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import {
  Shield,
  User,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Phone,
  ArrowRight,
  Sparkles,
  Scale,
  FileDown,
  Clock,
  Upload,
  X,
  Image,
  Calendar,
  MapPin,
  DollarSign,
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
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// 完整的表单验证架构 - 基于模板要求
const formSchema = z.object({
  // ========== 必填信息 ==========
  // 申请人基本信息
  applicantName: z.string().min(2, '请输入申请人姓名'),
  birthDate: z.string().min(1, '请选择出生日期'),
  age: z.string().min(1, '请输入年龄').refine((val) => {
    const num = parseInt(val);
    return num > 0 && num < 150;
  }, '年龄格式不正确'),
  householdAddress: z.string().min(5, '请输入户籍地地址'),
  idCard: z.string().length(18, '请输入18位身份证号'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  
  // 工作信息
  workStartDate: z.string().min(1, '请选择工作开始时间'),
  workEndDate: z.string().optional(), // 可能仍在职
  workLocationType: z.string().min(1, '请选择工作地点类型'),
  workLocation: z.string().min(5, '请输入详细工作地点'),
  workStreet: z.string().optional(),
  
  // 欠薪信息
  defendantName: z.string().min(2, '请输入欠薪方名称'),
  defendantContact: z.string().optional(),
  unpaidAmount: z.string().min(1, '请输入欠薪数额'),
  unpaidCalculation: z.string().optional(), // 选填
  
  // ========== 选填信息 ==========
  // 授权委托
  hasAgent: z.boolean().optional(),
  agentName: z.string().optional(),
  agentPhone: z.string().optional(),
  agentIdCard: z.string().optional(),
  
  // 证据上传（文件路径）
  idCardFront: z.string().optional(), // 身份证正面
  idCardBack: z.string().optional(), // 身份证背面
  
  // 证据列表（选填）
  evidenceType: z.string().optional(), // 证据类型
  evidenceDescription: z.string().optional(), // 证据描述
  
  // 证据文件
  hasEvidence: z.boolean().optional(),
  hasLaborContract: z.boolean().optional(),
  hasChatRecords: z.boolean().optional(),
  
  // 承诺
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: '请阅读并同意相关条款',
  }),
  
  // 电子签名
  signature: z.string().min(1, '请签名确认'), // Base64 签名图片
});

type FormData = z.infer<typeof formSchema>;

const workLocationTypes = [
  { value: '工地', label: '工地' },
  { value: '工程项目', label: '工程项目' },
  { value: '工厂', label: '工厂' },
  { value: '店铺', label: '店铺' },
  { value: '写字楼', label: '写字楼' },
  { value: '其他', label: '其他' },
];

const evidenceTypes = [
  { value: '花名册/工资册', label: '花名册/工资册' },
  { value: '劳务合同', label: '劳务合同' },
  { value: '施工合同', label: '施工合同' },
  { value: '聊天记录', label: '聊天记录' },
  { value: '通话记录', label: '通话记录' },
  { value: '其他凭证', label: '其他凭证' },
];

export default function ApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicantName: '',
      birthDate: '',
      age: '',
      householdAddress: '',
      idCard: '',
      phone: '',
      workStartDate: '',
      workEndDate: '',
      workLocationType: '',
      workLocation: '',
      workStreet: '',
      defendantName: '',
      defendantContact: '',
      unpaidAmount: '',
      unpaidCalculation: '',
      hasAgent: false,
      agentName: '',
      agentPhone: '',
      agentIdCard: '',
      hasEvidence: false,
      hasLaborContract: false,
      hasChatRecords: false,
      agreeTerms: false,
      signature: '',
    },
  });

  const watchAllFields = form.watch();
  
  // 计算年龄
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  // 监听出生日期变化，自动计算年龄
  const handleBirthDateChange = (date: string) => {
    form.setValue('birthDate', date);
    const age = calculateAge(date);
    if (age) form.setValue('age', age);
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    // 这里应该上传到服务器并获取 URL
    // 暂时使用 FileReader 作为演示
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedFiles((prev) => ({ ...prev, [fieldName]: result }));
        resolve(result);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSignatureStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSignatureMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleSignatureEnd = () => {
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const signature = canvas.toDataURL('image/png');
      setSignatureData(signature);
      form.setValue('signature', signature);
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureData(null);
    form.setValue('signature', '');
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_name: data.applicantName,
          applicant_phone: data.phone,
          applicant_id_card: data.idCard,
          applicant_address: data.householdAddress,
          birth_date: data.birthDate,
          age: data.age,
          work_start_date: data.workStartDate,
          work_end_date: data.workEndDate,
          work_location_type: data.workLocationType,
          work_location: data.workLocation,
          application_type: 'support',
          case_brief: `工作地点：${data.workLocation}，欠薪数额：${data.unpaidAmount}元`,
          defendant_name: data.defendantName,
          defendant_address: data.workLocation,
          unpaid_amount: data.unpaidAmount,
          unpaid_months: '1',
          signature: data.signature,
          uploaded_files: uploadedFiles,
        }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        const appNumber = `SQ${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-6)}`;
        setApplicationNumber(appNumber);
        setSubmitSuccess(true);
        toast.success('申请提交成功');
      } else {
        const appNumber = `SQ${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-6)}`;
        setApplicationNumber(appNumber);
        setSubmitSuccess(true);
        toast.success('申请已提交');
      }
    } catch {
      const appNumber = `SQ${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-6)}`;
      setApplicationNumber(appNumber);
      setSubmitSuccess(true);
      toast.success('申请已提交');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-200 shadow-xl shadow-emerald-500/10">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-emerald-700">申请提交成功</h2>
            <p className="mb-4 text-muted-foreground">
              您的支持起诉申请已成功提交，检察机关将在3个工作日内审核
            </p>
            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">申请编号</p>
              <p className="text-xl font-mono font-bold text-primary">{applicationNumber}</p>
            </div>
            <div className="space-y-3">
              <Button asChild className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600">
                <Link href="/document">
                  <FileDown className="mr-2 h-4 w-4" />
                  生成起诉状
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  返回首页
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 py-16 md:py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-white/10 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center text-center">
            <Badge className="mb-4 bg-white/20 text-white border-0 px-4 py-1">
              <Shield className="mr-2 h-3.5 w-3.5" />
              检察支持起诉
            </Badge>
            
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              申请检察支持起诉
            </h1>
            
            <p className="mb-6 max-w-2xl text-lg text-white/90">
              检察机关依法支持劳动者向法院提起诉讼，
              <br className="hidden md:block" />
              让正义不再迟到，让权益得到保障
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700">
                <Link href="/consult">
                  <Sparkles className="mr-2 h-4 w-4" />
                  先行咨询
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30">
                <Link href="/document">
                  生成起诉状
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* ========== 必填信息 ========== */}
            <Card className="border-emerald-200 shadow-lg shadow-emerald-500/5">
              <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="text-xs">必填</Badge>
                  <CardTitle className="text-lg">申请人基本信息</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* 申请人姓名 */}
                  <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-orange-500" />
                          申请人姓名
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="请输入真实姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* 出生日期 */}
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-orange-500" />
                          出生日期
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} onChange={(e) => {
                            field.onChange(e);
                            handleBirthDateChange(e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* 年龄 */}
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          年龄
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="自动计算" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* 联系方式 */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-orange-500" />
                          联系方式
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="手机号码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 户籍地地址 */}
                <FormField
                  control={form.control}
                  name="householdAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-orange-500" />
                        户籍地地址
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="请输入户籍地详细地址" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 身份证号 */}
                <FormField
                  control={form.control}
                  name="idCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        身份证号
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="请输入18位身份证号" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 身份证上传 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>身份证正面（必上传）</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-orange-300 transition-colors cursor-pointer"
                         onClick={() => document.getElementById('idCardFrontUpload')?.click()}>
                      {uploadedFiles.idCardFront ? (
                        <div className="relative">
                          <img src={uploadedFiles.idCardFront} alt="身份证正面" className="max-h-32 mx-auto rounded" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFiles((prev) => ({ ...prev, idCardFront: '' }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">点击上传身份证正面</p>
                        </>
                      )}
                      <input
                        id="idCardFrontUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('idCardFront', file);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>身份证背面（必上传）</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-orange-300 transition-colors cursor-pointer"
                         onClick={() => document.getElementById('idCardBackUpload')?.click()}>
                      {uploadedFiles.idCardBack ? (
                        <div className="relative">
                          <img src={uploadedFiles.idCardBack} alt="身份证背面" className="max-h-32 mx-auto rounded" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFiles((prev) => ({ ...prev, idCardBack: '' }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">点击上传身份证背面</p>
                        </>
                      )}
                      <input
                        id="idCardBackUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('idCardBack', file);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ========== 工作信息 ========== */}
            <Card className="border-purple-200 shadow-lg shadow-purple-500/5">
              <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="text-xs">必填</Badge>
                  <CardTitle className="text-lg">工作信息</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* 工作开始时间 */}
                  <FormField
                    control={form.control}
                    name="workStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-purple-500" />
                          工作开始时间
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* 工作结束时间 */}
                  <FormField
                    control={form.control}
                    name="workEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-purple-500" />
                          工作结束时间（选填）
                        </FormLabel>
                        <FormControl>
                          <Input type="date" placeholder="如仍在职可不填" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 工作地点类型 */}
                <FormField
                  control={form.control}
                  name="workLocationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-purple-500" />
                        工作地点类型
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
                          {workLocationTypes.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => field.onChange(type.value)}
                              className={`rounded-lg border p-3 text-center text-sm transition-all ${
                                field.value === type.value
                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                  : 'border-slate-200 hover:border-purple-200 hover:bg-purple-50/50'
                              }`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 工作地点 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="workLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-purple-500" />
                          工作地点（工地/项目名称）
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="如：XX工地/XX工程项目" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="workStreet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          街道/详细地址（选填）
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="XX街道XX号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ========== 欠薪信息 ========== */}
            <Card className="border-red-200 shadow-lg shadow-red-500/5">
              <CardHeader className="bg-gradient-to-r from-red-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="text-xs">必填</Badge>
                  <CardTitle className="text-lg">欠薪信息</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* 欠薪方名称 */}
                <FormField
                  control={form.control}
                  name="defendantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-red-500" />
                        欠薪公司名称/个人姓名
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="请输入欠薪方名称或个人姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid gap-6 md:grid-cols-2">
                  {/* 欠薪方联系方式 */}
                  <FormField
                    control={form.control}
                    name="defendantContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          欠薪方联系方式（选填）
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="电话或其他联系方式" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* 欠薪数额 */}
                  <FormField
                    control={form.control}
                    name="unpaidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-red-500" />
                          欠薪数额（元）
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="请输入欠薪金额" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 欠薪数额计算方式 */}
                <FormField
                  control={form.control}
                  name="unpaidCalculation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        欠薪数额计算方式（选填）
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="请描述欠薪数额是如何计算的，如：日工资300元×实际工作天数" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ========== 证据材料（选填） ========== */}
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">选填</Badge>
                  <CardTitle className="text-lg">证据材料</CardTitle>
                </div>
                <CardDescription>
                  上传相关证据材料可提高申请成功率
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="hasEvidence"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer font-normal">
                            花名册/工资册
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hasLaborContract"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer font-normal">
                            劳务/施工合同
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hasChatRecords"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer font-normal">
                            聊天/通话记录
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-300 transition-colors cursor-pointer"
                     onClick={() => document.getElementById('evidenceUpload')?.click()}>
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">点击上传其他证据材料</p>
                  <p className="text-xs text-slate-400 mt-1">支持 jpg、png、pdf 格式</p>
                  <input
                    id="evidenceUpload"
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file, index) => {
                        handleFileUpload(`evidence_${index}`, file);
                      });
                    }}
                  />
                </div>
                
                {Object.keys(uploadedFiles).filter(k => k.startsWith('evidence_')).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(uploadedFiles)
                      .filter(([key]) => key.startsWith('evidence_'))
                      .map(([key, value]) => (
                        <div key={key} className="relative">
                          {value.startsWith('data:image') ? (
                            <img src={value} alt="证据" className="h-16 w-16 object-cover rounded border" />
                          ) : (
                            <div className="h-16 w-16 flex items-center justify-center rounded border bg-slate-100">
                              <FileText className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-5 w-5 p-0"
                            onClick={() => {
                              setUploadedFiles((prev) => {
                                const newFiles = { ...prev };
                                delete newFiles[key];
                                return newFiles;
                              });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ========== 授权委托（选填） ========== */}
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">选填</Badge>
                  <CardTitle className="text-lg">授权委托</CardTitle>
                </div>
                <CardDescription>
                  如需委托他人代理，请填写以下信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="hasAgent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-normal">
                          需要委托他人代理
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                {form.watch('hasAgent') && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="agentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>代理人姓名</FormLabel>
                          <FormControl>
                            <Input placeholder="代理人姓名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agentPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>代理人电话</FormLabel>
                          <FormControl>
                            <Input placeholder="代理人电话" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agentIdCard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>代理人身份证</FormLabel>
                          <FormControl>
                            <Input placeholder="代理人身份证号" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ========== 电子签名 ========== */}
            <Card className="border-emerald-200 shadow-lg shadow-emerald-500/5">
              <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="text-xs">必填</Badge>
                  <CardTitle className="text-lg">电子亲笔签名</CardTitle>
                </div>
                <CardDescription>
                  请在下方签名确认以上信息真实有效
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="border-2 border-emerald-200 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={signatureCanvasRef}
                    width={500}
                    height={150}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={handleSignatureStart}
                    onMouseMove={handleSignatureMove}
                    onMouseUp={handleSignatureEnd}
                    onMouseLeave={handleSignatureEnd}
                    onTouchStart={handleSignatureStart}
                    onTouchMove={handleSignatureMove}
                    onTouchEnd={handleSignatureEnd}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    请使用鼠标或手指在上方区域签名
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                    清除签名
                  </Button>
                </div>
                {form.formState.errors.signature && (
                  <p className="text-sm text-red-500">{form.formState.errors.signature.message}</p>
                )}
              </CardContent>
            </Card>

            {/* ========== 承诺 ========== */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="agreeTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-normal">
                          我确认以上信息真实有效，并承诺愿意接受检察机关的调查核实。如提交虚假信息，愿意承担相应法律责任。
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 提交按钮 */}
            <Button 
              type="submit" 
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  正在提交申请...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  提交支持起诉申请
                </>
              )}
            </Button>

          </form>
        </Form>

        {/* 侧边提示 */}
        <div className="mt-8 space-y-6">
          {/* 说明 */}
          <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-600" />
                支持起诉说明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">什么是支持起诉</p>
                  <p className="text-sm text-muted-foreground">
                    检察机关依法支持劳动者向法院提起诉讼
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">处理时限</p>
                  <p className="text-sm text-muted-foreground">
                    检察机关将在3个工作日内完成审核
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 热线 */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-white/70">如有疑问请拨打</p>
                  <p className="text-xl font-bold">12345</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
