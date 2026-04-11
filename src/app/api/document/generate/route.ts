import { NextRequest, NextResponse } from 'next/server';
import { LLMClient } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { uploadDocument } from '@/storage/s3-storage';

// 使用 Node.js runtime
export const runtime = 'nodejs';

interface GenerateRequest {
  // 文书类型
  documentType?: 'litigation' | 'support_prosecution' | 'labor_dispute' | 'payment_order';
  
  // 申请人信息
  applicantName: string;
  applicantGender?: string;
  applicantBirthDate?: string;
  applicantNation?: string;
  applicantIdCard?: string;
  applicantPhone?: string;
  applicantAddress?: string;
  applicantResidence?: string;  // 户籍地址
  applicantWorkUnit?: string;   // 工作单位
  
  // 被告信息
  defendantName: string;
  defendantType?: 'company' | 'individual';
  defendantCode?: string;
  defendantAddress?: string;
  defendantLegalPerson?: string;
  defendantPhone?: string;
  // 第二被告
  hasSecondDefendant?: boolean;
  secondDefendantName?: string;
  secondDefendantIdCard?: string;
  secondDefendantAddress?: string;
  
  // 案件信息
  projectName?: string;
  workLocation?: string;
  workPosition?: string;     // 工作岗位
  workContent?: string;      // 工作内容
  workStartDate?: string;
  workEndDate?: string;
  owedAmount: string;        // 欠薪金额（注意：表单用 unpaidAmount）
  owedAmountCN?: string;
  workDays?: string;
  dailyRate?: string;
  // 表单字段兼容（unpaidAmount -> owedAmount）
  unpaidAmount?: string;
  unpaidStartDate?: string;
  unpaidReason?: string;
  unpaidCompanyName?: string;
  unpaidCompanyPhone?: string;
  
  // 诉讼请求
  requestType?: string[];
  salaryAmount?: string;            // 工资金额
  doubleWageAmount?: string;        // 双倍工资
  overtimeAmount?: string;          // 加班费
  economicCompensationAmount?: string; // 经济补偿
  otherRequests?: string;          // 其他请求
  totalAmount?: string;             // 总金额
  
  // 事实与理由
  factDescription?: string;
  
  // 提交法院
  courtName?: string;
  
  // 其他（兼容新旧字段）
  hasContract?: boolean | string;
  hasEvidence?: boolean | string;
  hasWitness?: boolean;
  
  // 兼容旧字段
  name?: string;
  phone?: string;
  companyName?: string;
  owedAmountOld?: string;
  workPeriod?: string;
  hasContractOld?: string;
  hasEvidenceOld?: string;
  description?: string;
}

// 获取相关案例
async function getRelatedCases(category?: string): Promise<string> {
  try {
    const client = getSupabaseClient();
    let query = client
      .from('knowledge_base')
      .select('case_number, case_type, summary, full_text, result')
      .eq('is_active', true)
      .limit(3);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return '';
    }

    // 构建案例参考内容
    return data.map((c: { case_number: string; case_type: string; summary: string; full_text: string; result: string }) =>
      `【案例${c.case_number}】\n案由：${c.case_type}\n裁判结果：${c.result}\n裁判摘要：${c.summary}\n`
    ).join('\n');
  } catch (error) {
    console.error('获取相关案例失败:', error);
    return '';
  }
}

// 推断案件分类
function inferCategory(data: GenerateRequest): string {
  const desc = (data.description + ' ' + data.hasContract).toLowerCase();
  
  if (desc.includes('派遣') || desc.includes('外包')) {
    return '劳务派遣或劳务外包类欠薪';
  }
  if (desc.includes('建筑') || desc.includes('工程') || desc.includes('工地')) {
    return '建设工程类欠薪';
  }
  if (desc.includes('工伤') || desc.includes('职业病')) {
    return '工伤或职业病伴欠薪类';
  }
  // 兼容新旧字段：hasContract 可能是 boolean 或 string
  const hasContractValue = data.hasContract;
  if (hasContractValue === false || hasContractValue === '没有' || hasContractValue === '无') {
    return '无劳动合同类欠薪';
  }
  
  return '基础拖欠劳动报酬类欠薪';
}

