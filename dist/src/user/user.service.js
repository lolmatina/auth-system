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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../database/supabase.service");
const bcrypt = require("bcryptjs");
let UserService = class UserService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(createUserDto) {
        const existingUser = await this.supabaseService.findUserByEmail(createUserDto.email);
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        return this.supabaseService.createUser({
            ...createUserDto,
            password: hashedPassword,
            email_verified_at: null,
            email_verification_code: null,
            email_verification_expires_at: null,
            document_front_url: null,
            document_back_url: null,
            document_selfie_url: null,
            documents_submitted_at: null,
            documents_verified_at: null,
        });
    }
    async findAll() {
        throw new Error('Method not implemented');
    }
    async findOne(id) {
        if (!id || isNaN(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.supabaseService.findUserById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        return this.supabaseService.findUserByEmail(email);
    }
    async setEmailVerificationCode(userId, code, expiresAt) {
        await this.supabaseService.updateUser(userId, {
            email_verification_code: code,
            email_verification_expires_at: expiresAt.toISOString(),
        });
    }
    async verifyEmailCode(email, code) {
        const user = await this.supabaseService.findUserByEmail(email);
        if (!user || !user.email_verification_code || !user.email_verification_expires_at)
            return false;
        const now = new Date();
        const expiresAt = new Date(user.email_verification_expires_at);
        if (user.email_verification_code !== code)
            return false;
        if (expiresAt < now)
            return false;
        await this.supabaseService.updateUser(user.id, {
            email_verified_at: new Date().toISOString(),
            email_verification_code: null,
            email_verification_expires_at: null,
        });
        return true;
    }
    async update(id, updateUserDto) {
        if (!id || isNaN(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.supabaseService.findUserById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updates = { ...updateUserDto };
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }
        if (updates.email && updates.email !== user.email) {
            const existingUser = await this.supabaseService.findUserByEmail(updates.email);
            if (existingUser) {
                throw new common_1.BadRequestException('User with this email already exists');
            }
        }
        return this.supabaseService.updateUser(id, updates);
    }
    async remove(id) {
        if (!id || isNaN(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.supabaseService.findUserById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.supabaseService.deleteUser(id);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UserService);
//# sourceMappingURL=user.service.js.map