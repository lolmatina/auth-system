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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const signup_dto_1 = require("./dto/signup.dto");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const user_service_1 = require("../user/user.service");
let AuthController = class AuthController {
    constructor(authService, userService) {
        this.authService = authService;
        this.userService = userService;
    }
    async signup(signupDto, res) {
        try {
            const user = await this.userService.create(signupDto);
            await this.authService.initiateEmailVerification(user);
            return res.json({
                message: 'User created successfully. Please verify your email.',
                user: {
                    id: user.id,
                    name: user.name,
                    lastname: user.lastname,
                    email: user.email,
                    email_verified_at: user.email_verified_at,
                    documents_verified_at: user.documents_verified_at,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                },
            });
        }
        catch (error) {
            if (error.status) {
                return res.status(error.status).json({
                    message: error.message,
                });
            }
            return res.status(500).json({
                message: 'Internal server error',
            });
        }
    }
    async login(authDto, res) {
        try {
            const result = await this.authService.login(authDto);
            if (result.user.email_verified_at && result.user.documents_verified_at) {
                res.cookie('token', result.token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000,
                });
            }
            return res.json({
                message: 'Authentication successful',
                user: result.user,
                token: result.token,
            });
        }
        catch (error) {
            if (error.status) {
                return res.status(error.status).json({
                    message: error.message,
                });
            }
            return res.status(500).json({
                message: 'Internal server error',
            });
        }
    }
    async sendEmailVerification(email, res) {
        try {
            await this.authService.resendEmailVerification(email);
            return res.json({ message: 'Verification email sent' });
        }
        catch (error) {
            if (error.status) {
                return res.status(error.status).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async verifyEmail(email, code, res) {
        try {
            await this.authService.verifyEmailCode(email, code);
            return res.json({ message: 'Email verified successfully' });
        }
        catch (error) {
            if (error.status) {
                return res.status(error.status).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async uploadDocuments(email, files, res) {
        try {
            if (!files || files.length !== 3) {
                throw new common_1.BadRequestException('Exactly 3 files are required');
            }
            await this.authService.submitDocuments({
                email,
                frontPath: files[0].path,
                backPath: files[1].path,
                selfiePath: files[2].path,
            });
            return res.json({ message: 'Documents submitted' });
        }
        catch (error) {
            if (error.status) {
                return res.status(error.status).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_dto_1.SignupDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.AuthDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('email/send'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendEmailVerification", null);
__decorate([
    (0, common_1.Post)('email/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('code')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 3, {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + (0, path_1.extname)(file.originalname));
            },
        }),
        limits: { files: 3 },
    })),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "uploadDocuments", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('api/v1/auth'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        user_service_1.UserService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map