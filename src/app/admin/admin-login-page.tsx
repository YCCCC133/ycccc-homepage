'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/login');
      const data = await res.json();
      if (data.success && data.isLoggedIn) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError('请输入密码');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setLoginError(data.error || '密码错误');
      }
    } catch {
      setLoginError('网络错误');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      setIsAuthenticated(false);
      router.push('/');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // Consistent loading state for SSR/CSR
  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), white)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32,
            height: 32,
            border: '3px solid #e5e7eb',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            margin: '0 auto 16px'
          }} className="animate-spin" />
          <p style={{ color: '#6b7280', fontSize: 14 }}>加载中...</p>
        </div>
      </div>
    );
  }

  // Logged in state
  if (isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), white)'
      }}>
        <div style={{
          background: 'white',
          padding: 32,
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(to bottom right, #10b981, #059669)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>已登录</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>正在进入后台...</p>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              color: '#374151'
            }}
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh'
    }}>
      {/* Left side - Brand */}
      <div style={{
        display: 'none',
        flex: 1,
        background: 'linear-gradient(to bottom right, #1a3a5c, #1e4d5c, #1a5c4c)',
        padding: 32,
        flexDirection: 'column',
        justifyContent: 'space-between'
      }} className="lg:flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{
              width: 48,
              height: 48,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>护薪平台</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 16 }}>
            检察支持起诉智能平台
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>
            为农民工群体提供薪酬权益保障服务
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { icon: '👥', value: '2,458+', label: '帮助劳动者' },
            { icon: '📊', value: '1,200+', label: '成功案例' },
            { icon: '💰', value: '¥860万+', label: '追回金额' },
            { icon: '✓', value: '98.6%', label: '成功维权率' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
        
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>© 2026 护薪平台</p>
      </div>
      
      {/* Right side - Login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        background: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), white)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: 32
        }}>
          {/* Mobile logo */}
          <div style={{
            width: 56,
            height: 56,
            background: 'linear-gradient(to bottom right, #1a3a5c, #1a5c4c)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }} className="lg:hidden">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          
          <h2 style={{ fontSize: 20, fontWeight: 600, textAlign: 'center', marginBottom: 8 }}>
            管理员登录
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
            请输入密码进入后台管理系统
          </p>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 6,
                color: '#374151'
              }}>
                管理员密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            {loginError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 12,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                marginBottom: 16,
                color: '#dc2626',
                fontSize: 14
              }}>
                <span>⚠</span>
                <span>{loginError}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'linear-gradient(to right, #1a3a5c, #1a5c4c)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                opacity: loginLoading ? 0.7 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {loginLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  登录中...
                </span>
              ) : '登录系统'}
            </button>
          </form>
          
          <div style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              ← 返回首页
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
