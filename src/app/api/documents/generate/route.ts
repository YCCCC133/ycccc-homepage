import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 文书生成API - generate 端点
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, variables } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: '请选择文书类型' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    // 获取模板
    const { data: templateData } = await client
      .from('templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    let content = '';

    if (templateData) {
      content = templateData.content || '';
    } else {
      // 使用内置默认模板
      content = generateDefaultTemplate(type, variables);
    }

    // 替换变量
    if (variables && content) {
      // 创建一个副本用于显示转换
      const displayVars = { ...variables };
      
      // 1. 处理性别显示
      if (displayVars.plaintiffGender === 'male') {
        displayVars.plaintiffGenderDisplay = '男';
      } else if (displayVars.plaintiffGender === 'female') {
        displayVars.plaintiffGenderDisplay = '女';
      }
      
      // 2. 处理调解意愿显示
      displayVars.understandMediation = displayVars.understandMediation ? '了解' : '不了解';
      displayVars.understandMediationBenefits = displayVars.understandMediationBenefits ? '了解' : '不了解';
      if (displayVars.considerMediation === 'yes') {
        displayVars.considerMediation = '是';
      } else if (displayVars.considerMediation === 'no') {
        displayVars.considerMediation = '否';
      } else if (displayVars.considerMediation === 'uncertain') {
        displayVars.considerMediation = '暂不确定';
      }
      
      // 3. 处理代理权限显示
      displayVars.agentPermission = displayVars.agentPermission === 'special' ? '特别授权' : '一般授权';
      
      // 添加日期到显示变量
      const today = new Date();
      displayVars.dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
      
      // 4. 处理条件语句 {{#if var}}...{{/if}} - 使用原始变量
      content = processConditionals(content, variables);
      
      // 5. 处理否定条件 {{^hasAgent}}...{{/hasAgent}} - 使用原始变量
      content = processNegativeConditionals(content, variables);
      
      // 6. 替换简单变量 - 使用显示变量
      Object.entries(displayVars).forEach(([key, value]) => {
        const strKey = String(key);
        // 转换为显示格式的映射
        const displayKey = getDisplayKey(key, value);
        
        // 多种格式的变量替换
        content = content.replace(new RegExp(`\\{\\{${strKey}\\}\\}`, 'gi'), String(value || ''));
        content = content.replace(new RegExp(`\\{\\{${displayKey}\\}\\}`, 'gi'), String(value || ''));
        
        // camelCase 转换
        const camelKey = strKey.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        content = content.replace(new RegExp(`\\{\\{${camelKey}\\}\\}`, 'gi'), String(value || ''));
      });
      
      // 清理未替换的变量
      content = content.replace(/\{\{[^}]+\}\}/g, '');
      content = content.replace(/\{\{\/[^}]+\}\}/g, '');
      
      // 清理空行
      content = content.replace(/\n{3,}/g, '\n\n');
    }

    const docNumber = `WS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    return NextResponse.json({
      success: true,
      data: {
        docNumber,
        type,
        content,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[documents/generate] Error:', error);
    return NextResponse.json(
      { success: false, error: '生成失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取显示格式的键名
function getDisplayKey(key: string, value: unknown): string {
  const map: Record<string, string> = {
    plaintiffName: '原告姓名',
    plaintiffGender: '原告性别',
    plaintiffGenderDisplay: '原告性别',
    plaintiffBirthDate: '出生日期',
    plaintiffNation: '民族',
    plaintiffWorkUnit: '工作单位',
    plaintiffPosition: '职务',
    plaintiffPhone: '联系电话',
    plaintiffResidence: '住所地',
    plaintiffHabitualResidence: '经常居住地',
    plaintiffIdType: '证件类型',
    plaintiffIdCard: '身份证号',
    defendantName: '被告名称',
    defendantAddress: '被告住所地',
    defendantRegisterAddress: '注册地',
    defendantLegalPerson: '法定代表人',
    defendantLegalPersonPosition: '法定代表人职务',
    defendantLegalPersonPhone: '法定代表人电话',
    defendantCreditCode: '统一社会信用代码',
    defendantType: '类型',
    agentName: '代理人姓名',
    agentUnit: '代理人单位',
    agentPosition: '代理人职务',
    agentPhone: '代理人电话',
    agentPermission: '代理权限',
    claimWage: '是否主张工资支付',
    claimWageDetail: '工资支付金额',
    claimDoubleWage: '是否主张双倍工资',
    claimDoubleWageDetail: '双倍工资金额',
    claimOvertime: '是否主张加班费',
    claimOvertimeDetail: '加班费金额',
    claimAnnualLeave: '是否主张未休年休假工资',
    claimAnnualLeaveDetail: '未休年休假工资金额',
    claimSocialInsurance: '是否主张社会保险损失',
    claimSocialInsuranceDetail: '社会保险损失金额',
    claimTerminationCompensation: '是否主张经济补偿',
    claimIllegalTermination: '是否主张赔偿金',
    claimOther: '其他诉讼请求',
    claimTotalAmount: '标的总额',
    hasPreservation: '是否诉前保全',
    preservationCourt: '保全法院',
    preservationDate: '保全时间',
    preservationCaseNo: '保全案号',
    contractSignInfo: '劳动合同签订情况',
    contractExecutionInfo: '劳动合同履行情况',
    terminationInfo: '解除劳动关系情况',
    injuryInfo: '工伤情况',
    arbitrationInfo: '劳动仲裁情况',
    otherFacts: '其他相关情况',
    legalBasis: '诉请依据',
    evidenceList: '证据清单',
    understandMediation: '了解调解',
    understandMediationBenefits: '了解调解好处',
    considerMediation: '是否考虑调解',
  };
  return map[key] || key;
}

// 处理条件语句 {{#if var}}...{{/if}}
function processConditionals(content: string, variables: Record<string, unknown>): string {
  const regex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  return content.replace(regex, (_, varName, innerContent) => {
    const value = variables[varName];
    if (value && (value === true || String(value).length > 0)) {
      return innerContent.trim();
    }
    return '';
  });
}

// 处理否定条件 {{^hasAgent}}...{{/hasAgent}}
function processNegativeConditionals(content: string, variables: Record<string, unknown>): string {
  const regex = /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  return content.replace(regex, (_, varName, innerContent) => {
    const value = variables[varName];
    if (!value || value === false || String(value).length === 0) {
      return innerContent.trim();
    }
    return '';
  });
}

// 内置劳动争议起诉状模板
function generateDefaultTemplate(type: string, variables?: Record<string, string | number | boolean>): string {
  const v = variables || {};
  
  const plaintiffName = v.plaintiffName || '[原告姓名]';
  const plaintiffGender = v.plaintiffGender === 'male' ? '男' : (v.plaintiffGender === 'female' ? '女' : '[性别]');
  const plaintiffBirthDate = v.plaintiffBirthDate || '[出生日期]';
  const plaintiffNation = v.plaintiffNation || '[民族]';
  const plaintiffWorkUnit = v.plaintiffWorkUnit || '[工作单位]';
  const plaintiffPosition = v.plaintiffPosition || '[职务]';
  const plaintiffPhone = v.plaintiffPhone || '[联系电话]';
  const plaintiffResidence = v.plaintiffResidence || '[住所地]';
  const plaintiffHabitualResidence = v.plaintiffHabitualResidence || '[经常居住地]';
  const plaintiffIdType = v.plaintiffIdType || '居民身份证';
  const plaintiffIdCard = v.plaintiffIdCard || '[身份证号]';
  
  const hasAgent = v.hasAgent || false;
  const agentName = v.agentName || '[代理人姓名]';
  const agentUnit = v.agentUnit || '[代理人单位]';
  const agentPosition = v.agentPosition || '[代理人职务]';
  const agentPhone = v.agentPhone || '[代理人电话]';
  const agentPermission = v.agentPermission === 'special' ? '特别授权' : '一般授权';
  
  const defendantName = v.defendantName || '[被告名称]';
  const defendantAddress = v.defendantAddress || '[被告住所地]';
  const defendantRegisterAddress = v.defendantRegisterAddress || '[注册地]';
  const defendantLegalPerson = v.defendantLegalPerson || '[法定代表人]';
  const defendantLegalPersonPosition = v.defendantLegalPersonPosition || '[职务]';
  const defendantLegalPersonPhone = v.defendantLegalPersonPhone || '[电话]';
  const defendantCreditCode = v.defendantCreditCode || '[统一社会信用代码]';
  const defendantType = v.defendantType || '[类型]';

  // 构建诉讼请求
  let claims = '';
  let claimNo = 1;
  
  if (v.claimWage) {
    claims += `${claimNo++}. 判令被告支付原告工资 ${v.claimWageDetail || ''}元；\n`;
  }
  if (v.claimDoubleWage) {
    claims += `${claimNo++}. 判令被告支付原告未签订书面劳动合同双倍工资 ${v.claimDoubleWageDetail || ''}元；\n`;
  }
  if (v.claimOvertime) {
    claims += `${claimNo++}. 判令被告支付原告加班费 ${v.claimOvertimeDetail || ''}元；\n`;
  }
  if (v.claimAnnualLeave) {
    claims += `${claimNo++}. 判令被告支付原告未休年休假工资 ${v.claimAnnualLeaveDetail || ''}元；\n`;
  }
  if (v.claimSocialInsurance) {
    claims += `${claimNo++}. 判令被告支付原告未依法缴纳社会保险费造成的经济损失 ${v.claimSocialInsuranceDetail || ''}元；\n`;
  }
  if (v.claimTerminationCompensation) {
    claims += `${claimNo++}. 判令被告支付原告解除劳动合同经济补偿金；\n`;
  }
  if (v.claimIllegalTermination) {
    claims += `${claimNo++}. 判令被告支付原告违法解除劳动合同赔偿金；\n`;
  }
  if (v.claimOther) {
    claims += `${claimNo++}. ${v.claimOther}；\n`;
  }
  if (v.claimLitigationFee !== false) {
    claims += `${claimNo++}. 本案诉讼费用由被告承担。\n`;
  }
  
  const claimTotalAmount = v.claimTotalAmount || '[标的总额]';
  
  // 诉前保全
  const hasPreservation = v.hasPreservation || false;
  const preservationInfo = hasPreservation
    ? `已申请诉前保全
