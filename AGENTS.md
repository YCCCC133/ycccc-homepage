# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 项目概述

**护薪平台** - 检察支持起诉智能平台，为农民工群体提供薪酬权益保障服务。

### 核心功能模块

1. **线索填报** (`/report`) - 农民工自主填报欠薪线索
2. **智能咨询** (`/consult`) - AI智能法律咨询服务
3. **文书生成** (`/document`) - 法律文书一键生成
4. **在线申请** (`/apply`) - 支持起诉申请、法律援助申请
5. **案件查询** (`/cases`) - 案件进度追踪查询

### 关键技术集成

- **LLM 服务**: 使用 `coze-coding-dev-sdk` 的 `LLMClient` 实现智能法律咨询
- **流式输出**: AI 对话采用 SSE (Server-Sent Events) 协议实现打字机效果
- **表单验证**: 使用 `react-hook-form` + `zod` 实现表单验证

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── api/consult/    # 智能咨询 API (SSE 流式输出)
│   │   ├── report/         # 线索填报页面
│   │   ├── consult/        # 智能咨询页面
│   │   ├── document/       # 文书生成页面
│   │   ├── apply/          # 在线申请页面
│   │   └── cases/          # 案件查询页面
│   ├── components/         # 业务组件
│   │   ├── navigation.tsx  # 导航栏组件
│   │   ├── footer.tsx      # 页脚组件
│   │   └── ui/             # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

- **项目理解加速**：初始可以依赖项目下`package.json`文件理解项目类型，如果没有或无法理解退化成阅读其他文件。
- **Hydration 错误预防**：严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## 代码质量检查

运行以下命令进行代码检查：
- **ESLint 检查**: `pnpm lint`
- **TypeScript 类型检查**: `pnpm ts-check`
- **构建检查**: `pnpm build`

## API 接口

| 接口路径 | 方法 | 描述 |
|---------|------|------|
| `/api/consult` | POST | 智能法律咨询 (SSE 流式输出) |


