'use client'

import { useState } from 'react';
import Link from 'next/link';
import type { Board, Folder } from '@/lib/types';
import { SidebarFooter } from '@/components/sidebar-footer';
import { createBoard, createFolder, deleteBoard, moveBoardToFolder } from '@/lib/actions/boards';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, Plus, MoreHorizontal } from 'lucide-react';
import { useTabs } from '@/components/tabs-context';
import { FolderRow } from '@/components/folder-row';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

export function Sidebar({
    user,
    boards,
    folders,
}: {
    user: /* TODO: type this once I have a real User type */ any;
    boards: Board[];
    folders: Folder[];
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { openTab } = useTabs();

    // One flat level only, a folder never contains another folder,
    // that's the scoping call from the phases-part-2 doc.
    const ungroupedBoards = boards.filter((b) => !b.folder_id);
    const folderedBoards = folders.map((folder) => ({
        ...folder,
        boards: boards.filter((b) => b.folder_id === folder.id),
    }));

    function renderBoardRow(board: Board) {
        return (
            <div key={board.id} className="flex items-center justify-between gap-2 p-2">
                <Link
                    href={`/board/${board.id}`}
                    onClick={() => openTab(board.id, board.title)}
                    className="flex-1 truncate"
                >
                    {board.title}
                </Link>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Board options">
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                Add to folder
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                {folders.map((folder) => (
                                    <DropdownMenuItem
                                        key={folder.id}
                                        onClick={() => moveBoardToFolder(board.id, folder.id)}
                                    >
                                        {folder.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        {board.folder_id && (
                            <DropdownMenuItem onClick={() => moveBoardToFolder(board.id, null)}>
                                Remove from folder
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                                if (confirm(`Delete "${board.title}"? This deletes every property, row, and value on it too.`)) {
                                    deleteBoard(board.id);
                                }
                            }}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return (
        <aside className={`border-r flex flex-col transition-all ${isCollapsed ? 'w-12' : 'w-64'}`}>
            <div className="p-2">
                <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                </Button>
            </div>

            {!isCollapsed && (
                <>
                    <div className="flex-1 overflow-y-auto">
                        {ungroupedBoards.map(renderBoardRow)}

                        {folderedBoards.map((folder) => (
                            <div key={folder.id} className="pt-2">
                                <FolderRow folder={folder} />
                                <div className="pl-4">
                                    {folder.boards.map(renderBoardRow)}
                                </div>
                            </div>
                        ))}
                        
                        <div className="p-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="New">
                                        <Plus />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => createBoard()}>
                                        New board
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => createFolder('New folder')}>
                                        New folder
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <SidebarFooter user={user} />
                </>
            )}
        </aside>
    );
}
