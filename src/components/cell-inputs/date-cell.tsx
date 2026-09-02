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
    return <input type="date" defaultValue={value?.toISOString().split('T')[0] ?? ''} onBlur={onBlur} />;
}