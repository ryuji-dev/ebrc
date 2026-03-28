import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { planId, date, memo } = await req.json();

    const { data, error } = await (supabase
      .from("user_reading_completions") as any)
      .insert({
        user_id: user.id,
        plan_id: planId,
        date: date,
        memo: memo,
      })
      .select()
      .single();

    if (error) throw error;

    // 통독 완료 체크 프로시저 호출 (선택 사항 - 트리거로 처리됨)
    // await supabase.rpc('check_and_complete_reading_plan', { p_plan_id: planId });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { planId, date } = await req.json();

    const { error } = await (supabase
      .from("user_reading_completions") as any)
      .delete()
      .eq("user_id", user.id)
      .eq("plan_id", planId)
      .eq("date", date);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
