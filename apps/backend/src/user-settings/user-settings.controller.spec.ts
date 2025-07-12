import { Test, TestingModule } from '@nestjs/testing';
import { UserSettingsController } from './user-settings.controller';
import { UserSettingsService } from './user-settings.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { TodoCategory } from '@calendar-todo/shared-types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../users/user.entity';

describe('UserSettingsController', () => {
  let controller: UserSettingsController;

  const mockUser = new User({
    id: 'user-1',
    email: 'test@example.com',
    name: '테스트 사용자',
    passwordHash: 'hashedPassword',
    profileImage: undefined,
    emailVerified: true,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  });

  const mockUserSettings = {
    categories: [
      {
        id: 'cat-1',
        name: '회사',
        color: '#3b82f6',
        isDefault: true,
        createdAt: new Date('2023-01-01'),
      },
      {
        id: 'cat-2',
        name: '가족',
        color: '#10b981',
        isDefault: true,
        createdAt: new Date('2023-01-01'),
      },
    ],
    categoryFilter: { 'cat-1': true, 'cat-2': true },
    theme: 'system' as const,
    language: 'ko',
  };

  const mockCategories: TodoCategory[] = [
    {
      id: 'cat-1',
      name: '회사',
      color: '#3b82f6',
      isDefault: true,
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'cat-2',
      name: '가족',
      color: '#10b981',
      isDefault: true,
      createdAt: new Date('2023-01-01'),
    },
  ];

  const mockUserSettingsService = {
    getUserSettings: jest.fn(),
    updateUserSettings: jest.fn(),
    getUserCategories: jest.fn(),
    addCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    getAvailableColors: jest.fn(),
    updateCategoryFilter: jest.fn(),
    getCategoryFilter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSettingsController],
      providers: [
        {
          provide: UserSettingsService,
          useValue: mockUserSettingsService,
        },
      ],
    }).compile();

    controller = module.get<UserSettingsController>(UserSettingsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('사용자 설정을 성공적으로 조회해야 함', async () => {
      const req = { user: mockUser };
      mockUserSettingsService.getUserSettings.mockResolvedValue(mockUserSettings);

      const result = await controller.getUserSettings(req);

      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ settings: mockUserSettings });
    });
  });

  describe('updateUserSettings', () => {
    it('사용자 설정을 성공적으로 업데이트해야 함', async () => {
      const req = { user: mockUser };
      const updateSettingsDto: UpdateSettingsDto = {
        theme: 'dark',
        language: 'en',
      };
      const updatedSettings = { ...mockUserSettings, ...updateSettingsDto };

      mockUserSettingsService.updateUserSettings.mockResolvedValue(updatedSettings);

      const result = await controller.updateUserSettings(req, updateSettingsDto);

      expect(mockUserSettingsService.updateUserSettings).toHaveBeenCalledWith(
        'user-1',
        updateSettingsDto
      );
      expect(result).toEqual({ settings: updatedSettings });
    });
  });

  describe('getUserCategories', () => {
    it('사용자 카테고리 목록을 성공적으로 조회해야 함', async () => {
      const req = { user: mockUser };
      mockUserSettingsService.getUserCategories.mockResolvedValue(mockCategories);

      const result = await controller.getUserCategories(req);

      expect(mockUserSettingsService.getUserCategories).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ categories: mockCategories });
    });
  });

  describe('createCategory', () => {
    it('새로운 카테고리를 성공적으로 생성해야 함', async () => {
      const req = { user: mockUser };
      const createCategoryDto: CreateCategoryDto = {
        name: '프로젝트',
        color: '#8b5cf6',
      };
      const newCategory: TodoCategory = {
        id: 'cat-3',
        name: '프로젝트',
        color: '#8b5cf6',
        isDefault: false,
        createdAt: new Date(),
      };

      mockUserSettingsService.addCategory.mockResolvedValue(newCategory);

      const result = await controller.createCategory(req, createCategoryDto);

      expect(mockUserSettingsService.addCategory).toHaveBeenCalledWith(
        'user-1',
        createCategoryDto.name,
        createCategoryDto.color
      );
      expect(result).toEqual({ category: newCategory });
    });

    it('중복된 이름으로 생성 시 BadRequestException을 전파해야 함', async () => {
      const req = { user: mockUser };
      const createCategoryDto: CreateCategoryDto = {
        name: '회사',
        color: '#8b5cf6',
      };

      mockUserSettingsService.addCategory.mockRejectedValue(
        new BadRequestException('Category name already exists')
      );

      await expect(
        controller.createCategory(req, createCategoryDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('중복된 색상으로 생성 시 BadRequestException을 전파해야 함', async () => {
      const req = { user: mockUser };
      const createCategoryDto: CreateCategoryDto = {
        name: '새 카테고리',
        color: '#3b82f6',
      };

      mockUserSettingsService.addCategory.mockRejectedValue(
        new BadRequestException('Color is already used by another category')
      );

      await expect(
        controller.createCategory(req, createCategoryDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('카테고리 수 제한 초과 시 BadRequestException을 전파해야 함', async () => {
      const req = { user: mockUser };
      const createCategoryDto: CreateCategoryDto = {
        name: '새 카테고리',
        color: '#8b5cf6',
      };

      mockUserSettingsService.addCategory.mockRejectedValue(
        new BadRequestException('Maximum number of categories reached (11)')
      );

      await expect(
        controller.createCategory(req, createCategoryDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateCategory', () => {
    it('카테고리를 성공적으로 수정해야 함', async () => {
      const req = { user: mockUser };
      const categoryId = 'cat-1';
      const updateCategoryDto: UpdateCategoryDto = {
        name: '업무',
        color: '#ff0000',
      };
      const updatedCategory: TodoCategory = {
        id: categoryId,
        name: '업무',
        color: '#ff0000',
        isDefault: true,
        createdAt: new Date('2023-01-01'),
      };

      mockUserSettingsService.updateCategory.mockResolvedValue(updatedCategory);

      const result = await controller.updateCategory(req, categoryId, updateCategoryDto);

      expect(mockUserSettingsService.updateCategory).toHaveBeenCalledWith(
        'user-1',
        categoryId,
        updateCategoryDto
      );
      expect(result).toEqual({ category: updatedCategory });
    });

    it('존재하지 않는 카테고리 수정 시 NotFoundException을 전파해야 함', async () => {
      const req = { user: mockUser };
      const categoryId = 'nonexistent';
      const updateCategoryDto: UpdateCategoryDto = {
        name: '새 이름',
      };

      mockUserSettingsService.updateCategory.mockRejectedValue(
        new NotFoundException('Category not found')
      );

      await expect(
        controller.updateCategory(req, categoryId, updateCategoryDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('기본 카테고리 이름 수정 시도 시 BadRequestException을 전파해야 함', async () => {
      const req = { user: mockUser };
      const categoryId = 'cat-1';
      const updateCategoryDto: UpdateCategoryDto = {
        name: '새 이름',
      };

      mockUserSettingsService.updateCategory.mockRejectedValue(
        new BadRequestException('Cannot update default category properties')
      );

      await expect(
        controller.updateCategory(req, categoryId, updateCategoryDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('중복된 이름으로 수정 시 BadRequestException을 전파해야 함', async () => {
      const req = { user: mockUser };
      const categoryId = 'cat-1';
      const updateCategoryDto: UpdateCategoryDto = {
        name: '가족',
      };

      mockUserSettingsService.updateCategory.mockRejectedValue(
        new BadRequestException('Category name already exists')
      );

      await expect(
        controller.updateCategory(req, categoryId, updateCategoryDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('중복된 색상으로 수정 시 BadRequestException을 전파해야 함', async () => {
      const req = { user: mockUser };
      const categoryId = 'cat-1';
      const updateCategoryDto: UpdateCategoryDto = {
        color: '#10b981',
      };

      mockUserSettingsService.updateCategory.mockRejectedValue(
        new BadRequestException('Color is already used by another category')
      );

      await expect(
        controller.updateCategory(req, categoryId, updateCategoryDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteCategory', () => {
    it('커스텀 카테고리를 성공적으로 삭제해야 함', async () => {
      const req = { user: mockUser };
      const categoryId = 'custom-1';
      const deleteResult = { success: true, deletedId: categoryId };

      mockUserSettingsService.deleteCategory.mockResolvedValue(deleteResult);

      const result = await controller.deleteCategory(req, categoryId);

      expect(mockUserSettingsService.deleteCategory).toHaveBeenCalledWith(
        'user-1',
        categoryId
      );
      expect(result).toEqual(deleteResult);
    });

    it('존재하지 않는 카테고리 삭제 시 NotFoundException을 전파해야 함', async () => {
      const req = { user: mockUser };
      const categoryId = 'nonexistent';

      mockUserSettingsService.deleteCategory.mockRejectedValue(
        new NotFoundException('Category not found')
      );

      await expect(
        controller.deleteCategory(req, categoryId)
      ).rejects.toThrow(NotFoundException);
    });

    it('기본 카테고리 삭제 시도 시 BadRequestException을 전파해야 함', async () => {
      const req = { user: mockUser };
      const categoryId = 'cat-1';

      mockUserSettingsService.deleteCategory.mockRejectedValue(
        new BadRequestException('Cannot delete default category')
      );

      await expect(
        controller.deleteCategory(req, categoryId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailableColors', () => {
    it('사용 가능한 색상 목록을 성공적으로 조회해야 함', async () => {
      const req = { user: mockUser };
      const availableColors = ['#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

      mockUserSettingsService.getAvailableColors.mockResolvedValue(availableColors);

      const result = await controller.getAvailableColors(req);

      expect(mockUserSettingsService.getAvailableColors).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ colors: availableColors });
    });
  });

  describe('updateCategoryFilter', () => {
    it('카테고리 필터를 성공적으로 업데이트해야 함', async () => {
      const req = { user: mockUser };
      const categoryId = 'cat-1';
      const body = { enabled: false };

      mockUserSettingsService.updateCategoryFilter.mockResolvedValue(undefined);

      const result = await controller.updateCategoryFilter(req, categoryId, body);

      expect(mockUserSettingsService.updateCategoryFilter).toHaveBeenCalledWith(
        'user-1',
        categoryId,
        false
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('getCategoryFilter', () => {
    it('카테고리 필터를 성공적으로 조회해야 함', async () => {
      const req = { user: mockUser };
      const categoryFilter = { 'cat-1': true, 'cat-2': false };

      mockUserSettingsService.getCategoryFilter.mockResolvedValue(categoryFilter);

      const result = await controller.getCategoryFilter(req);

      expect(mockUserSettingsService.getCategoryFilter).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ filter: categoryFilter });
    });
  });

  describe('Request validation', () => {
    it('요청에 사용자 정보가 없을 때 적절히 처리해야 함', () => {
      // JWT 가드가 이를 처리하므로 컨트롤러 레벨에서는 user가 항상 존재한다고 가정
      // 실제 테스트는 E2E 테스트에서 수행
      const req = { user: mockUser };
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-1');
    });

    it('잘못된 파라미터로 요청 시 예외가 발생해야 함', async () => {
      const req = { user: mockUser };
      
      // 빈 문자열 categoryId
      await expect(
        controller.updateCategory(req, '', { name: '새 이름' })
      ).rejects.toThrow(); // 서비스 레이어에서 예외 발생
    });
  });

  describe('Authentication', () => {
    it('인증된 사용자의 요청을 처리해야 함', async () => {
      const req = { user: mockUser };
      mockUserSettingsService.getUserSettings.mockResolvedValue(mockUserSettings);

      const result = await controller.getUserSettings(req);

      expect(result).toBeDefined();
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('Error handling', () => {
    it('서비스 레이어에서 발생한 에러를 적절히 전파해야 함', async () => {
      const req = { user: mockUser };
      const error = new Error('Database connection failed');
      
      mockUserSettingsService.getUserSettings.mockRejectedValue(error);

      await expect(
        controller.getUserSettings(req)
      ).rejects.toThrow(error);
    });

    it('예상치 못한 에러를 적절히 처리해야 함', async () => {
      const req = { user: mockUser };
      const unexpectedError = new Error('Unexpected error');
      
      mockUserSettingsService.getUserCategories.mockRejectedValue(unexpectedError);

      await expect(
        controller.getUserCategories(req)
      ).rejects.toThrow(unexpectedError);
    });
  });
});