'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Upload,
  X,
  Image,
  CheckCircle2,
  Camera,
  File,
  Trash2,
  PenTool,
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
  plaintiffNation: z.string().optional(),
  plaintiffWorkUnit: z.string().optional(),
  plaintiffPosition: z.string().optional(),
  plaintiffPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  plaintiffResidence: z.string().min(5, '请输入住所地（户籍所在地）'),
  plaintiffHabitualResidence: z.string().optional(),
  plaintiffIdType: z.string().optional(),
  plaintiffIdCard: z.string().length(18, '请输入正确的身份证号'),
  
  // ===== 委托诉讼代理人 =====
  hasAgent: z.boolean().optional(),
  agentName: z.string().optional(),
  agentUnit: z.string().optional(),
  agentPosition: z.string().optional(),
  agentPhone: z.string().optional(),
  agentPermission: z.string().optional(),
  
  // ===== 被告信息 =====
  defendantName: z.string().min(2, '请输入用人单位名称'),
  defendantAddress: z.string().min(5, '请输入住所地'),
  defendantRegisterAddress: z.string().optional(),
  defendantLegalPerson: z.string().optional(),
  defendantLegalPersonPosition: z.string().optional(),
  defendantLegalPersonPhone: z.string().optional(),
  defendantCreditCode: z.string().optional(),
  defendantType: z.string().optional(),
  
  // ===== 诉讼请求 =====
  claimWage: z.boolean().optional(),
  claimWageDetail: z.string().optional(),
  claimDoubleWage: z.boolean().optional(),
  claimDoubleWageDetail: z.string().optional(),
  claimOvertime: z.boolean().optional(),
  claimOvertimeDetail: z.string().optional(),
  claimAnnualLeave: z.boolean().optional(),
  claimAnnualLeaveDetail: z.string().optional(),
  claimSocialInsurance: z.boolean().optional(),
  claimSocialInsuranceDetail: z.string().optional(),
  claimTerminationCompensation: z.boolean().optional(),
  claimIllegalTermination: z.boolean().optional(),
  claimLitigationFee: z.boolean().optional(),
  claimOther: z.string().optional(),
  claimTotalAmount: z.string().min(1, '请输入标的总额'),
  
  // ===== 诉前保全 =====
  hasPreservation: z.boolean().optional(),
  preservationCourt: z.string().optional(),
  preservationDate: z.string().optional(),
  preservationCaseNo: z.string().optional(),
  
  // ===== 事实与理由 =====
  contractSignInfo: z.string().optional(),
  contractExecutionInfo: z.string().min(10, '请填写劳动合同履行情况'),
  terminationInfo: z.string().optional(),
  injuryInfo: z.string().optional(),
  arbitrationInfo: z.string().optional(),
  otherFacts: z.string().optional(),
  legalBasis: z.string().optional(),
  evidenceList: z.string().optional(),
  
  // ===== 纠纷解决意愿 =====
  understandMediation: z.boolean().optional(),
  understandMediationBenefits: z.boolean().optional(),
  considerMediation: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

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

// 文件上传组件
const FileUpload = ({ 
  label, 
  accept, 
  value, 
  onChange,
  description,
}: { 
  label: string;
  accept: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  description?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(value);
  
  useEffect(() => {
    setPreview(value);
  }, [value]);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const base64 = await fileToBase64(file);
      setPreview(base64);
      onChange(base64);
    } catch (error) {
      console.error('File conversion error:', error);
      toast.error('文件处理失败');
    }
  };
  
  const handleRemove = () => {
    setPreview(undefined);
    onChange(undefined);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {preview ? (
        <div className="relative rounded-lg border overflow-hidden">
          {accept.includes('image') ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="flex items-center gap-2 p-4 bg-slate-50">
              <File className="h-8 w-8 text-slate-400" />
              <span className="text-sm text-slate-600">文件已上传</span>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-600">点击上传</p>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

// 电子签名组件 - 带坐标缩放比例计算
const SignatureCanvas = ({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  
  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置画布尺寸
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // 2x 像素密度
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    // 设置绘图样式
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 如果有值，加载已有签名
    if (value) {
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
    }
  }, [value]);
  
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width / 2; // 反向计算
    const scaleY = canvas.height / rect.height / 2;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };
  
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const signature = canvas.toDataURL('image/png');
      setHasSignature(true);
      onChange(signature);
    }
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    onChange('');
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>电子签名</Label>
        {hasSignature && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSignature}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            清除
          </Button>
        )}
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-32 border-2 border-slate-200 rounded-lg bg-white cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-400 text-sm">请在此处签名</p>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">
        请用鼠标或手指在上面的区域内签名
      </p>
    </div>
  );
};

