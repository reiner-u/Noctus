'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PropertyType } from '@/lib/types';
import { redirect } from 'next/navigation';

export async function createBoard() {
    const supabase = await createClient();

    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;

    const { error } = await supabase.from('boards').insert({
        title: 'Untitled board',
        owner_id: userId,
    });

    if (error) {
        throw new Error(`Failed to create board: ${error.message}`);
    }

    revalidatePath('/', 'layout');
}


export async function addProperty(boardId: string, name: string, type: PropertyType) {
    const supabase = await createClient();

    const { data: existingProperties, error: fetchError } = await supabase
        .from('properties')
        .select('sort_order')
        .eq('board_id', boardId);
    if (fetchError) {
        throw new Error(`Failed to fetch existing properties: ${fetchError.message}`);
    }

    const sort_order = existingProperties && existingProperties.length > 0
        ? Math.max(...existingProperties.map((p) => p.sort_order)) + 1
        : 0;

    const { error: insertError } = await supabase.from('properties').insert({
        board_id: boardId,
        name,
        type,
        sort_order,
    });
    if (insertError) {
        throw new Error(`Failed to add property: ${insertError.message}`);
    }

    revalidatePath(`/board/${boardId}`);
}

export async function addEntry(boardId: string) {
    const supabase = await createClient();

    const { data: existingEntries, error: fetchError } = await supabase
        .from('entries')
        .select('id, sort_order')
        .eq('board_id', boardId);
    if (fetchError) {
        throw new Error(`Failed to fetch existing entries: ${fetchError.message}`);
    }

    const sort_order = existingEntries && existingEntries.length > 0
        ? Math.max(...existingEntries.map((e) => e.sort_order)) + 1
        : 0;

    const { error: insertError } = await supabase.from('entries').insert({
        board_id: boardId,
        sort_order,
    });
    if (insertError) {
        throw new Error(`Failed to add entry: ${insertError.message}`);
    }

    revalidatePath(`/board/${boardId}`);
}

export async function updateCellValue(
    boardId: string,
    entryId: string,
    propertyId: string,
    type: PropertyType,
    value: string | number | Date | boolean | null
) {
    const supabase = await createClient();

    // TODO: build the object to write. entry_id and property_id
    // always go in, plus exactly ONE of value_text / value_number /
    // value_date / value_boolean depending on `type`, the rest stay
    // out of the object entirely. A switch on `type` is the natural
    // shape, same as the switch already in board-table.tsx's cell
    // renderer.
    const cellValueData: any = {
        entry_id: entryId,
        property_id: propertyId,
    };
    switch (type) {
        case 'text':
            cellValueData.value_text = value as string | null;
            break;
        case 'number':
            cellValueData.value_number = value as number | null;
            break;  
        case 'date':
            cellValueData.value_date = value as Date | null;
            break;
        case 'boolean':
            cellValueData.value_boolean = value as boolean | null;
            break;
    }
    // TODO: cell_values has a unique constraint on (entry_id,
    // property_id), so this needs .upsert(), not .insert(). Editing
    // an existing cell a second time would otherwise fail instead of
    // updating it. Look up how to pass onConflict so Supabase knows
    // which columns define "the same row".
    const { error: upsertError } = await supabase
        .from('cell_values')
        .upsert(cellValueData, { onConflict: 'entry_id,property_id' });
    if (upsertError) {
        throw new Error(`Failed to update cell value: ${upsertError.message}`);
    }
    // TODO: this function only has entryId/propertyId, not boardId,
    // but revalidatePath needs a board path. Worth deciding: pass
    // boardId in as an extra argument (simplest, board-table.tsx
    // already knows it), or look it up via a join through entries.
    revalidatePath(`/board/${boardId}`);
}

export async function deleteBoard(boardId: string) {
    const supabase = await createClient();

    // TODO: await a delete from boards where id = boardId. Properties,
    // entries, and cell_values all reference boards with "on delete
    // cascade", so deleting the board alone cleans up everything
    // under it too, no need to delete those separately first.
    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) {
        throw new Error(`Failed to delete board: ${error.message}`);
    }
    // TODO: revalidatePath('/', 'layout') this time, not a specific
    // board page. Deleting a board changes the sidebar's own list,
    // and the board's page won't exist to revalidate anymore anyway.
    revalidatePath('/', 'layout');
    // TODO: think about redirect() too. If I delete the board I'm
    // currently looking at, I'd otherwise be left on a page for
    // something that no longer exists.
    redirect ('/');  
}

export async function deleteProperty(propertyId: string, boardId: string) {
    const supabase = await createClient();

    // TODO: await a delete from properties where id = propertyId.
    // cell_values referencing it cascade-delete too, same reasoning
    // as deleteBoard.
    const { error } = await supabase.from('properties').delete().eq('id', propertyId);
    if (error) {
        throw new Error(`Failed to delete property: ${error.message}`);
    }

    // TODO: revalidatePath(`/board/${boardId}`), same as addProperty.
    revalidatePath(`/board/${boardId}`);
}

export async function deleteEntry(entryId: string, boardId: string) {
    const supabase = await createClient();

    // TODO: same shape as deleteProperty. Delete from entries where
    // id = entryId, cell_values cascade-delete with it.
    const { error } = await supabase.from('entries').delete().eq('id', entryId);
    if (error) {
        throw new Error(`Failed to delete entry: ${error.message}`);
    }
    // TODO: revalidatePath(`/board/${boardId}`).
    revalidatePath(`/board/${boardId}`);
}

