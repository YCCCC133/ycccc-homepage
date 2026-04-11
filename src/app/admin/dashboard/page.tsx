'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Scale, Home, FileText, Users, Settings, LogOut, Menu, X, 
  Plus, Edit, Trash2, Eye, Check, AlertCircle, Loader2, Search,
  ChevronDown, Shield, Database, DollarSign, CheckCircle, Bell,
  MessageSquare, Send, RefreshCw, Upload, Image as ImageIcon, 
  BarChart3, PieChart, TrendingUp, Clock, UserPlus, Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ============ 类型定义 ============
interface Announcement {
  id: number; title: string; content: string; category: string; is_published: boolean;
  created_at: string; updated_at: string; image_url?: string;
  is_top?: boolean; is_banner?: boolean; sort_order?: number;
}

interface Report {
  id: number; name: string; phone: string; company: string; amount: string;
  period: string; has_contract: string; has_evidence: string; description: string;
  status: string; created_at: string; updated_at: string;
}

interface Application {
  id: number; name: string; phone: string; id_number: string;
  address: string; company: string; position: string; amount: string;
  period: string; reason: string; type: string;
  status: string; created_at: string; updated_at: string;
}

interface Document {
  id: number; document_type: string; document_content: string;
  applicant_name: string; applicant_phone: string;
  created_at: string; updated_at: string;
}

interface Consultation {
  id: number; session_id: string; messages: any;
  status: string; created_at: string; updated_at: string;
}

interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  totalApplications: number;
  pendingApplications: number;
  totalDocuments: number;
  totalConsultations: number;
  recentReports: Report[];
  recentApplications: Application[];
}

const categories = ['全部', '政策通知', '平台公告', '办事指南', '工作动态', '普法宣传'];
const reportStatuses = ['全部', '待处理', '处理中', '已结案'];
const applicationTypes = ['支持起诉申请', '法律援助申请'];
const applicationStatuses = ['全部', '待审核', '审核通过', '审核拒绝', '已结案'];

