export interface Resource {
    id: number;
    name: string;
    description: string;
    visible: boolean;
    file_id?: number;
    filename?: string;
}

export interface Subprocessor {
    id: number;
    name: string;
    purpose: string;
    location: string;
    url: string;
}