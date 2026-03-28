import { createClient } from "@/lib/supabase/server";
import { Settings, LogOut, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch User Profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, email, full_name')
    .eq('id', user.id)
    .single() as { data: { role: 'admin' | 'leader' | 'user'; email: string; full_name: string } | null };

  const roleLabel = profile?.role === 'admin' ? 'PASTOR' : profile?.role === 'leader' ? 'LEADER' : 'MEMBER';
  const roleInitial = profile?.role === 'admin' ? 'P' : profile?.role === 'leader' ? 'L' : 'M';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section - Inspired by User's Request */}
      <div className="flex flex-col md:flex-row items-center gap-6 px-4">
        <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-500/10 border border-white/5 flex items-center justify-center text-indigo-500 text-3xl shadow-xl">
          {roleInitial}
        </div>

        <div className="text-center md:text-left space-y-1">
          <div className="flex flex-col md:flex-row md:items-center md:gap-3">
            <h1 className="text-2xl md:text-3xl text-white tracking-tight">
              {profile?.full_name || '사용자'}
            </h1>
            <span className="text-zinc-500 text-lg md:text-xl font-medium tracking-tight">
              {profile?.email}
            </span>
          </div>
          <div className="text-zinc-500 text-sm tracking-widest uppercase opacity-70">
            {roleLabel}
          </div>
        </div>
      </div>

      {/* Settings / Actions */}
      <div className="space-y-6">
        <h2 className="text-xl text-white px-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-zinc-500" />
          계정 설정
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
          <ChangePasswordModal
            trigger={
              <Button variant="outline" className="w-full h-20 justify-between px-6 glass-dark border-white/5 hover:border-green-500/20 hover:bg-green-500/5 rounded-[1.5rem] group transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-green-500/10 transition-all duration-300 border border-white/5 group-hover:border-green-500/20">
                    <Key className="w-5 h-5 text-zinc-400 group-hover:text-green-500 transition-colors duration-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-white group-hover:text-green-500 transition-colors duration-300">비밀번호 변경</div>
                    <div className="text-xs text-zinc-500">계정 보안을 위해 정기적으로 변경하세요.</div>
                  </div>
                </div>
              </Button>
            }
          />

          <form action="/api/auth/signout" method="post" className="w-full">
            <Button variant="outline" type="submit" className="w-full h-20 justify-between px-6 glass-dark border-white/5 hover:border-rose-500/20 hover:bg-rose-500/5 rounded-[1.5rem] group transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-rose-500/10 transition-all duration-300 border border-white/5 group-hover:border-rose-500/20">
                  <LogOut className="w-5 h-5 text-zinc-400 group-hover:text-rose-500 transition-colors duration-300" />
                </div>
                <div className="text-left">
                  <div className="text-white group-hover:text-rose-500 transition-colors duration-300">로그아웃</div>
                  <div className="text-xs text-zinc-500">Biblian 365 세션을 종료합니다.</div>
                </div>
              </div>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
