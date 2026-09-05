'use client'

import type { Property, CellValue, PropertyType } from '@/lib/types';
import { updateCellValue } from '@/lib/actions/boards';
import { TextCell } from '@/components/cell-inputs/text-cell';
import { NumberCell } from '@/components/cell-inputs/number-cell';
import { DateCell } from '@/components/cell-inputs/date-cell';
import { BooleanCell } from '@/components/cell-inputs/boolean-cell';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

interface EntryPanelProps {
    entryId: string | null;
    boardId: string;
    properties: Property[];
    cellValues: CellValue[];
    onOpenChange: (open: boolean) => void;
}

export function EntryPanel({ entryId, boardId, properties, cellValues, onOpenChange }: EntryPanelProps) {
    // entryId is null when the panel should be closed, Sheet's own `open`
    // prop just needs a boolean, `!!entryId` covers that.
    return (
        <Sheet open={!!entryId} onOpenChange={onOpenChange}>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Edit entry</SheetTitle>
                </SheetHeader>

                {/* TODO: map over `properties`, one row per property,
                   vertical instead of the table's horizontal cells.
                   Same lookup board-table.tsx already does per cell:
                     cellValues.find((cv) => cv.entry_id === entryId && cv.property_id === prop.id)
                   then the same switch(prop.type) picking TextCell /
                   NumberCell / DateCell / BooleanCell, same onChange
                   calling updateCellValue(boardId, entryId, prop.id, prop.type, newValue)
                   as board-table.tsx's cell renderer does today.
                   Wrap each in a labeled row, something like a div with
                   a label showing prop.name above the cell component.
                   entryId is only non-null once the Sheet is actually
                   open (see the `open` prop above), but it's still typed
                   as `string | null` here, so a null check (or a
                   non-null assertion once you're confident) is needed
                   before passing it into updateCellValue's onChange. */}
            </SheetContent>
        </Sheet>
    );
}
