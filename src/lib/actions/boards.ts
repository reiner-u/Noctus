'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PropertyType } from '@/lib/types';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { nextOptionColor } from '@/lib/option-colors';

export async function createBoard(folderId: string | null = null) {
    const supabase = await createClient();

    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;

    const { error } = await supabase.from('boards').insert({
        title: 'Untitled board',
        owner_id: userId,
        folder_id: folderId,
    });

    if (error) {
        throw new Error(`Failed to create board: ${error.message}`);
    }

    revalidatePath('/', 'layout');
}

export async function createMasterScheduleTemplate(folderId: string | null = null) {
    const supabase = await createClient();

    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;

    const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
            title: 'Master Schedule',
            description: 'Assignments, exams, and due dates for the term.',
            owner_id: userId,
            folder_id: folderId,
        })
        .select('id')
        .single();
    if (boardError) {
        throw new Error(`Failed to create template board: ${boardError.message}`);
    }

    const propertyDefs: { name: string; type: PropertyType }[] = [
        { name: 'Name', type: 'text' },
        { name: 'Progress', type: 'select' },
        { name: 'Course', type: 'select' },
        { name: 'Assignment Type', type: 'select' },
        { name: 'Due Date', type: 'date' },
    ];

    const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .insert(
            propertyDefs.map((prop, index) => ({
                board_id: board.id,
                name: prop.name,
                type: prop.type,
                sort_order: index,
            }))
        )
        .select('id, name');
    if (propertiesError) {
        throw new Error(`Failed to create template properties: ${propertiesError.message}`);
    }

    const progressProperty = properties.find((p) => p.name === 'Progress');
    const assignmentTypeProperty = properties.find((p) => p.name === 'Assignment Type');

    const optionInserts: { property_id: string; label: string; sort_order: number; color: string }[] = [];
    ['Not Started', 'In Progress', 'Completed'].forEach((label, index) => {
        if (progressProperty) {
            optionInserts.push({ property_id: progressProperty.id, label, sort_order: index, color: nextOptionColor(index) });
        }
    });
    ['Quiz', 'Exam', 'Assignment', 'Project'].forEach((label, index) => {
        if (assignmentTypeProperty) {
            optionInserts.push({ property_id: assignmentTypeProperty.id, label, sort_order: index, color: nextOptionColor(index) });
        }
    });

    const { error: optionsError } = await supabase.from('property_options').insert(optionInserts);
    if (optionsError) {
        throw new Error(`Failed to create template options: ${optionsError.message}`);
    }

    revalidatePath('/', 'layout');
}

export async function createFolder(name: string) {
    const supabase = await createClient();

    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;

    const { data: existingFolders, error: fetchError } = await supabase
        .from('folders')
        .select('sort_order');
    if (fetchError) {
        throw new Error(`Failed to fetch existing folders: ${fetchError.message}`);
    }

    const sort_order = existingFolders && existingFolders.length > 0
        ? Math.max(...existingFolders.map((f) => f.sort_order)) + 1
        : 0;

    const { error: insertError } = await supabase.from('folders').insert({
        name,
        owner_id: userId,
        sort_order,
    });
    if (insertError) {
        throw new Error(`Failed to create folder: ${insertError.message}`);
    }

    revalidatePath('/', 'layout');
}

export async function renameFolder(folderId: string, name: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('folders').update({ name }).eq('id', folderId);
    if (error) {
        throw new Error(`Failed to rename folder: ${error.message}`);
    }

    revalidatePath('/', 'layout');
}

export async function deleteFolder(folderId: string) {
    const supabase = await createClient();

    // No need to touch boards.folder_id here, the foreign key is
    // `on delete set null`, Postgres handles un-grouping them.
    const { error } = await supabase.from('folders').delete().eq('id', folderId);
    if (error) {
        throw new Error(`Failed to delete folder: ${error.message}`);
    }

    revalidatePath('/', 'layout');
}

export async function moveBoardToFolder(boardId: string, folderId: string | null) {
    const supabase = await createClient();

    const { error } = await supabase.from('boards').update({ folder_id: folderId }).eq('id', boardId);
    if (error) {
        throw new Error(`Failed to move board: ${error.message}`);
    }

    revalidatePath('/', 'layout');
}

export async function addPropertyOption(propertyId: string, boardId: string, label: string) {
    const supabase = await createClient();

    const { data: existingOptions, error: fetchError } = await supabase
        .from('property_options')
        .select('sort_order')
        .eq('property_id', propertyId);
    if (fetchError) {
        throw new Error(`Failed to fetch existing options: ${fetchError.message}`);
    }

    const sort_order = existingOptions && existingOptions.length > 0
        ? Math.max(...existingOptions.map((o) => o.sort_order)) + 1
        : 0;

    const { error: insertError } = await supabase.from('property_options').insert({
        property_id: propertyId,
        label,
        sort_order,
        color: nextOptionColor(existingOptions?.length ?? 0),
    });
    if (insertError) {
        throw new Error(`Failed to add option: ${insertError.message}`);
    }

    revalidatePath(`/board/${boardId}`);
}

