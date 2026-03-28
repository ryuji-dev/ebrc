import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 관리자/리더 권한 확인
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const profile = profileData as { role: string } | null;

    if (profile?.role !== 'admin' && profile?.role !== 'leader') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "이메일 주소가 필요합니다." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. 해당 이메일을 가진 사용자 찾기
    const { data: userDataRaw, error: findError } = await adminClient
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    const userData = userDataRaw as { id: string } | null;

    if (findError || !userData) {
      return NextResponse.json({ error: "해당 이메일을 사용하는 사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 2. Auth 비밀번호 업데이트 (1111로 초기화 및 이메일 자동 컨펌)
    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userData.id,
      {
        password: '111111',
        email_confirm: true
      }
    );

    if (authError) {
      return NextResponse.json({ error: `비밀번호 초기화 실패: ${authError.message}` }, { status: 400 });
    }

    // 3. 다시 비밀번호 변경하도록 first_login 플래그 설정
    const { error: profileError } = await (adminClient
      .from('user_profiles') as any)
      .update({ first_login: true })
      .eq('id', userData.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    return NextResponse.json({ message: "비밀번호가 '111111'로 성공적으로 초기화되었습니다." });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
