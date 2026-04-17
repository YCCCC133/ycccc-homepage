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

  try {
    const client = getSupabaseClient();
    
    // 先检查文件是否存在
    const { data: existingFile, error: checkError } = await client
      .from('files')
      .select('id, url')
      .eq('id', parseInt(id))
      .single();
    
    if (checkError || !existingFile) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 删除文件记录
    const { error: deleteError } = await client
      .from('files')
      .delete()
      .eq('id', parseInt(id));

    if (deleteError) {
      console.error('[files/id] Delete error:', deleteError);
      return NextResponse.json({ error: '删除文件失败' }, { status: 500 });
    }

    // 注意：实际删除文件需要调用对象存储API
    // const file = existingFile;
    // if (file.url) { ... 删除对象存储中的文件 ... }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[files/id] Error:', error);
    return NextResponse.json({ error: '删除文件失败' }, { status: 500 });
  }
}
