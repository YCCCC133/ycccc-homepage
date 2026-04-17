import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 文书生成API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, variables } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: '请选择文书类型' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    // 获取模板
    const { data: templateData } = await client
      .from('templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    let content = '';

    if (templateData) {
      content = templateData.content || '';
    } else {
      // 使用内置默认模板
      content = generateDefaultTemplate(type, variables);
    }

    // 替换变量
    if (variables && content) {
      Object.entries(variables).forEach(([key, value]) => {
        const val = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), val);
        content = content.replace(new RegExp(`\\{\\{${key.replace(/([A-Z])/g, '_$1').toLowerCase()}\\}\\}`, 'gi'), val);
      });
      // 清理未替换的变量
      content = content.replace(/\{\{[^}]+\}\}/g, '');
    }

    const docNumber = `WS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // 可选：保存到数据库
    if (variables?.saveToDb) {
      await client
        .from('documents')
        .insert({
          document_type: type,
          doc_number: docNumber,
          content: content,
          variables: JSON.stringify(variables),
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        docNumber,
        type,
        content,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[documents] Error:', error);
    return NextResponse.json(
      { success: false, error: '生成失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 内置默认模板
function generateDefaultTemplate(type: string, variables?: Record<string, string | number | boolean>): string {
  const v = variables || {};
  const plaintiffName = v.plaintiffName || '[原告姓名]';
  const plaintiffIdCard = v.plaintiffIdCard || '[身份证号]';
  const plaintiffAddress = v.plaintiffAddress || '[地址]';
  const plaintiffPhone = v.plaintiffPhone || '[电话]';
  const defendantName = v.defendantName || '[被告姓名/名称]';
  const defendantAddress = v.defendantAddress || '[地址]';
  const claim = v.claim || '[诉讼请求]';
  const facts = v.facts || '[事实和理由]';
  const evidence = v.evidence || '[证据清单]';

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return `民 事 起 诉 状

原告：${plaintiffName}
性别：男/女
身份证号：${plaintiffIdCard}
住所：${plaintiffAddress}
联系电话：${plaintiffPhone}

被告：${defendantName}
住所：${defendantAddress}

诉讼请求：
${claim}

事实和理由：
${facts}

证据和证据来源：
${evidence}

此致
XXX人民法院

起诉人（签名）：__________
${dateStr}`;
}

// GET - 获取文书列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    const client = getSupabaseClient();
    const { data, error, count } = await client
      .from('documents')
      .select('id, doc_number, document_type, applicant_name, applicant_phone, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('[documents] Query error:', error);
      return NextResponse.json({ error: '获取文书列表失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[documents] Error:', error);
    return NextResponse.json({ error: '获取文书列表失败' }, { status: 500 });
  }
}
