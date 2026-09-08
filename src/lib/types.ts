export type PropertyType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'grade';

export interface Board {
    id: string;
    owner_id: string;
    title: string;
    description: string | null;
    folder_id: string | null;
    created_at: string;
}

export interface Folder {
    id: string;
    owner_id: string;
    name: string;
    sort_order: number;
    created_at: string;
}

export interface Property {
    id: string;
    board_id: string;
    name: string;
    type: PropertyType;
    sort_order: number;
    created_at: string;
}

export interface PropertyOption {
    id: string;
    property_id: string;
    label: string;
    color: string | null;
    sort_order: number;
    created_at: string;
}

export interface BoardEntry {
    id: string;
    board_id: string;
    sort_order: number;
     created_at: string;
}

export interface CellValue {
    id: string;
    entry_id: string;
    property_id: string;
    value_text: string | null;
    value_number: number | null;
    value_date: string | null;
    value_boolean: boolean | null;
    value_option_id: string | null;
    value_grade: number | null;
    value_weight: number | null;
    created_at: string;
}

export interface BoardView {
    board: Board;
    properties: Property[];
    propertyOptions: PropertyOption[];
    entries: BoardEntry[];
    cellValues: CellValue[];
}
