import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single();
        if ((profile as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const adminClient = createAdminClient();

        // 계획 삭제 (ON DELETE CASCADE로 인해 참가자 및 진행 현황도 삭제됨)
        const { error } = await (adminClient.from("reading_plans") as any)
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete plan error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
