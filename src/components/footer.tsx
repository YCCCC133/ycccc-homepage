'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Phone,
  Mail,
  MapPin,
  FileText,
  Heart,
  Settings,
} from 'lucide-react';

export function Footer() {
  const router = useRouter();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* 平台信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">护薪平台</div>
                <div className="text-xs text-slate-400">
                  检察支持起诉智能平台
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              保障劳动者（特别是农民工）薪酬权益，帮助诉讼能力弱的劳动者追讨欠薪，提供专业的法律支持与服务。
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="mb-5 font-semibold text-white text-sm tracking-wide">快速链接</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-emerald-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  线索填报
                </Link>
              </li>
              <li>
                <Link
                  href="/consult"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-emerald-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  智能咨询
                </Link>
              </li>
              <li>
                <Link
                  href="/document"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-emerald-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  文书生成
                </Link>
              </li>
              <li>
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-emerald-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  在线申请
                </Link>
              </li>
              <li>
                <Link
                  href="/cases"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-emerald-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  案件查询
                </Link>
              </li>
            </ul>
          </div>

          {/* 联系方式 */}
          <div>
            <h3 className="mb-5 font-semibold text-white text-sm tracking-wide">联系方式</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>北京市西城区新街口西里三区18号楼</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>13811190044</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>xicheng.jcy@beijing.gov.cn</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>S2008501145</span>
              </li>
            </ul>
          </div>

          {/* 服务热线 */}
          <div>
            <h3 className="mb-5 font-semibold text-white text-sm tracking-wide">服务热线</h3>
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-emerald-500/50">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Phone className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">12345</div>
                    <div className="text-xs text-slate-400">政务服务便民热线</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">7×24小时服务</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-rose-500/50">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                    <Heart className="h-5 w-5 text-rose-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">法律援助</div>
                    <div className="text-xs text-slate-400">为困难群众提供</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">免费法律帮助</p>
              </div>
            </div>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="mt-12 border-t border-slate-800"></div>

        {/* 底部信息栏 */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
            <p className="text-xs text-slate-500">
              © 2026 北京市西城区人民检察院 · 护薪检察支持起诉智能平台
            </p>
            {/* 后台管理入口 */}
            <button
              onClick={() => router.push('/admin')}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-600 transition-all hover:bg-slate-800 hover:text-slate-300"
              title="管理入口"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>管理</span>
            </button>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs text-slate-600">
              Technical Support by <span className="text-slate-500 font-medium">ycccc</span> © 2026
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
