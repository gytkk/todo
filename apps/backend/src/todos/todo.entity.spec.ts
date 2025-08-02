import { TodoEntity } from "./todo.entity";
import { TodoCategory } from "@calendar-todo/shared-types";

describe("TodoEntity", () => {
  const mockDate = new Date("2024-01-15");
  const mockCategory: TodoCategory = {
    id: "work",
    name: "업무",
    color: "#FF6B6B",
    icon: "💼",
    createdAt: new Date("2023-01-01"),
    order: 0,
  };

  describe("constructor", () => {
    it("should create entity with all provided fields", () => {
      const data = {
        id: "todo-1",
        title: "Test Todo",
        description: "Test Description",
        completed: true,
        priority: "high" as const,
        categoryId: "work",
        todoType: "task" as const,
        dueDate: mockDate,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
        userId: "user-1",
      };

      const entity = new TodoEntity(data);

      expect(entity.id).toBe(data.id);
      expect(entity.title).toBe(data.title);
      expect(entity.description).toBe(data.description);
      expect(entity.completed).toBe(data.completed);
      expect(entity.priority).toBe(data.priority);
      expect(entity.categoryId).toBe(data.categoryId);
      expect(entity.todoType).toBe(data.todoType);
      expect(entity.dueDate).toBe(data.dueDate);
      expect(entity.createdAt).toBe(data.createdAt);
      expect(entity.updatedAt).toBe(data.updatedAt);
      expect(entity.userId).toBe(data.userId);
    });

    it("should set default todoType to 'event' when not provided", () => {
      const entity = new TodoEntity({
        title: "Test Todo",
        userId: "user-1",
      });

      expect(entity.todoType).toBe("event");
    });

    it("should use provided todoType when specified", () => {
      const entity = new TodoEntity({
        title: "Test Todo",
        userId: "user-1",
        todoType: "task",
      });

      expect(entity.todoType).toBe("task");
    });

    it("should generate UUID if id not provided", () => {
      const entity = new TodoEntity({
        title: "Test Todo",
        userId: "user-1",
      });

      expect(entity.id).toBeDefined();
      expect(entity.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should set default values for optional fields", () => {
      const entity = new TodoEntity({
        userId: "user-1",
      });

      expect(entity.title).toBe("");
      expect(entity.description).toBeUndefined();
      expect(entity.completed).toBe(false);
      expect(entity.priority).toBe("medium");
      expect(entity.categoryId).toBe("personal");
      expect(entity.todoType).toBe("event");
      expect(entity.dueDate).toBeInstanceOf(Date);
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("toTodoItem", () => {
    const entity = new TodoEntity({
      id: "todo-1",
      title: "Test Todo",
      description: "Test Description",
      completed: false,
      priority: "high",
      categoryId: "work",
      todoType: "task",
      dueDate: mockDate,
      userId: "user-1",
    });

    it("should convert entity to TodoItem with category", () => {
      const todoItem = entity.toTodoItem(mockCategory);

      expect(todoItem).toEqual({
        id: "todo-1",
        title: "Test Todo",
        date: mockDate,
        completed: false,
        category: mockCategory,
        todoType: "task",
        userId: "user-1",
      });
    });

    it("should convert entity to TodoItem without category", () => {
      const todoItem = entity.toTodoItem();

      expect(todoItem).toEqual({
        id: "todo-1",
        title: "Test Todo",
        date: mockDate,
        completed: false,
        category: {
          id: "work",
          name: "Unknown",
          color: "#64748b",
          createdAt: expect.any(Date) as Date,
          order: 0,
        },
        todoType: "task",
        userId: "user-1",
      });
    });

    it("should preserve todoType in conversion", () => {
      const eventEntity = new TodoEntity({
        ...entity,
        todoType: "event",
      });

      const taskEntity = new TodoEntity({
        ...entity,
        todoType: "task",
      });

      expect(eventEntity.toTodoItem(mockCategory).todoType).toBe("event");
      expect(taskEntity.toTodoItem(mockCategory).todoType).toBe("task");
    });
  });

  describe("update", () => {
    let entity: TodoEntity;

    beforeEach(() => {
      entity = new TodoEntity({
        id: "todo-1",
        title: "Original Title",
        description: "Original Description",
        completed: false,
        priority: "medium",
        categoryId: "personal",
        todoType: "event",
        dueDate: mockDate,
        userId: "user-1",
      });
    });

    it("should update todoType field", () => {
      const originalUpdatedAt = entity.updatedAt;

      // Create a future date
      const futureTime = originalUpdatedAt.getTime() + 1000;
      const mockDate = new Date(futureTime);
      jest.spyOn(global, "Date").mockImplementation((() => mockDate) as any);

      entity.update({ todoType: "task" });

      expect(entity.todoType).toBe("task");
      expect(entity.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );

      jest.restoreAllMocks();
    });

    it("should update multiple fields including todoType", () => {
      entity.update({
        title: "Updated Title",
        completed: true,
        todoType: "task",
        priority: "high",
      });

      expect(entity.title).toBe("Updated Title");
      expect(entity.completed).toBe(true);
      expect(entity.todoType).toBe("task");
      expect(entity.priority).toBe("high");
    });

    it("should not change todoType if not provided in update", () => {
      entity.update({
        title: "Updated Title",
        completed: true,
      });

      expect(entity.todoType).toBe("event"); // Original value
    });

    it("should handle undefined todoType in update", () => {
      entity.update({ todoType: undefined });
      expect(entity.todoType).toBe("event"); // Should not change
    });

    it("should update only specified fields", () => {
      const originalTitle = entity.title;
      const originalDescription = entity.description;
      const originalCompleted = entity.completed;
      const originalPriority = entity.priority;
      const originalCategoryId = entity.categoryId;
      const originalDueDate = entity.dueDate;

      entity.update({ todoType: "task" });

      expect(entity.title).toBe(originalTitle);
      expect(entity.description).toBe(originalDescription);
      expect(entity.completed).toBe(originalCompleted);
      expect(entity.priority).toBe(originalPriority);
      expect(entity.categoryId).toBe(originalCategoryId);
      expect(entity.dueDate).toBe(originalDueDate);
      expect(entity.todoType).toBe("task");
    });

    it("should update updatedAt timestamp", () => {
      const originalUpdatedAt = entity.updatedAt;

      // Simulate time passing by creating a future date
      const futureTime = originalUpdatedAt.getTime() + 1000;
      const mockDate = new Date(futureTime);
      jest.spyOn(global, "Date").mockImplementation((() => mockDate) as any);

      entity.update({ todoType: "task" });

      expect(entity.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );

      jest.restoreAllMocks();
    });
  });

  describe("toggleComplete", () => {
    it("should toggle completion status", () => {
      const entity = new TodoEntity({
        completed: false,
        userId: "user-1",
      });

      entity.toggleComplete();
      expect(entity.completed).toBe(true);

      entity.toggleComplete();
      expect(entity.completed).toBe(false);
    });

    it("should update updatedAt when toggling", () => {
      const entity = new TodoEntity({
        userId: "user-1",
      });
      const originalUpdatedAt = entity.updatedAt;

      // Simulate time passing by creating a future date
      const futureTime = originalUpdatedAt.getTime() + 1000;
      const mockDate = new Date(futureTime);
      jest.spyOn(global, "Date").mockImplementation((() => mockDate) as any);

      entity.toggleComplete();

      expect(entity.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );

      jest.restoreAllMocks();
    });

    it("should not affect todoType when toggling completion", () => {
      const entity = new TodoEntity({
        todoType: "task",
        completed: false,
        userId: "user-1",
      });

      entity.toggleComplete();

      expect(entity.todoType).toBe("task");
      expect(entity.completed).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty constructor", () => {
      const entity = new TodoEntity({});

      expect(entity.id).toBeDefined();
      expect(entity.title).toBe("");
      expect(entity.todoType).toBe("event");
      expect(entity.userId).toBe("");
    });

    it("should handle partial data with only required fields", () => {
      const entity = new TodoEntity({
        title: "Minimal Todo",
        userId: "user-1",
      });

      expect(entity.title).toBe("Minimal Todo");
      expect(entity.userId).toBe("user-1");
      expect(entity.todoType).toBe("event");
    });

    it("should preserve exact Date objects", () => {
      const specificDate = new Date("2024-06-15T10:30:00.000Z");
      const entity = new TodoEntity({
        dueDate: specificDate,
        userId: "user-1",
      });

      expect(entity.dueDate).toBe(specificDate);
      expect(entity.dueDate.toISOString()).toBe("2024-06-15T10:30:00.000Z");
    });
  });
});
