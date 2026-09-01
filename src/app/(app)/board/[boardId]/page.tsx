import { getBoard } from '@/lib/queries/boards';
import { BoardTable } from '@/components/board-table';

export default async function BoardPage({
    params,
}: {
    params: Promise<{ boardId: string }>;
}) {
    const { boardId } = await params;
    // TODO: call getBoard(boardId). Decide what happens if it's not
    // found/not mine, RLS will just return nothing rather than an
    // error, so this needs its own explicit "not found" handling.
    const boardData = await getBoard(boardId);
    // TODO: handle boardData being null/not found (RLS returns nothing,
    // not an error, if it's not your board)
    if (!boardData) {
        return <div>Board not found</div>;
    }
    return <BoardTable properties={boardData.properties} entries={boardData.entries} cellValues={boardData.cellValues} />;
}