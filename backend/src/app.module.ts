import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerConfigModule } from './shared/throttler/throttler.module';
import { ModulesModule } from './modules/modules.module';
import { validate } from './config/env.validation';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  adminConfig,
  jwtConfig,
  mailConfig,
  cloudinaryConfig,
} from './config';
import { RedisModule } from './shared/redis/redis.module';
import { StorageModule } from './shared/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        adminConfig,
        jwtConfig,
        mailConfig,
        cloudinaryConfig,
      ],
    }),
    EventEmitterModule.forRoot(),
    ThrottlerConfigModule,
    PrismaModule,
    RedisModule,
    StorageModule,
    ModulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
