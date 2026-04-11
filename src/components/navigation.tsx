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
import { useState, useEffect } from 'react';

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
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  // Handle client-side mounting for hydration consistency
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize pathname state for SSR consistency
  const currentPath = mounted ? pathname : '/';

  return (
    <nav className="sticky top-0 z-50 no-select">
      {/* 高级毛玻璃顶栏容器 */}
      <div className="relative h-[64px]">
        {/* 主毛玻璃层 */}
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          }}
        />
        
        {/* 顶部微光渐变 */}
        <div 
          className="absolute inset-x-0 top-0 h-[2px] animate-pulse"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.4) 20%, rgba(16,185,129,0.6) 50%, rgba(16,185,129,0.4) 80%, transparent 100%)',
          }}
        />
        
        {/* 底边细线 */}
        <div 
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.06) 80%, transparent 100%)',
          }}
        />
        
        {/* 主导航内容 */}
        <div className="relative h-full mx-auto max-w-7xl px-4 xl:px-6 flex items-center justify-between">
          
          {/* Logo 区域 */}
          <Link 
            href="/" 
            className="flex shrink-0 items-center gap-3 transition-all duration-200"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
          >
            {/* 精致Logo图标 - 带呼吸动画 */}
            <div 
              className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300"
              style={{
                background: logoHovered 
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.15) 100%)' 
                  : 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)',
                border: logoHovered 
                  ? '1px solid rgba(16,185,129,0.4)' 
                  : '1px solid rgba(16,185,129,0.2)',
                boxShadow: logoHovered
                  ? '0 4px 16px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.6)'
                  : '0 2px 8px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                transform: logoHovered ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {/* 图标光晕效果 */}
              <div 
                className="absolute inset-0 rounded-lg animate-pulse"
                style={{
                  background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)',
                }}
              />
              <Scale 
                className="h-5 w-5 text-emerald-600 relative z-10 transition-transform duration-300" 
                style={{ transform: logoHovered ? 'scale(1.15) rotate(5deg)' : 'scale(1)' }} 
              />
            </div>
            
            {/* Logo文字 */}
            <div className="flex flex-col">
              <span 
                className="text-base font-semibold text-gray-800 leading-tight transition-colors duration-200"
                style={{ color: logoHovered ? '#059669' : undefined }}
              >
                护薪平台
              </span>
              <span className="text-xs text-gray-400 leading-tight">检察支持起诉</span>
            </div>
          </Link>

          {/* Desktop Navigation - 精致导航项 */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg',
                    isActive
                      ? 'text-emerald-700'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                  style={isActive ? {
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    boxShadow: '0 1px 3px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent',
                  }}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-all duration-200',
                      isActive 
                        ? 'text-emerald-600' 
                        : 'text-gray-400 group-hover:text-gray-600'
                    )}
                    style={isActive ? { transform: 'scale(1.1)' } : {}}
                  />
                  <span>{item.name}</span>
                  
                  {isActive && (
                    <span 
                      className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full animate-pulse"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.7) 50%, transparent 100%)',
                        boxShadow: '0 0 10px rgba(16,185,129,0.5)',
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side actions - 精致按钮组 */}
          <div className="flex shrink-0 items-center gap-2">
            {/* 快捷链接 - 桌面端 */}
            <div className="hidden md:flex items-center gap-4 mr-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-all duration-200 hover:scale-105"
                >
                  <link.icon className="h-3.5 w-3.5" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
            
            <Link href="/consult">
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                }}
              >
                <MessageSquare className="h-4 w-4" />
                <span>智能咨询</span>
              </button>
            </Link>
            <Link href="/report">
              <button
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  color: 'rgba(0,0,0,0.7)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16,185,129,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)';
                  e.currentTarget.style.color = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
                  e.currentTarget.style.color = 'rgba(0,0,0,0.7)';
                }}
              >
                <FileText className="h-4 w-4" />
                <span>填报线索</span>
              </button>
            </Link>

            {/* Mobile menu button */}
            <button
              className="flex lg:hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 active:scale-95"
              style={{
                background: mobileMenuOpen ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.8)',
                border: mobileMenuOpen ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(0,0,0,0.06)',
              }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-emerald-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - 精致弹出菜单 */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden animate-in slide-in-from-top-2 duration-200"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <div className="space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                  )}
                  style={isActive ? {
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    color: '#059669',
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'rgba(0,0,0,0.7)',
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
              <Link href="/consult" className="flex-1">
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  智能咨询
                </button>
              </Link>
              <Link href="/report" className="flex-1">
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    color: 'rgba(0,0,0,0.7)',
                  }}
                >
                  <FileText className="h-4 w-4" />
                  填报线索
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
