import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取知识库列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');

    const offset = (page - 1) * pageSize;

    const client = getSupabaseClient();
    let query = client
      .from('knowledge_base')
      .select('id, category, court, case_number, parties, case_type, procedure_type, result, summary, is_active, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (category) {
      query = query.eq('category', category);
    }
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (search) {
      query = query.or(`case_number.ilike.%${search}%,parties.ilike.%${search}%,summary.ilike.%${search}%,full_text.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[knowledge] Query error:', error);
      return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[knowledge] Error:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}

// POST - 创建知识库条目
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
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

    if (!case_number) {
      return NextResponse.json({ error: '案号不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('knowledge_base')
      .insert({
        category: category || 'general',
        court: court || null,
        case_number,
        parties: parties || null,
        case_type: case_type || null,
        procedure_type: procedure_type || null,
        result: result || null,
        summary: summary || null,
        full_text: full_text || null,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('[knowledge] Insert error:', error);
      return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[knowledge] Error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
