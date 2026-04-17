import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取单个案件详情
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
      .from('cases')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error) {
      console.error('[cases/id] Query error:', error);
      return NextResponse.json({ error: '案件不存在' }, { status: 404 });
    }

    // 获取关联的文件
    const { data: filesData } = await client
      .from('files')
      .select('*')
      .eq('case_id', parseInt(id));

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        files: filesData || [],
      },
    });
  } catch (error) {
    console.error('[cases/id] Error:', error);
    return NextResponse.json({ error: '获取案件详情失败' }, { status: 500 });
  }
}

// PUT - 更新案件
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
    const allowedFields = [
      'case_number', 'plaintiff_name', 'plaintiff_phone', 'defendant_name',
      'case_type', 'amount', 'status', 'filing_date', 'close_date', 'handler', 'notes'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('cases')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('[cases/id] Update error:', error);
      return NextResponse.json({ error: '更新案件失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[cases/id] Error:', error);
    return NextResponse.json({ error: '更新案件失败' }, { status: 500 });
  }
}

// DELETE - 删除案件
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
    
    // 先检查案件是否存在
    const { data: existingCase, error: checkError } = await client
      .from('cases')
      .select('id')
      .eq('id', parseInt(id))
      .single();

    if (checkError || !existingCase) {
      return NextResponse.json({ error: '案件不存在' }, { status: 404 });
    }

    // 先删除关联的文件
    await client
      .from('files')
      .delete()
      .eq('case_id', parseInt(id));
    
    // 再删除案件
    const { error: deleteError } = await client
      .from('cases')
      .delete()
      .eq('id', parseInt(id));

    if (deleteError) {
      console.error('[cases/id] Delete error:', deleteError);
      return NextResponse.json({ error: '删除案件失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[cases/id] Error:', error);
    return NextResponse.json({ error: '删除案件失败' }, { status: 500 });
  }
}
