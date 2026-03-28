import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // Check if a session exists before trying to sign out
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        await supabase.auth.signOut();
    }

    // Use absolute URL for the redirect
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(`${requestUrl.origin}/login`, {
        status: 303,
    });
}
