'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Loading skeleton component for consistent SSR/CSR
function LoginLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/50 to-white">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-stone-500">加载中...</p>
      </div>
    </div>
  );
}

// Statistics data - stable, no random values
const STATISTICS = [
  { id: 'workers', icon: '👥', value: '2,458+', label: '帮助劳动者' },
  { id: 'cases', icon: '📊', value: '1,200+', label: '成功案例' },
  { id: 'amount', icon: '💰', value: '¥860万+', label: '追回金额' },
  { id: 'rate', icon: '✓', value: '98.6%', label: '成功维权率' },
] as const;

export default function AdminLoginPage() {
  const router = useRouter();
  
  // ========== Hydration-safe state initialization ==========
  // All states MUST have stable initial values that match SSR output
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ========== Client-side initialization ==========
  // This runs ONLY after hydration is complete
  useEffect(() => {
    setMounted(true);
    
    // Check authentication status via Cookie (not localStorage)
    fetch('/api/admin/login', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('HTTP error');
        return res.json();
      })
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        // Silently fail - user will see login form
      });
  }, []);

  // ========== Login handler ==========
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setLoginError('请输入管理员密码');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRITICAL: Ensure cookies are sent
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // Authentication successful - Cookie is set by the API
        // No need for localStorage since we rely on Cookie
        setIsAuthenticated(true);
        
        // Brief delay to show success state before redirect
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 500);
      } else {
        // Login failed - show error message
        setLoginError(data.error || '密码错误，请重试');
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      setLoginError('网络错误，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  }, [password, router]);

  // ========== Logout handler ==========
  const handleLogout = useCallback(() => {
    // Clear state (Cookie is managed by API)
    setIsAuthenticated(false);
    setPassword('');
    
    // Call API to clear cookie
    fetch('/api/admin/login', { 
      method: 'DELETE', 
      credentials: 'include' 
    }).catch(() => {});
  }, []);

  // ========== SSR/CSR Consistency ==========
  // CRITICAL: This MUST match what renders after hydration
  // SSR: mounted=false → renders skeleton
  // CSR first render: mounted=false → renders skeleton (MUST match SSR)
  // After useEffect: mounted=true → renders actual content
  if (!mounted) {
    return <LoginLoadingSkeleton />;
  }

  // ========== Authenticated state ==========
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/30 via-stone-50/50 to-emerald-50/20">
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl text-center max-w-md">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-stone-800">已登录</h2>
          <p className="text-sm text-stone-500 mb-6">正在进入后台...</p>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-sm font-medium cursor-pointer hover:bg-stone-200 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  // ========== Login form ==========
  return (
    <div className="flex min-h-screen">
      {/* Left side - Brand (hidden on mobile, visible on lg+) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 p-8 flex-col justify-between relative overflow-hidden">
        {/* 装饰背景 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">护薪平台</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            检察支持起诉智能平台
          </h1>
          <p className="text-lg text-white/80 mb-8">
            为农民工群体提供薪酬权益保障服务
          </p>
        </div>
        
        {/* Statistics - Using stable ID as key */}
        <div className="grid grid-cols-2 gap-4 relative">
          {STATISTICS.map((stat) => (
            <div 
              key={stat.id} 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-white/50 relative">© {new Date().getFullYear()} 护薪平台</p>
      </div>
      
      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-stone-50/50 via-emerald-50/30 to-stone-50/50">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl">
          {/* Mobile logo - hidden on lg */}
          <div className="lg:hidden flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-center mb-2 text-stone-800">
            管理员登录
          </h2>
          <p className="text-sm text-stone-500 text-center mb-6">
            请输入密码进入后台管理系统
          </p>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                管理员密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                className="w-full px-4 py-3 text-sm border border-stone-200/60 rounded-xl outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 bg-white/80 backdrop-blur-sm"
                disabled={loginLoading}
                autoComplete="current-password"
              />
            </div>
            
            {loginError && (
              <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-600 bg-red-50/80 border border-red-100/50 rounded-xl">
                <span>⚠</span>
                <span>{loginError}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  登录中...
                </span>
              ) : (
                <span>登录</span>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-stone-200/40">
            <p className="text-xs text-center text-stone-400">
              护薪平台 · 管理员后台
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
