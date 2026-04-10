import { NextRequest, NextResponse } from 'next/server';
import { uploadDocument } from '@/storage/s3-storage';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 上传文件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_id, content, file_name } = body;

    if (!document_id || !content) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 上传到对象存储
    const { key, url } = await uploadDocument(content, file_name || `document_${document_id}.txt`);

    // 更新数据库记录
    const client = getSupabaseClient();
    const { error: updateError } = await client
      .from('documents')
      .update({
        file_key: key,
        file_name: file_name || `document_${document_id}.txt`,
        file_size: Buffer.byteLength(content, 'utf-8'),
      })
      .eq('id', document_id);

    if (updateError) {
      console.error('更新文书文件信息失败:', updateError);
      // 即使数据库更新失败，也返回成功（文件已上传）
    }

    return NextResponse.json({
      success: true,
      data: {
        file_key: key,
        download_url: url,
        file_name: file_name,
      },
      message: '文件上传成功',
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    return NextResponse.json(
      { success: false, error: '文件上传失败' },
      { status: 500 }
    );
  }
}

// 获取文件下载链接
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('document_id');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: '缺少文书ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('documents')
      .select('file_key, file_name')
      .eq('id', parseInt(documentId))
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: '查询失败' },
        { status: 500 }
      );
    }

    if (!data || !data.file_key) {
      return NextResponse.json(
        { success: false, error: '文件不存在' },
        { status: 404 }
      );
    }

    // 导入并使用 getDocumentUrl
    const { getDocumentUrl } = await import('@/storage/s3-storage');
    const downloadUrl = await getDocumentUrl(data.file_key);

    return NextResponse.json({
      success: true,
      data: {
        download_url: downloadUrl,
        file_name: data.file_name,
      },
    });
  } catch (error) {
    console.error('获取下载链接失败:', error);
    return NextResponse.json(
      { success: false, error: '获取下载链接失败' },
      { status: 500 }
    );
  }
}