保全法院：${v.preservationCourt || ''}
保全时间：${v.preservationDate || ''}
保全案号：${v.preservationCaseNo || ''}`
    : '未申请诉前保全';

  // 事实与理由
  let facts = '';
  if (v.contractSignInfo) {
    facts += `一、劳动合同签订情况\n${v.contractSignInfo}\n\n`;
  }
  if (v.contractExecutionInfo) {
    facts += `二、劳动合同履行情况\n${v.contractExecutionInfo}\n\n`;
  }
  if (v.terminationInfo) {
    facts += `三、解除或终止劳动关系情况\n${v.terminationInfo}\n\n`;
  }
  if (v.injuryInfo) {
    facts += `四、工伤情况\n${v.injuryInfo}\n\n`;
  }
  if (v.arbitrationInfo) {
    facts += `五、劳动仲裁相关情况\n${v.arbitrationInfo}\n\n`;
  }
  if (v.otherFacts) {
    facts += `六、其他相关情况\n${v.otherFacts}\n\n`;
  }
  if (v.legalBasis) {
    facts += `七、诉请依据\n${v.legalBasis}\n\n`;
  }
  if (v.evidenceList) {
    facts += `八、证据清单\n${v.evidenceList}`;
  }
  if (!facts) {
    facts = '[请填写事实与理由]';
  }

  // 调解意愿
  const mediationUnderstand = v.understandMediation ? '了解' : '不了解';
  const mediationBenefits = v.understandMediationBenefits ? '了解' : '不了解';
  const mediationConsider = v.considerMediation 
    ? (v.considerMediation === 'yes' ? '是' : (v.considerMediation === 'no' ? '否' : '暂不确定'))
    : '';

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return `劳动争议纠纷民事起诉状

