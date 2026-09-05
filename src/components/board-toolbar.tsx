'use client'

import { Button } from '@/components/ui/button';
import { deleteBoard } from '@/lib/actions/boards';
import { Columns3, Rows3, Filter, Trash2 } from 'lucide-react';

interface BoardToolbarProps {
    boardId: string;
    boardTitle: string;
    onAddProperty: () => void;
    onAddEntry: () => void;
    showFilters: boolean;
    onToggleFilters: () => void;
}

export function BoardToolbar({ boardId, boardTitle, onAddProperty, onAddEntry, showFilters, onToggleFilters }: BoardToolbarProps) {
    return (
        <div className="mb-2 flex items-center gap-1 border-b pb-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFilters}
                aria-label="Toggle filters"
                className={showFilters ? 'text-foreground' : 'text-muted-foreground'}
            >
                <Filter />
            </Button>
            <Button variant="ghost" size="icon" onClick={onAddProperty} aria-label="Add property">
                <Columns3 />
            </Button>
            <Button variant="ghost" size="icon" onClick={onAddEntry} aria-label="Add entry">
                <Rows3 />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    if (confirm(`Delete "${boardTitle}"? This deletes every property, row, and value on it too.`)) {
                        deleteBoard(boardId);
                    }
                }}
                aria-label="Delete board"
            >
                <Trash2 />
            </Button>
        </div>
    );
}