// Base64 转换工具
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DocumentPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [docNumber, setDocNumber] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    plaintiff: true,
    agent: false,
    defendant: true,
    claims: true,
    preservation: false,
    facts: true,
    mediation: false,
    files: true,
  });
  
  // 文件上传状态
  const [uploadedFiles, setUploadedFiles] = useState<{
    idCardFront?: string;
    idCardBack?: string;
    evidenceFiles: string[];
  }>({ evidenceFiles: [] });
  
  // 签名状态
  const [signature, setSignature] = useState('');
  
  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
      hasAgent: false,
      agentName: '',
      agentUnit: '',
      agentPosition: '',
      agentPhone: '',
      agentPermission: '',
      defendantName: '',
      defendantAddress: '',
      defendantRegisterAddress: '',
      defendantLegalPerson: '',
      defendantLegalPersonPosition: '',
      defendantLegalPersonPhone: '',
      defendantCreditCode: '',
      defendantType: '',
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
      hasPreservation: false,
      preservationCourt: '',
      preservationDate: '',
      preservationCaseNo: '',
      contractSignInfo: '',
      contractExecutionInfo: '',
      terminationInfo: '',
      injuryInfo: '',
      arbitrationInfo: '',
      otherFacts: '',
      legalBasis: '',
      evidenceList: '',
      understandMediation: false,
      understandMediationBenefits: false,
      considerMediation: '',
    },
  });

  // 一键填充模拟测试数据
  const fillMockData = useCallback(() => {
    const mockData: Partial<FormData> = {
      // 原告信息
      plaintiffName: '张伟',
      plaintiffGender: 'male',
      plaintiffBirthDate: '1990-06-15',
      plaintiffNation: '汉族',
      plaintiffWorkUnit: '自由职业',
      plaintiffPosition: '软件工程师',
      plaintiffPhone: '13812345678',
      plaintiffResidence: '北京市朝阳区建国路88号现代城1号楼1501室',
      plaintiffHabitualResidence: '北京市朝阳区建国路88号现代城1号楼1501室',
      plaintiffIdType: '居民身份证',
      plaintiffIdCard: '110105199006151234',
      
      // 被告信息
      defendantName: '北京华创科技有限公司',
      defendantAddress: '北京市海淀区中关村大街1号科技大厦A座1201室',
      defendantRegisterAddress: '北京市海淀区中关村大街1号科技大厦A座1201室',
      defendantLegalPerson: '李明',
      defendantLegalPersonPosition: '法定代表人兼董事长',
      defendantLegalPersonPhone: '010-88888888',
      defendantCreditCode: '91110000123456789X',
      defendantType: '有限责任公司',
      
      // 诉讼请求
      claimWage: true,
      claimWageDetail: '85000元（2024年9月至2025年2月，共计6个月）',
      claimDoubleWage: true,
      claimDoubleWageDetail: '170000元（2024年3月至2025年2月，未签劳动合同期间的双倍工资差额）',
      claimOvertime: true,
      claimOvertimeDetail: '加班费约25000元（含工作日加班、休息日加班及法定节假日加班）',
      claimAnnualLeave: true,
      claimAnnualLeaveDetail: '未休年休假工资报酬约5500元',
      claimSocialInsurance: true,
      claimSocialInsuranceDetail: '2024年3月至2025年2月期间未依法缴纳社会保险的经济补偿约30000元',
      claimTerminationCompensation: true,
      claimIllegalTermination: true,
      claimLitigationFee: true,
      claimTotalAmount: '315500',
      
      // 事实与理由
      contractSignInfo: '申请人于2024年2月20日到被申请人处面试，2月25日正式入职，担任高级软件工程师一职。双方口头约定月工资25000元，每月15日发放上个月工资。工作期间，被申请人一直未与申请人签订书面劳动合同，也未为申请人缴纳社会保险。',
      contractExecutionInfo: '申请人入职后主要负责公司核心系统的开发工作，工作地点位于北京市海淀区中关村大街1号科技大厦。入职以来，申请人勤勉尽责完成了各项工作任务，多次受到部门领导表扬。然而，被申请人自2024年9月起开始拖欠工资，截至2025年2月已累计拖欠6个月工资共计150000元。期间申请人多次向公司催要工资，公司均以资金周转困难为由推脱。此外，申请人存在大量加班情况，包括工作日延长工作时间加班约200小时，休息日加班约30天，法定节假日加班约5天，但公司从未支付过加班费。',
      terminationInfo: '2025年2月28日，被申请人突然通知申请人公司经营困难，要求申请人次日办理离职手续。申请人于2025年3月1日正式离职，离职时被申请人未支付任何经济补偿。申请人认为，被申请人拖欠工资、未签劳动合同、未缴纳社保、违法解除劳动合同等行为已严重侵犯申请人的合法权益。',
      arbitrationInfo: '申请人曾向北京市海淀区劳动人事争议仲裁委员会申请劳动仲裁，仲裁委于2025年3月15日作出裁决，支持了申请人部分仲裁请求。但申请人认为仲裁裁决对部分事项认定有误，故依法向人民法院提起诉讼。',
      otherFacts: '申请人系外地来京务工人员，在京工作生活多年，符合《保障农民工工资支付条例》中关于农民工的认定标准。本案涉及工资拖欠、社会保险等关系到劳动者基本权益的事项，请求法院依法保护劳动者的合法权益。',
      legalBasis: '《中华人民共和国劳动法》第五十条：工资应当以货币形式按月支付给劳动者本人。不得克扣或者无故拖欠劳动者的工资。\n《劳动合同法》第十条：建立劳动关系，应当订立书面劳动合同。已建立劳动关系，未同时订立书面劳动合同的，应当自用工之日起一个月内订立书面劳动合同。\n《劳动合同法》第八十二条：用人单位自用工之日起超过一个月不满一年未与劳动者订立书面劳动合同的，应当向劳动者每月支付二倍的工资。\n《劳动合同法》第八十七条：用人单位违反本法规定解除或者终止劳动合同的，应当依照本法第四十七条规定的经济补偿标准的二倍向劳动者支付赔偿金。',
      evidenceList: '1.银行流水交易明细（证明工资标准及发放情况）\n2.工作证、工牌、门禁卡\n3.钉钉/企业微信工作记录截图\n4.加班打卡记录\n5.与公司领导的沟通记录（微信、短信、邮件）\n6.公司工位照片及办公环境视频\n7.同事证言\n8.个人所得税完税证明\n9.社保缴费记录查询结果\n10.劳动仲裁裁决书',
      
      // 调解意愿
      understandMediation: true,
      understandMediationBenefits: true,
      considerMediation: 'yes',
    };
    
    form.reset(mockData as FormData);
    setUploadedFiles({
      idCardFront: undefined,
      idCardBack: undefined,
      evidenceFiles: [],
    });
    setSignature('');
    toast.success('已填充模拟数据，请检查后修改');
  }, [form]);

  // 从 URL 参数加载文书数据
  useEffect(() => {
    const loadDocumentData = async () => {
      // 获取 URL 参数
      const params = new URLSearchParams(window.location.search);
      const docId = params.get('id');
      const action = params.get('action');
      
      if (docId && (action === 'edit' || action === 'view')) {
        try {
          console.log('[document] Loading document:', docId);
          const response = await fetch(`/api/documents/${docId}`);
          const result = await response.json();
          
          if (result.success && result.data) {
            const data = result.data;
            
            // 恢复表单数据
            const formData: Partial<FormData> = {};
            
            // 原告信息
            formData.plaintiffName = data.plaintiff_name || '';
            formData.plaintiffGender = data.plaintiff_gender || '';
            formData.plaintiffBirthDate = data.plaintiff_birth_date || '';
            formData.plaintiffNation = data.plaintiff_nation || '';
            formData.plaintiffWorkUnit = data.plaintiff_work_unit || '';
            formData.plaintiffPosition = data.plaintiff_position || '';
            formData.plaintiffPhone = data.plaintiff_phone || '';
            formData.plaintiffResidence = data.plaintiff_residence || '';
            formData.plaintiffHabitualResidence = data.plaintiff_habitual_residence || '';
            formData.plaintiffIdType = data.plaintiff_id_type || '';
            formData.plaintiffIdCard = data.plaintiff_id_card || '';
            
            // 代理人
            formData.hasAgent = data.has_agent || false;
            formData.agentName = data.agent_name || '';
            formData.agentUnit = data.agent_unit || '';
            formData.agentPosition = data.agent_position || '';
            formData.agentPhone = data.agent_phone || '';
            formData.agentPermission = data.agent_permission || '';
            
            // 被告信息
            formData.defendantName = data.defendant_name || '';
            formData.defendantAddress = data.defendant_address || '';
            formData.defendantRegisterAddress = data.defendant_register_address || '';
            formData.defendantLegalPerson = data.defendant_legal_person || '';
            formData.defendantLegalPersonPosition = data.defendant_legal_person_position || '';
            formData.defendantLegalPersonPhone = data.defendant_legal_person_phone || '';
            formData.defendantCreditCode = data.defendant_credit_code || '';
            formData.defendantType = data.defendant_type || '';
            
            // 诉讼请求
            if (data.claims) {
              const claims = typeof data.claims === 'string' ? JSON.parse(data.claims) : data.claims;
              formData.claimWage = claims.claimWage || false;
              formData.claimWageDetail = claims.claimWageDetail || '';
              formData.claimDoubleWage = claims.claimDoubleWage || false;
              formData.claimDoubleWageDetail = claims.claimDoubleWageDetail || '';
              formData.claimOvertime = claims.claimOvertime || false;
              formData.claimOvertimeDetail = claims.claimOvertimeDetail || '';
              formData.claimAnnualLeave = claims.claimAnnualLeave || false;
              formData.claimAnnualLeaveDetail = claims.claimAnnualLeaveDetail || '';
              formData.claimSocialInsurance = claims.claimSocialInsurance || false;
              formData.claimSocialInsuranceDetail = claims.claimSocialInsuranceDetail || '';
              formData.claimTerminationCompensation = claims.claimTerminationCompensation || false;
              formData.claimIllegalTermination = claims.claimIllegalTermination || false;
              formData.claimLitigationFee = claims.claimLitigationFee !== false;
              formData.claimOther = claims.claimOther || '';
            }
            formData.claimTotalAmount = data.claim_total_amount ? String(data.claim_total_amount) : '';
            
            // 诉前保全
            formData.hasPreservation = data.has_preservation || false;
            formData.preservationCourt = data.preservation_court || '';
            formData.preservationDate = data.preservation_date || '';
            formData.preservationCaseNo = data.preservation_case_no || '';
            
            // 事实与理由
            formData.contractSignInfo = data.contract_sign_info || '';
            formData.contractExecutionInfo = data.contract_execution_info || '';
            formData.terminationInfo = data.termination_info || '';
            formData.injuryInfo = data.injury_info || '';
            formData.arbitrationInfo = data.arbitration_info || '';
            formData.otherFacts = data.other_facts || '';
            formData.legalBasis = data.legal_basis || '';
            formData.evidenceList = data.evidence_list || '';
            
            // 调解意愿
            formData.understandMediation = data.understand_mediation || false;
            formData.understandMediationBenefits = data.understand_mediation_benefits || false;
            formData.considerMediation = data.consider_mediation || '';
            
            // 恢复表单数据
            form.reset(formData as FormData);
            
            // 恢复文件 URL
            if (data.signature_url) {
              setSignature(data.signature_url);
            }
            
            // 恢复文书内容
            if (data.document_content) {
              setGeneratedDocument(data.document_content);
            }
            
            // 设置编辑模式
            setEditingDocId(data.id);
            if (action === 'view') {
              setIsEditMode(false);
              toast.info('当前为查看模式，无法编辑');
            } else {
              setIsEditMode(true);
              toast.success('已加载文书数据，可进行编辑');
            }
            
            setDocNumber(data.doc_number || String(data.id));
          } else {
            toast.error(result.error || '加载文书失败');
          }
        } catch (error) {
          console.error('[document] Load error:', error);
          toast.error('加载文书失败，请检查网络');
        }
      }
    };
    
    loadDocumentData();
  }, [form]);

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
      agentText = `有\n委托诉讼代理人：${data.agentName || ''}\n单位：${data.agentUnit || ''} 职务：${data.agentPosition || ''} 联系电话：${data.agentPhone || ''}\n代理权限：${data.agentPermission === 'special' ? '特别授权' : '一般授权'}`;
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

  // 生成并提交文书
  const generateAndSubmitDocument = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // 1. 生成文书内容
      const content = generateComplaintDocument(data);
      setGeneratedDocument(content);
      
      // 2. 构建提交数据
      const submitData = {
        // 基础信息
        document_type: '民事起诉状',
        applicant_name: data.plaintiffName,
        applicant_phone: data.plaintiffPhone,
        document_content: content,
        
        // 原告信息
        plaintiff_name: data.plaintiffName,
        plaintiff_gender: data.plaintiffGender,
        plaintiff_birth_date: data.plaintiffBirthDate,
        plaintiff_nation: data.plaintiffNation || null,
        plaintiff_work_unit: data.plaintiffWorkUnit || null,
        plaintiff_position: data.plaintiffPosition || null,
        plaintiff_phone: data.plaintiffPhone,
        plaintiff_residence: data.plaintiffResidence,
        plaintiff_habitual_residence: data.plaintiffHabitualResidence || null,
        plaintiff_id_type: data.plaintiffIdType || '居民身份证',
        plaintiff_id_card: data.plaintiffIdCard,
        
        // 被告信息
        defendant_name: data.defendantName,
        defendant_address: data.defendantAddress,
        defendant_register_address: data.defendantRegisterAddress || null,
        defendant_legal_person: data.defendantLegalPerson || null,
        defendant_legal_person_position: data.defendantLegalPersonPosition || null,
        defendant_legal_person_phone: data.defendantLegalPersonPhone || null,
        defendant_credit_code: data.defendantCreditCode || null,
        defendant_type: data.defendantType || null,
        
        // 代理人
        has_agent: data.hasAgent || false,
        agent_name: data.agentName || null,
        agent_unit: data.agentUnit || null,
        agent_position: data.agentPosition || null,
        agent_phone: data.agentPhone || null,
        agent_permission: data.agentPermission || null,
        
        // 诉讼请求
        claims: JSON.stringify({
          claimWage: data.claimWage,
          claimWageDetail: data.claimWageDetail,
          claimDoubleWage: data.claimDoubleWage,
          claimDoubleWageDetail: data.claimDoubleWageDetail,
          claimOvertime: data.claimOvertime,
          claimOvertimeDetail: data.claimOvertimeDetail,
          claimAnnualLeave: data.claimAnnualLeave,
          claimAnnualLeaveDetail: data.claimAnnualLeaveDetail,
          claimSocialInsurance: data.claimSocialInsurance,
          claimSocialInsuranceDetail: data.claimSocialInsuranceDetail,
          claimTerminationCompensation: data.claimTerminationCompensation,
          claimIllegalTermination: data.claimIllegalTermination,
          claimLitigationFee: data.claimLitigationFee,
          claimOther: data.claimOther,
        }),
        claim_total_amount: data.claimTotalAmount,
        
        // 诉前保全
        has_preservation: data.hasPreservation || false,
        preservation_court: data.preservationCourt || null,
        preservation_date: data.preservationDate || null,
        preservation_case_no: data.preservationCaseNo || null,
        
        // 事实与理由
        contract_sign_info: data.contractSignInfo || null,
        contract_execution_info: data.contractExecutionInfo,
        termination_info: data.terminationInfo || null,
        injury_info: data.injuryInfo || null,
        arbitration_info: data.arbitrationInfo || null,
        other_facts: data.otherFacts || null,
        legal_basis: data.legalBasis || null,
        evidence_list: data.evidenceList || null,
        
        // 调解意愿
        understand_mediation: data.understandMediation || false,
        understand_mediation_benefits: data.understandMediationBenefits || false,
        consider_mediation: data.considerMediation || null,
        
        // 文件
        id_card_front: uploadedFiles.idCardFront,
        id_card_back: uploadedFiles.idCardBack,
        evidence_files: uploadedFiles.evidenceFiles,
        signature: signature,
        
        // 完整表单数据
        form_data: data,
        status: 'pending',
      };
      
      // 3. 调用 API 提交或更新
      let response;
      if (isEditMode && editingDocId) {
        // 编辑模式：更新已有文书
        submitData.status = 'draft'; // 编辑后重新变为草稿
        response = await fetch(`/api/documents/${editingDocId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
      } else {
        // 新增模式
        response = await fetch('/api/documents/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
      }
      
      const result = await response.json();
      console.log('[document] Submit result:', result);
      
      if (result.success && result.data) {
        setDocNumber(result.data.doc_number || result.data.id);
        setSubmitSuccess(true);
        toast.success(isEditMode ? '文书已更新成功' : '文书已生成并提交成功');
        
        // 滚动到预览区域
        setTimeout(() => {
          document.getElementById('generated-document')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        toast.error(result.error || '提交失败，请重试');
      }
    } catch (error) {
      console.error('[document] Submit error:', error);
      toast.error('网络错误，请检查网络连接后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: FormData) => {
    generateAndSubmitDocument(data);
  };

  // 仅生成预览（不提交）
  const generatePreview = async (data: FormData) => {
    setIsGenerating(true);
    setGeneratedDocument(null);

    try {
      const content = generateComplaintDocument(data);
      setGeneratedDocument(content);
      toast.success('文书预览已生成');
    } catch (error) {
      console.error('生成文书失败:', error);
      toast.error('生成文书失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
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

  // 提交成功页面
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-200 shadow-xl shadow-emerald-500/10">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-emerald-700">文书提交成功</h2>
            <p className="mb-4 text-muted-foreground">
              您的民事起诉状已成功提交，检察机关将在3个工作日内审核
            </p>
            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">文书编号</p>
              <p className="text-xl font-mono font-bold text-primary">{docNumber}</p>
            </div>
            <div className="space-y-3">
              <Button asChild className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600">
                <Link href="/apply">
                  <FileText className="mr-2 h-4 w-4" />
                  申请支持起诉
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

                    {/* ===== 文件上传与签名 ===== */}
                    <div className="space-y-3">
                      <SectionHeader 
                        title="八、身份证件与证据上传" 
                        icon={Upload} 
                        section="files" 
                        color="blue"
                      />
                      
                      {expandedSections.files && (
                        <div className="space-y-6 rounded-lg border bg-white p-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FileUpload
                              label="身份证正面"
                              accept="image/*"
                              value={uploadedFiles.idCardFront}
                              onChange={(value) => setUploadedFiles(prev => ({ ...prev, idCardFront: value }))}
                              description="上传身份证人像面"
                            />
                            
                            <FileUpload
                              label="身份证背面"
                              accept="image/*"
                              value={uploadedFiles.idCardBack}
                              onChange={(value) => setUploadedFiles(prev => ({ ...prev, idCardBack: value }))}
                              description="上传身份证国徽面"
                            />
                          </div>
                          
                          <div>
                            <Label className="mb-2 block">证据材料</Label>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {uploadedFiles.evidenceFiles.map((file, index) => (
                                <div key={index} className="relative rounded-lg border overflow-hidden">
                                  {file.startsWith('data:image') ? (
                                    <img 
                                      src={file} 
                                      alt={`证据 ${index + 1}`} 
                                      className="w-full h-24 object-cover"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2 p-3 bg-slate-50">
                                      <File className="h-6 w-6 text-slate-400" />
                                      <span className="text-sm text-slate-600 truncate">证据 {index + 1}</span>
                                    </div>
                                  )}
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                    onClick={() => {
                                      setUploadedFiles(prev => ({
                                        ...prev,
                                        evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
                                      }));
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              
                              <div
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-4 hover:border-emerald-400 transition-colors cursor-pointer min-h-[100px]"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*,.pdf,.doc,.docx';
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      try {
                                        const base64 = await fileToBase64(file);
                                        setUploadedFiles(prev => ({
                                          ...prev,
                                          evidenceFiles: [...prev.evidenceFiles, base64]
                                        }));
                                      } catch (error) {
                                        toast.error('文件处理失败');
                                      }
                                    }
                                  };
                                  input.click();
                                }}
                              >
                                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                                <span className="text-xs text-slate-500">添加证据</span>
                              </div>
                            </div>
                          </div>
                          
                          <SignatureCanvas
                            value={signature}
                            onChange={setSignature}
                          />
                        </div>
                      )}
                    </div>

                    {/* 提交按钮 */}
                    <div className="space-y-3 pt-4 border-t">
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 py-6 text-lg"
                        disabled={isSubmitting || isGenerating}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            正在生成并提交文书...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            {isEditMode ? '重新生成并更新文书' : '一键生成并提交民事起诉状'}
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => generatePreview(form.getValues())}
                        disabled={isSubmitting || isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            正在生成预览...
                          </>
                        ) : (
                          <>
                            <FileDown className="mr-2 h-4 w-4" />
                            仅生成预览
                          </>
                        )}
                      </Button>
                      
                      {/* 开发调试按钮：一键填充模拟数据 */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-emerald-600 h-8"
                        onClick={fillMockData}
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        填充模拟数据（开发测试用）
                      </Button>
                    </div>
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
                <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">文书预览</CardTitle>
                        <CardDescription>已生成的民事起诉状</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="rounded-lg bg-slate-50 p-4 max-h-[600px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono text-slate-700">
                      {generatedDocument}
                    </pre>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopy}
                      className="flex-1"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-4 w-4" />
                          复制
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDownload}
                      className="flex-1"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      下载
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* 帮助提示 */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  填写提示
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-2">
                <p>1. 请确保填写的所有信息真实有效</p>
                <p>2. 带 * 号的字段为必填项</p>
                <p>3. 建议提前准备好身份证等证件照片</p>
                <p>4. 证据材料支持图片、PDF、Word文档</p>
                <p>5. 文书提交后将进入审核流程</p>
                <p>6. 如需帮助，请先使用&quot;智能咨询&quot;功能</p>
              </CardContent>
            </Card>
            
            {/* 相关链接 */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/consult">
                      <Sparkles className="mr-2 h-4 w-4" />
                      智能法律咨询
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/apply">
                      <FileText className="mr-2 h-4 w-4" />
                      申请支持起诉
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/report">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      填报欠薪线索
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
