import { createClient } from '@/lib/supabase/server';
import type { Board, Folder, BoardView } from '@/lib/types';

export async function getBoards(): Promise<Board[]> {
    const supabase = await createClient();
    // RLS already scopes this to the current user, no need to filter
    // by owner_id here.
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

export async function getFolders(): Promise<Folder[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching folders:', error.message);
        throw new Error('Failed to fetch folders');
    }

    return data as Folder[];
}

export async function getBoard(boardId: string) {
    const supabase = await createClient();
    // Four separate queries rather than one nested select, simpler to
    // read and to add a fifth to later if needed. Worth revisiting with
    // Supabase's nested select syntax if this ever needs to be one
    // round trip instead of four, not necessary yet.
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
    const { data: propertyOptions, error: propertyOptionsError } = await supabase
        .from('property_options')
        .select('*')
        .in('property_id', properties.map((p) => p.id))
        .order('sort_order', { ascending: true });

    if (propertyOptionsError) {
        console.error('Error fetching property options:', propertyOptionsError.message);
        throw new Error('Failed to fetch property options');
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

    return { board, properties, propertyOptions, entries, cellValues } as BoardView;
}