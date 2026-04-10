/**
 * 公告系统 API 封装
 * 统一管理所有公告相关的网络请求
 */

// ============================================================
// 类型定义
// ============================================================

export interface Announcement {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  image_url: string | null;
  is_published: boolean;
  is_top: boolean;
  is_banner: boolean;
  sort_order: number;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementListItem {
  id: number;
  title: string;
  summary: string | null;
  content?: string;
  category: string;
  image_url: string | null;
  is_published: boolean;
  is_top: boolean;
  is_banner: boolean;
  sort_order: number;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementListResponse {
  success: boolean;
  data: AnnouncementListItem[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface AnnouncementDetailResponse {
  success: boolean;
  data: Announcement;
  error?: string;
}

export interface CreateAnnouncementData {
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

export type UpdateAnnouncementData = Partial<CreateAnnouncementData>;

export interface UploadResponse {
  success: boolean;
  data?: {
    key: string;
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
  error?: string;
}

// ============================================================
// API 请求封装
// ============================================================

const API_BASE = '/api/announcements';

/**
 * 获取公告列表
 */
export async function getAnnouncementList(params?: {
  limit?: number;
  offset?: number;
  published_only?: boolean;
  banner_only?: boolean;
  category?: string;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'sort_order' | 'title' | 'is_top';
  sortOrder?: 'ASC' | 'DESC';
}): Promise<AnnouncementListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  if (params?.published_only !== undefined) searchParams.set('published_only', String(params.published_only));
  if (params?.banner_only) searchParams.set('banner_only', 'true');
  if (params?.category) searchParams.set('category', params.category);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const queryString = searchParams.toString();
  const url = `${API_BASE}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  return response.json();
}

/**
 * 获取公告详情
 */
export async function getAnnouncementDetail(id: number): Promise<AnnouncementDetailResponse> {
  const response = await fetch(`${API_BASE}/${id}`);
  return response.json();
}

/**
 * 创建公告
 */
export async function createAnnouncement(data: CreateAnnouncementData): Promise<AnnouncementDetailResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * 更新公告
 */
export async function updateAnnouncement(id: number, data: UpdateAnnouncementData): Promise<AnnouncementDetailResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * 删除公告
 */
export async function deleteAnnouncement(id: number): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

/**
 * 更新公告状态 (发布/下线)
 */
export async function updateAnnouncementStatus(id: number, isPublished: boolean): Promise<AnnouncementDetailResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'status', value: isPublished }),
  });
  return response.json();
}

/**
 * 更新公告置顶状态
 */
export async function updateAnnouncementTop(id: number, isTop: boolean): Promise<AnnouncementDetailResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'top', value: isTop }),
  });
  return response.json();
}

/**
 * 更新公告轮播状态
 */
export async function updateAnnouncementBanner(id: number, isBanner: boolean): Promise<AnnouncementDetailResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'banner', value: isBanner }),
  });
  return response.json();
}

// ============================================================
// 文件上传
// ============================================================

const UPLOAD_API = '/api/upload';

/**
 * 上传图片文件
 */
export async function uploadImage(file: File, type: string = 'announcement'): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await fetch(UPLOAD_API, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 格式化日期显示
 */
export function formatAnnouncementDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 获取分类颜色样式
 */
export function getCategoryColorClass(category: string): string {
  const colorMap: Record<string, string> = {
    '通知': 'bg-blue-50 text-blue-700 border-blue-200',
    '指南': 'bg-green-50 text-green-700 border-green-200',
    '案例': 'bg-amber-50 text-amber-700 border-amber-200',
    '公告': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    '警告': 'bg-red-50 text-red-700 border-red-200',
  };
  return colorMap[category] || 'bg-gray-50 text-gray-700 border-gray-200';
}

/**
 * 获取分类渐变背景
 */
export function getCategoryGradient(category: string): string {
  const gradientMap: Record<string, string> = {
    '通知': 'from-slate-800 via-slate-700 to-emerald-900',
    '公告': 'from-emerald-900 via-emerald-800 to-teal-900',
    '指南': 'from-blue-900 via-blue-800 to-indigo-900',
    '案例': 'from-amber-900 via-amber-800 to-orange-900',
    '警告': 'from-red-900 via-red-800 to-rose-900',
  };
  return gradientMap[category] || 'from-slate-800 via-slate-700 to-emerald-900';
}

/**
 * 判断内容是否为富文本
 */
export function isRichText(content: string): boolean {
  return content.includes('<') && content.includes('>');
}

/**
 * 清理文本内容（移除 HTML 标签）
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
