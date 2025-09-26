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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const auth_service_1 = require("../auth/auth.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let UserController = class UserController {
    constructor(userService, authService) {
        this.userService = userService;
        this.authService = authService;
    }
    async create(createUserDto, res) {
        try {
            const user = await this.userService.create(createUserDto);
            await this.authService.initiateEmailVerification(user);
            return res.json({
                message: 'User created successfully. Please verify your email.',
                user: {
                    id: user.id,
                    name: user.name,
                    lastname: user.lastname,
                    email: user.email,
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
    async getCurrentUser(req, res) {
        try {
            const user = req.user;
            return res.json({
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
            });
        }
        catch (error) {
            return res.status(500).json({
                message: 'Internal server error',
            });
        }
    }
    async findOne(id, res) {
        try {
            const user = await this.userService.findOne(id);
            return res.json(user);
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
    async update(id, updateUserDto, res) {
        try {
            const user = await this.userService.update(id, updateUserDto);
            return res.json(user);
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
    async remove(id, res) {
        try {
            await this.userService.remove(id);
            return res.json({
                message: 'User deleted successfully',
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
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "remove", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('api/v1/user'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => auth_service_1.AuthService))),
    __metadata("design:paramtypes", [user_service_1.UserService,
        auth_service_1.AuthService])
], UserController);
//# sourceMappingURL=user.controller.js.map