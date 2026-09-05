'use client'

import { useMemo, useState, useCallback, useRef, Fragment } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
}from '@tanstack/react-table';
import type { Property, PropertyOption, BoardEntry, CellValue } from '@/lib/types';
import { TextCell } from '@/components/cell-inputs/text-cell';
import { NumberCell } from '@/components/cell-inputs/number-cell';
import { DateCell } from '@/components/cell-inputs/date-cell';
import { BooleanCell } from '@/components/cell-inputs/boolean-cell';
import { SelectCell } from '@/components/cell-inputs/select-cell';
import { addEntry, addProperty, updateCellValue, deleteEntry } from '@/lib/actions/boards';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { PropertyHeader } from '@/components/property-header';
import { EntryPanel } from '@/components/entry-panel';
import { BoardToolbar } from '@/components/board-toolbar';

interface BoardTableProps {
    boardId: string;
    boardTitle: string;
    properties: Property[];
    propertyOptions: PropertyOption[];
    entries: BoardEntry[];
    cellValues: CellValue[];
}

export function BoardTable({ boardId, boardTitle, properties, propertyOptions, entries, cellValues }: BoardTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    // Which entry (if any) the side panel is showing, null means closed.
    const [openEntryId, setOpenEntryId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    async function handleAddEntry() {
        const newEntryId = await addEntry(boardId);
        setOpenEntryId(newEntryId);
    }

    // PropertyHeader holds its own local edit-mode state (isEditing,
    // draftType, etc). If the function passed as `header` to TanStack
    // changes identity on every render, React treats it as a different
    // component type at that position and remounts it instead of just
    // updating its props, wiping whatever was mid-edit. Since `columns`
    // below recomputes on ANY board data change (not just changes to
    // this specific property, revalidatePath refetches everything), an
    // inline closure there would get a new identity constantly. This
    // ref + empty-deps useCallback keeps the same function reference
    // forever, while still reading fresh data on every call.
    const latestDataRef = useRef({ properties, cellValues, propertyOptions, boardId });
    latestDataRef.current = { properties, cellValues, propertyOptions, boardId };

    const renderPropertyHeader = useCallback((headerContext: any) => {
        const { properties, cellValues, propertyOptions, boardId } = latestDataRef.current;
        const prop = properties.find((p) => p.id === headerContext.column.id);
        if (!prop) return null;
        return <PropertyHeader property={prop} boardId={boardId} cellValues={cellValues} propertyOptions={propertyOptions} column={headerContext.column} />;
    }, []);

    // Same identity-stability reasoning as renderPropertyHeader above,
    // just for the actual data cells. TextCell/NumberCell/etc. are
    // uncontrolled (defaultValue, no local draft state), so remounting
    // them isn't as visibly broken as PropertyHeader was, but it's the
    // same underlying issue, worth closing off entirely rather than
    // leaving a milder version of it in place.
    const renderCell = useCallback((info: any) => {
        const { properties, cellValues, propertyOptions, boardId } = latestDataRef.current;
        const prop = properties.find((p) => p.id === info.column.id);
        if (!prop) return null;
        const cellValue = cellValues.find((cv) => cv.entry_id === info.row.original.id && cv.property_id === prop.id) ?? {
            value_text: null,
            value_number: null,
            value_date: null,
            value_boolean: null,
            value_option_id: null,
        };
        switch (prop.type) {
            case 'text':
                return (
                    <TextCell
                        value={cellValue.value_text}
                        onChange={(newValue) => {
                            updateCellValue(boardId, info.row.original.id, prop.id, 'text', newValue);
                        }}
                    />
                );
            case 'number':
                return (
                    <NumberCell
                        value={cellValue.value_number}
                        onChange={(newValue) => {
                            updateCellValue(boardId, info.row.original.id, prop.id, 'number', newValue);
                        }}
                    />
                );
            case 'date':
                return (
                    <DateCell
                        value={cellValue.value_date ? new Date(cellValue.value_date) : null}
                        onChange={(newValue) => {
                            updateCellValue(boardId, info.row.original.id, prop.id, 'date', newValue);
                        }}
                    />
                );
            case 'boolean':
                return (
                    <BooleanCell
                        value={cellValue.value_boolean}
                        onChange={(newValue) => {
                            updateCellValue(boardId, info.row.original.id, prop.id, 'boolean', newValue);
                        }}
                    />
                );
            case 'select':
                return (
                    <SelectCell
                        value={cellValue.value_option_id}
                        options={propertyOptions.filter((opt) => opt.property_id === prop.id)}
                        onChange={(newValue) => {
                            updateCellValue(boardId, info.row.original.id, prop.id, 'select', newValue);
                        }}
                    />
                );
            default:
                return null;
        }
    }, []);

    const columns = useMemo(() => properties.map((prop) => ({
            id: prop.id,
            // Lets the filter row (further down) read a column's property
            // type via header.column.columnDef.meta?.type, without having
            // to search the properties array by id every time. `options`
            // does the same for select columns, the filter row needs the
            // actual option list to populate its dropdown.
            meta: { type: prop.type, options: propertyOptions.filter((opt) => opt.property_id === prop.id) },
            // Sorting and filtering both compare whatever the accessor
            // returns, not what `cell` renders (cell is just JSX, TanStack
            // can't read a value out of it). This pulls the raw typed
            // value straight out of cellValues, same lookup `cell` below
            // already does, just returning the value instead of a
            // component.
            accessorFn: (entry: any) => {
                const cv = cellValues.find((cv) => cv.entry_id === entry.id && cv.property_id === prop.id);
                if (!cv) return null;
                switch (prop.type) {
                    case 'text': return cv.value_text;
                    case 'number': return cv.value_number;
                    case 'date': return cv.value_date;
                    case 'boolean': return cv.value_boolean;
                    case 'select': return cv.value_option_id;
                    default: return null;
                }
            },
            // One filterFn per type, matching the filter control in the
            // filter row below. 'text' uses TanStack's built-in text
            // search. 'boolean' and 'select' both use exact-match
            // ('equals'), their filter controls are single-choice
            // dropdowns, not free text, so an exact comparison against
            // the selected value (true/false, or an option id) is what's
            // actually wanted, not a substring search.
            // 'number' expects a [min, max] tuple as its filter value.
            // 'date' needs a custom function since TanStack has no
            // built-in date-range filter, values here are ISO strings
            // (that's what Supabase returns for a timestamptz column),
            // so they're converted to timestamps before comparing.
            filterFn: (prop.type === 'number'
                ? 'inNumberRange'
                : prop.type === 'boolean' || prop.type === 'select'
                    ? 'equals'
                    : prop.type === 'date'
                        ? (row: any, columnId: string, filterValue: [string, string]) => {
                            if (!filterValue || (!filterValue[0] && !filterValue[1])) return true;
                            const raw = row.getValue(columnId);
                            if (!raw) return false;
                            const time = new Date(raw).getTime();
                            const [start, end] = filterValue;
                            if (start && time < new Date(start).getTime()) return false;
                            if (end && time > new Date(end).getTime()) return false;
                            return true;
                        }
                        : 'includesString') as any,
            // header now receives TanStack's real context (headerContext)
            // instead of ignoring it, since PropertyHeader needs
            // headerContext.column to wire up the sort icon,
            // column.getToggleSortingHandler() and column.getIsSorted().
            // renderPropertyHeader (defined above) has a stable identity
            // across renders, unlike an inline closure here would, see
            // its own comment for why that matters.
            header: renderPropertyHeader,
            cell: renderCell,
        })), [properties, propertyOptions, renderPropertyHeader, renderCell]);

    const data = useMemo(() => {
        const entryMap = new Map<string, any>();
        entries.forEach((entry) => {
            entryMap.set(entry.id, { ...entry, id: entry.id });
        });
        return Array.from(entryMap.values());
    }, [entries]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
    });

    return ( 
        <>
        <BoardToolbar
            boardId={boardId}
            boardTitle={boardTitle}
            onAddProperty={() => addProperty(boardId, 'New property', 'text')}
            onAddEntry={handleAddEntry}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((prev) => !prev)}
        />
        <table className="border-collapse">
            <thead>
            {table.getHeaderGroups().map((headerGroup) => (
                <Fragment key={headerGroup.id}>
                <tr>
                {headerGroup.headers.map((header) => (
                    <th key={header.id} className="border-b border-r px-4 py-2 text-left font-semibold">{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
                </tr>
                {showFilters && (
                <tr>
                {headerGroup.headers.map((header) => {
                    const type = (header.column.columnDef.meta as any)?.type;
                    const filterValue = header.column.getFilterValue();
                    return (
                        <th key={`${header.id}-filter`} className="border-b border-r px-2 py-1">
                            {type === 'text' && (
                                <input
                                    type="text"
                                    placeholder="Filter..."
                                    value={(filterValue as string) ?? ''}
                                    onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                                    className="w-full rounded border border-input bg-background px-1 py-0.5 text-xs"
                                />
                            )}
                            {type === 'number' && (
                                <div className="flex gap-1">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={(filterValue as [number, number])?.[0] ?? ''}
                                        onChange={(e) => {
                                            const [, max] = (filterValue as [number, number]) ?? [undefined, undefined];
                                            header.column.setFilterValue([e.target.value === '' ? undefined : Number(e.target.value), max]);
                                        }}
                                        className="w-1/2 rounded border border-input bg-background px-1 py-0.5 text-xs"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={(filterValue as [number, number])?.[1] ?? ''}
                                        onChange={(e) => {
                                            const [min] = (filterValue as [number, number]) ?? [undefined, undefined];
                                            header.column.setFilterValue([min, e.target.value === '' ? undefined : Number(e.target.value)]);
                                        }}
                                        className="w-1/2 rounded border border-input bg-background px-1 py-0.5 text-xs"
                                    />
                                </div>
                            )}
                            {type === 'date' && (
                                <div className="flex gap-1">
                                    <input
                                        type="date"
                                        value={(filterValue as [string, string])?.[0] ?? ''}
                                        onChange={(e) => {
                                            const [, end] = (filterValue as [string, string]) ?? [undefined, undefined];
                                            header.column.setFilterValue([e.target.value || undefined, end]);
                                        }}
                                        className="w-1/2 rounded border border-input bg-background px-1 py-0.5 text-xs"
                                    />
                                    <input
                                        type="date"
                                        value={(filterValue as [string, string])?.[1] ?? ''}
                                        onChange={(e) => {
                                            const [start] = (filterValue as [string, string]) ?? [undefined, undefined];
                                            header.column.setFilterValue([start, e.target.value || undefined]);
                                        }}
                                        className="w-1/2 rounded border border-input bg-background px-1 py-0.5 text-xs"
                                    />
                                </div>
                            )}
                            {type === 'boolean' && (
                                <select
                                    value={filterValue === undefined ? '' : String(filterValue)}
                                    onChange={(e) => header.column.setFilterValue(e.target.value === '' ? undefined : e.target.value === 'true')}
                                    className="w-full rounded border border-input bg-background px-1 py-0.5 text-xs"
                                >
                                    <option value="">All</option>
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </select>
                            )}
                            {type === 'select' && (
                                <select
                                    value={(filterValue as string) ?? ''}
                                    onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                                    className="w-full rounded border border-input bg-background px-1 py-0.5 text-xs"
                                >
                                    <option value="">All</option>
                                    {((header.column.columnDef.meta as any)?.options ?? []).map((opt: PropertyOption) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </th>
                    );
                })}
                </tr>
                )}
                </Fragment>
            ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="border-b border-r px-4 py-2">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                    <td className="border-b px-2 py-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (confirm('Delete this row? This deletes every value in it too.')) {
                                    deleteEntry(row.original.id, boardId);
                                }
                            }}
                        >
                            <Trash2 />
                        </Button>
                    </td>
                    </tr>
                ))}
            </tbody>
        </table>
        <EntryPanel
            entryId={openEntryId}
            boardId={boardId}
            properties={properties}
            propertyOptions={propertyOptions}
            cellValues={cellValues}
            onOpenChange={(open) => {
                if (!open) setOpenEntryId(null);
            }}
        />
        </>
    );}