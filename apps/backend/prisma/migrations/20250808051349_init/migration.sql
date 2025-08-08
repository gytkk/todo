-- CreateEnum
CREATE TYPE "public"."todo_type" AS ENUM ('EVENT', 'TASK');

-- CreateEnum
CREATE TYPE "public"."theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."todos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "todoType" "public"."todo_type" NOT NULL DEFAULT 'EVENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" "public"."theme" NOT NULL DEFAULT 'SYSTEM',
    "language" TEXT NOT NULL DEFAULT 'ko',
    "themeColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "customColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "defaultView" TEXT NOT NULL DEFAULT 'month',
    "dateFormat" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "timeFormat" TEXT NOT NULL DEFAULT '24h',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "weekStart" TEXT NOT NULL DEFAULT 'sunday',
    "oldTodoDisplayLimit" INTEGER NOT NULL DEFAULT 30,
    "autoMoveTodos" BOOLEAN NOT NULL DEFAULT true,
    "showTaskMoveNotifications" BOOLEAN NOT NULL DEFAULT true,
    "saturationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "saturationLevels" JSONB NOT NULL DEFAULT '[{"days":7,"opacity":1.0},{"days":14,"opacity":0.8},{"days":30,"opacity":0.6}]',
    "completedTodoDisplay" TEXT NOT NULL DEFAULT 'all',
    "showWeekends" BOOLEAN NOT NULL DEFAULT true,
    "autoBackup" BOOLEAN NOT NULL DEFAULT false,
    "backupInterval" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_key" ON "public"."categories"("userId", "name");

-- CreateIndex
CREATE INDEX "todos_userId_date_idx" ON "public"."todos"("userId", "date");

-- CreateIndex
CREATE INDEX "todos_userId_completed_idx" ON "public"."todos"("userId", "completed");

-- CreateIndex
CREATE INDEX "todos_userId_todoType_idx" ON "public"."todos"("userId", "todoType");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "public"."user_settings"("userId");

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."todos" ADD CONSTRAINT "todos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."todos" ADD CONSTRAINT "todos_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
