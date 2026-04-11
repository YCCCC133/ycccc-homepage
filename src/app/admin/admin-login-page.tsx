'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Loading skeleton component for consistent SSR/CSR
function LoginLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50/30 to-white">
      <div className="text-center">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">加载中...</p>
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
  
  // Hydration-safe state initialization
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Client-side initialization
  useEffect(() => {
    setMounted(true);
    
    // Check authentication status via Cookie
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
      .catch(() => {});
  }, []);

  // Login handler
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
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 500);
      } else {
        setLoginError(data.error || '密码错误，请重试');
      }
    } catch {
      setLoginError('网络错误，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  }, [password, router]);

  // Logout handler
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setPassword('');
    fetch('/api/admin/login', { 
      method: 'DELETE', 
      credentials: 'include' 
    }).catch(() => {});
  }, []);

  // SSR/CSR Consistency
  if (!mounted) {
    return <LoginLoadingSkeleton />;
  }

  // Authenticated state
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50/30 to-white">
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-emerald-500/10 text-center max-w-md border border-slate-200/60">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">已登录</h2>
          <p className="text-sm text-slate-500 mb-6">正在进入后台...</p>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-200 transition-colors border border-slate-200"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="flex min-h-screen">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-700 to-emerald-800 p-8 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">护薪平台</span>
              <p className="text-xs text-white/60 uppercase tracking-wider">Admin Console</p>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            检察支持起诉<br />
            <span className="text-emerald-400">智能管理平台</span>
          </h1>
          <p className="text-white/70 text-lg mb-10">为农民工群体提供薪酬权益保障服务</p>
        </div>
        
        {/* Stats */}
        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {STATISTICS.map((stat) => (
              <div key={stat.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <span className="text-2xl mb-1 block">{stat.icon}</span>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        
        <p className="relative z-10 text-white/40 text-sm">© {new Date().getFullYear()} 护薪平台</p>
      </div>
        
      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">护薪平台</span>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl shadow-emerald-500/5 border border-slate-200/60 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">管理员登录</h2>
              <p className="text-sm text-slate-500">请输入密码进入后台管理系统</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">管理员密码</label>
                <input
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入管理员密码"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
              
              {loginError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {loginError}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    登录中...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    登录系统
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <button 
                onClick={() => router.push('/')} 
                className="w-full text-center text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
