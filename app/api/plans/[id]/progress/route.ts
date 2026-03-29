import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BIBLE_BOOKS } from "@/lib/constants/bible";

async function checkAndUpdateCompletion(supabase: any, userId: string, planId: string, totalChapters: number, bookIds: number[]) {
    // 현재 완료된 챕터 수 조회
    const { data: rows } = await supabase
        .from("reading_plan_progress")
        .select("id")
        .eq("plan_id", planId)
        .eq("user_id", userId)
        .is("deleted_at", null);

    const completedCount = rows?.length ?? 0;

    const { data: participant } = await supabase
        .from("reading_plan_participants")
        .select("id, completed_at")
        .eq("plan_id", planId)
        .eq("user_id", userId)
        .maybeSingle();

    if (!participant) return;

    if (completedCount >= totalChapters && !participant.completed_at) {
        // 완독!
        await supabase
            .from("reading_plan_participants")
            .update({ completed_at: new Date().toISOString() })
            .eq("id", participant.id);
    } else if (completedCount < totalChapters && participant.completed_at) {
        // 완독 취소 (챕터 해제 시)
        await supabase
            .from("reading_plan_participants")
            .update({ completed_at: null })
            .eq("id", participant.id);
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: planId } = await params;
        const { bookId, chapter, all, remove } = await req.json();

        if (!bookId) {
            return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
        }

        // 참여 중인지 확인
        const { data: participant } = await (supabase
            .from("reading_plan_participants") as any)
            .select("id")
            .eq("plan_id", planId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (!participant) {
            return NextResponse.json({ error: "플랜에 먼저 참여해주세요.", requiresJoin: true }, { status: 403 });
        }

        // 플랜 정보 조회
        const { data: plan } = await (supabase
            .from("reading_plans") as any)
            .select("book_ids, total_chapters")
            .eq("id", planId)
            .single();

        if (!plan) return NextResponse.json({ error: "플랜을 찾을 수 없습니다." }, { status: 404 });

        if (all) {
            const book = BIBLE_BOOKS.find(b => b.id === bookId);
            if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

            if (remove) {
                await (supabase.from("reading_plan_progress") as any)
                    .update({ deleted_at: new Date().toISOString() })
                    .eq("plan_id", planId)
                    .eq("user_id", user.id)
                    .eq("book_id", bookId);

                await checkAndUpdateCompletion(supabase, user.id, planId, plan.total_chapters, plan.book_ids);
                return NextResponse.json({ success: true, action: 'bulk_removed' });
            }

            // 기존 레코드 복원
            await (supabase.from("reading_plan_progress") as any)
                .update({ deleted_at: null })
                .eq("plan_id", planId)
                .eq("user_id", user.id)
                .eq("book_id", bookId);

            // 없는 챕터 추가
            const { data: existing } = await (supabase.from("reading_plan_progress") as any)
                .select("chapter")
                .eq("plan_id", planId)
                .eq("user_id", user.id)
                .eq("book_id", bookId);

            const existingSet = new Set((existing || []).map((r: any) => r.chapter));
            const missing = [];

            for (let i = 1; i <= book.chapters; i++) {
                if (!existingSet.has(i)) {
                    missing.push({
                        plan_id: planId,
                        user_id: user.id,
                        book_id: bookId,
                        chapter: i,
                        completed_at: new Date().toISOString(),
                        deleted_at: null,
                    });
                }
            }

            if (missing.length > 0) {
                const { error } = await (supabase.from("reading_plan_progress") as any).insert(missing);
                if (error) throw error;
            }

            await checkAndUpdateCompletion(supabase, user.id, planId, plan.total_chapters, plan.book_ids);
            return NextResponse.json({ success: true, action: 'bulk_added' });
        }

        if (!chapter) {
            return NextResponse.json({ error: "Missing chapter" }, { status: 400 });
        }

        const { data: existing } = await (supabase.from("reading_plan_progress") as any)
            .select("id, deleted_at")
            .eq("plan_id", planId)
            .eq("user_id", user.id)
            .eq("book_id", bookId)
            .eq("chapter", chapter)
            .maybeSingle();

        if (existing) {
            const isDeleted = !!existing.deleted_at;
            await (supabase.from("reading_plan_progress") as any)
                .update({ deleted_at: isDeleted ? null : new Date().toISOString() })
                .eq("id", existing.id);

            await checkAndUpdateCompletion(supabase, user.id, planId, plan.total_chapters, plan.book_ids);
            return NextResponse.json({ success: true, action: isDeleted ? 'restored' : 'removed' });
        }

        const { data, error } = await (supabase.from("reading_plan_progress") as any)
            .insert({
                plan_id: planId,
                user_id: user.id,
                book_id: bookId,
                chapter,
                completed_at: new Date().toISOString(),
                deleted_at: null,
            })
            .select()
            .single();

        if (error) throw error;

        await checkAndUpdateCompletion(supabase, user.id, planId, plan.total_chapters, plan.book_ids);
        return NextResponse.json({ success: true, action: 'added', data });
    } catch (error: any) {
        console.error("Plan progress toggle error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
