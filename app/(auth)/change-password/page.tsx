'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_login')
        .eq('id', user.id)
        .single() as { data: { first_login: boolean } | null };

      setIsFirstLogin(profile?.first_login || false);
    }

    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // 비밀번호 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError('비밀번호 변경 실패: ' + updateError.message);
        setLoading(false);
        return;
      }

      // first_login 플래그 업데이트
      if (userId) {
        await (supabase
          .from('user_profiles') as any)
          .update({
            first_login: false,
            last_password_change: new Date().toISOString()
          })
          .eq('id', userId);
      }

      setSuccess(true);

      // 2초 후 로그아웃 및 이동
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/login?message=비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('비밀번호 변경 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-[480px] bg-[#0c0c0e] border border-white/20 overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.6)]">
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <ShieldCheck className="w-6 h-6 text-green-500" />
              </div>
              <h1 className="text-3xl text-white tracking-tight">
                비밀번호 변경
              </h1>
            </div>
            <p className="text-zinc-400 text-lg">
              {isFirstLogin
                ? '처음 로그인하셨습니다. 새로운 비밀번호를 설정해주세요.'
                : '보안을 위해 비밀번호를 정기적으로 변경해 주세요.'}
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
                {!isFirstLogin && (
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

              {error && (
                <div className="bg-rose-500/10 text-rose-500 text-sm p-4 rounded-2xl border border-rose-500/20 flex items-center gap-3 animate-in shake-in duration-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="xl"
                variant="success"
                className="w-full transition-all"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : '비밀번호 변경하기'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
