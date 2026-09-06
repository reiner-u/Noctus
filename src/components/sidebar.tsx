'use client'

import { useState } from 'react';
import Link from 'next/link';
import type { Board, Folder } from '@/lib/types';
import { SidebarFooter } from '@/components/sidebar-footer';
import { createBoard, createFolder, deleteFolder, moveBoardToFolder } from '@/lib/actions/boards';
import { DeleteBoardButton } from '@/components/delete-board-button';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { useTabs } from '@/components/tabs-context';

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
    const [newFolderName, setNewFolderName] = useState('');
    const { openTab } = useTabs();

    // TODO: split `boards` into two groups:
    //   - ungroupedBoards: boards.filter((b) => !b.folder_id)
    //   - for each folder, its own boards: boards.filter((b) => b.folder_id === folder.id)
    // One flat level only, a folder never contains another folder,
    // that's the scoping call from the phases-part-2 doc.
    const ungroupedBoards = boards.filter((b) => !b.folder_id);
    const folderedBoards = folders.map((folder) => ({
        ...folder,
        boards: boards.filter((b) => b.folder_id === folder.id),
    }));

    function handleCreateFolder() {
        if (!newFolderName.trim()) {
            return;
        }
        createFolder(newFolderName.trim());
        setNewFolderName('');
    }

    // TODO: a <select> (or similar) per board, listing "No folder" plus
    // every folder name, onChange calling
    // moveBoardToFolder(board.id, e.target.value || null).
    // This is the same "select-driven update" shape the table's filter
    // row already uses in a few places, nothing new conceptually, just
    // a new place to use it.
    const handleMoveBoardToFolder = (boardId: string, folderId: string | null) => {
        moveBoardToFolder(boardId, folderId);
    }

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
                <DeleteBoardButton boardId={board.id} title={board.title} />
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
                        {/* TODO: folder rows still need a delete icon
                           (Button + X, same confirm-then-call pattern
                           DeleteBoardButton uses, but lighter wording
                           since deleting a folder only un-groups its
                           boards rather than destroying them). */}
                        {ungroupedBoards.map(renderBoardRow)}

                        {folderedBoards.map((folder) => (
                            <div key={folder.id} className="pt-2">
                                <div className="flex items-center justify-between gap-2 p-2">
                                    <span className="flex-1 truncate">{folder.name}</span>
                                </div>
                                <div className="pl-4">
                                    {folder.boards.map(renderBoardRow)}
                                </div>
                            </div>
                        ))}
                        
                        <div className="flex items-center gap-2 p-2">
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateFolder();
                                }}
                                placeholder="New folder name"
                                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                            />
                            <Button variant="ghost" size="icon" onClick={handleCreateFolder}>
                                <Plus />
                            </Button>
                        </div>

                        <form action={createBoard} className="p-4">
                            <button className="w-full p-4 text-left hover:bg-gray-100">+ New board</button>
                        </form>
                    </div>
                    <SidebarFooter user={user} />
                </>
            )}
        </aside>
    );
}
