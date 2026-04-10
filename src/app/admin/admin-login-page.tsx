'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Loading skeleton component for consistent SSR/CSR
function LoginLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/50 to-white">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    // Check if already logged in
    const adminLoggedIn = localStorage.getItem('admin_logged_in');
    if (adminLoggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

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
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.authenticated) {
        localStorage.setItem('admin_logged_in', 'true');
        setIsAuthenticated(true);
        router.push('/admin/dashboard');
      } else {
        setLoginError('密码错误，请重试');
      }
    } catch (error) {
      setLoginError('登录失败，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  }, [password, router]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_logged_in');
    setIsAuthenticated(false);
    setPassword('');
  }, []);

  // Show loading skeleton during SSR and initial CSR hydration
  if (!mounted) {
    return <LoginLoadingSkeleton />;
  }

  // Already logged in state
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/50 to-white">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">已登录</h2>
          <p className="text-sm text-gray-500 mb-6">正在进入后台...</p>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors"
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
      {/* Left side - Brand (hidden on mobile, visible on lg+) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#1a3a5c] via-[#1e4d5c] to-[#1a5c4c] p-8 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
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
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '👥', value: '2,458+', label: '帮助劳动者' },
            { icon: '📊', value: '1,200+', label: '成功案例' },
            { icon: '💰', value: '¥860万+', label: '追回金额' },
            { icon: '✓', value: '98.6%', label: '成功维权率' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-white/50">© 2026 护薪平台</p>
      </div>
      
      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-emerald-50/50 to-white">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          {/* Mobile logo - hidden on lg */}
          <div className="lg:hidden flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a3a5c] to-[#1a5c4c] mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-center mb-2">
            管理员登录
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            请输入密码进入后台管理系统
          </p>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                管理员密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                disabled={loginLoading}
              />
            </div>
            
            {loginError && (
              <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                <span>⚠</span>
                <span>{loginError}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-gradient-to-r from-[#1a3a5c] to-[#1a5c4c] text-white rounded-lg text-sm font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none cursor-pointer"
            >
              ← 返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
