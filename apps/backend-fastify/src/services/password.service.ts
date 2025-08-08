import bcrypt from 'bcryptjs';

export class PasswordService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password || password.length === 0) {
      errors.push('비밀번호를 입력해주세요');
    }

    if (password.length < 6) {
      errors.push('비밀번호는 최소 6자 이상이어야 합니다');
    }

    if (password.length > 100) {
      errors.push('비밀번호는 100자 이하여야 합니다');
    }

    // 추가 비밀번호 규칙을 여기에 구현할 수 있습니다
    // 예: 대문자, 소문자, 숫자, 특수문자 포함 등

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}