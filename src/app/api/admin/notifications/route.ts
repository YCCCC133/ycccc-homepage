import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取通知列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[notifications] Query error:', error);
      return NextResponse.json({ error: '获取通知列表失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[notifications] Error:', error);
    return NextResponse.json({ error: '获取通知列表失败' }, { status: 500 });
  }
}

// POST - 发送通知
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, content, type, recipients } = body;

    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容为必填项' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('notifications')
      .insert({
        title,
        content,
        type: type || 'system',
        recipients: recipients || 'all',
        status: 'sent',
      })
      .select()
      .single();

    if (error) {
      console.error('[notifications] Insert error:', error);
      return NextResponse.json({ error: '发送通知失败' }, { status: 500 });
    }

    // TODO: 实际发送通知（短信/邮件/站内信）
    // 根据recipients筛选目标用户
    // 调用短信/邮件服务发送

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[notifications] Error:', error);
    return NextResponse.json({ error: '发送通知失败' }, { status: 500 });
  }
}
