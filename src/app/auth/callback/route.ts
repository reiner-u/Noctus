import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    
    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
            return NextResponse.json({ error: "Failed login, try again :)" }, { status: 400 });
        }
        return NextResponse.redirect(new URL("/", request.url));
        }
    return NextResponse.redirect(new URL("/login", request.url));
    }