export async function deletePropertyOption(optionId: string, boardId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('property_options').delete().eq('id', optionId);
    if (error) {
        throw new Error(`Failed to delete option: ${error.message}`);
    }

    revalidatePath(`/board/${boardId}`);
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

    const { data: newEntry, error: insertError } = await supabase
        .from('entries')
        .insert({
            board_id: boardId,
            sort_order,
        })
        .select('id')
        .single();
    if (insertError) {
        throw new Error(`Failed to add entry: ${insertError.message}`);
    }

    revalidatePath(`/board/${boardId}`);

    return newEntry.id as string;
}

export async function updateCellValue(
    boardId: string,
    entryId: string,
    propertyId: string,
    type: PropertyType,
    value: string | number | Date | boolean | null | { grade: number | null; weight: number | null }
) {
    const supabase = await createClient();

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
        case 'select':
            cellValueData.value_option_id = value as string | null;
            break;
        case 'grade': {
            const gradeValue = value as { grade: number | null; weight: number | null };
            cellValueData.value_grade = gradeValue.grade;
            cellValueData.value_weight = gradeValue.weight;
            break;
        }
    }

    const { error: upsertError } = await supabase
        .from('cell_values')
        .upsert(cellValueData, { onConflict: 'entry_id,property_id' });
    if (upsertError) {
        throw new Error(`Failed to update cell value: ${upsertError.message}`);
    }

    revalidatePath(`/board/${boardId}`);
}

export async function updateBoard(boardId: string, title: string, description: string | null) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('boards')
        .update({ title, description })
        .eq('id', boardId);
    if (error) {
        throw new Error(`Failed to update board: ${error.message}`);
    }

    revalidatePath(`/board/${boardId}`);
}

export async function deleteBoard(boardId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) {
        throw new Error(`Failed to delete board: ${error.message}`);
    }

    revalidatePath('/', 'layout');

    // Only bounce to home if the board being deleted is the one whose
    // page actually submitted this action. Deleting a different board
    // from the sidebar shouldn't kick you off the one you're looking at.
    // The referer header holds the URL of the page the form was on,
    // something like https://noctus.app/board/abc123, so pulling the
    // id out of that and comparing to boardId tells us which case this is.
    const referer = (await headers()).get('referer');
    const viewedBoardId = referer?.match(/\/board\/([^/?#]+)/)?.[1];
    if (viewedBoardId === boardId) {
        redirect('/');
    }
}

export async function updateProperty(propertyId: string, boardId: string, name: string, type: PropertyType) {
    const supabase = await createClient();

    // A pure rename (same type, new name) should never touch cell_values,
    // only an actual type change clears data, checked against what's
    // actually stored server-side rather than trusting the client.
    const { data: currentProperty, error: fetchError } = await supabase
        .from('properties')
        .select('type')
        .eq('id', propertyId)
        .single();
    if (fetchError) {
        throw new Error(`Failed to fetch property: ${fetchError.message}`);
    }

    // Clearing all seven typed columns (not just the old type's) matters:
    // going text -> number -> text later shouldn't resurface leftover
    // value_text data as if it were never gone.
    if (currentProperty.type !== type) {
        const { error: clearError } = await supabase
            .from('cell_values')
            .update({
                value_text: null,
                value_number: null,
                value_date: null,
                value_boolean: null,
                value_option_id: null,
                value_grade: null,
                value_weight: null,
            })
            .eq('property_id', propertyId);
        if (clearError) {
            throw new Error(`Failed to clear cell values: ${clearError.message}`);
        }
    }

    const { error: updateError } = await supabase
        .from('properties')
        .update({
            name,
            type,
        })
        .eq('id', propertyId); 
    if (updateError) {
        throw new Error(`Failed to update property: ${updateError.message}`);
    }
    
    revalidatePath(`/board/${boardId}`);
}

export async function deleteProperty(propertyId: string, boardId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('properties').delete().eq('id', propertyId);
    if (error) {
        throw new Error(`Failed to delete property: ${error.message}`);
    }


    revalidatePath(`/board/${boardId}`);
}

export async function deleteEntry(entryId: string, boardId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('entries').delete().eq('id', entryId);
    if (error) {
        throw new Error(`Failed to delete entry: ${error.message}`);
    }

    revalidatePath(`/board/${boardId}`);
}

