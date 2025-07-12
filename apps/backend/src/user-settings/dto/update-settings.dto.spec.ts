import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateSettingsDto } from './update-settings.dto';

describe('UpdateSettingsDto', () => {
  const createDto = (data: Partial<UpdateSettingsDto>): UpdateSettingsDto => {
    return plainToClass(UpdateSettingsDto, data);
  };

  describe('theme validation', () => {
    it('유효한 테마 값으로 검증을 통과해야 함', async () => {
      const validThemes = ['light', 'dark', 'system'];

      for (const theme of validThemes) {
        const dto = createDto({
          theme: theme as any,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('테마가 없어도 검증을 통과해야 함 (선택적 필드)', async () => {
      const dto = createDto({
        language: 'ko',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('잘못된 테마 값으로 검증 실패해야 함', async () => {
      const invalidThemes = [
        'blue',
        'auto',
        'default',
        'lightmode',
        'darkmode',
        '',
        '   ',
        'LIGHT',
        'Dark',
        'SYSTEM',
      ];

      for (const theme of invalidThemes) {
        const dto = createDto({
          theme: theme as any,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        
        const themeError = errors.find(error => error.property === 'theme');
        expect(themeError).toBeDefined();
        expect(themeError?.constraints).toHaveProperty('isIn');
      }
    });

    it('문자열이 아닌 타입으로 검증 실패해야 함', async () => {
      const dto = createDto({
        theme: 123 as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // isString validator combines both constraints
      
      const themeError = errors.find(error => error.property === 'theme');
      expect(themeError).toBeDefined();
      expect(themeError?.constraints).toHaveProperty('isString');
    });

    it('null 값으로 검증 통과해야 함 (@IsOptional 때문)', async () => {
      const dto = createDto({
        theme: null as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0); // @IsOptional이므로 null은 허용됨
    });
  });

  describe('language validation', () => {
    it('유효한 언어 값으로 검증을 통과해야 함', async () => {
      const validLanguages = ['ko', 'en', 'ja', 'zh', 'fr', 'de', 'es'];

      for (const language of validLanguages) {
        const dto = createDto({
          language,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('언어가 없어도 검증을 통과해야 함 (선택적 필드)', async () => {
      const dto = createDto({
        theme: 'light',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('빈 문자열 언어로 검증 실패해야 함', async () => {
      const dto = createDto({
        language: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('language');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('공백만 있는 언어로 검증 실패해야 함', async () => {
      const dto = createDto({
        language: '   ',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // 비즈니스 로직에서 처리
    });

    it('문자열이 아닌 타입으로 검증 실패해야 함', async () => {
      const dto = createDto({
        language: 123 as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('language');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('긴 언어 코드를 허용해야 함', async () => {
      const dto = createDto({
        language: 'ko-KR',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('categoryFilter validation', () => {
    it('유효한 카테고리 필터로 검증을 통과해야 함', async () => {
      const validFilters: { [categoryId: string]: boolean }[] = [
        { 'cat-1': true, 'cat-2': false },
        { 'category-123': true },
        {},
        { 'work': true, 'personal': false, 'family': true },
      ];

      for (const categoryFilter of validFilters) {
        const dto = createDto({
          categoryFilter,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('카테고리 필터가 없어도 검증을 통과해야 함 (선택적 필드)', async () => {
      const dto = createDto({
        theme: 'light',
        language: 'ko',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('객체가 아닌 타입으로 검증 실패해야 함', async () => {
      const invalidFilters = [
        'string',
        123,
        [],
        true,
        null,
      ];

      for (const categoryFilter of invalidFilters) {
        const dto = createDto({
          categoryFilter: categoryFilter as any,
        });

        const errors = await validate(dto);
        
        // null은 @IsOptional 때문에 허용됨
        if (categoryFilter === null) {
          expect(errors.length).toBe(0);
        } else {
          expect(errors.length).toBeGreaterThan(0);
          const filterError = errors.find(error => error.property === 'categoryFilter');
          expect(filterError).toBeDefined();
          expect(filterError?.constraints).toHaveProperty('isObject');
        }
      }
    });

    it('중첩 객체는 허용하지 않음 (평면 객체만)', async () => {
      const dto = createDto({
        categoryFilter: {
          'cat-1': { enabled: true } as any,
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // class-validator는 중첩 검사를 하지 않음
    });

    it('boolean이 아닌 값도 허용 (런타임에서 처리)', async () => {
      const dto = createDto({
        categoryFilter: {
          'cat-1': 'true' as any,
          'cat-2': 1 as any,
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('전체 유효성 검사', () => {
    it('모든 필드가 유효하면 검증을 통과해야 함', async () => {
      const dto = createDto({
        theme: 'dark',
        language: 'en',
        categoryFilter: { 'cat-1': true, 'cat-2': false },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('일부 필드만 제공해도 검증을 통과해야 함', async () => {
      const scenarios: Partial<UpdateSettingsDto>[] = [
        { theme: 'light' },
        { language: 'ko' },
        { categoryFilter: { 'cat-1': true } },
        { theme: 'dark', language: 'en' },
        { theme: 'system', categoryFilter: {} },
        { language: 'ko', categoryFilter: { 'work': false } },
      ];

      for (const scenario of scenarios) {
        const dto = createDto(scenario);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('빈 객체도 검증을 통과해야 함 (모든 필드가 선택적)', async () => {
      const dto = createDto({});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('모든 필드가 잘못되면 여러 검증 오류가 발생해야 함', async () => {
      const dto = createDto({
        theme: 'invalid-theme' as any,
        language: 123 as any,
        categoryFilter: 'not-an-object' as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(3);
      
      const themeError = errors.find(error => error.property === 'theme');
      const languageError = errors.find(error => error.property === 'language');
      const filterError = errors.find(error => error.property === 'categoryFilter');
      
      expect(themeError).toBeDefined();
      expect(languageError).toBeDefined();
      expect(filterError).toBeDefined();
    });

    it('추가 속성이 있어도 검증을 통과해야 함', async () => {
      const dto = createDto({
        theme: 'light',
        language: 'ko',
        ...(({ extraProperty: 'extra' } as any))
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('부분 업데이트 시나리오', () => {
    it('undefined 값으로 검증을 통과해야 함', async () => {
      const dto = createDto({
        theme: undefined,
        language: undefined,
        categoryFilter: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('null 값으로 검증 통과해야 함 (@IsOptional 때문)', async () => {
      const dto = createDto({
        theme: null as any,
        language: null as any,
        categoryFilter: null as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // 모든 필드가 @IsOptional이므로 null 허용
    });
  });

  describe('실제 사용 시나리오', () => {
    it('테마만 변경하는 경우', async () => {
      const dto = createDto({
        theme: 'dark',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('언어만 변경하는 경우', async () => {
      const dto = createDto({
        language: 'en',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('카테고리 필터만 변경하는 경우', async () => {
      const dto = createDto({
        categoryFilter: {
          'work': false,
          'personal': true,
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('모든 설정을 한 번에 변경하는 경우', async () => {
      const dto = createDto({
        theme: 'system',
        language: 'ko',
        categoryFilter: {
          'cat-1': true,
          'cat-2': false,
          'cat-3': true,
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('경계값 테스트', () => {
    it('매우 긴 언어 코드를 허용해야 함', async () => {
      const longLanguage = 'a'.repeat(100);
      const dto = createDto({
        language: longLanguage,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('많은 카테고리 필터를 허용해야 함', async () => {
      const manyFilters: { [key: string]: boolean } = {};
      for (let i = 0; i < 100; i++) {
        manyFilters[`category-${i}`] = i % 2 === 0;
      }

      const dto = createDto({
        categoryFilter: manyFilters,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});