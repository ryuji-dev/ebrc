import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { bookId, chapter, year: providedYear, all, remove } = await req.json();
        const year = providedYear || new Date().getFullYear();

        if (!bookId) {
            return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
        }

        if (all) {
            if (remove) {
                // Bulk soft-delete logic
                const { error } = await (supabase
                    .from("user_bible_progress") as any)
                    .update({ deleted_at: new Date().toISOString() })
                    .eq("user_id", user.id)
                    .eq("book_id", bookId)
                    .eq("year", year);

                if (error) throw error;
                return NextResponse.json({ success: true, action: 'bulk_removed' });
            }

            // Bulk restore/upsert logic
            const bible = await import("@/lib/constants/bible");
            const book = bible.BIBLE_BOOKS.find(b => b.id === bookId);
            if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

            // 1. Restore any existing records (this preserves their original completed_at)
            await (supabase
                .from("user_bible_progress") as any)
                .update({ deleted_at: null })
                .eq("user_id", user.id)
                .eq("book_id", bookId)
                .eq("year", year);

            // 2. Find which chapters are still missing
            const { data: existingChapters } = await (supabase
                .from("user_bible_progress") as any)
                .select("chapter")
                .eq("user_id", user.id)
                .eq("book_id", bookId)
                .eq("year", year);

            const existingChapterNums = new Set(existingChapters?.map((c: any) => c.chapter) || []);
            const missingRecords = [];

            for (let i = 1; i <= book.chapters; i++) {
                if (!existingChapterNums.has(i)) {
                    missingRecords.push({
                        user_id: user.id,
                        book_id: bookId,
                        chapter: i,
                        year,
                        completed_at: new Date().toISOString(),
                        deleted_at: null
                    });
                }
            }

            if (missingRecords.length > 0) {
                const { error } = await (supabase
                    .from("user_bible_progress") as any)
                    .insert(missingRecords);
                if (error) throw error;
            }

            return NextResponse.json({ success: true, action: 'bulk_added' });
        }

        if (!chapter) {
            return NextResponse.json({ error: "Missing chapter" }, { status: 400 });
        }

        // Check if it already exists (including soft-deleted)
        const { data: existing } = await (supabase
            .from("user_bible_progress") as any)
            .select("id, deleted_at")
            .eq("user_id", user.id)
            .eq("book_id", bookId)
            .eq("chapter", chapter)
            .eq("year", year)
            .maybeSingle();

        if (existing) {
            const isCurrentlyDeleted = !!existing.deleted_at;

            // Toggle the deleted_at status
            const { error } = await (supabase
                .from("user_bible_progress") as any)
                .update({
                    deleted_at: isCurrentlyDeleted ? null : new Date().toISOString()
                })
                .eq("id", existing.id);

            if (error) throw error;
            return NextResponse.json({
                success: true,
                action: isCurrentlyDeleted ? 'restored' : 'removed'
            });
        } else {
            // New record
            const { data, error } = await (supabase
                .from("user_bible_progress") as any)
                .insert({
                    user_id: user.id,
                    book_id: bookId,
                    chapter: chapter,
                    year: year,
                    completed_at: new Date().toISOString(),
                    deleted_at: null
                })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, action: 'added', data });
        }
    } catch (error: any) {
        console.error("Bible toggle error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
