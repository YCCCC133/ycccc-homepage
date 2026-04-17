import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取文书详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少文书ID' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 查询文书详情
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error) {
      console.error('[documents/detail] Query error:', error);
      return NextResponse.json(
        { success: false, error: '文书不存在' },
        { status: 404 }
      );
    }
    
    // 解析 claims JSON
    let claims = null;
    if (data.claims) {
      try {
        claims = typeof data.claims === 'string' ? JSON.parse(data.claims) : data.claims;
      } catch {
        claims = null;
      }
    }
    
    // 解析 form_data JSON
    let formData = null;
    if (data.form_data) {
      try {
        formData = typeof data.form_data === 'string' ? JSON.parse(data.form_data) : data.form_data;
      } catch {
        formData = null;
      }
    }
    
    // 解析 evidence_files JSON
    let evidenceFiles = [];
    if (data.evidence_files) {
      try {
        evidenceFiles = typeof data.evidence_files === 'string' ? JSON.parse(data.evidence_files) : data.evidence_files;
      } catch {
        evidenceFiles = [];
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        claims,
        formData,
        evidenceFiles,
      },
    });
  } catch (error) {
    console.error('[documents/detail] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取文书详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新文书
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少文书ID' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 允许更新的字段
    const allowedFields = [
      'document_type', 'applicant_name', 'applicant_phone',
      'plaintiff_name', 'plaintiff_gender', 'plaintiff_birth_date',
      'plaintiff_nation', 'plaintiff_work_unit', 'plaintiff_position',
      'plaintiff_phone', 'plaintiff_residence', 'plaintiff_habitual_residence',
      'plaintiff_id_type', 'plaintiff_id_card',
      'defendant_name', 'defendant_address', 'defendant_register_address',
      'defendant_legal_person', 'defendant_legal_person_position',
      'defendant_legal_person_phone', 'defendant_credit_code', 'defendant_type',
      'has_agent', 'agent_name', 'agent_unit', 'agent_position',
      'agent_phone', 'agent_permission',
      'claims', 'claim_total_amount',
      'has_preservation', 'preservation_court', 'preservation_date', 'preservation_case_no',
      'contract_sign_info', 'contract_execution_info', 'termination_info',
      'injury_info', 'arbitration_info', 'other_facts', 'legal_basis', 'evidence_list',
      'understand_mediation', 'understand_mediation_benefits', 'consider_mediation',
      'document_content', 'form_data', 'status',
    ];
    
    // 构建更新对象
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    // 更新时间
    updateData.updated_at = new Date().toISOString();
    
    // 更新文书
    const { data, error } = await client
      .from('documents')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) {
      console.error('[documents/detail] Update error:', error);
      return NextResponse.json(
        { success: false, error: '更新文书失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[documents/detail] Error:', error);
    return NextResponse.json(
      { success: false, error: '更新文书失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除文书（仅允许删除草稿状态的文书）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少文书ID' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 先查询文书状态
    const { data: existing, error: queryError } = await client
      .from('documents')
      .select('status')
      .eq('id', parseInt(id))
      .single();
    
    if (queryError || !existing) {
      return NextResponse.json(
        { success: false, error: '文书不存在' },
        { status: 404 }
      );
    }
    
    // 仅允许删除草稿
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: '仅允许删除草稿状态的文书' },
        { status: 403 }
      );
    }
    
    // 删除文书
    const { error } = await client
      .from('documents')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      console.error('[documents/detail] Delete error:', error);
      return NextResponse.json(
        { success: false, error: '删除文书失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '文书已删除',
    });
  } catch (error) {
    console.error('[documents/detail] Error:', error);
    return NextResponse.json(
      { success: false, error: '删除文书失败' },
      { status: 500 }
    );
  }
}
