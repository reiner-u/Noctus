'use client'

import { useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    type ColumnDef,
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
    const columns = useMemo(() => properties.map((prop) => ({
            id: prop.id,
            // header can be a function too, same as cell below. It's a
            // whole component now (PropertyHeader) rather than inline JSX,
            // since renaming/retyping needs its own local edit-mode state,
            // which a plain arrow function can't hold.
            header: () => (
                <PropertyHeader property={prop} boardId={boardId} cellValues={cellValues} />
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
    });

    return ( 
        <table className="border-collapse">
            <thead>
            {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
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