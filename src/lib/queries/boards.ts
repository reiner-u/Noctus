import { createClient } from '@/lib/supabase/server';
import type { Board, BoardView } from '@/lib/types';

export async function getBoards(): Promise<Board[]> {
    const supabase = await createClient();
    // TODO: select * from boards, order by created_at.
    // RLS already scopes results to the current user — no manual
    // owner_id filter needed in the query itself.
    const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching boards:', error.message);
        throw new Error('Failed to fetch boards');
    }

    return data as Board[];
}

export async function getBoard(boardId: string) {
    const supabase = await createClient();
    // TODO: four queries (or look into Supabase's nested `select`
    // syntax for fetching related tables in one round-trip, worth
    // researching once the simple version works):
    //   1. the board itself, filtered by id
    //   2. its properties, filtered by board_id, ordered by sort_order
    //   3. its entries, filtered by board_id, ordered by sort_order
    //   4. cell_values where entry_id is .in(...) the entry ids from (3)
    // Return all four together — this is what board/[boardId]/page.tsx
    // will pass into <BoardTable>.
    const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

    if (boardError) {
        console.error('Error fetching board:', boardError.message);
        throw new Error('Failed to fetch board');
    }
    const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true });
        
    if (propertiesError) {
        console.error('Error fetching properties:', propertiesError.message);
        throw new Error('Failed to fetch properties');
    }
    const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('*')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true });

    if (entriesError) {
        console.error('Error fetching entries:', entriesError.message);
        throw new Error('Failed to fetch entries');
    }
    const { data: cellValues, error: cellValuesError } = await supabase
        .from('cell_values')
        .select('*')
        .in('entry_id', entries.map((e) => e.id));

    if (cellValuesError) {
        console.error('Error fetching cell values:', cellValuesError.message);
        throw new Error('Failed to fetch cell values');
    }

    return { board, properties, entries, cellValues } as BoardView;
}