// 根据文书类型选择模板
function getDocumentTemplate(documentType?: string): {
  title: string;
  systemPrompt: string;
} {
  switch (documentType) {
    case 'support_prosecution':
      return {
        title: '支持起诉申请书',
        systemPrompt: `你是一位专业的劳动法律师，擅长为农民工撰写支持起诉申请书。

## 输出格式要求【关键】
严格按照以下规范Markdown格式生成文书，**禁止输出纯文本或格式混乱的内容**：

# 支持起诉申请书

## 申请人（农民工）

- **姓名**：[填入姓名]
- **性别**：[男/女]
- **出生日期**：[年-月-日]
- **民族**：[民族]
- **住所地**：[详细地址]
- **联系电话**：[电话号码]

## 被申请人（用人单位）

- **名称**：[公司全称]
- **住所地**：[公司注册地址]
- **法定代表人**：[姓名，如不清楚填"不详"]

## 请求事项

1. 请求人民检察院依法对被申请人拖欠农民工劳动报酬的行为支持起诉；
2. 请求人民检察院依法维护申请人的合法权益。

## 事实与理由

[详细描述以下内容]

### 一、工作情况
[描述入职时间、工作岗位、工作内容等]

### 二、欠薪事实
[详细描述欠薪的时间、金额、原因等]

### 三、证据材料
[列举现有证据]

### 四、法律依据
1. 《中华人民共和国劳动合同法》第三十条第一款：用人单位应当按照劳动合同约定和国家规定，向劳动者及时足额支付劳动报酬。
2. 《保障农民工工资支付条例》第三条：农民工有按时足额获得工资的权利。任何单位和个人不得拖欠农民工工资。

## 此致

**[填写检察院名称，如：XX市XX区人民检察院**

**申请人**：[姓名]  
**联系电话**：[电话]  
**日期**：[年]年[月]月[日]日

---

**附件：**
1. 申请人身份证复印件
2. 证据材料清单及证据复印件
3. 劳动关系证明材料

---

## 生成要求
1. 所有"[...]"为需要填写的内容，按用户提供的真实信息填充
2. 无法确认的信息填"不详"，不要留空
3. 事实与理由要清晰分段，使用"### "小标题
4. 金额使用具体数字（如：12345.67元）
5. 日期如无法确定，使用"[年]年[月]月[日]日"占位
6. 严格保持Markdown层级结构，不要省略任何必要模块`
      };

    case 'labor_dispute':
      return {
        title: '劳动争议仲裁申请书',
        systemPrompt: `你是一位专业的劳动法律师，擅长为农民工撰写劳动争议仲裁申请书。

## 输出格式要求【关键】
严格按照以下规范Markdown格式生成文书，**禁止输出纯文本或格式混乱的内容**：

# 劳动争议仲裁申请书

## 申请人（劳动者）

- **姓名**：[填入姓名]
- **性别**：[男/女]
- **出生日期**：[年-月-日]
- **民族**：[民族]
- **联系电话**：[电话号码]
- **住所地**：[详细地址]
- **邮政编码**：[邮编]

## 被申请人（用人单位）

- **名称**：[公司全称]
- **统一社会信用代码**：[代码，如不清楚填"不详"]
- **住所地**：[公司注册地址]
- **法定代表人**：[姓名，如不清楚填"不详"]
- **联系电话**：[电话，如不清楚填"不详"]

## 仲裁请求

1. 请求裁决被申请人支付拖欠的工资人民币[金额]元；
2. 请求裁决被申请人支付未签订书面劳动合同的双倍工资差额人民币[金额]元；
3. 请求裁决被申请人支付经济补偿金人民币[金额]元；
4. 请求裁决被申请人依法出具解除/终止劳动合同证明；
5. 其他请求：[如有]

## 事实与理由

[详细描述以下内容]

### 一、基本情况
[描述入职时间、工作岗位、工作地点等]

### 二、劳动关系建立
[描述劳动合同签订情况]

### 三、欠薪情况
[详细描述欠薪的时间、金额明细]

### 四、其他争议
[描述加班费、年休假等其他争议]

### 五、证据清单
| 序号 | 证据名称 | 证明内容 | 页数 |
|------|----------|----------|------|
| 1 | 工资流水 | 证明劳动关系和工资标准 | X页 |
| 2 | 工作证/工牌 | 证明劳动关系 | X页 |
| 3 | [其他证据] | [证明内容] | X页 |

## 此致

**[填写劳动人事争议仲裁委员会名称，如：XX市XX区劳动人事争议仲裁委员会]**

**申请人（签名或盖章）**：[姓名]  
**日期**：[年]年[月]月[日]日

---

**附件：**
1. 身份证复印件 X 份
2. 证据材料清单及证据复印件 X 份
3. 其他材料 [份数]

---

## 生成要求
1. 所有"[...]"为需要填写的内容，按用户提供的真实信息填充
2. 无法确认的信息填"不详"，不要留空
3. 事实与理由要清晰分段，使用"### "小标题
4. 证据清单必须使用Markdown表格格式
5. 金额使用具体数字
6. 日期如无法确定，使用"[年]年[月]月[日]日"占位
7. 严格保持Markdown层级结构，不要省略任何必要模块`
      };

    case 'payment_order':
      return {
        title: '支付令申请书',
        systemPrompt: `你是一位专业的劳动法律师，擅长为农民工撰写支付令申请书。

## 输出格式要求【关键】
严格按照以下规范Markdown格式生成文书，**禁止输出纯文本或格式混乱的内容**：

# 支付令申请书

## 申请人（债权人）

- **姓名**：[填入姓名]
- **性别**：[男/女]
- **出生日期**：[年-月-日]
- **民族**：[民族]
- **住所地**：[详细地址]
- **联系电话**：[电话号码]

## 被申请人（债务人）

- **名称/姓名**：[公司全称或个人姓名]
- **住所地**：[公司注册地址或个人住址]
- **法定代表人/负责人**：[姓名，如不清楚填"不详"]
- **联系电话**：[电话，如不清楚填"不详"]

## 请求事项

请求人民法院向被申请人发出支付令，督促被申请人立即支付拖欠申请人的工资人民币[金额]元。

## 事实与理由

### 一、基本情况
[描述入职时间、工作岗位、工作地点等]

### 二、欠薪事实
[详细描述欠薪发生的时间、金额、未支付原因等]

### 三、法律依据
1. 《中华人民共和国民事诉讼法》第二百二十一条：债权人请求债务人给付金钱、有价证券，符合下列条件的，可以向有管辖权的基层人民法院申请支付令...
2. 《中华人民共和国劳动合同法》第三十条：用人单位应当按照劳动合同约定和国家规定，向劳动者及时足额支付劳动报酬。

### 四、证据材料
[根据用户提供的证据信息列举]

| 序号 | 证据名称 | 证明内容 |
|------|----------|----------|
| 1 | 工资流水 | 证明劳动关系和工资标准 |
| 2 | [其他证据] | [证明内容] |

## 此致

**[填写基层人民法院名称，如：XX市XX区人民法院]**

**申请人（签名）**：[姓名]  
**联系电话**：[电话]  
**日期**：[年]年[月]月[日]日

---

**附件：**
1. 申请人身份证复印件 1 份
2. 证据材料清单及证据复印件 X 份
3. 欠薪证明材料 [X] 份

---

## 生成要求
1. 所有"[...]"为需要填写的内容，按用户提供的真实信息填充
2. 无法确认的信息填"不详"，不要留空
3. 事实与理由要清晰分段，使用"### "小标题
4. 证据清单必须使用Markdown表格格式
5. 金额使用具体数字
6. 日期如无法确定，使用"[年]年[月]月[日]日"占位
7. 严格保持Markdown层级结构，不要省略任何必要模块
8. 支付令申请书适用于劳动关系明确、欠薪事实清楚的案件`
      };

    default: // civil_complaint
      return {
        title: '民事起诉状',
        systemPrompt: `你是一位专业的劳动法律师，擅长为农民工撰写民事起诉状。

## 输出格式要求【关键】
严格按照以下规范Markdown格式生成文书，**禁止输出纯文本或格式混乱的内容**：

# 民事起诉状

## 原告（自然人）

- **姓名**：[填入姓名]
- **性别**：[男/女]
- **出生日期**：[年-月-日]
- **民族**：[民族]
- **住所地**：[详细地址]
- **联系电话**：[电话号码]

## 被告（用人单位）

- **名称**：[公司全称]
- **住所地**：[公司注册地址]
- **法定代表人**：[姓名，如不清楚填"不详"]
- **联系电话**：[电话，如不清楚填"不详"]

## 诉讼请求

1. 请求判令被告支付拖欠的工资人民币[金额]元；
2. 请求判令被告支付赔偿金人民币[金额]元（依据《劳动合同法》第八十五条）；
3. 请求判令被告支付经济补偿金人民币[金额]元；
4. 本案诉讼费用由被告承担。

## 事实与理由

### 一、工作情况
[描述入职时间、工作岗位、工作内容、工资约定等]

### 二、欠薪事实
[详细描述欠薪发生的时间、金额、未支付原因等]

### 三、证据材料
[根据用户提供的证据信息列举]

| 序号 | 证据名称 | 证明内容 | 来源 |
|------|----------|----------|------|
| 1 | 工资流水 | 证明劳动关系和工资标准 | 银行 |
| 2 | 工作证/工牌 | 证明劳动关系 | 公司发放 |
| 3 | 考勤记录 | 证明工作事实 | 公司保存 |
| 4 | 证人证言 | [如有] | [证人姓名] |

### 四、法律依据
1. 《中华人民共和国劳动合同法》第三十条：用人单位应当按照劳动合同约定和国家规定，向劳动者及时足额支付劳动报酬。
2. 《最高人民法院关于审理劳动争议案件适用法律问题的解释（一）》[相关条款]。

## 此致

**[填写管辖法院，如：XX市XX区人民法院]**

**具状人（原告签名）**：[姓名]  
**联系电话**：[电话]  
**日期**：[年]年[月]月[日]日

---

**附件：**
1. 原告身份证复印件 1 份
2. 证据材料清单及证据复印件 [X] 份
3. 送达地址确认书 1 份

---

## 生成要求
1. 所有"[...]"为需要填写的内容，按用户提供的真实信息填充
2. 无法确认的信息填"不详"，不要留空
3. 事实与理由要清晰分段，使用"### "小标题
4. 证据清单必须使用Markdown表格格式
5. 金额使用具体数字
6. 日期如无法确定，使用"[年]年[月]月[日]日"占位
7. 严格保持Markdown层级结构，不要省略任何必要模块
8. 结尾的"---"是Markdown的分隔线，用于区分正文和附件`
      };
  }
}

