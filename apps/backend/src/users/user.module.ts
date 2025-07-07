import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { PasswordService } from '../auth/password.service';

@Module({
  providers: [UserService, UserRepository, PasswordService],
  controllers: [UserController],
  exports: [UserService, UserRepository],
})
export class UserModule {}