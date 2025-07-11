import { Injectable } from "@nestjs/common";
import { UserSettingsEntity } from "./user-settings.entity";

@Injectable()
export class UserSettingsRepository {
  private userSettings: Map<string, UserSettingsEntity> = new Map();

  findByUserId(userId: string): Promise<UserSettingsEntity | null> {
    const settings = this.userSettings.get(userId);
    return Promise.resolve(settings || null);
  }

  create(userSettings: UserSettingsEntity): Promise<UserSettingsEntity> {
    this.userSettings.set(userSettings.userId, userSettings);
    return Promise.resolve(userSettings);
  }

  update(
    userId: string,
    userSettings: UserSettingsEntity,
  ): Promise<UserSettingsEntity | null> {
    if (!this.userSettings.has(userId)) {
      return Promise.resolve(null);
    }

    this.userSettings.set(userId, userSettings);
    return Promise.resolve(userSettings);
  }

  delete(userId: string): Promise<boolean> {
    return Promise.resolve(this.userSettings.delete(userId));
  }

  // Find or create user settings (helper method)
  async findOrCreate(userId: string): Promise<UserSettingsEntity> {
    let settings = await this.findByUserId(userId);

    if (!settings) {
      settings = UserSettingsEntity.createDefault(userId);
      await this.create(settings);
    }

    return settings;
  }
}
