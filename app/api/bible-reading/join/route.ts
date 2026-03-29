import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { year } = await req.json();
        if (!year) return NextResponse.json({ error: "year 필드가 필요합니다." }, { status: 400 });

        // 이미 참여 중인지 확인
        const { data: existing } = await (supabase
            .from("user_reading_plans") as any)
            .select("*")
            .eq("user_id", user.id)
            .eq("year", year)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ success: true, plan: existing, alreadyJoined: true });
        }

        // 해당 연도 템플릿 찾기
        const adminClient = createAdminClient();
        const { data: template } = await (adminClient
            .from("reading_plan_templates") as any)
            .select("id")
            .eq("year", year)
            .maybeSingle();

        if (!template) {
            return NextResponse.json({ error: `${year}년 통독 플랜이 없습니다.` }, { status: 404 });
        }

        // 플랜 참여 생성
        const { data: plan, error } = await (supabase
            .from("user_reading_plans") as any)
            .insert({
                user_id: user.id,
                template_id: template.id,
                year,
                status: "in_progress",
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        console.error("Join plan error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
