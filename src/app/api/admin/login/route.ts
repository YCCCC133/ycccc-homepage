import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import crypto from 'crypto';

// 简单的密码哈希函数
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'huxin_salt_2026').digest('hex');
}

// 生成会话token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Cookie 配置 - 根据环境自动调整 secure 标志
function getCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction, // 生产环境必须 HTTPS，开发环境使用 HTTP
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24小时
    path: '/',
  };
}

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET 请求 - 检查登录状态
export async function GET(request: NextRequest) {
  try {
    const authenticated = isAuthenticated(request);
    
    return NextResponse.json({ 
      authenticated, 
      success: authenticated 
    });
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return NextResponse.json({ 
      authenticated: false, 
      success: false,
      error: '检查状态失败'
    }, { status: 500 });
  }
}

// POST 请求 - 执行登录
export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  let supabaseInitError: string | null = null;
  
  console.log('[login] POST request received');
  
  try {
    const { password } = await request.json();
    console.log('[login] Password received:', password ? '***' : 'empty');

    if (!password) {
      console.log('[login] No password provided');
      return NextResponse.json({ error: '请输入密码' }, { status: 400 });
    }

    // 尝试获取 Supabase 客户端
    let client = null;
    try {
      client = getSupabaseClient();
      console.log('[login] Supabase client initialized');
    } catch (envError: any) {
      console.error('[login] Failed to initialize Supabase client:', envError?.message || envError);
      supabaseInitError = envError?.message || '初始化失败';
      // 继续使用本地验证模式
    }
    
    // 如果有 Supabase 客户端，尝试数据库验证
    if (client) {
      try {
        console.log('[login] Attempting database authentication...');
        const { data, error } = await client
          .from('admins')
          .select('id, password_hash')
          .eq('username', 'admin')
          .maybeSingle();

        if (!error && data) {
          console.log('[login] Admin found in database');
          const hashedPassword = hashPassword(password);
          
          if (data.password_hash === hashedPassword) {
            console.log('[login] Password verified');
            
            // 更新最后登录时间 - 忽略错误
            try {
              await client
                .from('admins')
                .update({ last_login: new Date().toISOString() })
                .eq('id', data.id);
            } catch (e) {
              // 忽略更新错误
            }

            const token = generateToken();
            const response = NextResponse.json({ success: true, token, authenticated: true });
            const opts = getCookieOptions(isProduction);
            response.cookies.set('admin_token', token, opts);
            console.log('[login] Login successful (DB mode)');
            return response;
          } else {
            console.log('[login] Wrong password (DB mode)');
            return NextResponse.json({ error: '密码错误' }, { status: 401 });
          }
        }
        
        // 如果数据库中没有管理员，或者查询出错，尝试创建
        if (error || !data) {
          console.log('[login] No admin in DB, attempting to create...');
          const defaultPassword = 'huxin2026';
          const hashedDefaultPassword = hashPassword(defaultPassword);
          
          let insertError: any = null;
          try {
            const upsertResult = await client
              .from('admins')
              .upsert({
                username: 'admin',
                password_hash: hashedDefaultPassword,
                last_login: new Date().toISOString()
              }, { onConflict: 'username' });
            
            if (upsertResult.error) {
              insertError = upsertResult.error;
            }
          } catch (e) {
            console.error('[login] Failed to upsert admin:', e);
            insertError = e;
          }
          
          if (!insertError || insertError?.message?.includes('duplicate') || insertError?.code === '23505') {
            // 创建成功或已存在，检查密码
            if (password === defaultPassword) {
              console.log('[login] First-time login, creating admin');
              const token = generateToken();
              const response = NextResponse.json({ success: true, token, authenticated: true });
              const opts = getCookieOptions(isProduction);
              response.cookies.set('admin_token', token, opts);
              console.log('[login] Login successful (first-time)');
              return response;
            } else {
              console.log('[login] Wrong password (first-time mode)');
              return NextResponse.json({ error: '密码错误' }, { status: 401 });
            }
          }
          
          // 如果创建失败，继续使用本地验证
          console.log('[login] DB upsert failed, falling back to local auth');
        }
      } catch (dbError) {
        console.error('[login] Database error:', dbError);
        // 继续使用本地验证
      }
    }
    
    // 本地验证模式（无论是否连接数据库）
    console.log('[login] Using local authentication mode');
    const defaultPassword = 'huxin2026';
    
    if (password === defaultPassword) {
      console.log('[login] Local auth successful');
      const token = generateToken();
      const response = NextResponse.json({ success: true, token, authenticated: true });
      const opts = getCookieOptions(isProduction);
      response.cookies.set('admin_token', token, opts);
      return response;
    } else {
      console.log('[login] Local auth failed - wrong password');
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }
    
  } catch (error: any) {
    console.error('[login] Fatal error:', error);
    
    // 最后的降级方案：使用默认密码
    try {
      const body = await request.json().catch(() => ({}));
      if (body.password === 'huxin2026') {
        console.log('[login] Emergency fallback - login successful');
        const token = generateToken();
        const response = NextResponse.json({ success: true, token, authenticated: true });
        const opts = getCookieOptions(isProduction);
        response.cookies.set('admin_token', token, opts);
        return response;
      }
    } catch {
      // ignore
    }
    
    console.log('[login] Login failed completely');
    return NextResponse.json({ 
      error: '服务器错误',
      details: error?.message || '未知错误',
      supabaseInitError: supabaseInitError || null
    }, { status: 500 });
  }
}

// DELETE - 退出登录
export async function DELETE(request: NextRequest) {
  console.log('[login] DELETE request (logout)');
  const response = NextResponse.json({ success: true });
  
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  });
  
  return response;
}
