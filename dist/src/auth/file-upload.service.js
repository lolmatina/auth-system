"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../database/supabase.service");
const path = require("path");
let FileUploadService = class FileUploadService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async uploadDocuments(email, files) {
        const timestamp = Date.now();
        const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
        const frontPath = `documents/${sanitizedEmail}/${timestamp}_front${path.extname(files.front.originalname)}`;
        const backPath = `documents/${sanitizedEmail}/${timestamp}_back${path.extname(files.back.originalname)}`;
        const selfiePath = `documents/${sanitizedEmail}/${timestamp}_selfie${path.extname(files.selfie.originalname)}`;
        try {
            const [frontUrl, backUrl, selfieUrl] = await Promise.all([
                this.supabaseService.uploadFile('documents', frontPath, files.front.buffer, files.front.mimetype),
                this.supabaseService.uploadFile('documents', backPath, files.back.buffer, files.back.mimetype),
                this.supabaseService.uploadFile('documents', selfiePath, files.selfie.buffer, files.selfie.mimetype),
            ]);
            return {
                frontUrl,
                backUrl,
                selfieUrl,
            };
        }
        catch (error) {
            console.error('Error uploading documents:', error);
            throw new Error('Failed to upload documents');
        }
    }
    async deleteUserDocuments(email, documentUrls) {
        try {
            const deletePromises = [];
            if (documentUrls.front) {
                const frontPath = this.extractPathFromUrl(documentUrls.front);
                deletePromises.push(this.supabaseService.deleteFile('documents', frontPath));
            }
            if (documentUrls.back) {
                const backPath = this.extractPathFromUrl(documentUrls.back);
                deletePromises.push(this.supabaseService.deleteFile('documents', backPath));
            }
            if (documentUrls.selfie) {
                const selfiePath = this.extractPathFromUrl(documentUrls.selfie);
                deletePromises.push(this.supabaseService.deleteFile('documents', selfiePath));
            }
            await Promise.all(deletePromises);
        }
        catch (error) {
            console.error('Error deleting documents:', error);
        }
    }
    extractPathFromUrl(url) {
        const urlParts = url.split('/storage/v1/object/public/documents/');
        return urlParts[1] || '';
    }
};
exports.FileUploadService = FileUploadService;
exports.FileUploadService = FileUploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], FileUploadService);
//# sourceMappingURL=file-upload.service.js.map