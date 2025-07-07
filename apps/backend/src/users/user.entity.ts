export class User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
  profileImage?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
    this.id = this.id || this.generateId();
    this.emailVerified = this.emailVerified ?? false;
    this.isActive = this.isActive ?? true;
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  toProfile() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      profileImage: this.profileImage,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt,
    };
  }
}