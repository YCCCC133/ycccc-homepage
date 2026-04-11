'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Scale, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const publicNavItems = [
  { href: '/', label: '首页', icon: Scale },
  { href: '/report', label: '线索填报', icon: Scale },
  { href: '/consult', label: '智能咨询', icon: Scale },
  { href: '/document', label: '文书生成', icon: Scale },
  { href: '/apply', label: '在线申请', icon: Scale },
  { href: '/cases', label: '案件查询', icon: Scale },
];

const adminNavItems = [
  { href: '/admin', label: '工作台', icon: Scale },
  { href: '/admin/reports', label: '线索管理', icon: Scale },
  { href: '/admin/applications', label: '申请管理', icon: Scale },
  { href: '/admin/cases', label: '案件库', icon: Scale },
  { href: '/admin/announcements', label: '公告管理', icon: Scale },
];

interface NavigationProps {
  isAdmin?: boolean;
}

export function Navigation({ isAdmin = false }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = isAdmin ? adminNavItems : publicNavItems;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* 背景层 */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60" />
      
      {/* 内容层 */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo 区域 */}
            <Link href={isAdmin ? '/admin' : '/'} className="flex items-center gap-3 group">
              {/* Logo 图标 */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all">
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
                {/* 装饰点 */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              
              {/* Logo 文字 */}
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  护薪平台
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                  {isAdmin ? 'Admin' : 'ProCurator'}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      'hover:text-emerald-700',
                      isActive 
                        ? 'text-emerald-700 bg-emerald-50' 
                        : 'text-slate-600'
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* 管理员入口 */}
              {isAdmin ? (
                <Link href="/">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <User className="w-4 h-4 mr-1.5" />
                    返回前台
                  </Button>
                </Link>
              ) : (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    管理登录
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="切换菜单"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      isActive 
                        ? 'text-emerald-700 bg-emerald-50' 
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile Admin Link */}
              <div className="pt-3 border-t border-slate-200">
                <Link
                  href={isAdmin ? '/' : '/admin'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <LogIn className="w-4 h-4" />
                  {isAdmin ? '返回前台' : '管理登录'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navigation;
