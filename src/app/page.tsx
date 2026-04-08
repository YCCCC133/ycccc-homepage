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
  Phone,
  Scale,
  BookOpen,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnnouncementList } from '@/components/announcement-list';
import { ScrollingAnnouncementBanner } from '@/components/scrolling-announcement';

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

export default function HomePage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Scrolling Announcement Banner */}
      <ScrollingAnnouncementBanner />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 py-16 md:py-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-200/40 via-emerald-300/20 to-transparent blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-slate-300/30 via-slate-200/20 to-transparent blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-emerald-100/20 to-slate-200/20 blur-3xl" />
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] h-2 w-2 rounded-full bg-emerald-400/50 animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="absolute top-40 right-[15%] h-3 w-3 rounded-full bg-emerald-300/40 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          <div className="absolute bottom-32 left-[20%] h-2 w-2 rounded-full bg-slate-400/40 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
          <div className="absolute top-60 right-[25%] h-4 w-4 rounded-full bg-emerald-200/30 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1.5s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <Badge
              variant="outline"
              className="mb-6 border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-emerald-700 backdrop-blur-sm"
            >
              <Scale className="mr-2 h-3.5 w-3.5" />
              <span className="hidden sm:inline">检察支持起诉</span>
              <span className="sm:hidden">参赛作品</span>
            </Badge>

            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 bg-clip-text text-transparent">
                护薪
              </span>
              <span className="text-foreground">平台</span>
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl text-slate-600">
                检察支持起诉智能平台
              </span>
            </h1>

            {/* Description */}
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
              运用<span className="text-emerald-600 font-semibold">数字检察</span>技术手段，
              <br className="hidden md:block" />
              保障劳动者（特别是<span className="text-emerald-600 font-semibold">农民工</span>）薪酬权益
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/report">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-600 transition-all duration-300"
                >
                  <FileText className="h-5 w-5" />
                  立即填报线索
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/consult">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300"
                >
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  智能法律咨询
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="group relative rounded-2xl border border-emerald-100/50 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <stat.icon className="mb-3 h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                    <span className="text-xs font-normal text-muted-foreground">
                      {stat.suffix}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                全方位
              </span>
              维权服务
            </h2>
            <p className="text-muted-foreground text-lg">
              从线索收集到案件办理，提供一站式智能法律服务
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Link 
                key={feature.title} 
                href={feature.href}
                className="outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-xl"
              >
                <Card className="group h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-emerald-100/50 hover:border-emerald-200">
                  <CardHeader className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div
                      className={`relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {feature.title}
                      <ArrowRight className="h-5 w-5 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
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
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                维权
              </span>
              流程
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
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full -translate-x-1/2 bg-gradient-to-r from-emerald-300 to-emerald-100 md:block" />
                )}

                <div className="relative flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-2xl font-bold text-white shadow-lg shadow-emerald-500/30">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/report">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all">
                开始维权
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Help & Resources */}
      <section className="bg-gradient-to-b from-white via-emerald-50/30 to-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Notice Board */}
            <AnnouncementList />

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 border-emerald-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  快速入口
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Link 
                  href="tel:12345"
                  className="outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white/80 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-200 hover:-translate-y-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">12345热线</div>
                      <div className="text-xs text-muted-foreground">
                        政务服务热线
                      </div>
                    </div>
                  </div>
                </Link>

                <Link 
                  href="/help"
                  className="outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white/80 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-200 hover:-translate-y-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">使用帮助</div>
                      <div className="text-xs text-muted-foreground">
                        平台操作指南
                      </div>
                    </div>
                  </div>
                </Link>

                <Link 
                  href="/legal-aid"
                  className="outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white/80 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-200 hover:-translate-y-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                      <Heart className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">法律援助</div>
                      <div className="text-xs text-muted-foreground">
                        免费法律帮助
                      </div>
                    </div>
                  </div>
                </Link>

                <Link 
                  href="/cases"
                  className="outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white/80 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-200 hover:-translate-y-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                      <FolderOpen className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">案件查询</div>
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
