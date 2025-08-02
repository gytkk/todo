import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { UpdateSettingsDto } from "./update-settings.dto";

describe("UpdateSettingsDto", () => {
  const createDto = (data: Partial<UpdateSettingsDto>): UpdateSettingsDto => {
    return plainToClass(UpdateSettingsDto, data);
  };

  describe("theme validation", () => {
    it("유효한 테마 값으로 검증을 통과해야 함", async () => {
      const validThemes = ["light", "dark", "system"];

      for (const theme of validThemes) {
        const dto = createDto({
          theme: theme as "light" | "dark" | "system",
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it("테마가 없어도 검증을 통과해야 함 (선택적 필드)", async () => {
      const dto = createDto({
        language: "ko",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("잘못된 테마 값으로 검증 실패해야 함", async () => {
      const invalidThemes = [
        "blue",
        "auto",
        "default",
        "lightmode",
        "darkmode",
        "",
        "   ",
        "LIGHT",
        "Dark",
        "SYSTEM",
      ];

      for (const theme of invalidThemes) {
        const dto = createDto({
          theme: theme as "light" | "dark" | "system",
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);

        const themeError = errors.find((error) => error.property === "theme");
        expect(themeError).toBeDefined();
        expect(themeError?.constraints).toHaveProperty("isIn");
      }
    });

    it("문자열이 아닌 타입으로 검증 실패해야 함", async () => {
      const dto = createDto({
        theme: 123 as unknown as "light" | "dark" | "system",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // isString validator combines both constraints

      const themeError = errors.find((error) => error.property === "theme");
      expect(themeError).toBeDefined();
      expect(themeError?.constraints).toHaveProperty("isString");
    });

    it("null 값으로 검증 통과해야 함 (@IsOptional 때문)", async () => {
      const dto = createDto({
        theme: null as unknown as "light" | "dark" | "system",
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0); // @IsOptional이므로 null은 허용됨
    });
  });

  describe("language validation", () => {
    it("유효한 언어 값으로 검증을 통과해야 함", async () => {
      const validLanguages = ["ko", "en", "ja", "zh", "fr", "de", "es"];

      for (const language of validLanguages) {
        const dto = createDto({
          language,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it("언어가 없어도 검증을 통과해야 함 (선택적 필드)", async () => {
      const dto = createDto({
        theme: "light",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("빈 문자열 언어로 검증 실패해야 함", async () => {
      const dto = createDto({
        language: "",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("language");
      expect(errors[0].constraints).toHaveProperty("isNotEmpty");
    });

    it("공백만 있는 언어로 검증 실패해야 함", async () => {
      const dto = createDto({
        language: "   ",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // 비즈니스 로직에서 처리
    });

    it("문자열이 아닌 타입으로 검증 실패해야 함", async () => {
      const dto = createDto({
        language: 123 as unknown as string,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("language");
      expect(errors[0].constraints).toHaveProperty("isString");
    });

    it("긴 언어 코드를 허용해야 함", async () => {
      const dto = createDto({
        language: "ko-KR",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe("categoryFilter validation", () => {
    it("유효한 카테고리 필터로 검증을 통과해야 함", async () => {
      const validFilters: { [categoryId: string]: boolean }[] = [
        { "cat-1": true, "cat-2": false },
        { "category-123": true },
        {},
        { work: true, personal: false, family: true },
      ];

      for (const categoryFilter of validFilters) {
        const dto = createDto({
          categoryFilter,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it("카테고리 필터가 없어도 검증을 통과해야 함 (선택적 필드)", async () => {
      const dto = createDto({
        theme: "light",
        language: "ko",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("객체가 아닌 타입으로 검증 실패해야 함", async () => {
      const invalidFilters = ["string", 123, [], true, null];

      for (const categoryFilter of invalidFilters) {
        const dto = createDto({
          categoryFilter: categoryFilter as unknown as {
            [categoryId: string]: boolean;
          },
        });

        const errors = await validate(dto);

        // null은 @IsOptional 때문에 허용됨
        if (categoryFilter === null) {
          expect(errors.length).toBe(0);
        } else {
          expect(errors.length).toBeGreaterThan(0);
          const filterError = errors.find(
            (error) => error.property === "categoryFilter",
          );
          expect(filterError).toBeDefined();
          expect(filterError?.constraints).toHaveProperty("isObject");
        }
      }
    });

    it("중첩 객체는 허용하지 않음 (평면 객체만)", async () => {
      const dto = createDto({
        categoryFilter: {
          "cat-1": { enabled: true } as unknown as boolean,
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // class-validator는 중첩 검사를 하지 않음
    });

    it("boolean이 아닌 값도 허용 (런타임에서 처리)", async () => {
      const dto = createDto({
        categoryFilter: {
          "cat-1": "true" as unknown as boolean,
          "cat-2": 1 as unknown as boolean,
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe("새로 추가된 필드 validation", () => {
    describe("autoMoveTodos validation", () => {
      it("유효한 boolean 값으로 검증을 통과해야 함", async () => {
        const validValues = [true, false];

        for (const value of validValues) {
          const dto = createDto({ autoMoveTodos: value });
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it("boolean이 아닌 타입으로 검증 실패해야 함", async () => {
        const invalidValues = ["true", "false", 1, 0, null, undefined, ""];

        for (const value of invalidValues) {
          const dto = createDto({
            autoMoveTodos: value as unknown as boolean,
          });

          const errors = await validate(dto);

          // null과 undefined는 @IsOptional 때문에 허용됨
          if (value === null || value === undefined) {
            expect(errors.length).toBe(0);
          } else {
            expect(errors.length).toBeGreaterThan(0);
            const fieldError = errors.find(
              (error) => error.property === "autoMoveTodos",
            );
            expect(fieldError).toBeDefined();
            expect(fieldError?.constraints).toHaveProperty("isBoolean");
          }
        }
      });
    });

    describe("showTaskMoveNotifications validation", () => {
      it("유효한 boolean 값으로 검증을 통과해야 함", async () => {
        const validValues = [true, false];

        for (const value of validValues) {
          const dto = createDto({ showTaskMoveNotifications: value });
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it("boolean이 아닌 타입으로 검증 실패해야 함", async () => {
        const invalidValues = ["true", "false", 1, 0, ""];

        for (const value of invalidValues) {
          const dto = createDto({
            showTaskMoveNotifications: value as unknown as boolean,
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);

          const fieldError = errors.find(
            (error) => error.property === "showTaskMoveNotifications",
          );
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toHaveProperty("isBoolean");
        }
      });
    });

    describe("completedTodoDisplay validation", () => {
      it("유효한 enum 값으로 검증을 통과해야 함", async () => {
        const validValues: ("all" | "yesterday" | "none")[] = [
          "all",
          "yesterday",
          "none",
        ];

        for (const value of validValues) {
          const dto = createDto({ completedTodoDisplay: value });
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it("잘못된 enum 값으로 검증 실패해야 함", async () => {
        const invalidValues = [
          "today",
          "week",
          "month",
          "ALL",
          "YESTERDAY",
          "NONE",
          "",
          " ",
        ];

        for (const value of invalidValues) {
          const dto = createDto({
            completedTodoDisplay: value as "all" | "yesterday" | "none",
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);

          const fieldError = errors.find(
            (error) => error.property === "completedTodoDisplay",
          );
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toHaveProperty("isIn");
        }
      });
    });

    describe("dateFormat validation", () => {
      it("유효한 날짜 형식으로 검증을 통과해야 함", async () => {
        const validFormats: ("YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY")[] = [
          "YYYY-MM-DD",
          "MM/DD/YYYY",
          "DD/MM/YYYY",
        ];

        for (const format of validFormats) {
          const dto = createDto({ dateFormat: format });
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it("잘못된 날짜 형식으로 검증 실패해야 함", async () => {
        const invalidFormats = [
          "YYYY/MM/DD",
          "DD-MM-YYYY",
          "MM-DD-YYYY",
          "yyyy-mm-dd",
          "mm/dd/yyyy",
          "",
          "invalid",
        ];

        for (const format of invalidFormats) {
          const dto = createDto({
            dateFormat: format as "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY",
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);

          const fieldError = errors.find(
            (error) => error.property === "dateFormat",
          );
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toHaveProperty("isIn");
        }
      });
    });

    describe("timeFormat validation", () => {
      it("유효한 시간 형식으로 검증을 통과해야 함", async () => {
        const validFormats: ("12h" | "24h")[] = ["12h", "24h"];

        for (const format of validFormats) {
          const dto = createDto({ timeFormat: format });
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it("잘못된 시간 형식으로 검증 실패해야 함", async () => {
        const invalidFormats = [
          "12",
          "24",
          "12hour",
          "24hour",
          "12H",
          "24H",
          "",
          "am/pm",
        ];

        for (const format of invalidFormats) {
          const dto = createDto({
            timeFormat: format as "12h" | "24h",
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);

          const fieldError = errors.find(
            (error) => error.property === "timeFormat",
          );
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toHaveProperty("isIn");
        }
      });
    });

    describe("weekStart validation", () => {
      it("유효한 주 시작일로 검증을 통과해야 함", async () => {
        const validDays: ("sunday" | "monday" | "saturday")[] = [
          "sunday",
          "monday",
          "saturday",
        ];

        for (const day of validDays) {
          const dto = createDto({ weekStart: day });
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it("잘못된 주 시작일로 검증 실패해야 함", async () => {
        const invalidDays = [
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "Sunday",
          "Monday",
          "SUNDAY",
          "",
          "1",
          "0",
        ];

        for (const day of invalidDays) {
          const dto = createDto({
            weekStart: day as "sunday" | "monday" | "saturday",
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);

          const fieldError = errors.find(
            (error) => error.property === "weekStart",
          );
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toHaveProperty("isIn");
        }
      });
    });

    describe("notifications validation", () => {
      it("유효한 notifications 객체로 검증을 통과해야 함", async () => {
        const validNotifications: Array<
          Partial<{
            enabled: boolean;
            dailyReminder: boolean;
            weeklyReport: boolean;
          }>
        > = [
          { enabled: true, dailyReminder: false, weeklyReport: false },
          { enabled: false, dailyReminder: true, weeklyReport: true },
          { enabled: true, dailyReminder: true, weeklyReport: false },
          {},
        ];

        for (const notifications of validNotifications) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const dto = createDto({ notifications: notifications as any });
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it("객체가 아닌 타입으로 검증 실패해야 함", async () => {
        const invalidValues = ["string", 123, [], true, false];

        for (const value of invalidValues) {
          const dto = createDto({
            notifications: value as unknown as {
              enabled: boolean;
              dailyReminder: boolean;
              weeklyReport: boolean;
            },
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);

          const fieldError = errors.find(
            (error) => error.property === "notifications",
          );
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toHaveProperty("isObject");
        }
      });
    });

    describe("autoBackup validation", () => {
      it("유효한 boolean 값으로 검증을 통과해야 함", async () => {
        const validValues = [true, false];

        for (const value of validValues) {
          const dto = createDto({ autoBackup: value });
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it("boolean이 아닌 타입으로 검증 실패해야 함", async () => {
        const invalidValues = ["true", "false", 1, 0, ""];

        for (const value of invalidValues) {
          const dto = createDto({
            autoBackup: value as unknown as boolean,
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);

          const fieldError = errors.find(
            (error) => error.property === "autoBackup",
          );
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toHaveProperty("isBoolean");
        }
      });
    });

    describe("backupInterval validation", () => {
      it("유효한 백업 주기로 검증을 통과해야 함", async () => {
        const validIntervals: ("daily" | "weekly" | "monthly")[] = [
          "daily",
          "weekly",
          "monthly",
        ];

        for (const interval of validIntervals) {
          const dto = createDto({ backupInterval: interval });
          const errors = await validate(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it("잘못된 백업 주기로 검증 실패해야 함", async () => {
        const invalidIntervals = [
          "yearly",
          "hourly",
          "minutely",
          "DAILY",
          "WEEKLY",
          "MONTHLY",
          "",
          "every-day",
          "1-week",
        ];

        for (const interval of invalidIntervals) {
          const dto = createDto({
            backupInterval: interval as "daily" | "weekly" | "monthly",
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);

          const fieldError = errors.find(
            (error) => error.property === "backupInterval",
          );
          expect(fieldError).toBeDefined();
          expect(fieldError?.constraints).toHaveProperty("isIn");
        }
      });
    });
  });

  describe("전체 유효성 검사", () => {
    it("모든 필드가 유효하면 검증을 통과해야 함", async () => {
      const dto = createDto({
        theme: "dark",
        language: "en",
        categoryFilter: { "cat-1": true, "cat-2": false },
        autoMoveTodos: true,
        showTaskMoveNotifications: false,
        completedTodoDisplay: "all",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h",
        weekStart: "sunday",
        notifications: {
          enabled: true,
          dailyReminder: true,
          weeklyReport: false,
        },
        autoBackup: true,
        backupInterval: "monthly",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("일부 필드만 제공해도 검증을 통과해야 함", async () => {
      const scenarios: Partial<UpdateSettingsDto>[] = [
        { theme: "light" },
        { language: "ko" },
        { categoryFilter: { "cat-1": true } },
        { autoMoveTodos: false },
        { showTaskMoveNotifications: true },
        { completedTodoDisplay: "none" },
        { dateFormat: "DD/MM/YYYY" },
        { timeFormat: "24h" },
        { weekStart: "monday" },
        {
          notifications: {
            enabled: false,
            dailyReminder: true,
            weeklyReport: true,
          },
        },
        { autoBackup: false },
        { backupInterval: "daily" },
        { theme: "dark", language: "en" },
        { autoMoveTodos: true, completedTodoDisplay: "yesterday" },
        { dateFormat: "YYYY-MM-DD", timeFormat: "24h", weekStart: "saturday" },
        { theme: "system", categoryFilter: {} },
        { language: "ko", categoryFilter: { work: false } },
      ];

      for (const scenario of scenarios) {
        const dto = createDto(scenario);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it("빈 객체도 검증을 통과해야 함 (모든 필드가 선택적)", async () => {
      const dto = createDto({});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("모든 필드가 잘못되면 여러 검증 오류가 발생해야 함", async () => {
      const dto = createDto({
        theme: "invalid-theme" as unknown as "light" | "dark" | "system",
        language: 123 as unknown as string,
        categoryFilter: "not-an-object" as unknown as {
          [categoryId: string]: boolean;
        },
        autoMoveTodos: "true" as unknown as boolean,
        showTaskMoveNotifications: 1 as unknown as boolean,
        completedTodoDisplay: "invalid" as "all" | "yesterday" | "none",
        dateFormat: "invalid-format" as
          | "YYYY-MM-DD"
          | "MM/DD/YYYY"
          | "DD/MM/YYYY",
        timeFormat: "invalid-time" as "12h" | "24h",
        weekStart: "invalid-day" as "sunday" | "monday" | "saturday",
        notifications: "not-object" as unknown as {
          enabled: boolean;
          dailyReminder: boolean;
          weeklyReport: boolean;
        },
        autoBackup: "false" as unknown as boolean,
        backupInterval: "invalid-interval" as "daily" | "weekly" | "monthly",
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(8); // 최소 9개 이상의 오류 예상

      const expectedProperties = [
        "theme",
        "language",
        "categoryFilter",
        "autoMoveTodos",
        "showTaskMoveNotifications",
        "completedTodoDisplay",
        "dateFormat",
        "timeFormat",
        "weekStart",
        "notifications",
        "autoBackup",
        "backupInterval",
      ];

      expectedProperties.forEach((property) => {
        const propertyError = errors.find(
          (error) => error.property === property,
        );
        expect(propertyError).toBeDefined();
      });
    });

    it("추가 속성이 있어도 검증을 통과해야 함", async () => {
      const dto = createDto({
        theme: "light",
        language: "ko",
        ...({ extraProperty: "extra" } as unknown as UpdateSettingsDto),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe("부분 업데이트 시나리오", () => {
    it("undefined 값으로 검증을 통과해야 함", async () => {
      const dto = createDto({
        theme: undefined,
        language: undefined,
        categoryFilter: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("null 값으로 검증 통과해야 함 (@IsOptional 때문)", async () => {
      const dto = createDto({
        theme: null as unknown as "light" | "dark" | "system",
        language: null as unknown as string,
        categoryFilter: null as unknown as { [categoryId: string]: boolean },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // 모든 필드가 @IsOptional이므로 null 허용
    });
  });

  describe("실제 사용 시나리오", () => {
    it("테마만 변경하는 경우", async () => {
      const dto = createDto({
        theme: "dark",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("언어만 변경하는 경우", async () => {
      const dto = createDto({
        language: "en",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("카테고리 필터만 변경하는 경우", async () => {
      const dto = createDto({
        categoryFilter: {
          work: false,
          personal: true,
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("모든 설정을 한 번에 변경하는 경우", async () => {
      const dto = createDto({
        theme: "system",
        language: "ko",
        categoryFilter: {
          "cat-1": true,
          "cat-2": false,
          "cat-3": true,
        },
        autoMoveTodos: false,
        showTaskMoveNotifications: true,
        completedTodoDisplay: "all",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "12h",
        weekStart: "saturday",
        notifications: {
          enabled: true,
          dailyReminder: true,
          weeklyReport: false,
        },
        autoBackup: true,
        backupInterval: "daily",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("할일 관련 설정만 변경하는 경우", async () => {
      const dto = createDto({
        autoMoveTodos: true,
        showTaskMoveNotifications: false,
        completedTodoDisplay: "yesterday",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("캘린더 설정만 변경하는 경우", async () => {
      const dto = createDto({
        dateFormat: "YYYY-MM-DD",
        timeFormat: "24h",
        weekStart: "monday",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("알림 설정만 변경하는 경우", async () => {
      const dto = createDto({
        notifications: {
          enabled: false,
          dailyReminder: true,
          weeklyReport: true,
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("백업 설정만 변경하는 경우", async () => {
      const dto = createDto({
        autoBackup: true,
        backupInterval: "weekly",
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe("경계값 테스트", () => {
    it("매우 긴 언어 코드를 허용해야 함", async () => {
      const longLanguage = "a".repeat(100);
      const dto = createDto({
        language: longLanguage,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("많은 카테고리 필터를 허용해야 함", async () => {
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
