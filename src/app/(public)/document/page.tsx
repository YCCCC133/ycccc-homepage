'use client';

import { useState, useEffect } from 'react';
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
  Users,
  ChevronDown,
  ChevronUp,
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
  FormDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 完整表单Schema - 基于劳动争议纠纷民事起诉状模板
const formSchema = z.object({
  // ===== 原告信息 =====
  plaintiffName: z.string().min(2, '请输入正确的姓名'),
  plaintiffGender: z.string().min(1, '请选择性别'),
  plaintiffBirthDate: z.string().min(1, '请选择出生日期'),
  plaintiffNation: z.string().optional(), // 民族
  plaintiffWorkUnit: z.string().optional(), // 工作单位
  plaintiffPosition: z.string().optional(), // 职务
  plaintiffPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  plaintiffResidence: z.string().min(5, '请输入住所地（户籍所在地）'),
  plaintiffHabitualResidence: z.string().optional(), // 经常居住地
  plaintiffIdType: z.string().optional(), // 证件类型
  plaintiffIdCard: z.string().length(18, '请输入正确的身份证号'),
  
  // ===== 委托诉讼代理人 =====
  hasAgent: z.boolean().optional(),
  agentName: z.string().optional(),
  agentUnit: z.string().optional(),
  agentPosition: z.string().optional(),
  agentPhone: z.string().optional(),
  agentPermission: z.string().optional(), // 一般授权/特别授权
  
  // ===== 被告信息 =====
  defendantName: z.string().min(2, '请输入用人单位名称'),
  defendantAddress: z.string().min(5, '请输入住所地'),
  defendantRegisterAddress: z.string().optional(), // 注册地
  defendantLegalPerson: z.string().optional(), // 法定代表人
  defendantLegalPersonPosition: z.string().optional(), // 法定代表人职务
  defendantLegalPersonPhone: z.string().optional(), // 法定代表人电话
  defendantCreditCode: z.string().optional(), // 统一社会信用代码
  defendantType: z.string().optional(), // 类型
  
  // ===== 诉讼请求 =====
  // 工资支付
  claimWage: z.boolean().optional(),
  claimWageDetail: z.string().optional(),
  // 未签合同双倍工资
  claimDoubleWage: z.boolean().optional(),
  claimDoubleWageDetail: z.string().optional(),
  // 加班费
  claimOvertime: z.boolean().optional(),
  claimOvertimeDetail: z.string().optional(),
  // 未休年休假工资
  claimAnnualLeave: z.boolean().optional(),
  claimAnnualLeaveDetail: z.string().optional(),
  // 社会保险损失
  claimSocialInsurance: z.boolean().optional(),
  claimSocialInsuranceDetail: z.string().optional(),
  // 解除劳动合同经济补偿
  claimTerminationCompensation: z.boolean().optional(),
  // 违法解除劳动合同赔偿金
  claimIllegalTermination: z.boolean().optional(),
  // 诉讼费用
  claimLitigationFee: z.boolean().optional(),
  // 其他诉讼请求
  claimOther: z.string().optional(),
  // 标的总额
  claimTotalAmount: z.string().min(1, '请输入标的总额'),
  
  // ===== 诉前保全 =====
  hasPreservation: z.boolean().optional(),
  preservationCourt: z.string().optional(),
  preservationDate: z.string().optional(),
  preservationCaseNo: z.string().optional(),
  
  // ===== 事实与理由 =====
  contractSignInfo: z.string().optional(), // 合同签订情况
  contractExecutionInfo: z.string().min(10, '请填写劳动合同履行情况'),
  terminationInfo: z.string().optional(), // 解除劳动关系情况
  injuryInfo: z.string().optional(), // 工伤情况
  arbitrationInfo: z.string().optional(), // 劳动仲裁情况
  otherFacts: z.string().optional(), // 其他相关情况
  legalBasis: z.string().optional(), // 诉请依据
  evidenceList: z.string().optional(), // 证据清单
  
  // ===== 纠纷解决意愿 =====
  understandMediation: z.boolean().optional(),
  understandMediationBenefits: z.boolean().optional(),
  considerMediation: z.string().optional(), // 是否考虑先行调解
});

