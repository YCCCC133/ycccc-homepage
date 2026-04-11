import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取系统设置
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 });
  }
}

// PUT - 更新系统设置
export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = body.settings;

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: '参数格式错误' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 使用 upsert 批量更新设置
    const updates = settings.map(s => ({
      key: s.key,
      value: s.value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新设置失败:', error);
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 });
  }
}
