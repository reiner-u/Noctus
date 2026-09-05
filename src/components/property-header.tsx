'use client'

import { useState } from 'react';
import type { Property, CellValue, PropertyType } from '@/lib/types';
import { updateProperty, deleteProperty } from '@/lib/actions/boards';
import { Button } from '@/components/ui/button';
import { Trash2, Check, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const PROPERTY_TYPES: PropertyType[] = ['text', 'number', 'date', 'boolean'];

interface PropertyHeaderProps {
    property: Property;
    boardId: string;
    cellValues: CellValue[];
    // TanStack's Column object for this header, typed loosely (matches
    // the `info: any` pattern already used for cell renderers elsewhere).
    // Gives access to column.getIsSorted() ('asc' | 'desc' | false) and
    // column.getToggleSortingHandler() (an onClick-ready function, cycles
    // asc -> desc -> off on each click).
    column: any;
}

export function PropertyHeader({ property, boardId, cellValues, column }: PropertyHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(property.name);
    const [draftType, setDraftType] = useState<PropertyType>(property.type);

    // Whether this column currently holds any data at all, across every
    // typed field, not just the current type's. Used below to decide
    // whether a type change needs a warning first.
    const hasData = cellValues.some(
        (cv) =>
            cv.property_id === property.id &&
            (cv.value_text !== null || cv.value_number !== null || cv.value_date !== null || cv.value_boolean !== null)
    );

    function handleSave() {
        if (!draftName.trim()) {
            return;
        }

        const typeIsChanging = draftType !== property.type;
        if (typeIsChanging && hasData) {
            const confirmed = confirm(`Change type to ${draftType}? Every value in this column will be erased.`);
            if (!confirmed) {
                return;
            }
        }

        updateProperty(property.id, boardId, draftName, draftType);
        setIsEditing(false);
    }

    function handleCancel() {
        setDraftName(property.name);
        setDraftType(property.type);
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') handleCancel();
                    }}
                    autoFocus
                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                />
                <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as PropertyType)}
                    className="rounded border border-input bg-background px-2 py-1 text-sm"
                >
                    {PROPERTY_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
                <Button variant="ghost" size="icon" onClick={handleSave}>
                    <Check />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                    <X />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-2">
            <span
                className="cursor-pointer"
                onClick={() => setIsEditing(true)}
            >
                {property.name}
            </span>
            <Button
                variant="ghost"
                size="icon"
                onClick={column.getToggleSortingHandler()}
            >
                {column.getIsSorted() === 'asc' ? <ArrowUp /> : column.getIsSorted() === 'desc' ? <ArrowDown /> : <ArrowUpDown />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    if (confirm(`Delete "${property.name}"? This deletes every value stored under it too.`)) {
                        deleteProperty(property.id, boardId);
                    }
                }}
            >
                <Trash2 />
            </Button>
        </div>
    );
}
