'use client'

interface GradeCellProps {
    value: { grade: number | null; weight: number | null };
    onChange: (newValue: { grade: number | null; weight: number | null }) => void;
}

export function GradeCell({ value, onChange }: GradeCellProps) {
    // Weight is genuinely optional, not just "optional in the UI but
    // required to see anything useful". Grade alone is a complete,
    // meaningful value on its own (just the score), the weighted
    // contribution is an extra that only appears once both numbers
    // exist, never a blocker on entering the grade itself.
    const contribution = value.grade !== null && value.weight !== null
        ? (value.grade * value.weight) / 100
        : null;

    function handleGradeBlur(e: React.FocusEvent<HTMLInputElement>) {
        const raw = e.target.value;
        const grade = raw === '' ? null : Number(raw);
        onChange({ grade: isNaN(grade as number) ? null : grade, weight: value.weight });
    }

    function handleWeightBlur(e: React.FocusEvent<HTMLInputElement>) {
        const raw = e.target.value;
        const weight = raw === '' ? null : Number(raw);
        onChange({ grade: value.grade, weight: isNaN(weight as number) ? null : weight });
    }

    return (
        <div className="flex items-center gap-1.5">
            <input
                type="number"
                defaultValue={value.grade ?? ''}
                onBlur={handleGradeBlur}
                placeholder="Grade %"
                className="w-20 rounded border border-input bg-background px-1.5 py-0.5 text-sm"
            />
            <span className="text-muted-foreground">/</span>
            <input
                type="number"
                defaultValue={value.weight ?? ''}
                onBlur={handleWeightBlur}
                placeholder="Weight % (optional)"
                className="w-28 rounded border border-input bg-background px-1.5 py-0.5 text-sm"
            />
            {contribution !== null && (
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                    = {contribution.toFixed(1)} pts
                </span>
            )}
        </div>
    );
}
