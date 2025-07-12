import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockResponse: jest.Mocked<Response>;
  let mockRequest: jest.Mocked<Request>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    // Mock Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as jest.Mocked<Response>;

    // Mock Request
    mockRequest = {
      url: "/api/test",
      method: "GET",
      get: jest.fn(),
      ip: "127.0.0.1",
    } as unknown as jest.Mocked<Request>;

    // Mock ArgumentsHost
    const mockHttpArgumentsHost = {
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn().mockReturnValue(mockRequest),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    } as unknown as jest.Mocked<ArgumentsHost>;

    // Mock Logger
    loggerSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.mockRestore();
  });

  describe("catch", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2023-01-01T00:00:00.000Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("HttpException을 올바르게 처리해야 함", () => {
      const exception = new HttpException("Test error", HttpStatus.BAD_REQUEST);
      mockRequest.get.mockReturnValue("Mozilla/5.0");

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: "2023-01-01T00:00:00.000Z",
        path: "/api/test",
        method: "GET",
        message: "Test error",
      });
    });

    it("객체 형태의 HttpException 응답을 처리해야 함", () => {
      const exception = new HttpException(
        { message: "Validation failed", error: "Bad Request" },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: "2023-01-01T00:00:00.000Z",
        path: "/api/test",
        method: "GET",
        message: "Validation failed",
      });
    });

    it("메시지가 없는 객체 응답을 처리해야 함", () => {
      const exception = new HttpException(
        { error: "Bad Request" },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unknown error",
        }),
      );
    });

    it("일반 Error를 처리해야 함", () => {
      const exception = new Error("Database connection failed");

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: "2023-01-01T00:00:00.000Z",
        path: "/api/test",
        method: "GET",
        message: "Database connection failed",
      });
    });

    it("알 수 없는 예외를 처리해야 함", () => {
      const exception = "Unknown error";

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: "2023-01-01T00:00:00.000Z",
        path: "/api/test",
        method: "GET",
        message: "Internal server error",
      });
    });

    it("null 값을 처리해야 함", () => {
      const exception = null;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: "2023-01-01T00:00:00.000Z",
        path: "/api/test",
        method: "GET",
        message: "Internal server error",
      });
    });

    it("에러 로그를 올바르게 기록해야 함", () => {
      const exception = new HttpException("Test error", HttpStatus.NOT_FOUND);
      mockRequest.get.mockReturnValue("Mozilla/5.0 Test Browser");

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith("HTTP 404 Error: Test error", {
        method: "GET",
        url: "/api/test",
        userAgent: "Mozilla/5.0 Test Browser",
        ip: "127.0.0.1",
        exception: expect.any(String) as string,
      });
    });

    it("Error 객체의 스택 트레이스를 로그에 포함해야 함", () => {
      const exception = new Error("Test error");

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        "HTTP 500 Error: Test error",
        expect.objectContaining({
          exception: exception.stack,
        }),
      );
    });

    it("Error 객체가 아닌 예외는 그대로 로그에 포함해야 함", () => {
      const exception = { customError: "Custom error object" };

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        "HTTP 500 Error: Internal server error",
        expect.objectContaining({
          exception: exception,
        }),
      );
    });

    it("User-Agent가 없는 경우를 처리해야 함", () => {
      const exception = new HttpException("Test error", HttpStatus.BAD_REQUEST);
      mockRequest.get.mockReturnValue(undefined);

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        "HTTP 400 Error: Test error",
        expect.objectContaining({
          userAgent: undefined,
        }),
      );
    });
  });

  describe("getStatus", () => {
    it("HttpException의 상태 코드를 반환해야 함", () => {
      const exception = new HttpException("Test", HttpStatus.UNAUTHORIZED);

      // private 메서드 테스트를 위해 타입 단언 사용
      const status = (
        filter as unknown as { getStatus: (exception: unknown) => number }
      ).getStatus(exception);

      expect(status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("HttpException이 아닌 경우 500을 반환해야 함", () => {
      const exception = new Error("Test error");

      const status = (
        filter as unknown as { getStatus: (exception: unknown) => number }
      ).getStatus(exception);

      expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe("getMessage", () => {
    it("HttpException의 문자열 메시지를 반환해야 함", () => {
      const exception = new HttpException(
        "String message",
        HttpStatus.BAD_REQUEST,
      );

      const message = (
        filter as unknown as { getMessage: (exception: unknown) => string }
      ).getMessage(exception);

      expect(message).toBe("String message");
    });

    it("HttpException의 객체 응답에서 메시지를 추출해야 함", () => {
      const exception = new HttpException(
        { message: "Object message", error: "Bad Request" },
        HttpStatus.BAD_REQUEST,
      );

      const message = (
        filter as unknown as { getMessage: (exception: unknown) => string }
      ).getMessage(exception);

      expect(message).toBe("Object message");
    });

    it("메시지가 없는 객체 응답에 대해 기본 메시지를 반환해야 함", () => {
      const exception = new HttpException(
        { error: "Bad Request" },
        HttpStatus.BAD_REQUEST,
      );

      const message = (
        filter as unknown as { getMessage: (exception: unknown) => string }
      ).getMessage(exception);

      expect(message).toBe("Unknown error");
    });

    it("null 응답에 대해 기본 메시지를 반환해야 함", () => {
      const exception = new HttpException(
        null as unknown as string,
        HttpStatus.BAD_REQUEST,
      );

      const message = (
        filter as unknown as { getMessage: (exception: unknown) => string }
      ).getMessage(exception);

      expect(message).toBe("Http Exception");
    });

    it("Error 객체의 메시지를 반환해야 함", () => {
      const exception = new Error("Error message");

      const message = (
        filter as unknown as { getMessage: (exception: unknown) => string }
      ).getMessage(exception);

      expect(message).toBe("Error message");
    });

    it("알 수 없는 예외에 대해 기본 메시지를 반환해야 함", () => {
      const exception = "string exception";

      const message = (
        filter as unknown as { getMessage: (exception: unknown) => string }
      ).getMessage(exception);

      expect(message).toBe("Internal server error");
    });

    it("undefined 예외에 대해 기본 메시지를 반환해야 함", () => {
      const exception = undefined;

      const message = (
        filter as unknown as { getMessage: (exception: unknown) => string }
      ).getMessage(exception);

      expect(message).toBe("Internal server error");
    });
  });

  describe("다양한 HTTP 상태 코드", () => {
    it.each([
      [HttpStatus.BAD_REQUEST, "Bad Request"],
      [HttpStatus.UNAUTHORIZED, "Unauthorized"],
      [HttpStatus.FORBIDDEN, "Forbidden"],
      [HttpStatus.NOT_FOUND, "Not Found"],
      [HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error"],
      [HttpStatus.BAD_GATEWAY, "Bad Gateway"],
    ])("HTTP %d 상태 코드를 처리해야 함", (statusCode, message) => {
      const exception = new HttpException(message, statusCode);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode,
          message,
        }),
      );
    });
  });

  describe("요청 정보 추출", () => {
    it("다양한 HTTP 메서드를 처리해야 함", () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

      methods.forEach((method) => {
        mockRequest.method = method;
        const exception = new HttpException("Test", HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            method,
          }),
        );
      });
    });

    it("다양한 URL 경로를 처리해야 함", () => {
      const paths = ["/api/users", "/api/todos/123", "/health", "/"];

      paths.forEach((path) => {
        mockRequest.url = path;
        const exception = new HttpException("Test", HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            path,
          }),
        );
      });
    });
  });
});
