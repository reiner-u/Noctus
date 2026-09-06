import { createClient } from '@/lib/supabase/server';
import { getBoards, getFolders } from '@/lib/queries/boards';
import { Sidebar } from '@/components/sidebar';
import { TabsProvider } from '@/components/tabs-context';
import { TabBar } from '@/components/tab-bar';

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
    const folders = await getFolders();

    return (
        <TabsProvider>
        <div className="flex h-screen">
        <Sidebar user={claims} boards={boards} folders={folders} />
        <main className="flex-1 overflow-y-auto">
            <TabBar />
            {children}
        </main>
        </div>
        </TabsProvider>
    );
    }