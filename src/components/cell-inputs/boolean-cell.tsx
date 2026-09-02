'use client'

export function BooleanCell({
    value,
    onChange,
}: {
    value: boolean | null;
    onChange: (newValue: boolean) => void;
}) {
    return <input type="checkbox" defaultChecked={value ?? false} onChange={(e) => onChange(e.target.checked)} />;
}