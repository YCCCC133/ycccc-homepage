import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils, Message } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 使用 Node.js runtime 以支持 coze-coding-dev-sdk
export const runtime = 'nodejs';

// 保存咨询记录到数据库
async function saveConsultation(sessionId: string, userQuestion: string, aiResponse: string) {
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('consultations')
      .insert({
        session_id: sessionId,
        user_question: userQuestion,
        ai_response: aiResponse,
      });

    if (error) {
      console.error('保存咨询记录失败:', error);
    }
  } catch (error) {
    console.error('保存咨询记录异常:', error);
  }
}

// 获取知识库内容
async function getKnowledgeBase() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('knowledge_base')
      .select('title, summary, content, category, case_type, tags')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('获取知识库失败:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('获取知识库失败:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 支持两种格式：{ message: string } 或 { messages: array }
    let conversationHistory: Message[] = [];
    
    if (body.messages && Array.isArray(body.messages)) {
      conversationHistory = body.messages;
    } else if (body.message) {
      // 单条消息格式，转换为对话历史
      conversationHistory = [{ role: 'user', content: body.message }];
    }

    // 获取知识库内容
    const knowledgeBase = await getKnowledgeBase();
    let knowledgeSection = '';
    
    if (knowledgeBase && knowledgeBase.length > 0) {
      const knowledgeItems = knowledgeBase.map((k, i) => 
        `[知识${i + 1}] ${k.title}\n分类：${k.category}\n内容：${k.content}${k.tags && k.tags.length > 0 ? `\n标签：${k.tags.join(', ')}` : ''}`
      ).join('\n\n');
      
      knowledgeSection = `\n\n## 参考知识库\n以下是您需要参考的知识库内容，回答问题时请优先使用这些信息：\n\n${knowledgeItems}\n\n如果知识库中没有相关信息，再基于您的法律知识进行回答，但请注明"根据一般法律规定"。`;
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 系统提示词 - 专业法律顾问
    const systemPrompt = `你是一位专业的法律顾问，专门为农民工提供法律咨询和维权指导。你的职责是：

1. **专业范围**：
   - 劳动合同纠纷
   - 工资拖欠问题
   - 工伤赔偿
   - 劳动保障权益
   - 农民工维权程序

2. **回答原则**：
   - 使用简洁、易懂的语言，避免复杂法律术语
   - 提供具体、可操作的建议
   - 引用相关法律条文时要标注出处
   - 对于复杂问题，建议寻求专业法律援助

3. **语气风格**：
   - 专业、耐心、有同理心
   - 尊重农民工群体，使用礼貌用语
   - 鼓励用户维护合法权益

4. **重要提示**：
   - 如果涉及紧急情况，提醒用户拨打12345热线
   - 建议用户保留相关证据（合同、工资条、聊天记录等）
   - 提醒用户可以通过平台进行线索填报、文书生成等操作${knowledgeSection}

请根据以上原则和知识库内容，为用户提供专业、贴心的法律咨询服务。`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    // 使用流式输出
    const stream = client.stream(messages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.7,
      streaming: true,
    });

    // 创建 ReadableStream 用于 SSE
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = ''; // 累积完整回复
        const sessionId = `session_${Date.now()}`; // 生成会话ID
        const userQuestion = conversationHistory.length > 0 
          ? conversationHistory[conversationHistory.length - 1].content?.toString() || '' 
          : '';

        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullResponse += text; // 累积回复内容
              const data = `data: ${JSON.stringify({ content: text })}\n\n`;
              // 检查 controller 状态，避免 "Controller is already closed" 错误
              try {
                controller.enqueue(encoder.encode(data));
              } catch (enqueueError) {
                // Controller 已关闭，用户可能中断了请求
                break;
              }
            }
          }
          // 发送结束标记
          try {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch {
            // Controller 已关闭，忽略
          }
          
          // 流结束后保存咨询记录到数据库
          if (fullResponse) {
            await saveConsultation(sessionId, userQuestion, fullResponse);
          }
        } catch (error) {
          console.error('Stream error:', error);
          try {
            controller.error(error);
          } catch {
            // Controller 已关闭，忽略
          }
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '服务暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}
