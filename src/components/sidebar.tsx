'use client'

import { useState } from 'react';
import Link from 'next/link';
import type { Board } from '@/lib/types';
import { SidebarFooter } from '@/components/sidebar-footer';
import { createBoard } from '@/lib/actions/boards';
import { DeleteBoardButton } from '@/components/delete-board-button';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function Sidebar({ user, boards }: { user: /* TODO: type this once I have a real User type */ any; boards: Board[] }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={`border-r flex flex-col transition-all ${isCollapsed ? 'w-12' : 'w-64'}`}>
            <div className="p-2">
                <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                </Button>
            </div>

            {/* TODO: wrap the board list + "+ New board" form (the whole
               div below) AND <SidebarFooter> in `{!isCollapsed && (...)}`,
               so collapsed state hides everything except the toggle rail
               above. Two separate things to wrap, the div and the footer,
               both need the same condition. */}
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
