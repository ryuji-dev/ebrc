import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, BookOpen, Trophy, Flame } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TOTAL_CHAPTERS } from '@/lib/constants/bible';
import { getTodayKST, getFirstDayOfMonthKST } from '@/lib/utils/date';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  // 사용자 프로필 정보
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, cumulative_readthrough_count')
    .eq('id', user.id)
    .single() as { data: { full_name: string; cumulative_readthrough_count: number } | null };

  // 오늘 경건시간 체크 여부 (KST 기준으로 날짜 계산)
  const today = getTodayKST();
  const { data: todayCheckinRows } = await supabase
    .from('devotion_checkins')
    .select('id')
    .eq('user_id', user.id)
    .eq('checkin_date', today)
    .is('parent_id', null) as { data: { id: string }[] | null };
  const todayCheckin = todayCheckinRows && todayCheckinRows.length > 0 ? todayCheckinRows[0] : null;

  // 이번 달 경건시간 횟수 (KST 기준)
  const firstDayOfMonth = getFirstDayOfMonthKST();
  const { count: monthCheckins } = await supabase
    .from('devotion_checkins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('checkin_date', firstDayOfMonth);

  // 현재 연도 통독 진행률 (KST 기준)
  const currentYear = new Date(today).getFullYear();
  const { data: allProgress } = await supabase
    .from('user_bible_progress')
    .select('book_id, chapter, year, deleted_at')
    .eq('user_id', user.id)
    .is('deleted_at', null) as { data: { book_id: number; chapter: number; year: number; deleted_at: string | null }[] | null };

  const currentYearProgress = allProgress?.filter(p => Number(p.year) === currentYear) || [];
  const readingProgress = Math.round((currentYearProgress.length / TOTAL_CHAPTERS) * 100);

  // 누적 완독 횟수 계산
  const yearGroups: Record<number, Set<string>> = {};
  allProgress?.forEach(p => {
    const y = Number(p.year);
    if (!yearGroups[y]) yearGroups[y] = new Set();
    yearGroups[y].add(`${p.book_id}-${p.chapter}`);
  });

  const calculatedCumulativeReads = Object.values(yearGroups).filter(set => set.size === TOTAL_CHAPTERS).length;
  const cumulativeReads = calculatedCumulativeReads + (profile?.cumulative_readthrough_count || 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-6 md:p-10 mb-6">
        <div className="relative z-10 space-y-3">
          <h1 className="text-2xl md:text-4xl text-white tracking-tight leading-tight">
            안녕하세요, <br className="md:hidden" /><span className="text-primary">{profile?.full_name || '사용자'}</span>님!
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl">
            오늘도 하나님과 깊이 교제하며 성령 충만한 하루 보내시길 기도합니다.
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[120%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 오늘 체크인 */}
        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-primary/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <Book className="w-4 h-4 text-primary" />
              오늘 경건시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                {todayCheckin ? (
                  <div className="text-3xl text-white">완료</div>
                ) : (
                  <div className="text-3xl text-zinc-800">미완료</div>
                )}
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                todayCheckin
                  ? "bg-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                  : "bg-zinc-900 text-zinc-700 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              )}>
                <Trophy className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이번 달 활동 */}
        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-orange-500/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              이번 달 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl text-white tracking-tight">{monthCheckins || 0}회</div>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center transition-all duration-500 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                <Flame className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 통독 진행률 */}
        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-blue-500/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              {currentYear}년 통독
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl text-white tracking-tight">{readingProgress}%</div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 누적 완독 */}
        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-yellow-500/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              누적 완독
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl text-white tracking-tight">{cumulativeReads}회</div>
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center transition-all duration-500 group-hover:bg-yellow-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                <Trophy className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Card className="glass-dark border-white/5 p-8 flex flex-col justify-between min-h-[250px] rounded-[2.5rem] relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
          <div className="relative z-10">
            <h3 className="text-3xl text-white tracking-wide">경건의 기록</h3>
            <p className="text-zinc-500 mt-3 text-lg font-medium">진실한 만남의 시간을 기록으로 남겨보세요</p>
          </div>
          <Link href="/devotion" className="mt-8 relative z-10">
            <Button size="2xl" className="w-full transition-all">
              {todayCheckin ? '나의 기록 확인' : '오늘의 기록 남기기'}
            </Button>
          </Link>
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-700" />
        </Card>

        <Card className="glass-dark border-white/5 p-8 flex flex-col justify-between min-h-[250px] rounded-[2.5rem] relative overflow-hidden group hover:border-white/20 transition-all duration-500">
          <div className="relative z-10">
            <h3 className="text-3xl text-white tracking-wide">성경 통독표</h3>
            <p className="text-zinc-500 mt-3 text-lg font-medium">연간 계획을 따라 성경을 완독하세요</p>
          </div>
          <Link href="/reading" className="mt-8 relative z-10">
            <Button variant="glass" size="2xl" className="w-full transition-all">
              통독표 보기
            </Button>
          </Link>
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all duration-700" />
        </Card>
      </div>
    </div>
  );
}
