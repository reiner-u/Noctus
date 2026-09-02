'use client'

export function NumberCell({
    value,
    onChange,
}: {
    value: number | null;
    onChange: (newValue: number) => void;
}) {
    const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        const parsedValue = parseFloat(event.target.value);
        if (!isNaN(parsedValue)) {
            onChange(parsedValue);
        } else {
            onChange(0); // or handle invalid input as needed
        }
    }
    return <input type="number" defaultValue={value ?? ''} onBlur={onBlur} />;
}