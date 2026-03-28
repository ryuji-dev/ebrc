import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 관리자 권한 확인
        const { data: profileData } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const profile = profileData as { role: string } | null;

        // 관리자/리더 권한 확인
        if (profile?.role !== 'admin' && profile?.role !== 'leader') {
            return NextResponse.json({ error: "Forbidden. 관리자 또는 리더만 계정을 삭제할 수 있습니다." }, { status: 403 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "삭제할 사용자 ID가 필요합니다." }, { status: 400 });
        }

        // 본인 계정 삭제 방지
        if (userId === user.id) {
            return NextResponse.json({ error: "자기 자신의 계정은 삭제할 수 없습니다." }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // 1. Auth 사용자 삭제 (CASCADE 설정에 의해 user_profiles 등 연관 데이터가 삭제되거나, 수동으로 처리해야 할 수 있음)
        // Supabase Auth의 admin.deleteUser는 해당 사용자를 즉시 삭제합니다.
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteError) {
            return NextResponse.json({ error: `계정 삭제 실패: ${deleteError.message}` }, { status: 400 });
        }

        return NextResponse.json({ message: "성공적으로 계정이 삭제되었습니다." });

    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
