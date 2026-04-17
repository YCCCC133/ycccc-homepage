# 护薪平台 - 检察支持起诉智能平台

> 为农民工群体提供薪酬权益保障服务的智能化法律服务平台

## 项目概述

护薪平台是一款面向农民工群体的检察支持起诉智能辅助系统，提供从欠薪线索填报、智能法律咨询、法律文书生成到支持起诉申请的全流程服务。

### 核心功能模块

| 模块 | 路径 | 描述 |
|------|------|------|
| 首页 | `/` | 平台介绍与功能入口 |
| 线索填报 | `/report` | 农民工自主填报欠薪线索 |
| 智能咨询 | `/consult` | AI 智能法律咨询服务（SSE 流式输出） |
| 文书生成 | `/document` | 一键生成民事起诉状 |
| 我的文书 | `/documents` | 文书记录管理与回显 |
| 支持起诉 | `/apply` | 支持起诉申请与法律援助申请 |
| 案件查询 | `/cases` | 案件进度追踪查询 |
| 后台管理 | `/admin/*` | 管理员数据管理与审核 |

---

## 技术架构

### 技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Next.js | 16 (App Router) | React 全栈框架 |
| 语言 | TypeScript | 5 | 类型安全 |
| UI 组件 | shadcn/ui | - | 基于 Radix UI 的组件库 |
| 样式 | Tailwind CSS | 4 | 原子化 CSS |
| 表单 | react-hook-form + zod | - | 表单验证 |
| 后端数据库 | Supabase | - | PostgreSQL + Storage |
| AI 服务 | coze-coding-dev-sdk | - | LLM 调用 |
| 包管理 | pnpm | - | 依赖管理 |

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Next.js)                         │
├─────────────────────────────────────────────────────────────┤
│  /report     线索填报    /consult    智能咨询    /document   │
│  /apply      支持起诉    /cases      案件查询    /admin      │
├─────────────────────────────────────────────────────────────┤
│                      API Routes (/api/*)                     │
│  /api/consult     /api/documents/*   /api/apply             │
│  /api/report      /api/cases         /api/admin/*           │
├─────────────────────────────────────────────────────────────┤
│                    集成服务层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │  Supabase   │  │   LLM AI    │  │  File Storage   │     │
│  │  Database   │  │  (流式输出) │  │  (对象存储)     │     │
│  └─────────────┘  └─────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
projects/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (public)/                 # 公开页面路由组
│   │   │   ├── page.tsx             # 首页
│   │   │   ├── report/              # 线索填报页面
│   │   │   ├── consult/             # 智能咨询页面
│   │   │   ├── document/            # 文书生成页面
│   │   │   ├── documents/          # 我的文书页面
│   │   │   ├── apply/               # 支持起诉页面
│   │   │   └── cases/               # 案件查询页面
│   │   ├── admin/                    # 后台管理路由组
│   │   │   ├── login/               # 管理员登录
│   │   │   ├── dashboard/          # 管理后台首页
│   │   │   └── ...                 # 其他管理页面
│   │   ├── api/                      # API 路由
│   │   │   ├── consult/            # 智能咨询 API (SSE)
│   │   │   ├── documents/          # 文书管理 API
│   │   │   │   ├── route.ts        # 文书列表 (GET/POST)
│   │   │   │   ├── submit/         # 文书提交 (POST)
│   │   │   │   ├── generate/       # 文书生成 (POST)
│   │   │   │   └── [id]/          # 文书详情 (GET/PUT/DELETE)
│   │   │   ├── apply/              # 支持起诉 API
│   │   │   ├── report/             # 线索填报 API
│   │   │   ├── cases/              # 案件管理 API
│   │   │   ├── announcements/      # 公告管理 API
│   │   │   └── admin/               # 后台管理 API
│   │   │       ├── login/          # 登录验证
│   │   │       ├── data/           # 数据统计
│   │   │       ├── cases/          # 案件管理
│   │   │       ├── files/         # 文件管理
│   │   │       ├── templates/      # 模板管理
│   │   │       ├── settings/       # 系统设置
│   │   │       └── notifications/ # 通知管理
│   │   ├── layout.tsx               # 根布局
│   │   ├── page.tsx                 # 首页
│   │   └── globals.css             # 全局样式
│   │
│   ├── components/                   # 组件目录
│   │   ├── ui/                      # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx             # 表单组件
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── label.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── accordion.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── toast.tsx            # Toast 通知
│   │   │   └── sonner.tsx           # Sonner 通知
│   │   ├── navigation.tsx           # 导航栏组件
│   │   ├── footer.tsx               # 页脚组件
│   │   └── providers.tsx            # 全局 Provider
│   │
│   ├── lib/                          # 工具库
│   │   └── utils.ts                 # cn() 等工具函数
│   │
│   ├── hooks/                        # 自定义 Hooks
│   │   └── use-auth.ts              # 认证 Hook
│   │
│   └── storage/                      # 存储层
│       └── database/
│           └── supabase-client.ts   # Supabase 客户端
│
├── public/                           # 静态资源
│   └── images/                       # 图片资源
│
├── .env.local                       # 本地环境变量
├── .env.example                     # 环境变量示例
├── .coze                            # Coze CLI 配置
├── package.json
├── tsconfig.json
└── README.md
```

---

## 核心模块详解

### 1. 文书生成模块 (`/document`)

#### 功能概述

提供"一键生成民事起诉状"服务，基于劳动争议纠纷民事起诉状标准模板，通过表单收集案件信息，生成规范化法律文书。

#### 表单数据结构

```typescript
// 原告信息
interface PlaintiffInfo {
  plaintiffName: string;           // 姓名 *
  plaintiffGender: 'male' | 'female'; // 性别 *
  plaintiffBirthDate: string;       // 出生日期 *
  plaintiffNation?: string;         // 民族
  plaintiffWorkUnit?: string;      // 工作单位
  plaintiffPosition?: string;      // 职务
  plaintiffPhone: string;          // 联系电话 *
  plaintiffResidence: string;      // 住所地（户籍所在地）*
  plaintiffHabitualResidence?: string; // 经常居住地
  plaintiffIdType?: string;        // 证件类型
  plaintiffIdCard: string;         // 证件号码 *
}

// 被告信息
interface DefendantInfo {
  defendantName: string;           // 用人单位名称 *
  defendantAddress: string;         // 住所地 *
  defendantRegisterAddress?: string;// 注册地
  defendantLegalPerson?: string;    // 法定代表人
  defendantLegalPersonPosition?: string; // 职务
  defendantLegalPersonPhone?: string; // 联系电话
  defendantCreditCode?: string;     // 统一社会信用代码
  defendantType?: string;           // 类型
}

// 诉讼请求
interface Claims {
  claimWage?: boolean;             // 主张工资
  claimWageDetail?: string;         // 工资金额说明
  claimDoubleWage?: boolean;        // 双倍工资
  claimOvertime?: boolean;          // 加班费
  claimAnnualLeave?: boolean;       // 年休假工资
  claimSocialInsurance?: boolean;   // 社保补偿
  claimTerminationCompensation?: boolean; // 经济补偿
  claimIllegalTermination?: boolean;// 违法解除赔偿
  claimLitigationFee?: boolean;     // 诉讼费
  claimTotalAmount: string;         // 标的总额 *
}

// 事实与理由
interface FactsAndReasons {
  contractSignInfo?: string;       // 合同签订情况
  contractExecutionInfo: string;    // 合同履行情况 *
  terminationInfo?: string;         // 解除劳动关系情况
  injuryInfo?: string;              // 工伤情况
  arbitrationInfo?: string;        // 劳动仲裁情况
  otherFacts?: string;              // 其他情况
  legalBasis?: string;             // 法律依据
  evidenceList?: string;            // 证据清单
}
```

#### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/documents` | GET | 获取文书列表 |
| `/api/documents` | POST | 创建文书记录 |
| `/api/documents/[id]` | GET | 获取文书详情 |
| `/api/documents/[id]` | PUT | 更新文书 |
| `/api/documents/[id]` | DELETE | 删除文书（仅草稿） |
| `/api/documents/submit` | POST | 提交文书（含文件上传） |
| `/api/documents/generate` | POST | 生成文书内容 |

#### 数据流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  用户填写表单 │ ──▶ │  前端验证   │ ──▶ │  提交数据   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┴──────────────────────────┐
                    │                                                       │
                    ▼                                                       ▼
          ┌─────────────────┐                                    ┌─────────────────┐
          │  生成文书内容   │                                    │   文件上传      │
          │  (模板渲染)     │                                    │   (签名/证件)   │
          └────────┬────────┘                                    └────────┬────────┘
                   │                                                        │
                   └────────────────┬───────────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │  保存到数据库   │
                          │  (documents表) │
                          └────────┬────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  Storage 存储   │
                          │  (文件资源)     │
                          └─────────────────┘
```

---

### 2. 智能咨询模块 (`/consult`)

#### 功能概述

基于大语言模型的智能法律咨询，支持 SSE 流式输出，实现打字机效果。

#### 技术实现

```typescript
// API 路由: /api/consult/route.ts
// 使用 SSE (Server-Sent Events) 实现流式输出

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 调用 LLM 服务
      const client = new LLMClient();
      const stream = await client.chat({
        messages: [...],
        model: 'doubao-seed',
        stream: true,
      });
      
      // 流式传输
      for await (const chunk of stream) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

#### 前端实现

```typescript
// 使用 fetch + ReadableStream 实现流式读取
const response = await fetch('/api/consult', {
  method: 'POST',
  body: JSON.stringify({ message, history }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

// 增量渲染
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  setMessage(prev => prev + text); // 打字机效果
}
```

---

### 3. 支持起诉模块 (`/apply`)

#### 功能概述

收集申请支持起诉所需信息，包括个人资料、工作情况、欠薪金额、证据材料等。

#### 表单字段

| 字段 | 类型 | 说明 |
|------|------|------|
| applicantName | string | 申请人姓名 |
| birthDate | date | 出生日期 |
| age | number | 年龄 |
| householdAddress | string | 户籍地址 |
| idCard | string | 身份证号 |
| phone | string | 联系电话 |
| workStartDate | date | 入职时间 |
| workEndDate | date | 离职时间 |
| workLocationType | select | 工作地点类型 |
| workLocation | string | 工作详细地址 |
| defendantName | string | 被告单位名称 |
| defendantContact | string | 被告联系方式 |
| unpaidAmount | number | 欠薪金额 |
| unpaidCalculation | string | 欠薪计算方式 |

---

## 数据库设计

### Supabase 表结构

#### documents 表（文书记录）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键 |
| doc_number | VARCHAR | 文书编号（格式：WS+日期+序号） |
| document_type | VARCHAR | 文书类型 |
| applicant_name | VARCHAR | 申请人姓名 |
| applicant_phone | VARCHAR | 申请人电话 |
| document_content | TEXT | 文书内容 |
| template_used | VARCHAR | 使用的模板 |
| status | VARCHAR | 状态：draft/pending/approved/rejected |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

#### documents 表 - 原告信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| plaintiff_name | VARCHAR | 姓名 |
| plaintiff_gender | VARCHAR | 性别 |
| plaintiff_birth_date | DATE | 出生日期 |
| plaintiff_nation | VARCHAR | 民族 |
| plaintiff_work_unit | VARCHAR | 工作单位 |
| plaintiff_position | VARCHAR | 职务 |
| plaintiff_phone | VARCHAR | 联系电话 |
| plaintiff_residence | VARCHAR | 住所地 |
| plaintiff_habitual_residence | VARCHAR | 经常居住地 |
| plaintiff_id_type | VARCHAR | 证件类型 |
| plaintiff_id_card | VARCHAR | 证件号码 |

#### documents 表 - 被告信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| defendant_name | VARCHAR | 名称 |
| defendant_address | VARCHAR | 住所地 |
| defendant_register_address | VARCHAR | 注册地 |
| defendant_legal_person | VARCHAR | 法定代表人 |
| defendant_legal_person_position | VARCHAR | 职务 |
| defendant_legal_person_phone | VARCHAR | 联系电话 |
| defendant_credit_code | VARCHAR | 统一社会信用代码 |
| defendant_type | VARCHAR | 类型 |

#### documents 表 - 诉讼请求

| 字段名 | 类型 | 说明 |
|--------|------|------|
| claims | JSONB | 诉讼请求（JSON格式） |
| claim_total_amount | DECIMAL | 标的总额 |
| has_preservation | BOOLEAN | 是否申请诉前保全 |
| preservation_court | VARCHAR | 保全法院 |
| preservation_date | DATE | 保全时间 |
| preservation_case_no | VARCHAR | 保全案号 |

#### documents 表 - 事实与理由

| 字段名 | 类型 | 说明 |
|--------|------|------|
| contract_sign_info | TEXT | 合同签订情况 |
| contract_execution_info | TEXT | 合同履行情况 |
| termination_info | TEXT | 解除劳动关系情况 |
| injury_info | TEXT | 工伤情况 |
| arbitration_info | TEXT | 劳动仲裁情况 |
| other_facts | TEXT | 其他情况 |
| legal_basis | TEXT | 法律依据 |
| evidence_list | TEXT | 证据清单 |

#### documents 表 - 调解意愿

| 字段名 | 类型 | 说明 |
|--------|------|------|
| understand_mediation | BOOLEAN | 了解调解 |
| understand_mediation_benefits | BOOLEAN | 了解调解好处 |
| consider_mediation | VARCHAR | 是否考虑调解 |

#### documents 表 - 文件存储

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id_card_front_url | TEXT | 身份证正面 URL |
| id_card_back_url | TEXT | 身份证背面 URL |
| evidence_files | JSONB | 证据文件 URL 列表 |
| signature_url | TEXT | 签名图片 URL |

#### applications 表（支持起诉申请）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键 |
| applicant_name | VARCHAR | 申请人姓名 |
| birth_date | DATE | 出生日期 |
| age | INTEGER | 年龄 |
| household_address | TEXT | 户籍地址 |
| id_card | VARCHAR | 身份证号 |
| phone | VARCHAR | 联系电话 |
| work_start_date | DATE | 入职时间 |
| work_end_date | DATE | 离职时间 |
| work_location_type | VARCHAR | 工作地点类型 |
| work_location | TEXT | 工作详细地址 |
| defendant_name | VARCHAR | 被告单位 |
| defendant_contact | VARCHAR | 被告联系方式 |
| unpaid_amount | DECIMAL | 欠薪金额 |
| unpaid_calculation | TEXT | 欠薪计算 |
| application_type | VARCHAR | 申请类型：support/legal_aid |
| status | VARCHAR | 状态 |
| created_at | TIMESTAMPTZ | 创建时间 |

#### reports 表（线索填报）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键 |
| report_number | VARCHAR | 线索编号 |
| reporter_name | VARCHAR | 填报人姓名 |
| reporter_phone | VARCHAR | 填报人电话 |
| defendant_name | VARCHAR | 欠薪单位 |
| unpaid_amount | DECIMAL | 欠薪金额 |
| unpaid_start_date | DATE | 欠薪开始日期 |
| unpaid_end_date | DATE | 欠薪结束日期 |
| work_location | TEXT | 工作地点 |
| status | VARCHAR | 状态 |
| created_at | TIMESTAMPTZ | 创建时间 |

#### cases 表（案件库）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键 |
| case_number | VARCHAR | 案件编号 |
| case_type | VARCHAR | 案件类型 |
| applicant_name | VARCHAR | 申请人 |
| defendant_name | VARCHAR | 被申请人 |
| case_amount | DECIMAL | 涉案金额 |
| status | VARCHAR | 状态 |
| filed_date | DATE | 立案日期 |
| hearing_date | DATE | 开庭日期 |
| judgment_result | TEXT | 判决结果 |
| created_at | TIMESTAMPTZ | 创建时间 |

### RLS 权限策略

```sql
-- documents 表 RLS 策略
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 允许读取所有记录（管理员）
CREATE POLICY "Allow read all" ON documents
  FOR SELECT USING (true);

-- 允许插入记录（通过 service role）
CREATE POLICY "Allow insert" ON documents
  FOR INSERT WITH CHECK (true);

-- 允许更新记录（通过 service role）
CREATE POLICY "Allow update" ON documents
  FOR UPDATE USING (true);

-- applications 表 RLS 策略
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read all" ON applications
  FOR SELECT USING (true);

CREATE POLICY "Allow insert" ON applications
  FOR INSERT WITH CHECK (true);
```

---

## API 接口文档

### 前端公开接口

#### 智能咨询

```
POST /api/consult
Content-Type: application/json

Request:
{
  "message": "我在公司工作3个月没签合同，能要双倍工资吗？",
  "history": [
    {"role": "user", "content": "上一条消息"},
    {"role": "assistant", "content": "上一条回复"}
  ]
}

Response: SSE 流式输出
```

#### 文书管理

```
GET /api/documents?page=1&pageSize=10

Response:
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10
}

---

GET /api/documents/:id

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "document_type": "民事起诉状",
    "plaintiff_name": "张三",
    ...
  }
}

---

POST /api/documents/submit
Content-Type: application/json

Request:
{
  "document_type": "民事起诉状",
  "applicant_name": "张三",
  "plaintiff_name": "张三",
  "plaintiff_gender": "male",
  ...
  "signature": "data:image/png;base64,...",
  "id_card_front": "data:image/png;base64,..."
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "doc_number": "WS202604171001",
    "status": "pending"
  }
}
```

#### 支持起诉

```
POST /api/apply
Content-Type: application/json

Request:
{
  "applicant_name": "张三",
  "birth_date": "1990-01-01",
  "id_card": "110101199001011234",
  "phone": "13800138000",
  "defendant_name": "某公司",
  "unpaid_amount": 50000,
  ...
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "application_number": "SQ20260417001",
    "status": "pending"
  }
}
```

### 后台管理接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/login` | POST | 管理员登录 |
| `/api/admin/data` | GET | 数据统计 |
| `/api/admin/cases` | GET/POST | 案件管理 |
| `/api/admin/files` | GET/POST | 文件管理 |
| `/api/admin/templates` | GET/POST | 模板管理 |
| `/api/admin/settings` | GET/PUT | 系统设置 |
| `/api/admin/notifications` | GET/POST | 通知管理 |

---

## 环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=          # Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase 匿名密钥（前端使用）
SUPABASE_SERVICE_ROLE_KEY=         # Supabase 服务角色密钥（后端使用，绕过 RLS）

# 对象存储配置（可选，用于文件上传）
COZE_BUCKET_ENDPOINT_URL=         # Storage 端点
COZE_BUCKET_NAME=                  # Bucket 名称

# 应用配置
NEXT_PUBLIC_APP_URL=              # 应用访问地址
```

---

## 开发规范

### 1. 组件开发规范

#### 使用 shadcn/ui 组件

```tsx
// ✅ 正确：使用预置的 shadcn 组件
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ❌ 错误：直接使用 HTML 元素
<button className="px-4 py-2 bg-blue-500">提交</button>
```

#### 客户端组件标记

```tsx
// ✅ 正确：需要客户端交互的组件添加 'use client'
'use client';

import { useState } from 'react';

export default function InteractiveComponent() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}

// ✅ 正确：纯展示组件可以是服务端组件
import { Card } from '@/components/ui/card';

export default function DisplayComponent({ title }: { title: string }) {
  return <Card><CardContent>{title}</CardContent></Card>;
}
```

### 2. 表单开发规范

#### 使用 react-hook-form + zod

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
  amount: z.number().positive('金额必须为正数'),
});

export default function FormComponent() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', phone: '', amount: 0 },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* 表单内容 */}
    </form>
  );
}
```

### 3. API 开发规范

#### RESTful 设计

```typescript
// GET 列表
// GET /api/users?page=1&pageSize=10

