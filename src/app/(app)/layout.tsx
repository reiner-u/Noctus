import { createClient } from '@/lib/supabase/server';
import { getBoards } from '@/lib/queries/boards';
import { Sidebar } from '@/components/sidebar';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    // TODO: get the current user via supabase.auth.getClaims() —
    // preferred over getUser() here, same reasoning as proxy.ts:
    // reads straight off the already-verified JWT, no extra network call.
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;

    const boards = await getBoards();

    return (
        <div className="flex h-screen">
        <Sidebar user={claims} boards={boards}  /* TODO: pass user down too, for the footer */ />
        <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
    }