type FormData = z.infer<typeof formSchema>;

// 案由选项
const caseTypes = [
  { value: '追索劳动报酬纠纷', label: '追索劳动报酬纠纷' },
  { value: '劳务合同纠纷', label: '劳务合同纠纷' },
  { value: '劳动合同纠纷', label: '劳动合同纠纷' },
  { value: '其他劳动争议', label: '其他劳动争议' },
];

// 民族选项
const nations = [
  '汉族', '蒙古族', '回族', '藏族', '维吾尔族', '苗族', '彝族', '壮族', '布依族', '朝鲜族',
  '满族', '侗族', '瑶族', '白族', '土家族', '哈尼族', '哈萨克族', '傣族', '黎族', '傈僳族',
  '佤族', '畲族', '高山族', '拉祜族', '水族', '东乡族', '纳西族', '景颇族', '科尔克孜族',
  '土族', '达斡尔族', '仫佬族', '羌族', '布朗族', '撒拉族', '毛南族', '仡佬族', '锡伯族',
  '阿昌族', '普米族', '塔吉克族', '怒族', '乌孜别克族', '俄罗斯族', '鄂温克族', '德昂族',
  '保安族', '裕固族', '京族', '塔塔尔族', '独龙族', '鄂伦春族', '赫哲族', '门巴族', '珞巴族', '基诺族'
];

// 证件类型
const idTypes = [
  { value: '居民身份证', label: '居民身份证' },
  { value: '护照', label: '护照' },
  { value: '军官证', label: '军官证' },
  { value: '其他', label: '其他' },
];

// 被告类型
const defendantTypes = [
  { value: '有限责任公司', label: '有限责任公司' },
  { value: '股份有限公司', label: '股份有限公司' },
  { value: '上市公司', label: '上市公司' },
  { value: '其他企业法人', label: '其他企业法人' },
  { value: '事业单位', label: '事业单位' },
  { value: '社会团体', label: '社会团体' },
  { value: '机关法人', label: '机关法人' },
  { value: '个人独资企业', label: '个人独资企业' },
  { value: '合伙企业', label: '合伙企业' },
  { value: '其他', label: '其他' },
];

// 调解意愿选项
const mediationOptions = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
  { value: 'uncertain', label: '暂不确定，想要了解更多内容' },
];