// GET 详情
// GET /api/users/[id]

// POST 创建
// POST /api/users

// PUT 更新
// PUT /api/users/[id]

// DELETE 删除
// DELETE /api/users/[id]
```

#### 统一响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功" // 可选
}

// 错误响应
{
  "success": false,
  "error": "错误信息"
}
```

### 4. 数据库操作规范

#### 使用 Supabase SDK

```typescript
import { getSupabaseServiceRoleClient } from '@/storage/database/supabase-client';

// 服务端使用 service role client（绕过 RLS）
const client = getSupabaseServiceRoleClient();

const { data, error } = await client
  .from('documents')
  .insert({ ... })
  .select()
  .single();

if (error) {
  console.error('Database error:', error);
  return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}
```

### 5. 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面组件 | page.tsx | `report/page.tsx` |
| 布局组件 | layout.tsx | `report/layout.tsx` |
| API 路由 | route.ts | `api/report/route.ts` |
| 动态路由 | [id]/route.ts | `api/documents/[id]/route.ts` |
| 工具函数 | utils.ts | `lib/utils.ts` |
| 自定义 Hooks | use-*.ts | `hooks/use-auth.ts` |

---

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发环境
coze dev

# 生产构建
coze build

# 生产启动
coze start

# 代码检查
pnpm lint          # ESLint
pnpm ts-check     # TypeScript 类型检查
pnpm build        # 构建检查

