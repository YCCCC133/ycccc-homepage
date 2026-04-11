import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils, Message } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 使用 Node.js runtime 以支持 coze-coding-dev-sdk
export const runtime = 'nodejs';

// 法律依据数据库
const LEGAL_REFERENCES: Record<string, { name: string; fullName: string; url: string }> = {
  '劳动合同法': { name: '劳动合同法', fullName: '《中华人民共和国劳动合同法》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3Yjc1MGMxYTZmN2M%3D' },
  '劳动法': { name: '劳动法', fullName: '《中华人民共和国劳动法》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk2YjI3MGQxYzY0OTU%3D' },
  '保障农民工工资支付条例': { name: '农民工工资条例', fullName: '《保障农民工工资支付条例》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3YTQ0MjBmNmIwZGE%3D' },
  '劳动争议调解仲裁法': { name: '劳动争议仲裁法', fullName: '《中华人民共和国劳动争议调解仲裁法》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk2YjI3MGQxYzY0OTc%3D' },
  '民事诉讼法': { name: '民事诉讼法', fullName: '《中华人民共和国民事诉讼法》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk2YjI3MGQxYzY1MDE%3D' },
  '工伤保险条例': { name: '工伤保险条例', fullName: '《工伤保险条例》', url: 'https://flk.npc.gov.cn/detail2.html?ZmY4MDgxODE3OTZhNjMyYTAxNzk3YTQ0MjBmNmIwZmY%3D' },
  '最高人民法院关于审理劳动争议案件适用法律问题的解释（一）': { 
    name: '劳动争议司法解释(一)', 
    fullName: '《最高人民法院关于审理劳动争议案件适用法律问题的解释（一）》', 
    url: 'https://www.court.gov.cn/xinwen/2020-12/29/content_5573583.htm' 
  },
  '工资支付暂行规定': { name: '工资支付暂行规定', fullName: '《工资支付暂行规定》', url: 'https://www.mohrss.gov.cn/xxgk2020/zcfgfxjz/gfxwj/rczx/201604/t20160401_269354.html' },
};

// 从文本中提取法律依据
function extractLegalReferences(text: string): Array<{ name: string; fullName: string; url: string }> {
  const found: Set<string> = new Set();
  const results: Array<{ name: string; fullName: string; url: string }> = [];
  
  // 按长度从长到短匹配
  const sortedKeys = Object.keys(LEGAL_REFERENCES).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    if (text.includes(key) && !found.has(key)) {
      found.add(key);
      results.push(LEGAL_REFERENCES[key]);
    }
  }
  
  // 如果没有找到具体法条，添加通用法律参考
  if (results.length === 0) {
    // 基于问题类型推断
    if (text.includes('工资') || text.includes('拖欠')) {
      results.push(LEGAL_REFERENCES['劳动合同法']);
      results.push(LEGAL_REFERENCES['保障农民工工资支付条例']);
    } else if (text.includes('工伤')) {
      results.push(LEGAL_REFERENCES['工伤保险条例']);
    } else if (text.includes('仲裁') || text.includes('争议')) {
      results.push(LEGAL_REFERENCES['劳动争议调解仲裁法']);
    }
  }
  
  return results;
}

// 保存咨询记录到数据库
async function saveConsultation(sessionId: string, userQuestion: string, aiResponse: string, legalRefs: Array<{ name: string; fullName: string }>) {
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('consultations')
      .insert({
        session_id: sessionId,
        user_question: userQuestion,
        ai_response: aiResponse,
        legal_references: legalRefs,
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

    // 法律依据列表（用于提示AI）
    const legalRefsList = Object.values(LEGAL_REFERENCES).map(r => `- ${r.fullName}`).join('\n');

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 系统提示词 - 专业法律顾问（增强法律依据引用）
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
   - **重要：回答中必须包含相关法律依据的名称（如《劳动合同法》第三十条），不要使用链接，但必须提及法律名称和具体条款**
   - 对于复杂问题，建议寻求专业法律援助

3. **法律依据引用要求【关键】**：
   请在回答中自然地引用以下法律法规：
   ${legalRefsList}
   
   引用示例：
   - "根据《劳动合同法》第三十条的规定..."
   - "《保障农民工工资支付条例》第三条明确指出..."
   - "依据《工伤保险条例》第十四条的认定标准..."

4. **语气风格**：
   - 专业、耐心、有同理心
   - 尊重农民工群体，使用礼貌用语
   - 鼓励用户维护合法权益${knowledgeSection}

请根据以上原则和知识库内容，为用户提供专业、贴心的法律咨询服务。回答完成后请确保包含了相关法律条款的具体名称。`;

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
              
              // 实时提取法律依据
              const refs = extractLegalReferences(fullResponse);
              
              const data = `data: ${JSON.stringify({ 
                content: text,
                legalReferences: refs.slice(0, 5) // 最多返回5条
              })}\n\n`;
              
              // 检查 controller 状态，避免 "Controller is already closed" 错误
              try {
                controller.enqueue(encoder.encode(data));
              } catch (enqueueError) {
                // Controller 已关闭，用户可能中断了请求
                break;
              }
            }
          }
          
          // 流结束后，提取最终的法律依据
          const finalRefs = extractLegalReferences(fullResponse);
          
          // 发送结束标记和最终引用
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              content: '',
              legalReferences: finalRefs,
              isFinal: true
            })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch {
            // Controller 已关闭，忽略
          }
          
          // 流结束后保存咨询记录到数据库
          if (fullResponse) {
            await saveConsultation(sessionId, userQuestion, fullResponse, 
              finalRefs.map(r => ({ name: r.name, fullName: r.fullName }))
            );
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
