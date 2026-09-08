'use client'

import { useState, useRef } from 'react';
import type { Property, PropertyOption, CellValue, PropertyType } from '@/lib/types';
import { updateProperty, deleteProperty, addPropertyOption, deletePropertyOption } from '@/lib/actions/boards';
import { Button } from '@/components/ui/button';
import { Trash2, Check, X } from 'lucide-react';
import { getOptionColor } from '@/lib/option-colors';

const PROPERTY_TYPES: PropertyType[] = ['text', 'number', 'date', 'boolean', 'select', 'grade'];

interface PropertyHeaderProps {
    property: Property;
    boardId: string;
    cellValues: CellValue[];
    propertyOptions: PropertyOption[];
}

export function PropertyHeader({ property, boardId, cellValues, propertyOptions }: PropertyHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(property.name);
    const [draftType, setDraftType] = useState<PropertyType>(property.type);
    const [newOptionLabel, setNewOptionLabel] = useState('');
    // Escape sets this before blur has a chance to fire, so the
    // container's onBlur can check "was this just cancelled?" and skip
    // saving instead of undoing the cancel right after it happens, same
    // pattern BoardHeader uses for its title/description fields.
    const cancelledRef = useRef(false);
    // window.alert() steals focus when it opens, which fires a native
    // blur on whatever was focused, with relatedTarget null (focus went
    // to the browser's dialog, not another element in the container).
    // Without this guard, that blur reads as "clicked away", re-runs
    // handleSave, which fails again, alerts again, blurs again. This
    // blocks the container's onBlur from starting a new save while
    // one's already in flight, regardless of what triggered the blur.
    const isBusyRef = useRef(false);

    // This property's own options, out of the board-wide list passed
    // down (same "filter the shared array by this property's id"
    // pattern cellValues already uses elsewhere).
    const thisPropertyOptions = propertyOptions.filter((opt) => opt.property_id === property.id);

    async function handleAddOption() {
        if (!newOptionLabel.trim()) {
            return;
        }
        isBusyRef.current = true;
        try {
            await addPropertyOption(property.id, boardId, newOptionLabel.trim());
            setNewOptionLabel('');
        } catch (error) {
            // Leave whatever was typed in place on failure, same
            // reasoning as handleSave below, don't throw away input
            // over a failed save.
            alert(`Couldn't add option: ${error instanceof Error ? error.message : 'unknown error'}`);
        } finally {
            isBusyRef.current = false;
        }
    }

    // Whether this column currently holds any data at all, across every
    // typed field, not just the current type's. Used below to decide
    // whether a type change needs a warning first.
    const hasData = cellValues.some(
        (cv) =>
            cv.property_id === property.id &&
            (cv.value_text !== null || cv.value_number !== null || cv.value_date !== null || cv.value_boolean !== null || cv.value_option_id !== null || cv.value_grade !== null || cv.value_weight !== null)
    );

    async function handleSave() {
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

        try {
            isBusyRef.current = true;
            await updateProperty(property.id, boardId, draftName, draftType);
            setIsEditing(false);
        } catch (error) {
            // Stay in edit mode on failure instead of silently reverting,
            // whatever was typed is still worth keeping around while the
            // person figures out what went wrong.
            alert(`Couldn't save: ${error instanceof Error ? error.message : 'unknown error'}`);
        } finally {
            isBusyRef.current = false;
        }
    }

    function handleCancel() {
        cancelledRef.current = true;
        setDraftName(property.name);
        setDraftType(property.type);
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <div
                className="flex flex-col gap-2"
                onBlur={(e) => {
                    // A save or add-option attempt already in flight,
                    // possibly the very alert() that's about to fire is
                    // what triggered this blur, don't start another one.
                    if (isBusyRef.current) {
                        return;
                    }
                    // If focus is moving to something still inside this
                    // edit UI (the type select, Save/Cancel, the
                    // add-option input), that's not "clicking away",
                    // just moving between controls in the same session.
                    if (e.currentTarget.contains(e.relatedTarget as Node)) {
                        return;
                    }
                    if (cancelledRef.current) {
                        cancelledRef.current = false;
                        return;
                    }
                    handleSave();
                }}
            >
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
                        className="w-full min-w-24 rounded border border-input bg-background px-2 py-1 text-sm"
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
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={handleSave}>
                        <Check />
                    </Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={handleCancel}>
                        <X />
                    </Button>
                </div>
                {draftType === 'select' && (
                    <div className="flex flex-col gap-1 pl-1">
                        {thisPropertyOptions.map((opt) => (
                            <div key={opt.id} className="flex items-center gap-2">
                                <span
                                    className="inline-block size-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: getOptionColor(opt.color) }}
                                />
                                <span>{opt.label}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={async () => {
                                        isBusyRef.current = true;
                                        try {
                                            await deletePropertyOption(opt.id, boardId);
                                        } catch (error) {
                                            alert(`Couldn't delete option: ${error instanceof Error ? error.message : 'unknown error'}`);
                                        } finally {
                                            isBusyRef.current = false;
                                        }
                                    }}
                                >
                                    <X />
                                </Button>
                            </div>
                        ))}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newOptionLabel}
                                onChange={(e) => setNewOptionLabel(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddOption();
                                }}
                                placeholder="New option label"
                                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                            />
                            <Button variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={handleAddOption}>
                                Add
                            </Button>
                        </div>
                    </div>
                )}
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
                onClick={async () => {
                    if (confirm(`Delete "${property.name}"? This deletes every value stored under it too.`)) {
                        try {
                            await deleteProperty(property.id, boardId);
                        } catch (error) {
                            alert(`Couldn't delete: ${error instanceof Error ? error.message : 'unknown error'}`);
                        }
                    }
                }}
            >
                <Trash2 />
            </Button>
        </div>
    );
}
