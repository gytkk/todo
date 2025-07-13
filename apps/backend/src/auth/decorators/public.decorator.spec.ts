import { SetMetadata } from "@nestjs/common";
import { Public, IS_PUBLIC_KEY } from "./public.decorator";

// SetMetadata 모킹
jest.mock("@nestjs/common", () => ({
  SetMetadata: jest.fn(),
}));

describe("Public Decorator", () => {
  let mockSetMetadata: jest.MockedFunction<typeof SetMetadata>;

  beforeEach(() => {
    mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
    mockSetMetadata.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("IS_PUBLIC_KEY 상수", () => {
    it("IS_PUBLIC_KEY가 'isPublic'이어야 함", () => {
      expect(IS_PUBLIC_KEY).toBe("isPublic");
    });

    it("IS_PUBLIC_KEY가 문자열이어야 함", () => {
      expect(typeof IS_PUBLIC_KEY).toBe("string");
    });

    it("IS_PUBLIC_KEY가 빈 문자열이 아니어야 함", () => {
      expect(IS_PUBLIC_KEY).not.toBe("");
    });
  });

  describe("Public 데코레이터 함수", () => {
    it("Public 함수가 정의되어야 함", () => {
      expect(Public).toBeDefined();
      expect(typeof Public).toBe("function");
    });

    it("Public 함수를 호출하면 SetMetadata가 호출되어야 함", () => {
      const mockReturnValue = jest.fn();
      mockSetMetadata.mockReturnValue(mockReturnValue as any);

      const result = Public();

      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
      expect(mockSetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
      expect(result).toBe(mockReturnValue);
    });

    it("Public 함수를 여러 번 호출해도 매번 SetMetadata가 호출되어야 함", () => {
      const mockReturnValue1 = jest.fn();
      const mockReturnValue2 = jest.fn();
      
      mockSetMetadata
        .mockReturnValueOnce(mockReturnValue1 as any)
        .mockReturnValueOnce(mockReturnValue2 as any);

      const result1 = Public();
      const result2 = Public();

      expect(mockSetMetadata).toHaveBeenCalledTimes(2);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(1, IS_PUBLIC_KEY, true);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(2, IS_PUBLIC_KEY, true);
      expect(result1).toBe(mockReturnValue1);
      expect(result2).toBe(mockReturnValue2);
    });

    it("Public 함수가 항상 동일한 인수로 SetMetadata를 호출해야 함", () => {
      Public();
      Public();
      Public();

      expect(mockSetMetadata).toHaveBeenCalledTimes(3);
      mockSetMetadata.mock.calls.forEach((call) => {
        expect(call[0]).toBe(IS_PUBLIC_KEY);
        expect(call[1]).toBe(true);
      });
    });

    it("Public 함수가 매개변수를 받지 않아야 함", () => {
      expect(Public.length).toBe(0);
    });
  });

  describe("SetMetadata 호출 검증", () => {
    it("SetMetadata가 올바른 키와 값으로 호출되어야 함", () => {
      Public();

      const [key, value] = mockSetMetadata.mock.calls[0];
      expect(key).toBe("isPublic");
      expect(value).toBe(true);
      expect(typeof key).toBe("string");
      expect(typeof value).toBe("boolean");
    });

    it("SetMetadata가 정확히 2개의 인수로 호출되어야 함", () => {
      Public();

      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
      expect(mockSetMetadata.mock.calls[0]).toHaveLength(2);
    });

    it("SetMetadata의 반환값이 Public 함수의 반환값이어야 함", () => {
      const expectedReturn = jest.fn();
      mockSetMetadata.mockReturnValue(expectedReturn as any);

      const result = Public();

      expect(result).toBe(expectedReturn);
    });
  });

  describe("데코레이터 사용 시나리오", () => {
    it("클래스 데코레이터로 사용할 수 있어야 함", () => {
      const mockClassDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockClassDecorator as any);

      @Public()
      class TestController {}

      expect(mockSetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
      expect(mockClassDecorator).toHaveBeenCalledWith(TestController);
    });

    it("메서드 데코레이터로 사용할 수 있어야 함", () => {
      const mockMethodDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockMethodDecorator as any);

      class TestController {
        @Public()
        testMethod() {}
      }

      expect(mockSetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
      expect(mockMethodDecorator).toHaveBeenCalledWith(
        TestController.prototype,
        "testMethod",
        expect.any(Object)
      );
    });
  });

  describe("상수와 함수의 독립성", () => {
    it("IS_PUBLIC_KEY와 Public 함수가 독립적이어야 함", () => {
      const originalKey = IS_PUBLIC_KEY;
      
      Public();
      
      expect(IS_PUBLIC_KEY).toBe(originalKey);
      expect(mockSetMetadata).toHaveBeenCalledWith(originalKey, true);
    });
  });

  describe("타입 안전성 검증", () => {
    it("Public 함수의 반환 타입이 올바르게 추론되어야 함", () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator as any);

      const result = Public();

      // TypeScript에서 데코레이터 타입이 올바르게 추론되는지 확인
      expect(typeof result).toBe("function");
    });
  });

  describe("에러 처리", () => {
    it("SetMetadata가 에러를 던지면 Public 함수도 에러를 던져야 함", () => {
      const testError = new Error("SetMetadata error");
      mockSetMetadata.mockImplementation(() => {
        throw testError;
      });

      expect(() => Public()).toThrow(testError);
    });

    it("SetMetadata가 null을 반환해도 Public 함수는 정상 동작해야 함", () => {
      mockSetMetadata.mockReturnValue(null as any);

      const result = Public();

      expect(result).toBeNull();
      expect(mockSetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
    });

    it("SetMetadata가 undefined를 반환해도 Public 함수는 정상 동작해야 함", () => {
      mockSetMetadata.mockReturnValue(undefined as any);

      const result = Public();

      expect(result).toBeUndefined();
      expect(mockSetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
    });
  });
});