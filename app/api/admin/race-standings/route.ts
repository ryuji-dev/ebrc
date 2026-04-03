import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TOTAL_OT_CHAPTERS, TOTAL_NT_CHAPTERS, TOTAL_CHAPTERS } from "@/lib/constants/bible";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if ((profile as any)?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get("year") || "2026");

        const adminClient = createAdminClient();

        // 모든 참가자 조회 (user_reading_plans + user_profiles 조인)
        const { data: plans } = await (adminClient
            .from("user_reading_plans") as any)
            .select(`
                id,
                user_id,
                status,
                started_at,
                ot_completed_at,
                nt_completed_at,
                total_completed_at,
                user_profiles(full_name)
            `)
            .eq("year", year);

        if (!plans || plans.length === 0) {
            return NextResponse.json({ standings: [] });
        }

        // 각 참가자의 챕터 진행률 조회
        const userIds = plans.map((p: any) => p.user_id);

        // user_id별로 OT/NT 챕터 수 집계 (RPC로 DB에서 집계 — 1000행 제한 우회)
        const { data: progressRows } = await adminClient
            .rpc("get_bible_progress_counts", { p_year: year });

        const progressMap: Record<string, { ot: number; nt: number }> = {};
        for (const row of (progressRows || [])) {
            if (!progressMap[row.user_id]) {
                progressMap[row.user_id] = { ot: 0, nt: 0 };
            }
            if (row.book_id >= 1 && row.book_id <= 39) {
                progressMap[row.user_id].ot += Number(row.chapter_count);
            } else if (row.book_id >= 40 && row.book_id <= 66) {
                progressMap[row.user_id].nt += Number(row.chapter_count);
            }
        }

        const standings = plans.map((plan: any) => {
            const prog = progressMap[plan.user_id] || { ot: 0, nt: 0 };
            const total = prog.ot + prog.nt;
            return {
                user_id: plan.user_id,
                full_name: plan.user_profiles?.full_name ?? "알 수 없음",
                ot_progress: prog.ot,
                nt_progress: prog.nt,
                total_progress: total,
                ot_progress_pct: Math.round((prog.ot / TOTAL_OT_CHAPTERS) * 100),
                nt_progress_pct: Math.round((prog.nt / TOTAL_NT_CHAPTERS) * 100),
                total_progress_pct: Math.round((total / TOTAL_CHAPTERS) * 100),
                ot_completed_at: plan.ot_completed_at,
                nt_completed_at: plan.nt_completed_at,
                total_completed_at: plan.total_completed_at,
                status: plan.status,
                started_at: plan.started_at,
            };
        });

        // 정렬: 전체 완독자 우선(완독 시간 빠른 순), 그 다음 진행률 내림차순
        standings.sort((a: any, b: any) => {
            if (a.total_completed_at && b.total_completed_at) {
                return new Date(a.total_completed_at).getTime() - new Date(b.total_completed_at).getTime();
            }
            if (a.total_completed_at) return -1;
            if (b.total_completed_at) return 1;
            return b.total_progress - a.total_progress;
        });

        return NextResponse.json({ standings });
    } catch (error: any) {
        console.error("Race standings error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