// 生成文书
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    
    // 兼容新旧字段 - 表单字段映射
    const applicantName = body.applicantName || body.name;
    const applicantPhone = body.applicantPhone || body.phone;
    const defendantName = body.defendantName || body.companyName;
    // 欠薪金额：表单用 unpaidAmount，API用 owedAmount
    const owedAmount = body.owedAmount || body.unpaidAmount || body.owedAmountOld;
    const factDescription = body.factDescription || body.unpaidReason || body.description;
    const hasContract = body.hasContract !== undefined ? body.hasContract : body.hasContractOld;
    const hasEvidence = body.hasEvidence || body.hasEvidenceOld;
    
    // 表单字段：documentType 映射
    const documentTypeMap: Record<string, string> = {
      'support': 'support_prosecution',
      'labor_dispute': 'labor_dispute',
      'litigation': 'civil_complaint',
      'payment_order': 'payment_order'
    };
    const normalizedDocType = documentTypeMap[body.documentType || ''] || body.documentType || 'civil_complaint';

    // 工作时间
    const workPeriod = body.workStartDate && body.workEndDate 
      ? `${body.workStartDate} 至 ${body.workEndDate}` 
      : body.workPeriod;

    // 验证必填字段
    if (!applicantName || !defendantName || !owedAmount) {
      return NextResponse.json({
        success: false,
        error: '请填写必要的姓名、被告名称、欠薪金额等信息'
      }, { status: 400 });
    }

    // 推断案件分类并获取相关案例
    const category = inferCategory(body);
    const relatedCases = await getRelatedCases(category);

    // 获取文书模板（使用规范化的类型）
    const { title, systemPrompt } = getDocumentTemplate(normalizedDocType);
    const documentTitle = title;

    // 构建详细的用户提示词 - 包含所有表单字段
    const userPrompt = `## 用户提供的真实信息

### 一、申请人（原告）信息
| 字段 | 内容 |
|------|------|
| 姓名 | ${applicantName} |
| 性别 | ${body.applicantGender || '不详'} |
| 出生日期 | ${body.applicantBirthDate || '不详'} |
| 民族 | ${body.applicantNation || '不详'} |
| 身份证号 | ${body.applicantIdCard || '不详'} |
| 联系电话 | ${applicantPhone || '不详'} |
| 户籍地址 | ${body.applicantAddress || body.applicantResidence || '不详'} |
| 工作单位 | ${body.applicantWorkUnit || '不详'} |

### 二、被告（被申请人）信息
| 字段 | 内容 |
|------|------|
| 名称/姓名 | ${defendantName} |
| 类型 | ${body.defendantType === 'individual' ? '个人' : '单位/公司'} |
| 统一社会信用代码/身份证号 | ${body.defendantCode || '不详'} |
| 住所地/地址 | ${body.defendantAddress || '不详'} |
| 法定代表人/负责人 | ${body.defendantLegalPerson || '不详'} |
| 联系电话 | ${body.defendantPhone || '不详'} |
${body.hasSecondDefendant ? `| 是否有第二被告 | 是 |
| 第二被告姓名 | ${body.secondDefendantName || '不详'} |
| 第二被告身份证号 | ${body.secondDefendantIdCard || '不详'} |
| 第二被告地址 | ${body.secondDefendantAddress || '不详'} |` : ''}

### 三、案件基本情况
| 字段 | 内容 |
|------|------|
| 工程/项目名称 | ${body.projectName || '不详'} |
| 工作地点 | ${body.workLocation || '不详'} |
| 工作岗位 | ${body.workPosition || '不详'} |
| 工作内容 | ${body.workContent || '不详'} |
| 工作开始时间 | ${body.workStartDate || '不详'} |
| 工作结束时间 | ${body.workEndDate || '不详'} |
| 工作时间段 | ${workPeriod || '用户未提供'} |
| 拖欠工资金额 | ${owedAmount}元 |
| 金额大写 | ${body.owedAmountCN || '由系统生成'} |
| 工作天数 | ${body.workDays || '不详'} |
| 日工资标准 | ${body.dailyRate || '不详'} |

### 四、欠薪详情
| 字段 | 内容 |
|------|------|
| 欠薪开始时间 | ${body.unpaidStartDate || '不详'} |
| 欠薪原因 | ${body.unpaidReason || '不详'} |
| 欠薪单位名称 | ${body.unpaidCompanyName || '不详'} |
| 欠薪单位电话 | ${body.unpaidCompanyPhone || '不详'} |

### 五、诉讼请求
${body.requestType && body.requestType.length > 0 
  ? body.requestType.map(r => {
      const map: Record<string, string> = {
        'salary': '请求判令被告支付拖欠的工资',
        'compensation': '请求判令被告支付赔偿金',
        'economic': '请求判令被告支付经济补偿金',
        'double': '请求判令被告支付未签订书面劳动合同的双倍工资差额'
      };
      return `- ${map[r] || r}`;
    }).join('\n')
  : '- 请求判令被告支付拖欠的工资'}
${body.salaryAmount ? `\n- 工资金额：${body.salaryAmount}元` : ''}
${body.doubleWageAmount ? `\n- 双倍工资差额：${body.doubleWageAmount}元` : ''}
${body.overtimeAmount ? `\n- 加班费：${body.overtimeAmount}元` : ''}
${body.economicCompensationAmount ? `\n- 经济补偿金：${body.economicCompensationAmount}元` : ''}
${body.totalAmount ? `\n- 诉讼请求总金额：${body.totalAmount}元` : ''}
${body.otherRequests ? `\n- 其他请求：${body.otherRequests}` : ''}

### 六、事实与理由
${factDescription || '用户未提供详细描述'}

### 七、证据材料
| 字段 | 内容 |
|------|------|
| 是否有劳动合同 | ${hasContract ? '有' : '无'} |
| 是否有证据 | ${hasEvidence ? '有' : '不详'} |
| 证据清单 | ${hasEvidence || '用户未提供具体证据'} |

### 八、管辖法院
${body.courtName || '待填写'}

${relatedCases ? `## 参考案例

