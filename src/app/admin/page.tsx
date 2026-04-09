'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogIn, LogOut, FileText, Send, PenTool, MessageSquare, CheckCircle, AlertCircle,
  Trash2, X, ChevronLeft, RefreshCw, Scale, Shield, Eye, ArrowRight,
  Bell, Home, PlusCircle, Loader2, Database, Upload, Download, Settings, BarChart3,
  Search, Edit, FolderOpen, File, LayoutTemplate, Menu, User, AlertTriangle,
  Mail, Phone, Clock, DollarSign, Users, Printer, PieChart, Activity, BookOpen,
  Calendar, Archive
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============ 内联分页组件 ============
function Pagination({
  total, page, dataLength, onPageChange
}: { total: number; page: number; dataLength: number; onPageChange: (p: number) => void }) {
  if (total <= 10) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 rounded-lg">
      <p className="text-sm text-muted-foreground">显示 {dataLength} 条，共 {total} 条</p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>上一页</Button>
        <span className="px-3 py-1.5 text-sm">第 {page} 页</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={dataLength < 10}>下一页</Button>
      </div>
    </div>
  );
}

// ============ 类型定义 ============
type TabType = 'dashboard' | 'reports' | 'applications' | 'cases' | 'documents' | 'consultations' | 'knowledge' | 'announcements' | 'files' | 'settings';

interface Stats {
  reports: number; applications: number; documents: number; consultations: number;
  pendingReports: number; pendingApplications: number; totalAmount: number;
  caseTypeDistribution?: Record<string, number>;
  monthlyTrend?: { month: string; count: number }[];
  avgProcessingDays?: number;
  successRate?: number;
  helpedWorkers?: number;
  sourceDistribution?: Record<string, number>; // 线索来源分布
}

interface Announcement {
  id: number; title: string; content: string; category: string; is_published: boolean;
  created_at: string; updated_at: string; image_url?: string;
}

interface Report {
  id: number; name: string; phone: string; company_name: string | null; owed_amount: string | null;
  description: string | null; status: string; created_at: string; id_card?: string;
  company_address?: string; owed_months?: number; worker_count?: number; evidence?: string;
  source?: string; // 线索来源：自主填报/12345热线/街道综治/检察业务
}

interface Application {
  id: number; applicant_name: string; applicant_phone: string; application_type: string;
  owed_amount: string | null; status: string; created_at: string; case_brief?: string;
  applicant_id_card?: string;
}

interface Document {
  id: number; document_type: string; applicant_name: string | null; 
  applicant_phone?: string | null; document_content?: string | null;
  template_used?: string | null; created_at: string;
}

interface Consultation {
  id: number; user_question: string; ai_response: string | null; created_at: string; session_id?: string;
}

interface CaseItem {
  id: number; case_number: string; plaintiff_name: string; plaintiff_phone: string;
  defendant_name: string; case_type: string; amount: number; status: string;
  filing_date: string; handler: string | null; notes?: string;
}

interface FileItem {
  id: number; name: string; type: string; size: number; case_id: number | null; 
  created_at: string; url?: string; path?: string;
}

interface Template {
  id: number; name: string; type: string; content: string; variables: string[]; is_active: boolean;
}

interface Knowledge {
  id: number; title: string; content: string; category: string; source: string | null;
  tags: string[]; is_active: boolean; is_published?: boolean;
  created_at: string; updated_at: string; image_url?: string;
}

interface SystemSetting {
  key: string; value: string; description: string;
}

interface OperationLog {
  id: number; action: string; type: string; operator: string; created_at: string;
}

// ============ 导航配置 ============
const navItems = [
  { key: 'dashboard' as TabType, label: '数据概览', icon: BarChart3, group: '核心' },
  { key: 'reports' as TabType, label: '线索填报', icon: FileText, group: '业务' },
  { key: 'applications' as TabType, label: '在线申请', icon: Send, group: '业务' },
  { key: 'cases' as TabType, label: '案件管理', icon: Database, group: '业务' },
  { key: 'documents' as TabType, label: '文书管理', icon: PenTool, group: '业务' },
  { key: 'consultations' as TabType, label: '咨询记录', icon: MessageSquare, group: '业务' },
  { key: 'knowledge' as TabType, label: '知识库', icon: BookOpen, group: '业务' },
  { key: 'announcements' as TabType, label: '公告管理', icon: AlertCircle, group: '运营' },
  { key: 'files' as TabType, label: '文件管理', icon: FolderOpen, group: '运营' },
  { key: 'settings' as TabType, label: '系统设置', icon: Settings, group: '系统' },
];

// 分组配置
const navGroups = [
  { name: '核心', keys: ['dashboard'] },
  { name: '业务', keys: ['reports', 'applications', 'cases', 'documents', 'consultations', 'knowledge'] },
  { name: '运营', keys: ['announcements', 'files'] },
  { name: '系统', keys: ['settings'] },
];

