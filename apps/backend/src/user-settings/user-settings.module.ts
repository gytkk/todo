import { Module } from "@nestjs/common";
import { UserSettingsController } from "./user-settings.controller";
import { UserSettingsService } from "./user-settings.service";
import { UserSettingsRepository } from "./user-settings.repository";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [RedisModule],
  controllers: [UserSettingsController],
  providers: [UserSettingsService, UserSettingsRepository],
  exports: [UserSettingsService],
})
export class UserSettingsModule {}
