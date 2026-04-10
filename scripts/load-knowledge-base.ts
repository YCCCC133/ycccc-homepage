import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

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

function parseMarkdownFile(content: string, filename: string): CaseData | null {
  try {
    // 提取分类
    const categoryMatch = content.match(/^## 案件概览\n- 分类：(.+)$/m);
    const category = categoryMatch ? categoryMatch[1].trim() : '';

    // 提取法院
    const courtMatch = content.match(/- 法院：(.+)$/m);
    const court = courtMatch ? courtMatch[1].trim() : '';

    // 提取案号
    const caseNumberMatch = content.match(/案号：(.+)$/m);
    const case_number = caseNumberMatch ? caseNumberMatch[1].trim() : '';

    // 提取当事人
    const partiesMatch = content.match(/核心当事人：(.+)$/m);
    const parties = partiesMatch ? partiesMatch[1].trim() : '';

    // 提取案由
    const caseTypeMatch = content.match(/案由：(.+)$/m);
    const case_type = caseTypeMatch ? caseTypeMatch[1].trim() : '';

    // 提取程序
    const procedureMatch = content.match(/程序：(.+)$/m);
    const procedure_type = procedureMatch ? procedureMatch[1].trim() : '';

    // 提取裁判结果
    const resultMatch = content.match(/裁判结果：(.+)$/m);
    const result = resultMatch ? resultMatch[1].trim() : '';

    // 提取摘要
    const summaryMatch = content.match(/裁判主文摘要：(.+)$/m);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // 提取全文
    const fullTextMatch = content.match(/## 全文\n([\s\S]*)$/);
    const full_text = fullTextMatch ? fullTextMatch[1].trim() : '';

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
    console.error(`解析文件失败 ${filename}:`, error);
    return null;
  }
}

async function loadKnowledgeBase() {
  console.log('开始加载知识库...');
  
  const supabase = getSupabaseClient();
  
  try {
    // 读取目录
    const files = await readdir(DATA_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    console.log(`找到 ${mdFiles.length} 个数据源文件`);
    
    const cases: CaseData[] = [];
    
    for (const file of mdFiles) {
      const filePath = join(DATA_DIR, file);
      const content = await readFile(filePath, 'utf-8');
      const caseData = parseMarkdownFile(content, file);
      
      if (caseData) {
        cases.push(caseData);
      }
    }
    
    console.log(`成功解析 ${cases.length} 个案例`);
    
    // 清空旧数据
    await supabase.from('knowledge_base').delete().neq('id', 0);
    
    // 批量插入
    const { error } = await supabase.from('knowledge_base').insert(cases);
    
    if (error) {
      console.error('插入数据失败:', error);
      return false;
    }
    
    console.log(`成功加载 ${cases.length} 个案例到知识库`);
    return true;
  } catch (error) {
    console.error('加载知识库失败:', error);
    return false;
  }
}

// 运行
loadKnowledgeBase().then(success => {
  process.exit(success ? 0 : 1);
});
