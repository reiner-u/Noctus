'use client'

import { useState, useRef } from 'react';
import type { Folder } from '@/lib/types';
import { renameFolder, deleteFolder, createBoard, createMasterScheduleTemplate } from '@/lib/actions/boards';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface FolderRowProps {
    folder: Folder;
}

export function FolderRow({ folder }: FolderRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(folder.name);
    // Same Escape/blur race guard BoardHeader and PropertyHeader both
    // use, Escape sets this before blur has a chance to fire, so blur's
    // save logic can check "was this just cancelled?" and skip itself.
    const cancelledRef = useRef(false);

    async function handleSave() {
        if (!draftName.trim()) {
            setIsEditing(false);
            setDraftName(folder.name);
            return;
        }
        if (draftName === folder.name) {
            setIsEditing(false);
            return;
        }
        try {
            await renameFolder(folder.id, draftName);
            setIsEditing(false);
        } catch (error) {
            alert(`Couldn't save: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
    }

    function handleCancel() {
        cancelledRef.current = true;
        setDraftName(folder.name);
        setIsEditing(false);
    }

    return (
        <div className="group flex items-center justify-between gap-2 rounded-md p-2 transition-colors hover:bg-sidebar-accent">
            {isEditing ? (
                <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') handleCancel();
                    }}
                    onBlur={() => {
                        if (cancelledRef.current) {
                            cancelledRef.current = false;
                            return;
                        }
                        handleSave();
                    }}
                    autoFocus
                    className="min-w-16 flex-1 bg-transparent outline-none"
                />
            ) : (
                <span
                    className="flex-1 cursor-pointer truncate"
                    onClick={() => setIsEditing(true)}
                >
                    {folder.name}
                </span>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Folder options"
                        className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                    >
                        <MoreHorizontal />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => createBoard(folder.id)}>
                        New board
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => createMasterScheduleTemplate(folder.id)}>
                        Master Schedule template
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={async () => {
                            if (confirm(`Delete "${folder.name}"? Its boards will be ungrouped, not deleted.`)) {
                                try {
                                    await deleteFolder(folder.id);
                                } catch (error) {
                                    alert(`Couldn't delete: ${error instanceof Error ? error.message : 'unknown error'}`);
                                }
                            }
                        }}
                    >
                        Delete folder
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
