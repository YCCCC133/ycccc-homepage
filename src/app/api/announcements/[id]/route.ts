import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化存储
const storage = process.env.COZE_BUCKET_ENDPOINT_URL ? new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  bucketName: process.env.COZE_BUCKET_NAME,
}) : null;

// 格式化公告数据，生成图片 URL
async function formatAnnouncement(item: Record<string, unknown>): Promise<Record<string, unknown>> {
  const result = { ...item };
  
  // 如果有图片 URL 且是 key（不以 http 开头），则生成签名 URL
  if (item.image_url && typeof item.image_url === 'string' && !item.image_url.startsWith('http') && storage) {
    try {
      result.image_url = await storage.generatePresignedUrl({
        key: item.image_url,
        expireTime: 7 * 24 * 60 * 60,
      });
    } catch {
      // 忽略错误，保留原值
    }
  }
  
  return result;
}

// 获取公告详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('announcements')
      .select('id, title, summary, content, category, image_url, is_published, is_top, is_banner, sort_order, author, created_at, updated_at')
      .eq('id', parseInt(id))
      .single();

    if (error) {
      console.error('[announcements/id] Query error:', error);
      return NextResponse.json({ success: false, error: '公告不存在' }, { status: 404 });
    }
    
    const formatted = await formatAnnouncement(data as Record<string, unknown>);
    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[announcements/id] Error:', error);
    return NextResponse.json({ success: false, error: '获取公告详情失败' }, { status: 500 });
  }
}

// 更新公告
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      content,
      summary,
      category,
      is_published,
      image_url,
      author,
      is_top,
      is_banner,
      sort_order
    } = body;

    const client = getSupabaseClient();
    
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (category !== undefined) updateData.category = category;
    if (is_published !== undefined) updateData.is_published = is_published;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (author !== undefined) updateData.author = author;
    if (is_top !== undefined) updateData.is_top = is_top;
    if (is_banner !== undefined) updateData.is_banner = is_banner;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('announcements')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('[announcements/id] Update error:', error);
      return NextResponse.json({ success: false, error: '更新公告失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[announcements/id] Error:', error);
    return NextResponse.json({ success: false, error: '更新公告失败' }, { status: 500 });
  }
}

// 删除公告
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('announcements')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('[announcements/id] Delete error:', error);
      return NextResponse.json({ success: false, error: '删除公告失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[announcements/id] Error:', error);
    return NextResponse.json({ success: false, error: '删除公告失败' }, { status: 500 });
  }
}
