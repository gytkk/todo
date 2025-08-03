import { TodoCategory } from "@calendar-todo/shared-types";
import { createMockCategory, createMockCategories } from "../category.helper";

describe("category.helper", () => {
  describe("createMockCategory", () => {
    it("기본값으로 모킹 카테고리를 생성해야 함", () => {
      const mockCategory = createMockCategory();

      expect(mockCategory).toEqual({
        id: "test-category-id",
        name: "Test Category",
        color: "#3b82f6",
        createdAt: expect.any(Date) as Date,
        order: 0,
      });
    });

    it("제공된 overrides로 카테고리를 생성해야 함", () => {
      const customDate = new Date("2024-01-01");
      const overrides: Partial<TodoCategory> = {
        id: "custom-id",
        name: "Custom Category",
        color: "#ff0000",
        createdAt: customDate,
        order: 5,
      };

      const mockCategory = createMockCategory(overrides);

      expect(mockCategory).toEqual({
        id: "custom-id",
        name: "Custom Category",
        color: "#ff0000",
        createdAt: customDate,
        order: 5,
      });
    });

    it("부분적인 overrides만 제공해도 나머지는 기본값으로 설정되어야 함", () => {
      const overrides: Partial<TodoCategory> = {
        name: "Partial Override",
        color: "#00ff00",
      };

      const mockCategory = createMockCategory(overrides);

      expect(mockCategory).toEqual({
        id: "test-category-id", // 기본값
        name: "Partial Override", // override
        color: "#00ff00", // override
        createdAt: expect.any(Date) as Date, // 기본값
        order: 0, // 기본값
      });
    });

    it("빈 객체를 overrides로 제공해도 기본값으로 설정되어야 함", () => {
      const mockCategory = createMockCategory({});

      expect(mockCategory).toEqual({
        id: "test-category-id",
        name: "Test Category",
        color: "#3b82f6",
        createdAt: expect.any(Date) as Date,
        order: 0,
      });
    });

    it("ID만 변경하는 경우", () => {
      const mockCategory = createMockCategory({ id: "new-id" });

      expect(mockCategory.id).toBe("new-id");
      expect(mockCategory.name).toBe("Test Category");
      expect(mockCategory.color).toBe("#3b82f6");
      expect(mockCategory.order).toBe(0);
    });

    it("이름만 변경하는 경우", () => {
      const mockCategory = createMockCategory({ name: "Updated Name" });

      expect(mockCategory.id).toBe("test-category-id");
      expect(mockCategory.name).toBe("Updated Name");
      expect(mockCategory.color).toBe("#3b82f6");
      expect(mockCategory.order).toBe(0);
    });

    it("색상만 변경하는 경우", () => {
      const mockCategory = createMockCategory({ color: "#purple" });

      expect(mockCategory.id).toBe("test-category-id");
      expect(mockCategory.name).toBe("Test Category");
      expect(mockCategory.color).toBe("#purple");
      expect(mockCategory.order).toBe(0);
    });

    it("order만 변경하는 경우", () => {
      const mockCategory = createMockCategory({ order: 10 });

      expect(mockCategory.id).toBe("test-category-id");
      expect(mockCategory.name).toBe("Test Category");
      expect(mockCategory.color).toBe("#3b82f6");
      expect(mockCategory.order).toBe(10);
    });

    it("createdAt만 변경하는 경우", () => {
      const customDate = new Date("2023-12-25");
      const mockCategory = createMockCategory({ createdAt: customDate });

      expect(mockCategory.id).toBe("test-category-id");
      expect(mockCategory.name).toBe("Test Category");
      expect(mockCategory.color).toBe("#3b82f6");
      expect(mockCategory.order).toBe(0);
      expect(mockCategory.createdAt).toBe(customDate);
    });

    it("createdAt이 올바른 Date 객체여야 함", () => {
      const mockCategory = createMockCategory();

      expect(mockCategory.createdAt).toBeInstanceOf(Date);
      expect(mockCategory.createdAt.getTime()).not.toBeNaN();
    });

    it("연속으로 호출해도 독립적인 객체를 반환해야 함", () => {
      const category1 = createMockCategory();
      const category2 = createMockCategory();

      expect(category1).not.toBe(category2); // 참조가 다름
      expect(category1.createdAt).not.toBe(category2.createdAt); // Date 객체도 다름
      expect(category1).toEqual(category2); // 하지만 내용은 같음
    });
  });

  describe("createMockCategories", () => {
    it("기본값(2개)으로 카테고리 배열을 생성해야 함", () => {
      const categories = createMockCategories();

      expect(categories).toHaveLength(2);
      expect(categories[0]).toEqual({
        id: "category-1",
        name: "Category 1",
        color: "#3b82f6",
        createdAt: expect.any(Date) as Date,
        order: 0,
      });
      expect(categories[1]).toEqual({
        id: "category-2",
        name: "Category 2",
        color: "#3b82f6",
        createdAt: expect.any(Date) as Date,
        order: 1,
      });
    });

    it("지정된 개수만큼 카테고리를 생성해야 함", () => {
      const categories = createMockCategories(5);

      expect(categories).toHaveLength(5);
      categories.forEach((category, index) => {
        expect(category.id).toBe(`category-${index + 1}`);
        expect(category.name).toBe(`Category ${index + 1}`);
        expect(category.order).toBe(index);
      });
    });

    it("0개 카테고리 생성 시 빈 배열을 반환해야 함", () => {
      const categories = createMockCategories(0);

      expect(categories).toHaveLength(0);
      expect(categories).toEqual([]);
    });

    it("1개 카테고리 생성 시", () => {
      const categories = createMockCategories(1);

      expect(categories).toHaveLength(1);
      expect(categories[0]).toEqual({
        id: "category-1",
        name: "Category 1",
        color: "#3b82f6",
        createdAt: expect.any(Date) as Date,
        order: 0,
      });
    });

    it("10개 카테고리 생성 시 올바른 순서와 ID를 가져야 함", () => {
      const categories = createMockCategories(10);

      expect(categories).toHaveLength(10);

      categories.forEach((category, index) => {
        expect(category.id).toBe(`category-${index + 1}`);
        expect(category.name).toBe(`Category ${index + 1}`);
        expect(category.order).toBe(index);
        expect(category.color).toBe("#3b82f6");
        expect(category.createdAt).toBeInstanceOf(Date);
      });
    });

    it("각 카테고리는 독립적인 객체여야 함", () => {
      const categories = createMockCategories(3);

      // 각 카테고리는 서로 다른 객체 참조를 가져야 함
      expect(categories[0]).not.toBe(categories[1]);
      expect(categories[1]).not.toBe(categories[2]);
      expect(categories[0]).not.toBe(categories[2]);

      // createdAt도 각각 다른 객체여야 함
      expect(categories[0].createdAt).not.toBe(categories[1].createdAt);
      expect(categories[1].createdAt).not.toBe(categories[2].createdAt);
    });

    it("order 값이 인덱스와 일치해야 함", () => {
      const categories = createMockCategories(5);

      categories.forEach((category, index) => {
        expect(category.order).toBe(index);
      });
    });

    it("ID가 순차적으로 증가해야 함", () => {
      const categories = createMockCategories(3);

      expect(categories[0].id).toBe("category-1");
      expect(categories[1].id).toBe("category-2");
      expect(categories[2].id).toBe("category-3");
    });

    it("이름이 순차적으로 증가해야 함", () => {
      const categories = createMockCategories(3);

      expect(categories[0].name).toBe("Category 1");
      expect(categories[1].name).toBe("Category 2");
      expect(categories[2].name).toBe("Category 3");
    });

    it("모든 카테고리가 같은 기본 색상을 가져야 함", () => {
      const categories = createMockCategories(4);

      categories.forEach((category) => {
        expect(category.color).toBe("#3b82f6");
      });
    });

    it("매번 호출할 때마다 새로운 배열과 객체를 반환해야 함", () => {
      const categories1 = createMockCategories(2);
      const categories2 = createMockCategories(2);

      expect(categories1).not.toBe(categories2); // 배열 참조가 다름
      expect(categories1[0]).not.toBe(categories2[0]); // 첫 번째 요소 참조가 다름
      expect(categories1[1]).not.toBe(categories2[1]); // 두 번째 요소 참조가 다름

      // 하지만 내용은 같아야 함
      expect(categories1).toEqual(categories2);
    });
  });

  describe("통합 테스트", () => {
    it("createMockCategories로 생성한 카테고리들이 createMockCategory 기본값과 일치해야 함", () => {
      const singleCategory = createMockCategory({
        id: "category-1",
        name: "Category 1",
        order: 0,
      });
      const multipleCategories = createMockCategories(1);

      expect(multipleCategories[0]).toEqual(singleCategory);
    });

    it("다양한 크기의 배열 생성이 모두 정상 작동해야 함", () => {
      const sizes = [0, 1, 2, 5, 10, 100];

      sizes.forEach((size) => {
        const categories = createMockCategories(size);
        expect(categories).toHaveLength(size);

        if (size > 0) {
          expect(categories[0].id).toBe("category-1");
          expect(categories[size - 1].id).toBe(`category-${size}`);
        }
      });
    });
  });

  describe("타입 안전성", () => {
    it("반환된 객체가 TodoCategory 타입과 일치해야 함", () => {
      const category = createMockCategory();

      // TypeScript 컴파일 시점에서 타입 검사가 되므로,
      // 런타임에서는 필수 속성들이 존재하는지 확인
      expect(typeof category.id).toBe("string");
      expect(typeof category.name).toBe("string");
      expect(typeof category.color).toBe("string");
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(typeof category.order).toBe("number");
    });

    it("배열의 모든 요소가 TodoCategory 타입과 일치해야 함", () => {
      const categories = createMockCategories(3);

      categories.forEach((category) => {
        expect(typeof category.id).toBe("string");
        expect(typeof category.name).toBe("string");
        expect(typeof category.color).toBe("string");
        expect(category.createdAt).toBeInstanceOf(Date);
        expect(typeof category.order).toBe("number");
      });
    });
  });

  describe("극단적인 경우", () => {
    it("매우 큰 숫자로 카테고리 생성 시", () => {
      const largeNumber = 1000;
      const categories = createMockCategories(largeNumber);

      expect(categories).toHaveLength(largeNumber);
      expect(categories[0].id).toBe("category-1");
      expect(categories[largeNumber - 1].id).toBe(`category-${largeNumber}`);
    });

    it("undefined를 overrides로 전달해도 정상 작동해야 함", () => {
      const category = createMockCategory(undefined);

      expect(category).toEqual({
        id: "test-category-id",
        name: "Test Category",
        color: "#3b82f6",
        createdAt: expect.any(Date) as Date,
        order: 0,
      });
    });
  });
});
