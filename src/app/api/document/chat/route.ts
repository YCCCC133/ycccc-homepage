import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, Message } from 'coze-coding-dev-sdk';

// 使用 Node.js runtime
export const runtime = 'nodejs';

// 相关法律法规数据库
const LEGAL_REFERENCES: Record<string, { name: string; fullName: string; url: string }[]> = {
  default: [
    { name: '劳动法', fullName: '《中华人民共和国劳动法》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3Yjc1MGM4NjZjNDF%3D' },
    { name: '劳动合同法', fullName: '《中华人民共和国劳动合同法》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk2YjI3OGNhNzk3OTU%3D' },
    { name: '保障农民工工资支付条例', fullName: '《保障农民工工资支付条例》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3OTY2MWNmNGJjNjc%3D' },
  ],
  contract: [
    { name: '劳动合同法', fullName: '《中华人民共和国劳动合同法》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk2YjI3OGNhNzk3OTU%3D' },
    { name: '劳动合同法实施条例', fullName: '《中华人民共和国劳动合同法实施条例》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3OTZhYjUzYjhhMTY%3D' },
  ],
  wage: [
    { name: '保障农民工工资支付条例', fullName: '《保障农民工工资支付条例》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3OTY2MWNmNGJjNjc%3D' },
    { name: '工资支付暂行规定', fullName: '《工资支付暂行规定》', url: 'https://www.mohrss.gov.cn/xxgk2020/gzk/gztz/201705/t20170527_272914.html' },
  ],
  complaint: [
    { name: '劳动监察保障办法', fullName: '《劳动保障监察条例》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3YjBiYjRhNzkwYzU%3D' },
    { name: '劳动争议调解仲裁法', fullName: '《中华人民共和国劳动争议调解仲裁法》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3YjY3YjNhNzk1MzY%3D' },
  ],
  injury: [
    { name: '工伤保险条例', fullName: '《工伤保险条例》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3YjY1OGNhNzhhMTU%3D' },
    { name: '工伤认定办法', fullName: '《工伤认定办法》', url: 'https://www.mohrss.gov.cn/xxgk2020/gzk/gztz/201705/t20170527_272911.html' },
  ],
  legal_aid: [
    { name: '法律援助法', fullName: '《中华人民共和国法律援助法》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3ZTBhMGM4NzBhMjc%3D' },
    { name: '法律援助条例', fullName: '《法律援助条例》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk2ZjFhMGM4NjkwNTM%3D' },
  ]
};

// 根据消息内容匹配相关法规
function matchLegalReferences(content: string): { name: string; fullName: string; url: string }[] {
  const lowerContent = content.toLowerCase();
  const refs: { name: string; fullName: string; url: string }[] = [];
  const addedKeys = new Set<string>();

  // 关键词匹配
  if (lowerContent.includes('合同') || lowerContent.includes('签订') || lowerContent.includes('解除')) {
    LEGAL_REFERENCES.contract.forEach(ref => {
      if (!addedKeys.has(ref.name)) { refs.push(ref); addedKeys.add(ref.name); }
    });
  }
  if (lowerContent.includes('工资') || lowerContent.includes('拖欠') || lowerContent.includes('报酬') || lowerContent.includes('加班费')) {
    LEGAL_REFERENCES.wage.forEach(ref => {
      if (!addedKeys.has(ref.name)) { refs.push(ref); addedKeys.add(ref.name); }
    });
  }
  if (lowerContent.includes('投诉') || lowerContent.includes('举报') || lowerContent.includes('监察')) {
    LEGAL_REFERENCES.complaint.forEach(ref => {
      if (!addedKeys.has(ref.name)) { refs.push(ref); addedKeys.add(ref.name); }
    });
  }
  if (lowerContent.includes('工伤') || lowerContent.includes('伤残') || lowerContent.includes('职业病')) {
    LEGAL_REFERENCES.injury.forEach(ref => {
      if (!addedKeys.has(ref.name)) { refs.push(ref); addedKeys.add(ref.name); }
    });
  }
  if (lowerContent.includes('援助') || lowerContent.includes('免费') || lowerContent.includes('律师')) {
    LEGAL_REFERENCES.legal_aid.forEach(ref => {
      if (!addedKeys.has(ref.name)) { refs.push(ref); addedKeys.add(ref.name); }
    });
  }

  // 如果没有匹配，返回默认引用
  if (refs.length === 0) {
    refs.push(...LEGAL_REFERENCES.default.slice(0, 2));
  }

  return refs.slice(0, 3); // 最多返回3条
}

// 系统提示词
const SYSTEM_PROMPT = `你是"护薪平台"的智能法律文书助手，专门为农民工提供法律文书生成服务。

你的职责：
1. 通过友好、简洁的对话收集用户信息
2. 用口语化、温暖的方式与农民工交流
3. 引导用户回答必要的信息来生成法律文书
4. 始终保持耐心，不要用专业术语吓唬用户

收集的信息包括：
- 姓名
- 联系电话
- 欠薪单位/个人名称
- 被拖欠工资金额
- 工作时间段
- 是否签订劳动合同
- 现有证据
- 具体案情描述

回复规则：
1. 每次只问1个问题，保持简洁
2. 用"您"而不是"你"称呼用户
3. 可以说"跳过"跳过无法回答的问题
4. 可以说"重新开始"重置流程
5. 问题要通俗易懂，避免法律术语`;

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  currentStep?: number;
  formData?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, formData } = body;

    // 构建发送给大模型的消息
    const llmMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // 添加对话历史
    for (const msg of messages) {
      llmMessages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // 初始化 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config);

    // 调用大模型
    const response = await client.invoke(
      llmMessages,
      {
        model: 'doubao-seed-2-0-lite-260215',
        temperature: 0.7
      }
    );

    // 根据回复内容匹配相关法律法规
    const legalRefs = matchLegalReferences(response.content);

    return NextResponse.json({
      success: true,
      data: {
        content: response.content,
        step: formData ? Object.keys(formData).length : 0,
        legalReferences: legalRefs
      }
    });

  } catch (error) {
    console.error('智能问答API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务暂时不可用，请稍后重试'
    }, { status: 500 });
  }
}
