import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: planId } = await params;

        // 이미 참여 중인지 확인
        const { data: existing } = await (supabase
            .from("reading_plan_participants") as any)
            .select("*")
            .eq("plan_id", planId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ success: true, participant: existing, alreadyJoined: true });
        }

        // 플랜이 존재하고 활성 상태인지 확인
        const { data: plan } = await (supabase
            .from("reading_plans") as any)
            .select("id, is_active")
            .eq("id", planId)
            .maybeSingle();

        if (!plan) {
            return NextResponse.json({ error: "플랜을 찾을 수 없습니다." }, { status: 404 });
        }
        if (!plan.is_active) {
            return NextResponse.json({ error: "종료된 플랜입니다." }, { status: 400 });
        }

        // 참여 생성
        const { data: participant, error } = await (supabase
            .from("reading_plan_participants") as any)
            .insert({
                plan_id: planId,
                user_id: user.id,
                joined_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, participant });
    } catch (error: any) {
        console.error("Join plan error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
