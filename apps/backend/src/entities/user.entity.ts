export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserDto = Omit<User, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>;