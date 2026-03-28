import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, checkinDate, durationMinutes, memo, planId, plannedStartTime, plannedEndTime, startTime, endTime } = body as {
      id?: string;
      checkinDate: string;
      durationMinutes?: number | null;
      memo?: string | null;
      planId?: string | null;
      plannedStartTime?: string | null;
      plannedEndTime?: string | null;
      startTime?: string | null;
      endTime?: string | null;
    };

    if (!checkinDate) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Check for midnight span
    const isSpanningMidnight = startTime && endTime && (startTime > endTime);

    let result;
    if (id) {
      // Update existing
      result = await (supabase
        .from("devotion_checkins") as any)
        .update({
          duration_minutes: durationMinutes ?? null,
          memo: memo ?? null,
          plan_id: planId ?? null,
          planned_start_time: plannedStartTime ?? null,
          planned_end_time: plannedEndTime ?? null,
          start_time: startTime ?? null,
          end_time: isSpanningMidnight ? "24:00" : (endTime ?? null),
          updated_by: user.id,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await (supabase
        .from("devotion_checkins") as any)
        .insert({
          user_id: user.id,
          checkin_date: checkinDate,
          duration_minutes: durationMinutes ?? null,
          memo: memo ?? null,
          plan_id: planId ?? null,
          planned_start_time: plannedStartTime ?? null,
          planned_end_time: plannedEndTime ?? null,
          start_time: startTime ?? null,
          end_time: isSpanningMidnight ? "24:00" : (endTime ?? null),
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Handle split record for midnight span
    const mainRecord = result.data;
    if (isSpanningMidnight) {
      // 다음날 날짜 계산 (날짜 문자열 YYYY-MM-DD를 직접 연산하여 UTC 시차 벵잡성 제거)
      const [cy, cm, cd] = checkinDate.split('-').map(Number);
      const nextDateObj = new Date(Date.UTC(cy, cm - 1, cd + 1));
      const nextDateStr = nextDateObj.toISOString().split('T')[0];

      // Upsert the "tomorrow" part
      // We search for an existing child record by parent_id
      const { data: existingChild } = await (supabase
        .from("devotion_checkins") as any)
        .select("id")
        .eq("parent_id", mainRecord.id)
        .maybeSingle();

      if (existingChild) {
        await (supabase
          .from("devotion_checkins") as any)
          .update({
            checkin_date: nextDateStr,
            start_time: "00:00",
            end_time: endTime,
            duration_minutes: durationMinutes, // Note: total duration? Or split? User wants to see it on both days.
            memo: memo,
            updated_by: user.id
          })
          .eq("id", existingChild.id);
      } else {
        await (supabase
          .from("devotion_checkins") as any)
          .insert({
            user_id: user.id,
            checkin_date: nextDateStr,
            start_time: "00:00",
            end_time: endTime,
            duration_minutes: durationMinutes,
            memo: memo,
            parent_id: mainRecord.id,
            created_by: user.id,
            updated_by: user.id
          });
      }
    } else {
      // If NOT spanning anymore, delete any orphaned child record
      await (supabase
        .from("devotion_checkins") as any)
        .delete()
        .eq("parent_id", mainRecord.id);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("Checkin Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Delete the record. CASCADE should handle child records if configured.
    const { error } = await (supabase
      .from("devotion_checkins") as any)
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
