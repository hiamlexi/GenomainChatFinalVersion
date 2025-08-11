-- CreateTable for tracking document uploads and ownership
CREATE TABLE IF NOT EXISTS "document_uploads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "folderName" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL UNIQUE,
    "uploadedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_uploads_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "document_uploads_uploadedBy_idx" ON "document_uploads"("uploadedBy");
CREATE INDEX "document_uploads_fullPath_idx" ON "document_uploads"("fullPath");