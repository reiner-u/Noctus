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

interface BoardTableProps {
    properties: Property[];
    entries: BoardEntry[];
    cellValues: CellValue[];
}

export function BoardTable({ properties, entries, cellValues }: BoardTableProps) {
    const columns = useMemo(() => properties.map((prop) => ({
            id: prop.id,
            header: prop.name,
            cell: (info: any) => {
                const cellValue = cellValues.find((cv) => cv.entry_id === info.row.original.id && cv.property_id === prop.id);
                if (!cellValue) {
                    return null;
                }
                switch (prop.type) {
                    case 'text':
                        return (
                            <TextCell
                                value={cellValue.value_text}
                                onChange={(newValue) => {
                                    console.log(`entry ${info.row.original.id}, property ${prop.id} changed to`, newValue);
                                }}
                            />
                        );
                    case 'number':
                        return (
                            <NumberCell
                                value={cellValue.value_number}
                                onChange={(newValue) => {
                                    console.log(`entry ${info.row.original.id}, property ${prop.id} changed to`, newValue);
                                }}
                            />
                        );
                    case 'date':
                        return (
                            <DateCell
                                value={cellValue.value_date ? new Date(cellValue.value_date) : null}
                                onChange={(newValue) => {
                                    console.log(`entry ${info.row.original.id}, property ${prop.id} changed to`, newValue);
                                }}
                            />
                        );
                    case 'boolean':
                        return (
                            <BooleanCell
                                value={cellValue.value_boolean}
                                onChange={(newValue) => {
                                    console.log(`entry ${info.row.original.id}, property ${prop.id} changed to`, newValue);
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
        <table>
            <thead>
            {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                    <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
                </tr>
            ))}
            </thead>
            <tbody>
            {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
                </tr>
            ))}
            </tbody>
        </table>
    );}