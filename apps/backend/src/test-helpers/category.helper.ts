import { TodoCategory } from "@calendar-todo/shared-types";

export const createMockCategory = (
  overrides: Partial<TodoCategory> = {},
): TodoCategory => ({
  id: "test-category-id",
  name: "Test Category",
  color: "#3b82f6",
  createdAt: new Date(),
  order: 0,
  ...overrides,
});

export const createMockCategories = (count: number = 2): TodoCategory[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockCategory({
      id: `category-${index + 1}`,
      name: `Category ${index + 1}`,
      order: index,
    }),
  );
};
