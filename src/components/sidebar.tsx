import Link from 'next/link';
import type { Board } from '@/lib/types';
import { SidebarFooter } from '@/components/sidebar-footer';
import { createBoard } from '@/lib/actions/boards';
import { DeleteBoardButton } from '@/components/delete-board-button';

export function Sidebar({ user, boards }: { user: /* TODO: type this once I have a real User type */ any; boards: Board[] }) {
    return (
        <aside className="w-64 border-r flex flex-col">
        <div className="flex-1 overflow-y-auto">
            { boards.map((board) => (
                <div key={board.id} className="flex items-center justify-between">
                    <Link href={`/board/${board.id}`} className="flex-1 p-4 hover:bg-gray-100">
                        {board.title}
                    </Link>
                    <DeleteBoardButton boardId={board.id} title={board.title} />
                </div>
            )) }
            <form action={createBoard} className="p-4">
                <button className="w-full p-4 text-left hover:bg-gray-100">+ New board</button>
            </form>
        </div>
        <SidebarFooter user={user} />
        </aside>
    );
}