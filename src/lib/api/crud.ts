/**
 * 统一 CRUD API 服务封装
 * 提供标准化的增删改查接口
 */

// ============================================================
// 统一响应类型
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

// ============================================================
// 公告 CRUD
// ============================================================

export interface AnnouncementFormData {
  title: string;
  summary?: string;
  content: string;
  category?: string;
  is_published?: boolean;
  image_url?: string;
  author?: string;
  is_top?: boolean;
  is_banner?: boolean;
  sort_order?: number;
}

export async function createAnnouncement(data: AnnouncementFormData): Promise<ApiResponse> {
  const response = await fetch('/api/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateAnnouncement(id: number, data: Partial<AnnouncementFormData>): Promise<ApiResponse> {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteAnnouncement(id: number): Promise<ApiResponse> {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function updateAnnouncementStatus(id: number, isPublished: boolean): Promise<ApiResponse> {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'status', value: isPublished }),
  });
  return response.json();
}

// ============================================================
// 线索 CRUD
// ============================================================

export interface ReportFormData {
  name: string;
  phone: string;
  id_card?: string;
  company_name: string;
  owed_amount?: string;
  work_location?: string;
  work_start_date?: string;
  work_end_date?: string;
  supervisor_name?: string;
  supervisor_phone?: string;
  description?: string;
}

export async function getReports(params?: { page?: number; pageSize?: number; status?: string }): Promise<PaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.status) searchParams.set('status', params.status);
  
  const response = await fetch(`/api/admin/reports?${searchParams.toString()}`, {
    credentials: 'include',
  });
  return response.json();
}

export async function updateReportStatus(id: number, status: string): Promise<ApiResponse> {
  const response = await fetch(`/api/admin/reports/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  return response.json();
}

export async function deleteReport(id: number): Promise<ApiResponse> {
  const response = await fetch(`/api/admin/reports/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return response.json();
}

// ============================================================
// 申请 CRUD
// ============================================================

export interface ApplicationFormData {
  applicant_name: string;
  applicant_phone: string;
  applicant_id_card?: string;
  applicant_address?: string;
  application_type: string;
  company_name?: string;
  company_address?: string;
  company_contact?: string;
  owed_amount?: string;
  description?: string;
  evidence_urls?: string[];
}

export async function getApplications(params?: { page?: number; pageSize?: number; status?: string; type?: string }): Promise<PaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.type) searchParams.set('type', params.type);
  
  const response = await fetch(`/api/admin/applications?${searchParams.toString()}`, {
    credentials: 'include',
  });
  return response.json();
}

export async function updateApplicationStatus(id: number, status: string, handler?: string): Promise<ApiResponse> {
  const response = await fetch(`/api/admin/applications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status, handler }),
  });
  return response.json();
}

// ============================================================
// 案件 CRUD
// ============================================================

export interface CaseFormData {
  case_number: string;
  plaintiff_name: string;
  defendant_name: string;
  case_type: string;
  amount: number;
  status: string;
  filing_date?: string;
  handler?: string;
  notes?: string;
}

export async function getCases(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  
  const response = await fetch(`/api/admin/cases?${searchParams.toString()}`, {
    credentials: 'include',
  });
  return response.json();
}

export async function createCase(data: CaseFormData): Promise<ApiResponse> {
  const response = await fetch('/api/admin/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateCase(id: number, data: Partial<CaseFormData>): Promise<ApiResponse> {
  const response = await fetch(`/api/admin/cases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteCase(id: number): Promise<ApiResponse> {
  const response = await fetch(`/api/admin/cases/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return response.json();
}

// ============================================================
// 知识库 CRUD
// ============================================================

export interface KnowledgeFormData {
  category: string;
  court?: string;
  case_number: string;
  parties: string;
  case_type?: string;
  procedure_type?: string;
  result?: string;
  summary?: string;
  full_text?: string;
  is_active?: boolean;
}

export async function getKnowledgeList(params?: { page?: number; pageSize?: number; category?: string; search?: string }): Promise<PaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.category) searchParams.set('category', params.category);
  if (params?.search) searchParams.set('search', params.search);
  
  const response = await fetch(`/api/admin/knowledge?${searchParams.toString()}`, {
    credentials: 'include',
  });
  return response.json();
}

export async function createKnowledge(data: KnowledgeFormData): Promise<ApiResponse> {
  const response = await fetch('/api/admin/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateKnowledge(id: number, data: Partial<KnowledgeFormData>): Promise<ApiResponse> {
  const response = await fetch(`/api/admin/knowledge/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteKnowledge(id: number): Promise<ApiResponse> {
  const response = await fetch(`/api/admin/knowledge/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return response.json();
}

// ============================================================
// 工具函数
// ============================================================

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'processing': 'bg-blue-100 text-blue-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'closed': 'bg-gray-100 text-gray-800',
    'published': 'bg-green-100 text-green-800',
    'draft': 'bg-gray-100 text-gray-800',
    'offline': 'bg-red-100 text-red-800',
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    'pending': '待处理',
    'processing': '处理中',
    'approved': '已通过',
    'rejected': '已拒绝',
    'closed': '已关闭',
    'published': '已发布',
    'draft': '草稿',
    'offline': '已下线',
  };
  return textMap[status] || status;
}
