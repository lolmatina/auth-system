export declare class User {
    id: number;
    name: string;
    lastname: string;
    password: string;
    email: string;
    email_verified_at: Date | null;
    email_verification_code: string | null;
    email_verification_expires_at: Date | null;
    document_front_url: string | null;
    document_back_url: string | null;
    document_selfie_url: string | null;
    documents_submitted_at: Date | null;
    documents_verified_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
