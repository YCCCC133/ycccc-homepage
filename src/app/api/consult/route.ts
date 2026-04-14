import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils, Message } from 'coze-coding-dev-sdk';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 知识库 Excel 文件的存储 key（上传后返回的 key）
const KNOWLEDGE_EXCEL_KEY = 'knowledge/Zhi_Neng_Zi_Xun_Shu_Ju_Yuan_be951140.xlsx';

// 初始化 S3Storage
function getStorage() {
  return new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });
}

// 使用 Node.js runtime 以支持 coze-coding-dev-sdk
export const runtime = 'nodejs';

// 缓存知识库内容（避免每次请求都下载）
let cachedKnowledge: string | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1小时

// 简单解析 Excel 数据（提取问答对）
async function parseExcelContent(buffer: Buffer): Promise<string> {
  try {
    // 尝试使用 xlsx 库解析
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    let allQAs: string[] = [];
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      // 假设第一行是标题，从第二行开始是数据
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row && row.length >= 2) {
          const question = String(row[0] || '').trim();
          const answer = String(row[1] || '').trim();
          
          if (question && answer) {
            allQAs.push(`问：${question}\n答：${answer}`);
          }
        }
      }
    }
    
    return allQAs.join('\n\n');
  } catch (error) {
    console.error('[consult] Failed to parse Excel:', error);
    return '';
  }
}

// 获取知识库 Excel 内容
async function getKnowledgeExcelContent(): Promise<string> {
  // 检查缓存
  if (cachedKnowledge && (Date.now() - cacheTime) < CACHE_TTL) {
    console.log('[consult] Using cached knowledge content');
    return cachedKnowledge;
  }
  
  try {
    const storage = getStorage();
    console.log('[consult] Downloading knowledge Excel from storage...');
    
    const fileBuffer = await storage.readFile({ fileKey: KNOWLEDGE_EXCEL_KEY });
    console.log('[consult] Excel file downloaded, size:', fileBuffer.length, 'bytes');
    
    const content = await parseExcelContent(fileBuffer);
    console.log('[consult] Parsed knowledge content length:', content.length);
    
    cachedKnowledge = content;
    cacheTime = Date.now();
    
    return content;
  } catch (error) {
    console.error('[consult] Failed to get knowledge Excel:', error);
    return '';
  }
}

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

// 获取数据库知识库内容
async function getKnowledgeBase() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('knowledge_base')
      .select('category, case_type, summary, full_text')
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

    // 获取知识库 Excel 内容
    const excelKnowledge = await getKnowledgeExcelContent();
    let excelKnowledgeSection = '';
    
    if (excelKnowledge && excelKnowledge.length > 0) {
      excelKnowledgeSection = `\n\n## 智能咨询参考问答\n以下是农民工工资维权相关的问答参考，请优先参考这些内容回答：\n\n${excelKnowledge}\n\n如果用户的问题在参考问答中没有直接匹配，请根据参考问答的相关内容进行类比回答。`;
    }
    
    // 获取数据库知识库内容
    const knowledgeBase = await getKnowledgeBase();
    let knowledgeSection = '';
    
    if (knowledgeBase && knowledgeBase.length > 0) {
      const knowledgeItems = knowledgeBase.map((k, i) => 
        `[案例${i + 1}] 类型：${k.case_type || k.category}\n概要：${k.summary || ''}\n详情：${k.full_text ? k.full_text.substring(0, 500) : ''}`
      ).join('\n\n');
      
      knowledgeSection = `\n\n## 参考案例库\n以下是相关的法律案例参考：\n\n${knowledgeItems}\n\n如果案例库中没有相关信息，再基于您的法律知识进行回答。`;
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
   - 提醒用户可以通过平台进行线索填报、文书生成等操作${excelKnowledgeSection}${knowledgeSection}

请根据以上原则和参考内容，为用户提供专业、贴心的法律咨询服务。`;

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
