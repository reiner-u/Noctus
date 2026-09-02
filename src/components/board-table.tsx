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
    // TODO: build columns from properties instead of hand writing a
    // fixed array. Something like:
    //
    //   const columns = useMemo(() => properties.map(prop => ({
    //     id: prop.id,
    //     header: prop.name,
    //     cell: (info) => {
    //       // look up the cell value for this entry and prop.id
    //       // render TextCell, NumberCell, DateCell, or BooleanCell
    //       // depending on prop.type
    //     },
    //   })), [properties]);
    //
    const columns = useMemo(() => { properties.map((prop) => ({
            id: prop.id,
            header: prop.name,
            cell: (info: any) => {
                const cellValue = cellValues.find((cv) => cv.entry_id === info.row.original.id && cv.property_id === prop.id);
                if (!cellValue) {
                    return null;
                }
                switch (prop.type) {
                    case 'text':
                        return <TextCell value={cellValue.value} />;
                    case 'number':
                        return <NumberCell value={cellValue.value} />;
                    case 'date':
                        return <DateCell value={cellValue.value} />;
                    case 'boolean':
                        return <BooleanCell value={cellValue.value} />;
                    default:
                        return null;
                }
            },
        }));
    }, [properties]);
    // TODO: build data, one object per entry. Build a Map from
    // cellValues keyed by entry_id plus property_id first, so the
    // cell renderer above is an O(1) lookup instead of a .find() scan.
    //
    // TODO: useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })
    // then render a table using flexRender for headers and cells, same
    // shape as any basic TanStack Table example in their docs.
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

    return <table>{/* still need the actual markup here */ table.getHeaderGroups().map((headerGroup) => (
        <thead>
            {headerGroup.headers.map((header) => (
                <th>{flexRender(header.column.columnDef.header, header.getContext())}</th>
            ))}</thead>
    ))}</table>; }