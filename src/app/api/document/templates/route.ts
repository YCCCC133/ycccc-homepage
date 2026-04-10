import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取文书模板列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    let query = supabase
      .from('templates')
      .select('*')
      .order('type', { ascending: true })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 如果没有模板数据，返回默认模板
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: getDefaultTemplates(),
        total: getDefaultTemplates().length
      });
    }

    // 转换数据格式以匹配前端期望
    const formattedData = data.map(t => ({
      ...t,
      category: t.type, // 映射 type 到 category
      fields: t.variables || [], // 映射 variables 到 fields
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      total: formattedData.length
    });
  } catch (error) {
    console.error('获取文书模板失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// 创建文书模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, content, fields } = body;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name,
        type: category,
        content,
        variables: fields || [],
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '模板创建成功'
    });
  } catch (error) {
    console.error('创建模板失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// 默认模板数据
function getDefaultTemplates() {
  return [
    {
      id: 1,
      name: '劳动争议纠纷民事起诉状（2025版）',
      category: '民事起诉状',
      description: '适用于劳动争议纠纷案件，包含完整的诉讼请求要素',
      fields: [
        { name: '原告姓名', type: 'text', required: true },
        { name: '原告性别', type: 'select', options: ['男', '女'], required: true },
        { name: '出生日期', type: 'date', required: true },
        { name: '民族', type: 'text', required: false },
        { name: '工作单位', type: 'text', required: false },
        { name: '联系电话', type: 'phone', required: true },
        { name: '住所地', type: 'text', required: true },
        { name: '经常居住地', type: 'text', required: false },
        { name: '被告名称', type: 'text', required: true },
        { name: '被告住所地', type: 'text', required: true },
        { name: '统一社会信用代码', type: 'text', required: false },
        { name: '法定代表人', type: 'text', required: false },
        { name: '是否主张工资支付', type: 'checkbox', required: false },
        { name: '工资支付金额', type: 'number', required: false },
        { name: '是否主张双倍工资', type: 'checkbox', required: false },
        { name: '双倍工资金额', type: 'number', required: false },
        { name: '是否主张加班费', type: 'checkbox', required: false },
        { name: '加班费金额', type: 'number', required: false },
        { name: '是否主张经济补偿', type: 'checkbox', required: false },
        { name: '经济补偿金额', type: 'number', required: false },
        { name: '其他诉讼请求', type: 'textarea', required: false },
        { name: '事实与理由', type: 'textarea', required: true },
        { name: '标的总额', type: 'number', required: true }
      ],
      content: `民事起诉状

原告（自然人）：
姓名：{原告姓名}
性别：{原告性别}
出生日期：{出生日期}
民族：{民族}
工作单位：{工作单位}
联系电话：{联系电话}
住所地（户籍所在地）：{住所地}
经常居住地：{经常居住地}

被告（法人、非法人组织）：
名称：{被告名称}
住所地：{被告住所地}
统一社会信用代码：{统一社会信用代码}
法定代表人/负责人：{法定代表人}

诉讼请求：
{是否主张工资支付 ? '1. 请求判令被告支付工资 ' + 工资支付金额 + ' 元\n' : ''}{是否主张双倍工资 ? '2. 请求判令被告支付未签订书面劳动合同双倍工资 ' + 双倍工资金额 + ' 元\n' : ''}{是否主张加班费 ? '3. 请求判令被告支付加班费 ' + 加班费金额 + ' 元\n' : ''}{是否主张经济补偿 ? '4. 请求判令被告支付经济补偿 ' + 经济补偿金额 + ' 元\n' : ''}{其他诉讼请求 ? '5. ' + 其他诉讼请求 + '\n' : ''}
标的总额：{标的总额}元

事实与理由：
{事实与理由}

此致
_________人民法院

起诉人：{原告姓名}
联系电话：{联系电话}
____年____月____日`
    },
    {
      id: 2,
      name: '劳务合同纠纷民事起诉状',
      category: '民事起诉状',
      description: '适用于劳务合同纠纷案件，包含多被告情形',
      fields: [
        { name: '原告姓名', type: 'text', required: true },
        { name: '原告性别', type: 'select', options: ['男', '女'], required: true },
        { name: '原告出生日期', type: 'date', required: true },
        { name: '原告身份证号', type: 'text', required: true },
        { name: '原告住址', type: 'text', required: true },
        { name: '原告联系电话', type: 'phone', required: true },
        { name: '被告一名称', type: 'text', required: true },
        { name: '被告一信用代码', type: 'text', required: false },
        { name: '被告一地址', type: 'text', required: true },
        { name: '被告一法定代表人', type: 'text', required: false },
        { name: '被告二姓名', type: 'text', required: false },
        { name: '被告二身份证号', type: 'text', required: false },
        { name: '被告二住址', type: 'text', required: false },
        { name: '劳务费金额', type: 'number', required: true },
        { name: '工作内容', type: 'textarea', required: true },
        { name: '工作起始日期', type: 'date', required: true },
        { name: '工作结束日期', type: 'date', required: false },
        { name: '欠薪事实', type: 'textarea', required: true }
      ],
      content: `民事起诉状

原告：{原告姓名}，{原告性别}，{原告出生日期}出生，身份证号：{原告身份证号}，住{原告住址}，联系电话：{原告联系电话}。

被告一：{被告一名称}，统一社会信用代码：{被告一信用代码}，住所地{被告一地址}。
{被告一法定代表人 ? '法定代表人：{被告一法定代表人}，联系电话：。' : ''}{被告二姓名 ? '\n被告二：{被告二姓名}，身份证号：{被告二身份证号}，住{被告二住址}。' : ''}

案由：劳务合同纠纷

诉讼请求：
1. 请求法院判令被告向原告支付拖欠的劳务报酬人民币{劳务费金额}元；
2. 请求法院判令被告承担本案诉讼费用。

事实与理由：
{工作起始日期}，原告受雇于{被告二姓名 || '被告'}，在{工作内容}从事劳务工作。

工作期间，原告依约完成全部工作任务，共计工作{工作起始日期}至{工作结束日期 || '今'}。双方约定劳务费标准为人民币{劳务费金额}元/天。

然而，被告尚有人民币{劳务费金额}元至今未予支付。

{欠薪事实}

此致
____区人民法院

具状人：{原告姓名}
____年____月____日`
    },
    {
      id: 3,
      name: '支持起诉申请书',
      category: '支持起诉',
      description: '农民工向检察机关申请支持起诉',
      fields: [
        { name: '申请人姓名', type: 'text', required: true },
        { name: '出生日期', type: 'date', required: true },
        { name: '年龄', type: 'number', required: true },
        { name: '户籍地地址', type: 'text', required: true },
        { name: '身份证号', type: 'text', required: true },
        { name: '联系方式', type: 'phone', required: true },
        { name: '工作时间起始', type: 'date', required: true },
        { name: '工作时间结束', type: 'date', required: false },
        { name: '工作地点', type: 'text', required: true },
        { name: '欠薪公司名称', type: 'text', required: true },
        { name: '欠薪公司联系方式', type: 'phone', required: false },
        { name: '欠薪金额', type: 'number', required: true },
        { name: '欠薪事由', type: 'textarea', required: true }
      ],
      content: `支持起诉申请书

申请人基本信息：
姓名：{申请人姓名}
出生日期：{出生日期}
年龄：{年龄}岁
户籍地地址：{户籍地地址}
身份证号：{身份证号}
联系方式：{联系方式}

工作信息：
工作时间：{工作时间起始}至{工作时间结束 || '今'}
工作地点：{工作地点}

欠薪情况：
欠薪单位/个人：{欠薪公司名称}
联系方式：{欠薪公司联系方式}
欠薪金额：{欠薪金额}元

欠薪事由：
{欠薪事由}

申请依据：
根据《中华人民共和国民事诉讼法》第十五条的规定，机关、社会团体、企业事业单位对损害国家、集体或者个人民事权益的行为，可以支持受损害的单位或者个人向人民法院起诉。

申请人系农民工群体，在务工期间遭遇工资拖欠问题，因缺乏相关法律专业知识，特向检察机关申请支持起诉。

综上所述，恳请人民检察院依法支持申请人起诉，维护申请人的合法权益。

此致
_________人民检察院

申请人：{申请人姓名}
联系方式：{联系方式}
____年____月____日

附件：
1. 身份证复印件
2. 证据材料（劳务合同/工资条/考勤记录等）`
    },
    {
      id: 4,
      name: '支付令申请书',
      category: '支付令',
      description: '适用于拖欠工资案件，申请支付令',
      fields: [
        { name: '申请人姓名', type: 'text', required: true },
        { name: '申请人电话', type: 'phone', required: true },
        { name: '申请人地址', type: 'text', required: true },
        { name: '被申请人名称', type: 'text', required: true },
        { name: '被申请人地址', type: 'text', required: true },
        { name: '被申请人法定代表人', type: 'text', required: false },
        { name: '欠薪金额', type: 'number', required: true },
        { name: '欠薪起始日期', type: 'date', required: true },
        { name: '工作内容', type: 'text', required: true },
        { name: '事实与理由', type: 'textarea', required: true }
      ],
      content: `支付令申请书

申请人：{申请人姓名}
联系电话：{申请人电话}
地址：{申请人地址}

被申请人：{被申请人名称}
地址：{被申请人地址}
{被申请人法定代表人 ? '法定代表人：{被申请人法定代表人}' : ''}

申请事项：
请求法院依法向被申请人发出支付令，督促其支付拖欠的工资共计{欠薪金额}元。

事实与理由：
申请人在被申请人处从事{工作内容}工作，工作时间为{欠薪起始日期}至今。

在务工期间，被申请人无故拖欠申请人的工资至今未付，累计欠薪金额达{欠薪金额}元。申请人多次向被申请人催讨，被申请人以各种理由推脱，至今仍未支付。

{事实与理由}

综上所述，被申请人拖欠工资的行为已严重损害了申请人的合法权益。根据《中华人民共和国劳动合同法》第三十条的规定，用人单位应当按时足额支付劳动者的劳动报酬。特向贵院申请支付令，请依法支持。

此致
_________人民法院

申请人：{申请人姓名}
联系电话：{申请人电话}
____年____月____日`
    },
    {
      id: 5,
      name: '证据目录',
      category: '证据材料',
      description: '劳动争议案件常用证据清单',
      fields: [
        { name: '证据1名称', type: 'text', required: false },
        { name: '证据1证明内容', type: 'text', required: false },
        { name: '证据2名称', type: 'text', required: false },
        { name: '证据2证明内容', type: 'text', required: false },
        { name: '证据3名称', type: 'text', required: false },
        { name: '证据3证明内容', type: 'text', required: false },
        { name: '证据4名称', type: 'text', required: false },
        { name: '证据4证明内容', type: 'text', required: false },
        { name: '证据5名称', type: 'text', required: false },
        { name: '证据5证明内容', type: 'text', required: false }
      ],
      content: `证据目录

案由：劳动报酬纠纷

序号 | 证据名称 | 证明内容 | 页码
-----|----------|----------|----
1 | {证据1名称 || '劳动合同'} | {证据1证明内容 || '证明劳动关系及工作时间'} | ___
2 | {证据2名称 || '工资条/银行流水'} | {证据2证明内容 || '证明工资标准和实发金额'} | ___
3 | {证据3名称 || '考勤记录'} | {证据3证明内容 || '证明工作时间'} | ___
4 | {证据4名称 || '工作证/工牌'} | {证据4证明内容 || '证明工作身份'} | ___
5 | {证据5名称 || '聊天记录/通话录音'} | {证据5证明内容 || '证明催讨工资的事实'} | ___
6 | 证人证言（如有） | 证明相关事实 | ___

附注：
1. 以上证据均为复印件，原件开庭时出示。
2. 证据按顺序整理，加盖页码。

证据提供人：________________
联系电话：________________
____年____月____日`
    },
    {
      id: 6,
      name: '法律援助申请表',
      category: '法律援助',
      description: '申请免费法律援助服务',
      fields: [
        { name: '申请人姓名', type: 'text', required: true },
        { name: '性别', type: 'select', options: ['男', '女'], required: true },
        { name: '出生日期', type: 'date', required: true },
        { name: '身份证号', type: 'text', required: true },
        { name: '联系电话', type: 'phone', required: true },
        { name: '经济状况', type: 'select', options: ['低保户', '特困人员', '农民工', '其他'], required: true },
        { name: '案件类型', type: 'select', options: ['劳动报酬纠纷', '劳务合同纠纷', '工伤赔偿', '其他'], required: true },
        { name: '被申请人名称', type: 'text', required: false },
        { name: '简要案情', type: 'textarea', required: true }
      ],
      content: `法律援助申请表

申请人基本信息：
姓名：{申请人姓名}
性别：{性别}
出生日期：{出生日期}
身份证号：{身份证号}
联系电话：{联系电话}

经济状况：{经济状况}

申请事项：
请求法律援助机构为申请人提供法律援助服务。

案件类型：{案件类型}
对方当事人：{被申请人名称}

简要案情：
{简要案情}

申请人承诺：
本人承诺所填信息真实有效，如有虚假愿承担相应法律责任。

申请人签名：{申请人姓名}
____年____月____日

附：经济困难证明材料`
    }
  ];
}
