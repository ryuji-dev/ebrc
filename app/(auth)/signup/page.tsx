'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { signupSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UsersRound } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = signupSchema.safeParse({ email, fullName, password, confirmPassword });
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const msg = Object.values(errors).flat()[0] ?? '입력 정보를 확인해 주세요.';
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (signUpError) {
        toast.error('회원가입 실패: ' + signUpError.message);
        setLoading(false);
        return;
      }

      toast.success('회원가입이 완료되었습니다!');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('회원가입 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-card border border-border rounded-[2rem] p-8 md:p-12 space-y-8 relative overflow-hidden shadow-2xl">

          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-primary rounded-[1.5rem] flex items-center justify-center text-white text-2xl">
              <UsersRound className="w-10 h-10" />
            </div>
            <h1 className="text-3xl tracking-tight text-white font-brand">회원가입</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white/5 border-white/10 rounded-xl h-12 px-4 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                />
              </div>
              <div className="space-y-2 group">
                <Label htmlFor="fullName" className="text-xs uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">이름</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white/5 border-white/10 rounded-xl h-12 px-4 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                />
              </div>
              <div className="space-y-2 group">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">비밀번호</Label>
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
              <div className="space-y-2 group">
                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              ) : '회원가입'}
            </Button>
          </form>

          <div className="text-center pt-2 space-y-3">
            <p className="text-xs text-muted-foreground/60">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary/80 hover:text-primary transition-colors">
                로그인
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
          &copy; 2026 EBRC. Grace and Truth.
        </p>
      </div>
    </div>
  );
}
