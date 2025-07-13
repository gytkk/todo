import { validate } from "class-validator";
import { ReorderCategoriesDto } from "./reorder-categories.dto";

describe("ReorderCategoriesDto", () => {
  it("유효한 categoryIds 배열을 허용해야 함", async () => {
    const dto = new ReorderCategoriesDto();
    dto.categoryIds = ["cat-1", "cat-2", "cat-3"];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("빈 배열을 거부해야 함", async () => {
    const dto = new ReorderCategoriesDto();
    dto.categoryIds = [];

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty("arrayNotEmpty");
  });

  it("배열이 아닌 값을 거부해야 함", async () => {
    const dto = new ReorderCategoriesDto();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (dto as any).categoryIds = "not-an-array";

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty("isArray");
  });

  it("문자열이 아닌 요소를 포함한 배열을 거부해야 함", async () => {
    const dto = new ReorderCategoriesDto();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (dto as any).categoryIds = ["cat-1", 123, "cat-2"];

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty("isString");
  });

  it("undefined categoryIds를 거부해야 함", async () => {
    const dto = new ReorderCategoriesDto();
    // categoryIds를 설정하지 않음

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe("categoryIds");
  });

  it("null categoryIds를 거부해야 함", async () => {
    const dto = new ReorderCategoriesDto();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (dto as any).categoryIds = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty("isArray");
  });

  it("빈 문자열을 포함한 배열을 허용해야 함", async () => {
    const dto = new ReorderCategoriesDto();
    dto.categoryIds = ["cat-1", "", "cat-2"];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0); // 빈 문자열도 유효한 문자열임
  });

  it("중복된 ID를 포함한 배열을 허용해야 함 (비즈니스 로직에서 처리)", async () => {
    const dto = new ReorderCategoriesDto();
    dto.categoryIds = ["cat-1", "cat-1", "cat-2"];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0); // DTO 수준에서는 중복을 허용, 비즈니스 로직에서 검증
  });

  it("매우 긴 ID 문자열을 허용해야 함", async () => {
    const dto = new ReorderCategoriesDto();
    const longId = "a".repeat(1000);
    dto.categoryIds = ["cat-1", longId, "cat-2"];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("특수 문자를 포함한 ID를 허용해야 함", async () => {
    const dto = new ReorderCategoriesDto();
    dto.categoryIds = ["cat-1", "cat_2-special.id", "cat@3"];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
