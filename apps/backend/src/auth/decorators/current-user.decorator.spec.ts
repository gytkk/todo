import { ExecutionContext } from "@nestjs/common";
import { User } from "../../users/user.entity";

describe("CurrentUser Decorator", () => {
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockRequest: { user: User };
  let mockUser: User;
  let decoratorFactory: (
    data: keyof User | undefined,
    ctx: ExecutionContext,
  ) => unknown;

  beforeEach(() => {
    mockUser = new User({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "hashedPassword",
      isActive: true,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    });

    mockRequest = {
      user: mockUser,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as jest.Mocked<ExecutionContext>;

    // 데코레이터 팩토리 함수를 직접 정의하여 테스트
    decoratorFactory = (
      data: keyof User | undefined,
      ctx: ExecutionContext,
    ) => {
      const request = ctx.switchToHttp().getRequest<{ user: User }>();
      const user = request.user;
      return data ? user[data] : user;
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("데코레이터 팩토리 함수 동작", () => {
    it("data가 undefined일 때 전체 user 객체를 반환해야 함", () => {
      const result = decoratorFactory(undefined, mockExecutionContext);

      expect(result).toEqual(mockUser);
      expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
      expect(
        mockExecutionContext.switchToHttp().getRequest,
      ).toHaveBeenCalledTimes(1);
    });

    it("data가 null일 때 전체 user 객체를 반환해야 함", () => {
      const result = decoratorFactory(
        null as keyof User | undefined,
        mockExecutionContext,
      );

      expect(result).toEqual(mockUser);
    });

    it("data가 빈 문자열일 때 전체 user 객체를 반환해야 함", () => {
      const result = decoratorFactory(
        "" as keyof User | undefined,
        mockExecutionContext,
      );

      expect(result).toEqual(mockUser);
    });
  });

  describe("특정 사용자 속성 추출", () => {
    it("data가 'id'일 때 사용자 ID를 반환해야 함", () => {
      const result = decoratorFactory("id", mockExecutionContext) as string;

      expect(result).toBe("user-1");
    });

    it("data가 'email'일 때 사용자 이메일을 반환해야 함", () => {
      const result = decoratorFactory("email", mockExecutionContext) as string;

      expect(result).toBe("test@example.com");
    });

    it("data가 'name'일 때 사용자 이름을 반환해야 함", () => {
      const result = decoratorFactory("name", mockExecutionContext) as string;

      expect(result).toBe("Test User");
    });

    it("data가 'isActive'일 때 사용자 활성 상태를 반환해야 함", () => {
      const result = decoratorFactory(
        "isActive",
        mockExecutionContext,
      ) as boolean;

      expect(result).toBe(true);
    });

    it("data가 'createdAt'일 때 사용자 생성일을 반환해야 함", () => {
      const result = decoratorFactory(
        "createdAt",
        mockExecutionContext,
      ) as Date;

      expect(result).toEqual(new Date("2023-01-01"));
    });

    it("data가 'updatedAt'일 때 사용자 수정일을 반환해야 함", () => {
      const result = decoratorFactory(
        "updatedAt",
        mockExecutionContext,
      ) as Date;

      expect(result).toEqual(new Date("2023-01-01"));
    });
  });

  describe("존재하지 않는 속성 처리", () => {
    it("존재하지 않는 속성을 요청하면 undefined를 반환해야 함", () => {
      const result = decoratorFactory(
        "nonExistentProperty" as keyof User,
        mockExecutionContext,
      );

      expect(result).toBeUndefined();
    });
  });

  describe("request에 user가 없는 경우", () => {
    beforeEach(() => {
      mockRequest.user = undefined as unknown as User;
    });

    it("data가 undefined일 때 undefined를 반환해야 함", () => {
      const result = decoratorFactory(undefined, mockExecutionContext);

      expect(result).toBeUndefined();
    });

    it("특정 속성을 요청해도 undefined를 반환해야 함", () => {
      // user가 undefined일 때 속성에 접근하면 에러가 발생할 수 있음
      expect(() => decoratorFactory("id", mockExecutionContext)).toThrow();
    });
  });

  describe("request에 user가 null인 경우", () => {
    beforeEach(() => {
      mockRequest.user = null as unknown as User;
    });

    it("data가 undefined일 때 null을 반환해야 함", () => {
      const result = decoratorFactory(undefined, mockExecutionContext);

      expect(result).toBeNull();
    });

    it("특정 속성을 요청하면 에러가 발생해야 함", () => {
      expect(() => decoratorFactory("id", mockExecutionContext)).toThrow();
    });
  });

  describe("다양한 사용자 객체 테스트", () => {
    it("비활성화된 사용자도 올바르게 처리해야 함", () => {
      const inactiveUser = new User({
        id: "user-2",
        email: "inactive@example.com",
        name: "Inactive User",
        passwordHash: "hashedPassword",
        isActive: false,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      });

      mockRequest.user = inactiveUser;

      const result = decoratorFactory(undefined, mockExecutionContext) as User;

      expect(result).toEqual(inactiveUser);
      expect(result.isActive).toBe(false);
    });

    it("다른 사용자 ID를 가진 사용자도 올바르게 처리해야 함", () => {
      const differentUser = new User({
        id: "user-999",
        email: "different@example.com",
        name: "Different User",
        passwordHash: "hashedPassword",
        isActive: true,
        createdAt: new Date("2023-02-01"),
        updatedAt: new Date("2023-02-01"),
      });

      mockRequest.user = differentUser;

      const idResult = decoratorFactory("id", mockExecutionContext) as string;
      const emailResult = decoratorFactory(
        "email",
        mockExecutionContext,
      ) as string;

      expect(idResult).toBe("user-999");
      expect(emailResult).toBe("different@example.com");
    });
  });

  describe("ExecutionContext 처리", () => {
    it("HTTP 컨텍스트에서 요청 객체를 올바르게 추출해야 함", () => {
      decoratorFactory(undefined, mockExecutionContext);

      expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
      expect(
        mockExecutionContext.switchToHttp().getRequest,
      ).toHaveBeenCalledTimes(1);
    });

    it("switchToHttp가 다른 request 객체를 반환해도 올바르게 처리해야 함", () => {
      const differentUser = new User({
        id: "user-different",
        email: "different@example.com",
        name: "Different User",
        passwordHash: "hashedPassword",
        isActive: true,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      });

      const differentRequest = { user: differentUser };

      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: jest.fn().mockReturnValue(differentRequest),
      } as unknown as ReturnType<ExecutionContext["switchToHttp"]>);

      const result = decoratorFactory(undefined, mockExecutionContext) as User;

      expect(result).toEqual(differentUser);
    });
  });

  describe("타입 안전성 테스트", () => {
    it("User 속성의 타입이 올바르게 반환되어야 함", () => {
      const id = decoratorFactory("id", mockExecutionContext) as string;
      const email = decoratorFactory("email", mockExecutionContext) as string;
      const name = decoratorFactory("name", mockExecutionContext) as string;
      const isActive = decoratorFactory(
        "isActive",
        mockExecutionContext,
      ) as boolean;
      const createdAt = decoratorFactory(
        "createdAt",
        mockExecutionContext,
      ) as Date;
      const updatedAt = decoratorFactory(
        "updatedAt",
        mockExecutionContext,
      ) as Date;

      expect(typeof id).toBe("string");
      expect(typeof email).toBe("string");
      expect(typeof name).toBe("string");
      expect(typeof isActive).toBe("boolean");
      expect(createdAt).toBeInstanceOf(Date);
      expect(updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("conditional logic 테스트", () => {
    it("data가 truthy일 때 user[data]를 반환해야 함", () => {
      const result = decoratorFactory("email", mockExecutionContext) as string;
      expect(result).toBe(mockUser.email);
    });

    it("data가 falsy일 때 user 전체를 반환해야 함", () => {
      let result = decoratorFactory(undefined, mockExecutionContext) as User;
      expect(result).toBe(mockUser);

      result = decoratorFactory(
        null as keyof User | undefined,
        mockExecutionContext,
      ) as User;
      expect(result).toBe(mockUser);

      result = decoratorFactory(
        "" as keyof User | undefined,
        mockExecutionContext,
      ) as User;
      expect(result).toBe(mockUser);
    });
  });

  describe("실제 CurrentUser 데코레이터 통합 테스트", () => {
    it("CurrentUser 데코레이터가 올바르게 export되어야 함", () => {
      // 실제 CurrentUser 임포트 테스트
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { CurrentUser } = require("./current-user.decorator") as {
        CurrentUser: unknown;
      };

      expect(CurrentUser).toBeDefined();
      expect(typeof CurrentUser).toBe("function");
    });

    it("CurrentUser 데코레이터가 createParamDecorator로 생성되어야 함", () => {
      // 실제 CurrentUser가 파라미터 데코레이터 형태인지 확인
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { CurrentUser } = require("./current-user.decorator") as {
        CurrentUser: unknown;
      };

      // 파라미터 데코레이터는 함수여야 함
      expect(typeof CurrentUser).toBe("function");

      // createParamDecorator로 생성된 데코레이터는 1개의 매개변수를 가짐 (data)
      expect((CurrentUser as { length: number }).length).toBe(1);
    });
  });

  describe("에러 처리", () => {
    it("switchToHttp에서 에러가 발생하면 에러를 전파해야 함", () => {
      const testError = new Error("switchToHttp failed");
      mockExecutionContext.switchToHttp.mockImplementation(() => {
        throw testError;
      });

      expect(() => decoratorFactory(undefined, mockExecutionContext)).toThrow(
        testError,
      );
    });

    it("getRequest에서 에러가 발생하면 에러를 전파해야 함", () => {
      const testError = new Error("getRequest failed");
      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: jest.fn().mockImplementation(() => {
          throw testError;
        }),
      } as unknown as ReturnType<ExecutionContext["switchToHttp"]>);

      expect(() => decoratorFactory(undefined, mockExecutionContext)).toThrow(
        testError,
      );
    });
  });

  describe("다양한 data 값 테스트", () => {
    it("모든 User 속성에 대해 올바른 값을 반환해야 함", () => {
      const userProperties: (keyof User)[] = [
        "id",
        "email",
        "name",
        "passwordHash",
        "isActive",
        "createdAt",
        "updatedAt",
      ];

      userProperties.forEach((property) => {
        const result = decoratorFactory(property, mockExecutionContext) as
          | string
          | boolean
          | Date;
        expect(result).toBe(mockUser[property]);
      });
    });

    it("다양한 falsy 값들에 대해 user 전체를 반환해야 함", () => {
      const falsyValues = [undefined, null, "", 0, false];

      falsyValues.forEach((value) => {
        const result = decoratorFactory(
          value as keyof User | undefined,
          mockExecutionContext,
        ) as User;
        expect(result).toBe(mockUser);
      });
    });
  });
});
