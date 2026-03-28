import { createClient } from "@/lib/supabase/server";
import { CheckinClient } from "@/components/devotion/CheckinClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar as CalendarIcon, Target, Clock } from "lucide-react";
import { calculateCurrentStreak, calculateLongestStreak } from "@/lib/utils/streak";
import { getTodayKST, getThisMonthKST } from "@/lib/utils/date";

export default async function DevotionCheckinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 체크인 기록 가져오기 (최근 1년, KST 기준)
  const todayKST = getTodayKST();
  const oneYearAgoDate = new Date(todayKST);
  oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgoDate.toISOString().split('T')[0];

  const { data: checkinsData } = await supabase
    .from("devotion_checkins")
    .select("id, checkin_date, duration_minutes, memo, planned_start_time, planned_end_time, start_time, end_time")
    .eq("user_id", user.id)
    .gte("checkin_date", oneYearAgoStr)
    .order("checkin_date", { ascending: false });

  const checkins = checkinsData as any[] | null;

  const checkinDates = Array.from(new Set(checkins?.map(c => c.checkin_date) || []));
  const totalDuration = checkins?.reduce((acc, c) => acc + (c.duration_minutes || 0), 0) || 0;

  const initialCheckinDetails: Record<string, any[]> = {};

  checkins?.forEach(c => {
    // ... (rest of processing remains same)
    if (!initialCheckinDetails[c.checkin_date]) {
      initialCheckinDetails[c.checkin_date] = [];
    }
    initialCheckinDetails[c.checkin_date].push({
      id: c.id,
      durationMinutes: c.duration_minutes || undefined,
      memo: c.memo || undefined,
      plannedStartTime: c.planned_start_time || undefined,
      plannedEndTime: c.planned_end_time || undefined,
      startTime: c.start_time || undefined,
      endTime: c.end_time || undefined,
    });
  });

  const currentStreak = calculateCurrentStreak(checkinDates);
  const longestStreak = calculateLongestStreak(checkinDates);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-6 md:p-10 mb-6">
        <div className="relative z-10 space-y-3">
          <h1 className="text-2xl md:text-4xl text-white tracking-tight leading-tight">
            경건의 시간 기록
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl">
            오늘도 하나님께 드리는 진실한 고백과 만남의 시간을 기록해보세요.
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[120%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-orange-500/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              현재 연속
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl text-white tracking-tight">{currentStreak}일</div>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center transition-all duration-500 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                <Flame className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-indigo-500/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <Target className="w-4 h-4 text-indigo-500" />
              최장 기록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl text-white tracking-tight">{longestStreak}일</div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center transition-all duration-500 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-green-500/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <CalendarIcon className="w-4 h-4 text-green-500" />
              이번 달 횟수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl text-white tracking-tight">
                {checkinDates.filter(d => d.startsWith(getThisMonthKST())).length}회
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center transition-all duration-500 group-hover:bg-green-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-primary/30 transition-all duration-500 rounded-[2rem]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
              <Clock className="w-4 h-4 text-primary" />
              총 경건 시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl text-white tracking-tight">{totalDuration.toLocaleString()}분</div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="glass-dark border-white/5 rounded-[2.5rem] p-4 md:p-8">
        <CheckinClient
          checkinDates={checkinDates}
          initialCheckinDetails={initialCheckinDetails}
        />
        <p className="text-center text-sm text-zinc-500 mt-6">
          날짜를 클릭하여 상세 기록을 입력하거나 수정할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

