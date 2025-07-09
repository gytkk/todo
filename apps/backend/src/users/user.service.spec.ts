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

describe("UserService", () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordService: jest.Mocked<PasswordService>;

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
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockPasswordService = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
      validatePasswordStrength: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    passwordService = module.get(PasswordService);
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
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue("hashed-password");
      userRepository.create.mockResolvedValue(mockUser);
    });

    it("should create a new user successfully", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.create(registerDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(passwordService.validatePasswordStrength).toHaveBeenCalledWith(
        registerDto.password,
      );
      expect(passwordService.hashPassword).toHaveBeenCalledWith(
        registerDto.password,
      );
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: "hashed-password",
        name: registerDto.name,
        emailVerified: false,
        isActive: true,
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw ConflictException if email already exists", async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
    });

    // Username conflict test removed as username field doesn't exist in current implementation

    it("should throw BadRequestException if password is weak", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ["Password is too weak"],
      });

      await expect(service.create(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(passwordService.validatePasswordStrength).toHaveBeenCalledWith(
        registerDto.password,
      );
    });

    // Username-related test removed as username field doesn't exist in current implementation
  });

  describe("findById", () => {
    it("should return user if found", async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById("test-user-id");

      expect(userRepository.findById).toHaveBeenCalledWith("test-user-id");
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await service.findById("non-existent-id");

      expect(userRepository.findById).toHaveBeenCalledWith("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should return user if found", async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail("test@example.com");

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail("nonexistent@example.com");

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "nonexistent@example.com",
      );
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    const updateUserDto: UpdateUserDto = {
      name: "Jane Smith",
    };

    it("should update user successfully", async () => {
      const updatedUser = new User({ ...mockUser, ...updateUserDto });
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update("test-user-id", updateUserDto);

      expect(userRepository.findById).toHaveBeenCalledWith("test-user-id");
      expect(userRepository.update).toHaveBeenCalledWith(
        "test-user-id",
        updateUserDto,
      );
      expect(result).toEqual(updatedUser.toProfile());
    });

    it("should throw NotFoundException if user not found", async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.update("non-existent-id", updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });

    // Username conflict test removed as username field doesn't exist in current implementation

    // Username-related test removed as username field doesn't exist in current implementation
  });

  describe("changePassword", () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: "CurrentPassword123@",
      newPassword: "NewPassword123@",
    };

    it("should change password successfully", async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(true);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue("new-hashed-password");
      userRepository.update.mockResolvedValue(mockUser);

      await service.changePassword("test-user-id", changePasswordDto);

      expect(userRepository.findById).toHaveBeenCalledWith("test-user-id");
      expect(passwordService.comparePassword).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.passwordHash,
      );
      expect(passwordService.validatePasswordStrength).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
      );
      expect(passwordService.hashPassword).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
      );
      expect(userRepository.update).toHaveBeenCalledWith("test-user-id", {
        passwordHash: "new-hashed-password",
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.changePassword("non-existent-id", changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if current password is incorrect", async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(false);

      await expect(
        service.changePassword("test-user-id", changePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if new password is weak", async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(true);
      passwordService.validatePasswordStrength.mockReturnValue({
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
      userRepository.delete.mockResolvedValue(true);

      await service.delete("test-user-id");

      expect(userRepository.delete).toHaveBeenCalledWith("test-user-id");
    });

    it("should throw NotFoundException if user not found", async () => {
      userRepository.delete.mockResolvedValue(false);

      await expect(service.delete("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("validatePassword", () => {
    it("should return user if credentials are valid", async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(true);

      const result = await service.validatePassword(
        "test@example.com",
        "correct-password",
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(passwordService.comparePassword).toHaveBeenCalledWith(
        "correct-password",
        mockUser.passwordHash,
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validatePassword(
        "nonexistent@example.com",
        "password",
      );

      expect(result).toBeNull();
    });

    it("should return null if user is inactive", async () => {
      const inactiveUser = new User({ ...mockUser, isActive: false });
      userRepository.findByEmail.mockResolvedValue(inactiveUser);

      const result = await service.validatePassword(
        "test@example.com",
        "password",
      );

      expect(result).toBeNull();
    });

    it("should return null if password is incorrect", async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(false);

      const result = await service.validatePassword(
        "test@example.com",
        "wrong-password",
      );

      expect(result).toBeNull();
    });
  });
});
