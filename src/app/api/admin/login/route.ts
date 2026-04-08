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

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 });
    }

    const client = getSupabaseClient();
    
    // 查询管理员
    const { data: admin, error } = await client
      .from('admins')
      .select('id, password_hash')
      .eq('username', 'admin')
      .maybeSingle();

    if (error) {
      console.error('查询管理员失败:', error);
      return NextResponse.json({ error: '系统错误' }, { status: 500 });
    }

    // 如果管理员不存在，使用默认密码
    const defaultPassword = 'huxin2026';
    const hashedPassword = hashPassword(password);
    
    if (!admin) {
      // 首次登录，检查是否使用默认密码
      if (password === defaultPassword) {
        // 创建管理员账号
        const { error: insertError } = await client
          .from('admins')
          .insert({
            username: 'admin',
            password_hash: hashPassword(defaultPassword),
          });

        if (insertError) {
          console.error('创建管理员失败:', insertError);
          return NextResponse.json({ error: '初始化失败' }, { status: 500 });
        }

        // 更新最后登录时间
        await client
          .from('admins')
          .update({ last_login: new Date().toISOString() })
          .eq('username', 'admin');

        const token = generateToken();
        const response = NextResponse.json({ success: true, token });
        response.cookies.set('admin_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 24小时
        });
        return response;
      } else {
        return NextResponse.json({ error: '密码错误' }, { status: 401 });
      }
    }

    // 验证密码
    if (admin.password_hash !== hashedPassword) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    // 更新最后登录时间
    await client
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    const token = generateToken();
    const response = NextResponse.json({ success: true, token });
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 改为 lax，允许同站请求携带 cookie
      maxAge: 60 * 60 * 24, // 24小时
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (token) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false });
}

// 修改密码
export async function PUT(request: NextRequest) {
  try {
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度不能少于6位' }, { status: 400 });
    }

    const client = getSupabaseClient();
    
    // 查询管理员
    const { data: admin, error } = await client
      .from('admins')
      .select('id, password_hash')
      .eq('username', 'admin')
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: '管理员账号不存在' }, { status: 404 });
    }

    // 验证旧密码
    const hashedOldPassword = hashPassword(oldPassword);
    if (admin.password_hash !== hashedOldPassword) {
      return NextResponse.json({ error: '原密码错误' }, { status: 401 });
    }

    // 更新密码
    const hashedNewPassword = hashPassword(newPassword);
    const { error: updateError } = await client
      .from('admins')
      .update({ password_hash: hashedNewPassword })
      .eq('id', admin.id);

    if (updateError) {
      console.error('更新密码失败:', updateError);
      return NextResponse.json({ error: '密码修改失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
