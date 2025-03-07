import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  ssl:
    configService.get('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
  synchronize: configService.get('NODE_ENV') !== 'production',
  autoLoadEntities: true,
  logging: ['error', 'warn', 'query'],
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000,
  extra: {
    max: 20,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  },
});
