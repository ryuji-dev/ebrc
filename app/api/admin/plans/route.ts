import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BIBLE_BOOKS } from "@/lib/constants/bible";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single();
        if ((profile as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const adminClient = createAdminClient();

        const { data: plans } = await (adminClient.from("reading_plans") as any)
            .select("*")
            .order("created_at", { ascending: false });

        // 플랜별 참가자 수 및 완독자 수
        const planIds = (plans || []).map((p: any) => p.id);
        let participantCounts: Record<string, number> = {};
        let completedCounts: Record<string, number> = {};

        if (planIds.length > 0) {
            const { data: participants } = await (adminClient.from("reading_plan_participants") as any)
                .select("plan_id, completed_at")
                .in("plan_id", planIds);

            for (const row of (participants || [])) {
                participantCounts[row.plan_id] = (participantCounts[row.plan_id] || 0) + 1;
                if (row.completed_at) {
                    completedCounts[row.plan_id] = (completedCounts[row.plan_id] || 0) + 1;
                }
            }
        }

        const result = (plans || []).map((plan: any) => ({
            ...plan,
            participant_count: participantCounts[plan.id] || 0,
            completed_count: completedCounts[plan.id] || 0,
        }));

        return NextResponse.json({ plans: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single();
        if ((profile as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { title, description, book_ids } = await req.json();

        if (!title || !book_ids || book_ids.length === 0) {
            return NextResponse.json({ error: "제목과 대상 책을 선택해주세요." }, { status: 400 });
        }

        // 총 챕터 수 계산
        const total_chapters = BIBLE_BOOKS
            .filter(b => book_ids.includes(b.id))
            .reduce((acc, b) => acc + b.chapters, 0);

        const adminClient = createAdminClient();

        const { data: plan, error } = await (adminClient.from("reading_plans") as any)
            .insert({
                title,
                description: description || null,
                created_by: user.id,
                book_ids,
                total_chapters,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        console.error("Create plan error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
