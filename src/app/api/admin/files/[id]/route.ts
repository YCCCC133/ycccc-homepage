import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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
  const numId = parseInt(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: '无效的ID' }, { status: 400 });
  }

  try {
    const client = getSupabaseClient();
    
    // 获取文件信息
    const { data: fileData, error: getError } = await client
      .from('files')
      .select('*')
      .eq('id', numId)
      .single();

    if (getError) {
      if (getError.code === 'PGRST116') {
        return NextResponse.json({ error: '文件不存在' }, { status: 404 });
      }
      throw getError;
    }

    // 删除文件记录
    const { error: deleteError } = await client
      .from('files')
      .delete()
      .eq('id', numId);

    if (deleteError) throw deleteError;

    // 注意：实际删除对象存储中的文件需要额外的存储SDK调用
    // 如果需要删除对象存储中的文件，可以使用 S3 SDK

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文件失败:', error);
    return NextResponse.json({ error: '删除文件失败' }, { status: 500 });
  }
}
