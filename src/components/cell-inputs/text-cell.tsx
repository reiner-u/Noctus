'use client'

export function TextCell({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (newValue: string) => void;
}) {
    const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        onChange(event.target.value);
    }
    return <input defaultValue={value ?? ''} onBlur={onBlur} />;
}