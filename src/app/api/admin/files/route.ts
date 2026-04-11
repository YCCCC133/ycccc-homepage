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
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (caseId) {
      query = query.eq('case_id', parseInt(caseId));
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // 获取关联的案件编号
    const caseIds = [...new Set((data || []).map(f => f.case_id).filter(Boolean))];
    if (caseIds.length > 0) {
      const { data: casesData } = await client
        .from('cases')
        .select('id, case_number')
        .in('id', caseIds as number[]);
      
      const caseMap = new Map((casesData || []).map(c => [c.id, c.case_number]));
      (data || []).forEach(f => {
        if (f.case_id) {
          (f as Record<string, unknown>).case_number = caseMap.get(f.case_id);
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('获取文件列表失败:', error);
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
        type: type || null,
        size: size || 0,
        case_id: case_id || null,
        uploaded_by: uploaded_by || '管理员',
        url: url || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建文件记录失败:', error);
    return NextResponse.json({ error: '创建文件记录失败' }, { status: 500 });
  }
}
