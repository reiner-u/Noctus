'use client'

export function DateCell({
    value,
    onChange,
}: {
    value: Date | null;
    onChange: (newValue: Date | null) => void;
}) {
    const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        const parsedValue = new Date(event.target.value);
        if (!isNaN(parsedValue.getTime())) {
            onChange(parsedValue);
        } else {
            onChange(null); // or handle invalid input as needed
        }
    }

    return (
        <div className="flex items-center gap-2">
            <input type="date" defaultValue={value?.toISOString().split('T')[0] ?? ''} onBlur={onBlur} />
            {value && <span className="text-xs text-muted-foreground">{formatRelativeDays(value)}</span>}
        </div>
    );
}

function formatRelativeDays(value: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(value);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays > 0) return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
}
