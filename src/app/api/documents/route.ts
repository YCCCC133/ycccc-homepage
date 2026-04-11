import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取文书列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');

    const client = getSupabaseClient();
    
    let query = client
      .from('documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('document_type', type);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('获取文书列表失败:', error);
    return NextResponse.json({ error: '获取文书列表失败' }, { status: 500 });
  }
}

// 创建文书记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_type, document_content, applicant_name, applicant_phone, template_used } = body;

    if (!document_type) {
      return NextResponse.json(
        { success: false, error: '文书类型不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('documents')
      .insert({
        document_type,
        document_content: document_content || '',
        applicant_name: applicant_name || '',
        applicant_phone: applicant_phone || '',
        template_used: template_used || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('创建文书记录失败:', error);
    return NextResponse.json(
      { success: false, error: '创建文书记录失败' },
      { status: 500 }
    );
  }
}
