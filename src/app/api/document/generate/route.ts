import { NextRequest, NextResponse } from 'next/server';
import { LLMClient } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { uploadDocument } from '@/storage/s3-storage';

// 使用 Node.js runtime
export const runtime = 'nodejs';

interface GenerateRequest {
  name: string;
  phone: string;
  companyName: string;
  owedAmount: string;
  workPeriod: string;
  hasContract: string;
  hasEvidence: string;
  description: string;
}

// 获取相关案例
async function getRelatedCases(category?: string): Promise<string> {
  try {
    const client = getSupabaseClient();
    let query = client
      .from('knowledge_base')
      .select('case_number, case_type, summary, full_text, result')
      .eq('is_active', true)
      .limit(3);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return '';
    }

    // 构建案例参考内容
    return data.map((c: { case_number: string; case_type: string; summary: string; full_text: string; result: string }) =>
      `【案例${c.case_number}】\n案由：${c.case_type}\n裁判结果：${c.result}\n裁判摘要：${c.summary}\n`
    ).join('\n');
  } catch (error) {
    console.error('获取相关案例失败:', error);
    return '';
  }
}

// 推断案件分类
function inferCategory(data: GenerateRequest): string {
  const desc = (data.description + ' ' + data.hasContract).toLowerCase();
  
  if (desc.includes('派遣') || desc.includes('外包')) {
    return '劳务派遣或劳务外包类欠薪';
  }
  if (desc.includes('建筑') || desc.includes('工程') || desc.includes('工地')) {
    return '建设工程类欠薪';
  }
  if (desc.includes('工伤') || desc.includes('职业病')) {
    return '工伤或职业病伴欠薪类';
  }
  if (data.hasContract === '没有') {
    return '无劳动合同类欠薪';
  }
  
  return '基础拖欠劳动报酬类欠薪';
}

// 生成文书
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { name, phone, companyName, owedAmount, workPeriod, hasContract, hasEvidence, description } = body;

    // 验证必填字段
    if (!name || !companyName || !owedAmount) {
      return NextResponse.json({
        success: false,
        error: '请填写必要的姓名、欠薪金额等信息'
      }, { status: 400 });
    }

    // 推断案件分类并获取相关案例
    const category = inferCategory(body);
    const relatedCases = await getRelatedCases(category);

    // 构建提示词
    const systemPrompt = `你是一位专业的劳动法律师，擅长为农民工撰写民事起诉状。

请根据用户提供的真实信息，生成一份专业、完整、符合法律规范的民事起诉状。

## 格式要求
严格按照以下格式生成文书，不要省略任何部分：

民事起诉状

原告（自然人）：
姓名：[姓名]
性别：[男/女]
出生日期：[年-月-日]
民族：[民族]
住所地：[户籍地址]
联系电话：[电话]

被告（用人单位）：
名称：[公司名称]
住所地：[公司地址]

诉讼请求：
1. 请求判令被告支付拖欠的工资人民币[金额]元；
2. 请求判令被告支付赔偿金人民币[金额×25%]元；
3. 本案诉讼费用由被告承担。

事实与理由：
[详细描述工作经历、欠薪事实、时间线等]

证据清单：
1. [证据1]
2. [证据2]
[根据用户提供的证据信息列举]

此致
[被告住所地]人民法院

起诉人：[姓名]
联系电话：[电话]
[年]年[月]月[日]日

附件：
1. 身份证复印件
2. 证据材料

## 注意事项
1. 日期使用占位符如[年][月][日]，让用户自行填写
2. 金额使用具体数字
3. 事实与理由要清晰、有逻辑
4. 不要虚构任何信息`;

    const userPrompt = `## 用户信息
- 姓名：${name}
- 联系电话：${phone || '暂无'}
- 欠薪公司/个人：${companyName}
- 被拖欠金额：${owedAmount}元
- 工作时间：${workPeriod || '用户未提供'}
- 是否有劳动合同：${hasContract || '用户未提供'}
- 现有证据：${hasEvidence || '用户未提供'}
- 详细描述：${description || '用户未提供'}

${relatedCases ? `## 参考案例\n以下是与用户情况相似的法院判决案例，可作为参考：\n${relatedCases}` : ''}

请根据以上用户信息生成民事起诉状。`;

    // 调用 AI 生成文书
    const llmClient = new LLMClient();

    let generatedContent = '';

    // 使用流式生成
    const stream = llmClient.stream(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      { temperature: 0.3 }
    );

    // 收集完整响应
    for await (const chunk of stream) {
      if (chunk.content) {
        generatedContent += chunk.content.toString();
      }
    }

    if (!generatedContent) {
      return NextResponse.json({
        success: false,
        error: '生成文书失败，请重试'
      }, { status: 500 });
    }

    // 保存到数据库
    const supabase = getSupabaseClient();
    const { data: docData, error: dbError } = await supabase
      .from('documents')
      .insert({
        document_type: '民事起诉状',
        document_content: generatedContent,
        applicant_name: name,
        applicant_phone: phone,
        template_used: category
      })
      .select()
      .single();

    if (dbError) {
      console.error('保存文书到数据库失败:', dbError);
    }

    // 上传到对象存储
    let fileKey = null;
    let downloadUrl = null;
    
    if (docData) {
      try {
        const fileName = `民事起诉状_${name}_${Date.now()}.txt`;
        const uploadResult = await uploadDocument(generatedContent, fileName);
        fileKey = uploadResult.key;
        downloadUrl = uploadResult.url;

        // 更新数据库中的文件信息
        await supabase
          .from('documents')
          .update({
            file_key: fileKey,
            file_name: fileName,
            file_size: Buffer.byteLength(generatedContent, 'utf-8'),
          })
          .eq('id', docData.id);
      } catch (uploadError) {
        console.error('上传文书到对象存储失败:', uploadError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        document: generatedContent,
        document_id: docData?.id,
        category: category,
        file_key: fileKey,
        download_url: downloadUrl,
      },
      message: '文书生成成功'
    });

  } catch (error) {
    console.error('生成文书失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 });
  }
}
