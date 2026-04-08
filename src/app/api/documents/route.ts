import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 文书生成API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, variables, useTemplate } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: '请选择文书类型' },
        { status: 400 }
      );
    }

    // 获取模板
    const client = await pool.connect();
    try {
      const templateResult = await client.query(
        'SELECT * FROM templates WHERE type = $1 AND is_active = true LIMIT 1',
        [type]
      );

      let content = '';

      if (templateResult.rows.length > 0) {
        // 使用数据库模板
        const template = templateResult.rows[0];
        content = template.content;

        // 替换变量
        if (variables) {
          Object.entries(variables).forEach(([key, value]) => {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value as string || '');
          });
        }
      } else {
        // 使用内置默认模板
        content = generateDefaultTemplate(type, variables);
      }

      // 生成文书的元信息
      const docNumber = `WS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // 可选：保存到数据库
      if (variables?.saveToDb) {
        await client.query(
          `INSERT INTO documents (doc_number, type, content, variables, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [docNumber, type, content, JSON.stringify(variables)]
        );
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
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('生成文书失败:', error);
    return NextResponse.json(
      { success: false, error: '生成失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 内置默认模板
function generateDefaultTemplate(type: string, variables?: Record<string, string>): string {
  const {
    plaintiffName = '[原告姓名]',
    plaintiffIdCard = '[身份证号]',
    plaintiffAddress = '[地址]',
    plaintiffPhone = '[电话]',
    defendantName = '[被告姓名/名称]',
    defendantAddress = '[地址]',
    defendantPhone = '[电话]',
    claim = '[诉讼请求]',
    facts = '[事实和理由]',
    evidence = '[证据清单]',
  } = variables || {};

  switch (type) {
    case 'complaint':
      return `民 事 起 诉 状

原告：${plaintiffName}
性别：男/女
身份证号：${plaintiffIdCard}
住所：${plaintiffAddress}
联系电话：${plaintiffPhone}

被告：${defendantName}
住所：${defendantAddress}
联系电话：${defendantPhone}

诉讼请求：
${claim}

事实和理由：
${facts}

证据和证据来源：
${evidence}

此致
北京市XX区人民法院

起诉人（签名）：____________
${new Date().toLocaleDateString('zh-CN')}
`;

    case 'support':
      return `支持起诉申请书

申请人：${plaintiffName}
身份证号：${plaintiffIdCard}
联系电话：${plaintiffPhone}

被申请人：${defendantName}

申请事项：
请求人民检察院依法对上述劳动争议案件支持起诉。

事实和理由：
${facts}

证据材料：
${evidence}

此致
北京市XX区人民检察院

申请人（签名）：____________
${new Date().toLocaleDateString('zh-CN')}
`;

    case 'legal_aid':
      return `法律援助申请书

申请人：${plaintiffName}
身份证号：${plaintiffIdCard}
住所：${plaintiffAddress}
联系电话：${plaintiffPhone}

申请事项：
请求法律援助机构指派律师为申请人提供法律援助。

申请理由：
${facts}

经济状况：
申请人经济困难，属于法律援助对象。

此致
北京市XX区法律援助中心

申请人（签名）：____________
${new Date().toLocaleDateString('zh-CN')}
`;

    default:
      return `法律文书

当事人信息：
原告：${plaintiffName}
被告：${defendantName}

${facts}

${claim}
`;
  }
}
