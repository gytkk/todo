import { UserInfo } from '@calendar-todo/shared-types';
import { authenticatedFetch } from '@/lib/apiUtils';

export interface UpdateUserRequest {
  name?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class UserApiService {
  private static instance: UserApiService;
  private readonly baseUrl = '/api/users';

  static getInstance(): UserApiService {
    if (!UserApiService.instance) {
      UserApiService.instance = new UserApiService();
    }
    return UserApiService.instance;
  }

  /**
   * 현재 사용자 프로필을 가져옵니다
   */
  async getUserProfile(): Promise<UserInfo> {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/me`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        name: data.firstName || data.username || '',
        email: data.email || '',
        profileImage: data.profileImage || '',
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * 사용자 프로필을 업데이트합니다
   */
  async updateUserProfile(updates: UpdateUserRequest): Promise<UserInfo> {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/me`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user profile: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        name: data.firstName || data.username || '',
        email: data.email || '',
        profileImage: data.profileImage || '',
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * 사용자 비밀번호를 변경합니다
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/me/password`, {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to change password: ${errorText}`);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * 사용자 계정을 삭제합니다
   */
  async deleteAccount(): Promise<void> {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/me`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete account: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
}