import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { CreateTodoDto } from "./create-todo.dto";
import { TodoCategoryDto } from "./todo-category.dto";

describe("CreateTodoDto", () => {
  const validCategory: TodoCategoryDto = {
    id: "work",
    name: "업무",
    color: "#FF6B6B",
    icon: "💼",
    createdAt: new Date().toISOString(),
    order: 0,
  };

  const validCreateTodoDto = {
    title: "테스트 할일",
    description: "테스트 설명",
    priority: "high",
    category: validCategory,
    date: new Date().toISOString(),
    todoType: "event",
  };

  describe("todoType validation", () => {
    it("should accept 'event' as a valid todoType", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        todoType: "event",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should accept 'task' as a valid todoType", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        todoType: "task",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should reject invalid todoType values", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        todoType: "invalid",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("todoType");
      expect(errors[0].constraints).toHaveProperty("isEnum");
    });

    it("should accept undefined todoType (optional field)", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        title: validCreateTodoDto.title,
        category: validCreateTodoDto.category,
        date: validCreateTodoDto.date,
        // todoType omitted
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should accept null todoType", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        todoType: null,
      });

      const errors = await validate(dto);
      // null is treated as undefined for optional fields
      expect(errors).toHaveLength(0);
    });
  });

  describe("other field validations", () => {
    it("should validate required fields", async () => {
      const dto = plainToInstance(CreateTodoDto, {});

      const errors = await validate(dto);
      const errorProperties = errors.map((error) => error.property);

      expect(errorProperties).toContain("title");
      expect(errorProperties).toContain("category");
      expect(errorProperties).toContain("date");
    });

    it("should validate title is a non-empty string", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        title: "",
      });

      const errors = await validate(dto);
      const titleError = errors.find((error) => error.property === "title");
      expect(titleError).toBeDefined();
      expect(titleError?.constraints).toHaveProperty("isNotEmpty");
    });

    it("should validate date is in ISO 8601 format", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        date: "invalid-date",
      });

      const errors = await validate(dto);
      const dateError = errors.find((error) => error.property === "date");
      expect(dateError).toBeDefined();
      expect(dateError?.constraints).toHaveProperty("isDateString");
    });

    it("should validate priority enum values", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        priority: "invalid",
      });

      const errors = await validate(dto);
      const priorityError = errors.find(
        (error) => error.property === "priority",
      );
      expect(priorityError).toBeDefined();
      expect(priorityError?.constraints).toHaveProperty("isEnum");
    });

    it("should accept valid priority values", async () => {
      const priorities = ["high", "medium", "low"];

      for (const priority of priorities) {
        const dto = plainToInstance(CreateTodoDto, {
          ...validCreateTodoDto,
          priority,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it("should validate nested category object", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        category: {
          // Missing required fields
          id: "test",
          // name, color, createdAt, order missing
        },
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("should handle numeric todoType (coercion test)", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        todoType: 123,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("todoType");
    });

    it("should handle boolean todoType", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        todoType: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("todoType");
    });

    it("should handle array todoType", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        todoType: ["event", "task"],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("todoType");
    });

    it("should handle object todoType", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        ...validCreateTodoDto,
        todoType: { type: "event" },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("todoType");
    });
  });

  describe("complete DTO validation", () => {
    it("should validate a complete valid DTO", async () => {
      const dto = plainToInstance(CreateTodoDto, validCreateTodoDto);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should validate a minimal valid DTO", async () => {
      const dto = plainToInstance(CreateTodoDto, {
        title: "최소 할일",
        category: validCategory,
        date: new Date().toISOString(),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
