import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      applicant_name,
      applicant_phone,
      applicant_id_card,
      application_type,
      case_brief,
      owed_amount,
    } = body;

    // 验证必填字段
    if (!applicant_name || !applicant_phone || !application_type) {
      return NextResponse.json(
        { success: false, error: '请填写完整的申请信息' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('applications')
      .insert({
        applicant_name,
        applicant_phone,
        applicant_id_card: applicant_id_card || null,
        application_type,
        case_brief: case_brief || null,
        owed_amount: owed_amount || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('创建申请失败:', error);
      return NextResponse.json(
        { success: false, error: '提交申请失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        applicant_name: data.applicant_name,
        applicant_phone: data.applicant_phone,
        application_type: data.application_type,
        status: data.status,
        created_at: data.created_at,
      },
      message: '申请提交成功',
    });
  } catch (error) {
    console.error('处理申请失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// GET - 查询申请状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');
    const applicationNumber = searchParams.get('application_number');

    if (!phone && !applicationNumber) {
      return NextResponse.json(
        { success: false, error: '请提供手机号或申请编号' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    let query = client.from('applications').select('*').order('created_at', { ascending: false });

    if (phone) {
      query = query.eq('applicant_phone', phone);
    }
    if (applicationNumber) {
      query = query.eq('application_number', applicationNumber);
    }

    const { data, error } = await query;

    if (error) {
      console.error('查询申请失败:', error);
      return NextResponse.json(
        { success: false, error: '查询失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('处理查询失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
