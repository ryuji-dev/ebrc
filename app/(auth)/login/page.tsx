'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpenText, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    if (message) {
      toast.success(message);
      router.replace('/login');
    }
    if (error) {
      toast.error(error);
      router.replace('/login');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const msg = Object.values(errors).flat()[0] ?? '입력 정보를 확인해 주세요.';
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 'admin' 입력 시 admin@admin.com으로 자동 변환
      const loginEmail = email.trim() === 'admin' ? 'admin@admin.com' : email.trim();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError) {
        toast.error('이메일 또는 비밀번호가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      if (data.user) {
        toast.success('로그인 되었습니다.');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2 group">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">이메일</Label>
          <div className="relative">
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-white/5 border-white/10 rounded-xl h-12 px-4 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
        </div>
        <div className="space-y-2 group">
          <div className="flex items-center justify-between ml-1">
            <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">비밀번호</Label>
            <Link
              href="/forgot-password"
              tabIndex={-1}
              className="text-xs text-muted-foreground/60 hover:text-primary transition-colors mr-1"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="bg-white/5 border-white/10 rounded-xl h-12 px-4 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="xl"
        className="w-full transition-all disabled:opacity-50"
        disabled={loading}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : "로그인"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-card border border-border rounded-[2rem] p-8 md:p-12 space-y-8 relative overflow-hidden shadow-2xl">

          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-primary rounded-[1.5rem] flex items-center justify-center text-white text-2xl">
              <BookOpenText className="w-10 h-10" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-3xl tracking-tight text-white font-brand">EBRC : 에스라성경통독사경회</h1>
              <p className="text-muted-foreground text-sm font-medium">Ezra Bible Reading Conference</p>
            </div>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <div className="text-center pt-2 space-y-3">
            <p className="text-xs text-muted-foreground/60">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-primary/80 hover:text-primary transition-colors">
                회원가입
              </Link>
            </p>
            <div className="pt-2 border-t border-white/5">
              <Link
                href="/install-guide"
                className="text-xs text-primary/80 hover:text-primary transition-colors inline-flex items-center gap-2"
              >
                휴대폰/PC에 앱 설치하는 방법 알아보기<ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
          &copy; 2026 EBRC. Grace and Truth.
        </p>
      </div>
    </div>
  );
}
