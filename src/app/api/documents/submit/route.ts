import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';

// 获取 Storage 客户端
function getStorage() {
  return new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });
}

// 上传文件到 Storage
async function uploadFile(fileData: string, fileName: string, docId: number): Promise<string | null> {
  try {
    // 解析 base64 数据
    const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error('[documents/submit] Invalid base64 format');
      return null;
    }
    
    const mimeType = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    const storage = getStorage();
    const key = `documents/${docId}/${fileName}`;
    
    await storage.uploadFile({
      fileContent: data,
      fileName: key,
      contentType: mimeType,
    });
    
    // 生成可访问的 URL
    const url = await storage.generatePresignedUrl({
      key: key,
      expireTime: 86400 * 365, // 1年有效期
    });
    
    console.log(`[documents/submit] File uploaded: ${key}`);
    return url;
  } catch (error) {
    console.error('[documents/submit] File upload error:', error);
    return null;
  }
}

// POST - 提交并保存文书
export async function POST(request: NextRequest) {
  console.log('[documents/submit] POST request received');
  
  try {
    const body = await request.json();
    console.log('[documents/submit] Request body keys:', Object.keys(body));
    
    const {
      // 基础信息
      document_type,
      applicant_name,
      applicant_phone,
      document_content,
      
      // 原告信息
      plaintiff_name,
      plaintiff_gender,
      plaintiff_birth_date,
      plaintiff_nation,
      plaintiff_work_unit,
      plaintiff_position,
      plaintiff_phone,
      plaintiff_residence,
      plaintiff_habitual_residence,
      plaintiff_id_type,
      plaintiff_id_card,
      
      // 被告信息
      defendant_name,
      defendant_address,
      defendant_register_address,
      defendant_legal_person,
      defendant_legal_person_position,
      defendant_legal_person_phone,
      defendant_credit_code,
      defendant_type,
      
      // 代理人
      has_agent,
      agent_name,
      agent_unit,
      agent_position,
      agent_phone,
      agent_permission,
      
      // 诉讼请求
      claims,
      claim_total_amount,
      
      // 诉前保全
      has_preservation,
      preservation_court,
      preservation_date,
      preservation_case_no,
      
      // 事实与理由
      contract_sign_info,
      contract_execution_info,
      termination_info,
      injury_info,
      arbitration_info,
      other_facts,
      legal_basis,
      evidence_list,
      
      // 调解意愿
      understand_mediation,
      understand_mediation_benefits,
      consider_mediation,
      
      // 文件（base64 格式）
      id_card_front,
      id_card_back,
      evidence_files,
      signature,
      
      // 完整表单数据
      form_data,
    } = body;

    // 验证必填字段
    if (!applicant_name || !plaintiff_phone) {
      console.log('[documents/submit] Missing required fields');
      return NextResponse.json(
        { success: false, error: '请填写完整的申请人信息' },
        { status: 400 }
      );
    }

    console.log('[documents/submit] Inserting into documents table...');
    
    // 使用 service role key 以绕过 RLS
    const client = getSupabaseServiceRoleClient();
    
    // 生成文书编号
    const docNumber = `WS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // 首先插入文书记录（不带文件 URL）
    const { data, error } = await client
      .from('documents')
      .insert({
        document_type: document_type || '民事起诉状',
        applicant_name,
        applicant_phone,
        document_content,
        doc_number: docNumber,
        
        // 原告信息
        plaintiff_name,
        plaintiff_gender,
        plaintiff_birth_date: plaintiff_birth_date || null,
        plaintiff_nation,
        plaintiff_work_unit,
        plaintiff_position,
        plaintiff_phone,
        plaintiff_residence,
        plaintiff_habitual_residence,
        plaintiff_id_type,
        plaintiff_id_card,
        
        // 被告信息
        defendant_name,
        defendant_address,
        defendant_register_address,
        defendant_legal_person,
        defendant_legal_person_position,
        defendant_legal_person_phone,
        defendant_credit_code,
        defendant_type,
        
        // 代理人
        has_agent: has_agent || false,
        agent_name,
        agent_unit,
        agent_position,
        agent_phone,
        agent_permission,
        
        // 诉讼请求 - claims 需要是对象格式
        claims: claims ? (typeof claims === 'string' ? JSON.parse(claims) : claims) : null,
        claim_total_amount: claim_total_amount ? parseFloat(String(claim_total_amount)) : null,
        
        // 诉前保全
        has_preservation: has_preservation || false,
        preservation_court,
        preservation_date: preservation_date || null,
        preservation_case_no,
        
        // 事实与理由
        contract_sign_info,
        contract_execution_info,
        termination_info,
        injury_info,
        arbitration_info,
        other_facts,
        legal_basis,
        evidence_list,
        
        // 调解意愿
        understand_mediation,
        understand_mediation_benefits,
        consider_mediation,
        
        // 完整表单数据
        form_data: form_data || null,
        
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[documents/submit] Insert error:', error);
      return NextResponse.json(
        { success: false, error: `保存文书失败: ${error.message}` },
        { status: 500 }
      );
    }

    const docId = data.id;
    console.log(`[documents/submit] Document inserted with ID: ${docId}`);

    // 上传文件（如果有）
    const uploadedUrls: Record<string, string> = {};
    
    if (signature && signature.startsWith('data:')) {
      const signatureUrl = await uploadFile(signature, 'signature.png', docId);
      if (signatureUrl) {
        uploadedUrls.signature_url = signatureUrl;
      }
    }
    
    if (id_card_front && id_card_front.startsWith('data:')) {
      const frontUrl = await uploadFile(id_card_front, 'id_card_front.png', docId);
      if (frontUrl) {
        uploadedUrls.id_card_front_url = frontUrl;
      }
    }
    
    if (id_card_back && id_card_back.startsWith('data:')) {
      const backUrl = await uploadFile(id_card_back, 'id_card_back.png', docId);
      if (backUrl) {
        uploadedUrls.id_card_back_url = backUrl;
      }
    }
    
    // 上传证据文件
    if (evidence_files && Array.isArray(evidence_files)) {
      const evidenceUrls: string[] = [];
      for (let i = 0; i < evidence_files.length; i++) {
        const file = evidence_files[i];
        if (file && file.startsWith('data:')) {
          const ext = file.match(/^data:([^;]+);base64,/)?.[1]?.split('/')[1] || 'png';
          const evidenceUrl = await uploadFile(file, `evidence_${i + 1}.${ext}`, docId);
          if (evidenceUrl) {
            evidenceUrls.push(evidenceUrl);
          }
        }
      }
      if (evidenceUrls.length > 0) {
        uploadedUrls.evidence_files = JSON.stringify(evidenceUrls);
      }
    }

    // 更新文书记录，添加文件 URL
    if (Object.keys(uploadedUrls).length > 0) {
      const updateData: Record<string, string> = {};
      if (uploadedUrls.signature_url) updateData.signature_url = uploadedUrls.signature_url;
      if (uploadedUrls.id_card_front_url) updateData.id_card_front_url = uploadedUrls.id_card_front_url;
      if (uploadedUrls.id_card_back_url) updateData.id_card_back_url = uploadedUrls.id_card_back_url;
      if (uploadedUrls.evidence_files) updateData.evidence_files = uploadedUrls.evidence_files;
      
      await client
        .from('documents')
        .update(updateData)
        .eq('id', docId);
      
      console.log(`[documents/submit] Files uploaded and URLs updated`);
    }

    console.log('[documents/submit] Document submitted successfully');
    
    return NextResponse.json({
      success: true,
      data: {
        id: docId,
        doc_number: docNumber,
        document_type: document_type,
        status: 'pending',
        message: '文书已保存，等待审核',
      },
    });
  } catch (error) {
    console.error('[documents/submit] Error:', error);
    return NextResponse.json(
      { success: false, error: '提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}
