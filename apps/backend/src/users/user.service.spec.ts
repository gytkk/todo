import { Test, TestingModule } from "@nestjs/testing";
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { PasswordService } from "../auth/password.service";
import { User } from "./user.entity";
import { RegisterDto } from "../auth/dto/register.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { RedisService } from "../redis/redis.service";

describe("UserService", () => {
  let service: UserService;
  let userRepository: UserRepository;
  let passwordService: PasswordService;

  // Spy function references
  let findByEmailSpy: jest.SpyInstance;
  let findByIdSpy: jest.SpyInstance;
  let createSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;
  let deleteSpy: jest.SpyInstance;
  let hashPasswordSpy: jest.SpyInstance;
  let comparePasswordSpy: jest.SpyInstance;
  let validatePasswordStrengthSpy: jest.SpyInstance;

  const mockUser = new User({
    id: "test-user-id",
    email: "test@example.com",
    name: "John Doe",
    passwordHash: "hashed-password",
    emailVerified: false,
    isActive: true,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  });

  beforeEach(async () => {
    const mockRedisService = {
      generateKey: jest.fn(),
      hgetall: jest.fn(),
      get: jest.fn(),
      hmset: jest.fn(),
      set: jest.fn(),
      zadd: jest.fn(),
      del: jest.fn(),
      zrem: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        UserRepository,
        PasswordService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    passwordService = module.get<PasswordService>(PasswordService);

    // Create spies for UserRepository methods
    findByEmailSpy = jest.spyOn(userRepository, "findByEmail");
    findByIdSpy = jest.spyOn(userRepository, "findById");
    createSpy = jest.spyOn(userRepository, "create");
    updateSpy = jest.spyOn(userRepository, "update");
    deleteSpy = jest.spyOn(userRepository, "delete");

    // Create spies for PasswordService methods
    hashPasswordSpy = jest.spyOn(passwordService, "hashPassword");
    comparePasswordSpy = jest.spyOn(passwordService, "comparePassword");
    validatePasswordStrengthSpy = jest.spyOn(
      passwordService,
      "validatePasswordStrength",
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const registerDto: RegisterDto = {
      email: "test@example.com",
      password: "TestPassword123@",
      name: "John Doe",
    };

    beforeEach(() => {
      validatePasswordStrengthSpy.mockReturnValue({
        isValid: true,
        errors: [],
      });
      hashPasswordSpy.mockResolvedValue("hashed-password");
      createSpy.mockResolvedValue(mockUser);
    });

    it("should create a new user successfully", async () => {
      findByEmailSpy.mockResolvedValue(null);

      const result = await service.create(registerDto);

      expect(findByEmailSpy).toHaveBeenCalledWith(registerDto.email);
      expect(validatePasswordStrengthSpy).toHaveBeenCalledWith(
        registerDto.password,
      );
      expect(hashPasswordSpy).toHaveBeenCalledWith(registerDto.password);
      expect(createSpy).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: "hashed-password",
        name: registerDto.name,
        emailVerified: false,
        isActive: true,
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw ConflictException if email already exists", async () => {
      findByEmailSpy.mockResolvedValue(mockUser);

      await expect(service.create(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(findByEmailSpy).toHaveBeenCalledWith(registerDto.email);
    });

    it("should throw BadRequestException if password is weak", async () => {
      findByEmailSpy.mockResolvedValue(null);
      validatePasswordStrengthSpy.mockReturnValue({
        isValid: false,
        errors: ["Password is too weak"],
      });

      await expect(service.create(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(validatePasswordStrengthSpy).toHaveBeenCalledWith(
        registerDto.password,
      );
    });
  });

  describe("findById", () => {
    it("should return user if found", async () => {
      findByIdSpy.mockResolvedValue(mockUser);

      const result = await service.findById("test-user-id");

      expect(findByIdSpy).toHaveBeenCalledWith("test-user-id");
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      findByIdSpy.mockResolvedValue(null);

      const result = await service.findById("non-existent-id");

      expect(findByIdSpy).toHaveBeenCalledWith("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should return user if found", async () => {
      findByEmailSpy.mockResolvedValue(mockUser);

      const result = await service.findByEmail("test@example.com");

      expect(findByEmailSpy).toHaveBeenCalledWith("test@example.com");
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      findByEmailSpy.mockResolvedValue(null);

      const result = await service.findByEmail("nonexistent@example.com");

      expect(findByEmailSpy).toHaveBeenCalledWith("nonexistent@example.com");
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    const updateUserDto: UpdateUserDto = {
      name: "Jane Smith",
    };

    it("should update user successfully", async () => {
      const updatedUser = new User({ ...mockUser, ...updateUserDto });
      findByIdSpy.mockResolvedValue(mockUser);
      updateSpy.mockResolvedValue(updatedUser);

      const result = await service.update("test-user-id", updateUserDto);

      expect(findByIdSpy).toHaveBeenCalledWith("test-user-id");
      expect(updateSpy).toHaveBeenCalledWith("test-user-id", updateUserDto);
      expect(result).toEqual(updatedUser.toProfile());
    });

    it("should throw NotFoundException if user not found", async () => {
      findByIdSpy.mockResolvedValue(null);

      await expect(
        service.update("non-existent-id", updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("changePassword", () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: "CurrentPassword123@",
      newPassword: "NewPassword123@",
    };

    it("should change password successfully", async () => {
      findByIdSpy.mockResolvedValue(mockUser);
      comparePasswordSpy.mockResolvedValue(true);
      validatePasswordStrengthSpy.mockReturnValue({
        isValid: true,
        errors: [],
      });
      hashPasswordSpy.mockResolvedValue("new-hashed-password");
      updateSpy.mockResolvedValue(mockUser);

      await service.changePassword("test-user-id", changePasswordDto);

      expect(findByIdSpy).toHaveBeenCalledWith("test-user-id");
      expect(comparePasswordSpy).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.passwordHash,
      );
      expect(validatePasswordStrengthSpy).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
      );
      expect(hashPasswordSpy).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
      );
      expect(updateSpy).toHaveBeenCalledWith("test-user-id", {
        passwordHash: "new-hashed-password",
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      findByIdSpy.mockResolvedValue(null);

      await expect(
        service.changePassword("non-existent-id", changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if current password is incorrect", async () => {
      findByIdSpy.mockResolvedValue(mockUser);
      comparePasswordSpy.mockResolvedValue(false);

      await expect(
        service.changePassword("test-user-id", changePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if new password is weak", async () => {
      findByIdSpy.mockResolvedValue(mockUser);
      comparePasswordSpy.mockResolvedValue(true);
      validatePasswordStrengthSpy.mockReturnValue({
        isValid: false,
        errors: ["Password is too weak"],
      });

      await expect(
        service.changePassword("test-user-id", changePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("delete", () => {
    it("should delete user successfully", async () => {
      deleteSpy.mockResolvedValue(true);

      await service.delete("test-user-id");

      expect(deleteSpy).toHaveBeenCalledWith("test-user-id");
    });

    it("should throw NotFoundException if user not found", async () => {
      deleteSpy.mockResolvedValue(false);

      await expect(service.delete("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("validatePassword", () => {
    it("should return user if credentials are valid", async () => {
      findByEmailSpy.mockResolvedValue(mockUser);
      comparePasswordSpy.mockResolvedValue(true);

      const result = await service.validatePassword(
        "test@example.com",
        "correct-password",
      );

      expect(findByEmailSpy).toHaveBeenCalledWith("test@example.com");
      expect(comparePasswordSpy).toHaveBeenCalledWith(
        "correct-password",
        mockUser.passwordHash,
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      findByEmailSpy.mockResolvedValue(null);

      const result = await service.validatePassword(
        "nonexistent@example.com",
        "password",
      );

      expect(result).toBeNull();
    });

    it("should return null if user is inactive", async () => {
      const inactiveUser = new User({ ...mockUser, isActive: false });
      findByEmailSpy.mockResolvedValue(inactiveUser);

      const result = await service.validatePassword(
        "test@example.com",
        "password",
      );

      expect(result).toBeNull();
    });

    it("should return null if password is incorrect", async () => {
      findByEmailSpy.mockResolvedValue(mockUser);
      comparePasswordSpy.mockResolvedValue(false);

      const result = await service.validatePassword(
        "test@example.com",
        "wrong-password",
      );

      expect(result).toBeNull();
    });
  });
});
