-- UpdateEnum: Change TodoType enum values from uppercase to lowercase
BEGIN;

-- First, update all existing data to use lowercase values
UPDATE "public"."todos" SET "todoType" = 'event' WHERE "todoType" = 'EVENT';
UPDATE "public"."todos" SET "todoType" = 'task' WHERE "todoType" = 'TASK';

-- Create new enum with lowercase values
CREATE TYPE "public"."todo_type_new" AS ENUM ('event', 'task');

-- Remove default temporarily
ALTER TABLE "public"."todos" ALTER COLUMN "todoType" DROP DEFAULT;

-- Change column to use new enum type
ALTER TABLE "public"."todos" ALTER COLUMN "todoType" TYPE "public"."todo_type_new" USING ("todoType"::text::"public"."todo_type_new");

-- Drop old enum type and rename new one
DROP TYPE "public"."todo_type";
ALTER TYPE "public"."todo_type_new" RENAME TO "todo_type";

-- Set new default value
ALTER TABLE "public"."todos" ALTER COLUMN "todoType" SET DEFAULT 'event';

COMMIT;