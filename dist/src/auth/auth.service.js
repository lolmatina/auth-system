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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
const bcrypt = require("bcryptjs");
const email_service_1 = require("../email/email.service");
const telegram_service_1 = require("../telegram/telegram.service");
let AuthService = class AuthService {
    constructor(userService, jwtService, emailService, telegramService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.telegramService = telegramService;
    }
    async validateUser(email, password) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const { password: _, ...result } = user;
        return result;
    }
    async login(authDto) {
        const user = await this.validateUser(authDto.email, authDto.password);
        const token = await this.generateToken(user);
        return {
            user: {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                email_verified_at: user.email_verified_at,
                documents_submitted_at: user.documents_submitted_at,
                documents_verified_at: user.documents_verified_at,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
            token,
        };
    }
    async generateToken(user) {
        const payload = { email: user.email, sub: user.id };
        console.log('🔑 [BACKEND] Generating JWT token with secret:', process.env.JWT_SECRET || 'some-jwt-secret');
        console.log('📋 [BACKEND] JWT payload:', payload);
        const token = this.jwtService.sign(payload);
        console.log('🎫 [BACKEND] Generated token:', token.substring(0, 20) + '...');
        return token;
    }
    async initiateEmailVerification(user) {
        const code = await this.emailService.generateSixDigitCode();
        const ttlMinutes = 10;
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        await this.userService.setEmailVerificationCode(user.id, code, expiresAt);
        await this.emailService.sendVerificationEmail(user.email, code, ttlMinutes);
    }
    async resendEmailVerification(email) {
        const user = await this.userService.findByEmail(email);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.email_verified_at)
            throw new common_1.BadRequestException('Email already verified');
        await this.initiateEmailVerification(user);
    }
    async verifyEmailCode(email, code) {
        const ok = await this.userService.verifyEmailCode(email, code);
        if (!ok)
            throw new common_1.BadRequestException('Invalid or expired code');
    }
    async submitDocuments(params) {
        const user = await this.userService.findByEmail(params.email);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.userService.update(user.id, {
            document_front_url: params.frontPath,
            document_back_url: params.backPath,
            document_selfie_url: params.selfiePath,
            documents_submitted_at: new Date(),
        });
        await this.telegramService.sendDocumentSubmission({
            email: user.email,
            name: `${user.name} ${user.lastname}`,
            frontPath: params.frontPath,
            backPath: params.backPath,
            selfiePath: params.selfiePath,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        email_service_1.EmailService,
        telegram_service_1.TelegramService])
], AuthService);
//# sourceMappingURL=auth.service.js.map