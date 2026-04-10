import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertKnowledgeBase() {
  console.log('开始插入知识库...');
  
  try {
    // 读取解析好的数据
    const casesData = JSON.parse(readFileSync('/tmp/cases.json', 'utf-8'));
    console.log(`准备插入 ${casesData.length} 个案例`);
    
    // 清空旧数据
    await supabase.from('knowledge_base').delete().neq('id', 0);
    console.log('已清空旧数据');
    
    // 批量插入（每批50条）
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < casesData.length; i += batchSize) {
      const batch = casesData.slice(i, i + batchSize);
      const { error } = await supabase.from('knowledge_base').insert(batch);
      
      if (error) {
        console.error(`插入批次 ${i/batchSize + 1} 失败:`, error);
      } else {
        inserted += batch.length;
        console.log(`已插入 ${inserted}/${casesData.length}`);
      }
    }
    
    console.log(`知识库加载完成，共 ${inserted} 条记录`);
  } catch (error) {
    console.error('加载知识库失败:', error);
    process.exit(1);
  }
}

insertKnowledgeBase();
