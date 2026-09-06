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