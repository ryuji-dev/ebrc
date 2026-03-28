'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpenText } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      if (data.user) {
        // 프로필 정보 가져오기
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_locked, first_login')
          .eq('id', data.user.id) // Corrected from session.user.id to data.user.id
          .single() as { data: { is_locked: boolean; first_login: boolean } | null };

        if (profile?.is_locked) {
          await supabase.auth.signOut();
          setError('계정이 잠겨있습니다. 관리자에게 문의하세요.');
          setLoading(false);
          return;
        }

        // 첫 로그인이면 비밀번호 변경 페이지로
        if (profile?.first_login) {
          router.push('/change-password');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">이메일 주소</Label>
                <div className="relative">
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
              </div>
              <div className="space-y-2 group">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">비밀번호</Label>
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

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

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

          <div className="text-center pt-2 space-y-3">
            <p className="text-xs text-muted-foreground/60">
              비밀번호를 잊으셨나요? <span className="text-primary/60 cursor-pointer hover:text-primary transition-colors">관리자에게 문의하세요.</span>
            </p>
            <div className="pt-2 border-t border-white/5">
              <Link
                href="/install-guide"
                className="text-xs text-primary/80 hover:text-primary transition-colors inline-flex items-center gap-2"
              >
                휴대폰/PC에 앱 설치하는 방법 알아보기 &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright or subtle link */}
        <p className="text-center mt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
          &copy; 2026 EBRC. Grace and Truth.
        </p>
      </div>
    </div>
  );
}
