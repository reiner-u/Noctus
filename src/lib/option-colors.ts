// The theme's own six accent colors (see globals.css), reused here so
// select options stay on-palette instead of introducing arbitrary
// colors, and automatically adapt between Light Owl and Night Owl
// since these are CSS variables, not fixed hex values.
export const OPTION_COLORS = [
    { name: 'blue', value: 'var(--accent-blue)' },
    { name: 'green', value: 'var(--accent-green)' },
    { name: 'gold', value: 'var(--accent-gold)' },
    { name: 'red', value: 'var(--accent-red)' },
    { name: 'purple', value: 'var(--accent-purple)' },
    { name: 'cyan', value: 'var(--accent-cyan)' },
] as const;

export function getOptionColor(name: string | null): string {
    const found = OPTION_COLORS.find((c) => c.name === name);
    return found ? found.value : 'var(--muted-foreground)';
}

export function nextOptionColor(existingCount: number): string {
    return OPTION_COLORS[existingCount % OPTION_COLORS.length].name;
}
