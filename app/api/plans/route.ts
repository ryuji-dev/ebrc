import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminClient = createAdminClient();

        // 모든 활성 플랜 조회
        const { data: plans, error } = await (adminClient
            .from("reading_plans") as any)
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // 내가 참여 중인 플랜 ID 목록
        const { data: myParticipations } = await (supabase
            .from("reading_plan_participants") as any)
            .select("plan_id, joined_at, completed_at")
            .eq("user_id", user.id);

        const myPlanMap = new Map((myParticipations || []).map((p: any) => [p.plan_id, p]));

        // 각 플랜의 참가자 수
        const planIds = (plans || []).map((p: any) => p.id);
        let participantCounts: Record<string, number> = {};

        if (planIds.length > 0) {
            const { data: countRows } = await (adminClient
                .from("reading_plan_participants") as any)
                .select("plan_id")
                .in("plan_id", planIds);

            for (const row of (countRows || [])) {
                participantCounts[row.plan_id] = (participantCounts[row.plan_id] || 0) + 1;
            }
        }

        const result = (plans || []).map((plan: any) => ({
            ...plan,
            participant_count: participantCounts[plan.id] || 0,
            my_participation: myPlanMap.get(plan.id) || null,
        }));

        return NextResponse.json({ plans: result });
    } catch (error: any) {
        console.error("Get plans error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
