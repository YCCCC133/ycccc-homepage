import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const status = searchParams.get('status');
  const offset = (page - 1) * pageSize;

  const client = getSupabaseClient();

  try {
    const result: Record<string, unknown> = {};

    if (type === 'all' || type === 'stats') {
      // 获取统计数据
      const [reportsCount, applicationsCount, documentsCount, consultationsCount] = await Promise.all([
        client.from('reports').select('*', { count: 'exact', head: true }),
        client.from('applications').select('*', { count: 'exact', head: true }),
        client.from('documents').select('*', { count: 'exact', head: true }),
        client.from('consultations').select('*', { count: 'exact', head: true }),
      ]);

      // 待处理数量
      const [pendingReports, pendingApplications] = await Promise.all([
        client.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        client.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      result.stats = {
        reports: reportsCount.count || 0,
        applications: applicationsCount.count || 0,
        documents: documentsCount.count || 0,
        consultations: consultationsCount.count || 0,
        pendingReports: pendingReports.count || 0,
        pendingApplications: pendingApplications.count || 0,
      };
    }

    if (type === 'all' || type === 'reports') {
      let query = client
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      result.reports = data;
      result.reportsTotal = count ?? 0;
    }

    if (type === 'all' || type === 'applications') {
      let query = client
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      result.applications = data;
      result.applicationsTotal = count ?? 0;
    }

    if (type === 'all' || type === 'documents') {
      const { data, error, count } = await client
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      result.documents = data;
      result.documentsTotal = count ?? 0;
    }

    if (type === 'all' || type === 'consultations') {
      const { data, error, count } = await client
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      result.consultations = data;
      result.consultationsTotal = count ?? 0;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取数据失败:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
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

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from(table).update(updateData).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新数据失败:', error);
    return NextResponse.json({ error: '更新数据失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const client = getSupabaseClient();

    let table = '';
    if (type === 'report') table = 'reports';
    else if (type === 'application') table = 'applications';
    else if (type === 'document') table = 'documents';
    else if (type === 'consultation') table = 'consultations';
    else {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 });
    }

    const { error } = await client.from(table).delete().eq('id', parseInt(id));
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除数据失败:', error);
    return NextResponse.json({ error: '删除数据失败' }, { status: 500 });
  }
}
