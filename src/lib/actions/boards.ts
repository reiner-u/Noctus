'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

// TODO (later): addProperty(), updateCellValue(), deleteBoard(), etc.
// Same overall shape each time. Do one at a time and test each
// through the real UI before moving to the next.
export async function addProperty(boardId: string, name: string, type: string) {
    const supabase = await createClient();  }

