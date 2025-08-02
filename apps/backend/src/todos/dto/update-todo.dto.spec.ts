import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { UpdateTodoDto } from "./update-todo.dto";
import { TodoCategoryDto } from "./todo-category.dto";

describe("UpdateTodoDto", () => {
  const validCategory: TodoCategoryDto = {
    id: "work",
    name: "업무",
    color: "#FF6B6B",
    icon: "💼",
    createdAt: new Date().toISOString(),
    order: 0,
  };

  describe("todoType validation", () => {
    it("should accept 'event' as a valid todoType", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        todoType: "event",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should accept 'task' as a valid todoType", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        todoType: "task",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should reject invalid todoType values", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        todoType: "invalid",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("todoType");
      expect(errors[0].constraints).toHaveProperty("isEnum");
    });

    it("should accept undefined todoType (optional field)", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        title: "Updated title",
        // todoType omitted
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should accept null todoType", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        todoType: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe("all fields validation", () => {
    it("should accept all valid fields", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        title: "Updated title",
        description: "Updated description",
        completed: true,
        priority: "high",
        category: validCategory,
        date: new Date().toISOString(),
        todoType: "task",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should accept empty object (all fields are optional)", async () => {
      const dto = plainToInstance(UpdateTodoDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should validate title if provided", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        title: 123, // Invalid type
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("title");
      expect(errors[0].constraints).toHaveProperty("isString");
    });

    it("should validate completed as boolean", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        completed: "true", // String instead of boolean
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("completed");
      expect(errors[0].constraints).toHaveProperty("isBoolean");
    });

    it("should validate priority enum", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        priority: "urgent", // Invalid enum value
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("priority");
      expect(errors[0].constraints).toHaveProperty("isEnum");
    });

    it("should validate date format", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        date: "invalid-date-format", // Invalid date format
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("date");
      expect(errors[0].constraints).toHaveProperty("isDateString");
    });
  });

  describe("edge cases", () => {
    it("should handle numeric values for string fields", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        title: 12345,
        description: 67890,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain("title");
      expect(errorProperties).toContain("description");
    });

    it("should handle case-sensitive todoType values", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        todoType: "Event", // Capital E
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("todoType");
    });

    it("should handle whitespace in todoType", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        todoType: " event ",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("todoType");
    });

    it("should validate nested category properly", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        category: {
          id: "test",
          // Missing other required fields
        },
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("partial updates", () => {
    it("should allow updating only todoType", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        todoType: "task",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should allow updating multiple fields including todoType", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        title: "New title",
        todoType: "event",
        completed: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should allow updating without todoType", async () => {
      const dto = plainToInstance(UpdateTodoDto, {
        title: "New title",
        completed: false,
        priority: "low",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
