import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// 安全的数据库查询，带错误处理
async function safeQuery<T>(
  queryFn: () => any
): Promise<{ data: T | null; error: string | null }> {
  try {
    const result = await queryFn();
    if (result.error) {
      console.error('数据库查询错误:', result.error);
      return { data: null, error: result.error.message || '查询失败' };
    }
    return { data: result.data as T, error: null };
  } catch (err: any) {
    console.error('查询异常:', err);
    return { data: null, error: err?.message || '查询异常' };
  }
}

// 安全的计数查询
async function safeCount(
  queryFn: () => any
): Promise<number> {
  try {
    const result = await queryFn();
    if (result.error) {
      console.error('计数查询错误:', result.error);
      return 0;
    }
    return result.count || 0;
  } catch (err) {
    console.error('计数异常:', err);
    return 0;
  }
}

export async function GET(request: NextRequest) {
  console.log('[admin/data] Request received');
  
  if (!isAuthenticated(request)) {
    console.log('[admin/data] Unauthorized access attempt');
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const status = searchParams.get('status');
  const offset = (page - 1) * pageSize;

  let client;
  try {
    client = getSupabaseClient();
    console.log('[admin/data] Supabase client initialized');
  } catch (err: any) {
    console.error('[admin/data] Failed to initialize Supabase client:', err);
    return NextResponse.json({ 
      error: '数据库连接失败', 
      details: err?.message || '初始化失败',
      stats: { reports: 0, applications: 0, documents: 0, consultations: 0 }
    }, { status: 500 });
  }

  const result: Record<string, unknown> = {};
  const errors: string[] = [];

  try {
    if (type === 'all' || type === 'stats') {
      console.log('[admin/data] Fetching stats...');
      
      // 并行获取统计数据
      const [reportsRes, applicationsRes, documentsRes, consultationsRes] = await Promise.all([
        safeCount(() => client!.from('reports').select('*', { count: 'exact', head: true })),
        safeCount(() => client!.from('applications').select('*', { count: 'exact', head: true })),
        safeCount(() => client!.from('documents').select('*', { count: 'exact', head: true })),
        safeCount(() => client!.from('consultations').select('*', { count: 'exact', head: true })),
      ]);

      const [pendingReports, pendingApplications] = await Promise.all([
        safeCount(() => client!.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
        safeCount(() => client!.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
      ]);

      // 获取案件统计
      const casesResult = await safeQuery<any[]>(
        () => client!.from('cases').select('amount, case_type, created_at')
      );
      
      const casesData = casesResult.data || [];
      
      if (casesResult.error) {
        errors.push('案件统计: ' + casesResult.error);
      }

      const casesArray = Array.isArray(casesData) ? casesData : [];
      const totalAmount = casesArray.reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0);
      
      const caseTypeDistribution: Record<string, number> = {};
      casesArray.forEach((c: any) => {
        if (c.case_type) {
          caseTypeDistribution[c.case_type] = (caseTypeDistribution[c.case_type] || 0) + 1;
        }
      });

      // 月度趋势统计
      const monthlyTrend: { month: string; count: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `${date.getMonth() + 1}月`;
        const count = casesArray.filter((c: any) => c.created_at && c.created_at.startsWith(monthStr)).length;
        monthlyTrend.push({ month: monthLabel, count });
      }

      result.stats = {
        reports: reportsRes,
        applications: applicationsRes,
        documents: documentsRes,
        consultations: consultationsRes,
        pendingReports,
        pendingApplications,
        totalAmount,
        caseTypeDistribution,
        monthlyTrend,
        helpedWorkers: reportsRes,
        avgProcessingDays: 7,
        successRate: 98.6,
      };
      
      console.log('[admin/data] Stats fetched:', result.stats);
    }

    if (type === 'all' || type === 'reports') {
      console.log('[admin/data] Fetching reports...');
      try {
        const { data, error, count } = await client!
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
        
        if (error) {
          errors.push('线索列表: ' + error.message);
        } else {
          result.reports = data || [];
          result.reportsTotal = count ?? 0;
        }
      } catch (e: any) {
        errors.push('线索列表异常: ' + e.message);
        result.reports = [];
        result.reportsTotal = 0;
      }
    }

    if (type === 'all' || type === 'applications') {
      console.log('[admin/data] Fetching applications...');
      try {
        const { data, error, count } = await client!
          .from('applications')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
        
        if (error) {
          errors.push('申请列表: ' + error.message);
        } else {
          result.applications = data || [];
          result.applicationsTotal = count ?? 0;
        }
      } catch (e: any) {
        errors.push('申请列表异常: ' + e.message);
        result.applications = [];
        result.applicationsTotal = 0;
      }
    }

    if (type === 'all' || type === 'documents') {
      console.log('[admin/data] Fetching documents...');
      try {
        const { data, error, count } = await client!
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
        
        if (error) {
          errors.push('文书列表: ' + error.message);
        } else {
          result.documents = data || [];
          result.documentsTotal = count ?? 0;
        }
      } catch (e: any) {
        errors.push('文书列表异常: ' + e.message);
        result.documents = [];
        result.documentsTotal = 0;
      }
    }

    if (type === 'all' || type === 'consultations') {
      console.log('[admin/data] Fetching consultations...');
      try {
        const { data, error, count } = await client!
          .from('consultations')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
        
        if (error) {
          errors.push('咨询列表: ' + error.message);
        } else {
          result.consultations = data || [];
          result.consultationsTotal = count ?? 0;
        }
      } catch (e: any) {
        errors.push('咨询列表异常: ' + e.message);
        result.consultations = [];
        result.consultationsTotal = 0;
      }
    }

    // 即使有部分错误，也返回成功响应
    if (errors.length > 0) {
      console.log('[admin/data] Partial errors:', errors);
      result.partialErrors = errors;
    }

    console.log('[admin/data] Success, returning result');
    return NextResponse.json({ ...result, success: true });
    
  } catch (error: any) {
    console.error('[admin/data] Fatal error:', error);
    return NextResponse.json({ 
      error: '获取数据失败', 
      details: error?.message || '未知错误',
      stats: result.stats || { reports: 0, applications: 0, documents: 0, consultations: 0 }
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { type, id, data } = await request.json();
    const client = getSupabaseClient();

    if (!type || !id || !data) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    let table = '';
    if (type === 'report') table = 'reports';
    else if (type === 'application') table = 'applications';
    else {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 });
    }

    const allowedFields = type === 'report' 
      ? ['name', 'phone', 'id_card', 'company_name', 'company_address', 'owed_amount', 'owed_months', 'worker_count', 'description', 'evidence', 'status', 'source']
      : ['name', 'phone', 'id_card', 'type', 'company_name', 'company_address', 'salary_amount', 'salary_months', 'description', 'status', 'source'];
    
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }
    updateData.updated_at = new Date().toISOString();

    const { error } = await client.from(table).update(updateData).eq('id', id);
    if (error) {
      console.error('更新失败:', error);
      return NextResponse.json({ error: '更新失败', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('更新异常:', error);
    return NextResponse.json({ error: '更新失败', details: error?.message }, { status: 500 });
  }
}
