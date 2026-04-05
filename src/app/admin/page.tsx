'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogIn,
  LogOut,
  FileText,
  Send,
  PenTool,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Scale,
  Shield,
  TrendingUp,
  Filter,
  Eye,
  Building2,
  Phone,
  CreditCard,
  Calendar,
  ArrowRight,
  Bell,
  Activity,
  Inbox,
  Home,
  PlusCircle,
  Loader2,
  Database,
  Upload,
  Download,
  Settings,
  BarChart3,
  PieChart,
  Search,
  Edit,
  Save,
  FileDown,
  FileUp,
  FolderOpen,
  Image,
  File,
  Video,
  AudioLines,
  Mail,
  Megaphone,
  Copy,
  ExternalLink,
  MoreVertical,
  Check,
  XCircle,
  Info,
  DollarSign,
  UserCheck,
  UserX,
  Key,
  Globe,
  BellRing,
  FileCog,
  LayoutTemplate,
  Plus,
  Minus,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'reports' | 'applications' | 'documents' | 'consultations' | 'announcements' | 'caseDatabase' | 'files' | 'statistics' | 'templates' | 'settings';

interface Stats {
  reports: number;
  applications: number;
  documents: number;
  consultations: number;
  pendingReports: number;
  pendingApplications: number;
  totalAmount: number;
  monthlyData: { month: string; count: number; amount: number }[];
  categoryData: { category: string; count: number }[];
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Report {
  id: number;
  name: string;
  phone: string;
  id_card: string | null;
  company_name: string | null;
  company_address: string | null;
  owed_amount: string | null;
  owed_months: number | null;
  worker_count: number | null;
  description: string | null;
  evidence: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

interface Application {
  id: number;
  applicant_name: string;
  applicant_phone: string;
  applicant_id_card: string | null;
  application_type: string;
  case_brief: string | null;
  owed_amount: string | null;
  supporting_documents: string | null;
  status: string;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

interface Document {
  id: number;
  document_type: string;
  applicant_name: string | null;
  applicant_phone: string | null;
  document_content: string | null;
  template_used: string | null;
  created_at: string;
}

interface Consultation {
  id: number;
  session_id: string | null;
  user_question: string;
  ai_response: string | null;
  created_at: string;
}

interface CaseItem {
  id: number;
  case_number: string;
  plaintiff_name: string;
  plaintiff_phone: string;
  defendant_name: string;
  case_type: string;
  amount: number;
  status: string;
  filing_date: string;
  close_date: string | null;
  handler: string | null;
  notes: string | null;
}

interface FileItem {
  id: number;
  name: string;
  type: string;
  size: number;
  case_id: number | null;
  uploaded_by: string;
  created_at: string;
  url: string;
}

interface Template {
  id: number;
  name: string;
  type: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

interface SystemSetting {
  key: string;
  value: string;
  description: string;
}

const tabs = [
  { key: 'dashboard' as TabType, label: '数据概览', icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
  { key: 'reports' as TabType, label: '线索填报', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { key: 'applications' as TabType, label: '在线申请', icon: Send, color: 'text-green-600', bgColor: 'bg-green-50' },
  { key: 'caseDatabase' as TabType, label: '案件库', icon: Database, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { key: 'files' as TabType, label: '文件管理', icon: FolderOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { key: 'statistics' as TabType, label: '统计分析', icon: BarChart3, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  { key: 'documents' as TabType, label: '文书生成', icon: PenTool, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { key: 'templates' as TabType, label: '文书模板', icon: LayoutTemplate, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { key: 'consultations' as TabType, label: '咨询记录', icon: MessageSquare, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { key: 'announcements' as TabType, label: '公告管理', icon: AlertCircle, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { key: 'settings' as TabType, label: '系统设置', icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50' },
];

// 模拟案件库数据
const mockCases: CaseItem[] = [
  { id: 1, case_number: 'AJ20260001', plaintiff_name: '张某', plaintiff_phone: '138****1234', defendant_name: '某建筑公司', case_type: '欠薪纠纷', amount: 45000, status: 'processing', filing_date: '2026-01-15', close_date: null, handler: '李检察官', notes: '已联系用人单位' },
  { id: 2, case_number: 'AJ20260002', plaintiff_name: '王某等32人', plaintiff_phone: '139****5678', defendant_name: '某餐饮公司', case_type: '集体欠薪', amount: 380000, status: 'completed', filing_date: '2026-01-10', close_date: '2026-02-28', handler: '王检察官', notes: '已成功追回' },
  { id: 3, case_number: 'AJ20260003', plaintiff_name: '李某', plaintiff_phone: '137****9012', defendant_name: '某装修公司', case_type: '欠薪纠纷', amount: 18000, status: 'pending', filing_date: '2026-03-01', close_date: null, handler: null, notes: '待分配' },
];

// 模拟文件数据
const mockFiles: FileItem[] = [
  { id: 1, name: '劳动合同.pdf', type: 'application/pdf', size: 256000, case_id: 1, uploaded_by: '系统', created_at: '2026-01-15', url: '/files/contract.pdf' },
  { id: 2, name: '工资条照片.jpg', type: 'image/jpeg', size: 1024000, case_id: 1, uploaded_by: '张某', created_at: '2026-01-15', url: '/files/salary.jpg' },
  { id: 3, name: '证据材料.zip', type: 'application/zip', size: 5120000, case_id: 2, uploaded_by: '王某', created_at: '2026-01-12', url: '/files/evidence.zip' },
];

// 模拟模板数据
const mockTemplates: Template[] = [
  { id: 1, name: '民事起诉状', type: 'complaint', content: '原告：{{plaintiff}}\n被告：{{defendant}}\n诉讼请求：{{claims}}', variables: ['plaintiff', 'defendant', 'claims'], is_active: true, created_at: '2026-01-01' },
  { id: 2, name: '支持起诉申请书', type: 'support', content: '申请人：{{applicant}}\n被申请人：{{respondent}}\n申请事项：{{request}}', variables: ['applicant', 'respondent', 'request'], is_active: true, created_at: '2026-01-01' },
  { id: 3, name: '法律援助申请书', type: 'legal_aid', content: '申请人：{{applicant}}\n申请理由：{{reason}}', variables: ['applicant', 'reason'], is_active: true, created_at: '2026-01-01' },
];

// 模拟系统设置
const mockSettings: SystemSetting[] = [
  { key: 'platform_name', value: '护薪平台', description: '平台名称' },
  { key: 'contact_phone', value: '12345', description: '联系电话' },
  { key: 'legal_aid_threshold', value: '3000', description: '法律援助金额门槛（元）' },
  { key: 'auto_assign', value: 'true', description: '自动分配案件' },
  { key: 'sms_notification', value: 'true', description: '短信通知' },
  { key: 'email_notification', value: 'false', description: '邮件通知' },
];

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [cases, setCases] = useState<CaseItem[]>(mockCases);
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [settings, setSettings] = useState<SystemSetting[]>(mockSettings);
  const [selectedItem, setSelectedItem] = useState<Report | Application | Document | Consultation | Announcement | CaseItem | FileItem | Template | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 文件上传相关
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // 通知相关
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    content: '',
    type: 'system',
    recipients: 'all',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/login');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setLoginError(data.error || '登录失败');
      }
    } catch {
      setLoginError('网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'announcements') {
        const res = await fetch('/api/announcements?limit=50');
        const data = await res.json();
        if (data.success) {
          setAnnouncements(data.data);
        }
        setIsLoading(false);
        return;
      }

      if (activeTab === 'caseDatabase') {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '20',
          ...(statusFilter && { status: statusFilter }),
          ...(searchQuery && { search: searchQuery }),
        });
        const res = await fetch(`/api/admin/cases?${params}`);
        const data = await res.json();
        if (data.success) {
          setCases(data.data);
          setTotalPages(data.totalPages || 1);
        }
        setIsLoading(false);
        return;
      }

      if (activeTab === 'files') {
        const res = await fetch('/api/admin/files');
        const data = await res.json();
        if (data.success) {
          setFiles(data.data);
        }
        setIsLoading(false);
        return;
      }

      if (activeTab === 'templates') {
        const res = await fetch('/api/admin/templates');
        const data = await res.json();
        if (data.success) {
          setTemplates(data.data);
        }
        setIsLoading(false);
        return;
      }

      if (activeTab === 'settings') {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success) {
          setSettings(data.data);
        }
        setIsLoading(false);
        return;
      }

      if (activeTab === 'statistics') {
        setIsLoading(false);
        return;
      }

      const type = activeTab === 'dashboard' ? 'stats' : activeTab;
      const params = new URLSearchParams({
        type,
        page: page.toString(),
        pageSize: '10',
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/data?${params}`);
      const data = await res.json();

      if (data.stats) setStats(data.stats);
      if (data.reports) {
        setReports(data.reports);
        setTotalPages(Math.ceil((data.reportsTotal || 0) / 10));
      }
      if (data.applications) {
        setApplications(data.applications);
        setTotalPages(Math.ceil((data.applicationsTotal || 0) / 10));
      }
      if (data.documents) {
        setDocuments(data.documents);
        setTotalPages(Math.ceil((data.documentsTotal || 0) / 10));
      }
      if (data.consultations) {
        setConsultations(data.consultations);
        setTotalPages(Math.ceil((data.consultationsTotal || 0) / 10));
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, statusFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const handleUpdateStatus = async (type: 'report' | 'application', id: number, status: string) => {
    try {
      const res = await fetch('/api/admin/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, data: { status } }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('确定要删除这条记录吗？此操作不可恢复。')) return;

    try {
      const res = await fetch(`/api/admin/data?type=${type}&id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setSelectedItem(null);
        setSelectedItemType(null);
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 公告管理功能
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    category: '通知',
    is_published: true,
  });

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: '', content: '', category: '通知', is_published: true });
    setShowAnnouncementForm(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      is_published: announcement.is_published,
    });
    setShowAnnouncementForm(true);
  };

  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      alert('请填写标题和内容');
      return;
    }

    try {
      const url = editingAnnouncement
        ? `/api/announcements/${editingAnnouncement.id}`
        : '/api/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAnnouncementForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('保存公告失败:', error);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('确定要删除这条公告吗？此操作不可恢复。')) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('删除公告失败:', error);
    }
  };

  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // 模拟上传进度
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // 模拟上传完成
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);
      
      // 添加新文件到列表
      const newFile: FileItem = {
        id: mockFiles.length + 1,
        name: files[0].name,
        type: files[0].type,
        size: files[0].size,
        case_id: null,
        uploaded_by: '管理员',
        created_at: new Date().toISOString(),
        url: `/files/${files[0].name}`,
      };
      setFiles((prev) => [newFile, ...prev]);
      
      alert('文件上传成功！');
    }, 2000);
  };

  // 导出数据
  const handleExportData = (type: string) => {
    let data: unknown[] = [];
    let filename = '';

    switch (type) {
      case 'reports':
        data = reports;
        filename = '线索填报数据';
        break;
      case 'applications':
        data = applications;
        filename = '在线申请数据';
        break;
      case 'cases':
        data = cases;
        filename = '案件数据';
        break;
      default:
        return;
    }

    // 创建 CSV 内容
    const csvContent = JSON.stringify(data, null, 2);
    const blob = new Blob([csvContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 发送通知
  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.content) {
      alert('请填写通知标题和内容');
      return;
    }

    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationForm),
      });
      const data = await res.json();
      if (data.success) {
        alert('通知发送成功！');
        setShowNotificationForm(false);
        setNotificationForm({ title: '', content: '', type: 'system', recipients: 'all' });
      }
    } catch (error) {
      console.error('发送通知失败:', error);
      alert('发送通知失败');
    }
  };

  // 更新案件状态
  const handleUpdateCaseStatus = async (caseId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCases((prev) =>
          prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
        );
      }
    } catch (error) {
      console.error('更新案件状态失败:', error);
    }
  };

  // 更新设置
  const handleUpdateSetting = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  // 保存设置
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        alert('设置保存成功！');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存设置失败');
    }
  };

  // 模板管理
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleSaveTemplate = () => {
    alert('模板保存成功！');
    setShowTemplateForm(false);
    setEditingTemplate(null);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className: string }> = {
      pending: { variant: 'outline', label: '待处理', className: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
      processing: { variant: 'outline', label: '处理中', className: 'border-blue-300 bg-blue-50 text-blue-700' },
      completed: { variant: 'outline', label: '已完成', className: 'border-green-300 bg-green-50 text-green-700' },
      rejected: { variant: 'outline', label: '已驳回', className: 'border-red-300 bg-red-50 text-red-700' },
    };
    const { variant, label, className } = config[status] || config.pending;
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return AudioLines;
    if (type.includes('pdf')) return File;
    return File;
  };

  const totalPending = (stats?.pendingReports || 0) + (stats?.pendingApplications || 0);

  // Loading state
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-primary/3 to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-[var(--gold)]/10 blur-3xl" />
        </div>
        <div className="relative text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // Login page
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-primary/3 to-background p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-[var(--gold)]/10 blur-3xl" />
        </div>

        <Card className="relative w-full max-w-md border-border/50 bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">后台管理系统</CardTitle>
              <CardDescription className="mt-2">护薪平台 · 数据管理中心</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入管理员密码"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {loginError}
                </div>
              )}

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    登录
                  </>
                )}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              返回首页
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main admin interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/3 to-background">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-[var(--gold)]/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">护薪平台 · 后台管理</h1>
              <p className="text-xs text-muted-foreground">数据管理中心</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalPending > 0 && (
              <Badge variant="outline" className="hidden gap-1.5 border-yellow-300 bg-yellow-50 text-yellow-700 sm:inline-flex">
                <Bell className="h-3.5 w-3.5" />
                {totalPending} 条待处理
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push('/')} className="gap-2">
              <Home className="h-4 w-4" />
              首页
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-2">
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-6">
        {/* Tab Navigation - 横向滚动 */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
                setStatusFilter('');
                setSearchQuery('');
              }}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-white text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.slice(0, 2)}</span>
              {tab.key === 'reports' && stats && stats.pendingReports > 0 && activeTab !== tab.key && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-100 px-1.5 text-[10px] font-semibold text-yellow-700">
                  {stats.pendingReports}
                </span>
              )}
              {tab.key === 'applications' && stats && stats.pendingApplications > 0 && activeTab !== tab.key && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-100 px-1.5 text-[10px] font-semibold text-yellow-700">
                  {stats.pendingApplications}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* 待处理提醒卡片 */}
            {totalPending > 0 && (
              <Card className="border-yellow-200/50 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 backdrop-blur-sm">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
                      <Bell className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-800">您有 {totalPending} 条待处理事项</p>
                      <p className="text-sm text-yellow-600">
                        线索 {stats.pendingReports} 条 · 申请 {stats.pendingApplications} 条
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {stats.pendingReports > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('reports')} className="border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50">
                        处理线索 <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                    {stats.pendingApplications > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('applications')} className="border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50">
                        处理申请 <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 统计卡片 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="线索填报" value={stats.reports} pending={stats.pendingReports} icon={FileText} color="blue" onClick={() => setActiveTab('reports')} />
              <StatsCard title="在线申请" value={stats.applications} pending={stats.pendingApplications} icon={Send} color="green" onClick={() => setActiveTab('applications')} />
              <StatsCard title="文书生成" value={stats.documents} icon={PenTool} color="purple" onClick={() => setActiveTab('documents')} />
              <StatsCard title="咨询记录" value={stats.consultations} icon={MessageSquare} color="orange" onClick={() => setActiveTab('consultations')} />
            </div>

            {/* 快捷操作 */}
            <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">快捷操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  <QuickAction icon={Inbox} label="待处理线索" value={stats.pendingReports} color="blue" onClick={() => { setActiveTab('reports'); setStatusFilter('pending'); }} />
                  <QuickAction icon={Clock} label="处理中申请" value={stats.applications} color="green" onClick={() => { setActiveTab('applications'); setStatusFilter('processing'); }} />
                  <QuickAction icon={Database} label="案件库" value={cases.length} color="indigo" onClick={() => setActiveTab('caseDatabase')} />
                  <QuickAction icon={FolderOpen} label="文件管理" value={files.length} color="amber" onClick={() => setActiveTab('files')} />
                  <QuickAction icon={BarChart3} label="统计分析" value={null} color="pink" onClick={() => setActiveTab('statistics')} />
                  <QuickAction icon={Megaphone} label="发送通知" value={null} color="teal" onClick={() => setShowNotificationForm(true)} />
                </div>
              </CardContent>
            </Card>

            {/* 最近案件 */}
            <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">最近案件</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('caseDatabase')} className="text-primary">
                    查看全部 <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cases.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          <Database className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{c.plaintiff_name} vs {c.defendant_name}</p>
                          <p className="text-xs text-muted-foreground">{c.case_number} · {c.case_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">¥{c.amount.toLocaleString()}</p>
                        {getStatusBadge(c.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 案件库管理 */}
        {activeTab === 'caseDatabase' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索案件..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="processing">处理中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExportData('cases')} className="gap-2">
                  <Download className="h-4 w-4" />
                  导出数据
                </Button>
                <Button onClick={() => alert('新建案件功能')} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  新建案件
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left text-sm font-medium">案件编号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">原告</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">被告</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">案件类型</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">涉案金额</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">承办人</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases
                        .filter((c) => !searchQuery || c.case_number.includes(searchQuery) || c.plaintiff_name.includes(searchQuery))
                        .filter((c) => !statusFilter || c.status === statusFilter)
                        .map((c) => (
                          <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-4 py-3 font-mono text-sm">{c.case_number}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{c.plaintiff_name}</p>
                                <p className="text-xs text-muted-foreground">{c.plaintiff_phone}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">{c.defendant_name}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{c.case_type}</Badge>
                            </td>
                            <td className="px-4 py-3 font-medium text-primary">¥{c.amount.toLocaleString()}</td>
                            <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{c.handler || '-'}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(c); setSelectedItemType('case'); }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleUpdateCaseStatus(c.id, c.status === 'pending' ? 'processing' : c.status === 'processing' ? 'completed' : 'pending')}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleExportData('cases')}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 文件管理 */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索文件..."
                    className="rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary w-64"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} multiple />
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      上传中 {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      上传文件
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 上传进度条 */}
            {isUploading && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-primary/20">
                        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 文件列表 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <Card key={file.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <FileIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(file.created_at)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {file.case_id ? `案件 #${file.case_id}` : '未关联'}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {files.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暂无文件，点击上方按钮上传</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 统计分析 */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            {/* 核心指标 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.reports || 0}</p>
                      <p className="text-xs text-muted-foreground">线索填报总数</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">¥{(stats?.totalAmount || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">涉案金额总计</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">2,458+</p>
                      <p className="text-xs text-muted-foreground">帮助劳动者人数</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">98.6%</p>
                      <p className="text-xs text-muted-foreground">成功维权率</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 图表区域 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    月度案件趋势
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2 px-4">
                    {['1月', '2月', '3月', '4月', '5月', '6月'].map((month, i) => {
                      const heights = [60, 80, 45, 90, 70, 55];
                      return (
                        <div key={month} className="flex flex-col items-center gap-2 flex-1">
                          <div className="w-full bg-primary/20 rounded-t relative" style={{ height: `${heights[i]}%` }}>
                            <div className="absolute inset-0 bg-primary rounded-t opacity-80" />
                          </div>
                          <span className="text-xs text-muted-foreground">{month}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    案件类型分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: '欠薪纠纷', count: 156, percent: 45, color: 'bg-blue-500' },
                      { label: '集体欠薪', count: 78, percent: 22, color: 'bg-green-500' },
                      { label: '工伤赔偿', count: 52, percent: 15, color: 'bg-orange-500' },
                      { label: '劳动合同', count: 38, percent: 11, color: 'bg-purple-500' },
                      { label: '其他', count: 24, percent: 7, color: 'bg-gray-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={cn('h-3 w-3 rounded-full', item.color)} />
                        <span className="flex-1 text-sm">{item.label}</span>
                        <span className="text-sm text-muted-foreground">{item.count} 件</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', item.color)} style={{ width: `${item.percent}%` }} />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 处理效率统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  处理效率统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-3xl font-bold text-green-600">7</p>
                    <p className="text-sm text-green-700">平均处理天数</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-3xl font-bold text-blue-600">24h</p>
                    <p className="text-sm text-blue-700">响应时效</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <p className="text-3xl font-bold text-purple-600">98.6%</p>
                    <p className="text-sm text-purple-700">满意度</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 文书模板管理 */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">文书模板管理</h3>
              <Button onClick={() => { setEditingTemplate(null); setShowTemplateForm(true); }} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                新建模板
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                          <LayoutTemplate className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            {template.type === 'complaint' ? '起诉状' : template.type === 'support' ? '申请书' : '援助申请'}
                          </Badge>
                        </div>
                      </div>
                      {template.is_active ? (
                        <Badge className="bg-green-100 text-green-700">启用</Badge>
                      ) : (
                        <Badge variant="secondary">禁用</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.content.slice(0, 100)}...</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.variables.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)} className="flex-1">
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        复制
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 系统设置 */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  基础设置
                </CardTitle>
                <CardDescription>配置平台基本信息和功能开关</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium">{setting.description}</p>
                      <p className="text-xs text-muted-foreground">{setting.key}</p>
                    </div>
                    {setting.key === 'auto_assign' || setting.key === 'sms_notification' || setting.key === 'email_notification' ? (
                      <button
                        onClick={() => handleUpdateSetting(setting.key, setting.value === 'true' ? 'false' : 'true')}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors',
                          setting.value === 'true' ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                            setting.value === 'true' && 'translate-x-5'
                          )}
                        />
                      </button>
                    ) : (
                      <input
                        type="text"
                        value={setting.value}
                        onChange={(e) => handleUpdateSetting(setting.key, e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-48 text-right"
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} className="gap-2">
                <Save className="h-4 w-4" />
                保存设置
              </Button>
            </div>

            {/* 操作日志 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  最近操作日志
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: '更新案件状态', user: '管理员', time: '5分钟前', type: 'update' },
                    { action: '新增公告', user: '管理员', time: '1小时前', type: 'create' },
                    { action: '导出案件数据', user: '管理员', time: '2小时前', type: 'export' },
                    { action: '上传证据文件', user: '系统', time: '3小时前', type: 'upload' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        log.type === 'create' ? 'bg-green-100 text-green-600' :
                        log.type === 'update' ? 'bg-blue-100 text-blue-600' :
                        log.type === 'export' ? 'bg-purple-100 text-purple-600' :
                        'bg-orange-100 text-orange-600'
                      )}>
                        {log.type === 'create' ? <Plus className="h-4 w-4" /> :
                         log.type === 'update' ? <Edit className="h-4 w-4" /> :
                         log.type === 'export' ? <Download className="h-4 w-4" /> :
                         <Upload className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.user}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters for reports/applications */}
        {(activeTab === 'reports' || activeTab === 'applications') && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleExportData(activeTab)} className="gap-2">
              <Download className="h-4 w-4" />
              导出数据
            </Button>
          </div>
        )}

        {/* Data Tables - 线索填报 */}
        {activeTab === 'reports' && (
          <DataTable<Report>
            data={reports}
            isLoading={isLoading}
            columns={['姓名', '电话', '公司', '欠薪金额', '状态', '提交时间']}
            renderRow={(item) => (
              <tr key={item.id} className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50" onClick={() => { setSelectedItem(item); setSelectedItemType('report'); }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                      {item.name.charAt(0)}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.phone}</td>
                <td className="max-w-[150px] truncate px-4 py-3 text-muted-foreground">{item.company_name || '-'}</td>
                <td className="px-4 py-3 font-medium text-primary">{item.owed_amount ? `¥${item.owed_amount}` : '-'}</td>
                <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{formatDate(item.created_at)}</td>
              </tr>
            )}
          />
        )}

        {/* Data Tables - 在线申请 */}
        {activeTab === 'applications' && (
          <DataTable<Application>
            data={applications}
            isLoading={isLoading}
            columns={['申请人', '电话', '申请类型', '欠薪金额', '状态', '提交时间']}
            renderRow={(item) => (
              <tr key={item.id} className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50" onClick={() => { setSelectedItem(item); setSelectedItemType('application'); }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-600">
                      {item.applicant_name.charAt(0)}
                    </div>
                    <span className="font-medium">{item.applicant_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.applicant_phone}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={item.application_type === 'support_prosecution' ? 'border-green-300 bg-green-50 text-green-700' : 'border-blue-300 bg-blue-50 text-blue-700'}>
                    {item.application_type === 'support_prosecution' ? '支持起诉' : '法律援助'}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium text-primary">{item.owed_amount ? `¥${item.owed_amount}` : '-'}</td>
                <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{formatDate(item.created_at)}</td>
              </tr>
            )}
          />
        )}

        {/* Data Tables - 文书生成 */}
        {activeTab === 'documents' && (
          <DataTable<Document>
            data={documents}
            isLoading={isLoading}
            columns={['文书类型', '申请人', '电话', '模板', '生成时间']}
            renderRow={(item) => (
              <tr key={item.id} className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50" onClick={() => { setSelectedItem(item); setSelectedItemType('document'); }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <PenTool className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.document_type}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.applicant_name || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.applicant_phone || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.template_used || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{formatDate(item.created_at)}</td>
              </tr>
            )}
          />
        )}

        {/* Data Tables - 咨询记录 */}
        {activeTab === 'consultations' && (
          <DataTable<Consultation>
            data={consultations}
            isLoading={isLoading}
            columns={['用户问题', 'AI回复', '咨询时间']}
            renderRow={(item) => (
              <tr key={item.id} className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50" onClick={() => { setSelectedItem(item); setSelectedItemType('consultation'); }}>
                <td className="max-w-[300px] px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <p className="line-clamp-2 text-sm">{item.user_question}</p>
                  </div>
                </td>
                <td className="max-w-[300px] px-4 py-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.ai_response || '-'}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{formatDate(item.created_at)}</td>
              </tr>
            )}
          />
        )}

        {/* 公告管理 */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">公告列表</h3>
              <Button onClick={handleCreateAnnouncement} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                新建公告
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left text-sm font-medium">标题</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">分类</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
                      ) : announcements.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">暂无公告</td></tr>
                      ) : (
                        announcements.map((item) => (
                          <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm">{item.title}</td>
                            <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{item.category}</Badge></td>
                            <td className="px-4 py-3">
                              <Badge variant={item.is_published ? 'default' : 'secondary'} className="text-xs">
                                {item.is_published ? '已发布' : '草稿'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(item.created_at)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditAnnouncement(item)}>编辑</Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteAnnouncement(item.id)}>删除</Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 公告表单弹窗 */}
        {showAnnouncementForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingAnnouncement ? '编辑公告' : '新建公告'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">标题</label>
                  <input type="text" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="请输入公告标题" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">分类</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={announcementForm.category} onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}>
                    <option value="通知">通知</option>
                    <option value="指南">指南</option>
                    <option value="案例">案例</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">内容</label>
                  <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px]" value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} placeholder="请输入公告内容" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_published" checked={announcementForm.is_published} onChange={(e) => setAnnouncementForm({ ...announcementForm, is_published: e.target.checked })} />
                  <label htmlFor="is_published" className="text-sm">立即发布</label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAnnouncementForm(false)}>取消</Button>
                  <Button onClick={handleSaveAnnouncement}>保存</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 通知发送弹窗 */}
        {showNotificationForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  发送通知
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">通知标题</label>
                  <input type="text" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={notificationForm.title} onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })} placeholder="请输入通知标题" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">通知内容</label>
                  <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]" value={notificationForm.content} onChange={(e) => setNotificationForm({ ...notificationForm, content: e.target.value })} placeholder="请输入通知内容" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">接收对象</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={notificationForm.recipients} onChange={(e) => setNotificationForm({ ...notificationForm, recipients: e.target.value })}>
                    <option value="all">全部用户</option>
                    <option value="pending">待处理用户</option>
                    <option value="processing">处理中用户</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowNotificationForm(false)}>取消</Button>
                  <Button onClick={handleSendNotification}>发送</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 详情弹窗 */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>详细信息</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(null); setSelectedItemType(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedItemType === 'report' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-muted-foreground">姓名</p><p className="font-medium">{(selectedItem as Report).name}</p></div>
                        <div><p className="text-xs text-muted-foreground">电话</p><p className="font-medium">{(selectedItem as Report).phone}</p></div>
                        <div><p className="text-xs text-muted-foreground">公司</p><p className="font-medium">{(selectedItem as Report).company_name || '-'}</p></div>
                        <div><p className="text-xs text-muted-foreground">欠薪金额</p><p className="font-medium text-primary">{(selectedItem as Report).owed_amount ? `¥${(selectedItem as Report).owed_amount}` : '-'}</p></div>
                      </div>
                      <div><p className="text-xs text-muted-foreground">问题描述</p><p className="text-sm mt-1">{(selectedItem as Report).description || '-'}</p></div>
                      <div className="flex gap-2 pt-4">
                        <Button size="sm" onClick={() => handleUpdateStatus('report', (selectedItem as Report).id, 'processing')}>开始处理</Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('report', (selectedItem as Report).id, 'completed')}>标记完成</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete('reports', (selectedItem as Report).id)}>删除</Button>
                      </div>
                    </>
                  )}
                  {selectedItemType === 'case' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-muted-foreground">案件编号</p><p className="font-medium font-mono">{(selectedItem as CaseItem).case_number}</p></div>
                        <div><p className="text-xs text-muted-foreground">案件类型</p><p className="font-medium">{(selectedItem as CaseItem).case_type}</p></div>
                        <div><p className="text-xs text-muted-foreground">原告</p><p className="font-medium">{(selectedItem as CaseItem).plaintiff_name}</p></div>
                        <div><p className="text-xs text-muted-foreground">被告</p><p className="font-medium">{(selectedItem as CaseItem).defendant_name}</p></div>
                        <div><p className="text-xs text-muted-foreground">涉案金额</p><p className="font-medium text-primary">¥{(selectedItem as CaseItem).amount.toLocaleString()}</p></div>
                        <div><p className="text-xs text-muted-foreground">状态</p>{getStatusBadge((selectedItem as CaseItem).status)}</div>
                      </div>
                      <div><p className="text-xs text-muted-foreground">备注</p><p className="text-sm mt-1">{(selectedItem as CaseItem).notes || '-'}</p></div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[80px] text-center text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-white/50 backdrop-blur-sm py-4 mt-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          护薪平台后台管理系统 · 北京市西城区人民检察院
        </div>
      </footer>
    </div>
  );
}

