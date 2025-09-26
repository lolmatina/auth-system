import { SupabaseClient } from '@supabase/supabase-js';
export interface User {
    id: number;
    name: string;
    lastname: string;
    email: string;
    password: string;
    email_verified_at: string | null;
    email_verification_code: string | null;
    email_verification_expires_at: string | null;
    document_front_url: string | null;
    document_back_url: string | null;
    document_selfie_url: string | null;
    documents_submitted_at: string | null;
    documents_verified_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface Manager {
    id: number;
    name: string;
    telegram_chat_id: string;
    created_at: string;
    updated_at: string;
}
export declare class SupabaseService {
    private supabase;
    constructor();
    getClient(): SupabaseClient;
    createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserById(id: number): Promise<User | null>;
    updateUser(id: number, updates: Partial<User>): Promise<User>;
    deleteUser(id: number): Promise<void>;
    createManager(managerData: Omit<Manager, 'id' | 'created_at' | 'updated_at'>): Promise<Manager>;
    findManagerByTelegramId(telegramChatId: string): Promise<Manager | null>;
    getAllManagers(): Promise<Manager[]>;
    getUnprocessedUsers(): Promise<User[]>;
    uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string>;
    deleteFile(bucket: string, path: string): Promise<void>;
    getPublicUrl(bucket: string, path: string): string;
}
