import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取文件列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('case_id');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const offset = (page - 1) * pageSize;

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('files')
      .select('id, name, type, size, case_id, uploaded_by, url, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (caseId) {
      query = query.eq('case_id', parseInt(caseId));
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[files] Query error:', error);
      return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  } catch (error) {
    console.error('[files] Error:', error);
    return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 });
  }
}

// POST - 创建文件记录（实际上传需要配合对象存储）
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      type,
      size,
      case_id,
      uploaded_by,
      url,
    } = body;

    if (!name) {
      return NextResponse.json({ error: '文件名为必填项' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('files')
      .insert({
        name,
        type: type || 'document',
        size: size || 0,
        case_id: case_id ? parseInt(case_id) : null,
        uploaded_by: uploaded_by || '管理员',
        url: url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[files] Insert error:', error);
      return NextResponse.json({ error: '创建文件记录失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[files] Error:', error);
    return NextResponse.json({ error: '创建文件记录失败' }, { status: 500 });
  }
}
