import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取模板列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[templates] Query error:', error);
      return NextResponse.json({ error: '获取模板列表失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[templates] Error:', error);
    return NextResponse.json({ error: '获取模板列表失败' }, { status: 500 });
  }
}

// POST - 创建模板
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, content, variables, is_active } = body;

    if (!name || !type) {
      return NextResponse.json({ error: '模板名称和类型为必填项' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('templates')
      .insert({
        name,
        type,
        content: content || null,
        variables: variables ? JSON.stringify(variables) : null,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('[templates] Insert error:', error);
      return NextResponse.json({ error: '创建模板失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[templates] Error:', error);
    return NextResponse.json({ error: '创建模板失败' }, { status: 500 });
  }
}
