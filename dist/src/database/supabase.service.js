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
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = class SupabaseService {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase URL and Service Role Key must be provided');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('✅ Supabase client initialized');
    }
    getClient() {
        return this.supabase;
    }
    async createUser(userData) {
        const { data, error } = await this.supabase
            .from('users')
            .insert(userData)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
        return data;
    }
    async findUserByEmail(email) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to find user: ${error.message}`);
        }
        return data || null;
    }
    async findUserById(id) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to find user: ${error.message}`);
        }
        return data || null;
    }
    async updateUser(id, updates) {
        const { data, error } = await this.supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
        return data;
    }
    async deleteUser(id) {
        const { error } = await this.supabase
            .from('users')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }
    async createManager(managerData) {
        const { data, error } = await this.supabase
            .from('managers')
            .insert([managerData])
            .select()
            .single();
        if (error) {
            console.error('Supabase createManager error:', error);
            throw new common_1.InternalServerErrorException(error.message);
        }
        return data;
    }
    async findManagerByTelegramId(telegramChatId) {
        const { data, error } = await this.supabase
            .from('managers')
            .select('*')
            .eq('telegram_chat_id', telegramChatId)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error('Supabase findManagerByTelegramId error:', error);
            throw new common_1.InternalServerErrorException(error.message);
        }
        return data;
    }
    async getAllManagers() {
        const { data, error } = await this.supabase
            .from('managers')
            .select('*');
        if (error) {
            console.error('Supabase getAllManagers error:', error);
            throw new common_1.InternalServerErrorException(error.message);
        }
        return data;
    }
    async getUnprocessedUsers() {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .not('documents_submitted_at', 'is', null)
            .is('documents_verified_at', null)
            .order('documents_submitted_at', { ascending: true });
        if (error) {
            console.error('Supabase getUnprocessedUsers error:', error);
            throw new common_1.InternalServerErrorException(error.message);
        }
        return data;
    }
    async uploadFile(bucket, path, file, contentType) {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(path, file, {
            contentType,
            upsert: true
        });
        if (error) {
            throw new Error(`Failed to upload file: ${error.message}`);
        }
        const { data: publicUrlData } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);
        return publicUrlData.publicUrl;
    }
    async deleteFile(bucket, path) {
        const { error } = await this.supabase.storage
            .from(bucket)
            .remove([path]);
        if (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
    getPublicUrl(bucket, path) {
        const { data } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map