import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// 获取线索列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const offset = (page - 1) * pageSize;

  const client = getSupabaseClient();

  try {
    let query = client
      .from('reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status && status !== '全部') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('获取线索列表失败:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}

// 更新线索状态
export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('reports')
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新线索失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// 删除线索
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const client = getSupabaseClient();

    if (!id) {
      return NextResponse.json({ error: '缺少ID参数' }, { status: 400 });
    }

    const { error } = await client
      .from('reports')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除线索失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
