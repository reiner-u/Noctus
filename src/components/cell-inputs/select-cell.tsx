'use client'

import type { PropertyOption } from '@/lib/types';

interface SelectCellProps {
    value: string | null;
    options: PropertyOption[];
    onChange: (newValue: string | null) => void;
}

export function SelectCell({ value, options, onChange }: SelectCellProps) {
    return (
        <select
            value={value ?? ''}
            onChange={(e) => {
                const newValue = e.target.value;
                onChange(newValue === '' ? null : newValue);
            }}
        >
            <option value="">(none)</option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
