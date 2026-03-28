import { createClient } from "@/lib/supabase/server";
import { BibleReadingTable } from "@/components/reading/BibleReadingTable";
import { BookOpen } from "lucide-react";

export default async function BibleReadingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get user's bible reading progress
    const { data: progress } = await (supabase
        .from("user_bible_progress") as any)
        .select("book_id, chapter, year, completed_at, deleted_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("completed_at", { ascending: false });

    // Get cumulative read count from profile
    const { data: profile } = await (supabase
        .from("user_profiles") as any)
        .select("cumulative_readthrough_count")
        .eq("id", user.id)
        .single();

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-6 md:p-10">
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl md:text-4xl text-white tracking-tight leading-tight">
                            성경통독표
                        </h1>
                    </div>
                    <p className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl">
                        2026년부터 함께하는 성경 통독 여정입니다. 창세기부터 요한계시록까지 차근차근 읽어나가 보세요.
                    </p>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[120%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            </div>

            <BibleReadingTable
                progress={progress || []}
                cumulativeReadCount={profile?.cumulative_readthrough_count || 0}
            />
        </div>
    );
}
