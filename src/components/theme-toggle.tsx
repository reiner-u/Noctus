'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    let icon;
    if (theme === 'dark') {
        icon = <Sun />;
    } else {
        icon = <Moon />;
    }
    return (
        <button
            onClick={() => {
                if (theme === 'dark') {
                    setTheme('light');
                } else {
                    setTheme('dark');
                }
            }}
        >
            {icon}
        </button>
    );
}
