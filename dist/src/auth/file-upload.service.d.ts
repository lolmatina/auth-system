import { SupabaseService } from '../database/supabase.service';
declare global {
    namespace Express {
        namespace Multer {
            interface File {
                buffer: Buffer;
            }
        }
    }
}
export declare class FileUploadService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    uploadDocuments(email: string, files: {
        front: Express.Multer.File;
        back: Express.Multer.File;
        selfie: Express.Multer.File;
    }): Promise<{
        frontUrl: string;
        backUrl: string;
        selfieUrl: string;
    }>;
    deleteUserDocuments(email: string, documentUrls: {
        front?: string;
        back?: string;
        selfie?: string;
    }): Promise<void>;
    private extractPathFromUrl;
}
