import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateCategoryDto } from './update-category.dto';

describe('UpdateCategoryDto', () => {
  const createDto = (data: Partial<UpdateCategoryDto>): UpdateCategoryDto => {
    return plainToClass(UpdateCategoryDto, data);
  };

  describe('name validation', () => {
    it('유효한 이름으로 검증을 통과해야 함', async () => {
      const dto = createDto({
        name: '수정된 프로젝트',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('이름이 없어도 검증을 통과해야 함 (선택적 필드)', async () => {
      const dto = createDto({
        color: '#ef4444',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('빈 문자열 이름으로 검증 실패해야 함', async () => {
      const dto = createDto({
        name: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('공백만 있는 이름은 허용해야 함 (비즈니스 로직에서 처리)', async () => {
      const dto = createDto({
        name: '   ',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('문자열이 아닌 타입으로 검증 실패해야 함', async () => {
      const dto = createDto({
        name: 123 as any,
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
          color,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('색상이 없어도 검증을 통과해야 함 (선택적 필드)', async () => {
      const dto = createDto({
        name: '테스트',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
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
        name: '수정된 카테고리',
        color: '#8b5cf6',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('이름만 수정하는 경우 검증을 통과해야 함', async () => {
      const dto = createDto({
        name: '새로운 이름',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('색상만 수정하는 경우 검증을 통과해야 함', async () => {
      const dto = createDto({
        color: '#ff0000',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('빈 객체도 검증을 통과해야 함 (모든 필드가 선택적)', async () => {
      const dto = createDto({});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('모든 필드가 잘못되면 여러 검증 오류가 발생해야 함', async () => {
      const dto = createDto({
        name: 123 as any,
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

  describe('부분 업데이트 시나리오', () => {
    it('undefined 값으로 검증을 통과해야 함', async () => {
      const dto = createDto({
        name: undefined,
        color: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('null 값으로 검증 통과해야 함 (@IsOptional 때문)', async () => {
      const dto = createDto({
        name: null as any,
        color: null as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // @IsOptional이므로 null 허용
    });

    it('일부 필드만 제공해도 검증을 통과해야 함', async () => {
      const scenarios = [
        { name: '새 이름' },
        { color: '#123456' },
        { name: '새 이름', color: '#123456' },
      ];

      for (const scenario of scenarios) {
        const dto = createDto(scenario);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('한글 및 특수문자 처리', () => {
    it('한글 카테고리 이름을 허용해야 함', async () => {
      const dto = createDto({
        name: '수정된 회사 업무',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('영어 카테고리 이름을 허용해야 함', async () => {
      const dto = createDto({
        name: 'Updated Work Projects',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('특수문자가 포함된 카테고리 이름을 허용해야 함', async () => {
      const dto = createDto({
        name: '프로젝트 #2 (수정됨)',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('이모지가 포함된 카테고리 이름을 허용해야 함', async () => {
      const dto = createDto({
        name: '업무 📋',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('경계값 테스트', () => {
    it('매우 긴 이름을 허용해야 함', async () => {
      const longName = 'a'.repeat(1000);
      const dto = createDto({
        name: longName,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('한 글자 이름을 허용해야 함', async () => {
      const dto = createDto({
        name: 'A',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});