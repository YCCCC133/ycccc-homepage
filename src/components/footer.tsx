import Link from "next/link";
import { Shield, Phone, Mail, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-emerald-50/30 to-stone-100/80" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* 主内容区 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* 平台信息 */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="
                w-11 h-11 rounded-xl
                bg-gradient-to-br from-emerald-500 to-emerald-600
                flex items-center justify-center
                shadow-lg shadow-emerald-500/20
              ">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-semibold text-stone-800">
                护薪平台
              </span>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              检察支持起诉智能平台，为农民工群体提供便捷、高效的薪酬权益保障服务。
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Clock className="w-3.5 h-3.5" />
              <span>7×24 小时服务</span>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-sm font-semibold text-stone-800 mb-4 tracking-wide">
              快速链接
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "线索填报", href: "/report" },
                { label: "智能咨询", href: "/consult" },
                { label: "文书生成", href: "/document" },
                { label: "在线申请", href: "/apply" },
                { label: "案件查询", href: "/cases" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="
                      text-sm text-stone-600
                      hover:text-emerald-600
                      transition-colors duration-200
                    "
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 联系方式 */}
          <div>
            <h3 className="text-sm font-semibold text-stone-800 mb-4 tracking-wide">
              联系我们
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:123456789"
                  className="flex items-center gap-2.5 text-sm text-stone-600 hover:text-emerald-600 transition-colors duration-200"
                >
                  <div className="
                    w-7 h-7 rounded-lg
                    bg-emerald-50
                    flex items-center justify-center
                  ">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span>123456789</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:service@example.com"
                  className="flex items-center gap-2.5 text-sm text-stone-600 hover:text-emerald-600 transition-colors duration-200"
                >
                  <div className="
                    w-7 h-7 rounded-lg
                    bg-emerald-50
                    flex items-center justify-center
                  ">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span>service@example.com</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2.5 text-sm text-stone-600">
                  <div className="
                    w-7 h-7 rounded-lg
                    bg-emerald-50
                    flex items-center justify-center
                    mt-0.5
                  ">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="leading-relaxed">
                    某省某市某区某街道某号
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* 服务热线 */}
          <div>
            <h3 className="text-sm font-semibold text-stone-800 mb-4 tracking-wide">
              法律援助热线
            </h3>
            <div className="
              p-4 rounded-2xl
              bg-gradient-to-br from-emerald-50/80 to-emerald-100/50
              border border-emerald-200/50
              glass-card
            ">
              <div className="text-2xl font-bold text-emerald-700 mb-1">
                12348
              </div>
              <div className="text-xs text-stone-600 mb-3">
                全国法律服务热线
              </div>
              <div className="text-xs text-stone-500">
                周一至周五 9:00-17:00
              </div>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-10 sm:mt-14 pt-6 border-t border-stone-200/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-stone-500 text-center sm:text-left">
              © {new Date().getFullYear()} 护薪平台 版权所有
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="text-xs text-stone-500 hover:text-emerald-600 transition-colors duration-200"
              >
                隐私政策
              </Link>
              <span className="text-stone-300">|</span>
              <Link
                href="/terms"
                className="text-xs text-stone-500 hover:text-emerald-600 transition-colors duration-200"
              >
                服务条款
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
