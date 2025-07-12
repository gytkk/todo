import { UserSettingsEntity, UserCategoryData, UserSettingsData } from './user-settings.entity';

describe('UserSettingsEntity', () => {
  describe('constructor', () => {
    it('새로운 UserSettingsEntity를 기본값으로 생성해야 함', () => {
      const entity = new UserSettingsEntity({ userId: 'user-1' });

      expect(entity.userId).toBe('user-1');
      expect(entity.id).toBeDefined();
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.settings).toBeDefined();
      expect(entity.settings.categories).toHaveLength(3); // 기본 카테고리 3개
      expect(entity.settings.theme).toBe('system');
      expect(entity.settings.language).toBe('ko');
    });

    it('제공된 데이터로 UserSettingsEntity를 생성해야 함', () => {
      const customSettings: UserSettingsData = {
        categories: [{
          id: 'custom-1',
          name: '커스텀',
          color: '#FF0000',
          isDefault: false,
          createdAt: new Date(),
        }],
        categoryFilter: { 'custom-1': true },
        theme: 'dark',
        language: 'en',
      };

      const entity = new UserSettingsEntity({
        id: 'settings-1',
        userId: 'user-1',
        settings: customSettings,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      });

      expect(entity.id).toBe('settings-1');
      expect(entity.userId).toBe('user-1');
      expect(entity.settings.theme).toBe('dark');
      expect(entity.settings.language).toBe('en');
      expect(entity.settings.categories).toHaveLength(1);
      expect(entity.createdAt).toEqual(new Date('2023-01-01'));
      expect(entity.updatedAt).toEqual(new Date('2023-01-02'));
    });

    it('기본 카테고리가 올바르게 생성되어야 함', () => {
      const entity = new UserSettingsEntity({ userId: 'user-1' });
      const categories = entity.settings.categories;

      expect(categories).toHaveLength(3);
      
      const categoryNames = categories.map(cat => cat.name);
      expect(categoryNames).toContain('회사');
      expect(categoryNames).toContain('가족');
      expect(categoryNames).toContain('개인');

      // 모든 기본 카테고리는 isDefault가 true여야 함
      categories.forEach(cat => {
        expect(cat.isDefault).toBe(true);
        expect(cat.id).toBeDefined();
        expect(cat.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(cat.createdAt).toBeInstanceOf(Date);
      });
    });

    it('기본 카테고리 필터가 올바르게 설정되어야 함', () => {
      const entity = new UserSettingsEntity({ userId: 'user-1' });
      const filter = entity.settings.categoryFilter;

      // 모든 기본 카테고리가 true로 설정되어야 함
      entity.settings.categories.forEach(cat => {
        expect(filter[cat.id]).toBe(true);
      });
    });
  });

  describe('getCategories', () => {
    it('TodoCategory 형태로 카테고리를 반환해야 함', () => {
      const entity = new UserSettingsEntity({ userId: 'user-1' });
      const categories = entity.getCategories();

      expect(categories).toHaveLength(3);
      categories.forEach(cat => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('color');
        expect(cat).toHaveProperty('isDefault');
        expect(cat).toHaveProperty('createdAt');
        expect(cat.isDefault).toBe(true); // 기본 카테고리들
      });
    });
  });

  describe('addCategory', () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: 'user-1' });
    });

    it('새로운 카테고리를 성공적으로 추가해야 함', () => {
      const initialCount = entity.settings.categories.length;
      const oldUpdatedAt = entity.updatedAt;

      const categoryId = entity.addCategory('프로젝트', '#8B5CF6');

      expect(categoryId).toBeDefined();
      expect(entity.settings.categories).toHaveLength(initialCount + 1);
      
      const addedCategory = entity.getCategoryById(categoryId);
      expect(addedCategory).toBeDefined();
      expect(addedCategory!.name).toBe('프로젝트');
      expect(addedCategory!.color).toBe('#8B5CF6');
      expect(addedCategory!.isDefault).toBe(false);
      expect(addedCategory!.createdAt).toBeInstanceOf(Date);

      // 카테고리 필터가 true로 설정되어야 함
      expect(entity.settings.categoryFilter[categoryId]).toBe(true);

      // updatedAt이 갱신되어야 함
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('추가된 카테고리에 고유한 ID가 생성되어야 함', () => {
      const id1 = entity.addCategory('카테고리1', '#FF0000');
      const id2 = entity.addCategory('카테고리2', '#00FF00');

      expect(id1).not.toBe(id2);
      expect(entity.getCategoryById(id1)?.name).toBe('카테고리1');
      expect(entity.getCategoryById(id2)?.name).toBe('카테고리2');
    });
  });

  describe('updateCategory', () => {
    let entity: UserSettingsEntity;
    let customCategoryId: string;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: 'user-1' });
      customCategoryId = entity.addCategory('커스텀', '#FF0000');
    });

    it('커스텀 카테고리 이름을 성공적으로 수정해야 함', () => {
      const oldUpdatedAt = entity.updatedAt;

      const success = entity.updateCategory(customCategoryId, { name: '수정된 이름' });

      expect(success).toBe(true);
      const updatedCategory = entity.getCategoryById(customCategoryId);
      expect(updatedCategory!.name).toBe('수정된 이름');
      expect(updatedCategory!.color).toBe('#FF0000'); // 색상은 유지
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('커스텀 카테고리 색상을 성공적으로 수정해야 함', () => {
      const success = entity.updateCategory(customCategoryId, { color: '#00FF00' });

      expect(success).toBe(true);
      const updatedCategory = entity.getCategoryById(customCategoryId);
      expect(updatedCategory!.color).toBe('#00FF00');
      expect(updatedCategory!.name).toBe('커스텀'); // 이름은 유지
    });

    it('이름과 색상을 모두 수정해야 함', () => {
      const success = entity.updateCategory(customCategoryId, {
        name: '새로운 이름',
        color: '#0000FF'
      });

      expect(success).toBe(true);
      const updatedCategory = entity.getCategoryById(customCategoryId);
      expect(updatedCategory!.name).toBe('새로운 이름');
      expect(updatedCategory!.color).toBe('#0000FF');
    });

    it('기본 카테고리의 이름 수정을 거부해야 함', () => {
      const defaultCategories = entity.getCategories().filter(cat => cat.isDefault);
      const defaultCategoryId = defaultCategories[0].id;

      const success = entity.updateCategory(defaultCategoryId, { name: '수정된 기본 카테고리' });

      expect(success).toBe(false);
      const category = entity.getCategoryById(defaultCategoryId);
      expect(category!.name).not.toBe('수정된 기본 카테고리');
    });

    it('기본 카테고리의 색상은 수정할 수 있어야 함', () => {
      const defaultCategories = entity.getCategories().filter(cat => cat.isDefault);
      const defaultCategoryId = defaultCategories[0].id;
      const originalName = entity.getCategoryById(defaultCategoryId)!.name;

      const success = entity.updateCategory(defaultCategoryId, { color: '#ABCDEF' });

      expect(success).toBe(true);
      const category = entity.getCategoryById(defaultCategoryId);
      expect(category!.color).toBe('#ABCDEF');
      expect(category!.name).toBe(originalName); // 이름은 유지
    });

    it('존재하지 않는 카테고리 수정 시 false를 반환해야 함', () => {
      const success = entity.updateCategory('nonexistent-id', { name: '수정' });

      expect(success).toBe(false);
    });
  });

  describe('deleteCategory', () => {
    let entity: UserSettingsEntity;
    let customCategoryId: string;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: 'user-1' });
      customCategoryId = entity.addCategory('삭제할 카테고리', '#FF0000');
    });

    it('커스텀 카테고리를 성공적으로 삭제해야 함', () => {
      const initialCount = entity.settings.categories.length;
      const oldUpdatedAt = entity.updatedAt;

      const success = entity.deleteCategory(customCategoryId);

      expect(success).toBe(true);
      expect(entity.settings.categories).toHaveLength(initialCount - 1);
      expect(entity.getCategoryById(customCategoryId)).toBeNull();
      
      // 카테고리 필터에서도 제거되어야 함
      expect(entity.settings.categoryFilter[customCategoryId]).toBeUndefined();
      
      // updatedAt이 갱신되어야 함
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('기본 카테고리 삭제를 거부해야 함', () => {
      const defaultCategories = entity.getCategories().filter(cat => cat.isDefault);
      const defaultCategoryId = defaultCategories[0].id;
      const initialCount = entity.settings.categories.length;

      const success = entity.deleteCategory(defaultCategoryId);

      expect(success).toBe(false);
      expect(entity.settings.categories).toHaveLength(initialCount);
      expect(entity.getCategoryById(defaultCategoryId)).toBeDefined();
    });

    it('존재하지 않는 카테고리 삭제 시 false를 반환해야 함', () => {
      const success = entity.deleteCategory('nonexistent-id');

      expect(success).toBe(false);
    });
  });

  describe('getCategoryById', () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: 'user-1' });
    });

    it('존재하는 카테고리를 반환해야 함', () => {
      const categories = entity.getCategories();
      const categoryId = categories[0].id;

      const foundCategory = entity.getCategoryById(categoryId);

      expect(foundCategory).toBeDefined();
      expect(foundCategory!.id).toBe(categoryId);
    });

    it('존재하지 않는 카테고리에 대해 null을 반환해야 함', () => {
      const foundCategory = entity.getCategoryById('nonexistent-id');

      expect(foundCategory).toBeNull();
    });
  });

  describe('updateCategoryFilter', () => {
    let entity: UserSettingsEntity;
    let categoryId: string;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: 'user-1' });
      categoryId = entity.getCategories()[0].id;
    });

    it('카테고리 필터를 활성화해야 함', () => {
      const oldUpdatedAt = entity.updatedAt;
      
      entity.updateCategoryFilter(categoryId, true);
      
      expect(entity.settings.categoryFilter[categoryId]).toBe(true);
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('카테고리 필터를 비활성화해야 함', () => {
      entity.updateCategoryFilter(categoryId, false);

      expect(entity.settings.categoryFilter[categoryId]).toBe(false);
    });
  });

  describe('getAvailableColors', () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: 'user-1' });
    });

    it('사용되지 않은 색상들을 반환해야 함', () => {
      const availableColors = entity.getAvailableColors();
      const usedColors = entity.settings.categories.map(cat => cat.color);

      // 사용된 색상이 available colors에 포함되지 않아야 함
      usedColors.forEach(usedColor => {
        expect(availableColors).not.toContain(usedColor);
      });

      // 모든 반환된 색상이 유효한 헥스 색상이어야 함
      availableColors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('새 카테고리를 추가하면 해당 색상이 available colors에서 제거되어야 함', () => {
      const initialAvailableColors = entity.getAvailableColors();
      const colorToUse = initialAvailableColors[0];

      entity.addCategory('새 카테고리', colorToUse);

      const updatedAvailableColors = entity.getAvailableColors();
      expect(updatedAvailableColors).not.toContain(colorToUse);
      expect(updatedAvailableColors).toHaveLength(initialAvailableColors.length - 1);
    });
  });

  describe('updateSettings', () => {
    let entity: UserSettingsEntity;

    beforeEach(() => {
      entity = new UserSettingsEntity({ userId: 'user-1' });
    });

    it('설정을 부분적으로 업데이트해야 함', () => {
      const oldUpdatedAt = entity.updatedAt;
      const originalCategories = entity.settings.categories;

      entity.updateSettings({
        theme: 'dark',
        language: 'en'
      });

      expect(entity.settings.theme).toBe('dark');
      expect(entity.settings.language).toBe('en');
      expect(entity.settings.categories).toBe(originalCategories); // 다른 설정은 유지
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('전체 설정을 업데이트해야 함', () => {
      const newSettings: UserSettingsData = {
        categories: [{
          id: 'new-cat',
          name: '새 카테고리',
          color: '#123456',
          isDefault: false,
          createdAt: new Date(),
        }],
        categoryFilter: { 'new-cat': true },
        theme: 'light',
        language: 'ko',
      };

      entity.updateSettings(newSettings);

      expect(entity.settings).toEqual(newSettings);
    });
  });

  describe('createDefault', () => {
    it('기본 설정으로 새 UserSettingsEntity를 생성해야 함', () => {
      const entity = UserSettingsEntity.createDefault('user-123');

      expect(entity.userId).toBe('user-123');
      expect(entity.id).toBeDefined();
      expect(entity.settings.categories).toHaveLength(3);
      expect(entity.settings.theme).toBe('system');
      expect(entity.settings.language).toBe('ko');
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });
  });
});