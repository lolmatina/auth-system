export declare class EmailService {
    private transporter;
    constructor();
    generateSixDigitCode(): Promise<string>;
    sendVerificationEmail(email: string, code: string, ttlMinutes: number): Promise<void>;
    sendDocumentApprovalEmail(email: string, name: string): Promise<void>;
    sendDocumentDenialEmail(email: string, name: string): Promise<void>;
}
