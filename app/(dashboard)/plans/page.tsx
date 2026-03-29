import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LandPlot } from "lucide-react";
import { PlanList } from "@/components/plans/PlanList";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const adminClient = createAdminClient();

    // 활성 플랜 목록
    const { data: plans } = await (adminClient.from("reading_plans") as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    // 내 참여 상태
    const { data: myParticipations } = await (supabase.from("reading_plan_participants") as any)
        .select("plan_id, joined_at, completed_at")
        .eq("user_id", user.id);

    const myPlanMap = new Map((myParticipations || []).map((p: any) => [p.plan_id, p]));

    // 플랜별 참가자 수
    const planIds = (plans || []).map((p: any) => p.id);
    let participantCounts: Record<string, number> = {};

    if (planIds.length > 0) {
        const { data: countRows } = await (adminClient.from("reading_plan_participants") as any)
            .select("plan_id")
            .in("plan_id", planIds);

        for (const row of (countRows || [])) {
            participantCounts[row.plan_id] = (participantCounts[row.plan_id] || 0) + 1;
        }
    }

    const plansWithMeta = (plans || []).map((plan: any) => ({
        ...plan,
        participant_count: participantCounts[plan.id] || 0,
        my_participation: myPlanMap.get(plan.id) || null,
    }));

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-6 md:p-10">
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <LandPlot className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl md:text-4xl text-white tracking-tight leading-tight">
                            통독 플랜
                        </h1>
                    </div>
                    <p className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl">
                        관리자가 만든 통독 플랜에 참여하고 완독 시간을 기록해보세요. 먼저 완독한 사람이 1등입니다!
                    </p>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[120%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            </div>

            <PlanList plans={plansWithMeta} />
        </div>
    );
}
