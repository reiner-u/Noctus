'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react';

interface OpenTab {
    boardId: string;
    title: string;
}

interface TabsContextValue {
    openTabs: OpenTab[];
    openTab: (boardId: string, title: string) => void;
    closeTab: (boardId: string) => void;
}

// Context exists because the sidebar (which opens tabs when you click a
// board) and the tab bar (which displays and closes them) aren't
// parent/child of each other, they're both children of the same layout.
// Props can't skip sideways between siblings, so a Context that both of
// them can reach into is the standard way to share state across a part
// of the tree like this without threading it through every component
// in between.
const TabsContext = createContext<TabsContextValue | null>(null);

export function TabsProvider({ children }: { children: React.ReactNode }) {
    const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
    // Guards the write-effect below from firing on the very first
    // render, before the read-effect has had a chance to run. Without
    // this, the write-effect would fire immediately with the stale
    // (empty) initial value and overwrite whatever the read-effect just
    // loaded from localStorage, before that update ever reaches state.
    const isFirstRender = useRef(true);

    // Read once on mount. Doesn't run during SSR, useEffect only runs
    // on the client, so this avoids the server/client mismatch that
    // reading localStorage during the initial render would cause.
    useEffect(() => {
        const storedTabs = localStorage.getItem('openTabs');
        if (storedTabs) {
            setOpenTabs(JSON.parse(storedTabs));
        }
    }, []);

    // Write back whenever the tab list actually changes, including the
    // change caused by the read-effect above (harmless, just re-writes
    // what was already there).
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        localStorage.setItem('openTabs', JSON.stringify(openTabs));
    }, [openTabs]);

    function openTab(boardId: string, title: string) {
        setOpenTabs((prev) => {
            if (prev.some((tab) => tab.boardId === boardId)) {
                return prev;
            }
            return [...prev, { boardId, title }];
        });
    }

    function closeTab(boardId: string) {
        setOpenTabs((prev) => prev.filter((tab) => tab.boardId !== boardId));
    }

    return (
        <TabsContext.Provider value={{ openTabs, openTab, closeTab }}>
            {children}
        </TabsContext.Provider>
    );
}

export function useTabs() {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabsProvider');
    }
    return context;
}
