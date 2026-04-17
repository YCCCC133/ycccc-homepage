import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取所有设置和操作日志
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const client = getSupabaseClient();
    
    // 获取设置
    const { data: settingsData, error: settingsError } = await client
      .from('settings')
      .select('*')
      .order('key');

    if (settingsError) {
      console.error('[settings] Query settings error:', settingsError);
    }
    
    // 获取最近10条操作日志
    const { data: logsData, error: logsError } = await client
      .from('operation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('[settings] Query logs error:', logsError);
    }
      
    return NextResponse.json({ 
      success: true, 
      data: settingsData || [],
      logs: logsData || [],
    });
  } catch (error) {
    console.error('[settings] Error:', error);
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 });
  }
}

// PUT - 批量更新设置
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

    // 逐个更新设置（Supabase upsert）
    for (const setting of settings) {
      // 先查询是否存在
      const { data: existing } = await client
        .from('settings')
        .select('id')
        .eq('key', setting.key)
        .maybeSingle();

      if (existing) {
        // 更新
        await client
          .from('settings')
          .update({ 
            value: setting.value, 
            updated_at: new Date().toISOString() 
          })
          .eq('key', setting.key);
      } else {
        // 插入
        await client
          .from('settings')
          .insert({ 
            key: setting.key, 
            value: setting.value,
            updated_at: new Date().toISOString(),
          });
      }
    }

    // 记录操作日志
    await client
      .from('operation_logs')
      .insert({
        action: '更新系统设置',
        type: 'update',
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[settings] Error:', error);
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 });
  }
}
