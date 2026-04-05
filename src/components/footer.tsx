'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Heart,
  Settings,
} from 'lucide-react';

export function Footer() {
  const router = useRouter();

  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-primary/5 to-primary/10">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* 平台信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-primary">护薪平台</div>
                <div className="text-xs text-muted-foreground">
                  检察支持起诉智能平台
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              保障劳动者（特别是农民工）薪酬权益，帮助诉讼能力弱的劳动者追讨欠薪，提供专业的法律支持与服务。
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/report"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  线索填报
                </Link>
              </li>
              <li>
                <Link
                  href="/consult"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  智能咨询
                </Link>
              </li>
              <li>
                <Link
                  href="/document"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  文书生成
                </Link>
              </li>
              <li>
                <Link
                  href="/apply"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  在线申请
                </Link>
              </li>
              <li>
                <Link
                  href="/cases"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  案件查询
                </Link>
              </li>
            </ul>
          </div>

          {/* 联系方式 */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">联系方式</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>北京市西城区新街口西里三区18号楼</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>13811190044</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>xicheng.jcy@beijing.gov.cn</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>S2008501145</span>
              </li>
            </ul>
          </div>

          {/* 政务热线 */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">政务热线</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-white/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <Phone className="h-5 w-5" />
                  <span className="text-lg font-bold">12345</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  政务服务便民热线
                  <br />
                  7×24小时服务
                </p>
              </div>
              <div className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-[var(--gold-foreground)]">
                  <Heart className="h-5 w-5" />
                  <span className="font-semibold">法律援助</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  为困难群众提供免费法律帮助
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border/40 pt-6 md:pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
              <p className="text-center text-xs text-muted-foreground md:text-left">
                © 2025 北京市西城区人民检察院 · 护薪检察支持起诉智能平台
              </p>
              {/* 后台管理入口 - 隐蔽但可点击 */}
              <button
                onClick={() => router.push('/admin')}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground/30 transition-all hover:bg-muted hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
                title="管理入口"
              >
                <Settings className="h-3 w-3" />
                <span className="hidden sm:inline">管理</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground md:gap-4">
              <Link href="/privacy" className="rounded outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary">
                隐私政策
              </Link>
              <span className="hidden md:inline">|</span>
              <Link href="/terms" className="rounded outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary">
                使用条款
              </Link>
              <span className="hidden md:inline">|</span>
              <Link href="/sitemap" className="rounded outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary">
                网站地图
              </Link>
            </div>
          </div>
          {/* 技术支持 */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-muted-foreground/50">
              Technical Support by <span className="font-medium">ycccc</span> © 2025
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
