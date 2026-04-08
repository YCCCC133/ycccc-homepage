import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取知识库内容供智能咨询使用
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q'); // 搜索关键词

    const client = getSupabaseClient();
    let dbQuery = client
      .from('knowledge_base')
      .select('title, content, category, tags')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (query) {
      // 模糊搜索相关知识
      dbQuery = client
        .from('knowledge_base')
        .select('title, content, category, tags')
        .eq('is_active', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('获取知识库失败:', error);
      return NextResponse.json({ success: false, data: [] });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('处理请求失败:', error);
    return NextResponse.json({ success: false, data: [] });
  }
}
