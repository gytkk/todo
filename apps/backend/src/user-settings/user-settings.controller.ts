import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { User } from "../users/user.entity";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

interface RequestWithUser {
  user: User;
}
import { UserSettingsService } from "./user-settings.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { ReorderCategoriesDto } from "./dto/reorder-categories.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("User Settings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("user-settings")
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) { }

  @Get()
  @ApiOperation({ summary: "사용자 설정 조회" })
  @ApiResponse({ status: 200, description: "사용자 설정 조회 성공" })
  async getUserSettings(@Request() req: RequestWithUser) {
    const settings = await this.userSettingsService.getUserSettings(
      req.user.id,
    );
    return { settings };
  }

  @Put()
  @ApiOperation({ summary: "사용자 설정 업데이트" })
  @ApiResponse({ status: 200, description: "사용자 설정 업데이트 성공" })
  async updateUserSettings(
    @Request() req: RequestWithUser,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    const settings = await this.userSettingsService.updateUserSettings(
      req.user.id,
      updateSettingsDto,
    );
    return { settings };
  }

  @Get("categories")
  @ApiOperation({ summary: "사용자 카테고리 목록 조회" })
  @ApiResponse({ status: 200, description: "카테고리 목록 조회 성공" })
  async getUserCategories(@Request() req: RequestWithUser) {
    const categories = await this.userSettingsService.getUserCategories(
      req.user.id,
    );
    return { categories };
  }

  @Post("categories")
  @ApiOperation({ summary: "새 카테고리 생성" })
  @ApiResponse({ status: 201, description: "카테고리 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청 (중복 이름, 색상 등)" })
  async createCategory(
    @Request() req: RequestWithUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const category = await this.userSettingsService.addCategory(
      req.user.id,
      createCategoryDto.name,
      createCategoryDto.color,
    );
    return { category };
  }

  @Put("categories/:id")
  @ApiOperation({ summary: "카테고리 수정" })
  @ApiResponse({ status: 200, description: "카테고리 수정 성공" })
  @ApiResponse({ status: 404, description: "카테고리를 찾을 수 없음" })
  @ApiResponse({
    status: 400,
    description: "잘못된 요청 (기본 카테고리 수정 시도 등)",
  })
  async updateCategory(
    @Request() req: RequestWithUser,
    @Param("id") categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.userSettingsService.updateCategory(
      req.user.id,
      categoryId,
      updateCategoryDto,
    );
    return { category };
  }

  @Delete("categories/:id")
  @ApiOperation({ summary: "카테고리 삭제" })
  @ApiResponse({ status: 200, description: "카테고리 삭제 성공" })
  @ApiResponse({ status: 404, description: "카테고리를 찾을 수 없음" })
  @ApiResponse({ status: 400, description: "기본 카테고리 삭제 시도" })
  async deleteCategory(
    @Request() req: RequestWithUser,
    @Param("id") categoryId: string,
  ) {
    const result = await this.userSettingsService.deleteCategory(
      req.user.id,
      categoryId,
    );
    return result;
  }

  @Get("categories/available-colors")
  @ApiOperation({ summary: "사용 가능한 색상 목록 조회" })
  @ApiResponse({ status: 200, description: "사용 가능한 색상 목록 조회 성공" })
  async getAvailableColors(@Request() req: RequestWithUser) {
    const colors = await this.userSettingsService.getAvailableColors(
      req.user.id,
    );
    return { colors };
  }

  @Put("categories/:id/filter")
  @ApiOperation({ summary: "카테고리 필터 설정 업데이트" })
  @ApiResponse({ status: 200, description: "카테고리 필터 업데이트 성공" })
  async updateCategoryFilter(
    @Request() req: RequestWithUser,
    @Param("id") categoryId: string,
    @Body() body: { enabled: boolean },
  ) {
    await this.userSettingsService.updateCategoryFilter(
      req.user.id,
      categoryId,
      body.enabled,
    );
    return { success: true };
  }

  @Get("category-filter")
  @ApiOperation({ summary: "카테고리 필터 설정 조회" })
  @ApiResponse({ status: 200, description: "카테고리 필터 조회 성공" })
  async getCategoryFilter(@Request() req: RequestWithUser) {
    const filter = await this.userSettingsService.getCategoryFilter(
      req.user.id,
    );
    return { filter };
  }

  @Put("categories/reorder")
  @ApiOperation({ summary: "카테고리 순서 변경" })
  @ApiResponse({ status: 200, description: "카테고리 순서 변경 성공" })
  @ApiResponse({ status: 400, description: "잘못된 카테고리 순서 요청" })
  async reorderCategories(
    @Request() req: RequestWithUser,
    @Body() reorderCategoriesDto: ReorderCategoriesDto,
  ) {
    try {
      console.log('=== Reorder Categories Controller ===');
      console.log('User ID:', req.user.id);
      console.log('Category IDs:', reorderCategoriesDto.categoryIds);

      const categories = await this.userSettingsService.reorderCategories(
        req.user.id,
        reorderCategoriesDto.categoryIds,
      );

      console.log('Reorder successful, returning categories:', categories.length);
      return { categories };
    } catch (error) {
      console.error('Reorder categories error:', error);
      throw error;
    }
  }
}
