import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseServiceRoleClient } from '@/storage/database/supabase-client';
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
async function uploadFile(fileData: string, fileName: string, applicationId: number): Promise<string | null> {
  try {
    // 解析 base64 数据
    const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error('[apply] Invalid base64 format');
      return null;
    }
    
    const mimeType = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    const storage = getStorage();
    const key = `applications/${applicationId}/${fileName}`;
    
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
    
    console.log(`[apply] File uploaded: ${key}`);
    return url;
  } catch (error) {
    console.error('[apply] File upload error:', error);
    return null;
  }
}

// POST - 创建申请
export async function POST(request: NextRequest) {
  console.log('[apply] POST request received');
  
  try {
    const body = await request.json();
    console.log('[apply] Request body keys:', Object.keys(body));
    
    const {
      // 基础信息
      applicant_name,
      applicant_phone,
      applicant_id_card,
      application_type,
      case_brief,
      unpaid_amount,
      unpaid_months,
      defendant_name,
      applicant_address,
      
      // 支持起诉扩展字段
      birth_date,
      age,
      household_address,
      work_start_date,
      work_end_date,
      work_location_type,
      work_location,
      work_street,
      defendant_contact,
      unpaid_calculation,
      has_agent,
      agent_name,
      agent_phone,
      agent_id_card,
      evidence_types,
      
      // 文件（base64 格式）
      signature,
      id_card_front,
      id_card_back,
      evidence_files,
    } = body;

    // 验证必填字段
    if (!applicant_name || !applicant_phone || !application_type) {
      console.log('[apply] Missing required fields');
      return NextResponse.json(
        { success: false, error: '请填写完整的申请信息' },
        { status: 400 }
      );
    }

    console.log('[apply] Inserting into applications table...');
    
    // 使用 service role key 以绕过 RLS
    const client = getSupabaseServiceRoleClient();
    
    // 首先插入申请记录（不带文件 URL）
    const { data, error } = await client
      .from('applications')
      .insert({
        applicant_name,
        applicant_phone,
        applicant_id_card: applicant_id_card || null,
        applicant_address: applicant_address || null,
        application_type,
        case_brief: case_brief || null,
        owed_amount: unpaid_amount || null,
        status: 'pending',
        
        // 支持起诉扩展字段
        birth_date: birth_date || null,
        age: age ? parseInt(age) : null,
        household_address: household_address || null,
        work_start_date: work_start_date || null,
        work_end_date: work_end_date || null,
        work_location_type: work_location_type || null,
        work_location: work_location || null,
        work_street: work_street || null,
        defendant_name: defendant_name || null,
        defendant_contact: defendant_contact || null,
        unpaid_calculation: unpaid_calculation || null,
        has_agent: has_agent || false,
        agent_name: agent_name || null,
        agent_phone: agent_phone || null,
        agent_id_card: agent_id_card || null,
        evidence_types: evidence_types || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[apply] Insert error:', error);
      return NextResponse.json(
        { success: false, error: `提交申请失败: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('[apply] Application inserted, id:', data.id);
    
    // 生成申请编号
    const applicationNumber = `SQ${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(data.id).padStart(6, '0')}`;
    
    // 上传文件并更新记录
    const fileUpdates: Record<string, string> = {};
    
    if (signature) {
      const url = await uploadFile(signature, 'signature.png', data.id);
      if (url) fileUpdates.signature_url = url;
    }
    
    if (id_card_front) {
      const url = await uploadFile(id_card_front, 'id_card_front.png', data.id);
      if (url) fileUpdates.id_card_front_url = url;
    }
    
    if (id_card_back) {
      const url = await uploadFile(id_card_back, 'id_card_back.png', data.id);
      if (url) fileUpdates.id_card_back_url = url;
    }
    
    // 上传证据文件
    if (evidence_files && Array.isArray(evidence_files)) {
      for (let i = 0; i < evidence_files.length; i++) {
        const file = evidence_files[i];
        if (file && typeof file === 'string') {
          const ext = file.match(/^data:([^;]+);base64,/)?.[1]?.split('/')[1] || 'png';
          const url = await uploadFile(file, `evidence_${i + 1}.${ext}`, data.id);
          if (url) {
            // 同时插入 files 表记录
            await client.from('files').insert({
              application_id: data.id,
              file_type: 'evidence',
              file_name: `evidence_${i + 1}.${ext}`,
              file_url: url,
            });
          }
        }
      }
    }
    
    // 更新申请记录，添加文件 URL
    if (Object.keys(fileUpdates).length > 0) {
      await client
        .from('applications')
        .update(fileUpdates)
        .eq('id', data.id);
    }
    
    // 更新申请编号
    await client
      .from('applications')
      .update({ case_brief: `${applicationNumber}\n${case_brief || ''}` })
      .eq('id', data.id);

    console.log('[apply] Application created successfully:', data.id);

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        application_number: applicationNumber,
        applicant_name: data.applicant_name,
        applicant_phone: data.applicant_phone,
        application_type: data.application_type,
        status: data.status,
        created_at: data.created_at,
      },
      message: '申请提交成功',
    });
  } catch (error: any) {
    console.error('[apply] Error:', error);
    return NextResponse.json(
      { success: false, error: `服务器错误: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET - 查询申请状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');
    const id = searchParams.get('id');

    if (!phone && !id) {
      return NextResponse.json(
        { success: false, error: '请提供手机号或申请ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    let query = client.from('applications').select('*').order('created_at', { ascending: false });
    
    if (id) {
      query = query.eq('id', parseInt(id));
    } else if (phone) {
      query = query.eq('applicant_phone', phone);
    }

    const { data, error } = await query;

    if (error) {
      console.error('查询申请失败:', error);
      return NextResponse.json(
        { success: false, error: '查询申请失败' },
        { status: 500 }
      );
    }

    // 获取关联文件
    if (data && data.length > 0) {
      const applicationIds = data.map((a: any) => a.id);
      const { data: files } = await client
        .from('files')
        .select('*')
        .in('application_id', applicationIds);
      
      const filesMap: Record<number, any[]> = {};
      if (files) {
        files.forEach((f: any) => {
          if (!filesMap[f.application_id]) {
            filesMap[f.application_id] = [];
          }
          filesMap[f.application_id].push(f);
        });
      }
      
      const result = data.map((a: any) => ({
        ...a,
        files: filesMap[a.id] || [],
      }));

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('处理请求失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
