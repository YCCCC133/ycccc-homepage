import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取公开案件列表（脱敏）
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 获取案件数据，敏感信息脱敏
    const { data: cases, error } = await client
      .from('cases')
      .select('id, case_number, plaintiff_name, defendant_name, case_type, amount, status, filing_date, handler, updated_at')
      .order('filing_date', { ascending: false });

    if (error) {
      console.error('获取案件失败:', error);
      return NextResponse.json({ error: '获取案件失败' }, { status: 500 });
    }

    // 脱敏处理：隐藏原告电话等敏感信息
    const sanitizedCases = (cases || []).map((c: Record<string, unknown>) => ({
      ...c,
      plaintiff_name: maskName(c.plaintiff_name as string),
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedCases,
      total: cases?.length || 0,
    });
  } catch (error) {
    console.error('获取案件失败:', error);
    return NextResponse.json({ error: '获取案件失败' }, { status: 500 });
  }
}

// 姓名脱敏函数
function maskName(name: string): string {
  if (!name || name.length <= 2) return name;
  return name.charAt(0) + '*' + name.slice(-1);
}
