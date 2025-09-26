import { SupabaseService, Manager } from '../database/supabase.service';
export declare class ManagerService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    registerManager(chatId: string): Promise<Manager>;
    getAllManagers(): Promise<Manager[]>;
}
