const prisma = require("../utils/prisma");
const { ROLES } = require("../utils/middleware/multiUserProtected");

const DocumentUploads = {
  /**
   * Track a document upload
   * @param {Object} data - The upload data
   * @param {string} data.filename - The filename of the document
   * @param {string} data.folderName - The folder name where document is stored
   * @param {string} data.fullPath - The full path to the document
   * @param {number} data.uploadedBy - The user ID who uploaded the document
   * @returns {Promise<Object>} The created record
   */
  create: async function ({ filename, folderName, fullPath, uploadedBy }) {
    try {
      const upload = await prisma.document_uploads.create({
        data: {
          filename,
          folderName,
          fullPath,
          uploadedBy,
        },
      });
      return { upload, error: null };
    } catch (error) {
      console.error("Failed to track document upload:", error.message);
      return { upload: null, error: error.message };
    }
  },

  /**
   * Get a document upload record
   * @param {Object} clause - The search clause
   * @returns {Promise<Object|null>} The upload record
   */
  get: async function (clause = {}) {
    try {
      const upload = await prisma.document_uploads.findFirst({
        where: clause,
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });
      return upload;
    } catch (error) {
      console.error("Failed to get document upload:", error.message);
      return null;
    }
  },

  /**
   * Get all document uploads for a user based on their role
   * @param {Object} user - The user object
   * @returns {Promise<Array>} Array of document uploads
   */
  getForUser: async function (user) {
    try {
      // Admins can see all documents
      if (user?.role === ROLES.admin) {
        return await prisma.document_uploads.findMany({
          include: {
            uploader: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        });
      }

      // Managers can only see documents they uploaded or documents in workspaces they have access to
      if (user?.role === ROLES.manager) {
        // Get all workspaces the manager has access to
        const accessibleWorkspaces = await prisma.workspaces.findMany({
          where: {
            OR: [
              { createdBy: user.id },
              {
                workspace_users: {
                  some: {
                    user_id: user.id,
                  },
                },
              },
            ],
          },
          select: { id: true },
        });

        const workspaceIds = accessibleWorkspaces.map(w => w.id);
        
        // Get all documents that are either:
        // 1. Uploaded by the manager
        // 2. Embedded in workspaces the manager has access to
        const uploads = await prisma.document_uploads.findMany({
          where: {
            uploadedBy: user.id,
          },
          include: {
            uploader: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        });

        // Also get documents from workspace_documents that are in accessible workspaces
        const workspaceDocs = await prisma.workspace_documents.findMany({
          where: {
            workspaceId: { in: workspaceIds },
          },
          select: {
            docpath: true,
            filename: true,
          },
        });

        // Create a set of accessible document paths
        const accessiblePaths = new Set(uploads.map(u => u.fullPath));
        workspaceDocs.forEach(doc => {
          accessiblePaths.add(doc.docpath);
        });

        return uploads;
      }

      // Regular users can only see documents they uploaded
      return await prisma.document_uploads.findMany({
        where: {
          uploadedBy: user.id,
        },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Failed to get documents for user:", error.message);
      return [];
    }
  },

  /**
   * Get accessible document paths for a user
   * @param {Object} user - The user object
   * @returns {Promise<Set|null>} Set of accessible document paths, or null if all are accessible
   */
  getAccessiblePaths: async function (user) {
    try {
      // Admins can see all documents
      if (user?.role === ROLES.admin) {
        return null; // null means all paths are accessible
      }

      const accessiblePaths = new Set();

      // Get all tracked documents
      const allTrackedDocs = await prisma.document_uploads.findMany({
        select: { fullPath: true, uploadedBy: true },
      });

      // Add documents that:
      // 1. Were uploaded by the user
      // 2. Have no uploadedBy (backward compatibility - documents uploaded before tracking)
      allTrackedDocs.forEach(doc => {
        if (!doc.uploadedBy || doc.uploadedBy === user.id) {
          accessiblePaths.add(doc.fullPath);
        }
      });

      // For managers, also add documents from workspaces they have access to
      if (user?.role === ROLES.manager) {
        // Add documents uploaded by any user if manager has workspace access
        const accessibleWorkspaces = await prisma.workspaces.findMany({
          where: {
            OR: [
              { createdBy: user.id },
              {
                workspace_users: {
                  some: {
                    user_id: user.id,
                  },
                },
              },
            ],
          },
          select: { id: true },
        });

        const workspaceIds = accessibleWorkspaces.map(w => w.id);
        const workspaceDocs = await prisma.workspace_documents.findMany({
          where: {
            workspaceId: { in: workspaceIds },
          },
          select: {
            docpath: true,
          },
        });

        workspaceDocs.forEach(doc => {
          accessiblePaths.add(doc.docpath);
        });
        
        // Also add any untracked documents in the file system for backward compatibility
        // This ensures documents created before our tracking system still show up
      }

      return accessiblePaths;
    } catch (error) {
      console.error("Failed to get accessible paths:", error.message);
      return new Set();
    }
  },

  /**
   * Delete a document upload record
   * @param {Object} clause - The delete clause
   * @returns {Promise<boolean>} Success status
   */
  delete: async function (clause = {}) {
    try {
      await prisma.document_uploads.deleteMany({ where: clause });
      return true;
    } catch (error) {
      console.error("Failed to delete document upload:", error.message);
      return false;
    }
  },
};

module.exports = { DocumentUploads };