'use client'

import type { PropertyOption } from '@/lib/types';
import { getOptionColor } from '@/lib/option-colors';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface SelectCellProps {
    value: string | null;
    options: PropertyOption[];
    onChange: (newValue: string | null) => void;
}

// Radix's Select doesn't allow an empty string as an item value (it's
// reserved internally for "nothing selected"), so a sentinel string
// stands in for "no option chosen" and gets translated back to null
// on the way out.
const NONE = '__none__';

export function SelectCell({ value, options, onChange }: SelectCellProps) {
    return (
        <Select
            value={value ?? NONE}
            onValueChange={(newValue) => onChange(newValue === NONE ? null : newValue)}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="(none)" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={NONE}>
                    <span className="text-muted-foreground">(none)</span>
                </SelectItem>
                {options.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                        <span
                            className="inline-block size-2 rounded-full"
                            style={{ backgroundColor: getOptionColor(opt.color) }}
                        />
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
