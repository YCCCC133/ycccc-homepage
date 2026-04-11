import Link from "next/link";
import { 
  Shield, 
  FileText, 
  MessageSquare, 
  Send, 
  Search,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  Phone,
  ChevronRight
} from "lucide-react";

const features = [
  {
    icon: Send,
    title: "线索填报",
    description: "快速填报欠薪线索，维护您的合法权益",
    href: "/report",
    color: "emerald",
  },
  {
    icon: MessageSquare,
    title: "智能咨询",
    description: "AI智能法律顾问，随时解答您的疑问",
    href: "/consult",
    color: "blue",
  },
  {
    icon: FileText,
    title: "文书生成",
    description: "一键生成法律文书，省时省力又规范",
    href: "/document",
    color: "purple",
  },
  {
    icon: Search,
    title: "案件查询",
    description: "实时追踪案件进度，信息透明可查",
    href: "/cases",
    color: "orange",
  },
];

const stats = [
  { icon: Users, value: "10,000+", label: "服务人数" },
  { icon: CheckCircle, value: "8,500+", label: "成功案例" },
  { icon: TrendingUp, value: "98%", label: "满意度" },
  { icon: Clock, value: "24h", label: "快速响应" },
];

const process = [
  { step: "01", title: "填报线索", desc: "填写欠薪相关信息" },
  { step: "02", title: "智能分析", desc: "AI评估案件可行性" },
  { step: "03", title: "申请支持", desc: "在线提交支持申请" },
  { step: "04", title: "案件跟踪", desc: "实时查看处理进度" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-[70px]">
        {/* 装饰背景 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py:16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* 标签 */}
            <div className="
              inline-flex items-center gap-2
              px-4 py-1.5
              rounded-full
              bg-emerald-50 border border-emerald-200/50
              text-sm text-emerald-700
              mb-6
            ">
              <Shield className="w-4 h-4" />
              <span>检察支持起诉</span>
            </div>

            {/* 标题 */}
            <h1 className="
              text-3xl sm:text-4xl lg:text-5xl
              font-bold
              leading-tight
              mb-6
            ">
              <span className="bg-gradient-to-r from-stone-800 via-stone-700 to-stone-600 bg-clip-text text-transparent">
                护薪平台
              </span>
              <br />
              <span className="text-xl sm:text-2xl lg:text-3xl font-medium text-stone-600">
                为劳动者撑起法治保护伞
              </span>
            </h1>

            {/* 副标题 */}
            <p className="
              text-base sm:text-lg
              text-stone-600
              leading-relaxed
              mb-8
              max-w-2xl mx-auto
            ">
              依托检察机关支持起诉职能，为农民工群体提供线索填报、智能咨询、
              文书生成、在线申请等一站式法律服务，让维权更便捷、更高效。
            </p>

            {/* CTA 按钮 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/report"
                className="
                  w-full sm:w-auto
                  px-8 py-3.5
                  text-base font-medium
                  text-white
                  rounded-xl
                  bg-gradient-to-r from-emerald-500 to-emerald-600
                  shadow-lg shadow-emerald-500/25
                  hover:shadow-xl hover:shadow-emerald-500/30
                  hover:from-emerald-600 hover:to-emerald-700
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  group
                "
              >
                <span>立即填报线索</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/consult"
                className="
                  w-full sm:w-auto
                  px-8 py-3.5
                  text-base font-medium
                  text-emerald-700
                  rounded-xl
                  bg-white/80 backdrop-blur-sm
                  border border-emerald-200/60
                  hover:bg-emerald-50
                  hover:border-emerald-300
                  transition-all duration-200
                  flex items-center justify-center gap-2
                "
              >
                <MessageSquare className="w-4 h-4" />
                <span>智能法律咨询</span>
              </Link>
            </div>

            {/* 服务热线 */}
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-stone-500">
              <Phone className="w-4 h-4" />
              <span>法律服务热线：12348</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-8 sm:-mt-12 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="
            p-4 sm:p-6
            rounded-2xl sm:rounded-3xl
            bg-white/70 backdrop-blur-xl
            border border-white/50
            shadow-xl shadow-stone-200/50
          ">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="
                    w-10 h-10 sm:w-12 sm:h-12
                    mx-auto mb-2 sm:mb-3
                    rounded-xl
                    bg-emerald-50
                    flex items-center justify-center
                  ">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                  <div className="
                    text-xl sm:text-2xl
                    font-bold
                    text-stone-800
                    mb-0.5
                  ">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-stone-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 标题 */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="
              text-2xl sm:text-3xl
              font-bold
              text-stone-800
              mb-4
            ">
              全方位法律服务
            </h2>
            <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto">
              五大核心功能，覆盖劳动权益保障全流程
            </p>
          </div>

          {/* 功能卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="
                  group
                  p-5 sm:p-6
                  rounded-2xl
                  bg-white/70 backdrop-blur-lg
                  border border-white/60
                  shadow-lg shadow-stone-200/40
                  hover:shadow-xl hover:shadow-stone-300/50
                  hover:-translate-y-1
                  transition-all duration-200
                "
              >
                <div className={`
                  w-12 h-12
                  rounded-xl
                  mb-4
                  flex items-center justify-center
                  ${
                    feature.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                    feature.color === "blue" ? "bg-blue-100 text-blue-600" :
                    feature.color === "purple" ? "bg-purple-100 text-purple-600" :
                    "bg-orange-100 text-orange-600"
                  }
                `}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="
                  text-base sm:text-lg
                  font-semibold
                  text-stone-800
                  mb-2
                  group-hover:text-emerald-700
                  transition-colors
                ">
                  {feature.title}
                </h3>
                <p className="
                  text-sm
                  text-stone-600
                  leading-relaxed
                ">
                  {feature.description}
                </p>
                <div className="
                  mt-4
                  text-sm
                  text-emerald-600
                  flex items-center gap-1
                  opacity-0 group-hover:opacity-100
                  transition-opacity
                ">
                  <span>立即使用</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-b from-emerald-50/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="
              text-2xl sm:text-3xl
              font-bold
              text-stone-800
              mb-4
            ">
              服务流程
            </h2>
            <p className="text-sm sm:text-base text-stone-600">
              简单四步，轻松完成维权申请
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {process.map((item, index) => (
              <div
                key={item.step}
                className="
                  relative
                  p-5 sm:p-6
                  rounded-2xl
                  bg-white/80 backdrop-blur-lg
                  border border-white/60
                  shadow-lg
                "
              >
                {/* 步骤编号 */}
                <div className="
                  absolute -top-3 -left-1 sm:left-4
                  w-8 h-8
                  rounded-lg
                  bg-gradient-to-br from-emerald-500 to-emerald-600
                  text-white
                  text-sm font-bold
                  flex items-center justify-center
                  shadow-md
                ">
                  {item.step}
                </div>
                
                {/* 连接线 */}
                {index < process.length - 1 && (
                  <div className="
                    hidden lg:block
                    absolute -right-3 top-1/2 -translate-y-1/2
                    w-6 h-0.5
                    bg-gradient-to-r from-emerald-300 to-transparent
                  " />
                )}

                <h3 className="
                  text-base sm:text-lg
                  font-semibold
                  text-stone-800
                  mt-2 mb-2
                ">
                  {item.title}
                </h3>
                <p className="
                  text-sm
                  text-stone-600
                ">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="
            relative
            p-8 sm:p-12
            rounded-3xl
            overflow-hidden
          ">
            {/* 背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-700" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

            <div className="relative text-center">
              <h2 className="
                text-2xl sm:text-3xl
                font-bold
                text-white
                mb-4
              ">
                您的权益，我们来守护
              </h2>
              <p className="
                text-base sm:text-lg
                text-emerald-100
                mb-8
                max-w-xl mx-auto
              ">
                遇到欠薪问题不要慌，护薪平台为您提供专业、免费的法律支持
              </p>
              <Link
                href="/report"
                className="
                  inline-flex items-center justify-center gap-2
                  px-8 py-4
                  text-base font-semibold
                  text-emerald-700
                  rounded-xl
                  bg-white
                  shadow-lg
                  hover:bg-emerald-50
                  hover:shadow-xl
                  transition-all duration-200
                "
              >
                <span>开始维权之旅</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
