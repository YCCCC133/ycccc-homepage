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
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  // 检查登录状态
  useEffect(() => {
    checkAuth();
  }, []);

  // 获取数据
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

  const handleLogout = async () => {
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
        pageSize: '20',
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/data?${params}`);
      const data = await res.json();

      if (data.stats) setStats(data.stats);
      if (data.reports) {
        setReports(data.reports);
        setTotalPages(Math.ceil((data.reportsTotal || 0) / 20));
      }
      if (data.applications) {
        setApplications(data.applications);
        setTotalPages(Math.ceil((data.applicationsTotal || 0) / 20));
      }
      if (data.documents) {
        setDocuments(data.documents);
        setTotalPages(Math.ceil((data.documentsTotal || 0) / 20));
      }
      if (data.consultations) {
        setConsultations(data.consultations);
        setTotalPages(Math.ceil((data.consultationsTotal || 0) / 20));
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
    if (!confirm('确定要删除这条记录吗？')) return;

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
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      rejected: '已驳回',
    };
    return (
      <span className={cn('rounded-full px-2 py-1 text-xs font-medium', styles[status] || styles.pending)}>
        {labels[status] || status}
      </span>
    );
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

  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 登录界面
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">后台管理系统</h1>
            <p className="mt-2 text-sm text-gray-500">请输入管理员密码</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {loginError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登录中...' : '登 录'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-primary"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 管理界面
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">护薪平台 · 后台管理</h1>
              <p className="text-xs text-gray-500">数据管理中心</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4">
        {/* 标签导航 */}
        <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm">
          {[
            { key: 'dashboard', label: '概览', icon: Users },
            { key: 'reports', label: '线索填报', icon: FileText },
            { key: 'applications', label: '在线申请', icon: Send },
            { key: 'documents', label: '文书生成', icon: PenTool },
            { key: 'consultations', label: '咨询记录', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as TabType);
                setPage(1);
                setStatusFilter('');
              }}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        {activeTab === 'dashboard' && stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="线索填报"
              value={stats.reports}
              pending={stats.pendingReports}
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="在线申请"
              value={stats.applications}
              pending={stats.pendingApplications}
              icon={Send}
              color="green"
            />
            <StatCard
              title="文书生成"
              value={stats.documents}
              icon={PenTool}
              color="purple"
            />
            <StatCard
              title="咨询记录"
              value={stats.consultations}
              icon={MessageSquare}
              color="orange"
            />
          </div>
        )}

        {(activeTab === 'reports' || activeTab === 'applications') && (
          <div className="mb-4 flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
        )}

        {activeTab === 'reports' && (
          <DataTable
            data={reports}
            columns={['姓名', '电话', '公司', '欠薪金额', '状态', '提交时间']}
            renderRow={(item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b hover:bg-gray-50"
                onClick={() => setSelectedItem(item)}
              >
                <td className="whitespace-nowrap px-4 py-3">{item.name}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.phone}</td>
                <td className="max-w-[150px] truncate px-4 py-3">{item.company_name || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.owed_amount ? `¥${item.owed_amount}` : '-'}</td>
                <td className="whitespace-nowrap px-4 py-3">{getStatusBadge(item.status)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatDate(item.created_at)}</td>
              </tr>
            )}
          />
        )}

        {activeTab === 'applications' && (
          <DataTable
            data={applications}
            columns={['申请人', '电话', '申请类型', '欠薪金额', '状态', '提交时间']}
            renderRow={(item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b hover:bg-gray-50"
                onClick={() => setSelectedItem(item)}
              >
                <td className="whitespace-nowrap px-4 py-3">{item.applicant_name}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.applicant_phone}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {item.application_type === 'support_prosecution' ? '支持起诉' : '法律援助'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{item.owed_amount ? `¥${item.owed_amount}` : '-'}</td>
                <td className="whitespace-nowrap px-4 py-3">{getStatusBadge(item.status)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatDate(item.created_at)}</td>
              </tr>
            )}
          />
        )}

        {activeTab === 'documents' && (
          <DataTable
            data={documents}
            columns={['文书类型', '申请人', '电话', '模板', '生成时间']}
            renderRow={(item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b hover:bg-gray-50"
                onClick={() => setSelectedItem(item)}
              >
                <td className="whitespace-nowrap px-4 py-3">{item.document_type}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.applicant_name || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.applicant_phone || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.template_used || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatDate(item.created_at)}</td>
              </tr>
            )}
          />
        )}

        {activeTab === 'consultations' && (
          <DataTable
            data={consultations}
            columns={['用户问题', 'AI回复', '咨询时间']}
            renderRow={(item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b hover:bg-gray-50"
                onClick={() => setSelectedItem(item)}
              >
                <td className="max-w-[300px] truncate px-4 py-3">{item.user_question}</td>
                <td className="max-w-[300px] truncate px-4 py-3">{item.ai_response || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatDate(item.created_at)}</td>
              </tr>
            )}
          />
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
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
      </div>

      {/* 详情弹窗 */}
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

// 统计卡片组件
function StatCard({
  title,
  value,
  pending,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  pending?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {pending !== undefined && pending > 0 && (
            <p className="mt-2 flex items-center gap-1 text-sm text-yellow-600">
              <Clock className="h-4 w-4" />
              {pending} 条待处理
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', colors[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// 数据表格组件
function DataTable<T>({
  data,
  columns,
  renderRow,
}: {
  data: T[];
  columns: string[];
  renderRow: (item: T) => React.ReactNode;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center text-gray-500">
        暂无数据
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{data.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

// 详情弹窗组件
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">详细信息</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {isReport(item) && (
            <>
              <InfoRow label="姓名" value={item.name} />
              <InfoRow label="电话" value={item.phone} />
              <InfoRow label="身份证号" value={item.id_card || '-'} />
              <InfoRow label="公司名称" value={item.company_name || '-'} />
              <InfoRow label="公司地址" value={item.company_address || '-'} />
              <InfoRow label="欠薪金额" value={item.owed_amount ? `¥${item.owed_amount}` : '-'} />
              <InfoRow label="欠薪月数" value={item.owed_months ? `${item.owed_months}个月` : '-'} />
              <InfoRow label="涉及人数" value={item.worker_count ? `${item.worker_count}人` : '-'} />
              <InfoRow label="问题描述" value={item.description || '-'} />
              <div className="flex items-center justify-between">
                <InfoRow label="状态" value={getStatusBadge(item.status)} />
              </div>
              <InfoRow label="提交时间" value={formatDate(item.created_at)} />
            </>
          )}

          {isApplication(item) && (
            <>
              <InfoRow label="申请人" value={item.applicant_name} />
              <InfoRow label="电话" value={item.applicant_phone} />
              <InfoRow label="身份证号" value={item.applicant_id_card || '-'} />
              <InfoRow label="申请类型" value={item.application_type === 'support_prosecution' ? '支持起诉' : '法律援助'} />
              <InfoRow label="欠薪金额" value={item.owed_amount ? `¥${item.owed_amount}` : '-'} />
              <InfoRow label="案件简介" value={item.case_brief || '-'} />
              <div className="flex items-center justify-between">
                <InfoRow label="状态" value={getStatusBadge(item.status)} />
              </div>
              <InfoRow label="提交时间" value={formatDate(item.created_at)} />
              {item.reviewer_notes && <InfoRow label="备注" value={item.reviewer_notes} />}
            </>
          )}

          {!isReport(item) && !isApplication(item) && !isConsultation(item) && (
            <>
              <InfoRow label="文书类型" value={(item as Document).document_type} />
              <InfoRow label="申请人" value={(item as Document).applicant_name || '-'} />
              <InfoRow label="电话" value={(item as Document).applicant_phone || '-'} />
              <InfoRow label="使用模板" value={(item as Document).template_used || '-'} />
              <InfoRow label="生成时间" value={formatDate((item as Document).created_at)} />
            </>
          )}

          {isConsultation(item) && (
            <>
              <InfoRow label="用户问题" value={item.user_question} />
              <InfoRow label="AI回复" value={item.ai_response || '-'} />
              <InfoRow label="咨询时间" value={formatDate(item.created_at)} />
            </>
          )}
        </div>

        {/* 操作按钮 */}
        {(isReport(item) || isApplication(item)) && (
          <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(isReport(item) ? 'report' : 'application', item.id, 'processing')}
              disabled={item.status === 'processing'}
            >
              <Clock className="h-4 w-4" />
              处理中
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-green-600"
              onClick={() => onUpdateStatus(isReport(item) ? 'report' : 'application', item.id, 'completed')}
              disabled={item.status === 'completed'}
            >
              <CheckCircle className="h-4 w-4" />
              已完成
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600"
              onClick={() => onUpdateStatus(isReport(item) ? 'report' : 'application', item.id, 'rejected')}
              disabled={item.status === 'rejected'}
            >
              <X className="h-4 w-4" />
              驳回
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(isReport(item) ? 'report' : 'application', item.id)}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          </div>
        )}

        {!isReport(item) && !isApplication(item) && (
          <div className="mt-6 flex gap-2 border-t pt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              <Eye className="h-4 w-4" />
              关闭
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(isConsultation(item) ? 'consultation' : 'document', item.id)}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-gray-100 py-2">
      <span className="w-24 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
