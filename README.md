# YCCCC Homepage

YCCCC 的个人主页项目，基于 Next.js App Router、React 19、TypeScript 构建。页面是一个单页式工程化展示站，支持：

- 动态加载个人资料
- Tencent Cloud COS 持久化
- 隐藏式管理后台
- AI 辅助导入与润色资料
- 本地开发与 Docker 部署

## To-Do List

1. 目标: 启动项目
   动作: 安装依赖并运行 `npm run dev`
   输出: 本地开发站点
2. 目标: 验证构建
   动作: 运行 `npm run build`
   输出: 可部署产物
3. 目标: 检查类型
   动作: 运行 `npm run typecheck`
   输出: TypeScript 校验结果
4. 目标: 配置环境
   动作: 复制 `env.example` 为 `.env.local` 并填写密钥
   输出: 可连接 COS / 管理后台 / AI 的运行环境
5. 目标: 发布镜像
   动作: 使用 `Dockerfile` 构建镜像并启动
   输出: 生产运行容器

## 项目结构

```txt
app/
  layout.tsx              根布局与字体、元数据
  page.tsx                页面入口，拉取资料并渲染首页
  globals.css             全局样式
  api/
    profile/route.ts      资料读取与保存 API
    admin/session/route.ts 管理后台登录会话
    admin/ai/route.ts     AI 导入 / 润色资料
components/
  ExperienceShell.tsx     主页主体、交互、隐藏管理入口
  AdminConsole.tsx        管理后台面板
lib/
  site-data.ts            资料读取、归一化、缓存与保存
  tencent-cos.ts          Tencent COS 封装
  admin-auth.ts           管理员认证与会话
  profile-ai.ts           Moonshot / Kimi AI 资料处理
  profile-review.ts       AI 修改差异预览
public/                   静态资源
Dockerfile                镜像构建
```

## 模块说明

- `app/page.tsx`: 服务端入口，调用 `getProfile()` 读取资料并传给首页组件
- `components/ExperienceShell.tsx`: 页面主体，负责滚动导航、项目展示、邮箱复制和隐藏后台入口
- `components/AdminConsole.tsx`: 管理后台 UI，支持登录、编辑、AI 预览和 JSON 编辑
- `lib/site-data.ts`: 资料模型、默认资料、内存缓存、COS 读写、归一化逻辑
- `lib/tencent-cos.ts`: 只在配置齐全时连接 COS，缺配置时安全降级
- `lib/admin-auth.ts`: 基于 Cookie 的管理会话与密码校验
- `lib/profile-ai.ts`: 调用 Moonshot / Kimi 生成或润色资料，并修复 JSON 输出
- `lib/profile-review.ts`: 生成 AI 修改前后的差异清单
- `app/api/*`: 首页资料、管理会话和 AI 接口

## 数据流

```mermaid
flowchart TD
  A[浏览器访问首页] --> B[app/page.tsx]
  B --> C[lib/site-data.ts getProfile]
  C -->|COS 已配置| D[Tencent COS site/profile.json]
  C -->|未配置| E[内存默认资料]
  D --> F[ExperienceShell]
  E --> F[ExperienceShell]
  F --> G[隐藏入口打开 AdminConsole]
  G --> H[/api/admin/session]
  G --> I[/api/profile]
  G --> J[/api/admin/ai]
  I --> K[lib/site-data.ts saveProfile]
  J --> L[lib/profile-ai.ts]
  K -->|COS 已配置| D
  K -->|未配置| E
```

## 环境变量

复制仓库根目录的 `env.example` 为 `.env.local`，按需填写：

```bash
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
TENCENT_COS_REGION=ap-shanghai
TENCENT_COS_BUCKET=your-bucket-name
TENCENT_COS_APP_ID=1234567890
SITE_ADMIN_PASSWORD=your-admin-password
SITE_ADMIN_SESSION_SECRET=your-random-session-secret
MOONSHOT_API_KEY=your-kimi-api-key
MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
MOONSHOT_MODEL=moonshot-v1-32k
```

说明：

- Tencent COS 相关变量全部存在时，资料读写走云端 `site/profile.json`
- 没有 COS 配置时，站点会回退到内存默认资料，保存仅对当前运行实例有效
- `SITE_ADMIN_PASSWORD` 用于后台登录
- `SITE_ADMIN_SESSION_SECRET` 用于签发后台会话 Cookie
- `MOONSHOT_API_KEY` 用于 AI 导入和润色

## 运行方式

### 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`

### 生产构建

```bash
npm run build
npm run start
```

### 类型检查

```bash
npm run typecheck
```

## 部署方式

### Docker

```bash
docker build -t ycccc-homepage .
docker run --rm -p 3000:3000 --env-file .env.local ycccc-homepage
```

说明：

- `Dockerfile` 基于 `node:24-alpine`
- 构建阶段执行 `npm run build`
- 运行阶段通过 `npm run start` 启动

### GitHub + Vercel 自动部署

- 代码推送到 GitHub 后，`.github/workflows/vercel-deploy.yml` 会自动触发 Vercel 发布
- `main` 分支执行生产部署，其他分支执行预览部署
- 需要在 GitHub 仓库的 `Secrets and variables -> Actions` 中配置：
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- `VERCEL_ORG_ID` 和 `VERCEL_PROJECT_ID` 可以直接从仓库内的 `.vercel/project.json` 读取

## API 接口

### `GET /api/profile`

- 返回当前资料
- 响应头包含 `Cache-Control: no-store, max-age=0`

### `PUT /api/profile`

- 需要已登录后台
- 接收完整 `ProfileData`
- COS 未配置时返回 `503`

### `GET /api/admin/session`

- 返回当前会话是否已认证
- 返回后台是否已配置密码

### `POST /api/admin/session`

- 提交密码登录
- 成功后写入 HttpOnly Cookie

### `DELETE /api/admin/session`

- 清除后台会话

### `POST /api/admin/ai`

- 需要已登录后台
- `mode` 支持 `import` 和 `polish`
- 调用 Moonshot / Kimi 生成新的资料草稿

## 隐藏管理入口

- 电脑版：点击左上角品牌区的小圆点 5 次
- 移动端：长按左上角品牌区的小圆点

进入后会弹出管理面板，可编辑资料、查看 AI 差异并保存。

## 验证结果

建议按下面顺序确认：

```bash
npm run typecheck
npm run build
```

如果 COS、后台密码或 Moonshot 没有配置，前端仍可启动，但对应能力会降级或返回受限响应。

## 可选优化

- 补充真实社交链接和项目链接
- 为 `site/profile.json` 增加版本历史
- 给后台保存动作增加更细粒度的字段校验
- 为 AI 导入增加更明确的内容模板
