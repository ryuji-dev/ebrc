import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single();
        if ((profile as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { id: planId } = await params;
        const adminClient = createAdminClient();

        // 플랜 정보
        const { data: plan } = await (adminClient.from("reading_plans") as any)
            .select("id, title, total_chapters")
            .eq("id", planId)
            .single();

        if (!plan) return NextResponse.json({ error: "플랜을 찾을 수 없습니다." }, { status: 404 });

        // 1. 참가자 목록 조회
        const { data: participants } = await (adminClient.from("reading_plan_participants") as any)
            .select(`
                id,
                user_id,
                joined_at,
                completed_at
            `)
            .eq("plan_id", planId);

        if (!participants || participants.length === 0) {
            return NextResponse.json({ plan, standings: [] });
        }

        const userIds = participants.map((p: any) => p.user_id);

        // 2. 관련 사용자 프로필 조회 (이름 전용)
        const { data: profiles } = await (adminClient.from("user_profiles") as any)
            .select("id, full_name")
            .in("id", userIds);

        const profileMap: Record<string, string> = {};
        for (const prof of (profiles || [])) {
            profileMap[prof.id] = prof.full_name;
        }

        // 3. 각 참가자별 완료된 챕터 수 조회
        const { data: progressRows } = await (adminClient.from("reading_plan_progress") as any)
            .select("user_id")
            .eq("plan_id", planId)
            .in("user_id", userIds)
            .is("deleted_at", null);

        const progressMap: Record<string, number> = {};
        for (const row of (progressRows || [])) {
            progressMap[row.user_id] = (progressMap[row.user_id] || 0) + 1;
        }

        // 4. 데이터 병합
        const standings = participants.map((p: any) => {
            const completed = progressMap[p.user_id] || 0;
            return {
                user_id: p.user_id,
                full_name: profileMap[p.user_id] ?? "알 수 없음",
                joined_at: p.joined_at,
                completed_at: p.completed_at,
                completed_chapters: completed,
                total_chapters: plan.total_chapters,
                progress_pct: Math.round((completed / plan.total_chapters) * 100),
            };
        });

        // 완독자 우선(완독 시간 빠른 순), 미완독자는 진행률 내림차순
        standings.sort((a: any, b: any) => {
            if (a.completed_at && b.completed_at) {
                return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
            }
            if (a.completed_at) return -1;
            if (b.completed_at) return 1;
            return b.completed_chapters - a.completed_chapters;
        });

        return NextResponse.json({ plan, standings });
    } catch (error: any) {
        console.error("Standings error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
