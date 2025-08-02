import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let superCanActivateSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    // Mock ExecutionContext
    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToHttp: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;

    // Spy on parent class's canActivate method
    superCanActivateSpy = jest
      .spyOn(AuthGuard("jwt").prototype, "canActivate")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should be defined", () => {
      expect(guard).toBeDefined();
    });

    it("should inject Reflector dependency", () => {
      expect(reflector).toBeDefined();
    });

    it("should extend AuthGuard with jwt strategy", () => {
      expect(guard).toBeInstanceOf(AuthGuard("jwt"));
    });
  });

  describe("canActivate", () => {
    describe("public routes", () => {
      beforeEach(() => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
      });

      it("should return true for public routes without calling parent canActivate", () => {
        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith("isPublic", [
          mockExecutionContext.getHandler(),
          mockExecutionContext.getClass(),
        ]);
        expect(superCanActivateSpy).not.toHaveBeenCalled();
      });

      it("should check both handler and class for isPublic metadata", () => {
        const mockHandler = jest.fn();
        const mockClass = jest.fn();
        (mockExecutionContext.getHandler as jest.Mock).mockReturnValue(
          mockHandler,
        );
        (mockExecutionContext.getClass as jest.Mock).mockReturnValue(mockClass);

        void guard.canActivate(mockExecutionContext);

        expect(reflector.getAllAndOverride).toHaveBeenCalledWith("isPublic", [
          mockHandler,
          mockClass,
        ]);
      });
    });

    describe("protected routes", () => {
      beforeEach(() => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
      });

      it("should call parent canActivate for protected routes", () => {
        const result = guard.canActivate(mockExecutionContext);

        expect(reflector.getAllAndOverride).toHaveBeenCalledWith("isPublic", [
          mockExecutionContext.getHandler(),
          mockExecutionContext.getClass(),
        ]);
        expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
        expect(result).toBe(true);
      });

      it("should return false when parent canActivate returns false", () => {
        superCanActivateSpy.mockReturnValue(false);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
        expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      });

      it("should handle Promise return from parent canActivate", async () => {
        const promiseResult = Promise.resolve(true);
        superCanActivateSpy.mockReturnValue(promiseResult);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(promiseResult);
        await expect(result).resolves.toBe(true);
      });

      it("should handle Observable return from parent canActivate", () => {
        const observable = {
          subscribe: jest.fn(),
        };
        superCanActivateSpy.mockReturnValue(observable);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(observable);
      });
    });

    describe("when isPublic metadata is undefined", () => {
      it("should treat undefined as non-public and call parent canActivate", () => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

        void guard.canActivate(mockExecutionContext);

        expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      });
    });

    describe("when isPublic metadata is null", () => {
      it("should treat null as non-public and call parent canActivate", () => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

        void guard.canActivate(mockExecutionContext);

        expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      });
    });

    describe("different execution contexts", () => {
      it("should handle HTTP context", () => {
        const httpContext = {
          ...mockExecutionContext,
          getType: jest.fn().mockReturnValue("http"),
        };
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);

        void guard.canActivate(httpContext);

        expect(superCanActivateSpy).toHaveBeenCalledWith(httpContext);
      });

      it("should handle RPC context", () => {
        const rpcContext = {
          ...mockExecutionContext,
          getType: jest.fn().mockReturnValue("rpc"),
        };
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);

        void guard.canActivate(rpcContext);

        expect(superCanActivateSpy).toHaveBeenCalledWith(rpcContext);
      });

      it("should handle WebSocket context", () => {
        const wsContext = {
          ...mockExecutionContext,
          getType: jest.fn().mockReturnValue("ws"),
        };
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);

        void guard.canActivate(wsContext);

        expect(superCanActivateSpy).toHaveBeenCalledWith(wsContext);
      });
    });

    describe("error handling", () => {
      it("should propagate errors from reflector", () => {
        const error = new Error("Reflector error");
        jest.spyOn(reflector, "getAllAndOverride").mockImplementation(() => {
          throw error;
        });

        expect(() => guard.canActivate(mockExecutionContext)).toThrow(error);
        expect(superCanActivateSpy).not.toHaveBeenCalled();
      });

      it("should propagate errors from parent canActivate", () => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
        const error = new Error("Auth error");
        superCanActivateSpy.mockImplementation(() => {
          throw error;
        });

        expect(() => guard.canActivate(mockExecutionContext)).toThrow(error);
      });

      it("should handle rejected promises from parent canActivate", async () => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
        const error = new Error("Authentication failed");
        superCanActivateSpy.mockReturnValue(Promise.reject(error));

        const result = guard.canActivate(mockExecutionContext);

        await expect(result).rejects.toThrow(error);
      });
    });

    describe("edge cases", () => {
      it("should handle when execution context methods return undefined", () => {
        (mockExecutionContext.getHandler as jest.Mock).mockReturnValue(
          undefined,
        );
        (mockExecutionContext.getClass as jest.Mock).mockReturnValue(undefined);
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);

        void guard.canActivate(mockExecutionContext);

        expect(reflector.getAllAndOverride).toHaveBeenCalledWith("isPublic", [
          undefined,
          undefined,
        ]);
        expect(superCanActivateSpy).toHaveBeenCalled();
      });

      it("should handle multiple calls with different contexts", () => {
        const publicContext = { ...mockExecutionContext };
        const protectedContext = { ...mockExecutionContext };

        jest
          .spyOn(reflector, "getAllAndOverride")
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);

        const publicResult = guard.canActivate(publicContext);
        const protectedResult = guard.canActivate(protectedContext);

        expect(publicResult).toBe(true);
        expect(protectedResult).toBe(true);
        expect(superCanActivateSpy).toHaveBeenCalledTimes(1);
        expect(superCanActivateSpy).toHaveBeenCalledWith(protectedContext);
      });
    });
  });
});
