import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { increment } = body;

        // Get current count
        const { data: profile, error: fetchError } = await (supabase
            .from('user_profiles') as any)
            .select('cumulative_readthrough_count')
            .eq('id', user.id)
            .single();

        if (fetchError) throw fetchError;

        const newCount = (profile?.cumulative_readthrough_count || 0) + (increment || 1);

        // Update count
        const { data: updated, error: updateError } = await (supabase
            .from('user_profiles') as any)
            .update({ cumulative_readthrough_count: newCount })
            .eq('id', user.id)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, count: updated.cumulative_readthrough_count });
    } catch (error: any) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
