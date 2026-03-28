'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { changePasswordSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    if (searchParams.get('recovery') === 'true') {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    }
    checkUser();

    return () => subscription.unsubscribe();
  }, [router, supabase, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = changePasswordSchema.safeParse({
      currentPassword: isRecovery ? undefined : currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const formErrors = result.error.flatten().formErrors;
      const msg = [...formErrors, ...Object.values(errors).flat()][0] ?? '입력 정보를 확인해 주세요.';
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error('비밀번호 변경 실패: ' + updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('비밀번호가 변경되었습니다.');

      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/login?message=비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error('비밀번호 변경 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-3 text-center md:text-left">
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <ShieldCheck className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-3xl text-white tracking-tight">
            {isRecovery ? '비밀번호 재설정' : '비밀번호 변경'}
          </h1>
        </div>
        <p className="text-zinc-400 text-lg">
          {isRecovery ? '새 비밀번호를 입력해 주세요.' : '보안을 위해 비밀번호를 정기적으로 변경해 주세요.'}
        </p>
      </div>

      {success ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="text-center">
            <p className="text-white text-xl mb-1">
              비밀번호가 변경되었습니다.
            </p>
            <p className="text-sm font-medium text-zinc-400">
              잠시 후 로그인 페이지로 이동합니다.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {!isRecovery && (
              <div className="space-y-2">
                <Label htmlFor="current" className="text-xs text-zinc-500 uppercase tracking-widest ml-1">현재 비밀번호</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg focus:ring-green-500/20 focus:border-green-500/50 text-white"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new" className="text-xs text-zinc-500 uppercase tracking-widest ml-1">새 비밀번호</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg focus:ring-green-500/20 focus:border-green-500/50 text-white"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-xs text-zinc-500 uppercase tracking-widest ml-1">새 비밀번호 확인</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg focus:ring-green-500/20 focus:border-green-500/50 text-white"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="xl"
            variant="success"
            className="w-full transition-all"
            disabled={loading}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isRecovery ? '비밀번호 재설정하기' : '비밀번호 변경하기'}
          </Button>
        </form>
      )}
    </>
  );
}

export default function ChangePasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-[480px] bg-[#0c0c0e] border border-white/20 overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.6)]">
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
          <Suspense fallback={null}>
            <ChangePasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
