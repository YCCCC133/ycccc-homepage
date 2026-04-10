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
      {/* ========================================
          高级毛玻璃顶栏容器
          ======================================== */}
      <div 
        className="relative"
        style={{
          height: '72px',
        }}
      >
        {/* 主毛玻璃层 - 多层叠加实现高级质感 */}
        
        {/* 1. 底层：极淡渐变背景（增加呼吸感） */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
          }}
        />
        
        {/* 2. 主体毛玻璃层 */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          }}
        />
        
        {/* 3. 顶层：微弱高光层（增加立体感） */}
        <div 
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
          }}
        />
        
        {/* 4. 底边细线 */}
        <div 
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.06) 80%, transparent 100%)',
          }}
        />
        
        {/* 5. 外阴影（柔和悬浮感） */}
        <div 
          className="absolute inset-x-0 top-full h-8 -mt-8 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%)',
          }}
        />
        
        {/* 顶部信息栏 */}
        <div className="hidden md:block absolute inset-x-0 top-0 h-8">
          <div 
            className="h-full"
            style={{
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(12px) saturate(120%)',
              WebkitBackdropFilter: 'blur(12px) saturate(120%)',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 text-xs text-gray-500/80">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5">
                  <Scale className="h-3 w-3 text-emerald-600/70" />
                  <span className="font-medium">北京市西城区人民检察院</span>
                </span>
                <span className="text-gray-300">|</span>
                <span>全国模范检察院 · 科技强检示范院</span>
              </div>
              <div className="flex items-center gap-5">
                {quickLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-1.5 transition-colors hover:text-emerald-600"
                  >
                    <link.icon className="h-3 w-3" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* 主导航内容 */}
        <div 
          className="absolute inset-x-0 bottom-0"
          style={{ paddingBottom: '12px' }}
        >
          <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-6">
            
            {/* Logo 区域 */}
            <Link href="/" className="flex shrink-0 items-center gap-3">
              {/* 精致Logo图标 */}
              <div 
                className="relative flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                <Scale className="h-5 w-5 text-emerald-600" />
                {/* 图标微弱光晕 */}
                <div 
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(16,185,129,0.2) 0%, transparent 70%)',
                  }}
                />
              </div>
              
              {/* Logo文字 */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">护薪平台</span>
                  <span 
                    className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      color: 'rgba(16,185,129,0.8)',
                      border: '1px solid rgba(16,185,129,0.15)',
                    }}
                  >
                    检察支持起诉
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">保障劳动者薪酬权益</span>
              </div>
            </Link>

            {/* Desktop Navigation - 精致导航项 */}
            <div className="hidden items-center gap-1 xl:gap-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg',
                      isActive
                        ? // 选中态：精致玻璃胶囊
                          'text-emerald-700'
                        : // 默认态：低对比度
                          'text-gray-500 hover:text-gray-700'
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
                    {/* 图标 */}
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-all duration-200',
                        isActive 
                          ? 'text-emerald-600' 
                          : 'text-gray-400 group-hover:text-gray-600'
                      )}
                      style={{
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      }}
                    />
                    
                    {/* 文字 */}
                    <span className="hidden xl:inline">
                      {item.name}
                    </span>
                    <span className="xl:hidden">
                      {item.name.slice(0, 2)}
                    </span>
                    
                    {/* 选中态底部精致指示线 */}
                    {isActive && (
                      <span 
                        className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.6) 50%, transparent 100%)',
                          boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side actions - 精致按钮组 */}
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <Link href="/consult">
                <button
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white rounded-lg transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(-0.5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>智能咨询</span>
                </button>
              </Link>
              <Link href="/report">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: 'rgba(0,0,0,0.7)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden lg:inline">填报线索</span>
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:hidden"
              style={{
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-600" />
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
          className="md:hidden"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <div className="space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
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
            <div className="mt-4 flex gap-2">
              <Link href="/consult" className="flex-1">
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg"
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg"
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
