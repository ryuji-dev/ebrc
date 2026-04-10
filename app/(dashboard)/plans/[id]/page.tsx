import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PlanDetail } from "@/components/plans/PlanDetail";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: planId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const adminClient = createAdminClient();

    // 플랜 정보
    const { data: plan } = await (adminClient.from("reading_plans") as any)
        .select("*")
        .eq("id", planId)
        .maybeSingle();

    if (!plan) return notFound();

    // 내 참여 상태
    const { data: myParticipation } = await (supabase.from("reading_plan_participants") as any)
        .select("*")
        .eq("plan_id", planId)
        .eq("user_id", user.id)
        .maybeSingle();

    // 내 챕터 진행률 (참여 중인 경우, 페이지네이션으로 1000행 제한 우회)
    let myProgress: any[] = [];
    if (myParticipation) {
        const PAGE_SIZE = 1000;
        let from = 0;
        while (true) {
            const { data } = await (supabase.from("reading_plan_progress") as any)
                .select("book_id, chapter, completed_at, deleted_at")
                .eq("plan_id", planId)
                .eq("user_id", user.id)
                .is("deleted_at", null)
                .range(from, from + PAGE_SIZE - 1);
            if (!data || data.length === 0) break;
            myProgress = myProgress.concat(data);
            if (data.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
        }
    }

    return (
        <PlanDetail
            plan={plan}
            myParticipation={myParticipation}
            myProgress={myProgress}
        />
    );
}
