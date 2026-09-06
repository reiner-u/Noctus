'use client'

import { usePathname, useRouter } from 'next/navigation';
import { useTabs } from '@/components/tabs-context';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function TabBar() {
    const { openTabs, closeTab } = useTabs();
    const pathname = usePathname();
    const router = useRouter();

    if (openTabs.length === 0) {
        return null;
    }

    return (
        <div className="flex gap-1 border-b px-2 pt-2">
            {openTabs.map((tab) => {
                const isActive = pathname === `/board/${tab.boardId}`;
                return (
                    <div
                        key={tab.boardId}
                        onClick={() => router.push(`/board/${tab.boardId}`)}
                        className={`flex cursor-pointer items-center gap-2 border-r px-3 py-2 text-sm ${
                            isActive ? 'bg-background font-medium' : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        <span>{tab.title}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                // Stops the click from also bubbling up to
                                // the tab div's onClick above, which would
                                // navigate to the tab being closed instead
                                // of wherever closing it should actually
                                // go.
                                e.stopPropagation();
                                closeTab(tab.boardId);
                                if (isActive) {
                                    const remainingTabs = openTabs.filter((t) => t.boardId !== tab.boardId);
                                    router.push(remainingTabs.length > 0 ? `/board/${remainingTabs[0].boardId}` : '/');
                                }
                            }}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}
