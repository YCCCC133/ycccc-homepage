import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// 获取公告列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const category = searchParams.get('category');
  const offset = (page - 1) * pageSize;

  const client = getSupabaseClient();

  try {
    let query = client
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (category && category !== '全部') {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}

// 创建公告
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('announcements')
      .insert({
        title: body.title,
        content: body.content,
        category: body.category || '平台公告',
        is_published: body.is_published ?? true,
        is_top: body.is_top ?? false,
        is_banner: body.is_banner ?? false,
        image_url: body.image_url || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建公告失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

// 更新公告
export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('announcements')
      .update({
        title: body.title,
        content: body.content,
        category: body.category,
        is_published: body.is_published,
        is_top: body.is_top,
        is_banner: body.is_banner,
        image_url: body.image_url,
        sort_order: body.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新公告失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// 删除公告
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
      .from('announcements')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除公告失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
