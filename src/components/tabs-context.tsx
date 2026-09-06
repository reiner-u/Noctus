'use client'

import { createContext, useContext, useState } from 'react';

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

    // TODO: this resets to empty on every full page reload, since it's
    // just useState with nothing backing it. To survive a refresh,
    // persist to localStorage: read it once when the provider first
    // mounts (a useEffect with an empty dependency array), and write to
    // it again inside openTab/closeTab whenever the list changes. Guard
    // against running this on the server, localStorage doesn't exist
    // there, and reading it during the initial render (rather than in
    // useEffect) causes a hydration mismatch between server and client.

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
