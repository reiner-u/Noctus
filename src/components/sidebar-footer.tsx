'use client';

import {createClient} from '@/lib/supabase/client';

export function SidebarFooter({ user }: { user: any }) {
    const supabase = createClient();

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error during sign out:', error.message);
        } else {
            console.log('Signed out successfully');
            window.location.href = `${window.location.origin}/login`;
        }
    }

    return (
        <div className = "p-4 border-t">
            <header className="text-sm font-semibold mb-2">Signed in as</header>
            <div className="text-sm mb-4">{user?.email || 'Unknown user'}</div>
            <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Sign Out
            </button>
        </div>
    );
}