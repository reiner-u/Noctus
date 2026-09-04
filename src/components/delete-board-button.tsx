'use client'

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteBoard } from '@/lib/actions/boards';

export function DeleteBoardButton({ boardId, title }: { boardId: string; title: string }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => {
                if (confirm(`Delete "${title}"? This deletes every property, row, and value on it too.`)) {
                    deleteBoard(boardId);
                }
            }}
        >
            <Trash2 />
        </Button>
    );
}
