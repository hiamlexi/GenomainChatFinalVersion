-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "pfpFilename" TEXT,
    "role" TEXT NOT NULL DEFAULT 'default',
    "suspended" INTEGER NOT NULL DEFAULT 0,
    "seen_recovery_codes" BOOLEAN DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyMessageLimit" INTEGER DEFAULT 1000,
    "bio" TEXT DEFAULT '',
    "email" TEXT NOT NULL,
    "name" TEXT,
    "companyId" TEXT,
    "agentId" TEXT,
    "aiName" TEXT,
    "aiPrompt" TEXT,
    "files" TEXT,
    "urls" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitationToken" TEXT,
    "invitationSentAt" DATETIME,
    "invitationExpiresAt" DATETIME,
    "activatedAt" DATETIME,
    "mustResetPassword" BOOLEAN NOT NULL DEFAULT false,
    "llmProvider" TEXT,
    "llmModel" TEXT,
    "agentProvider" TEXT,
    "agentModel" TEXT,
    "llmSettingsLocked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "computer_agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("activatedAt", "agentId", "aiName", "aiPrompt", "bio", "companyId", "createdAt", "dailyMessageLimit", "email", "files", "id", "invitationExpiresAt", "invitationSentAt", "invitationToken", "isDeleted", "lastUpdatedAt", "mustResetPassword", "name", "password", "pfpFilename", "role", "seen_recovery_codes", "status", "suspended", "urls", "username") SELECT "activatedAt", "agentId", "aiName", "aiPrompt", "bio", "companyId", "createdAt", "dailyMessageLimit", "email", "files", "id", "invitationExpiresAt", "invitationSentAt", "invitationToken", "isDeleted", "lastUpdatedAt", "mustResetPassword", "name", "password", "pfpFilename", "role", "seen_recovery_codes", "status", "suspended", "urls", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_invitationToken_key" ON "users"("invitationToken");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
