'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { forgotPasswordSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, MailCheck, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!result.success) {
      const msg = Object.values(result.error.flatten().fieldErrors).flat()[0] ?? '입력 정보를 확인해 주세요.';
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
        redirectTo: `${window.location.origin}/auth/confirm`,
      });

      // 계정 존재 여부가 노출되지 않도록, 서버 오류(요청 제한 등)가 아닌 경우 항상 동일한 안내를 표시
      if (error && error.status !== 400 && error.status !== 404) {
        console.error(error);
        toast.error('메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      console.error(err);
      toast.error('메일 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-card border border-border rounded-[2rem] p-8 md:p-12 space-y-8 relative overflow-hidden shadow-2xl">

          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-primary rounded-[1.5rem] flex items-center justify-center text-white">
              {sent ? <MailCheck className="w-10 h-10" /> : <KeyRound className="w-10 h-10" />}
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl tracking-tight text-white font-brand">
                {sent ? '메일을 확인해 주세요' : '비밀번호 찾기'}
              </h1>
              <p className="text-muted-foreground text-sm font-medium">
                {sent
                  ? '입력하신 주소로 가입된 계정이 있다면 비밀번호 재설정 링크를 보내 드렸습니다.'
                  : '가입하신 이메일을 입력하시면 재설정 링크를 보내 드립니다.'}
              </p>
            </div>
          </div>

          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                메일이 보이지 않으면 스팸함을 확인해 주세요.<br />
                링크는 일정 시간이 지나면 만료됩니다.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => { setSent(false); setEmail(''); }}
              >
                다른 이메일로 다시 보내기
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white/5 border-white/10 rounded-xl h-12 px-4 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                />
              </div>

              <Button
                type="submit"
                size="xl"
                className="w-full transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : '재설정 링크 보내기'}
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs text-primary/80 hover:text-primary transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-3 h-3" />로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
