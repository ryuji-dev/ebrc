import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldAlert, History, BookMarked } from "lucide-react";
import { Database } from "@/types/database.types";
import { MemberList } from "@/components/admin/MemberList";
import { PlanManager } from "@/components/admin/PlanManager";
import { cn } from "@/lib/utils";
import Link from "next/link";

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AdminPageProps {
  searchParams: Promise<{ page?: string; tab?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { page, tab } = await searchParams;
  const currentPage = parseInt(page || '1');
  const itemsPerPage = 10;
  const currentTab = tab || 'members';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userProfile = profile as { role: 'user' | 'admin' } | null;

  if (userProfile?.role !== 'admin') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-700">
        <ShieldAlert className="w-16 h-16 text-red-500/50 mb-2" />
        <h1 className="text-2xl text-white">접근 권한이 없습니다</h1>
        <p className="text-zinc-500">관리자만 접근 가능한 페이지입니다.</p>
      </div>
    );
  }

  const adminClient = createAdminClient();
  const { count: userCount } = await adminClient.from("user_profiles").select("*", { count: 'exact', head: true });

  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const today = kstTime.toISOString().split('T')[0];

  const { data: checkinRows } = await adminClient
    .from("devotion_checkins")
    .select("user_id")
    .eq("checkin_date", today);

  const todayCheckinData = (checkinRows || []) as { user_id: string }[];
  const todayCheckins = new Set(todayCheckinData.map(c => c.user_id)).size;

  let todayCheckinNames = "";
  if (todayCheckins > 0) {
    const uniqueUserIds = Array.from(new Set(todayCheckinData.map(c => c.user_id)));
    const { data: checkinProfiles } = await adminClient
      .from("user_profiles")
      .select("full_name")
      .in("id", uniqueUserIds);

    todayCheckinNames = ((checkinProfiles || []) as { full_name: string }[])
      .map(p => p.full_name)
      .join(", ");
  }

  // 통독 플랜 통계
  const { count: activePlanCount } = await (adminClient
    .from("reading_plans") as any)
    .select("*", { count: 'exact', head: true })
    .eq("is_active", true);

  const { data: usersData, count } = await adminClient
    .from("user_profiles")
    .select("id, email, full_name, role, created_at", { count: 'exact' })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

  const memberList = usersData as UserProfile[] | null;
  const totalUsers = count;
  const totalPages = Math.ceil((totalUsers || 0) / itemsPerPage);

  const tabs = [
    { key: 'members', label: '회원 관리' },
    { key: 'plans', label: '통독 플랜' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-6 md:p-10 mb-6 font-normal">
        <div className="relative z-10 space-y-3">
          <h1 className="text-2xl md:text-4xl text-white tracking-tight leading-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-primary" />
            관리자 콘솔
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl">
            사용자들의 활동 정보를 확인하고 계정을 관리할 수 있는 공간입니다.
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[120%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-primary/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <Users className="w-4 h-4 text-primary" />
              전체 회원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl text-white tracking-tight font-normal">{userCount || 0}명</div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] font-normal">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-green-500/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <History className="w-4 h-4 text-green-500" />
              오늘 경건시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <div className="text-3xl text-white tracking-tight font-normal">{todayCheckins}명</div>
                {todayCheckins > 0 && (
                  <div className="text-[10px] text-zinc-500 font-normal">{todayCheckinNames}</div>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center transition-all duration-500 group-hover:bg-green-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] font-normal">
                <History className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-primary/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <BookMarked className="w-4 h-4 text-primary" />
              활성 통독 플랜
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl text-white tracking-tight font-normal">{activePlanCount || 0}개</div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] font-normal">
                <BookMarked className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5 w-fit">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={cn(
              "px-6 py-2 rounded-xl text-sm transition-all",
              currentTab === t.key
                ? "bg-primary text-white shadow-lg"
                : "text-zinc-500 hover:text-white"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {currentTab === 'members' && (
        <MemberList
          memberList={memberList}
          todayCheckinData={todayCheckinData}
          currentUserId={user.id}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}

      {currentTab === 'plans' && (
        <div className="glass-dark border border-white/5 rounded-[2rem] p-6 md:p-8">
          <PlanManager />
        </div>
      )}
    </div>
  );
}
