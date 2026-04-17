import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取知识库详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('knowledge_base')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) {
      console.error('[knowledge/id] Query error:', error);
      return NextResponse.json({ error: '知识库条目不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[knowledge/id] Error:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}

// PUT - 更新知识库条目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      category,
      court,
      case_number,
      parties,
      case_type,
      procedure_type,
      result,
      summary,
      full_text,
      is_active
    } = body;

    const client = getSupabaseClient();
    
    const updateData: Record<string, unknown> = {};
    if (category !== undefined) updateData.category = category;
    if (court !== undefined) updateData.court = court;
    if (case_number !== undefined) updateData.case_number = case_number;
    if (parties !== undefined) updateData.parties = parties;
    if (case_type !== undefined) updateData.case_type = case_type;
    if (procedure_type !== undefined) updateData.procedure_type = procedure_type;
    if (result !== undefined) updateData.result = result;
    if (summary !== undefined) updateData.summary = summary;
    if (full_text !== undefined) updateData.full_text = full_text;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('knowledge_base')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('[knowledge/id] Update error:', error);
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[knowledge/id] Error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE - 删除知识库条目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('knowledge_base')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('[knowledge/id] Delete error:', error);
      return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[knowledge/id] Error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
