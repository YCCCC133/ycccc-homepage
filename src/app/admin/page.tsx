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
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
  ChevronLeft,
  RefreshCw,
  Scale,
  Shield,
  TrendingUp,
  Eye,
  ArrowRight,
  Bell,
  Home,
  PlusCircle,
  Loader2,
  Database,
  Upload,
  Download,
  Settings,
  BarChart3,
  Search,
  Edit,
  FolderOpen,
  File,
  LayoutTemplate,
  Plus,
  ChevronRight,
  Menu,
  DollarSign,
  Clock,
  Calendar,
  User,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileDown,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============ 类型定义 ============
type TabType = 'dashboard' | 'reports' | 'applications' | 'cases' | 'documents' | 'consultations' | 'announcements' | 'files' | 'settings';

interface Stats {
  reports: number;
  applications: number;
  documents: number;
  consultations: number;
  pendingReports: number;
  pendingApplications: number;
  totalAmount: number;
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
  company_name: string | null;
  owed_amount: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

interface Application {
  id: number;
  applicant_name: string;
  applicant_phone: string;
  application_type: string;
  owed_amount: string | null;
  status: string;
  created_at: string;
}

interface Document {
  id: number;
  document_type: string;
  applicant_name: string | null;
  created_at: string;
}

interface Consultation {
  id: number;
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
  handler: string | null;
}

interface FileItem {
  id: number;
  name: string;
  type: string;
  size: number;
  case_id: number | null;
  created_at: string;
}

interface Template {
  id: number;
  name: string;
  type: string;
  content: string;
  variables: string[];
  is_active: boolean;
}

interface SystemSetting {
  key: string;
  value: string;
  description: string;
}

// ============ 导航配置 ============
const navItems = [
  { key: 'dashboard' as TabType, label: '数据概览', icon: BarChart3, group: '核心' },
  { key: 'reports' as TabType, label: '线索填报', icon: FileText, group: '业务' },
  { key: 'applications' as TabType, label: '在线申请', icon: Send, group: '业务' },
  { key: 'cases' as TabType, label: '案件管理', icon: Database, group: '业务' },
  { key: 'documents' as TabType, label: '文书管理', icon: PenTool, group: '业务' },
  { key: 'consultations' as TabType, label: '咨询记录', icon: MessageSquare, group: '业务' },
  { key: 'announcements' as TabType, label: '公告管理', icon: AlertCircle, group: '运营' },
  { key: 'files' as TabType, label: '文件管理', icon: FolderOpen, group: '运营' },
  { key: 'settings' as TabType, label: '系统设置', icon: Settings, group: '系统' },
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

  // 数据状态
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);

  // UI状态
  const [selectedItem, setSelectedItem] = useState<Report | Application | Document | Consultation | Announcement | CaseItem | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState<'detail' | 'form' | null>(null);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ============ 初始化 ============
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

  // ============ 数据获取 ============
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 公告
      if (activeTab === 'announcements') {
        const res = await fetch('/api/announcements?limit=50');
        const data = await res.json();
        if (data.success) setAnnouncements(data.data);
        setIsLoading(false);
        return;
      }

      // 案件库
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

      // 文件
      if (activeTab === 'files') {
        const res = await fetch('/api/admin/files');
        const data = await res.json();
        if (data.success) setFiles(data.data);
        setIsLoading(false);
        return;
      }

      // 模板和设置
      if (activeTab === 'documents') {
        const [docsRes, templatesRes] = await Promise.all([
          fetch(`/api/admin/data?type=documents&page=${page}&pageSize=10`),
          fetch('/api/admin/templates'),
        ]);
        const docsData = await docsRes.json();
        const templatesData = await templatesRes.json();
        if (docsData.documents) setDocuments(docsData.documents);
        if (templatesData.success) setTemplates(templatesData.data);
        setIsLoading(false);
        return;
      }

