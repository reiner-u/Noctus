'use client'

import { useState, useRef } from 'react';
import type { Board } from '@/lib/types';
import { updateBoard } from '@/lib/actions/boards';

interface BoardHeaderProps {
    board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [draftTitle, setDraftTitle] = useState(board.title);
    const [draftDescription, setDraftDescription] = useState(board.description ?? '');
    // Escape sets these before blur has a chance to fire, so blur's save
    // logic can check "was this just cancelled?" and skip itself instead
    // of re-saving right after a cancel.
    const cancelledTitleRef = useRef(false);
    const cancelledDescriptionRef = useRef(false);

    function handleSaveTitle() {
        setIsEditingTitle(false);
        if (!draftTitle.trim()) {
            setDraftTitle(board.title);
            return;
        }
        if (draftTitle === board.title) return;
        updateBoard(board.id, draftTitle, board.description);
    }

    function handleCancelTitle() {
        cancelledTitleRef.current = true;
        setDraftTitle(board.title);
        setIsEditingTitle(false);
    }

    function handleSaveDescription() {
        setIsEditingDescription(false);
        const normalized = draftDescription.trim() || null;
        if (normalized === (board.description ?? null)) return;
        updateBoard(board.id, board.title, normalized);
    }

    function handleCancelDescription() {
        cancelledDescriptionRef.current = true;
        setDraftDescription(board.description ?? '');
        setIsEditingDescription(false);
    }
    return (
        <div className="group mb-6 flex flex-col gap-1">
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                                handleCancelTitle();
                            }
                        }}
                        onBlur={() => {
                            if (cancelledTitleRef.current) {
                                cancelledTitleRef.current = false;
                                return;
                            }
                            handleSaveTitle();
                        }}
                        autoFocus
                        className="w-full bg-transparent text-2xl font-bold outline-none"
                    />
                ) : (
                    <h1
                        className="cursor-pointer text-2xl font-bold"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        {board.title}
                    </h1>
                )}

                {isEditingDescription ? (
                    <input
                        type="text"
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                                handleCancelDescription();
                            }
                        }}
                        onBlur={() => {
                            if (cancelledDescriptionRef.current) {
                                cancelledDescriptionRef.current = false;
                                return;
                            }
                            handleSaveDescription();
                        }}
                        autoFocus
                        placeholder="Add description..."
                        className="w-full bg-transparent text-sm text-muted-foreground outline-none"
                    />
                ) : (
                    <span
                        className={`cursor-pointer text-sm text-muted-foreground 
                        ${board.description ? '' : 'opacity-0 transition-opacity group-hover:opacity-100'}`}
                        onClick={() => setIsEditingDescription(true)}
                    >
                        {board.description || 'Add description...'}
                    </span>
                )}
            </div>
        );
}
