import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'E-posta ve şifre gerekli.' },
        { status: 400 }
      );
    }
    const emailTrim = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailTrim } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'E-posta veya şifre hatalı.' },
        { status: 401 }
      );
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'E-posta veya şifre hatalı.' },
        { status: 401 }
      );
    }
    await setAuthCookie({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Giriş sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
