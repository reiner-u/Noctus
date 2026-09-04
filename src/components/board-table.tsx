'use client'

import { useMemo, useState, Fragment } from 'react';
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
import type { Property, BoardEntry, CellValue } from '@/lib/types';
import { TextCell } from '@/components/cell-inputs/text-cell';
import { NumberCell } from '@/components/cell-inputs/number-cell';
import { DateCell } from '@/components/cell-inputs/date-cell';
import { BooleanCell } from '@/components/cell-inputs/boolean-cell';
import { addEntry, addProperty, updateCellValue, deleteEntry } from '@/lib/actions/boards';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { PropertyHeader } from '@/components/property-header';

interface BoardTableProps {
    boardId: string;
    properties: Property[];
    entries: BoardEntry[];
    cellValues: CellValue[];
}

export function BoardTable({ boardId, properties, entries, cellValues }: BoardTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    // TODO: not filled in yet. Same idea as sorting above, just for
    // filters, holds a ColumnFiltersState array (each entry shaped like
    // { id: columnId, value: whateverThatColumn'sFilterFnExpects }),
    // starting empty ([]).
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const columns = useMemo(() => properties.map((prop) => ({
            id: prop.id,
            // Lets the filter row (further down) read a column's property
            // type via header.column.columnDef.meta?.type, without having
            // to search the properties array by id every time.
            meta: { type: prop.type },
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
                    default: return null;
                }
            },
            // One filterFn per type, matching the filter control that'll
            // eventually live in the filter row (still a TODO further
            // down). 'text' and 'boolean' use TanStack's built-ins.
            // 'number' expects a [min, max] tuple as its filter value.
            // 'date' needs a custom function since TanStack has no
            // built-in date-range filter, values here are ISO strings
            // (that's what Supabase returns for a timestamptz column),
            // so they're converted to timestamps before comparing.
            filterFn: (prop.type === 'number'
                ? 'inNumberRange'
                : prop.type === 'boolean'
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
            header: (headerContext: any) => (
                <PropertyHeader property={prop} boardId={boardId} cellValues={cellValues} column={headerContext.column} />
            ),
            cell: (info: any) => {
                const cellValue = cellValues.find((cv) => cv.entry_id === info.row.original.id && cv.property_id === prop.id) ?? {
                    value_text: null,
                    value_number: null,
                    value_date: null,
                    value_boolean: null,
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
                    default:
                        return null;
                }
            },
        })), [properties]);

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
        <table className="border-collapse">
            <thead>
            {table.getHeaderGroups().map((headerGroup) => (
                <Fragment key={headerGroup.id}>
                <tr>
                {headerGroup.headers.map((header) => (
                    <th key={header.id} className="border-b border-r px-4 py-2 text-left font-semibold">{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
                    <th className="border-b px-2 py-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => addProperty(boardId, 'New property', 'text')}
                        >
                            <Plus />
                        </Button>
                    </th>
                </tr>
                <tr>
                {headerGroup.headers.map((header) => {
                    const type = (header.column.columnDef.meta as any)?.type;
                    return (
                        <th key={`${header.id}-filter`} className="border-b border-r px-2 py-1">
                            {/* TODO: filter control based on `type`
                               ('text' | 'number' | 'date' | 'boolean'),
                               reading/writing through
                               header.column.getFilterValue() and
                               header.column.setFilterValue(...).
                               - text: single <input>, setFilterValue(e.target.value)
                               - number: two <input type="number"> (min/max),
                                 setFilterValue([min, max]) as a tuple,
                                 matching the 'inNumberRange' filterFn above
                               - date: two <input type="date"> (start/end),
                                 same [start, end] tuple idea, matching the
                                 custom date filterFn above
                               - boolean: <select> with All/Yes/No,
                                 setFilterValue(undefined | true | false) */}
                        </th>
                    );
                })}
                    <th className="border-b px-2 py-1"></th>
                </tr>
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
                <tr>
                    <td className="px-2 py-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => addEntry(boardId)}
                        >
                            <Plus />
                        </Button>
                    </td>
                </tr>
            </tbody>
        </table>
    );}