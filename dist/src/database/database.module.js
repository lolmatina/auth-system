"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../user/entities/user.entity");
const manager_entity_1 = require("../manager/entities/manager.entity");
const config_1 = require("@nestjs/config");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const databaseUrl = config.get('DATABASE_URL');
                    const isDev = config.get('NODE_ENV') !== 'production';
                    const useSsl = Boolean(databaseUrl) || config.get('DB_SSL') === 'true';
                    return {
                        type: 'postgres',
                        url: databaseUrl || undefined,
                        host: databaseUrl ? undefined : (config.get('DB_HOST') || 'localhost'),
                        port: databaseUrl ? undefined : (parseInt(config.get('DB_PORT') || '5432')),
                        username: databaseUrl ? undefined : (config.get('DB_USERNAME') || 'postgres'),
                        password: databaseUrl ? undefined : (config.get('DB_PASSWORD') || 'password'),
                        database: databaseUrl ? undefined : (config.get('DB_DATABASE') || 'authentication'),
                        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
                        entities: [user_entity_1.User, manager_entity_1.Manager],
                        synchronize: isDev,
                        logging: config.get('NODE_ENV') === 'development',
                    };
                },
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, manager_entity_1.Manager]),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map