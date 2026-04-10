'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  MessageSquare,
  PenTool,
  Send,
  FolderOpen,
  Menu,
  X,
  Scale,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navigation = [
  { name: '首页', href: '/', icon: Home },
  { name: '线索填报', href: '/report', icon: FileText },
  { name: '智能咨询', href: '/consult', icon: MessageSquare },
  { name: '文书生成', href: '/document', icon: PenTool },
  { name: '在线申请', href: '/apply', icon: Send },
  { name: '案件查询', href: '/cases', icon: FolderOpen },
];

const quickLinks = [
  { name: '12345热线', href: 'tel:12345', icon: Phone },
  { name: '使用帮助', href: '/help', icon: HelpCircle },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 no-select">
      {/* 毛玻璃效果遮罩层 */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" />
      
      {/* 顶部渐变边框 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      
      {/* 毛玻璃主容器 */}
      <div className="relative border-b border-border/20">
        {/* 顶部信息栏 - 毛玻璃效果 */}
        <div className="hidden border-b border-border/30 bg-gradient-to-r from-primary/5 via-background/80 to-primary/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 md:block">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1">
                <Scale className="h-3 w-3" />
                北京市西城区人民检察院
              </span>
              <span className="text-primary">|</span>
              <span>全国模范检察院 · 科技强检示范院</span>
            </div>
            <div className="flex items-center gap-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-1 transition-colors hover:text-primary"
                >
                  <link.icon className="h-3 w-3" />
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 主导航 - 毛玻璃效果 */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2">
              {/* Logo 毛玻璃容器 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg blur-md" />
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <Scale className="h-5 w-5 text-white" />
                </div>
              </div>
              {/* 中等屏幕只显示平台名称 */}
              <span className="hidden text-base font-bold text-primary md:block lg:hidden">护薪平台</span>
              {/* 大屏幕显示完整信息 */}
              <div className="hidden min-w-0 lg:block">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-primary">护薪平台</span>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-[var(--gold)]/20 px-2 py-0.5 text-xs font-medium text-[var(--gold)] backdrop-blur-sm border border-[var(--gold)]/30">
                    检察支持起诉
                  </span>
                </div>
                <div className="whitespace-nowrap text-xs text-muted-foreground">
                  保障劳动者薪酬权益
                </div>
              </div>
            </Link>

            {/* Desktop Navigation - 毛玻璃导航按钮 */}
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-1 whitespace-nowrap rounded-xl px-2 py-1.5 text-sm font-medium outline-none transition-all duration-300 lg:gap-1.5 lg:px-3 lg:py-2',
                      isActive
                        ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/10 backdrop-blur-md ring-2 ring-primary/20'
                        : 'text-foreground/70 hover:bg-gradient-to-r hover:from-accent/80 hover:to-accent/50 hover:text-foreground hover:backdrop-blur-md hover:ring-2 hover:ring-primary/20 hover:ring-offset-0'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-300',
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      )}
                    />
                    <span className="hidden text-xs lg:inline">{item.name}</span>
                    <span className="text-xs lg:hidden">{item.name.slice(0, 2)}</span>
                    {isActive && (
                      <>
                        {/* 底部指示器发光效果 */}
                        <span className="absolute -bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold)]/80 shadow-lg shadow-[var(--gold)]/50" />
                      </>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side actions - 毛玻璃按钮 */}
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <Link href="/consult">
                <Button
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 lg:gap-2 lg:px-4"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>智能咨询</span>
                </Button>
              </Link>
              <Link href="/report">
                <Button
                  variant="outline"
                  size="sm" 
                  className="gap-1.5 backdrop-blur-md bg-background/50 border-border/50 hover:bg-background/80 lg:gap-2 lg:px-3"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden lg:inline">填报线索</span>
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 backdrop-blur-md md:hidden border border-border/30"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - 毛玻璃弹出菜单 */}
        {mobileMenuOpen && (
          <div className="border-t border-border/30 bg-gradient-to-b from-background/90 via-background/95 to-background/90 backdrop-blur-xl md:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 p-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium outline-none transition-all duration-200 backdrop-blur-md',
                      isActive
                        ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10'
                        : 'text-foreground/80 hover:bg-gradient-to-r hover:from-accent/60 hover:to-accent/30 hover:text-foreground border border-transparent hover:border-border/30'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              <div className="mt-4 flex gap-2">
                <Link href="/consult" className="flex-1">
                  <Button className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                    <MessageSquare className="h-4 w-4" />
                    智能咨询
                  </Button>
                </Link>
                <Link href="/report" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 backdrop-blur-md bg-background/50 border-border/50">
                    <FileText className="h-4 w-4" />
                    填报线索
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
