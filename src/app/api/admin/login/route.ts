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
  
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 });
    }

    let client;
    try {
      client = getSupabaseClient();
    } catch (envError) {
      console.error('Supabase 客户端初始化失败:', envError);
      // 如果 Supabase 不可用，使用本地验证模式
      const defaultPassword = 'huxin2026';
      if (password === defaultPassword) {
        const token = generateToken();
        const response = NextResponse.json({ success: true, token, authenticated: true });
        const opts = getCookieOptions(isProduction);
        response.cookies.set('admin_token', token, opts);
        return response;
      } else {
        return NextResponse.json({ error: '密码错误' }, { status: 401 });
      }
    }
    
    // 查询管理员
    let admin = null;
    let queryError = null;
    
    try {
      const { data, error } = await client
        .from('admins')
        .select('id, password_hash')
        .eq('username', 'admin')
        .maybeSingle();

      if (error) {
        queryError = error;
        console.error('查询管理员失败:', error);
      } else {
        admin = data;
      }
    } catch (dbError) {
      queryError = dbError;
      console.error('数据库查询异常:', dbError);
    }

    // 如果数据库查询失败或表不存在，使用本地验证模式
    if (queryError || !admin) {
      const defaultPassword = 'huxin2026';
      
      // 尝试创建 admins 表（如果使用 Supabase）
      if (client && !queryError) {
        try {
          // 尝试插入管理员（如果表存在但没有数据）
          const hashedDefaultPassword = hashPassword(defaultPassword);
          const { error: insertError } = await client
            .from('admins')
            .upsert({
              username: 'admin',
              password_hash: hashedDefaultPassword,
              last_login: new Date().toISOString()
            }, { onConflict: 'username' });
          
          if (!insertError) {
            // 管理员创建/更新成功
            const token = generateToken();
            const response = NextResponse.json({ success: true, token, authenticated: true });
            const opts = getCookieOptions(isProduction);
            response.cookies.set('admin_token', token, opts);
            return response;
          }
        } catch (upsertError) {
          console.error('尝试创建管理员失败:', upsertError);
        }
      }
      
      // 降级到本地验证
      if (password === defaultPassword) {
        const token = generateToken();
        const response = NextResponse.json({ success: true, token, authenticated: true });
        const opts = getCookieOptions(isProduction);
        response.cookies.set('admin_token', token, opts);
        return response;
      } else {
        return NextResponse.json({ error: '密码错误' }, { status: 401 });
      }
    }

    // 验证密码
    const hashedPassword = hashPassword(password);
    if (admin.password_hash !== hashedPassword) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    // 更新最后登录时间
    try {
      await client
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);
    } catch (updateError) {
      console.error('更新登录时间失败:', updateError);
      // 不影响登录流程继续
    }

    const token = generateToken();
    const response = NextResponse.json({ success: true, token, authenticated: true });
    const opts = getCookieOptions(isProduction);
    response.cookies.set('admin_token', token, opts);
    return response;
    
  } catch (error) {
    console.error('登录错误:', error);
    
    // 最后的降级方案：使用默认密码
    try {
      const { password } = await request.json().catch(() => ({}));
      if (password === 'huxin2026') {
        const token = generateToken();
        const response = NextResponse.json({ success: true, token, authenticated: true });
        const opts = getCookieOptions(isProduction);
        response.cookies.set('admin_token', token, opts);
        return response;
      }
    } catch {
      // ignore
    }
    
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE - 退出登录
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // 清除 Cookie
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  });
  
  return response;
}