// 统计卡片组件
function StatsCard({ title, value, pending, icon: Icon, color, onClick }: { title: string; value: number; pending?: number; icon: React.ElementType; color: string; onClick?: () => void }) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  };
  const c = colorClasses[color] || colorClasses.blue;

  return (
    <Card className={cn('cursor-pointer transition-all hover:shadow-md', c.border, 'border')} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {pending !== undefined && pending > 0 && (
              <p className={cn('text-xs mt-1', c.text)}>{pending} 条待处理</p>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', c.bg)}>
            <Icon className={cn('h-6 w-6', c.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 快捷操作组件
function QuickAction({ icon: Icon, label, value, color, onClick }: { icon: React.ElementType; label: string; value: number | null; color: string; onClick: () => void }) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
  };
  const c = colorClasses[color] || colorClasses.blue;

  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-border/50 bg-white/80 p-4 text-left transition-all hover:shadow-md hover:border-primary/30">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', c.bg)}>
        <Icon className={cn('h-5 w-5', c.text)} />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        {value !== null && <p className="text-lg font-bold">{value}</p>}
      </div>
    </button>
  );
}

// 数据表格组件
function DataTable<T>({ data, isLoading, columns, renderRow }: { data: T[]; isLoading: boolean; columns: string[]; renderRow: (item: T) => React.ReactNode }) {
  return (
    <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-sm font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={columns.length} className="px-4 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
              ) : (
                data.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
