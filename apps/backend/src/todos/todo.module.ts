import { Module } from "@nestjs/common";
import { TodoService } from "./todo.service";
import { TodoController } from "./todo.controller";
import { TodoRepository } from "./todo.repository";
import { RedisModule } from "../redis/redis.module";
import { UserSettingsModule } from "../user-settings/user-settings.module";

@Module({
  imports: [RedisModule, UserSettingsModule],
  controllers: [TodoController],
  providers: [TodoService, TodoRepository],
  exports: [TodoService, TodoRepository],
})
export class TodoModule {}
