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
        expireTime: 7 * 24 * 60 * 60, // 7 天
      });
    } catch {
      // 如果生成失败，保留原值
    }
  }
  
  return result;
}

// 获取公告列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const publishedOnly = searchParams.get('published_only') !== 'false';
    const bannerOnly = searchParams.get('banner_only') === 'true';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const featuredOnly = searchParams.get('featured_only') === 'true';

    const client = getSupabaseClient();

    let query = client
      .from('announcements')
      .select('id, title, summary, content, category, image_url, is_published, is_top, is_banner, sort_order, author, created_at, updated_at', { count: 'exact' });

    // 过滤条件
    if (publishedOnly) {
      query = query.eq('is_published', true);
    }
    if (bannerOnly) {
      query = query.eq('is_banner', true);
    }
    if (featuredOnly) {
      query = query.or('is_top.eq.true,is_banner.eq.true');
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    // 排序
    const validSortFields: Record<string, string> = {
      'created_at': 'created_at',
      'updated_at': 'updated_at',
      'sort_order': 'sort_order',
      'title': 'title'
    };
    const safeSortBy = validSortFields[sortBy] || 'created_at';
    query = query.order(safeSortBy as any, { ascending: sortOrder.toLowerCase() === 'asc' });
    query = query.order('is_top', { ascending: false });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[announcements] Query error:', error);
      return NextResponse.json({ success: false, error: '获取公告列表失败' }, { status: 500 });
    }

    // 格式化图片 URL
    const formattedData = await Promise.all(
      (data || []).map(item => formatAnnouncement(item as Record<string, unknown>))
    );

    return NextResponse.json({
      success: true,
      data: formattedData,
      total: count ?? 0,
    });
  } catch (error) {
    console.error('[announcements] Error:', error);
    return NextResponse.json({ success: false, error: '获取公告列表失败' }, { status: 500 });
  }
}

// 创建公告
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      summary,
      category,
      image_url,
      author,
      is_published,
      is_top,
      is_banner,
      sort_order
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: '标题不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('announcements')
      .insert({
        title,
        content: content || null,
        summary: summary || null,
        category: category || 'general',
        image_url: image_url || null,
        author: author || '管理员',
        is_published: is_published ?? true,
        is_top: is_top ?? false,
        is_banner: is_banner ?? false,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[announcements] Insert error:', error);
      return NextResponse.json({ success: false, error: '创建公告失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[announcements] Error:', error);
    return NextResponse.json({ success: false, error: '创建公告失败' }, { status: 500 });
  }
}
