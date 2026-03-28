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

    if (profile?.role !== 'admin' && profile?.role !== 'leader') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, fullName, temporaryPassword, role = 'user' } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: "이메일과 이름은 필수입니다." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Auth 사용자 생성 (비밀번호 설정 및 이메일 자동 컨펌)
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (inviteError) {
      return NextResponse.json({ error: `계정 생성 실패: ${inviteError.message}` }, { status: 400 });
    }

    const authUser = inviteData.user;

    // 2. User Profiles 테이블 업데이트
    const { error: profileError } = await (adminClient
      .from('user_profiles') as any)
      .upsert({
        id: authUser.id,
        email,
        full_name: fullName,
        role: role as 'user' | 'leader' | 'admin',
        first_login: true
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return NextResponse.json({ message: "성공적으로 계정이 생성되었습니다. 이제 해당 비밀번호로 로그인이 가능합니다." });

  } catch (error: any) {
    console.error('Provisioning error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
