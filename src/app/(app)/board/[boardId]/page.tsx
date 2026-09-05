import { getBoard } from '@/lib/queries/boards';
import { BoardTable } from '@/components/board-table';
import { BoardHeader } from '@/components/board-header';

export default async function BoardPage({
    params,
}: {
    params: Promise<{ boardId: string }>;
}) {
    const { boardId } = await params;
    // TODO: call getBoard(boardId). Still need to decide what to
    // show if it's not found or not mine. RLS just returns nothing
    // instead of an error, so I need my own explicit not-found check.
    const boardData = await getBoard(boardId);
    // TODO: handle boardData being null here too (same RLS not-found
    // case as above).
    if (!boardData) {
        return <div>Board not found</div>;
    }
    return (
        <div className="p-6">
            <BoardHeader board={boardData.board} />
            <BoardTable boardId={boardId} properties={boardData.properties} entries={boardData.entries} cellValues={boardData.cellValues} />
        </div>
    );
}