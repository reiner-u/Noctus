'use client';

import {createClient} from '@/lib/supabase/client';

export default function LoginPage() {
    const supabase = createClient();

    async function handleGoogleLogin() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            }
        });

        if (error) {
            console.error('Error during login:', error.message);
        } else {
            console.log('Login successful:', data);
        }
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Login</h1>
            <p className="mt-4 text-lg">This is the login page.</p>
            <button
                onClick={handleGoogleLogin}
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Login with Google
            </button>
        </div>
    );
}