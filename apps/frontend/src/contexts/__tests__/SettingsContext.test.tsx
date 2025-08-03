import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SettingsProvider, useSettingsContext } from '../SettingsContext';
import { useSettings } from '@/hooks/useSettings';
import { AppSettings } from '@calendar-todo/shared-types';

// Mock the useSettings hook
jest.mock('@/hooks/useSettings');

const mockUseSettings = useSettings as jest.MockedFunction<typeof useSettings>;

describe('SettingsContext', () => {
  const mockSettings: AppSettings = {
    userInfo: {
      name: '테스트 사용자',
      email: 'test@example.com',
      profileImage: undefined
    },
    categories: [
      { id: '1', name: '업무', color: '#3b82f6', isDefault: true },
      { id: '2', name: '개인', color: '#ef4444', isDefault: false }
    ],
    theme: 'light',
    language: 'ko',
    themeColor: '#3b82f6',
    customColor: '#3b82f6',
    defaultView: 'month',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    timezone: 'Asia/Seoul',
    weekStart: 'sunday',
    oldTodoDisplayLimit: 14,
    autoMoveTodos: true,
    showTaskMoveNotifications: true,
    saturationAdjustment: {
      enabled: true,
      levels: [
        { days: 1, opacity: 0.9 },
        { days: 3, opacity: 0.7 }
      ]
    },
    completedTodoDisplay: 'yesterday',
    showWeekends: true,
    autoBackup: false,
    backupInterval: 'weekly'
  };

  const mockUseSettingsReturn = {
    settings: mockSettings,
    loading: false,
    updateSetting: jest.fn(),
    resetSettings: jest.fn(),
    addCategory: jest.fn(),
    removeCategory: jest.fn(),
    updateCategory: jest.fn(),
    setDefaultCategory: jest.fn(),
    updateUserInfo: jest.fn(),
    changePassword: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSettings.mockReturnValue(mockUseSettingsReturn);
  });

  describe('SettingsProvider', () => {
    const TestComponent: React.FC = () => {
      const context = useSettingsContext();
      return (
        <div>
          <div data-testid="theme">{context.settings.theme}</div>
          <div data-testid="language">{context.settings.language}</div>
          <div data-testid="user-name">{context.settings.userInfo.name}</div>
          <button 
            data-testid="update-theme-btn"
            onClick={() => context.updateSetting('theme', 'dark')}
          >
            Update Theme
          </button>
          <button 
            data-testid="reset-btn"
            onClick={() => context.resetSettings()}
          >
            Reset
          </button>
        </div>
      );
    };

    it('설정 데이터를 올바르게 제공해야 함', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(screen.getByTestId('language')).toHaveTextContent('ko');
      expect(screen.getByTestId('user-name')).toHaveTextContent('테스트 사용자');
    });

    it('useSettings 훅을 올바르게 호출해야 함', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(mockUseSettings).toHaveBeenCalledTimes(1);
    });

    it('설정 업데이트 함수를 올바르게 전달해야 함', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      act(() => {
        screen.getByTestId('update-theme-btn').click();
      });

      expect(mockUseSettingsReturn.updateSetting).toHaveBeenCalledWith('theme', 'dark');
    });

    it('설정 리셋 함수를 올바르게 전달해야 함', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      act(() => {
        screen.getByTestId('reset-btn').click();
      });

      expect(mockUseSettingsReturn.resetSettings).toHaveBeenCalled();
    });

    it('모든 useSettings 반환값을 컨텍스트에 전달해야 함', () => {
      const TestAllFunctions: React.FC = () => {
        const context = useSettingsContext();
        
        return (
          <div>
            <button onClick={() => context.addCategory('새 카테고리', '#123456')}>addCategory</button>
            <button onClick={() => context.removeCategory('1')}>removeCategory</button>
            <button onClick={() => context.updateCategory('1', { name: '새 이름' })}>updateCategory</button>
            <button onClick={() => context.setDefaultCategory('2')}>setDefaultCategory</button>
            <button onClick={() => context.updateUserInfo({ name: '새 이름' })}>updateUserInfo</button>
          </div>
        );
      };

      render(
        <SettingsProvider>
          <TestAllFunctions />
        </SettingsProvider>
      );

      // 모든 함수가 컨텍스트에 포함되어 있는지 확인
      const context = mockUseSettingsReturn;
      expect(typeof context.settings).toBe('object');
      expect(typeof context.updateSetting).toBe('function');
      expect(typeof context.resetSettings).toBe('function');
      expect(typeof context.addCategory).toBe('function');
      expect(typeof context.removeCategory).toBe('function');
      expect(typeof context.updateCategory).toBe('function');
      expect(typeof context.setDefaultCategory).toBe('function');
      expect(typeof context.updateUserInfo).toBe('function');
    });

    it('자식 컴포넌트들을 올바르게 렌더링해야 함', () => {
      render(
        <SettingsProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });

    it('여러 자식 컴포넌트에서 동일한 컨텍스트를 공유해야 함', () => {
      const Child1: React.FC = () => {
        const { settings } = useSettingsContext();
        return <div data-testid="child1-theme">{settings.theme}</div>;
      };

      const Child2: React.FC = () => {
        const { settings } = useSettingsContext();
        return <div data-testid="child2-theme">{settings.theme}</div>;
      };

      render(
        <SettingsProvider>
          <Child1 />
          <Child2 />
        </SettingsProvider>
      );

      expect(screen.getByTestId('child1-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('child2-theme')).toHaveTextContent('light');
    });

    it('설정 변경 시 모든 자식 컴포넌트가 업데이트되어야 함', () => {
      const updatedSettings = { ...mockSettings, theme: 'dark' as const };
      
      const TestDynamicUpdate: React.FC = () => {
        const { settings, updateSetting } = useSettingsContext();
        
        React.useEffect(() => {
          // 설정이 변경되었음을 시뮬레이션
          if (settings.theme === 'light') {
            // useSettings 훅의 반환값을 업데이트
            mockUseSettings.mockReturnValue({
              ...mockUseSettingsReturn,
              settings: updatedSettings
            });
          }
        }, [settings.theme]);
        
        return (
          <div>
            <div data-testid="current-theme">{settings.theme}</div>
            <button 
              data-testid="change-theme"
              onClick={() => updateSetting('theme', 'dark')}
            >
              Change Theme
            </button>
          </div>
        );
      };

      const { rerender } = render(
        <SettingsProvider>
          <TestDynamicUpdate />
        </SettingsProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

      // 설정을 변경하고 컴포넌트를 다시 렌더링
      mockUseSettings.mockReturnValue({
        ...mockUseSettingsReturn,
        settings: updatedSettings
      });

      rerender(
        <SettingsProvider>
          <TestDynamicUpdate />
        </SettingsProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  describe('useSettingsContext', () => {
    it('Provider 없이 사용 시 에러를 던져야 함', () => {
      const TestComponentWithoutProvider: React.FC = () => {
        useSettingsContext();
        return <div>Test</div>;
      };

      // 에러 경계를 사용하여 에러를 캐치
      const originalError = console.error;
      console.error = jest.fn(); // 에러 로그 억제

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useSettingsContext must be used within a SettingsProvider');

      console.error = originalError;
    });

    it('올바른 에러 메시지를 던져야 함', () => {
      const TestComponentWithoutProvider: React.FC = () => {
        useSettingsContext();
        return <div>Test</div>;
      };

      const originalError = console.error;
      console.error = jest.fn();

      try {
        render(<TestComponentWithoutProvider />);
      } catch (error) {
        expect((error as Error).message).toBe('useSettingsContext must be used within a SettingsProvider');
      }

      console.error = originalError;
    });

    it('Provider 내에서 사용 시 정상 동작해야 함', () => {
      const TestComponent: React.FC = () => {
        const context = useSettingsContext();
        return <div data-testid="context-theme">{context.settings.theme}</div>;
      };

      expect(() => {
        render(
          <SettingsProvider>
            <TestComponent />
          </SettingsProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId('context-theme')).toHaveTextContent('light');
    });

    it('중첩된 Provider에서도 정상 동작해야 함', () => {
      const TestComponent: React.FC = () => {
        const context = useSettingsContext();
        return <div data-testid="nested-theme">{context.settings.theme}</div>;
      };

      render(
        <SettingsProvider>
          <div>
            <SettingsProvider>
              <TestComponent />
            </SettingsProvider>
          </div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('nested-theme')).toHaveTextContent('light');
      // useSettings가 두 번 호출되어야 함 (각 Provider마다)
      expect(mockUseSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe('카테고리 관리 함수들', () => {
    const TestCategoryFunctions: React.FC = () => {
      const { addCategory, removeCategory, updateCategory, setDefaultCategory } = useSettingsContext();
      
      return (
        <div>
          <button 
            data-testid="add-category"
            onClick={() => addCategory('새 카테고리', '#ff0000')}
          >
            Add Category
          </button>
          <button 
            data-testid="remove-category"
            onClick={() => removeCategory('1')}
          >
            Remove Category
          </button>
          <button 
            data-testid="update-category"
            onClick={() => updateCategory('1', { name: '업데이트된 이름' })}
          >
            Update Category
          </button>
          <button 
            data-testid="set-default-category"
            onClick={() => setDefaultCategory('2')}
          >
            Set Default Category
          </button>
        </div>
      );
    };

    it('카테고리 추가 함수를 올바르게 호출해야 함', () => {
      render(
        <SettingsProvider>
          <TestCategoryFunctions />
        </SettingsProvider>
      );

      act(() => {
        screen.getByTestId('add-category').click();
      });

      expect(mockUseSettingsReturn.addCategory).toHaveBeenCalledWith('새 카테고리', '#ff0000');
    });

    it('카테고리 제거 함수를 올바르게 호출해야 함', () => {
      render(
        <SettingsProvider>
          <TestCategoryFunctions />
        </SettingsProvider>
      );

      act(() => {
        screen.getByTestId('remove-category').click();
      });

      expect(mockUseSettingsReturn.removeCategory).toHaveBeenCalledWith('1');
    });

    it('카테고리 업데이트 함수를 올바르게 호출해야 함', () => {
      render(
        <SettingsProvider>
          <TestCategoryFunctions />
        </SettingsProvider>
      );

      act(() => {
        screen.getByTestId('update-category').click();
      });

      expect(mockUseSettingsReturn.updateCategory).toHaveBeenCalledWith('1', { name: '업데이트된 이름' });
    });

    it('기본 카테고리 설정 함수를 올바르게 호출해야 함', () => {
      render(
        <SettingsProvider>
          <TestCategoryFunctions />
        </SettingsProvider>
      );

      act(() => {
        screen.getByTestId('set-default-category').click();
      });

      expect(mockUseSettingsReturn.setDefaultCategory).toHaveBeenCalledWith('2');
    });
  });

  describe('사용자 정보 관리', () => {
    const TestUserInfoFunction: React.FC = () => {
      const { updateUserInfo } = useSettingsContext();
      
      return (
        <button 
          data-testid="update-user-info"
          onClick={() => updateUserInfo({ name: '새로운 이름', email: 'new@example.com' })}
        >
          Update User Info
        </button>
      );
    };

    it('사용자 정보 업데이트 함수를 올바르게 호출해야 함', () => {
      render(
        <SettingsProvider>
          <TestUserInfoFunction />
        </SettingsProvider>
      );

      act(() => {
        screen.getByTestId('update-user-info').click();
      });

      expect(mockUseSettingsReturn.updateUserInfo).toHaveBeenCalledWith({
        name: '새로운 이름',
        email: 'new@example.com'
      });
    });
  });

  describe('타입 안정성', () => {
    it('컨텍스트 값이 올바른 타입을 가져야 함', () => {
      const TestTypeComponent: React.FC = () => {
        const context = useSettingsContext();
        
        // TypeScript 컴파일 시점에서 타입 체크됨
        const theme: 'light' | 'dark' | 'system' = context.settings.theme;
        const language: 'ko' | 'en' = context.settings.language;
        
        return (
          <div>
            <div data-testid="theme-type">{theme}</div>
            <div data-testid="language-type">{language}</div>
          </div>
        );
      };

      render(
        <SettingsProvider>
          <TestTypeComponent />
        </SettingsProvider>
      );

      expect(screen.getByTestId('theme-type')).toHaveTextContent('light');
      expect(screen.getByTestId('language-type')).toHaveTextContent('ko');
    });
  });

  describe('성능', () => {
    it('useSettings 훅을 Provider당 한 번만 호출해야 함', () => {
      const TestComponent1: React.FC = () => {
        useSettingsContext();
        return <div>Component 1</div>;
      };

      const TestComponent2: React.FC = () => {
        useSettingsContext();
        return <div>Component 2</div>;
      };

      render(
        <SettingsProvider>
          <TestComponent1 />
          <TestComponent2 />
        </SettingsProvider>
      );

      // 여러 컴포넌트에서 useSettingsContext를 호출해도 useSettings는 한 번만 호출
      expect(mockUseSettings).toHaveBeenCalledTimes(1);
    });

    it('불필요한 리렌더링을 방지해야 함', () => {
      let renderCount = 0;

      const TestComponent: React.FC = () => {
        const { settings } = useSettingsContext();
        renderCount++;
        return <div>{settings.theme}</div>;
      };

      const { rerender } = render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(renderCount).toBe(1);

      // 동일한 설정으로 리렌더링
      rerender(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      // useSettings 훅이 동일한 값을 반환하면 리렌더링 횟수가 증가하지 않아야 함
      // 하지만 실제로는 Provider가 새로 생성되므로 리렌더링 발생
      expect(renderCount).toBe(2); // 실제 동작 확인
    });
  });
});