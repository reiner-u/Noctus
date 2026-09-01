import { createClient } from '@/lib/supabase/server';
import { getBoards } from '@/lib/queries/boards';
import { Sidebar } from '@/components/sidebar';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    // TODO: use getClaims() here, not getUser(). Same call I used
    // in proxy.ts, since it reads straight off the JWT and skips
    // an extra network round trip.
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;

    const boards = await getBoards();

    return (
        <div className="flex h-screen">
        <Sidebar user={claims} boards={boards} />
        <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
    }