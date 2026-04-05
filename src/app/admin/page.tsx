'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'reports' | 'applications' | 'documents' | 'consultations';

interface Stats {
  reports: number;
  applications: number;
  documents: number;
  consultations: number;
  pendingReports: number;
  pendingApplications: number;
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

const tabs = [
  { key: 'dashboard' as TabType, label: '数据概览', icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
  { key: 'reports' as TabType, label: '线索填报', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { key: 'applications' as TabType, label: '在线申请', icon: Send, color: 'text-green-600', bgColor: 'bg-green-50' },
  { key: 'documents' as TabType, label: '文书生成', icon: PenTool, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { key: 'consultations' as TabType, label: '咨询记录', icon: MessageSquare, color: 'text-orange-600', bgColor: 'bg-orange-50' },
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
  const [selectedItem, setSelectedItem] = useState<Report | Application | Document | Consultation | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab, page, statusFilter]);

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

  const fetchData = async () => {
    setIsLoading(true);
    try {
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
  };

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
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
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

  const totalPending = (stats?.pendingReports || 0) + (stats?.pendingApplications || 0);

  // Loading state
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
        {/* Background decoration */}
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-4">
        {/* Background decoration */}
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
      {/* Background decoration */}
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
            {/* 待处理提醒 */}
            {totalPending > 0 && (
              <Badge variant="outline" className="hidden gap-1.5 border-yellow-300 bg-yellow-50 text-yellow-700 sm:inline-flex">
                <Bell className="h-3.5 w-3.5" />
                {totalPending} 条待处理
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              首页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="gap-2"
            >
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
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
                setStatusFilter('');
              }}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-white text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('reports')}
                        className="border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50"
                      >
                        处理线索
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                    {stats.pendingApplications > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('applications')}
                        className="border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50"
                      >
                        处理申请
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 统计卡片 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="线索填报"
                value={stats.reports}
                pending={stats.pendingReports}
                icon={FileText}
                color="blue"
                onClick={() => setActiveTab('reports')}
              />
              <StatsCard
                title="在线申请"
                value={stats.applications}
                pending={stats.pendingApplications}
                icon={Send}
                color="green"
                onClick={() => setActiveTab('applications')}
              />
              <StatsCard
                title="文书生成"
                value={stats.documents}
                icon={PenTool}
                color="purple"
                onClick={() => setActiveTab('documents')}
              />
              <StatsCard
                title="咨询记录"
                value={stats.consultations}
                icon={MessageSquare}
                color="orange"
                onClick={() => setActiveTab('consultations')}
              />
            </div>

            {/* 快捷操作 */}
            <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">快捷操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <QuickAction
                    icon={Inbox}
                    label="待处理线索"
                    value={stats.pendingReports}
                    color="blue"
                    onClick={() => {
                      setActiveTab('reports');
                      setStatusFilter('pending');
                    }}
                  />
                  <QuickAction
                    icon={Clock}
                    label="处理中申请"
                    value={stats.applications}
                    color="green"
                    onClick={() => {
                      setActiveTab('applications');
                      setStatusFilter('processing');
                    }}
                  />
                  <QuickAction
                    icon={Activity}
                    label="今日咨询"
                    value={0}
                    color="orange"
                    onClick={() => setActiveTab('consultations')}
                  />
                  <QuickAction
                    icon={FileText}
                    label="文书生成"
                    value={stats.documents}
                    color="purple"
                    onClick={() => setActiveTab('documents')}
                  />
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
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>
            {stats && activeTab === 'reports' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>共 {stats.reports} 条记录</span>
                {stats.pendingReports > 0 && (
                  <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700">
                    {stats.pendingReports} 条待处理
                  </Badge>
                )}
              </div>
            )}
            {stats && activeTab === 'applications' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>共 {stats.applications} 条记录</span>
                {stats.pendingApplications > 0 && (
                  <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700">
                    {stats.pendingApplications} 条待处理
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Data Tables */}
        {activeTab === 'reports' && (
          <DataTable<Report>
            data={reports}
            isLoading={isLoading}
            columns={['姓名', '电话', '公司', '欠薪金额', '状态', '提交时间']}
            renderRow={(item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50"
                onClick={() => setSelectedItem(item)}
              >
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

        {activeTab === 'applications' && (
          <DataTable<Application>
            data={applications}
            isLoading={isLoading}
            columns={['申请人', '电话', '申请类型', '欠薪金额', '状态', '提交时间']}
            renderRow={(item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50"
                onClick={() => setSelectedItem(item)}
              >
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

        {activeTab === 'documents' && (
          <DataTable<Document>
            data={documents}
            isLoading={isLoading}
            columns={['文书类型', '申请人', '电话', '模板', '生成时间']}
            renderRow={(item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50"
                onClick={() => setSelectedItem(item)}
              >
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

        {activeTab === 'consultations' && (
          <DataTable<Consultation>
            data={consultations}
            isLoading={isLoading}
            columns={['用户问题', 'AI回复', '咨询时间']}
            renderRow={(item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50"
                onClick={() => setSelectedItem(item)}
              >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[80px] text-center text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          type={activeTab}
          onClose={() => setSelectedItem(null)}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  pending,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: number;
  pending?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick?: () => void;
}) {
  const colors: Record<string, { bg: string; icon: string; text: string; ring: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-600', ring: 'hover:ring-blue-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-600', ring: 'hover:ring-green-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-600', ring: 'hover:ring-purple-200' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-600', ring: 'hover:ring-orange-200' },
  };
  const c = colors[color] || colors.blue;

  return (
    <Card
      className={cn(
        'border-border/50 bg-white/80 backdrop-blur-sm shadow-sm transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:ring-2',
        onClick && c.ring
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
            {pending !== undefined && pending > 0 && (
              <div className="mt-2 flex items-center gap-1 text-sm text-yellow-600">
                <Clock className="h-4 w-4" />
                <span>{pending} 条待处理</span>
              </div>
            )}
          </div>
          <div className={cn('rounded-xl p-3', c.bg)}>
            <Icon className={cn('h-6 w-6', c.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Component
function QuickAction({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  onClick: () => void;
}) {
  const colors: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'bg-blue-50 hover:bg-blue-100', icon: 'text-blue-600' },
    green: { bg: 'bg-green-50 hover:bg-green-100', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-50 hover:bg-purple-100', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-50 hover:bg-orange-100', icon: 'text-orange-600' },
  };
  const c = colors[color] || colors.blue;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl p-3 transition-colors',
        c.bg
      )}
    >
      <div className={cn('rounded-lg p-2 bg-white/80', c.icon)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-left">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </button>
  );
}

// Data Table Component
function DataTable<T>({
  data,
  isLoading,
  columns,
  renderRow,
}: {
  data: T[];
  isLoading: boolean;
  columns: string[];
  renderRow: (item: T) => React.ReactNode;
}) {
  if (isLoading) {
    return (
      <Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-sm">
        <CardContent className="flex h-48 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-sm">
        <CardContent className="flex h-48 flex-col items-center justify-center text-muted-foreground">
          <Inbox className="mb-2 h-12 w-12 opacity-20" />
          <p>暂无数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/50 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{data.map(renderRow)}</tbody>
        </table>
      </div>
    </Card>
  );
}

// Detail Modal Component
function DetailModal({
  item,
  type,
  onClose,
  onUpdateStatus,
  onDelete,
  getStatusBadge,
  formatDate,
}: {
  item: Report | Application | Document | Consultation;
  type: TabType;
  onClose: () => void;
  onUpdateStatus: (type: 'report' | 'application', id: number, status: string) => void;
  onDelete: (type: string, id: number) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (date: string) => string;
}) {
  const isReport = (i: typeof item): i is Report => 'name' in i;
  const isApplication = (i: typeof item): i is Application => 'applicant_name' in i;
  const isConsultation = (i: typeof item): i is Consultation => 'user_question' in i;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white/95 backdrop-blur-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/30">
          <CardTitle className="text-lg">详细信息</CardTitle>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {isReport(item) && (
              <>
                <InfoRow icon={Users} label="姓名" value={item.name} />
                <InfoRow icon={Phone} label="电话" value={item.phone} />
                <InfoRow icon={CreditCard} label="身份证号" value={item.id_card || '-'} />
                <InfoRow icon={Building2} label="公司名称" value={item.company_name || '-'} />
                <InfoRow icon={Building2} label="公司地址" value={item.company_address || '-'} />
                <InfoRow icon={TrendingUp} label="欠薪金额" value={item.owed_amount ? `¥${item.owed_amount}` : '-'} highlight />
                <InfoRow icon={Clock} label="欠薪月数" value={item.owed_months ? `${item.owed_months} 个月` : '-'} />
                <InfoRow icon={Users} label="涉及人数" value={item.worker_count ? `${item.worker_count} 人` : '-'} />
                <InfoRow icon={FileText} label="问题描述" value={item.description || '-'} />
                <InfoRow icon={Shield} label="状态" value={getStatusBadge(item.status)} />
                <InfoRow icon={Calendar} label="提交时间" value={formatDate(item.created_at)} />
              </>
            )}

            {isApplication(item) && (
              <>
                <InfoRow icon={Users} label="申请人" value={item.applicant_name} />
                <InfoRow icon={Phone} label="电话" value={item.applicant_phone} />
                <InfoRow icon={CreditCard} label="身份证号" value={item.applicant_id_card || '-'} />
                <InfoRow icon={FileText} label="申请类型" value={item.application_type === 'support_prosecution' ? '支持起诉' : '法律援助'} />
                <InfoRow icon={TrendingUp} label="欠薪金额" value={item.owed_amount ? `¥${item.owed_amount}` : '-'} highlight />
                <InfoRow icon={FileText} label="案件简介" value={item.case_brief || '-'} />
                <InfoRow icon={Shield} label="状态" value={getStatusBadge(item.status)} />
                <InfoRow icon={Calendar} label="提交时间" value={formatDate(item.created_at)} />
                {item.reviewer_notes && <InfoRow icon={FileText} label="备注" value={item.reviewer_notes} />}
              </>
            )}

            {!isReport(item) && !isApplication(item) && !isConsultation(item) && (
              <>
                <InfoRow icon={FileText} label="文书类型" value={(item as Document).document_type} />
                <InfoRow icon={Users} label="申请人" value={(item as Document).applicant_name || '-'} />
                <InfoRow icon={Phone} label="电话" value={(item as Document).applicant_phone || '-'} />
                <InfoRow icon={FileText} label="使用模板" value={(item as Document).template_used || '-'} />
                <InfoRow icon={Calendar} label="生成时间" value={formatDate((item as Document).created_at)} />
              </>
            )}

            {isConsultation(item) && (
              <>
                <InfoRow icon={MessageSquare} label="用户问题" value={item.user_question} />
                <InfoRow icon={MessageSquare} label="AI回复" value={item.ai_response || '-'} />
                <InfoRow icon={Calendar} label="咨询时间" value={formatDate(item.created_at)} />
              </>
            )}
          </div>

          {/* Action Buttons */}
          {(isReport(item) || isApplication(item)) && (
            <div className="mt-6 flex flex-wrap gap-2 border-t pt-6">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(isReport(item) ? 'report' : 'application', item.id, 'processing')}
                disabled={item.status === 'processing'}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                处理中
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(isReport(item) ? 'report' : 'application', item.id, 'completed')}
                disabled={item.status === 'completed'}
                className="gap-2 border-green-300 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4" />
                已完成
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(isReport(item) ? 'report' : 'application', item.id, 'rejected')}
                disabled={item.status === 'rejected'}
                className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                驳回
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(isReport(item) ? 'report' : 'application', item.id)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            </div>
          )}

          {!isReport(item) && !isApplication(item) && (
            <div className="mt-6 flex gap-2 border-t pt-6">
              <Button size="sm" variant="outline" onClick={onClose} className="gap-2">
                <Eye className="h-4 w-4" />
                关闭
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(isConsultation(item) ? 'consultation' : 'document', item.id)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Info Row Component
function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('mt-0.5 text-sm', highlight && 'font-semibold text-primary')}>
          {value}
        </p>
      </div>
    </div>
  );
}