// ============ 主组件 ============
export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['核心', '业务', '运营', '系统']);

  // 数据状态
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsTotal, setDocumentsTotal] = useState(0);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  // 分页总数
  const [reportsTotal, setReportsTotal] = useState(0);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [consultationsTotal, setConsultationsTotal] = useState(0);

  // UI状态
  const [selectedItem, setSelectedItem] = useState<Report | Application | Document | Consultation | Announcement | Knowledge | CaseItem | Template | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState<'detail' | 'form' | 'knowledgeForm' | 'newCase' | 'newTemplate' | 'editTemplate' | null>(null);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [notificationForm, setNotificationForm] = useState<{ type: 'sms' | 'email' | null; recipients: string[]; message: string }>({ type: null, recipients: [], message: '' });
  const [newCase, setNewCase] = useState({ plaintiff_name: '', plaintiff_phone: '', defendant_name: '', case_type: '基础拖欠劳动报酬类', amount: '', notes: '' });
  const [consultationSearch, setConsultationSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; items: unknown[] }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  // 公告图片上传
  const announcementImageRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // 承办人列表
  const handlers = ['李检察官', '王检察官', '张检察官', '赵检察官', '刘检察官'];
  
  // 密码修改状态
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');

  // 案例关联文件
  const [caseFiles, setCaseFiles] = useState<FileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // ============ 初始化 ============
  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/login', {
        credentials: 'include', // 确保发送 cookie
      });
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
        credentials: 'include', // 确保发送 cookie
      });
      
      const data = await res.json();
      
      if (data.success) {
        // 登录成功，先设置认证状态
        setPassword('');
        setLoginError('');
        setIsAuthenticated(true);
        
        // 延迟刷新，确保 cookie 被浏览器完全接受
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        setLoginError(data.error || '密码错误');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('登录错误:', error);
      setLoginError('网络错误，请稍后重试');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // 清除 cookie（同时清除有/无 secure 标记的 cookie）
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; SameSite=lax';
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=lax';
    setIsAuthenticated(false);
  };

  // ============ 数据获取 ============
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 数据概览页面同时获取stats和cases
      if (activeTab === 'dashboard') {
        const [statsRes, casesRes] = await Promise.all([
          fetch('/api/admin/data?type=stats'),
          fetch('/api/admin/cases?pageSize=5'),
        ]);
        
        // 检查认证状态 - 只要有一个返回401就退出
        if (statsRes.status === 401 || casesRes.status === 401) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        const statsData = await statsRes.json();
        const casesData = await casesRes.json();
        if (statsData.stats) setStats(statsData.stats);
        if (casesData.success) setCases(casesData.data);
        setIsLoading(false);
        return;
      }

      if (activeTab === 'announcements') {
        const res = await fetch('/api/announcements?limit=50');
        const data = await res.json();
        if (data.success) setAnnouncements(data.data);
        setIsLoading(false);
        return;
      }

      if (activeTab === 'cases') {
        const params = new URLSearchParams({ page: page.toString(), pageSize: '20' });
        if (statusFilter) params.set('status', statusFilter);
        if (searchQuery) params.set('search', searchQuery);
        const res = await fetch(`/api/admin/cases?${params}`);
        const data = await res.json();
        if (data.success) setCases(data.data);
        setIsLoading(false);
        return;
      }

      if (activeTab === 'files') {
        const res = await fetch('/api/admin/files');
        const data = await res.json();
        if (data.success) setFiles(data.data);
        setIsLoading(false);
        return;
      }

      if (activeTab === 'documents') {
        const [docsRes, templatesRes] = await Promise.all([
          fetch(`/api/admin/data?type=documents&page=${page}&pageSize=10`),
          fetch('/api/admin/templates'),
        ]);
        const docsData = await docsRes.json();
        const templatesData = await templatesRes.json();
        if (docsData.documents) setDocuments(docsData.documents);
        if (docsData.documentsTotal !== undefined) setDocumentsTotal(docsData.documentsTotal);
        if (templatesData.success) setTemplates(templatesData.data);
        setIsLoading(false);
        return;
      }

      if (activeTab === 'knowledge') {
        const res = await fetch('/api/admin/knowledge');
        const data = await res.json();
        if (data.success) setKnowledge(data.data);
        setIsLoading(false);
        return;
      }

      if (activeTab === 'settings') {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success) {
          setSettings(data.data);
          setOperationLogs(data.logs || []);
        }
        setIsLoading(false);
        return;
      }

      // 其他数据
      const type = activeTab;
      const params = new URLSearchParams({ type, page: page.toString(), pageSize: '20' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/data?${params}`);
      const data = await res.json();

      if (data.reports) setReports(data.reports);
      if (data.reportsTotal !== undefined) setReportsTotal(data.reportsTotal);
      if (data.applications) setApplications(data.applications);
      if (data.applicationsTotal !== undefined) setApplicationsTotal(data.applicationsTotal);
      if (data.consultations) setConsultations(data.consultations);
      if (data.consultationsTotal !== undefined) setConsultationsTotal(data.consultationsTotal);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally { setIsLoading(false); }
  }, [activeTab, page, statusFilter, searchQuery]);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated, fetchData]);

  // ============ 操作处理 ============
  const handleUpdateStatus = async (type: 'report' | 'application' | 'case', id: number, status: string) => {
    const endpoint = type === 'case' ? `/api/admin/cases/${id}` : '/api/admin/data';
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type === 'case' ? { status } : { type, id, data: { status } }),
      });
      if ((await res.json()).success) fetchData();
    } catch (error) { console.error('更新状态失败:', error); }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('确定删除？此操作不可恢复。')) return;
    const endpoint = type === 'announcement' ? `/api/announcements/${id}` :
                     type === 'case' ? `/api/admin/cases/${id}` :
                     type === 'knowledge' ? `/api/admin/knowledge/${id}` :
                     `/api/admin/data?type=${type}&id=${id}`;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if ((await res.json()).success) { fetchData(); setSelectedItem(null); }
    } catch (error) { console.error('删除失败:', error); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((p) => (p >= 90 ? 90 : p + 10));
    }, 200);

    try {
      await fetch('/api/admin/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fileList[0].name,
          type: fileList[0].type,
          size: fileList[0].size,
          uploaded_by: '管理员',
        }),
      });
      clearInterval(interval);
      setUploadProgress(100);
      fetchData();
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setTimeout(() => { setIsUploading(false); setUploadProgress(0); }, 500);
    }
  };

  // 上传公告图片
  const handleAnnouncementImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', fileList[0]);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && editingItem) {
        setEditingItem({ ...editingItem, image_url: data.url });
      }
    } catch (error) {
      console.error('上传图片失败:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleExportData = (type: string, data: unknown[]) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = (type: string, data: Record<string, unknown>[], columns: string[]) => {
    const headers = columns.join(',');
    const rows = data.map(item =>
      columns.map(col => {
        const value = item[col] ?? item[col.toLowerCase()] ?? '';
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    ).join('\n');
    const blob = new Blob(['\ufeff' + headers + '\n' + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 下载文书
  const handleDownloadDoc = (doc: Document) => {
    const content = doc.document_content || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_type}_${doc.applicant_name || '未知'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 获取案例关联文件
  const fetchCaseFiles = async (caseId: number) => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch(`/api/admin/files?case_id=${caseId}`);
      const data = await res.json();
      if (data.success) {
        setCaseFiles(data.data);
      }
    } catch (error) {
      console.error('获取案例文件失败:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 打开详情时获取文件
  const handleOpenDetail = (item: typeof selectedItem) => {
    setSelectedItem(item);
    setShowModal('detail');
    // 如果是案件类型，获取关联文件
    if (item && 'case_number' in item) {
      fetchCaseFiles(item.id as number);
    } else {
      setCaseFiles([]);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!editingItem?.title || !editingItem?.content) { alert('请填写标题和内容'); return; }
    const url = editingItem.id ? `/api/announcements/${editingItem.id}` : '/api/announcements';
    const method = editingItem.id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingItem) });
      if ((await res.json()).success) { setShowModal(null); setEditingItem(null); fetchData(); }
    } catch (error) { console.error('保存失败:', error); }
  };

  // 保存知识库条目
  const handleSaveKnowledge = async () => {
    if (!editingItem?.title || !editingItem?.content) { alert('请填写标题和内容'); return; }
    const k = editingItem as unknown as Knowledge;
    const url = k.id ? `/api/admin/knowledge/${k.id}` : '/api/admin/knowledge';
    const method = k.id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(k) });
      if ((await res.json()).success) { setShowModal(null); setEditingItem(null); fetchData(); }
    } catch (error) { console.error('保存失败:', error); }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) });
      if ((await res.json()).success) alert('设置已保存');
    } catch (error) { console.error('保存设置失败:', error); }
  };

  const handleCreateCase = async () => {
    if (!newCase.plaintiff_name || !newCase.defendant_name || !newCase.amount) {
      alert('请填写完整信息');
      return;
    }
    try {
      const caseNumber = `AJ${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;
      const res = await fetch('/api/admin/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_number: caseNumber,
          plaintiff_name: newCase.plaintiff_name,
          plaintiff_phone: newCase.plaintiff_phone,
          defendant_name: newCase.defendant_name,
          case_type: newCase.case_type,
          amount: parseFloat(newCase.amount),
          notes: newCase.notes,
          status: 'pending',
        }),
      });
      if ((await res.json()).success) {
        setShowModal(null);
        setNewCase({ plaintiff_name: '', plaintiff_phone: '', defendant_name: '', case_type: '基础拖欠劳动报酬类', amount: '', notes: '' });
        fetchData();
      }
    } catch (error) { console.error('创建案件失败:', error); }
  };

  // 批量操作
  const handleSelectItem = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (ids: number[]) => {
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);
  };

  const handleBatchDelete = async (type: string) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定删除选中的 ${selectedIds.length} 条记录？`)) return;
    for (const id of selectedIds) { await handleDelete(type, id); }
    setSelectedIds([]);
  };

  const handleBatchStatus = async (type: 'report' | 'application' | 'case', status: string) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) { await handleUpdateStatus(type, id, status); }
    setSelectedIds([]);
  };

  // 发送通知
  const handleSendNotification = async () => {
    if (!notificationForm.type || !notificationForm.message || notificationForm.recipients.length === 0) {
      alert('请填写完整信息'); return;
    }
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: notificationForm.type,
          recipients: notificationForm.recipients,
          content: notificationForm.message,
          title: notificationForm.type === 'sms' ? '短信通知' : '邮件通知',
        }),
      });
      if ((await res.json()).success) {
        alert('通知发送成功');
        setNotificationForm({ type: null, recipients: [], message: '' });
      }
    } catch (error) { console.error('发送通知失败:', error); }
  };

  // ============ 工具函数 ============
  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: '待处理' },
      processing: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: '处理中' },
      completed: { color: 'bg-green-100 text-green-700 border-green-300', label: '已完成' },
      rejected: { color: 'bg-red-100 text-red-700 border-red-300', label: '已驳回' },
    };
    const { color, label } = map[status] || map.pending;
    return <Badge variant="outline" className={cn('text-xs', color)}>{label}</Badge>;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalPending = (stats?.pendingReports || 0) + (stats?.pendingApplications || 0);

  // 分配承办人
  const handleAssignHandler = async (caseId: number, handler: string) => {
    try {
      const res = await fetch('/api/admin/cases/' + caseId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handler }),
      });
      if (res.ok) {
        fetchData();
        setShowModal(null);
      }
    } catch (error) {
      console.error('分配失败:', error);
    }
  };

  // 过滤咨询记录
  const filteredConsultations = consultations.filter(c =>
    !consultationSearch || c.user_question.toLowerCase().includes(consultationSearch.toLowerCase())
  );

  // 全局搜索
  const handleGlobalSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const q = query.toLowerCase();
    const results: { type: string; items: unknown[] }[] = [];
    
    // 搜索线索
    const reportResults = reports.filter(r => 
      r.name?.toLowerCase().includes(q) || 
      r.phone?.includes(q) || 
      r.company_name?.toLowerCase().includes(q)
    );
    if (reportResults.length > 0) results.push({ type: '线索填报', items: reportResults });
    
    // 搜索申请
    const appResults = applications.filter(a => 
      a.applicant_name?.toLowerCase().includes(q) || 
      a.applicant_phone?.includes(q)
    );
    if (appResults.length > 0) results.push({ type: '在线申请', items: appResults });
    
    // 搜索案件
    const caseResults = cases.filter(c => 
      c.case_number?.toLowerCase().includes(q) ||
      c.plaintiff_name?.toLowerCase().includes(q) ||
      c.defendant_name?.toLowerCase().includes(q)
    );
    if (caseResults.length > 0) results.push({ type: '案件', items: caseResults });
    
    setSearchResults(results);
    setShowSearchResults(true);
  }, [reports, applications, cases]);

  // 点击搜索结果跳转
  const handleSearchResultClick = (type: string) => {
    setShowSearchResults(false);
    setGlobalSearch('');
    if (type === '线索填报') setActiveTab('reports');
    else if (type === '在线申请') setActiveTab('applications');
    else if (type === '案件') setActiveTab('cases');
  };

  // 修改密码
  const handleChangePassword = async () => {
    setPasswordError('');
    
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('请填写所有字段');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密码长度不能少于6位');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('密码修改成功，请重新登录');
        setShowPasswordModal(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        handleLogout();
      } else {
        setPasswordError(data.error || '密码修改失败');
      }
    } catch {
      setPasswordError('网络错误');
    }
  };

  // ============ 加载状态 ============
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-background">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // ============ 登录页面 ============
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        {/* 左侧品牌区域 - 深蓝墨绿渐变 */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a3a5c] via-[#1e4d5c] to-[#1a5c4c] p-8 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">护薪平台</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">检察支持起诉智能平台</h1>
            <p className="text-white/80 text-lg mb-8">为农民工群体提供薪酬权益保障服务</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                <Users className="h-8 w-8 text-emerald-300 mb-2" />
                <p className="text-2xl font-bold text-white">2,458+</p>
                <p className="text-white/60 text-sm">帮助劳动者</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                <Database className="h-8 w-8 text-cyan-300 mb-2" />
                <p className="text-2xl font-bold text-white">1,200+</p>
                <p className="text-white/60 text-sm">成功案例</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                <DollarSign className="h-8 w-8 text-yellow-300 mb-2" />
                <p className="text-2xl font-bold text-white">¥860万+</p>
                <p className="text-white/60 text-sm">追回金额</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                <CheckCircle className="h-8 w-8 text-green-300 mb-2" />
                <p className="text-2xl font-bold text-white">98.6%</p>
                <p className="text-white/60 text-sm">成功维权率</p>
              </div>
            </div>
          </div>
          
          <p className="text-white/50 text-sm">© 2026 护薪平台 · 检察支持起诉智能平台</p>
        </div>
        
        {/* 右侧登录区域 */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-emerald-50/50 to-background">
          <Card className="w-full max-w-md shadow-xl border-border/50">
            <CardHeader className="text-center pb-2">
              <div className="lg:hidden mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a3a5c] to-[#1a5c4c]">
                <Scale className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">管理员登录</CardTitle>
              <CardDescription>请输入密码进入后台管理系统</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">管理员密码</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入管理员密码"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />{loginError}
                  </div>
                )}
                <Button type="submit" className="w-full bg-gradient-to-r from-[#1a3a5c] to-[#1a5c4c] hover:from-[#1a3a5c]/90 hover:to-[#1a5c4c]/90" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}登录系统
                </Button>
              </form>
              <div className="mt-6 pt-4 border-t border-border/50">
                <button onClick={() => router.push('/')} className="w-full text-center text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />返回首页
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============ 主界面 ============
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* 侧边栏 */}
      <aside className={cn('fixed left-0 top-0 z-40 h-screen bg-white border-r border-border/50 transition-all duration-300', sidebarOpen ? 'w-56' : 'w-16')}>
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">护薪平台</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-muted">
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {navGroups.map((group) => {
            const groupItems = navItems.filter(item => group.keys.includes(item.key));
            const isExpanded = expandedGroups.includes(group.name);
            const pendingCount = group.keys.reduce((sum, k) => {
              if (k === 'reports') return sum + (stats?.pendingReports || 0);
              if (k === 'applications') return sum + (stats?.pendingApplications || 0);
              return sum;
            }, 0);
            
            return (
              <div key={group.name}>
                {sidebarOpen && (
                  <button
                    onClick={() => setExpandedGroups(prev => 
                      prev.includes(group.name) ? prev.filter(g => g !== group.name) : [...prev, group.name]
                    )}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{group.name}</span>
                    <div className="flex items-center gap-1">
                      {pendingCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">{pendingCount}</span>
                      )}
                      <ChevronLeft className={cn('h-3 w-3 transition-transform', isExpanded ? '' : '-rotate-90')} />
                    </div>
                  </button>
                )}
                {(isExpanded || !sidebarOpen) && groupItems.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setActiveTab(item.key); setPage(1); setStatusFilter(''); setSearchQuery(''); setSelectedIds([]); }}
                      className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground')}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                      {sidebarOpen && item.key === 'reports' && stats?.pendingReports ? (
                        <span className={cn('ml-auto text-xs px-1.5 py-0.5 rounded', isActive ? 'bg-primary-foreground/20' : 'bg-yellow-100 text-yellow-700')}>{stats.pendingReports}</span>
                      ) : null}
                      {sidebarOpen && item.key === 'applications' && stats?.pendingApplications ? (
                        <span className={cn('ml-auto text-xs px-1.5 py-0.5 rounded', isActive ? 'bg-primary-foreground/20' : 'bg-yellow-100 text-yellow-700')}>{stats.pendingApplications}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">管理员</p>
                <p className="text-xs text-muted-foreground">在线</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* 主内容区 */}
      <main className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'ml-56' : 'ml-16')}>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-white/95 backdrop-blur px-6">
          <h1 className="text-lg font-semibold">{navItems.find(n => n.key === activeTab)?.label || '后台管理'}</h1>
          <div className="flex items-center gap-3">
            {/* 全局搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="全局搜索..."
                value={globalSearch}
                onChange={(e) => { setGlobalSearch(e.target.value); handleGlobalSearch(e.target.value); }}
                className="w-48 rounded-lg border border-input bg-background pl-10 pr-4 py-1.5 text-sm focus:w-64 transition-all"
              />
              {showSearchResults && searchResults.length > 0 && (
                <Card className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto shadow-lg z-50">
                  <CardContent className="p-2">
                    {searchResults.map((group) => (
                      <div key={group.type}>
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1">{group.type} ({group.items.length})</p>
                        <button
                          onClick={() => handleSearchResultClick(group.type)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-sm"
                        >
                          点击查看全部结果
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {showSearchResults && globalSearch && searchResults.length === 0 && (
                <Card className="absolute top-full right-0 mt-2 w-80 shadow-lg z-50">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    未找到相关结果
                  </CardContent>
                </Card>
              )}
            </div>
            {totalPending > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                <Bell className="h-3 w-3 mr-1" />{totalPending} 条待处理
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push('/')} className="gap-1.5"><Home className="h-4 w-4" />首页</Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-1.5">
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />刷新
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* ============ 数据概览 ============ */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* 时间筛选和快捷操作 */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">统计周期：</span>
                  <div className="flex rounded-lg border border-input overflow-hidden">
                    {[
                      { key: '7d', label: '近7天' },
                      { key: '30d', label: '近30天' },
                      { key: '90d', label: '近90天' },
                      { key: 'all', label: '全部' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setDateRange(item.key as typeof dateRange)}
                        className={cn('px-3 py-1.5 text-sm transition-colors',
                          dateRange === item.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                    <Printer className="h-4 w-4" />打印报表
                  </Button>
                </div>
              </div>

              {totalPending > 0 && (
                <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-yellow-800">您有 {totalPending} 条待处理事项</p>
                        <p className="text-sm text-yellow-600">线索 {stats.pendingReports} 条 · 申请 {stats.pendingApplications} 条</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('reports')} className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                        处理线索 <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('applications')} className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                        处理申请 <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="线索填报" value={stats.reports} pending={stats.pendingReports} icon={FileText} color="blue" />
                <StatCard title="在线申请" value={stats.applications} pending={stats.pendingApplications} icon={Send} color="green" />
                <StatCard title="文书生成" value={stats.documents} icon={PenTool} color="purple" />
                <StatCard title="咨询记录" value={stats.consultations} icon={MessageSquare} color="orange" />
              </div>

              {/* 线索来源分布 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />线索来源分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: '自主填报', count: reports.filter(r => !r.source || r.source === '自主填报').length, color: 'bg-emerald-500', icon: '📝' },
                      { label: '12345热线', count: reports.filter(r => r.source === '12345热线').length, color: 'bg-blue-500', icon: '📞' },
                      { label: '街道综治', count: reports.filter(r => r.source === '街道综治').length, color: 'bg-purple-500', icon: '🏢' },
                      { label: '检察业务', count: reports.filter(r => r.source === '检察业务').length, color: 'bg-orange-500', icon: '⚖️' },
                    ].map((source) => (
                      <div key={source.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <span className="text-2xl">{source.icon}</span>
                        <div>
                          <p className="text-sm text-muted-foreground">{source.label}</p>
                          <p className="text-xl font-bold">{source.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />月度案件趋势
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-end justify-between gap-2">
                      {(stats.monthlyTrend || [
                        { month: '1月', count: 0 },
                        { month: '2月', count: 0 },
                        { month: '3月', count: 0 },
                        { month: '4月', count: 0 },
                        { month: '5月', count: 0 },
                        { month: '6月', count: 0 },
                      ]).map((item, i) => {
                        const allCounts = (stats.monthlyTrend || []).map(m => m.count);
                        const maxCount = allCounts.length > 0 ? Math.max(...allCounts, 1) : 1;
                        const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                        const minHeight = item.count > 0 ? 8 : 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            {item.count > 0 && (
                              <span className="text-xs font-bold text-foreground">{item.count}</span>
                            )}
                            <div className="w-full rounded-t relative" style={{ height: `${Math.max(height, minHeight)}%`, minHeight: item.count > 0 ? '8px' : '2px' }}>
                              <div 
                                className="absolute inset-0 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all hover:from-emerald-500 hover:to-emerald-300 shadow-sm" 
                                style={{ height: '100%' }} 
                              />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-primary" />案件类型分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CaseTypeDistribution distribution={stats.caseTypeDistribution || {}} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />核心指标
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs">涉案金额总计</span>
                        </div>
                        <p className="text-xl font-bold text-blue-700">¥{(stats.totalAmount || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">帮助劳动者</span>
                        </div>
                        <p className="text-xl font-bold text-green-700">{(stats.helpedWorkers || 0).toLocaleString()}+</p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs">平均处理天数</span>
                        </div>
                        <p className="text-xl font-bold text-orange-700">{stats.avgProcessingDays || 7} 天</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">成功维权率</span>
                        </div>
                        <p className="text-xl font-bold text-purple-700">{stats.successRate || 98.6}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">最近案件</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('cases')} className="text-primary text-xs">
                        查看全部 <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cases.slice(0, 4).map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 p-2.5 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                              <Database className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{c.plaintiff_name} vs {c.defendant_name}</p>
                              <p className="text-xs text-muted-foreground">{c.case_number}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary">¥{Number(c.amount).toLocaleString()}</span>
                            {getStatusBadge(c.status)}
                          </div>
                        </div>
                      ))}
                      {cases.length === 0 && <div className="text-center py-8 text-muted-foreground">暂无案件数据</div>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ============ 线索填报 ============ */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {selectedIds.length > 0 && (
                <Card className="bg-primary/5 border-primary/30">
                  <CardContent className="flex items-center justify-between p-3">
                    <span className="text-sm">已选择 {selectedIds.length} 项</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleBatchStatus('report', 'processing')}>批量处理</Button>
                      <Button size="sm" variant="outline" onClick={() => handleBatchStatus('report', 'completed')}>批量完成</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBatchDelete('reports')}>批量删除</Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>取消</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <DataTable
                columns={['', '申请人', '电话', '公司', '欠薪金额', '来源', '状态', '提交时间', '操作']}
                data={reports}
                isLoading={isLoading}
                selectedIds={selectedIds}
                onSelectAll={(ids) => handleSelectAll(ids)}
                renderRow={(r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={() => handleSelectItem(r.id)} className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">{r.name.charAt(0)}</div>
                        <span className="font-medium text-sm">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.phone}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[150px] truncate">{r.company_name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-primary">{r.owed_amount ? `¥${r.owed_amount}` : '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-xs',
                        r.source === '12345热线' ? 'border-blue-300 text-blue-600' :
                        r.source === '街道综治' ? 'border-purple-300 text-purple-600' :
                        r.source === '检察业务' ? 'border-orange-300 text-orange-600' :
                        'border-emerald-300 text-emerald-600'
                      )}>
                        {r.source || '自主填报'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDetail(r)}><Eye className="h-4 w-4" /></Button>
                        {r.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus('report', r.id, 'processing')}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                filterOptions={
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">全部状态</option>
                      <option value="pending">待处理</option>
                      <option value="processing">处理中</option>
                      <option value="completed">已完成</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={() => handleExportData('线索填报', reports)} className="gap-1.5"><Download className="h-4 w-4" />导出JSON</Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportCSV('线索填报', reports as unknown as Record<string, unknown>[], ['name', 'phone', 'company_name', 'owed_amount', 'status', 'created_at'])} className="gap-1.5"><File className="h-4 w-4" />导出CSV</Button>
                    <Button variant="outline" size="sm" onClick={() => setNotificationForm({ type: 'sms', recipients: reports.filter(r => r.status === 'pending').map(r => r.phone), message: '' })} className="gap-1.5"><Phone className="h-4 w-4" />发送短信</Button>
                  </div>
                }
                totalCount={reportsTotal}
                currentPage={page}
                onPageChange={(p) => setPage(p)}
                pageSize={20}
              />
            </div>
          )}

          {/* ============ 在线申请 ============ */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {selectedIds.length > 0 && (
                <Card className="bg-primary/5 border-primary/30">
                  <CardContent className="flex items-center justify-between p-3">
                    <span className="text-sm">已选择 {selectedIds.length} 项</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleBatchStatus('application', 'processing')}>批量处理</Button>
                      <Button size="sm" variant="outline" onClick={() => handleBatchStatus('application', 'completed')}>批量完成</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBatchDelete('applications')}>批量删除</Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>取消</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <DataTable
                columns={['', '申请人', '电话', '类型', '欠薪金额', '状态', '提交时间', '操作']}
                data={applications}
                isLoading={isLoading}
                selectedIds={selectedIds}
                onSelectAll={(ids) => handleSelectAll(ids)}
                renderRow={(a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Checkbox checked={selectedIds.includes(a.id)} onCheckedChange={() => handleSelectItem(a.id)} className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-600">{a.applicant_name.charAt(0)}</div>
                        <span className="font-medium text-sm">{a.applicant_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{a.applicant_phone}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={a.application_type === 'support_prosecution' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-blue-50 text-blue-700 border-blue-300'}>
                        {a.application_type === 'support_prosecution' ? '支持起诉' : '法律援助'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-primary">{a.owed_amount ? `¥${a.owed_amount}` : '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(a.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(a); setShowModal('detail'); }}><Eye className="h-4 w-4" /></Button>
                        {a.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus('application', a.id, 'processing')}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                filterOptions={
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">全部状态</option>
                      <option value="pending">待处理</option>
                      <option value="processing">处理中</option>
                      <option value="completed">已完成</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={() => handleExportData('在线申请', applications)} className="gap-1.5"><Download className="h-4 w-4" />导出JSON</Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportCSV('在线申请', applications as unknown as Record<string, unknown>[], ['applicant_name', 'applicant_phone', 'application_type', 'owed_amount', 'status', 'created_at'])} className="gap-1.5"><File className="h-4 w-4" />导出CSV</Button>
                  </div>
                }
                totalCount={applicationsTotal}
                currentPage={page}
                onPageChange={(p) => setPage(p)}
                pageSize={20}
              />
            </div>
          )}

          {/* ============ 案件管理 ============ */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              {selectedIds.length > 0 && (
                <Card className="bg-primary/5 border-primary/30">
                  <CardContent className="flex items-center justify-between p-3">
                    <span className="text-sm">已选择 {selectedIds.length} 项</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleBatchStatus('case', 'processing')}>批量处理</Button>
                      <Button size="sm" variant="outline" onClick={() => handleBatchStatus('case', 'completed')}>批量完成</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBatchDelete('cases')}>批量删除</Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>取消</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="搜索案件..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="processing">处理中</option>
                  <option value="completed">已完成</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => handleExportData('案件数据', cases)} className="gap-1.5"><Download className="h-4 w-4" />导出</Button>
                <Button variant="outline" size="sm" onClick={() => handleExportCSV('案件数据', cases as unknown as Record<string, unknown>[], ['case_number', 'plaintiff_name', 'plaintiff_phone', 'defendant_name', 'case_type', 'amount', 'status', 'handler'])} className="gap-1.5"><File className="h-4 w-4" />CSV</Button>
                <Button size="sm" onClick={() => setShowModal('newCase')} className="gap-1.5"><PlusCircle className="h-4 w-4" />新建案件</Button>
              </div>
              <DataTable
                columns={['', '案件编号', '原告', '被告', '类型', '金额', '状态', '承办人', '操作']}
                data={cases}
                isLoading={isLoading}
                selectedIds={selectedIds}
                onSelectAll={(ids) => handleSelectAll(ids)}
                renderRow={(c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => handleSelectItem(c.id)} className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{c.case_number}</td>
                    <td className="px-4 py-3">
                      <div><p className="font-medium text-sm">{c.plaintiff_name}</p><p className="text-xs text-muted-foreground">{c.plaintiff_phone}</p></div>
                    </td>
                    <td className="px-4 py-3 text-sm">{c.defendant_name}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{c.case_type}</Badge></td>
                    <td className="px-4 py-3 text-sm font-medium text-primary">¥{Number(c.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-sm">
                      {c.handler ? (
                        <Badge variant="secondary" className="text-xs">{c.handler}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">未分配</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(c); setShowModal('detail'); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus('case', c.id, c.status === 'pending' ? 'processing' : 'completed')}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            </div>
          )}

          {/* ============ 文书管理 ============ */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">文书管理</h3>
                  <p className="text-sm text-muted-foreground">管理文书模板和已生成文书</p>
                </div>
                <Button size="sm" onClick={() => setShowModal('newTemplate')} className="gap-1.5">
                  <PlusCircle className="h-4 w-4" />新建模板
                </Button>
              </div>
              
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">文书模板</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/50 group">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600"><LayoutTemplate className="h-4 w-4" /></div>
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.variables?.length || 0} 个变量 · {t.type || '通用'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-xs">{t.is_active ? '启用' : '禁用'}</Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => { setSelectedItem(t); setShowModal('editTemplate'); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">已生成文书</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleExportData('已生成文书', documents)} className="gap-1.5">
                      <Download className="h-4 w-4" />导出
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead><tr className="border-b bg-muted/30">
                      <th className="px-4 py-2 text-left text-sm font-medium">文书类型</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">申请人</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">生成时间</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">操作</th>
                    </tr></thead>
                    <tbody>
                      {documents.map((d) => (
                        <tr key={d.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">{d.document_type}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{d.applicant_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(d.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" title="预览" onClick={() => { setSelectedItem(d); setShowModal('detail'); }}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" title="下载" onClick={() => handleDownloadDoc(d)}><Download className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {documentsTotal > 10 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                      <p className="text-sm text-muted-foreground">显示 {documents.length} 条，共 {documentsTotal} 条</p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>上一页</Button>
                        <span className="px-3 py-1.5 text-sm">第 {page} 页</span>
                        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={documents.length < 10}>下一页</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ============ 咨询记录 ============ */}
          {activeTab === 'consultations' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="text-sm text-muted-foreground">共 {consultationsTotal || filteredConsultations.length} 条咨询记录</div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input type="text" placeholder="搜索问题..." value={consultationSearch} onChange={(e) => setConsultationSearch(e.target.value)} className="w-64 rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportData('咨询记录', filteredConsultations)} className="gap-1.5"><Download className="h-4 w-4" />导出JSON</Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportCSV('咨询记录', filteredConsultations as unknown as Record<string, unknown>[], ['user_question', 'ai_response', 'created_at'])} className="gap-1.5"><File className="h-4 w-4" />导出CSV</Button>
                </div>
              </div>
              {filteredConsultations.length === 0 && !isLoading ? (
                <Card><CardContent className="p-8 text-center"><MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">暂无咨询记录</p></CardContent></Card>
              ) : (
                <>
                <div className="grid gap-3">
                  {filteredConsultations.map((c) => (
                    <Card key={c.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0"><MessageSquare className="h-5 w-5" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">用户提问</Badge>
                              <span className="text-sm text-muted-foreground">{formatDate(c.created_at)}</span>
                            </div>
                            <p className="text-sm font-medium mb-3 bg-blue-50 rounded-lg p-3">{c.user_question}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600">AI回复</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-4 bg-gray-50 rounded-lg p-3">{c.ai_response || '暂无回复'}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(c); setShowModal('detail'); }}><Eye className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Pagination total={consultationsTotal} page={page} dataLength={filteredConsultations.length} onPageChange={setPage} />
                </>
              )}
            </div>
          )}

          {/* ============ 知识库管理 ============ */}
          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">智能咨询的数据源，AI会根据知识库内容回答问题</p>
                <Button size="sm" onClick={() => { setEditingItem({ id: 0, title: '', content: '', category: '劳动法', source: '', tags: [], is_active: true, created_at: '', updated_at: '' } as unknown as Record<string, unknown>); setShowModal('knowledgeForm'); }} className="gap-1.5"><PlusCircle className="h-4 w-4" />添加知识</Button>
              </div>
              <div className="grid gap-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : knowledge.length === 0 ? (
                  <Card><CardContent className="p-8 text-center"><BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">暂无知识数据</p></CardContent></Card>
                ) : (
                  knowledge.map((k) => (
                    <Card key={k.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shrink-0"><BookOpen className="h-5 w-5" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{k.title}</h4>
                              <Badge variant={k.is_active ? 'default' : 'secondary'} className="text-xs">{k.is_active ? '启用' : '禁用'}</Badge>
                              <Badge variant="outline" className="text-xs">{k.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{k.content}</p>
                            {k.tags && k.tags.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {k.tags.map((tag, i) => <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>)}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingItem(k as unknown as Record<string, unknown>); setShowModal('knowledgeForm'); }}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete('knowledge', k.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============ 公告管理 ============ */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => { setEditingItem({ id: 0, title: '', content: '', category: '通知', is_published: true, created_at: '', updated_at: '' }); setShowModal('form'); }} className="gap-1.5"><PlusCircle className="h-4 w-4" />新建公告</Button>
              </div>
              <DataTable
                columns={['封面', '标题', '分类', '状态', '时间', '操作']}
                data={announcements}
                isLoading={isLoading}
                renderRow={(a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      {a.image_url ? (
                        <img src={a.image_url} alt="" className="w-12 h-8 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-8 bg-muted rounded flex items-center justify-center"><Bell className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{a.title}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{a.category}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={a.is_published ? 'default' : 'secondary'} className="text-xs">{a.is_published ? '已发布' : '草稿'}</Badge></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(a as unknown as Record<string, unknown>); setShowModal('form'); }}>编辑</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete('announcement', a.id)}>删除</Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            </div>
          )}

          {/* ============ 文件管理 ============ */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-1.5">
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" />上传中 {uploadProgress}%</> : <><Upload className="h-4 w-4" />上传文件</>}
                </Button>
              </div>
              {isUploading && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div className="flex-1 h-2 bg-primary/20 rounded-full">
                        <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {files.map((f) => (
                  <Card key={f.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><File className="h-5 w-5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">{f.case_id ? `案件 #${f.case_id}` : '未关联'}</Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Download className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDelete('files', f.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {files.length === 0 && (
                <Card><CardContent className="py-12 text-center"><FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">暂无文件</p></CardContent></Card>
              )}
            </div>
          )}

          {/* ============ 系统设置 ============ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">基础设置</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {settings.map((s) => (
                    <div key={s.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <div><p className="font-medium text-sm">{s.description}</p><p className="text-xs text-muted-foreground">{s.key}</p></div>
                      {['auto_assign', 'sms_notification', 'email_notification'].includes(s.key) ? (
                        <button onClick={() => setSettings((prev) => prev.map((x) => x.key === s.key ? { ...x, value: x.value === 'true' ? 'false' : 'true' } : x))} className={cn('relative h-6 w-11 rounded-full transition-colors', s.value === 'true' ? 'bg-primary' : 'bg-muted')}>
                          <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', s.value === 'true' && 'translate-x-5')} />
                        </button>
                      ) : (
                        <input type="text" value={s.value} onChange={(e) => setSettings((prev) => prev.map((x) => x.key === s.key ? { ...x, value: e.target.value } : x))} className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-48" />
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSettings} className="gap-1.5"><CheckCircle className="h-4 w-4" />保存设置</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">快捷操作</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => { setActiveTab('reports'); }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><FileText className="h-4 w-4" /></div>
                      <div className="text-left">
                        <p className="font-medium text-sm">处理线索</p>
                        <p className="text-xs text-muted-foreground">{stats?.pendingReports || 0} 条待处理</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => { setActiveTab('applications'); }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600"><Send className="h-4 w-4" /></div>
                      <div className="text-left">
                        <p className="font-medium text-sm">处理申请</p>
                        <p className="text-xs text-muted-foreground">{stats?.pendingApplications || 0} 条待处理</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => { setShowModal('newCase'); }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600"><PlusCircle className="h-4 w-4" /></div>
                      <div className="text-left">
                        <p className="font-medium text-sm">新建案件</p>
                        <p className="text-xs text-muted-foreground">录入案件信息</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => { setActiveTab('announcements'); }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600"><Bell className="h-4 w-4" /></div>
                      <div className="text-left">
                        <p className="font-medium text-sm">发布公告</p>
                        <p className="text-xs text-muted-foreground">通知公告管理</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 待处理事项快捷处理 */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />待处理事项
                    </CardTitle>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">{totalPending} 项</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reports.filter(r => r.status === 'pending').slice(0, 2).map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50/50 p-2.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-yellow-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{r.name} - 线索填报</p>
                            <p className="text-xs text-muted-foreground truncate">{r.company_name || '无公司信息'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus('report', r.id, 'processing')} className="text-xs text-yellow-700">处理</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus('report', r.id, 'completed')} className="text-xs text-green-700">完成</Button>
                        </div>
                      </div>
                    ))}
                    {applications.filter(a => a.status === 'pending').slice(0, 2).map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50/50 p-2.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Send className="h-4 w-4 text-yellow-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{a.applicant_name} - 在线申请</p>
                            <p className="text-xs text-muted-foreground">{a.application_type === 'support' ? '支持起诉申请' : '法律援助申请'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus('application', a.id, 'processing')} className="text-xs text-yellow-700">处理</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus('application', a.id, 'completed')} className="text-xs text-green-700">完成</Button>
                        </div>
                      </div>
                    ))}
                    {totalPending === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">暂无待处理事项</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">最近操作记录</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {operationLogs.length > 0 ? operationLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2 w-2 rounded-full', 
                            log.type === 'login' ? 'bg-green-500' :
                            log.type === 'update' ? 'bg-blue-500' :
                            log.type === 'create' ? 'bg-purple-500' :
                            log.type === 'export' ? 'bg-orange-500' : 'bg-gray-500'
                          )} />
                          <span className="text-sm">{log.action}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                      </div>
                    )) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">暂无操作记录</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 安全设置 */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />安全设置</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-sm">管理员密码</p>
                      <p className="text-xs text-muted-foreground">定期修改密码可以提高账户安全性</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)} className="gap-1.5">
                      <Edit className="h-4 w-4" />修改密码
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 数据管理 */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" />数据管理</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-2xl font-bold text-blue-700">{stats?.reports || 0}</p>
                      <p className="text-xs text-blue-600">线索填报</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                      <p className="text-2xl font-bold text-green-700">{stats?.applications || 0}</p>
                      <p className="text-xs text-green-600">在线申请</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <p className="text-2xl font-bold text-purple-700">{cases.length}</p>
                      <p className="text-xs text-purple-600">案件总数</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-100">
                      <p className="text-2xl font-bold text-orange-700">{stats?.documents || 0}</p>
                      <p className="text-xs text-orange-600">生成文书</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => { const data = { reports, applications, cases, documents, consultations }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `全部数据_${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); }} className="gap-1.5">
                      <Download className="h-4 w-4" />导出全部数据(JSON)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportCSV('线索数据', reports as unknown as Record<string, unknown>[], ['id', 'name', 'phone', 'company_name', 'owed_amount', 'status', 'created_at'])} className="gap-1.5">
                      <File className="h-4 w-4" />导出线索(CSV)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportCSV('案件数据', cases as unknown as Record<string, unknown>[], ['case_number', 'plaintiff_name', 'defendant_name', 'case_type', 'amount', 'status', 'handler'])} className="gap-1.5">
                      <File className="h-4 w-4" />导出案件(CSV)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* ============ 弹窗 ============ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(null)}>
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{showModal === 'form' ? (editingItem?.id ? '编辑公告' : '新建公告') : showModal === 'newCase' ? '新建案件' : '详情'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(null)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {showModal === 'detail' && selectedItem && (
                <div className="space-y-4">
                  {/* 案件概览区域 */}
                  {'case_number' in selectedItem && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{selectedItem.case_number || '案件详情'}</h3>
                          {'case_type' in selectedItem && (
                            <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">{selectedItem.case_type}</Badge>
                          )}
                        </div>
                        {'status' in selectedItem && <div className="text-right">{getStatusBadge(selectedItem.status as string)}</div>}
                      </div>
                      {'amount' in selectedItem && selectedItem.amount && (
                        <div className="text-2xl font-bold text-blue-600">¥{Number(selectedItem.amount).toLocaleString()}</div>
                      )}
                    </div>
                  )}

                  {/* 基本信息卡片 */}
                  <div className="grid grid-cols-2 gap-3">
                    {'plaintiff_name' in selectedItem && selectedItem.plaintiff_name && (
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">原告</div>
                        <div className="text-sm font-medium">{selectedItem.plaintiff_name}</div>
                        {'plaintiff_phone' in selectedItem && selectedItem.plaintiff_phone && (
                          <div className="text-xs text-muted-foreground mt-1">{selectedItem.plaintiff_phone}</div>
                        )}
                      </div>
                    )}
                    {'defendant_name' in selectedItem && selectedItem.defendant_name && (
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">被告</div>
                        <div className="text-sm font-medium">{selectedItem.defendant_name}</div>
                      </div>
                    )}
                  </div>

                  {/* 线索/申请信息 */}
                  {'name' in selectedItem && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">姓名</div>
                          <div className="text-sm font-medium">{selectedItem.name}</div>
                        </div>
                        {'phone' in selectedItem && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">联系电话</div>
                            <div className="text-sm font-medium">{selectedItem.phone}</div>
                          </div>
                        )}
                        {'company_name' in selectedItem && (
                          <div className="col-span-2">
                            <div className="text-xs text-muted-foreground mb-1">涉及公司</div>
                            <div className="text-sm">{selectedItem.company_name || '-'}</div>
                          </div>
                        )}
                        {'owed_amount' in selectedItem && selectedItem.owed_amount && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">欠薪金额</div>
                            <div className="text-sm font-semibold text-red-600">¥{Number(selectedItem.owed_amount).toLocaleString()}</div>
                          </div>
                        )}
                        {'worker_count' in selectedItem && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">涉及人数</div>
                            <div className="text-sm">{selectedItem.worker_count || 1} 人</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 描述/简述 */}
                  {('description' in selectedItem || 'case_brief' in selectedItem) && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-2">{'case_brief' in selectedItem ? '案件简述' : '详细描述'}</div>
                      <div className="text-sm whitespace-pre-wrap">{String((selectedItem as unknown as Record<string, unknown>).case_brief || (selectedItem as unknown as Record<string, unknown>).description || '-')}</div>
                    </div>
                  )}

                  {/* 证据信息 */}
                  {'evidence' in selectedItem && selectedItem.evidence && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-muted-foreground">证据材料</span>
                      </div>
                      <div className="text-sm">{selectedItem.evidence}</div>
                    </div>
                  )}

                  {/* 关联文件（案件类型显示） */}
                  {'case_number' in selectedItem && (
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">关联文件</span>
                        {isLoadingFiles && <Loader2 className="h-3 w-3 animate-spin" />}
                      </div>
                      {caseFiles.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {caseFiles.map((file) => (
                            <div key={file.id} className="bg-muted/30 rounded-lg p-2 flex items-center gap-2">
                              {file.type?.startsWith('image/') ? (
                                <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <File className="h-6 w-6 text-blue-600" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium truncate">{file.name}</div>
                                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                              </div>
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-muted rounded">
                                <Download className="h-4 w-4 text-muted-foreground" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
                          暂无关联文件
                        </div>
                      )}
                    </div>
                  )}

                  {/* 咨询记录 */}
                  {'user_question' in selectedItem && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <div className="text-xs text-muted-foreground mb-2">用户问题</div>
                      <div className="text-sm mb-3">{selectedItem.user_question}</div>
                      <div className="text-xs text-muted-foreground mb-2">AI回复</div>
                      <div className="text-sm text-muted-foreground">{selectedItem.ai_response || '暂无回复'}</div>
                    </div>
                  )}

                  {/* 时间线 */}
                  {'created_at' in selectedItem && (
                    <div className="border-t pt-3">
                      <div className="text-xs text-muted-foreground mb-2">时间线</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">创建时间：</span>
                          <span>{new Date(selectedItem.created_at as string).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>
                        </div>
                        {'updated_at' in selectedItem && String((selectedItem as unknown as Record<string, unknown>).updated_at || '') && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-muted-foreground">更新时间：</span>
                            <span>{new Date((selectedItem as unknown as Record<string, unknown>).updated_at as string).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>
                          </div>
                        )}
                        {'filing_date' in selectedItem && String((selectedItem as unknown as Record<string, unknown>).filing_date || '') && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="text-muted-foreground">立案时间：</span>
                            <span>{String((selectedItem as unknown as Record<string, unknown>).filing_date)}</span>
                          </div>
                        )}
                        {'close_date' in selectedItem && String((selectedItem as unknown as Record<string, unknown>).close_date || '') && (
                          <div className="flex items-center gap-2 text-sm">
                            <Archive className="h-4 w-4 text-gray-500" />
                            <span className="text-muted-foreground">结案时间：</span>
                            <span>{String((selectedItem as unknown as Record<string, unknown>).close_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 承办人 */}
                  {'handler' in selectedItem && (
                    <div className="border-t pt-3">
                      <span className="text-xs text-muted-foreground">承办人</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {handlers.map((h) => (
                          <button
                            key={h}
                            onClick={() => handleAssignHandler(selectedItem.id as number, h)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm transition-colors',
                              selectedItem.handler === h
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            )}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 备注 */}
                  {'notes' in selectedItem && selectedItem.notes && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">备注</div>
                      <div className="text-sm">{selectedItem.notes}</div>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  {'status' in selectedItem && (selectedItem.status === 'pending' || selectedItem.status === 'processing') && (
                    <div className="flex gap-2 pt-4 border-t">
                      {selectedItem.status === 'pending' && <Button size="sm" onClick={() => { handleUpdateStatus('case' in selectedItem ? 'case' : 'report', selectedItem.id, 'processing'); setShowModal(null); }}>开始处理</Button>}
                      <Button size="sm" variant="outline" onClick={() => { handleUpdateStatus('case' in selectedItem ? 'case' : 'report', selectedItem.id, 'completed'); setShowModal(null); }}>标记完成</Button>
                    </div>
                  )}
                </div>
              )}
              {showModal === 'form' && editingItem && (
                <div className="space-y-4">
                  <div><label className="text-sm font-medium">标题</label><input type="text" value={String(editingItem.title || '')} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                  <div><label className="text-sm font-medium">分类</label><select value={String(editingItem.category || '')} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="通知">通知</option><option value="指南">指南</option><option value="案例">案例</option></select></div>
                  <div>
                    <label className="text-sm font-medium">封面图片</label>
                    <input ref={announcementImageRef} type="file" accept="image/*" className="hidden" onChange={handleAnnouncementImageUpload} />
                    <div className="mt-1 flex flex-col gap-2">
                      {String(editingItem.image_url || '') && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                          <img src={String(editingItem.image_url || '')} alt="封面" className="w-full h-full object-cover" />
                          <Button variant="destructive" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => setEditingItem({ ...editingItem, image_url: undefined })}><X className="h-3 w-3" /></Button>
                        </div>
                      )}
                      <Button variant="outline" size="sm" onClick={() => announcementImageRef.current?.click()} disabled={isUploadingImage} className="gap-1.5">
                        {isUploadingImage ? <><Loader2 className="h-4 w-4 animate-spin" />上传中...</> : <><Upload className="h-4 w-4" />{String(editingItem.image_url || '') ? '更换图片' : '上传封面图片'}</>}
                      </Button>
                    </div>
                  </div>
                  <div><label className="text-sm font-medium">内容</label><textarea value={String(editingItem.content || '')} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[150px]" /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="is_published" checked={Boolean(editingItem.is_published)} onChange={(e) => setEditingItem({ ...editingItem, is_published: e.target.checked })} /><label htmlFor="is_published" className="text-sm">立即发布</label></div>
                  <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setShowModal(null)}>取消</Button><Button onClick={handleSaveAnnouncement}>保存</Button></div>
                </div>
              )}
              {showModal === 'knowledgeForm' && editingItem && (
                <div className="space-y-4">
                  <div><label className="text-sm font-medium">标题 *</label><input type="text" value={String(editingItem.title || '')} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="知识标题" /></div>
                  <div><label className="text-sm font-medium">分类</label><select value={String(editingItem.category || '')} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="劳动法">劳动法</option><option value="案例">案例</option><option value="流程">流程</option><option value="通用">通用</option></select></div>
                  <div><label className="text-sm font-medium">来源</label><input type="text" value={String((editingItem as unknown as Record<string, unknown>).source || '')} onChange={(e) => setEditingItem({ ...editingItem, source: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="来源（可选）" /></div>
                  <div><label className="text-sm font-medium">内容 *</label><textarea value={String(editingItem.content || '')} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[200px]" placeholder="知识内容，AI会基于此内容回答问题" /></div>
                  <div><label className="text-sm font-medium">标签（用逗号分隔）</label><input type="text" defaultValue={Array.isArray((editingItem as unknown as Record<string, unknown>).tags) ? ((editingItem as unknown as Record<string, unknown>).tags as string[]).join(', ') : ''} onChange={(e) => { const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean); setEditingItem({ ...editingItem, tags }); }} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="如：工资, 加班, 劳动合同" /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="is_active" checked={Boolean((editingItem as unknown as Record<string, unknown>).is_active ?? true)} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} /><label htmlFor="is_active" className="text-sm">启用此知识（启用后AI回答会参考此内容）</label></div>
                  <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setShowModal(null)}>取消</Button><Button onClick={handleSaveKnowledge}>保存</Button></div>
                </div>
              )}
              {showModal === 'newCase' && (
                <div className="space-y-4">
                  <div><label className="text-sm font-medium">原告姓名 *</label><input type="text" value={newCase.plaintiff_name} onChange={(e) => setNewCase({ ...newCase, plaintiff_name: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="请输入原告姓名" /></div>
                  <div><label className="text-sm font-medium">原告电话</label><input type="text" value={newCase.plaintiff_phone} onChange={(e) => setNewCase({ ...newCase, plaintiff_phone: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="请输入联系电话" /></div>
                  <div><label className="text-sm font-medium">被告名称 *</label><input type="text" value={newCase.defendant_name} onChange={(e) => setNewCase({ ...newCase, defendant_name: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="请输入被告/欠薪单位名称" /></div>
                  <div><label className="text-sm font-medium">案件类型</label>
                    <select value={newCase.case_type} onChange={(e) => setNewCase({ ...newCase, case_type: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="基础拖欠劳动报酬类">基础拖欠劳动报酬类</option>
                      <option value="未签劳动合同欠薪类">未签劳动合同欠薪类</option>
                      <option value="建设工程领域欠薪类">建设工程领域欠薪类</option>
                      <option value="劳务派遣/外包欠薪类">劳务派遣/外包欠薪类</option>
                      <option value="工伤/职业病伴欠薪类">工伤/职业病伴欠薪类</option>
                      <option value="群体性欠薪维权类">群体性欠薪维权类</option>
                      <option value="拒不支付劳动报酬类">拒不支付劳动报酬类</option>
                      <option value="检察支持起诉胜诉类">检察支持起诉胜诉类</option>
                    </select>
                  </div>
                  <div><label className="text-sm font-medium">涉案金额 (元) *</label><input type="number" value={newCase.amount} onChange={(e) => setNewCase({ ...newCase, amount: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="请输入金额" /></div>
                  <div><label className="text-sm font-medium">备注</label><textarea value={newCase.notes} onChange={(e) => setNewCase({ ...newCase, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]" placeholder="案件备注信息" /></div>
                  <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setShowModal(null)}>取消</Button><Button onClick={handleCreateCase}>创建案件</Button></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ 通知弹窗 ============ */}
      {notificationForm.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setNotificationForm({ type: null, recipients: [], message: '' })}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {notificationForm.type === 'sms' ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}发送{notificationForm.type === 'sms' ? '短信' : '邮件'}通知
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setNotificationForm({ type: null, recipients: [], message: '' })}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><label className="text-sm font-medium">接收人数</label><p className="text-sm text-muted-foreground">{notificationForm.recipients.length} 人</p></div>
              <div><label className="text-sm font-medium">通知内容</label><textarea value={notificationForm.message} onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))} placeholder="请输入通知内容..." className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px]" /></div>
              <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setNotificationForm({ type: null, recipients: [], message: '' })}>取消</Button><Button onClick={handleSendNotification}>发送</Button></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ 密码修改弹窗 ============ */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPasswordModal(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />修改密码</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPasswordModal(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">原密码</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="请输入原密码"
                />
              </div>
              <div>
                <label className="text-sm font-medium">新密码</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="请输入新密码（至少6位）"
                />
              </div>
              <div>
                <label className="text-sm font-medium">确认新密码</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="请再次输入新密码"
                />
              </div>
              {passwordError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />{passwordError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setShowPasswordModal(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); setPasswordError(''); }}>取消</Button>
                <Button onClick={handleChangePassword}>确认修改</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============ 子组件 ============
function StatCard({ title, value, pending, icon: Icon, color }: { title: string; value: number; pending?: number; icon: React.ElementType; color: string }) {
  const colors: Record<string, string> = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600' };
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-bold">{value}</p>{pending !== undefined && pending > 0 && <p className="text-xs text-yellow-600 mt-1">{pending} 条待处理</p>}</div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colors[color])}><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataTable<T>({ columns, data, isLoading, selectedIds, onSelectAll, renderRow, filterOptions, totalCount, currentPage, onPageChange, pageSize = 20 }: { columns: string[]; data: T[]; isLoading: boolean; selectedIds?: number[]; onSelectAll?: (ids: number[]) => void; renderRow: (item: T) => React.ReactNode; filterOptions?: React.ReactNode; totalCount?: number; currentPage?: number; onPageChange?: (page: number) => void; pageSize?: number }) {
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;
  const startItem = totalCount ? (currentPage! - 1) * pageSize + 1 : 1;
  const endItem = totalCount ? Math.min(currentPage! * pageSize, totalCount) : data.length;
  
  return (
    <div className="space-y-4">
      {filterOptions}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  {columns.map((col, i) => (
                    <th key={col} className="px-4 py-2.5 text-left text-sm font-medium">
                      {i === 0 && selectedIds !== undefined && onSelectAll && data.length > 0 && 'id' in (data[0] as object) ? (
                        <Checkbox checked={selectedIds.length === data.length} onCheckedChange={() => onSelectAll(data.map(d => (d as { id: number }).id))} className="h-4 w-4" />
                      ) : null}
                      {i === 0 && selectedIds !== undefined ? '' : col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></td></tr> : data.length === 0 ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr> : data.map(renderRow)}
              </tbody>
            </table>
          </div>
          {totalCount !== undefined && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
              <p className="text-sm text-muted-foreground">显示 {startItem}-{endItem} 条，共 {totalCount} 条</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => onPageChange?.(1)} disabled={currentPage === 1}>首页</Button>
                <Button variant="outline" size="sm" onClick={() => onPageChange?.((currentPage || 1) - 1)} disabled={currentPage === 1}>上一页</Button>
                <span className="px-3 py-1.5 text-sm">第 {currentPage || 1} / {totalPages} 页</span>
                <Button variant="outline" size="sm" onClick={() => onPageChange?.((currentPage || 1) + 1)} disabled={currentPage === totalPages}>下一页</Button>
                <Button variant="outline" size="sm" onClick={() => onPageChange?.(totalPages)} disabled={currentPage === totalPages}>末页</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return <div><span className="text-xs text-muted-foreground">{label}</span><p className={cn('font-medium', highlight && 'text-primary', mono && 'font-mono')}>{value}</p></div>;
}

// 8大案例分类定义
const CASE_CATEGORIES = [
  { id: '基础拖欠劳动报酬类', label: '基础拖欠劳动报酬类', icon: '💰', color: 'bg-blue-500', description: '纯欠薪、无复杂纠纷' },
  { id: '未签劳动合同欠薪类', label: '未签劳动合同欠薪类', icon: '📋', color: 'bg-green-500', description: '事实劳动关系、双倍工资' },
  { id: '建设工程领域欠薪类', label: '建设工程领域欠薪类', icon: '🏗️', color: 'bg-orange-500', description: '建筑施工、农民工维权' },
  { id: '劳务派遣/外包欠薪类', label: '劳务派遣/外包欠薪类', icon: '👥', color: 'bg-purple-500', description: '劳务派遣、人力外包' },
  { id: '工伤/职业病伴欠薪类', label: '工伤/职业病伴欠薪类', icon: '⚠️', color: 'bg-red-500', description: '工伤赔偿、职业病' },
  { id: '群体性欠薪维权类', label: '群体性欠薪维权类', icon: '👥‍👥‍👥', color: 'bg-pink-500', description: '3人以上集体欠薪' },
  { id: '拒不支付劳动报酬类', label: '拒不支付劳动报酬类', icon: '🚫', color: 'bg-indigo-500', description: '恶意欠薪、涉刑' },
  { id: '检察支持起诉胜诉类', label: '检察支持起诉胜诉类', icon: '⚖️', color: 'bg-teal-500', description: '检察支持、典型胜诉' },
];

// 案件类型分布组件
function CaseTypeDistribution({ distribution }: { distribution: Record<string, number> }) {
  // 获取所有分类（包括已分配和未分配的）
  const allCategories = CASE_CATEGORIES.map(cat => ({
    ...cat,
    count: distribution[cat.id] || 0,
  }));
  
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  // 如果没有数据，显示空状态
  if (total === 0) {
    return (
      <div className="space-y-3">
        {allCategories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <span className="text-xl">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate">{cat.label}</span>
                <span className="text-muted-foreground ml-2">0件</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full mt-1">
                <div className={cn('h-1.5 rounded-full', cat.color)} style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // 按数量排序，有数据的排在前面
  const sortedCategories = [...allCategories].sort((a, b) => b.count - a.count);
  
  return (
    <div className="space-y-2">
      {sortedCategories.map((cat) => {
        const percent = total > 0 ? Math.round((cat.count / total) * 100) : 0;
        return (
          <div key={cat.id} className={cn("flex items-center gap-3 p-2 rounded-lg transition-colors", cat.count > 0 && "bg-muted/50")}>
            <span className="text-xl shrink-0">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm mb-1">
                <span className={cn("truncate", cat.count > 0 ? "font-medium" : "text-muted-foreground")}>{cat.label}</span>
                <span className={cn("ml-2 shrink-0", cat.count > 0 ? "text-primary font-medium" : "text-muted-foreground")}>{cat.count}件</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full">
                <div 
                  className={cn('h-1.5 rounded-full transition-all', cat.color)} 
                  style={{ width: `${percent}%` }} 
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
