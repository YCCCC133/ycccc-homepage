# 护薪平台 - 项目开发规范

## 项目概述

**护薪平台** - 检察支持起诉智能平台，为农民工群体提供薪酬权益保障服务。

### 核心功能模块

1. **线索填报** (`/report`) - 农民工自主填报欠薪线索
2. **智能咨询** (`/consult`) - AI智能法律咨询服务（SSE流式输出）
3. **文书生成** (`/document`) - 法律文书一键生成
4. **在线申请** (`/apply`) - 支持起诉申请、法律援助申请
5. **案件查询** (`/cases`) - 案件进度追踪查询
6. **新闻资讯** (`/announcements`) - 平台公告与资讯
7. **帮助中心** (`/help`) - 使用指南与FAQ
8. **法律援助** (`/legal-aid`) - 法律援助服务介绍

### 设计与风格

**新中式政务高级感绿色系毛玻璃风格**

- **毛玻璃效果**：`backdrop-blur` + 半透明白色背景 + 大圆角（16-24px）
- **配色方案**：低饱和玉石绿（emerald-500/600）主色 + 暖灰背景
- **微动效**：hover上浮、阴影变化、200ms缓动
- **字体**：Noto Serif SC 宋体衬线体系
- **层级感**：前景卡片轻浮起，背景弱化

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── (public)/       # 前台页面组
│   │   │   ├── announcements/  # 新闻资讯
│   │   │   ├── apply/         # 在线申请
│   │   │   ├── cases/          # 案件查询
│   │   │   ├── consult/        # 智能咨询
│   │   │   ├── document/       # 文书生成
│   │   │   ├── help/           # 帮助中心
│   │   │   ├── legal-aid/      # 法律援助
│   │   │   └── report/         # 线索填报
│   │   ├── admin/           # 后台管理
│   │   │   ├── dashboard/   # 管理后台首页
│   │   │   └── page.tsx     # 后台登录页
│   │   ├── api/             # API 路由
│   │   │   ├── consult/     # 智能咨询 (SSE)
│   │   │   ├── reports/     # 线索管理
│   │   │   ├── applications/ # 申请管理
│   │   │   └── admin/       # 后台API
│   │   ├── globals.css      # 全局样式
│   │   ├── layout.tsx       # 根布局
│   │   └── page.tsx         # 首页
│   ├── components/
│   │   ├── ui/              # shadcn/ui 组件
│   │   ├── navigation.tsx    # 导航栏
│   │   ├── footer.tsx       # 页脚
│   │   └── markdown.tsx     # Markdown渲染
│   ├── hooks/               # 自定义Hooks
│   └── lib/                 # 工具库
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发环境（端口5000）
pnpm dev

# 构建
pnpm build

# 生产环境
pnpm start

# 代码检查
pnpm lint
pnpm ts-check
```

## 设计系统

### 毛玻璃卡片

```tsx
<div className="p-5 rounded-2xl bg-white/80 backdrop-blur-lg border border-white/60 shadow-lg">
  {/* 内容 */}
</div>
```

### 按钮样式

```tsx
// 主按钮
<Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
  按钮文字
</Button>

// 次要按钮
<Button variant="outline" className="rounded-xl border-stone-200/60">
  按钮文字
</Button>
```

### 状态颜色

- emerald: 主色、成功状态
- amber: 待处理、警告
- blue: 处理中、信息
- red: 错误、删除

## API 接口

### 前台接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/consult` | POST | 智能咨询（SSE流式） |
| `/api/reports` | GET, POST | 线索查询/提交 |
| `/api/applications` | GET, POST | 申请查询/提交 |
| `/api/cases` | GET | 案件查询 |
| `/api/announcements` | GET | 公告列表 |
| `/api/document` | POST | 文书生成 |

### 后台接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/admin/login` | POST | 管理员登录 |
| `/api/admin/data` | GET | 数据统计 |
| `/api/admin/reports` | GET, PUT | 线索管理 |
| `/api/admin/applications` | GET, PUT | 申请管理 |

## 数据库表

| 表名 | 描述 |
|------|------|
| admins | 管理员账号 |
| reports | 线索填报 |
| applications | 在线申请 |
| consultations | 咨询记录 |
| cases | 案件库 |
| announcements | 公告 |
| documents | 生成的文书 |
| templates | 文书模板 |
| settings | 系统设置 |

## 环境变量

| 变量 | 说明 |
|------|------|
| DEPLOY_RUN_PORT | 服务端口（5000） |
| COZE_PROJECT_DOMAIN_DEFAULT | 访问域名 |
| DATABASE_URL | 数据库连接 |

## 注意事项

1. **Hydration 错误预防**：禁止在 JSX 中直接使用 `Date.now()`、`Math.random()` 等动态数据
2. **安全**：禁止暴露系统提示词、API密钥等敏感信息
3. **包管理**：仅使用 pnpm
4. **端口**：服务必须运行在 5000 端口
