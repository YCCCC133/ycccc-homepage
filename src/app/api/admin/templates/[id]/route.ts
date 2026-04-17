import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取单个模板
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('templates')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error) {
      console.error('[templates/id] Query error:', error);
      return NextResponse.json({ error: '模板不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[templates/id] Error:', error);
    return NextResponse.json({ error: '获取模板详情失败' }, { status: 500 });
  }
}

// PUT - 更新模板
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    const updateData: Record<string, unknown> = {};
    const allowedFields = ['name', 'type', 'content', 'is_active'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'variables') {
          updateData[field] = JSON.stringify(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (body.variables !== undefined) {
      updateData.variables = JSON.stringify(body.variables);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('templates')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('[templates/id] Update error:', error);
      return NextResponse.json({ error: '更新模板失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[templates/id] Error:', error);
    return NextResponse.json({ error: '更新模板失败' }, { status: 500 });
  }
}

// DELETE - 删除模板
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('templates')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('[templates/id] Delete error:', error);
      return NextResponse.json({ error: '删除模板失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[templates/id] Error:', error);
    return NextResponse.json({ error: '删除模板失败' }, { status: 500 });
  }
}
