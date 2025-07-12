import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateCategoryDto } from './create-category.dto';

describe('CreateCategoryDto', () => {
  const createDto = (data: Partial<CreateCategoryDto>): CreateCategoryDto => {
    return plainToClass(CreateCategoryDto, data);
  };

  describe('name validation', () => {
    it('유효한 이름으로 검증을 통과해야 함', async () => {
      const dto = createDto({
        name: '프로젝트',
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('이름이 없으면 검증 실패해야 함', async () => {
      const dto = createDto({
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('빈 문자열 이름으로 검증 실패해야 함', async () => {
      const dto = createDto({
        name: '',
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('공백만 있는 이름으로 검증 실패해야 함', async () => {
      const dto = createDto({
        name: '   ',
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('문자열이 아닌 타입으로 검증 실패해야 함', async () => {
      const dto = createDto({
        name: 123 as any,
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('color validation', () => {
    it('유효한 헥스 색상으로 검증을 통과해야 함', async () => {
      const validColors = [
        '#ef4444',
        '#EF4444',
        '#123456',
        '#abcdef',
        '#ABCDEF',
        '#000000',
        '#ffffff',
        '#FFFFFF',
      ];

      for (const color of validColors) {
        const dto = createDto({
          name: '테스트',
          color,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('색상이 없으면 검증 실패해야 함', async () => {
      const dto = createDto({
        name: '테스트',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('color');
    });

    it('잘못된 헥스 색상 형식으로 검증 실패해야 함', async () => {
      const invalidColors = [
        'ef4444',      // # 없음
        '#ef44',       // 너무 짧음
        '#ef444444',   // 너무 김
        '#gggggg',     // 잘못된 문자
        '#ef-444',     // 특수문자 포함
        'red',         // 단어
        'rgb(255,0,0)', // RGB 형식
        '#',           // # 만 있음
        '',            // 빈 문자열
        '   ',         // 공백
      ];

      for (const color of invalidColors) {
        const dto = createDto({
          name: '테스트',
          color,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        
        const colorError = errors.find(error => error.property === 'color');
        expect(colorError).toBeDefined();
        expect(colorError?.constraints).toHaveProperty('matches');
        expect(colorError?.constraints?.matches).toContain('헥스 코드');
      }
    });

    it('문자열이 아닌 타입으로 검증 실패해야 함', async () => {
      const dto = createDto({
        name: '테스트',
        color: 123456 as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('color');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('전체 유효성 검사', () => {
    it('모든 필드가 유효하면 검증을 통과해야 함', async () => {
      const dto = createDto({
        name: '새로운 카테고리',
        color: '#8b5cf6',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('모든 필드가 잘못되면 여러 검증 오류가 발생해야 함', async () => {
      const dto = createDto({
        name: '',
        color: 'invalid-color',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
      
      const nameError = errors.find(error => error.property === 'name');
      const colorError = errors.find(error => error.property === 'color');
      
      expect(nameError).toBeDefined();
      expect(colorError).toBeDefined();
    });

    it('추가 속성이 있어도 검증을 통과해야 함', async () => {
      const dto = createDto({
        name: '테스트',
        color: '#ef4444',
        ...(({ extraProperty: 'extra' } as any))
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('한글 및 특수문자 처리', () => {
    it('한글 카테고리 이름을 허용해야 함', async () => {
      const dto = createDto({
        name: '회사 업무',
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('영어 카테고리 이름을 허용해야 함', async () => {
      const dto = createDto({
        name: 'Work Projects',
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('특수문자가 포함된 카테고리 이름을 허용해야 함', async () => {
      const dto = createDto({
        name: '프로젝트 #1',
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('숫자가 포함된 카테고리 이름을 허용해야 함', async () => {
      const dto = createDto({
        name: '2024 계획',
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});