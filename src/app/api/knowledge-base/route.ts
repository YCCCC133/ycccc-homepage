import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const DATA_DIR = join(process.cwd(), 'assets', '数据源');

interface CaseData {
  category: string;
  court: string;
  case_number: string;
  parties: string;
  case_type: string;
  procedure_type: string;
  result: string;
  summary: string;
  full_text: string;
}

function parseMarkdownFile(content: string): CaseData | null {
  try {
    const lines = content.split('\n');
    
    // 提取分类
    const categoryLine = lines.find(l => l.includes('分类：'));
    const category = categoryLine ? categoryLine.split('：')[1]?.trim() || '' : '';
    
    // 提取法院
    const courtLine = lines.find(l => l.includes('法院：') && !l.includes('核心'));
    const court = courtLine ? courtLine.split('：')[1]?.trim() || '' : '';
    
    // 提取案号
    const caseNumberLine = lines.find(l => l.includes('案号：'));
    const case_number = caseNumberLine ? caseNumberLine.split('：')[1]?.trim() || '' : '';
    
    // 提取当事人
    const partiesLine = lines.find(l => l.includes('核心当事人：'));
    const parties = partiesLine ? partiesLine.split('：')[1]?.trim() || '' : '';
    
    // 提取案由
    const caseTypeLine = lines.find(l => l.includes('案由：'));
    const case_type = caseTypeLine ? caseTypeLine.split('：')[1]?.trim() || '' : '';
    
    // 提取程序
    const procedureLine = lines.find(l => l.includes('程序：'));
    const procedure_type = procedureLine ? procedureLine.split('：')[1]?.trim() || '' : '';
    
    // 提取裁判结果
    const resultLine = lines.find(l => l.includes('裁判结果：'));
    const result = resultLine ? resultLine.split('：')[1]?.trim() || '' : '';
    
    // 提取裁判主文摘要
    const summaryLine = lines.find(l => l.includes('裁判主文摘要：'));
    const summary = summaryLine ? summaryLine.split('：')[1]?.trim() || '' : '';
    
    // 提取全文
    const fullTextStart = content.indexOf('## 全文');
    const full_text = fullTextStart > 0 ? content.substring(fullTextStart + 5).trim() : '';
    
    if (!case_number) return null;
    
    return {
      category,
      court,
      case_number,
      parties,
      case_type,
      procedure_type,
      result,
      summary,
      full_text
    };
  } catch (error) {
    console.error('解析文件失败:', error);
    return null;
  }
}

// 加载知识库
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // 读取数据源目录
    const files = await readdir(DATA_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const cases: CaseData[] = [];
    
    for (const file of mdFiles) {
      const filePath = join(DATA_DIR, file);
      const content = await readFile(filePath, 'utf-8');
      const caseData = parseMarkdownFile(content);
      
      if (caseData) {
        cases.push(caseData);
      }
    }
    
    // 清空旧数据
    await supabase.from('knowledge_base').delete().neq('id', 0);
    
    // 批量插入
    const { error } = await supabase.from('knowledge_base').insert(cases);
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: '数据插入失败'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        total: cases.length,
        categories: [...new Set(cases.map(c => c.category))]
      },
      message: `成功加载 ${cases.length} 个案例到知识库`
    });
  } catch (error) {
    console.error('加载知识库失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '服务器错误',
      message: '加载知识库失败'
    }, { status: 500 });
  }
}

// 获取知识库（供AI生成使用）
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const caseType = searchParams.get('case_type');
    
    let query = supabase
      .from('knowledge_base')
      .select('category, court, case_number, parties, case_type, procedure_type, result, summary, full_text')
      .eq('is_active', true);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (caseType) {
      query = query.eq('case_type', caseType);
    }
    
    const { data, error } = await query.limit(10);
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取知识库失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '服务器错误' 
    }, { status: 500 });
  }
}