# 工具命令
pnpm add package        # 添加依赖
pnpm remove package     # 移除依赖
```

---

## 故障排查

### 常见问题

#### 1. Supabase 连接失败

检查环境变量配置：
```bash
NEXT_PUBLIC_SUPABASE_URL=  # 必须设置
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # 必须设置
SUPABASE_SERVICE_ROLE_KEY=  # 必须设置（服务端）
```

#### 2. 数据库表不存在

在 Supabase SQL Editor 中执行表创建语句，或检查 RLS 策略是否正确配置。

#### 3. 文件上传失败

检查对象存储 Bucket 权限设置，确保允许公开访问或正确配置签名策略。

#### 4. SSE 流式输出不工作

确保代理服务器（如 Nginx）配置支持 SSE：
```nginx
proxy_set_header Connection '';
proxy_http_version 1.1;
```

### 日志查看

```bash
# 应用日志
tail -f /app/work/logs/bypass/app.log

# 开发日志
tail -f /app/work/logs/bypass/dev.log

# 控制台日志
tail -f /app/work/logs/bypass/console.log
```

---

## 部署说明

### 环境要求

- Node.js 24+
- pnpm 包管理器
- PostgreSQL 数据库（Supabase）

### 部署步骤

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 填入实际配置
   ```

3. **构建生产版本**
   ```bash
   coze build
   ```

4. **启动服务**
   ```bash
   coze start
   ```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 许可证

MIT License
