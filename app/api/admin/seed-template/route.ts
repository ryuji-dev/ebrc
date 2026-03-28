import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    if (profile?.role !== 'admin' && profile?.role !== 'leader') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { year, title } = await req.json();

    // 1. 템플릿 생성
    const { data: template, error: tErr } = await (supabase
      .from("reading_plan_templates") as any)
      .insert({
        year: year,
        title: title || `${year}년 성경 통독`,
        created_by: user.id
      })
      .select()
      .single();

    if (tErr) throw tErr;

    // 2. 365일 데이터 생성 (샘플 구절)
    // 실제 운영시에는 CSV를 파싱하거나 상세 리스트를 넣어야 함
    const items = [];
    const books = ["창세기", "출애굽기", "레위기", "민수기", "신명기"]; // 샘플용

    for (let i = 1; i <= 365; i++) {
      const date = new Date(year, 0, i);
      items.push({
        template_id: template.id,
        date: date.toISOString().split('T')[0],
        day_number: i,
        passages: `${books[i % 5]} ${Math.ceil(i / 5)}장`,
        notes: i === 1 ? "새해 첫날 말씀" : null
      });
    }

    const { error: iErr } = await (supabase
      .from("reading_plan_template_items") as any)
      .insert(items);

    if (iErr) throw iErr;

    return NextResponse.json({ success: true, templateId: template.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