      if (activeTab === 'settings') {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success) setSettings(data.data);
        setIsLoading(false);
        return;
      }

      // 其他数据
      const type = activeTab === 'dashboard' ? 'stats' : activeTab;
      const params = new URLSearchParams({ type, page: page.toString(), pageSize: '10' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/data?${params}`);
      const data = await res.json();

      if (data.stats) setStats(data.stats);
      if (data.reports) setReports(data.reports);
      if (data.applications) setApplications(data.applications);
      if (data.documents) setDocuments(data.documents);
      if (data.consultations) setConsultations(data.consultations);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, statusFilter, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

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
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('确定删除？此操作不可恢复。')) return;
    const endpoint = type === 'announcement' ? `/api/announcements/${id}` : 
                     type === 'case' ? `/api/admin/cases/${id}` :
                     `/api/admin/data?type=${type}&id=${id}`;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if ((await res.json()).success) {
        fetchData();
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((p) => (p >= 100 ? (clearInterval(interval), 100) : p + 10));
    }, 200);

    setTimeout(async () => {
      clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);

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
      fetchData();
    }, 2000);
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

  const handleSaveAnnouncement = async () => {
    if (!editingItem?.title || !editingItem?.content) {
      alert('请填写标题和内容');
      return;
    }
    const url = editingItem.id ? `/api/announcements/${editingItem.id}` : '/api/announcements';
    const method = editingItem.id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      if ((await res.json()).success) {
        setShowModal(null);
        setEditingItem(null);
        fetchData();
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if ((await res.json()).success) alert('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
    }
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
              <Scale className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-xl">后台管理系统</CardTitle>
            <CardDescription>护薪平台 · 数据管理中心</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {loginError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {loginError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                登录
              </Button>
            </form>
            <button onClick={() => router.push('/')} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary">
              返回首页
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ 主界面 ============
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* 侧边栏 */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-border/50 transition-all duration-300',
        sidebarOpen ? 'w-56' : 'w-16'
      )}>
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
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); setPage(1); setStatusFilter(''); setSearchQuery(''); }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && item.key === 'reports' && stats?.pendingReports ? (
                  <span className={cn('ml-auto text-xs px-1.5 py-0.5 rounded', isActive ? 'bg-primary-foreground/20' : 'bg-yellow-100 text-yellow-700')}>
                    {stats.pendingReports}
                  </span>
                ) : null}
                {sidebarOpen && item.key === 'applications' && stats?.pendingApplications ? (
                  <span className={cn('ml-auto text-xs px-1.5 py-0.5 rounded', isActive ? 'bg-primary-foreground/20' : 'bg-yellow-100 text-yellow-700')}>
                    {stats.pendingApplications}
                  </span>
                ) : null}
              </button>
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
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-white/95 backdrop-blur px-6">
          <h1 className="text-lg font-semibold">{navItems.find(n => n.key === activeTab)?.label || '后台管理'}</h1>
          <div className="flex items-center gap-3">
            {totalPending > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                <Bell className="h-3 w-3 mr-1" />
                {totalPending} 条待处理
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push('/')} className="gap-1.5">
              <Home className="h-4 w-4" />
              首页
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-1.5">
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              刷新
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* ============ 数据概览 ============ */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* 待处理提醒 */}
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

              {/* 统计卡片 */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="线索填报" value={stats.reports} pending={stats.pendingReports} icon={FileText} color="blue" />
                <StatCard title="在线申请" value={stats.applications} pending={stats.pendingApplications} icon={Send} color="green" />
                <StatCard title="文书生成" value={stats.documents} icon={PenTool} color="purple" />
                <StatCard title="咨询记录" value={stats.consultations} icon={MessageSquare} color="orange" />
              </div>

              {/* 图表区域 */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      月度案件趋势
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-end justify-between gap-3">
                      {['1月', '2月', '3月', '4月', '5月', '6月'].map((m, i) => {
                        const heights = [50, 70, 45, 80, 65, 55];
                        return (
                          <div key={m} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-primary rounded-t transition-all hover:bg-primary/80" style={{ height: `${heights[i]}%` }} />
                            <span className="text-xs text-muted-foreground">{m}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      核心指标
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">涉案金额总计</span>
                        <span className="font-semibold text-primary">¥{(stats.totalAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">帮助劳动者人数</span>
                        <span className="font-semibold">2,458+</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">平均处理天数</span>
                        <span className="font-semibold">7 天</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">成功维权率</span>
                        <span className="font-semibold text-green-600">98.6%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 最近案件 */}
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
                    {cases.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            <Database className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.plaintiff_name} vs {c.defendant_name}</p>
                            <p className="text-xs text-muted-foreground">{c.case_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-primary">¥{c.amount.toLocaleString()}</span>
                          {getStatusBadge(c.status)}
                        </div>
                      </div>
                    ))}
                    {cases.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">暂无案件数据</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ============ 线索填报 ============ */}
          {activeTab === 'reports' && (
            <DataTable
              columns={['申请人', '电话', '公司', '欠薪金额', '状态', '提交时间', '操作']}
              data={reports}
              isLoading={isLoading}
              renderRow={(r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">{r.name.charAt(0)}</div>
                      <span className="font-medium text-sm">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.phone}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[150px] truncate">{r.company_name || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-primary">{r.owed_amount ? `¥${r.owed_amount}` : '-'}</td>
                  <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(r); setShowModal('detail'); }}><Eye className="h-4 w-4" /></Button>
                      {r.status === 'pending' && (
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus('report', r.id, 'processing')}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              filterOptions={
                <div className="flex gap-3 mb-4">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">全部状态</option>
                    <option value="pending">待处理</option>
                    <option value="processing">处理中</option>
                    <option value="completed">已完成</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={() => handleExportData('线索填报', reports)} className="gap-1.5">
                    <Download className="h-4 w-4" /> 导出
                  </Button>
                </div>
              }
            />
          )}

          {/* ============ 在线申请 ============ */}
          {activeTab === 'applications' && (
            <DataTable
              columns={['申请人', '电话', '类型', '欠薪金额', '状态', '提交时间', '操作']}
              data={applications}
              isLoading={isLoading}
              renderRow={(a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50">
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
                <div className="flex gap-3 mb-4">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">全部状态</option>
                    <option value="pending">待处理</option>
                    <option value="processing">处理中</option>
                    <option value="completed">已完成</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={() => handleExportData('在线申请', applications)} className="gap-1.5">
                    <Download className="h-4 w-4" /> 导出
                  </Button>
                </div>
              }
            />
          )}

          {/* ============ 案件管理 ============ */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索案件..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm"
                  />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="processing">处理中</option>
                  <option value="completed">已完成</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => handleExportData('案件数据', cases)} className="gap-1.5">
                  <Download className="h-4 w-4" /> 导出
                </Button>
                <Button size="sm" className="gap-1.5">
                  <PlusCircle className="h-4 w-4" /> 新建
                </Button>
              </div>
              <DataTable
                columns={['案件编号', '原告', '被告', '类型', '金额', '状态', '承办人', '操作']}
                data={cases}
                isLoading={isLoading}
                renderRow={(c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-sm">{c.case_number}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{c.plaintiff_name}</p>
                        <p className="text-xs text-muted-foreground">{c.plaintiff_phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{c.defendant_name}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{c.case_type}</Badge></td>
                    <td className="px-4 py-3 text-sm font-medium text-primary">¥{c.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{c.handler || '-'}</td>
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">文书模板</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                            <LayoutTemplate className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.variables.length} 个变量</p>
                          </div>
                        </div>
                        <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-xs">{t.is_active ? '启用' : '禁用'}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">已生成文书</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2 text-left text-sm font-medium">文书类型</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">申请人</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">生成时间</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((d) => (
                        <tr key={d.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">{d.document_type}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{d.applicant_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(d.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ============ 咨询记录 ============ */}
          {activeTab === 'consultations' && (
            <DataTable
              columns={['用户问题', 'AI回复', '时间']}
              data={consultations}
              isLoading={isLoading}
              renderRow={(c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="text-sm line-clamp-2">{c.user_question}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.ai_response || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(c.created_at)}</td>
                </tr>
              )}
            />
          )}

          {/* ============ 公告管理 ============ */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => { setEditingItem({ id: 0, title: '', content: '', category: '通知', is_published: true, created_at: '', updated_at: '' }); setShowModal('form'); }} className="gap-1.5">
                  <PlusCircle className="h-4 w-4" /> 新建公告
                </Button>
              </div>
              <DataTable
                columns={['标题', '分类', '状态', '时间', '操作']}
                data={announcements}
                isLoading={isLoading}
                renderRow={(a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{a.title}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{a.category}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge variant={a.is_published ? 'default' : 'secondary'} className="text-xs">{a.is_published ? '已发布' : '草稿'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(a); setShowModal('form'); }}>编辑</Button>
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
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> 上传中 {uploadProgress}%</> : <><Upload className="h-4 w-4" /> 上传文件</>}
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                          <File className="h-5 w-5" />
                        </div>
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
                <Card>
                  <CardContent className="py-12 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">暂无文件</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ============ 系统设置 ============ */}
          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">基础设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{s.description}</p>
                      <p className="text-xs text-muted-foreground">{s.key}</p>
                    </div>
                    {['auto_assign', 'sms_notification', 'email_notification'].includes(s.key) ? (
                      <button
                        onClick={() => setSettings((prev) => prev.map((x) => x.key === s.key ? { ...x, value: x.value === 'true' ? 'false' : 'true' } : x))}
                        className={cn('relative h-6 w-11 rounded-full transition-colors', s.value === 'true' ? 'bg-primary' : 'bg-muted')}
                      >
                        <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', s.value === 'true' && 'translate-x-5')} />
                      </button>
                    ) : (
                      <input
                        type="text"
                        value={s.value}
                        onChange={(e) => setSettings((prev) => prev.map((x) => x.key === s.key ? { ...x, value: e.target.value } : x))}
                        className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-48"
                      />
                    )}
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveSettings} className="gap-1.5">
                    <CheckCircle className="h-4 w-4" /> 保存设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* ============ 弹窗 ============ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(null)}>
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{showModal === 'form' ? (editingItem?.id ? '编辑公告' : '新建公告') : '详情'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(null)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {showModal === 'detail' && selectedItem && (
                <div className="space-y-3">
                  {'name' in selectedItem && <div><span className="text-xs text-muted-foreground">姓名</span><p className="font-medium">{selectedItem.name}</p></div>}
                  {'phone' in selectedItem && <div><span className="text-xs text-muted-foreground">电话</span><p className="font-medium">{selectedItem.phone}</p></div>}
                  {'company_name' in selectedItem && <div><span className="text-xs text-muted-foreground">公司</span><p className="font-medium">{selectedItem.company_name || '-'}</p></div>}
                  {'owed_amount' in selectedItem && <div><span className="text-xs text-muted-foreground">欠薪金额</span><p className="font-medium text-primary">{selectedItem.owed_amount ? `¥${selectedItem.owed_amount}` : '-'}</p></div>}
                  {'description' in selectedItem && <div><span className="text-xs text-muted-foreground">描述</span><p className="text-sm">{selectedItem.description || '-'}</p></div>}
                  {'case_number' in selectedItem && <div><span className="text-xs text-muted-foreground">案件编号</span><p className="font-mono">{selectedItem.case_number}</p></div>}
                  {'defendant_name' in selectedItem && <div><span className="text-xs text-muted-foreground">被告</span><p className="font-medium">{selectedItem.defendant_name}</p></div>}
                  {'amount' in selectedItem && <div><span className="text-xs text-muted-foreground">涉案金额</span><p className="font-medium text-primary">¥{selectedItem.amount.toLocaleString()}</p></div>}
                  {'status' in selectedItem && (
                    <div><span className="text-xs text-muted-foreground">状态</span><div className="mt-1">{getStatusBadge(selectedItem.status as string)}</div></div>
                  )}
                  {'status' in selectedItem && (selectedItem.status === 'pending' || selectedItem.status === 'processing') && (
                    <div className="flex gap-2 pt-4">
                      {selectedItem.status === 'pending' && (
                        <Button size="sm" onClick={() => { handleUpdateStatus('case' in selectedItem ? 'case' : 'report', selectedItem.id, 'processing'); setShowModal(null); }}>开始处理</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { handleUpdateStatus('case' in selectedItem ? 'case' : 'report', selectedItem.id, 'completed'); setShowModal(null); }}>标记完成</Button>
                    </div>
                  )}
                </div>
              )}
              {showModal === 'form' && editingItem && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">标题</label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">分类</label>
                    <select
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="通知">通知</option>
                      <option value="指南">指南</option>
                      <option value="案例">案例</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">内容</label>
                    <textarea
                      value={editingItem.content}
                      onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[150px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={editingItem.is_published}
                      onChange={(e) => setEditingItem({ ...editingItem, is_published: e.target.checked })}
                    />
                    <label htmlFor="is_published" className="text-sm">立即发布</label>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowModal(null)}>取消</Button>
                    <Button onClick={handleSaveAnnouncement}>保存</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============ 子组件 ============
function StatCard({ title, value, pending, icon: Icon, color }: { title: string; value: number; pending?: number; icon: React.ElementType; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {pending !== undefined && pending > 0 && <p className="text-xs text-yellow-600 mt-1">{pending} 条待处理</p>}
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colors[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataTable<T>({ columns, data, isLoading, renderRow, filterOptions }: { columns: string[]; data: T[]; isLoading: boolean; renderRow: (item: T) => React.ReactNode; filterOptions?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      {filterOptions}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-2.5 text-left text-sm font-medium">{col}</th>
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
    </div>
  );
}