【当事人信息】

一、原告（自然人）
姓名：${plaintiffName}
性别：${plaintiffGender}
出生日期：${plaintiffBirthDate}
民族：${plaintiffNation}
工作单位：${plaintiffWorkUnit || ''} 职务：${plaintiffPosition || ''}
联系电话：${plaintiffPhone}
住所地（户籍所在地）：${plaintiffResidence}
经常居住地：${plaintiffHabitualResidence || ''}
证件类型：${plaintiffIdType}
证件号码：${plaintiffIdCard}

二、委托诉讼代理人
${hasAgent ? `有
委托诉讼代理人：${agentName}
单位：${agentUnit} 职务：${agentPosition} 联系电话：${agentPhone}
代理权限：${agentPermission}` : '无'}

三、被告（法人、非法人组织）
名称：${defendantName}
住所地（主要办事机构所在地）：${defendantAddress}
注册地/登记地：${defendantRegisterAddress || ''}
法定代表人/负责人：${defendantLegalPerson || ''} 职务：${defendantLegalPersonPosition || ''} 联系电话：${defendantLegalPersonPhone || ''}
统一社会信用代码：${defendantCreditCode || ''}
类型：${defendantType || ''}

【诉讼请求】

${claims}

标的总额：人民币${claimTotalAmount}元

【诉前保全】

${preservationInfo}

【事实与理由】

${facts}

【对纠纷解决方式的意愿】

是否了解调解作为非诉讼纠纷解决方式：${mediationUnderstand}
是否了解先行调解的好处：${mediationBenefits}
是否考虑先行调解：${mediationConsider}

【特别提示】
诉讼参加人应遵守诚信原则如实认真填写表格。如果诉讼参加人违反有关规定，虚假诉讼、恶意诉讼、滥用诉权，人民法院将视违法情形依法追究责任。

此致
XXXX人民法院

                                                                        具状人（签名）：${plaintiffName}
                                                                        日期：${dateStr}`;
}
