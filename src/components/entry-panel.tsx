'use client'

import type { Property, PropertyOption, CellValue, PropertyType } from '@/lib/types';
import { updateCellValue } from '@/lib/actions/boards';
import { TextCell } from '@/components/cell-inputs/text-cell';
import { NumberCell } from '@/components/cell-inputs/number-cell';
import { DateCell } from '@/components/cell-inputs/date-cell';
import { BooleanCell } from '@/components/cell-inputs/boolean-cell';
import { SelectCell } from '@/components/cell-inputs/select-cell';
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
    propertyOptions: PropertyOption[];
    cellValues: CellValue[];
    onOpenChange: (open: boolean) => void;
}

export function EntryPanel({ entryId, boardId, properties, propertyOptions, cellValues, onOpenChange }: EntryPanelProps) {
    return (
        <Sheet open={!!entryId} onOpenChange={onOpenChange}>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Edit entry</SheetTitle>
                </SheetHeader>

                {properties.map((prop) => {
                    const cellValue = cellValues.find((cv) => cv.entry_id === entryId && cv.property_id === prop.id);
                    return (
                        <div key={prop.id} className="flex flex-col space-y-2 px-4">
                            <label>{prop.name}</label>
                            {(() => {
                                switch (prop.type) {
                                    case 'text':
                                        return (
                                            <TextCell
                                                value={cellValue?.value_text ?? null}
                                                onChange={(newValue) => {
                                                    if (!entryId) return;
                                                    updateCellValue(boardId, entryId, prop.id, 'text', newValue);
                                                }}
                                            />
                                        );
                                    case 'number':
                                        return (
                                            <NumberCell
                                                value={cellValue?.value_number ?? null}
                                                onChange={(newValue) => {
                                                    if (!entryId) return;
                                                    updateCellValue(boardId, entryId, prop.id, 'number', newValue);
                                                }}
                                            />
                                        );
                                    case 'date':
                                        return (
                                            <DateCell
                                                value={cellValue?.value_date ? new Date(cellValue.value_date) : null}
                                                onChange={(newValue) => {
                                                    if (!entryId) return;
                                                    updateCellValue(boardId, entryId, prop.id, 'date', newValue);
                                                }}
                                            />
                                        );
                                    case 'boolean':
                                        return (
                                            <BooleanCell
                                                value={cellValue?.value_boolean ?? null}
                                                onChange={(newValue) => {
                                                    if (!entryId) return;
                                                    updateCellValue(boardId, entryId, prop.id, 'boolean', newValue);
                                                }}
                                            />
                                        );
                                    case 'select':
                                        return (
                                            <SelectCell
                                                value={cellValue?.value_option_id ?? null}
                                                options={propertyOptions.filter((opt) => opt.property_id === prop.id)}
                                                onChange={(newValue) => {
                                                    if (!entryId) return;
                                                    updateCellValue(boardId, entryId, prop.id, 'select', newValue);
                                                }}
                                            />
                                        );
                                    default:
                                        return null;
                                }
                            })()}
                        </div>
                    );
                })}
            </SheetContent>
        </Sheet>
    );
}
