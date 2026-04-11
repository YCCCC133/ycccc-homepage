'use client';

import Link from 'next/link';
import { Scale, Phone, Mail, MapPin, Clock } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-slate-50 to-slate-100 border-t border-slate-200/60">
      {/* 装饰线 */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* 品牌信息 */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg 
                  className="w-6 h-6 text-white" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900">护薪平台</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">ProCurator</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              检察支持起诉智能平台，为农民工群体提供薪酬权益保障服务，维护劳动者合法权益。
            </p>
          </div>

          {/* 快捷服务 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500 rounded-full" />
              快捷服务
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/report', label: '线索填报' },
                { href: '/consult', label: '智能咨询' },
                { href: '/document', label: '文书生成' },
                { href: '/apply', label: '在线申请' },
                { href: '/cases', label: '案件查询' },
              ].map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-sm text-slate-600 hover:text-emerald-600 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 h-0.5 bg-emerald-500 rounded-full group-hover:w-2 transition-all" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 法律支持 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500 rounded-full" />
              法律支持
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '#', label: '劳动法知识库' },
                { href: '#', label: '工资支付条例' },
                { href: '#', label: '劳动合同法' },
                { href: '#', label: '维权指南' },
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    href={item.href}
                    className="text-sm text-slate-600 hover:text-emerald-600 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 h-0.5 bg-emerald-500 rounded-full group-hover:w-2 transition-all" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 联系方式 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500 rounded-full" />
              联系我们
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>服务热线：12345</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>support@huxin.cn</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>工作日 9:00-17:00</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>人民检察院支持起诉部门</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-10 pt-6 border-t border-slate-200/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {currentYear} 护薪平台 版权所有 | 技术支持
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-xs text-slate-500 hover:text-emerald-600 transition-colors">
                隐私政策
              </Link>
              <Link href="#" className="text-xs text-slate-500 hover:text-emerald-600 transition-colors">
                服务条款
              </Link>
              <Link href="#" className="text-xs text-slate-500 hover:text-emerald-600 transition-colors">
                网站地图
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
