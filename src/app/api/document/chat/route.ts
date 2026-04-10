import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 使用 Node.js runtime
export const runtime = 'nodejs';

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
    const llmMessages: Array<{ role: string; content: string }> = [
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

    return NextResponse.json({
      success: true,
      data: {
        content: response.content,
        step: formData ? Object.keys(formData).length : 0
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
