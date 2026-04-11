import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

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
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM notifications ORDER BY sent_at DESC LIMIT 50');
      return NextResponse.json({ success: true, data: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取通知列表失败:', error);
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

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO notifications (title, content, type, recipients, status)
         VALUES ($1, $2, $3, $4, 'sent')
         RETURNING *`,
        [title, content, type || 'system', recipients || 'all']
      );

      // TODO: 实际发送通知（短信/邮件/站内信）
      // 根据recipients筛选目标用户
      // 调用短信/邮件服务发送

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('发送通知失败:', error);
    return NextResponse.json({ error: '发送通知失败' }, { status: 500 });
  }
}
