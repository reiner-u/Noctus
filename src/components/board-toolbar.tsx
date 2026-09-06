'use client'

import { Button } from '@/components/ui/button';
import { deleteBoard } from '@/lib/actions/boards';
import { Columns3, Rows3, Filter, Trash2 } from 'lucide-react';
import type { Property } from '@/lib/types';
import type { SortingState } from '@tanstack/react-table';

interface BoardToolbarProps {
    boardId: string;
    boardTitle: string;
    properties: Property[];
    sorting: SortingState;
    onSortChange: (sorting: SortingState) => void;
    onAddProperty: () => void;
    onAddEntry: () => void;
    showFilters: boolean;
    onToggleFilters: () => void;
}

export function BoardToolbar({
    boardId,
    boardTitle,
    properties,
    sorting,
    onSortChange,
    onAddProperty,
    onAddEntry,
    showFilters,
    onToggleFilters,
}: BoardToolbarProps) {
    // Single-column sort for now, sorting[0] is the only entry TanStack
    // ever gets told to set from here. Encoded as "propertyId:asc" or
    // "propertyId:desc" so one <select> can represent both the column
    // and the direction at once.
    const currentSort = sorting[0];
    const currentValue = currentSort ? `${currentSort.id}:${currentSort.desc ? 'desc' : 'asc'}` : '';

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
            <select
                value={currentValue}
                onChange={(e) => {
                    if (!e.target.value) {
                        onSortChange([]);
                        return;
                    }
                    const [id, direction] = e.target.value.split(':');
                    onSortChange([{ id, desc: direction === 'desc' }]);
                }}
                className="rounded border border-input bg-background px-2 py-1 text-xs"
            >
                <option value="">No sorting</option>
                {properties.flatMap((prop) => [
                    <option key={`${prop.id}:asc`} value={`${prop.id}:asc`}>
                        {prop.name} (ascending)
                    </option>,
                    <option key={`${prop.id}:desc`} value={`${prop.id}:desc`}>
                        {prop.name} (descending)
                    </option>,
                ])}
            </select>
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
