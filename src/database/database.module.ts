import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Manager } from '../manager/entities/manager.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const isDev = config.get<string>('NODE_ENV') !== 'production';
        const useSsl = Boolean(databaseUrl) || config.get<string>('DB_SSL') === 'true';
        return {
          type: 'postgres',
          url: databaseUrl || undefined,
          host: databaseUrl ? undefined : (config.get<string>('DB_HOST') || 'localhost'),
          port: databaseUrl ? undefined : (parseInt(config.get<string>('DB_PORT') || '5432')),
          username: databaseUrl ? undefined : (config.get<string>('DB_USERNAME') || 'postgres'),
          password: databaseUrl ? undefined : (config.get<string>('DB_PASSWORD') || 'password'),
          database: databaseUrl ? undefined : (config.get<string>('DB_DATABASE') || 'authentication'),
          ssl: useSsl ? { rejectUnauthorized: false } : undefined,
          entities: [User, Manager],
          synchronize: isDev,
          logging: config.get<string>('NODE_ENV') === 'development',
        };
      },
    }),
    TypeOrmModule.forFeature([User, Manager]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
