import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'E-posta ve şifre gerekli.' },
        { status: 400 }
      );
    }
    const emailTrim = email.trim().toLowerCase();
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Şifre en az 6 karakter olmalı.' },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { email: emailTrim } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Bu e-posta adresi zaten kayıtlı.' },
        { status: 400 }
      );
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: emailTrim,
        passwordHash,
        name: typeof name === 'string' ? name.trim() || null : null,
      },
    });
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
    console.error('Register error:', err);
    return NextResponse.json(
      { success: false, error: 'Kayıt sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
