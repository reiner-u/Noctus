'use client';

import {createClient} from '@/lib/supabase/client';

export default function MainPage() {
    const supabase = createClient();

    async function Logout() {
        const { error } = await supabase.auth.signOut();
        window.location.href = `${window.location.origin}/login`;
        if (error) {
            console.error('Error during logout:', error.message);
        } else {
            console.log('Logged out successfully');
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <button
                onClick={Logout}
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Logout
            </button>
        </div>
    )};