// ============ 主组件 ============
export default function AdminDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 侧边栏状态
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 登录状态
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 数据状态
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  // 筛选状态
  const [announcementFilter, setAnnouncementFilter] = useState('全部');
  const [reportFilter, setReportFilter] = useState('全部');
  const [applicationFilter, setApplicationFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  // 编辑弹窗
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 新建公告
  const [isCreating, setIsCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '', content: '', category: '平台公告',
    is_published: true, is_top: false, is_banner: false, image_url: ''
  });

  // 修改密码
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');

  // ============ 初始化 ============
  useEffect(() => { 
    setMounted(true);
    checkAuth(); 
  }, []);

  // ============ 认证检查 ============
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/login', { credentials: 'include' });
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        await loadDashboardData();
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ 加载数据 ============
  const loadDashboardData = async () => {
    try {
      const [statsRes, announcementsRes, reportsRes, applicationsRes, documentsRes, consultationsRes] = await Promise.all([
        fetch('/api/admin/data', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/announcements', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/reports', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/applications', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/documents', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/consultations', { credentials: 'include' }).then(r => r.json()),
      ]);

      // 详细记录每个 API 的响应状态
      console.log('[dashboard] Stats response:', statsRes);
      console.log('[dashboard] Announcements response:', announcementsRes);
      console.log('[dashboard] Reports response:', reportsRes);
      console.log('[dashboard] Applications response:', applicationsRes);
      console.log('[dashboard] Documents response:', documentsRes);
      console.log('[dashboard] Consultations response:', consultationsRes);

      // 处理 stats
      if (statsRes.success) {
        setStats(statsRes.stats);
      } else {
        console.error('[dashboard] Stats failed:', statsRes.error, statsRes.details);
        toast.error(`获取统计数据失败: ${statsRes.error || statsRes.details || '未知错误'}`);
      }

      // 处理其他数据
      if (announcementsRes.success) setAnnouncements(announcementsRes.data || []);
      if (reportsRes.success) setReports(reportsRes.data || []);
      if (applicationsRes.success) setApplications(applicationsRes.data || []);
      if (documentsRes.success) setDocuments(documentsRes.data || []);
      if (consultationsRes.success) setConsultations(consultationsRes.data || []);

      // 如果所有 API 都失败
      const allFailed = !statsRes.success && !announcementsRes.success && !reportsRes.success && 
                        !applicationsRes.success && !documentsRes.success && !consultationsRes.success;
      if (allFailed) {
        toast.error('加载数据失败，请检查网络连接');
      }
    } catch (error) {
      console.error('[dashboard] Load data error:', error);
      toast.error('加载数据失败');
    }
  };

  // ============ 登录 ============
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError('请输入密码');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        await loadDashboardData();
        toast.success('登录成功');
      } else {
        setLoginError(data.error || '密码错误');
      }
    } catch {
      setLoginError('网络错误');
    } finally {
      setLoginLoading(false);
    }
  };

  // ============ 登出 ============
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE', credentials: 'include' });
      setIsAuthenticated(false);
      router.push('/');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // ============ 公告管理 ============
  const handleSaveAnnouncement = async () => {
    try {
      const url = editingItem?.id ? `/api/admin/announcements/${editingItem.id}` : '/api/admin/announcements';
      const method = editingItem?.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingItem || newAnnouncement),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editingItem?.id ? '更新成功' : '创建成功');
        setIsEditing(false);
        setEditingItem(null);
        setIsCreating(false);
        setNewAnnouncement({ title: '', content: '', category: '平台公告', is_published: true, is_top: false, is_banner: false, image_url: '' });
        await loadDashboardData();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('确定要删除这条公告吗？')) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        await loadDashboardData();
      }
    } catch { toast.error('删除失败'); }
  };

  // ============ 线索管理 ============
  const handleUpdateReportStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('状态更新成功');
        await loadDashboardData();
      }
    } catch { toast.error('更新失败'); }
  };

  // ============ 申请管理 ============
  const handleUpdateApplicationStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('状态更新成功');
        await loadDashboardData();
      }
    } catch { toast.error('更新失败'); }
  };

  // ============ 搜索 ============
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      await loadDashboardData();
      return;
    }
    // 实现搜索逻辑
  }, [searchQuery]);

  // ============ 辅助函数 ============
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch { return dateStr; }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待处理': case '待审核': return 'bg-yellow-100 text-yellow-800';
      case '处理中': case '审核通过': return 'bg-blue-100 text-blue-800';
      case '已结案': return 'bg-green-100 text-green-800';
      case '审核拒绝': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ============ 加载状态 - 必须完全匹配 SSR ============
  // ============ Hydration-safe loading skeleton ==========
  // SSR: mounted=false → renders skeleton
  // CSR first render: mounted=false → renders skeleton (MUST match SSR)
  const LoadingSkeleton = () => (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/50 to-background">
      <div className="text-center">
        <div className="h-10 w-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );

  if (!mounted) {
    return <LoadingSkeleton />;
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // ============ 登录页面 ============
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        {/* 左侧品牌区域 */}
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
          <p className="text-white/50 text-sm">© 2026 护薪平台</p>
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
                  <Label>管理员密码</Label>
                  <Input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入管理员密码"
                  />
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />{loginError}
                  </div>
                )}
                <Button type="submit" className="w-full bg-gradient-to-r from-[#1a3a5c] to-[#1a5c4c] hover:opacity-90" disabled={loginLoading}>
                  {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}登录系统
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-800">管理后台</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-1.5 hover:bg-muted">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="p-2 space-y-1">
          {[
            { id: 'dashboard', icon: Home, label: '数据概览' },
            { id: 'announcements', icon: Bell, label: '公告管理' },
            { id: 'reports', icon: FileText, label: '线索管理' },
            { id: 'applications', icon: Send, label: '申请管理' },
            { id: 'documents', icon: FileText, label: '文书管理' },
            { id: 'consultations', icon: MessageSquare, label: '咨询记录' },
            { id: 'settings', icon: Settings, label: '系统设置' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* 主内容 */}
      <main className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'ml-56' : 'ml-16')}>
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden rounded-lg p-2 hover:bg-muted">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">
              {activeTab === 'dashboard' && '数据概览'}
              {activeTab === 'announcements' && '公告管理'}
              {activeTab === 'reports' && '线索管理'}
              {activeTab === 'applications' && '申请管理'}
              {activeTab === 'documents' && '文书管理'}
              {activeTab === 'consultations' && '咨询记录'}
              {activeTab === 'settings' && '系统设置'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
              <Settings className="h-4 w-4 mr-2" />修改密码
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />退出登录
            </Button>
          </div>
        </header>

        {/* 内容区 */}
        <div className="p-6">
          {/* 数据概览 */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* 统计卡片 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">线索总数</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalReports}</div>
                    <p className="text-xs text-muted-foreground">待处理 {stats.pendingReports}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">申请总数</CardTitle>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalApplications}</div>
                    <p className="text-xs text-muted-foreground">待审核 {stats.pendingApplications}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">生成文书</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                    <p className="text-xs text-muted-foreground">法律文书</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">咨询记录</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalConsultations}</div>
                    <p className="text-xs text-muted-foreground">智能咨询</p>
                  </CardContent>
                </Card>
              </div>

              {/* 最近线索 */}
              <Card>
                <CardHeader><CardTitle>最近线索</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead><TableHead>公司</TableHead><TableHead>金额</TableHead>
                        <TableHead>状态</TableHead><TableHead>时间</TableHead><TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentReports.slice(0, 5).map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>{report.name}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{report.company}</TableCell>
                          <TableCell>¥{report.amount}</TableCell>
                          <TableCell><Badge className={getStatusColor(report.status)}>{report.status}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(report.created_at)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => { setActiveTab('reports'); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* 最近申请 */}
              <Card>
                <CardHeader><CardTitle>最近申请</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead><TableHead>类型</TableHead><TableHead>公司</TableHead>
                        <TableHead>状态</TableHead><TableHead>时间</TableHead><TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentApplications.slice(0, 5).map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>{app.name}</TableCell>
                          <TableCell><Badge variant="outline">{app.type}</Badge></TableCell>
                          <TableCell className="max-w-[150px] truncate">{app.company}</TableCell>
                          <TableCell><Badge className={getStatusColor(app.status)}>{app.status}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(app.created_at)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => { setActiveTab('applications'); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 公告管理 */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {categories.map((cat) => (
                    <Button key={cat} variant={announcementFilter === cat ? 'default' : 'outline'} size="sm"
                      onClick={() => setAnnouncementFilter(cat)}>{cat}</Button>
                  ))}
                </div>
                <Button onClick={() => { setIsCreating(true); setEditingItem(newAnnouncement); setIsEditing(true); }}>
                  <Plus className="h-4 w-4 mr-2" />新建公告
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>标题</TableHead><TableHead>分类</TableHead>
                        <TableHead>置顶</TableHead><TableHead>轮播</TableHead>
                        <TableHead>状态</TableHead><TableHead>时间</TableHead><TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.filter(a => announcementFilter === '全部' || a.category === announcementFilter).map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="max-w-[200px] truncate">{a.title}</TableCell>
                          <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                          <TableCell>{a.is_top ? <Badge variant="default">置顶</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                          <TableCell>{a.is_banner ? <Badge variant="default">轮播</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                          <TableCell><Badge className={a.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {a.is_published ? '已发布' : '草稿'}
                          </Badge></TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(a.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingItem(a); setIsEditing(true); setIsCreating(false); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteAnnouncement(a.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 线索管理 */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {reportStatuses.map((status) => (
                    <Button key={status} variant={reportFilter === status ? 'default' : 'outline'} size="sm"
                      onClick={() => setReportFilter(status)}>{status}</Button>
                  ))}
                </div>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead><TableHead>电话</TableHead><TableHead>公司</TableHead>
                        <TableHead>金额</TableHead><TableHead>时间</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.filter(r => reportFilter === '全部' || r.status === reportFilter).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.phone}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{r.company}</TableCell>
                          <TableCell>¥{r.amount}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                          <TableCell>
                            <Select value={r.status} onValueChange={(v) => handleUpdateReportStatus(r.id, v)}>
                              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {reportStatuses.filter(s => s !== '全部').map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 申请管理 */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {applicationTypes.map((type) => (
                  <Button key={type} variant={applicationFilter === type ? 'default' : 'outline'} size="sm"
                    onClick={() => setApplicationFilter(type)}>{type}</Button>
                ))}
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead><TableHead>类型</TableHead><TableHead>公司</TableHead>
                        <TableHead>金额</TableHead><TableHead>时间</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.filter(a => applicationFilter === '全部' || a.type === applicationFilter).map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.name}</TableCell>
                          <TableCell><Badge variant="outline">{a.type}</Badge></TableCell>
                          <TableCell className="max-w-[150px] truncate">{a.company}</TableCell>
                          <TableCell>¥{a.amount}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(a.created_at)}</TableCell>
                          <TableCell><Badge className={getStatusColor(a.status)}>{a.status}</Badge></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 文书管理 */}
          {activeTab === 'documents' && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>类型</TableHead><TableHead>申请人</TableHead><TableHead>电话</TableHead>
                      <TableHead>时间</TableHead><TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell><Badge variant="outline">{d.document_type}</Badge></TableCell>
                        <TableCell>{d.applicant_name}</TableCell>
                        <TableCell>{d.applicant_phone}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                        <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 咨询记录 */}
          {activeTab === 'consultations' && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>会话ID</TableHead><TableHead>状态</TableHead><TableHead>时间</TableHead><TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm">{c.session_id.slice(0, 8)}...</TableCell>
                        <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                        <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 系统设置 */}
          {activeTab === 'settings' && (
            <Card>
              <CardHeader><CardTitle>系统设置</CardTitle><CardDescription>暂无配置项</CardDescription></CardHeader>
            </Card>
          )}
        </div>
      </main>

      {/* 编辑弹窗 */}
      <Dialog open={isEditing} onOpenChange={(open) => { if (!open) { setIsEditing(false); setEditingItem(null); setIsCreating(false); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? '新建公告' : '编辑公告'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input value={editingItem?.title || ''} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} placeholder="输入公告标题" />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea value={editingItem?.content || ''} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} placeholder="输入公告内容" rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>分类</Label>
                <Select value={editingItem?.category || '平台公告'} onValueChange={(v) => setEditingItem({ ...editingItem, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== '全部').map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>图片URL</Label>
                <Input value={editingItem?.image_url || ''} onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })} placeholder="Banner图片URL（可选）" />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={editingItem?.is_published || false} onCheckedChange={(v) => setEditingItem({ ...editingItem, is_published: v })} />
                <Label>发布</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingItem?.is_top || false} onCheckedChange={(v) => setEditingItem({ ...editingItem, is_top: v })} />
                <Label>置顶</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingItem?.is_banner || false} onCheckedChange={(v) => setEditingItem({ ...editingItem, is_banner: v })} />
                <Label>轮播</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setIsEditing(false); setEditingItem(null); setIsCreating(false); }}>取消</Button>
            <Button onClick={handleSaveAnnouncement}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 修改密码弹窗 */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>修改密码</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>原密码</Label>
              <Input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>新密码</Label>
              <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>确认新密码</Label>
              <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>取消</Button>
            <Button onClick={() => {}}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
