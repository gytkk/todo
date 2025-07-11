import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { User } from "./user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UserProfile } from "@calendar-todo/shared-types";

describe("UserController", () => {
  let controller: UserController;
  let userService: UserService;

  // Spy function references
  let updateSpy: jest.SpyInstance;
  let changePasswordSpy: jest.SpyInstance;
  let deleteSpy: jest.SpyInstance;

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

  const mockUserProfile: UserProfile = {
    id: "test-user-id",
    email: "test@example.com",
    name: "John Doe",
    emailVerified: false,
    createdAt: new Date("2023-01-01"),
  };

  beforeEach(async () => {
    const mockUserService = {
      update: jest.fn(),
      changePassword: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    // Create spies for UserService methods
    updateSpy = jest.spyOn(userService, "update");
    changePasswordSpy = jest.spyOn(userService, "changePassword");
    deleteSpy = jest.spyOn(userService, "delete");
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getProfile", () => {
    it("should return user profile", () => {
      const result = controller.getProfile(mockUser);

      expect(result).toEqual(mockUserProfile);
    });

    it("should call toProfile method on user", () => {
      const userWithSpy = {
        ...mockUser,
        toProfile: jest.fn().mockReturnValue(mockUserProfile),
      };

      const result = controller.getProfile(userWithSpy as User);

      expect(userWithSpy.toProfile).toHaveBeenCalled();
      expect(result).toEqual(mockUserProfile);
    });
  });

  describe("updateProfile", () => {
    const updateUserDto: UpdateUserDto = {
      name: "Jane Smith",
    };

    const updatedProfile: UserProfile = {
      ...mockUserProfile,
      name: "Jane Smith",
    };

    it("should update user profile successfully", async () => {
      updateSpy.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(
        "test-user-id",
        updateUserDto,
      );

      expect(updateSpy).toHaveBeenCalledWith("test-user-id", updateUserDto);
      expect(result).toEqual(updatedProfile);
    });

    it("should propagate service errors", async () => {
      const error = new Error("User not found");
      updateSpy.mockRejectedValue(error);

      await expect(
        controller.updateProfile("test-user-id", updateUserDto),
      ).rejects.toThrow(error);
    });
  });

  describe("changePassword", () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: "CurrentPassword123@",
      newPassword: "NewPassword123@",
    };

    it("should change password successfully", async () => {
      changePasswordSpy.mockResolvedValue(undefined);

      await controller.changePassword("test-user-id", changePasswordDto);

      expect(changePasswordSpy).toHaveBeenCalledWith(
        "test-user-id",
        changePasswordDto,
      );
    });

    it("should propagate service errors", async () => {
      const error = new Error("Current password is incorrect");
      changePasswordSpy.mockRejectedValue(error);

      await expect(
        controller.changePassword("test-user-id", changePasswordDto),
      ).rejects.toThrow(error);
    });
  });

  describe("deleteAccount", () => {
    it("should delete account successfully", async () => {
      deleteSpy.mockResolvedValue(undefined);

      await controller.deleteAccount("test-user-id");

      expect(deleteSpy).toHaveBeenCalledWith("test-user-id");
    });

    it("should propagate service errors", async () => {
      const error = new Error("User not found");
      deleteSpy.mockRejectedValue(error);

      await expect(controller.deleteAccount("test-user-id")).rejects.toThrow(
        error,
      );
    });
  });
});
