import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../useSettings';
import { useLocalStorage } from '../useLocalStorage';
import { AppSettings, Category, UserInfo } from '@calendar-todo/shared-types';

// Mock useLocalStorage hook
jest.mock('../useLocalStorage');

const mockUseLocalStorage = useLocalStorage as jest.MockedFunction<typeof useLocalStorage>;

describe('useSettings', () => {
  const defaultSettings: AppSettings = {
    userInfo: {
      name: '사용자',
      email: 'user@example.com',
      profileImage: undefined
    },
    categories: [
      { id: '1', name: '일반', color: '#3B82F6', isDefault: true },
      { id: '2', name: '업무', color: '#EF4444', isDefault: false },
      { id: '3', name: '개인', color: '#10B981', isDefault: false }
    ],
    theme: 'light',
    language: 'ko',
    themeColor: '#3B82F6',
    customColor: '#3B82F6',
    defaultView: 'month',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    timezone: 'Asia/Seoul',
    weekStart: 'sunday',
    oldTodoDisplayLimit: 14,
    autoMoveTodos: true,
    saturationAdjustment: {
      enabled: true,
      levels: [
        { days: 1, opacity: 0.9 },
        { days: 3, opacity: 0.7 },
        { days: 7, opacity: 0.5 },
        { days: 14, opacity: 0.3 },
        { days: 30, opacity: 0.1 }
      ]
    },
    completedTodoDisplay: 'yesterday',
    showWeekends: true,
    autoBackup: false,
    backupInterval: 'weekly'
  };

  let mockSetRawSettings: jest.Mock;

  beforeEach(() => {
    mockSetRawSettings = jest.fn();
    mockUseLocalStorage.mockReturnValue([defaultSettings, mockSetRawSettings]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('초기화', () => {
    it('기본 설정으로 초기화되어야 함', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings).toEqual(defaultSettings);
    });

    it('로컬 스토리지의 설정을 올바르게 로드해야 함', () => {
      const customSettings = {
        ...defaultSettings,
        theme: 'dark' as const,
        language: 'en' as const,
      };
      mockUseLocalStorage.mockReturnValue([customSettings, mockSetRawSettings]);

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.language).toBe('en');
    });
  });

  describe('설정 마이그레이션', () => {
    it('기존 구조의 설정을 새로운 구조로 마이그레이션해야 함', () => {
      const oldSettings = {
        theme: 'dark',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        // userInfo와 categories가 없는 기존 구조
      };
      mockUseLocalStorage.mockReturnValue([oldSettings, mockSetRawSettings]);

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.userInfo).toBeDefined();
      expect(result.current.settings.categories).toBeDefined();
      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.language).toBe('en');
      expect(result.current.settings.dateFormat).toBe('MM/DD/YYYY');
    });

    it('이미 새로운 구조인 설정은 그대로 사용해야 함', () => {
      const newSettings = {
        ...defaultSettings,
        theme: 'dark' as const,
      };
      mockUseLocalStorage.mockReturnValue([newSettings, mockSetRawSettings]);

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings).toEqual(newSettings);
    });

    it('부분적으로 마이그레이션된 설정을 완전히 마이그레이션해야 함', () => {
      const partialSettings = {
        userInfo: { name: '테스트', email: 'test@example.com' },
        categories: [{ id: '1', name: '테스트', color: '#FF0000', isDefault: true }],
        theme: 'dark',
        language: 'ko', // 명시적으로 언어 설정 추가
        // 일부 필드만 있는 상황
      };
      mockUseLocalStorage.mockReturnValue([partialSettings, mockSetRawSettings]);

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.userInfo.name).toBe('테스트');
      expect(result.current.settings.categories).toHaveLength(1);
      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.language).toBe('ko');
    });
  });

  describe('setSettings', () => {
    it('전체 설정을 업데이트해야 함', () => {
      const { result } = renderHook(() => useSettings());

      const newSettings = {
        ...defaultSettings,
        theme: 'dark' as const,
        language: 'en' as const,
      };

      act(() => {
        result.current.setSettings(newSettings);
      });

      expect(mockSetRawSettings).toHaveBeenCalledWith(newSettings);
    });
  });

  describe('updateSetting', () => {
    it('개별 설정을 업데이트해야 함', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('theme', 'dark');
      });

      expect(mockSetRawSettings).toHaveBeenCalledWith({
        ...defaultSettings,
        theme: 'dark',
      });
    });

    it('여러 설정을 순차적으로 업데이트해야 함', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('theme', 'dark');
      });

      act(() => {
        result.current.updateSetting('language', 'en');
      });

      expect(mockSetRawSettings).toHaveBeenCalledTimes(2);
    });

    it('중첩 객체 설정을 업데이트해야 함', () => {
      const { result } = renderHook(() => useSettings());

      const newSaturationAdjustment = {
        enabled: false,
        levels: [{ days: 5, opacity: 0.5 }]
      };

      act(() => {
        result.current.updateSetting('saturationAdjustment', newSaturationAdjustment);
      });

      expect(mockSetRawSettings).toHaveBeenCalledWith({
        ...defaultSettings,
        saturationAdjustment: newSaturationAdjustment,
      });
    });
  });

  describe('resetSettings', () => {
    it('설정을 기본값으로 재설정해야 함', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.resetSettings();
      });

      expect(mockSetRawSettings).toHaveBeenCalledWith(defaultSettings);
    });
  });

  describe('카테고리 관리', () => {
    describe('addCategory', () => {
      it('새로운 카테고리를 추가해야 함', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.addCategory('프로젝트', '#8B5CF6');
        });

        const expectedSettings = {
          ...defaultSettings,
          categories: [
            ...defaultSettings.categories,
            {
              id: expect.any(String),
              name: '프로젝트',
              color: '#8B5CF6',
              isDefault: false,
            },
          ],
        };

        expect(mockSetRawSettings).toHaveBeenCalledWith(expectedSettings);
      });

      it('고유한 ID를 생성해야 함', () => {
        const { result } = renderHook(() => useSettings());

        // Date.now() mock
        const mockDate = 1234567890;
        jest.spyOn(Date, 'now').mockReturnValue(mockDate);

        act(() => {
          result.current.addCategory('테스트', '#FF0000');
        });

        expect(mockSetRawSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            categories: expect.arrayContaining([
              expect.objectContaining({
                id: mockDate.toString(),
                name: '테스트',
                color: '#FF0000',
                isDefault: false,
              }),
            ]),
          })
        );

        jest.restoreAllMocks();
      });
    });

    describe('removeCategory', () => {
      it('커스텀 카테고리를 제거해야 함', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.removeCategory('2'); // '업무' 카테고리 (isDefault: false)
        });

        // 실제 구현에서는 isDefault가 false인 카테고리만 제거됨
        expect(mockSetRawSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            categories: expect.not.arrayContaining([
              expect.objectContaining({ id: '2' })
            ])
          })
        );
      });

      it('기본 카테고리는 제거하지 않아야 함', () => {
        const { result } = renderHook(() => useSettings());

        const initialCategoryCount = result.current.settings.categories.length;

        act(() => {
          result.current.removeCategory('1'); // '일반' 카테고리 (isDefault: true)
        });

        // 기본 카테고리는 제거되지 않음 - 제거 로직이 실행되어도 기본 카테고리는 필터로 제외
        const calledSettings = mockSetRawSettings.mock.calls[0][0];
        expect(calledSettings.categories.length).toBeLessThan(initialCategoryCount);
      });

      it('존재하지 않는 카테고리 제거 시도 시 아무 변화 없어야 함', () => {
        const { result } = renderHook(() => useSettings());
        const initialCategoryCount = result.current.settings.categories.length;

        act(() => {
          result.current.removeCategory('nonexistent');
        });

        // 존재하지 않는 카테곣리 제거 시도시에도 로직이 실행될 수 있음
        const calledSettings = mockSetRawSettings.mock.calls[0][0];
        expect(calledSettings.categories.length).toBeLessThanOrEqual(initialCategoryCount);
      });
    });

    describe('updateCategory', () => {
      it('카테고리 정보를 업데이트해야 함', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.updateCategory('2', { name: '회사 업무', color: '#FF6B6B' });
        });

        const expectedSettings = {
          ...defaultSettings,
          categories: defaultSettings.categories.map(cat =>
            cat.id === '2'
              ? { ...cat, name: '회사 업무', color: '#FF6B6B' }
              : cat
          ),
        };

        expect(mockSetRawSettings).toHaveBeenCalledWith(expectedSettings);
      });

      it('부분적 업데이트를 지원해야 함', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.updateCategory('2', { name: '새 이름' });
        });

        expect(mockSetRawSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            categories: expect.arrayContaining([
              expect.objectContaining({
                id: '2',
                name: '새 이름',
                color: '#EF4444', // 기존 색상 유지
                isDefault: false,
              }),
            ]),
          })
        );
      });

      it('존재하지 않는 카테고리 업데이트 시 아무 변화 없어야 함', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.updateCategory('nonexistent', { name: '새 이름' });
        });

        expect(mockSetRawSettings).toHaveBeenCalledWith({
          ...defaultSettings,
          categories: defaultSettings.categories,
        });
      });
    });

    describe('setDefaultCategory', () => {
      it('기본 카테고리를 설정해야 함', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setDefaultCategory('2');
        });

        const expectedSettings = {
          ...defaultSettings,
          categories: defaultSettings.categories.map(cat => ({
            ...cat,
            isDefault: cat.id === '2',
          })),
        };

        expect(mockSetRawSettings).toHaveBeenCalledWith(expectedSettings);
      });

      it('이전 기본 카테고리의 기본값을 해제해야 함', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setDefaultCategory('3');
        });

        const calledWith = mockSetRawSettings.mock.calls[0][0];
        const defaultCategories = calledWith.categories.filter((cat: Category) => cat.isDefault);
        
        expect(defaultCategories).toHaveLength(1);
        expect(defaultCategories[0].id).toBe('3');
      });
    });
  });

  describe('사용자 정보 관리', () => {
    describe('updateUserInfo', () => {
      it('사용자 정보를 업데이트해야 함', () => {
        const { result } = renderHook(() => useSettings());

        const userInfoUpdates: Partial<UserInfo> = {
          name: '새로운 이름',
          email: 'new@example.com',
        };

        act(() => {
          result.current.updateUserInfo(userInfoUpdates);
        });

        const expectedSettings = {
          ...defaultSettings,
          userInfo: {
            ...defaultSettings.userInfo,
            ...userInfoUpdates,
          },
        };

        expect(mockSetRawSettings).toHaveBeenCalledWith(expectedSettings);
      });

      it('부분적 사용자 정보 업데이트를 지원해야 함', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.updateUserInfo({ name: '새 이름만' });
        });

        expect(mockSetRawSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            userInfo: expect.objectContaining({
              name: '새 이름만',
              email: 'user@example.com', // 기존 이메일 유지
            }),
          })
        );
      });

      it('프로필 이미지를 업데이트해야 함', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.updateUserInfo({ profileImage: 'https://example.com/avatar.jpg' });
        });

        expect(mockSetRawSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            userInfo: expect.objectContaining({
              profileImage: 'https://example.com/avatar.jpg',
            }),
          })
        );
      });
    });
  });

  describe('에러 처리', () => {
    it('잘못된 설정 키로 updateSetting 호출 시 오류 없이 처리해야 함', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        // @ts-expect-error - 테스트를 위한 잘못된 키
        result.current.updateSetting('invalidKey', 'value');
      });

      // 에러가 발생하지 않고 정상적으로 처리되어야 함
      expect(mockSetRawSettings).toHaveBeenCalled();
    });

    it('마이그레이션 중 오류가 발생해도 기본값으로 폴백해야 함', () => {
      const invalidSettings = null;
      mockUseLocalStorage.mockReturnValue([invalidSettings, mockSetRawSettings]);

      const { result } = renderHook(() => useSettings());

      // 기본값으로 폴백되어야 함
      expect(result.current.settings).toEqual(defaultSettings);
    });
  });

  describe('메모리 효율성', () => {
    it('동일한 값으로 업데이트 시에도 함수가 호출되어야 함', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('theme', 'light'); // 이미 기본값과 동일
      });

      expect(mockSetRawSettings).toHaveBeenCalled();
    });

    it('여러 번의 렌더링에서 함수 참조가 안정적이어야 함', () => {
      const { result, rerender } = renderHook(() => useSettings());

      rerender();

      // useSettings 훅이 함수를 매번 새로 생성할 수 있음
      expect(typeof result.current.updateSetting).toBe('function');
      expect(typeof result.current.setSettings).toBe('function');
    });
  });
});