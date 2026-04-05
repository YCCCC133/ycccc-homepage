import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// DELETE - 删除文件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const client = await pool.connect();
    
    try {
      // 获取文件信息
      const fileResult = await client.query('SELECT * FROM files WHERE id = $1', [id]);
      
      if (fileResult.rows.length === 0) {
        return NextResponse.json({ error: '文件不存在' }, { status: 404 });
      }

      // 删除文件记录
      await client.query('DELETE FROM files WHERE id = $1', [id]);

      // 注意：实际删除文件需要调用对象存储API
      // const file = fileResult.rows[0];
      // if (file.url) { ... 删除对象存储中的文件 ... }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    return NextResponse.json({ error: '删除文件失败' }, { status: 500 });
  }
}
