import Link from 'next/link';
import {
  FileText,
  MessageSquare,
  PenTool,
  Send,
  FolderOpen,
  ArrowRight,
  Shield,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Scale,
  BookOpen,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    title: '线索填报',
    description: '快速填报欠薪线索，多源数据智能整合，精准定位维权方向',
    icon: FileText,
    href: '/report',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: '智能咨询',
    description: 'AI智能应答常见法律问题，24小时在线提供专业法律指引',
    icon: MessageSquare,
    href: '/consult',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: '文书生成',
    description: '一键生成起诉状、支持起诉书等法律文书，降低维权门槛',
    icon: PenTool,
    href: '/document',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: '在线申请',
    description: '在线申请支持起诉、法律援助，全流程在线办理',
    icon: Send,
    href: '/apply',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    title: '案件查询',
    description: '实时追踪案件进度，掌握维权动态，透明高效',
    icon: FolderOpen,
    href: '/cases',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
];

const stats = [
  { label: '已帮助劳动者', value: '2,458+', suffix: '人', icon: Users },
  { label: '追回欠薪金额', value: '1,280', suffix: '万元', icon: TrendingUp },
  { label: '平均处理时长', value: '7', suffix: '个工作日', icon: Clock },
  { label: '成功维权率', value: '98.6', suffix: '%', icon: CheckCircle2 },
];

const steps = [
  {
    step: '01',
    title: '填报线索',
    description: '填写基本信息和欠薪情况',
  },
  {
    step: '02',
    title: '智能咨询',
    description: '获取专业法律建议和指引',
  },
  {
    step: '03',
    title: '生成文书',
    description: '一键生成所需法律文书',
  },
  {
    step: '04',
    title: '提交申请',
    description: '在线提交支持起诉申请',
  },
];

const notices = [
  {
    title: '关于开展农民工工资支付专项检查的通知',
    date: '2025-01-15',
    type: '通知',
  },
  {
    title: '护薪平台使用指南（农民工版）',
    date: '2025-01-12',
    type: '指南',
  },
  {
    title: '成功案例：张某等32人追讨欠薪案',
    date: '2025-01-10',
    type: '案例',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/3 to-transparent py-16 md:py-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-[var(--gold)]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <Badge
              variant="outline"
              className="mb-6 border-primary/30 bg-primary/5 px-4 py-1.5 text-primary"
            >
              <Scale className="mr-2 h-3.5 w-3.5" />
              北京市西城区人民检察院倾力打造
            </Badge>

            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              <span className="text-primary">护薪</span>检察支持起诉
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                智能平台
              </span>
            </h1>

            {/* Description */}
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              保障劳动者（特别是农民工）薪酬权益
              <br className="hidden md:block" />
              帮助诉讼能力弱的劳动者追讨欠薪
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/report">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl"
                >
                  <FileText className="h-5 w-5" />
                  立即填报线索
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/consult">
                <Button size="lg" variant="outline" className="gap-2">
                  <MessageSquare className="h-5 w-5" />
                  智能法律咨询
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border/50 bg-white/80 p-4 backdrop-blur-sm"
                >
                  <stat.icon className="mb-2 h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                    <span className="text-sm font-normal text-muted-foreground">
                      {stat.suffix}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              全方位维权服务
            </h2>
            <p className="text-muted-foreground">
              从线索收集到案件办理，提供一站式智能法律服务
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <Card className="group h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor}`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {feature.title}
                      <ArrowRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              维权流程
            </h2>
            <p className="text-muted-foreground">
              简单四步，快速启动您的维权之路
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full -translate-x-1/2 bg-gradient-to-r from-primary/50 to-primary/20 md:block" />
                )}

                <div className="relative flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/report">
              <Button size="lg" className="gap-2">
                开始维权
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Help & Resources */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Notice Board */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  新闻公告
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div
                      key={notice.title}
                      className="flex items-start justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2 text-xs">
                          {notice.type}
                        </Badge>
                        <h4 className="mb-1 font-medium text-foreground hover:text-primary cursor-pointer">
                          {notice.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {notice.date}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4 w-full">
                  查看全部公告
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  快速入口
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Link href="/tel:12345">
                  <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-white/80 p-4 transition-all hover:shadow-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">12345热线</div>
                      <div className="text-xs text-muted-foreground">
                        政务服务热线
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/help">
                  <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-white/80 p-4 transition-all hover:shadow-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">使用帮助</div>
                      <div className="text-xs text-muted-foreground">
                        平台操作指南
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/legal-aid">
                  <div className="flex items-center gap-3 rounded-lg border border-[var(--gold)]/30 bg-white/80 p-4 transition-all hover:shadow-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gold)]/10">
                      <Heart className="h-5 w-5 text-[var(--gold-foreground)]" />
                    </div>
                    <div>
                      <div className="font-medium">法律援助</div>
                      <div className="text-xs text-muted-foreground">
                        免费法律帮助
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/cases">
                  <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-white/80 p-4 transition-all hover:shadow-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">案件查询</div>
                      <div className="text-xs text-muted-foreground">
                        追踪案件进度
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
