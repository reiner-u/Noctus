import { getBoard } from '@/lib/queries/boards';
import { BoardTable } from '@/components/board-table';
import { BoardHeader } from '@/components/board-header';

export default async function BoardPage({
    params,
}: {
    params: Promise<{ boardId: string }>;
}) {
    const { boardId } = await params;
    const boardData = await getBoard(boardId);
    if (!boardData) {
        return <div>Board not found</div>;
    }
    return (
        <div className="p-6">
            <BoardHeader board={boardData.board} />
            <BoardTable boardId={boardId} boardTitle={boardData.board.title} properties={boardData.properties} propertyOptions={boardData.propertyOptions} entries={boardData.entries} cellValues={boardData.cellValues} />
        </div>
    );
}