export default function DocumentPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    plaintiff: true,
    agent: false,
    defendant: true,
    claims: true,
    preservation: false,
    facts: true,
    mediation: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // 原告信息
      plaintiffName: '',
      plaintiffGender: '',
      plaintiffBirthDate: '',
      plaintiffNation: '',
      plaintiffWorkUnit: '',
      plaintiffPosition: '',
      plaintiffPhone: '',
      plaintiffResidence: '',
      plaintiffHabitualResidence: '',
      plaintiffIdType: '',
      plaintiffIdCard: '',
      // 代理人
      hasAgent: false,
      agentName: '',
      agentUnit: '',
      agentPosition: '',
      agentPhone: '',
      agentPermission: '',
      // 被告
      defendantName: '',
      defendantAddress: '',
      defendantRegisterAddress: '',
      defendantLegalPerson: '',
      defendantLegalPersonPosition: '',
      defendantLegalPersonPhone: '',
      defendantCreditCode: '',
      defendantType: '',
      // 诉讼请求
      claimWage: false,
      claimWageDetail: '',
      claimDoubleWage: false,
      claimDoubleWageDetail: '',
      claimOvertime: false,
      claimOvertimeDetail: '',
      claimAnnualLeave: false,
      claimAnnualLeaveDetail: '',
      claimSocialInsurance: false,
      claimSocialInsuranceDetail: '',
      claimTerminationCompensation: false,
      claimIllegalTermination: false,
      claimLitigationFee: true,
      claimOther: '',
      claimTotalAmount: '',
      // 诉前保全
      hasPreservation: false,
      preservationCourt: '',
      preservationDate: '',
      preservationCaseNo: '',
      // 事实与理由
      contractSignInfo: '',
      contractExecutionInfo: '',
      terminationInfo: '',
      injuryInfo: '',
      arbitrationInfo: '',
      otherFacts: '',
      legalBasis: '',
      evidenceList: '',
      // 调解意愿
      understandMediation: false,
      understandMediationBenefits: false,
      considerMediation: '',
    },
  });

  const watchAllFields = form.watch();
  
  // Calculate form progress
  useEffect(() => {
    const fields = Object.values(watchAllFields);
    const filledFields = fields.filter(v => {
      if (typeof v === 'boolean') return true;
      return v && v.toString().length > 0;
    }).length;
    setFormProgress(Math.round((filledFields / fields.length) * 100));
  }, [watchAllFields]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  // 生成完整的起诉状
  const generateComplaintDocument = (data: FormData): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    
    // 构建诉讼请求
    let claimsText = '';
    let claimNo = 1;
    
    if (data.claimWage) {
      claimsText += `${claimNo++}. 判令被告支付原告工资 ${data.claimWageDetail || '若干元'}；\n`;
    }
    if (data.claimDoubleWage) {
      claimsText += `${claimNo++}. 判令被告支付原告未签订书面劳动合同双倍工资 ${data.claimDoubleWageDetail || '若干元'}；\n`;
    }
    if (data.claimOvertime) {
      claimsText += `${claimNo++}. 判令被告支付原告加班费 ${data.claimOvertimeDetail || '若干元'}；\n`;
    }
    if (data.claimAnnualLeave) {
      claimsText += `${claimNo++}. 判令被告支付原告未休年休假工资 ${data.claimAnnualLeaveDetail || '若干元'}；\n`;
    }
    if (data.claimSocialInsurance) {
      claimsText += `${claimNo++}. 判令被告支付原告未依法缴纳社会保险费造成的经济损失 ${data.claimSocialInsuranceDetail || '若干元'}；\n`;
    }
    if (data.claimTerminationCompensation) {
      claimsText += `${claimNo++}. 判令被告支付原告解除劳动合同经济补偿金；\n`;
    }
    if (data.claimIllegalTermination) {
      claimsText += `${claimNo++}. 判令被告支付原告违法解除劳动合同赔偿金；\n`;
    }
    if (data.claimOther) {
      claimsText += `${claimNo++}. ${data.claimOther}；\n`;
    }
    if (data.claimLitigationFee) {
      claimsText += `${claimNo++}. 本案诉讼费用由被告承担。\n`;
    }

    // 构建代理人信息
    let agentText = '无';
    if (data.hasAgent && data.agentName) {
      agentText = `有\n委托诉讼代理人：${data.agentName || ''}\n单位：${data.agentUnit || ''} 职务：${data.agentPosition || ''} 联系电话：${data.agentPhone || ''}\n代理权限：${data.agentPermission || '一般授权'}`;
    }

    // 构建事实与理由
    let factsText = '';
    if (data.contractSignInfo) {
      factsText += `一、劳动合同签订情况\n${data.contractSignInfo}\n\n`;
    }
    if (data.contractExecutionInfo) {
      factsText += `二、劳动合同履行情况\n${data.contractExecutionInfo}\n\n`;
    }
    if (data.terminationInfo) {
      factsText += `三、解除或终止劳动关系情况\n${data.terminationInfo}\n\n`;
    }
    if (data.injuryInfo) {
      factsText += `四、工伤情况\n${data.injuryInfo}\n\n`;
    }
    if (data.arbitrationInfo) {
      factsText += `五、劳动仲裁相关情况\n${data.arbitrationInfo}\n\n`;
    }
    if (data.otherFacts) {
      factsText += `六、其他相关情况\n${data.otherFacts}\n\n`;
    }
    if (data.legalBasis) {
      factsText += `七、诉请依据\n${data.legalBasis}\n\n`;
    }
    if (data.evidenceList) {
      factsText += `八、证据清单\n${data.evidenceList}`;
    }

    // 构建调解意愿
    let mediationText = `是否了解调解作为非诉讼纠纷解决方式：${data.understandMediation ? '了解' : '不了解'}\n`;
    mediationText += `是否了解先行调解的好处：${data.understandMediationBenefits ? '了解' : '不了解'}\n`;
    if (data.considerMediation) {
      const mediationLabel = mediationOptions.find(m => m.value === data.considerMediation)?.label || '';
      mediationText += `是否考虑先行调解：${mediationLabel}`;
    }

    return `劳动争议纠纷民事起诉状

【当事人信息】

一、原告（自然人）
姓名：${data.plaintiffName}
性别：${data.plaintiffGender === 'male' ? '男' : '女'}
出生日期：${data.plaintiffBirthDate}
民族：${data.plaintiffNation || ''}
工作单位：${data.plaintiffWorkUnit || ''} 职务：${data.plaintiffPosition || ''}
联系电话：${data.plaintiffPhone}
住所地（户籍所在地）：${data.plaintiffResidence}
经常居住地：${data.plaintiffHabitualResidence || ''}
证件类型：${data.plaintiffIdType || '居民身份证'}
证件号码：${data.plaintiffIdCard}

二、委托诉讼代理人
${agentText}

三、被告（法人、非法人组织）
名称：${data.defendantName}
住所地（主要办事机构所在地）：${data.defendantAddress}
注册地/登记地：${data.defendantRegisterAddress || ''}
法定代表人/负责人：${data.defendantLegalPerson || ''} 职务：${data.defendantLegalPersonPosition || ''} 联系电话：${data.defendantLegalPersonPhone || ''}
统一社会信用代码：${data.defendantCreditCode || ''}
类型：${data.defendantType || ''}

【诉讼请求】

${claimsText}

标的总额：人民币${data.claimTotalAmount}元

【诉前保全】

${data.hasPreservation ? `已申请诉前保全
保全法院：${data.preservationCourt || ''}
保全时间：${data.preservationDate || ''}
保全案号：${data.preservationCaseNo || ''}` : '未申请诉前保全'}

【事实与理由】

${factsText}

【对纠纷解决方式的意愿】

${mediationText}

【特别提示】
诉讼参加人应遵守诚信原则如实认真填写表格。如果诉讼参加人违反有关规定，虚假诉讼、恶意诉讼、滥用诉权，人民法院将视违法情形依法追究责任。

此致
XXXX人民法院

                                                                        具状人（签名）：${data.plaintiffName}
                                                                        日期：${dateStr}
`;
  };

  const generateDocument = async (data: FormData) => {
    setIsGenerating(true);
    setGeneratedDocument(null);

    try {
      const doc = generateComplaintDocument(data);
      setGeneratedDocument(doc);
      toast.success('文书已生成');
    } catch (error) {
      console.error('生成文书失败:', error);
      toast.error('生成文书失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = (data: FormData) => {
    generateDocument(data);
  };

  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section, 
    color = 'emerald',
    required = false 
  }: { 
    title: string; 
    icon: React.ElementType; 
    section: string;
    color?: string;
    required?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors",
        color === 'emerald' && "bg-emerald-50 hover:bg-emerald-100 text-emerald-800",
        color === 'purple' && "bg-purple-50 hover:bg-purple-100 text-purple-800",
        color === 'orange' && "bg-orange-50 hover:bg-orange-100 text-orange-800",
        color === 'blue' && "bg-blue-50 hover:bg-blue-100 text-blue-800",
        color === 'cyan' && "bg-cyan-50 hover:bg-cyan-100 text-cyan-800",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="font-semibold">{title}</span>
        {required && <span className="text-red-500">*</span>}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

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
              依据《劳动争议纠纷民事起诉状》标准模板，<br className="hidden md:block" />
              全面收集案件信息，生成规范化法律文书
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-white/90 shadow-md">
                <Link href="/consult">
                  <Sparkles className="mr-2 h-4 w-4" />
                  先行咨询
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-emerald-500/90 text-white hover:bg-emerald-500 shadow-md border-0">
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
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="border-emerald-100 shadow-lg shadow-emerald-500/5">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">劳动争议纠纷民事起诉状</CardTitle>
                    <CardDescription>请填写真实有效的案件信息（* 为必填项）</CardDescription>
                  </div>
                </div>
                {formProgress > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>填写进度</span>
                      <span>{formProgress}%</span>
                    </div>
                    <Progress value={formProgress} className="mt-2 h-2" />
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    
                    {/* ===== 原告信息 ===== */}
                    <div className="space-y-3">
                      <SectionHeader 
                        title="一、原告信息" 
                        icon={User} 
                        section="plaintiff" 
                        color="emerald"
                        required
                      />
                      
                      {expandedSections.plaintiff && (
                        <div className="space-y-4 rounded-lg border bg-white p-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <FormField
                              control={form.control}
                              name="plaintiffName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>姓名 <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="请输入您的姓名" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="plaintiffGender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>性别 <span className="text-red-500">*</span></FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="选择性别" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">男</SelectItem>
                                      <SelectItem value="female">女</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="plaintiffBirthDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>出生日期 <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <FormField
                              control={form.control}
                              name="plaintiffNation"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>民族</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="选择民族" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {nations.map(n => (
                                        <SelectItem key={n} value={n}>{n}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="plaintiffWorkUnit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>工作单位</FormLabel>
                                  <FormControl>
                                    <Input placeholder="当前工作单位" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="plaintiffPosition"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>职务</FormLabel>
                                  <FormControl>
                                    <Input placeholder="担任职务" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <FormField
                              control={form.control}
                              name="plaintiffPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>联系电话 <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="手机号码" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="plaintiffIdType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>证件类型</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="选择证件类型" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {idTypes.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="plaintiffIdCard"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>证件号码 <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="18位身份证号" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="plaintiffResidence"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>住所地（户籍所在地） <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="请输入户籍所在地地址" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="plaintiffHabitualResidence"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>经常居住地</FormLabel>
                                <FormControl>
                                  <Input placeholder="与户籍所在地不一致时填写" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* ===== 委托诉讼代理人 ===== */}
                    <div className="space-y-3">
                      <SectionHeader 
                        title="二、委托诉讼代理人" 
                        icon={Users} 
                        section="agent" 
                        color="blue"
                      />
                      
                      {expandedSections.agent && (
                        <div className="space-y-4 rounded-lg border bg-white p-4">
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
                                  <FormLabel>有委托诉讼代理人</FormLabel>
                                  <FormDescription>
                                    如委托律师或其他人代为诉讼，请勾选并填写代理人信息
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          {form.watch('hasAgent') && (
                            <div className="grid gap-4 sm:grid-cols-2">
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
                                name="agentUnit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>代理人单位</FormLabel>
                                    <FormControl>
                                      <Input placeholder="律师事务所或单位" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="agentPosition"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>代理人职务</FormLabel>
                                    <FormControl>
                                      <Input placeholder="职务" {...field} />
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
                                      <Input placeholder="联系电话" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="agentPermission"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>代理权限</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="选择代理权限" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="general">一般授权</SelectItem>
                                        <SelectItem value="special">特别授权</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ===== 被告信息 ===== */}
                    <div className="space-y-3">
                      <SectionHeader 
                        title="三、被告信息（用人单位）" 
                        icon={Building2} 
                        section="defendant" 
                        color="purple"
                        required
                      />
                      
                      {expandedSections.defendant && (
                        <div className="space-y-4 rounded-lg border bg-white p-4">
                          <FormField
                            control={form.control}
                            name="defendantName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>用人单位名称 <span className="text-red-500">*</span></FormLabel>
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
                              name="defendantAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>住所地 <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="主要办事机构所在地" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="defendantRegisterAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>注册地/登记地</FormLabel>
                                  <FormControl>
                                    <Input placeholder="营业执照注册地址" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid gap-4 sm:grid-cols-3">
                            <FormField
                              control={form.control}
                              name="defendantLegalPerson"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>法定代表人/负责人</FormLabel>
                                  <FormControl>
                                    <Input placeholder="姓名" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="defendantLegalPersonPosition"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>职务</FormLabel>
                                  <FormControl>
                                    <Input placeholder="职务" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="defendantLegalPersonPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>联系电话</FormLabel>
                                  <FormControl>
                                    <Input placeholder="电话" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="defendantCreditCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>统一社会信用代码</FormLabel>
                                  <FormControl>
                                    <Input placeholder="18位代码" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="defendantType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>类型</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="选择类型" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {defendantTypes.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ===== 诉讼请求 ===== */}
                    <div className="space-y-3">
                      <SectionHeader 
                        title="四、诉讼请求" 
                        icon={DollarSign} 
                        section="claims" 
                        color="orange"
                        required
                      />
                      
                      {expandedSections.claims && (
                        <div className="space-y-4 rounded-lg border bg-white p-4">
                          <div className="space-y-3">
                            <Label className="text-base font-semibold">请选择您主张的诉讼请求：</Label>
                            
                            <div className="space-y-3 rounded-lg bg-orange-50/50 p-3">
                              <FormField
                                control={form.control}
                                name="claimWage"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none flex-1">
                                      <FormLabel>主张工资支付</FormLabel>
                                      {field.value && (
                                        <Input 
                                          className="mt-2"
                                          placeholder="请填写工资金额及明细，如：50000元（2024年10月至12月）"
                                          {...form.register('claimWageDetail')}
                                        />
                                      )}
                                    </div>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="claimDoubleWage"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none flex-1">
                                      <FormLabel>主张未签订书面劳动合同双倍工资</FormLabel>
                                      {field.value && (
                                        <Input 
                                          className="mt-2"
                                          placeholder="请填写金额明细"
                                          {...form.register('claimDoubleWageDetail')}
                                        />
                                      )}
                                    </div>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="claimOvertime"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none flex-1">
                                      <FormLabel>主张加班费</FormLabel>
                                      {field.value && (
                                        <Input 
                                          className="mt-2"
                                          placeholder="请填写加班费金额明细"
                                          {...form.register('claimOvertimeDetail')}
                                        />
                                      )}
                                    </div>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="claimAnnualLeave"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none flex-1">
                                      <FormLabel>主张未休年休假工资</FormLabel>
                                      {field.value && (
                                        <Input 
                                          className="mt-2"
                                          placeholder="请填写金额明细"
                                          {...form.register('claimAnnualLeaveDetail')}
                                        />
                                      )}
                                    </div>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="claimSocialInsurance"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none flex-1">
                                      <FormLabel>主张未依法缴纳社会保险费造成的经济损失</FormLabel>
                                      {field.value && (
                                        <Input 
                                          className="mt-2"
                                          placeholder="请填写金额明细"
                                          {...form.register('claimSocialInsuranceDetail')}
                                        />
                                      )}
                                    </div>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="claimTerminationCompensation"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel>主张解除劳动合同经济补偿</FormLabel>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="claimIllegalTermination"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel>主张违法解除劳动合同赔偿金</FormLabel>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="claimLitigationFee"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel>主张诉讼费用由被告承担</FormLabel>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="claimOther"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>其他诉讼请求</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="如有其他诉讼请求请填写"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="claimTotalAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>标的总额（元） <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="请输入总金额" {...field} />
                                </FormControl>
                                <FormDescription>
                                  请填写您主张的所有金额合计
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* ===== 诉前保全 ===== */}
                    <div className="space-y-3">
                      <SectionHeader 
                        title="五、诉前保全" 
                        icon={Shield} 
                        section="preservation" 
                        color="blue"
                      />
                      
                      {expandedSections.preservation && (
                        <div className="space-y-4 rounded-lg border bg-white p-4">
                          <FormField
                            control={form.control}
                            name="hasPreservation"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>已申请诉前保全</FormLabel>
                                  <FormDescription>
                                    如已申请财产保全，请填写相关信息
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          {form.watch('hasPreservation') && (
                            <div className="grid gap-4 sm:grid-cols-3">
                              <FormField
                                control={form.control}
                                name="preservationCourt"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>保全法院</FormLabel>
                                    <FormControl>
                                      <Input placeholder="法院名称" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="preservationDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>保全时间</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="preservationCaseNo"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>保全案号</FormLabel>
                                    <FormControl>
                                      <Input placeholder="案号" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ===== 事实与理由 ===== */}
                    <div className="space-y-3">
                      <SectionHeader 
                        title="六、事实与理由" 
                        icon={FileText} 
                        section="facts" 
                        color="cyan"
                        required
                      />
                      
                      {expandedSections.facts && (
                        <div className="space-y-4 rounded-lg border bg-white p-4">
                          <FormField
                            control={form.control}
                            name="contractSignInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>劳动合同签订情况</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="请描述合同主体、签订时间、地点、合同名称等"
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="contractExecutionInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>劳动合同履行情况 <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="请描述入职时间、用人单位、工作岗位、工作地点、合同约定的每月工资数额及工资构成、办理社会保险的时间及险种、劳动者实际领取的每月工资数额及工资构成、加班工资计算基数及计算方法、加班时间及加班费、年休假等情况"
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
                            name="terminationInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>解除或终止劳动关系情况</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="请描述解除或终止劳动关系的原因、经济补偿/赔偿金数额等"
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="injuryInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>工伤情况</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="如发生工伤，请描述发生工伤时间、工伤认定情况、工伤伤残等级、工伤费用等"
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="arbitrationInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>劳动仲裁相关情况</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="请描述申请劳动仲裁时间、仲裁请求、仲裁文书、仲裁结果等"
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="otherFacts"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>其他相关情况</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="如是否是农民工等特殊情况"
                                    className="min-h-[60px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="legalBasis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>诉请依据</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="请列明法律及司法解释的具体条文，如：《中华人民共和国劳动合同法》第三十条、第八十五条等"
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="evidenceList"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>证据清单</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="请列出您持有的证据，如：1.劳动合同 2.工资条 3.考勤记录 4.银行流水 5.微信/短信记录等"
                                    className="min-h-[100px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* ===== 调解意愿 ===== */}
                    <div className="space-y-3">
                      <SectionHeader 
                        title="七、对纠纷解决方式的意愿" 
                        icon={Scale} 
                        section="mediation" 
                        color="emerald"
                      />
                      
                      {expandedSections.mediation && (
                        <div className="space-y-4 rounded-lg border bg-white p-4">
                          <div className="space-y-3 text-sm text-muted-foreground">
                            <p className="font-medium text-amber-600">了解调解的好处：</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>立案后选择先行调解的，可以很快启动调解程序</li>
                              <li>调解成功且自动履行的免交诉讼费用</li>
                              <li>首次调解不成功，仍有继续调解意愿的，可以选择更换调解组织和调解员</li>
                              <li>调解过程不公开，具有保密性</li>
                              <li>调解达成的协议具有法律效力，可申请强制执行</li>
                            </ul>
                          </div>
                          
                          <div className="space-y-3 rounded-lg bg-emerald-50/50 p-3">
                            <FormField
                              control={form.control}
                              name="understandMediation"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>我已了解调解作为非诉讼纠纷解决方式</FormLabel>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="understandMediationBenefits"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>我已了解先行调解解决纠纷的好处</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="considerMediation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>是否考虑先行调解</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="请选择" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {mediationOptions.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 py-6 text-lg"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          正在生成文书...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          一键生成民事起诉状
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
                        <CardTitle className="text-xl">劳动争议纠纷民事起诉状</CardTitle>
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
                <CardContent className="p-4">
                  <div className="max-h-[600px] overflow-y-auto rounded-lg bg-slate-50 p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed">
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
                      <li>起诉时需提交身份证复印件等证明身份的材料</li>
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
