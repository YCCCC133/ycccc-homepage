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
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* 顶部信息栏 */}
      <div className="hidden border-b border-border/30 bg-primary/5 md:block">
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

      {/* 主导航 */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Scale className="h-5 w-5 text-white" />
            </div>
            {/* 中等屏幕只显示平台名称 */}
            <span className="hidden text-base font-bold text-primary md:block lg:hidden">护薪平台</span>
            {/* 大屏幕显示完整信息 */}
            <div className="hidden min-w-0 lg:block">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-primary">护薪平台</span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-[var(--gold)] px-2 py-0.5 text-xs font-medium text-[var(--gold-foreground)]">
                  检察支持起诉
                </span>
              </div>
              <div className="whitespace-nowrap text-xs text-muted-foreground">
                保障劳动者薪酬权益
              </div>
            </div>
          </Link>

          {/* Desktop Navigation - 可收缩 */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium outline-none transition-all lg:gap-1.5 lg:px-3 lg:py-2',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground/70 hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform',
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    )}
                  />
                  <span className="hidden text-xs lg:inline">{item.name}</span>
                  <span className="text-xs lg:hidden">{item.name.slice(0, 2)}</span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-[var(--gold)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Button variant="outline" size="sm" className="gap-1.5 px-2 lg:gap-2 lg:px-3">
              <Phone className="h-4 w-4" />
              <span className="hidden lg:inline">紧急求助</span>
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-primary to-primary/90 px-3 shadow-md hover:shadow-lg lg:gap-2 lg:px-4"
            >
              <span>立即填报</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden"
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

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-white md:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium outline-none transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent focus-visible:bg-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1 gap-2">
                <Phone className="h-4 w-4" />
                紧急求助
              </Button>
              <Button className="flex-1 gap-2">立即填报</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
