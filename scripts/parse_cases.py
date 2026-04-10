#!/usr/bin/env python3
import os
import re
import json
from pathlib import Path

# 数据目录
data_dir = Path("/workspace/projects/assets/数据源")

cases = []

for md_file in sorted(data_dir.glob("*.md")):
    try:
        content = md_file.read_text(encoding='utf-8')
        
        # 提取分类
        category_match = re.search(r'- 分类：(.+)', content)
        category = category_match.group(1).strip() if category_match else ''
        
        # 提取法院
        court_match = re.search(r'- 法院：(.+)', content)
        court = court_match.group(1).strip() if court_match else ''
        
        # 提取案号
        case_number_match = re.search(r'- 案号：(.+)', content)
        case_number = case_number_match.group(1).strip() if case_number_match else ''
        
        # 提取当事人
        parties_match = re.search(r'- 核心当事人：(.+)', content)
        parties = parties_match.group(1).strip() if parties_match else ''
        
        # 提取案由
        case_type_match = re.search(r'- 案由：(.+)', content)
        case_type = case_type_match.group(1).strip() if case_type_match else ''
        
        # 提取程序
        procedure_match = re.search(r'- 程序：(.+)', content)
        procedure_type = procedure_match.group(1).strip() if procedure_match else ''
        
        # 提取裁判结果
        result_match = re.search(r'- 裁判结果：(.+)', content)
        result = result_match.group(1).strip() if result_match else ''
        
        # 提取裁判主文摘要
        summary_match = re.search(r'- 裁判主文摘要：(.+)', content)
        summary = summary_match.group(1).strip() if summary_match else ''
        
        # 提取全文
        full_text_match = re.search(r'## 全文\n([\s\S]*)', content)
        full_text = full_text_match.group(1).strip() if full_text_match else ''
        
        if case_number:
            cases.append({
                "category": category,
                "court": court,
                "case_number": case_number,
                "parties": parties,
                "case_type": case_type,
                "procedure_type": procedure_type,
                "result": result,
                "summary": summary,
                "full_text": full_text
            })
            print(f"解析成功: {case_number}")
    except Exception as e:
        print(f"解析失败 {md_file.name}: {e}")

print(f"\n总计解析 {len(cases)} 个案例")

# 输出为JSON
with open("/tmp/cases.json", "w", encoding="utf-8") as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)

print("已保存到 /tmp/cases.json")
