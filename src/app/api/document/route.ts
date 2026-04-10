import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { uploadDocument } from '@/storage/s3-storage';

// 获取文书列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('document_type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || data?.length || 0
    });
  } catch (error) {
    console.error('获取文书列表失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// 创建文书
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      document_type,
      applicant_name,
      applicant_phone,
      case_description,
      salary_info,
      employer_info
    } = body;

    // 生成文书内容
    const content = generateDocumentContent(document_type, {
      applicant_name,
      applicant_phone,
      case_description,
      salary_info,
      employer_info
    });

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('documents')
      .insert({
        document_type,
        document_content: content,
        applicant_name,
        applicant_phone: applicant_phone || null,
        template_used: document_type
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 自动上传文书到对象存储
    let fileKey = null;
    let downloadUrl = null;
    try {
      const fileName = `${document_type}_${applicant_name}_${Date.now()}.txt`;
      const uploadResult = await uploadDocument(content, fileName);
      fileKey = uploadResult.key;
      downloadUrl = uploadResult.url;

      // 更新数据库记录，添加文件信息
      await supabase
        .from('documents')
        .update({
          file_key: fileKey,
          file_name: fileName,
          file_size: Buffer.byteLength(content, 'utf-8'),
        })
        .eq('id', data.id);
    } catch (uploadError) {
      console.error('上传文书到对象存储失败:', uploadError);
      // 文件上传失败不影响主流程，继续返回成功
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        file_key: fileKey,
        download_url: downloadUrl,
      },
      message: '文书生成成功'
    });
  } catch (error) {
    console.error('生成文书失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// 生成文书内容
function generateDocumentContent(type: string, params: Record<string, string | undefined>): string {
  const { applicant_name = '申请人', applicant_phone = '', case_description = '', salary_info = '', employer_info = '' } = params;
  const date = new Date().toLocaleDateString('zh-CN');
  
  switch (type) {
    case '支付令申请书':
      return `支付令申请书

申请人：${applicant_name}
${applicant_phone ? `联系电话：${applicant_phone}` : ''}

申请事项：
请求法院依法向被申请人发出支付令，督促其支付拖欠的工资。

事实与理由：
${case_description || '申请人在被申请人处工作期间，被申请人拖欠申请人工资至今未付。'}

${salary_info ? `工资情况：${salary_info}` : ''}
${employer_info ? `雇主信息：${employer_info}` : ''}

综上所述，被申请人拖欠工资的行为已严重损害了申请人的合法权益。根据《中华人民共和国劳动合同法》第三十条的规定，特向贵院申请支付令，请依法支持。

此致
_________人民法院

申请人：${applicant_name}
${applicant_phone ? `联系电话：${applicant_phone}` : ''}
${date}`;

    case '民事起诉状':
      return `民事起诉状

原告：${applicant_name}
${applicant_phone ? `联系电话：${applicant_phone}` : ''}

诉讼请求：
1. 判令被告支付拖欠工资_____元；
2. 判令被告支付赔偿金_____元；
3. 本案诉讼费用由被告承担。

事实与理由：
${case_description || '原告于_____年_____月到被告处工作，担任_____职务。被告无故拖欠原告工资共计_____元。'}

${salary_info ? `工资情况：${salary_info}` : ''}
${employer_info ? `雇主信息：${employer_info}` : ''}

综上所述，被告的行为严重违反《劳动合同法》的规定，损害了原告的合法权益。现向贵院提起诉讼，请依法支持原告的诉讼请求。

此致
_________人民法院

起诉人：${applicant_name}
${applicant_phone ? `联系电话：${applicant_phone}` : ''}
${date}`;

    case '支持起诉申请书':
      return `支持起诉申请书

申请人：${applicant_name}
${applicant_phone ? `联系电话：${applicant_phone}` : ''}

申请事项：
请求人民检察院依法支持申请人向人民法院提起诉讼。

事实与理由：
${case_description || '申请人在工作期间遭遇工资拖欠问题，多次讨要未果，现依法向检察机关申请支持起诉。'}

${salary_info ? `工资情况：${salary_info}` : ''}
${employer_info ? `雇主信息：${employer_info}` : ''}

申请依据：
根据《中华人民共和国民事诉讼法》第十五条的规定，机关、社会团体、企业事业单位对损害国家、集体或者个人民事权益的行为，可以支持受损害的单位或者个人向人民法院起诉。

综上所述，恳请人民检察院依法支持申请人起诉，维护申请人的合法权益。

此致
_________人民检察院

申请人：${applicant_name}
${applicant_phone ? `联系电话：${applicant_phone}` : ''}
${date}`;

    case '证据目录':
      return `证据目录

案由：劳动报酬纠纷

序号 | 证据名称 | 证明内容 | 页码
-----|----------|----------|----
1 | 劳动合同 | 证明劳动关系 | ___
2 | 工资条/银行流水 | 证明工资标准 | ___
3 | 考勤记录 | 证明工作时间 | ___
4 | 工作证/工牌 | 证明身份 | ___
5 | 聊天记录 | 证明催讨工资 | ___
6 | 证人证言 | 证明相关事实 | ___

附注：
1. 以上证据均为复印件，原件开庭时出示。
2. 证据按顺序整理，加盖页码。

证据提供人：${applicant_name}
${applicant_phone ? `联系电话：${applicant_phone}` : ''}
${date}`;

    case '法律援助申请表':
      return `法律援助申请表

申请人姓名：${applicant_name}
性别：___  出生日期：___
联系电话：${applicant_phone || '________________'}

申请事项：
请求法律援助机构为申请人提供法律援助服务。

事实与理由：
${case_description || '申请人在工作期间遭遇工资拖欠问题，因经济困难无力聘请律师，特申请法律援助。'}

经济状况：
□ 低保户  □ 特困人员  □ 农民工  □ 其他：___

案件类型：劳动报酬纠纷

申请人承诺：
本人承诺所填信息真实有效，如有虚假愿承担相应法律责任。

申请人签名：${applicant_name}
${date}`;

    default:
      return `法律文书

文书类型：${type}
申请人：${applicant_name}
${applicant_phone ? `联系电话：${applicant_phone}` : ''}

正文：
${case_description || '（此处填写详细内容）'}

${salary_info ? `工资情况：${salary_info}` : ''}
${employer_info ? `雇主信息：${employer_info}` : ''}

申请人：${applicant_name}
${applicant_phone ? `联系电话：${applicant_phone}` : ''}
${date}`;
  }
}
