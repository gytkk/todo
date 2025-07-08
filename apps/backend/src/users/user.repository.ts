import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UserRepository {
  private users: User[] = [];

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username) || null;
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = new User(userData);
    this.users.push(user);
    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = new User({
      ...this.users[userIndex],
      ...updateData,
      updatedAt: new Date(),
    });

    return this.users[userIndex];
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter((user) => user.id !== id);
    return this.users.length < initialLength;
  }

  async exists(email: string, username?: string): Promise<boolean> {
    return this.users.some(
      (user) => user.email === email || (username && user.username === username),
    );
  }
}
