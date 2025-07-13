import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  ValidationPipe,
  UseGuards,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";
import { TodoService } from "./todo.service";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";
import {
  TodoResponseDto,
  TodoListResponseDto,
  TodoStatsResponseDto,
  DeleteTodoResponseDto,
} from "./dto/todo-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "../users/user.entity";

@ApiTags("todos")
@Controller("todos")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @ApiOperation({ summary: "새 할일 생성" })
  @ApiResponse({
    status: 201,
    description: "할일이 성공적으로 생성되었습니다",
    type: TodoResponseDto,
  })
  @ApiBadRequestResponse({
    description: "잘못된 입력 데이터",
    schema: {
      properties: {
        statusCode: { type: "number", example: 400 },
        message: { type: "array", items: { type: "string" } },
        error: { type: "string", example: "Bad Request" },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "인증되지 않은 사용자",
    schema: {
      properties: {
        statusCode: { type: "number", example: 401 },
        message: { type: "string", example: "Unauthorized" },
      },
    },
  })
  async create(
    @Body() createTodoDto: CreateTodoDto,
    @CurrentUser() user: User,
  ): Promise<TodoResponseDto> {
    console.log("=== Todo Create Controller ===");
    console.log("User ID:", user.id);
    console.log("Create Todo DTO:", JSON.stringify(createTodoDto, null, 2));

    const todo = await this.todoService.create(createTodoDto, user.id);
    return { todo };
  }

  @Get()
  @ApiOperation({ summary: "할일 목록 조회" })
  @ApiResponse({
    status: 200,
    description: "할일 목록이 성공적으로 조회되었습니다",
    type: TodoListResponseDto,
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    description: "시작 날짜 (ISO 8601 형식)",
    example: "2024-01-01T00:00:00.000Z",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    description: "종료 날짜 (ISO 8601 형식)",
    example: "2024-01-31T23:59:59.999Z",
  })
  @ApiQuery({
    name: "categoryId",
    required: false,
    description: "카테고리 ID로 필터링",
    example: "work",
  })
  @ApiQuery({
    name: "completed",
    required: false,
    description: "완료 상태로 필터링",
    example: true,
  })
  async findAll(
    @CurrentUser() user: User,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("categoryId") categoryId?: string,
    @Query("completed", new ParseBoolPipe({ optional: true }))
    completed?: boolean,
  ): Promise<TodoListResponseDto> {
    const todos = await this.todoService.findAll(
      user.id,
      startDate,
      endDate,
      categoryId,
      completed,
    );
    const stats = await this.todoService.getStats(user.id);
    return { todos, stats };
  }

  @Get("stats")
  @ApiOperation({ summary: "할일 통계 조회" })
  @ApiResponse({
    status: 200,
    description: "할일 통계가 성공적으로 조회되었습니다",
    type: TodoStatsResponseDto,
  })
  async getStats(@CurrentUser() user: User): Promise<TodoStatsResponseDto> {
    const stats = await this.todoService.getStats(user.id);
    return { stats };
  }

  @Get(":id")
  @ApiOperation({ summary: "특정 할일 조회" })
  @ApiParam({
    name: "id",
    description: "할일 ID",
    example: "abc123",
  })
  @ApiResponse({
    status: 200,
    description: "할일이 성공적으로 조회되었습니다",
    type: TodoResponseDto,
  })
  @ApiNotFoundResponse({
    description: "할일을 찾을 수 없습니다",
    schema: {
      properties: {
        statusCode: { type: "number", example: 404 },
        message: { type: "string", example: "할일을 찾을 수 없습니다" },
        error: { type: "string", example: "Not Found" },
      },
    },
  })
  @ApiForbiddenResponse({
    description: "해당 할일에 접근할 권한이 없습니다",
    schema: {
      properties: {
        statusCode: { type: "number", example: 403 },
        message: {
          type: "string",
          example: "해당 할일에 접근할 권한이 없습니다",
        },
        error: { type: "string", example: "Forbidden" },
      },
    },
  })
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: User,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoService.findOne(id, user.id);
    return { todo };
  }

  @Put(":id")
  @ApiOperation({ summary: "할일 수정" })
  @ApiParam({
    name: "id",
    description: "할일 ID",
    example: "abc123",
  })
  @ApiResponse({
    status: 200,
    description: "할일이 성공적으로 수정되었습니다",
    type: TodoResponseDto,
  })
  @ApiBadRequestResponse({
    description: "잘못된 입력 데이터",
  })
  @ApiNotFoundResponse({
    description: "할일을 찾을 수 없습니다",
  })
  @ApiForbiddenResponse({
    description: "해당 할일을 수정할 권한이 없습니다",
  })
  async update(
    @Param("id") id: string,
    @Body(ValidationPipe) updateTodoDto: UpdateTodoDto,
    @CurrentUser() user: User,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoService.update(id, updateTodoDto, user.id);
    return { todo };
  }

  @Patch(":id/toggle")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "할일 완료 상태 토글" })
  @ApiParam({
    name: "id",
    description: "할일 ID",
    example: "abc123",
  })
  @ApiResponse({
    status: 200,
    description: "할일 완료 상태가 성공적으로 토글되었습니다",
    type: TodoResponseDto,
  })
  @ApiNotFoundResponse({
    description: "할일을 찾을 수 없습니다",
  })
  @ApiForbiddenResponse({
    description: "해당 할일을 수정할 권한이 없습니다",
  })
  async toggle(
    @Param("id") id: string,
    @CurrentUser() user: User,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoService.toggle(id, user.id);
    return { todo };
  }

  @Delete(":id")
  @ApiOperation({ summary: "할일 삭제" })
  @ApiParam({
    name: "id",
    description: "할일 ID",
    example: "abc123",
  })
  @ApiResponse({
    status: 200,
    description: "할일이 성공적으로 삭제되었습니다",
    type: DeleteTodoResponseDto,
  })
  @ApiNotFoundResponse({
    description: "할일을 찾을 수 없습니다",
  })
  @ApiForbiddenResponse({
    description: "해당 할일을 삭제할 권한이 없습니다",
  })
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: User,
  ): Promise<DeleteTodoResponseDto> {
    return await this.todoService.remove(id, user.id);
  }

  @Delete()
  @ApiOperation({ summary: "모든 할일 삭제" })
  @ApiResponse({
    status: 200,
    description: "모든 할일이 성공적으로 삭제되었습니다",
    schema: {
      properties: {
        deletedCount: { type: "number", example: 5 },
        message: { type: "string", example: "모든 할일이 삭제되었습니다" },
      },
    },
  })
  async removeAll(
    @CurrentUser() user: User,
  ): Promise<{ deletedCount: number; message: string }> {
    const deletedCount = await this.todoService.removeAllByUserId(user.id);
    return {
      deletedCount,
      message: "모든 할일이 삭제되었습니다",
    };
  }
}