以下是与用户情况相似的法院判决案例，可作为参考：

${relatedCases}` : ''}

---

## 生成要求

1. 根据上述**真实信息**生成文书
2. 所有"[...]"占位符用真实信息替换
3. 信息不完整的字段填"不详"
4. 输出**完整的、格式规范的Markdown文书**
5. **不要省略任何章节**，包括附件部分
6. 确保Markdown语法正确（标题用#、列表用1.或-、表格用|等）
7. 金额使用具体数字，如：50000元
8. 日期如无法确定，使用"[年]年[月]月[日]日"占位`;

    // 调用 AI 生成文书
    const llmClient = new LLMClient();

    let generatedContent = '';

    // 使用流式生成
    const stream = llmClient.stream(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      { temperature: 0.3 }
    );

    // 收集完整响应
    for await (const chunk of stream) {
      if (chunk.content) {
        generatedContent += chunk.content.toString();
      }
    }

    if (!generatedContent) {
      return NextResponse.json({
        success: false,
        error: '生成文书失败，请重试'
      }, { status: 500 });
    }

    // 保存到数据库
    const supabase = getSupabaseClient();
    const { data: docData, error: dbError } = await supabase
      .from('documents')
      .insert({
        document_type: documentTitle,
        document_content: generatedContent,
        applicant_name: applicantName,
        applicant_phone: applicantPhone,
        template_used: category
      })
      .select()
      .single();

    if (dbError) {
      console.error('保存文书到数据库失败:', dbError);
    }

    // 上传到对象存储
    let fileKey = null;
    let downloadUrl = null;
    
    if (docData) {
      try {
        // 使用.md扩展名
        const fileName = `${documentTitle}_${name}_${Date.now()}.md`;
        const uploadResult = await uploadDocument(generatedContent, fileName);
        fileKey = uploadResult.key;
        downloadUrl = uploadResult.url;

        // 更新数据库中的文件信息
        await supabase
          .from('documents')
          .update({
            file_key: fileKey,
            file_name: fileName,
            file_size: Buffer.byteLength(generatedContent, 'utf-8'),
          })
          .eq('id', docData.id);
      } catch (uploadError) {
        console.error('上传文书到对象存储失败:', uploadError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        document: generatedContent,
        document_id: docData?.id,
        document_type: documentTitle,
        category: category,
        file_key: fileKey,
        download_url: downloadUrl,
      },
      message: '文书生成成功'
    });

  } catch (error) {
    console.error('生成文书失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 });
  }
}
