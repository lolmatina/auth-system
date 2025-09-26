"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const user_service_1 = require("./user.service");
const user_entity_1 = require("./entities/user.entity");
const common_1 = require("@nestjs/common");
describe('UserService', () => {
    let service;
    let repository;
    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                user_service_1.UserService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
                    useValue: mockRepository,
                },
            ],
        }).compile();
        service = module.get(user_service_1.UserService);
        repository = module.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        it('should create a user successfully', async () => {
            const createUserDto = {
                name: 'John',
                lastname: 'Doe',
                email: 'john@example.com',
                password: 'password123',
            };
            const mockUser = {
                id: 1,
                ...createUserDto,
                password: 'hashed_password',
                created_at: new Date(),
                updated_at: new Date(),
            };
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockUser);
            mockRepository.save.mockResolvedValue(mockUser);
            const result = await service.create(createUserDto);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: createUserDto.email },
            });
            expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                ...createUserDto,
                password: expect.any(String),
            }));
            expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockUser);
        });
        it('should throw BadRequestException if user with email already exists', async () => {
            const createUserDto = {
                name: 'John',
                lastname: 'Doe',
                email: 'john@example.com',
                password: 'password123',
            };
            mockRepository.findOne.mockResolvedValue({ id: 1, email: 'john@example.com' });
            await expect(service.create(createUserDto)).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('findOne', () => {
        it('should return a user by id', async () => {
            const mockUser = {
                id: 1,
                name: 'John',
                lastname: 'Doe',
                email: 'john@example.com',
                created_at: new Date(),
                updated_at: new Date(),
            };
            mockRepository.findOne.mockResolvedValue(mockUser);
            const result = await service.findOne(1);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                select: ['id', 'name', 'lastname', 'email', 'created_at', 'updated_at'],
            });
            expect(result).toEqual(mockUser);
        });
        it('should throw NotFoundException if user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.findOne(1)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException for invalid id', async () => {
            await expect(service.findOne(NaN)).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=user.service.spec.js.map