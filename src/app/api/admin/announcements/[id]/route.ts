import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// 获取单个公告详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;
  const numId = parseInt(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: '无效的ID' }, { status: 400 });
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('announcements')
      .select('*')
      .eq('id', numId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '公告不存在' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取公告详情失败:', error);
    return NextResponse.json({ error: '获取公告详情失败' }, { status: 500 });
  }
}

// 更新公告
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;
  const numId = parseInt(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: '无效的ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    
    const allowedFields = ['title', 'content', 'category', 'image_url', 'summary', 'author', 'is_published', 'is_top', 'is_banner', 'sort_order'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('announcements')
      .update(updateData)
      .eq('id', numId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: '公告不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新公告失败:', error);
    return NextResponse.json({ error: '更新公告失败' }, { status: 500 });
  }
}

// 删除公告
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;
  const numId = parseInt(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: '无效的ID' }, { status: 400 });
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('announcements')
      .delete()
      .eq('id', numId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除公告失败:', error);
    return NextResponse.json({ error: '删除公告失败' }, { status: 500 });
  }
}
