"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('User System API (e2e)', () => {
    let app;
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterEach(async () => {
        await app.close();
    });
    describe('/api/v1/user (POST)', () => {
        it('should create a new user', () => {
            return request(app.getHttpServer())
                .post('/api/v1/user')
                .send({
                name: 'John',
                lastname: 'Doe',
                email: 'john@example.com',
                password: 'password123',
            })
                .expect(200)
                .expect((res) => {
                expect(res.body.message).toBe('User created successfully');
                expect(res.body.user.name).toBe('John');
                expect(res.body.user.lastname).toBe('Doe');
                expect(res.body.user.email).toBe('john@example.com');
                expect(res.body.user.password).toBeUndefined();
            });
        });
        it('should return 400 for invalid input', () => {
            return request(app.getHttpServer())
                .post('/api/v1/user')
                .send({
                name: '',
                lastname: 'Doe',
                email: 'invalid-email',
                password: '123',
            })
                .expect(400);
        });
    });
    describe('/api/v1/auth (POST)', () => {
        beforeEach(async () => {
            await request(app.getHttpServer())
                .post('/api/v1/user')
                .send({
                name: 'Test',
                lastname: 'User',
                email: 'test@example.com',
                password: 'password123',
            });
        });
        it('should authenticate user with valid credentials', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth')
                .send({
                email: 'test@example.com',
                password: 'password123',
            })
                .expect(200)
                .expect((res) => {
                expect(res.body.message).toBe('Authentication successful');
                expect(res.body.user.email).toBe('test@example.com');
            });
        });
        it('should return 401 for invalid credentials', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth')
                .send({
                email: 'test@example.com',
                password: 'wrongpassword',
            })
                .expect(401);
        });
        it('should return 404 for non-existent user', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth')
                .send({
                email: 'nonexistent@example.com',
                password: 'password123',
            })
                .expect(404);
        });
    });
    describe('/api/v1/user/:id (GET)', () => {
        let userId;
        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/user')
                .send({
                name: 'Get',
                lastname: 'User',
                email: 'get@example.com',
                password: 'password123',
            });
            userId = response.body.user.id;
        });
        it('should get user by id', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/user/${userId}`)
                .expect(200)
                .expect((res) => {
                expect(res.body.id).toBe(userId);
                expect(res.body.name).toBe('Get');
                expect(res.body.lastname).toBe('User');
                expect(res.body.email).toBe('get@example.com');
                expect(res.body.password).toBeUndefined();
            });
        });
        it('should return 404 for non-existent user', () => {
            return request(app.getHttpServer())
                .get('/api/v1/user/99999')
                .expect(404);
        });
        it('should return 400 for invalid id', () => {
            return request(app.getHttpServer())
                .get('/api/v1/user/invalid')
                .expect(400);
        });
    });
});
//# sourceMappingURL=app.e2e-spec.js.map