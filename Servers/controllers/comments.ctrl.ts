import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import { Op, QueryTypes } from "sequelize";
import {
  logFailure,
  logProcessing,
  logSuccess,
} from "../utils/logger/logHelper";
import { CommentModel } from "../domain.layer/models/comment/comment.model";
import { CommentFileModel } from "../domain.layer/models/comment/commentFile.model";
import { CommentReactionModel } from "../domain.layer/models/comment/commentReaction.model";
import { CommentReadStatusModel } from "../domain.layer/models/comment/commentReadStatus.model";
import { UserModel } from "../domain.layer/models/user/user.model";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";
import path from "path";
import fs from "fs/promises";

/**
 * Get all comments for a specific table row with pagination
 * GET /api/comments/:tableId/:rowId?page=1&limit=50
 */
export async function getCommentsByTableRow(
  req: Request,
  res: Response
): Promise<any> {
  const { tableId, rowId } = req.params;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  // Pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
  const offset = (page - 1) * limit;

  logProcessing({
    description: `Getting comments for ${tableId}/${rowId} (page ${page})`,
    functionName: "getCommentsByTableRow",
    fileName: "comments.ctrl.ts",
  });

  try {
    // Get user's last read timestamp for this table/row
    const lastReadAt = await CommentReadStatusModel.getLastReadAt(
      userId,
      tableId,
      rowId,
      organizationId
    );

    // Get total count for pagination
    const totalCount = await CommentModel.count({
      where: {
        table_id: tableId,
        row_id: rowId,
        organization_id: organizationId,
      },
    });

    // Get comments with pagination
    // Order by DESC (newest first) so new messages appear in the result set
    const comments = await CommentModel.findAll({
      where: {
        table_id: tableId,
        row_id: rowId,
        organization_id: organizationId,
      },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "surname", "profile_photo_id"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    // Batch load all reactions for these comments (fixes N+1 query)
    const commentIds = comments.map((c) => c.id!);
    const allReactions = await CommentReactionModel.findAll({
      where: {
        comment_id: commentIds,
        organization_id: organizationId,
      },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "surname", "profile_photo_id"],
        },
      ],
    });

    // Group reactions by comment_id
    const reactionsByCommentId = allReactions.reduce((acc, reaction) => {
      if (!acc[reaction.comment_id]) {
        acc[reaction.comment_id] = [];
      }
      acc[reaction.comment_id].push(reaction);
      return acc;
    }, {} as Record<number, CommentReactionModel[]>);

    // Attach reactions and isUnread flag to comments
    const commentsWithReactions = comments.map((comment) => {
      const commentReactions = reactionsByCommentId[comment.id!] || [];

      // Group reactions by emoji
      const groupedReactions = commentReactions.reduce((acc, reaction) => {
        const existing = acc.find((r) => r.emoji === reaction.emoji);
        if (existing) {
          existing.userIds.push(reaction.user_id);
        } else {
          acc.push({
            emoji: reaction.emoji,
            userIds: [reaction.user_id],
          });
        }
        return acc;
      }, [] as Array<{ emoji: string; userIds: number[] }>);

      // Determine if message is unread (created after last read timestamp)
      const isUnread = lastReadAt
        ? new Date(comment.created_at!) > new Date(lastReadAt)
        : true; // If never read, all messages are unread

      return {
        ...comment.toJSON(),
        reactions: groupedReactions,
        isUnread,
      };
    });

    await logSuccess({
      eventType: "Read",
      description: `Retrieved ${comments.length} comments for ${tableId}/${rowId}`,
      functionName: "getCommentsByTableRow",
      fileName: "comments.ctrl.ts",
    });

    return res.status(200).json(
      STATUS_CODE[200]({
        comments: commentsWithReactions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      })
    );
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve comments",
      functionName: "getCommentsByTableRow",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Create a new comment
 * POST /api/comments
 */
export async function createComment(req: Request, res: Response): Promise<any> {
  const { tableId, rowId, message } = req.body;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  logProcessing({
    description: "Creating new comment",
    functionName: "createComment",
    fileName: "comments.ctrl.ts",
  });

  try {
    const comment = await CommentModel.createNewComment(
      tableId,
      rowId,
      message,
      userId,
      organizationId
    );

    await comment.save();

    await logSuccess({
      eventType: "Create",
      description: `Created comment for ${tableId}/${rowId}`,
      functionName: "createComment",
      fileName: "comments.ctrl.ts",
    });

    return res.status(201).json(STATUS_CODE[201](comment));
  } catch (error) {
    if (error instanceof ValidationException) {
      await logFailure({
        eventType: "Create",
        description: "Validation error creating comment",
        functionName: "createComment",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to create comment",
      functionName: "createComment",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get all files for a specific table row
 * GET /api/comments/:tableId/:rowId/files
 */
export async function getFilesByTableRow(
  req: Request,
  res: Response
): Promise<any> {
  const { tableId, rowId } = req.params;
  const organizationId = req.organizationId!;

  logProcessing({
    description: `Getting files for ${tableId}/${rowId}`,
    functionName: "getFilesByTableRow",
    fileName: "comments.ctrl.ts",
  });

  try {
    const files = await CommentFileModel.findAll({
      where: {
        table_id: tableId,
        row_id: rowId,
        organization_id: organizationId,
        // DO NOT filter deleted_at - we want to show deleted files too
      },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "surname", "profile_photo_id"],
        },
        {
          model: UserModel,
          as: "deletedByUser",
          attributes: ["id", "name", "surname"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    console.log(`[getFilesByTableRow] Found ${files.length} files (including deleted):`,
      files.map(f => ({
        id: f.id,
        name: f.file_name,
        deleted_at: f.deleted_at,
        user: f.user ? { id: f.user.id, name: f.user.name, surname: f.user.surname } : null
      }))
    );

    await logSuccess({
      eventType: "Read",
      description: `Retrieved ${files.length} files for ${tableId}/${rowId}`,
      functionName: "getFilesByTableRow",
      fileName: "comments.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](files));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve files",
      functionName: "getFilesByTableRow",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Upload a file
 * POST /api/comments/files
 */
export async function uploadFile(req: Request, res: Response): Promise<any> {
  const { tableId, rowId, commentId } = req.body;
  const userId = req.userId!;
  const organizationId = req.organizationId!;
  const file = req.file;

  logProcessing({
    description: "Uploading file",
    functionName: "uploadFile",
    fileName: "comments.ctrl.ts",
  });

  try {
    if (!file) {
      throw new ValidationException("File is required", "file", null);
    }

    // Validate MIME type matches file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeTypeMap: Record<string, string[]> = {
      ".jpg": ["image/jpeg"],
      ".jpeg": ["image/jpeg"],
      ".png": ["image/png"],
      ".pdf": ["application/pdf"],
      ".doc": ["application/msword"],
      ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      ".xls": ["application/vnd.ms-excel"],
      ".xlsx": [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      ".txt": ["text/plain"],
      ".csv": ["text/csv", "application/csv"],
    };

    const allowedMimeTypes = mimeTypeMap[ext];
    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
      // Clean up uploaded file on validation failure
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }

      throw new ValidationException(
        "File extension does not match MIME type",
        "file",
        `Extension: ${ext}, MIME: ${file.mimetype}`
      );
    }

    const commentFile = await CommentFileModel.createNewFile(
      tableId,
      rowId,
      file.originalname,
      file.path,
      file.size,
      file.mimetype,
      userId,
      organizationId,
      commentId ? parseInt(commentId) : undefined
    );

    await commentFile.save();

    await logSuccess({
      eventType: "Create",
      description: `Uploaded file ${file.filename} for ${tableId}/${rowId}`,
      functionName: "uploadFile",
      fileName: "comments.ctrl.ts",
    });

    return res.status(201).json(STATUS_CODE[201](commentFile));
  } catch (error) {
    // Clean up uploaded file on any error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    if (error instanceof ValidationException) {
      await logFailure({
        eventType: "Create",
        description: "Validation error uploading file",
        functionName: "uploadFile",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to upload file",
      functionName: "uploadFile",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Download a file
 * GET /api/comments/files/:fileId/download
 */
export async function downloadFile(req: Request, res: Response): Promise<any> {
  const fileId = parseInt(req.params.fileId);
  const organizationId = req.organizationId!;

  logProcessing({
    description: `Downloading file ${fileId}`,
    functionName: "downloadFile",
    fileName: "comments.ctrl.ts",
  });

  try {
    const file = await CommentFileModel.findOne({
      where: {
        id: fileId,
        organization_id: organizationId,
      },
    });

    if (!file) {
      await logSuccess({
        eventType: "Read",
        description: `File not found: ${fileId}`,
        functionName: "downloadFile",
        fileName: "comments.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404]("File not found"));
    }

    // Prevent path traversal attacks
    const uploadsDir = path.resolve("uploads/comments");
    const filePath = path.resolve(file.file_path);

    if (!filePath.startsWith(uploadsDir)) {
      throw new BusinessLogicException(
        "Invalid file path",
        "PATH_TRAVERSAL_ATTEMPT",
        { fileId, filePath }
      );
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (err) {
      throw new BusinessLogicException(
        "File not found on disk",
        "FILE_NOT_FOUND",
        { fileId, filePath }
      );
    }

    await logSuccess({
      eventType: "Read",
      description: `Downloaded file ${fileId}`,
      functionName: "downloadFile",
      fileName: "comments.ctrl.ts",
    });

    return res.download(filePath, file.file_name);
  } catch (error) {
    if (error instanceof BusinessLogicException) {
      await logFailure({
        eventType: "Read",
        description: "Security error downloading file",
        functionName: "downloadFile",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Read",
      description: "Failed to download file",
      functionName: "downloadFile",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Delete a file (soft delete)
 * DELETE /api/comments/files/:fileId
 */
export async function deleteFile(req: Request, res: Response): Promise<any> {
  const fileId = parseInt(req.params.fileId);
  const organizationId = req.organizationId!;
  const userId = req.userId!;

  logProcessing({
    description: `Deleting file ${fileId}`,
    functionName: "deleteFile",
    fileName: "comments.ctrl.ts",
  });

  // Use transaction to ensure atomicity
  const transaction = await sequelize.transaction();

  try {
    const file = await CommentFileModel.findOne({
      where: {
        id: fileId,
        organization_id: organizationId,
      },
      transaction,
    });

    if (!file) {
      await transaction.rollback();
      await logSuccess({
        eventType: "Delete",
        description: `File not found: ${fileId}`,
        functionName: "deleteFile",
        fileName: "comments.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404]("File not found"));
    }

    // Check if file is already deleted
    if (file.deleted_at) {
      await transaction.rollback();
      await logSuccess({
        eventType: "Delete",
        description: `File already deleted: ${fileId}`,
        functionName: "deleteFile",
        fileName: "comments.ctrl.ts",
      });
      return res.status(400).json(STATUS_CODE[400]("File already deleted"));
    }

    // Check if user is the file owner
    if (file.user_id !== userId) {
      await transaction.rollback();
      throw new BusinessLogicException(
        "You can only delete your own files",
        "UNAUTHORIZED_DELETE",
        { fileId, userId }
      );
    }

    const filePath = file.file_path;

    // Mark file as deleted (soft delete)
    file.deleted_by = userId;
    file.deleted_at = new Date();
    await file.save({ transaction });

    // Commit transaction before deleting file from filesystem
    await transaction.commit();

    // Delete file from filesystem after successful DB update
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error("Error deleting file from filesystem:", err);
      // File already marked as deleted in DB, log but don't fail the request
    }

    await logSuccess({
      eventType: "Delete",
      description: `Deleted file ${fileId}`,
      functionName: "deleteFile",
      fileName: "comments.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200]({ message: "File deleted successfully" }));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof BusinessLogicException) {
      await logFailure({
        eventType: "Delete",
        description: "Unauthorized file deletion",
        functionName: "deleteFile",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Delete",
      description: "Failed to delete file",
      functionName: "deleteFile",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Add a reaction to a comment
 * POST /api/comments/:commentId/reactions
 */
export async function addReaction(req: Request, res: Response): Promise<any> {
  const commentId = parseInt(req.params.commentId);
  const { emoji } = req.body;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  logProcessing({
    description: `Adding reaction to comment ${commentId}`,
    functionName: "addReaction",
    fileName: "comments.ctrl.ts",
  });

  try {
    const reaction = await CommentReactionModel.createNewReaction(
      commentId,
      emoji,
      userId,
      organizationId
    );

    await reaction.save();

    await logSuccess({
      eventType: "Create",
      description: `Added reaction ${emoji} to comment ${commentId}`,
      functionName: "addReaction",
      fileName: "comments.ctrl.ts",
    });

    return res.status(201).json(STATUS_CODE[201](reaction));
  } catch (error) {
    if (error instanceof ValidationException) {
      await logFailure({
        eventType: "Create",
        description: "Validation error adding reaction",
        functionName: "addReaction",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      await logFailure({
        eventType: "Create",
        description: "Business logic error adding reaction",
        functionName: "addReaction",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(409).json(STATUS_CODE[409](error.message));
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to add reaction",
      functionName: "addReaction",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Update a comment message
 * PUT /api/comments/:commentId
 */
export async function updateComment(req: Request, res: Response): Promise<any> {
  const commentId = parseInt(req.params.commentId);
  const { message } = req.body;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  logProcessing({
    description: `Updating comment ${commentId}`,
    functionName: "updateComment",
    fileName: "comments.ctrl.ts",
  });

  try {
    const comment = await CommentModel.findOne({
      where: {
        id: commentId,
        organization_id: organizationId,
      },
    });

    if (!comment) {
      await logSuccess({
        eventType: "Update",
        description: `Comment not found: ${commentId}`,
        functionName: "updateComment",
        fileName: "comments.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404]("Comment not found"));
    }

    // Check if user is the comment owner
    if (comment.user_id !== userId) {
      throw new BusinessLogicException(
        "You can only update your own comments",
        "UNAUTHORIZED_UPDATE",
        { commentId, userId }
      );
    }

    await comment.updateMessage(message);
    await comment.save();

    await logSuccess({
      eventType: "Update",
      description: `Updated comment ${commentId}`,
      functionName: "updateComment",
      fileName: "comments.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](comment));
  } catch (error) {
    if (error instanceof ValidationException) {
      await logFailure({
        eventType: "Update",
        description: "Validation error updating comment",
        functionName: "updateComment",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      await logFailure({
        eventType: "Update",
        description: "Unauthorized comment update",
        functionName: "updateComment",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Update",
      description: "Failed to update comment",
      functionName: "updateComment",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Delete a comment
 * DELETE /api/comments/:commentId
 */
export async function deleteComment(req: Request, res: Response): Promise<any> {
  const commentId = parseInt(req.params.commentId);
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  logProcessing({
    description: `Deleting comment ${commentId}`,
    functionName: "deleteComment",
    fileName: "comments.ctrl.ts",
  });

  try {
    const comment = await CommentModel.findOne({
      where: {
        id: commentId,
        organization_id: organizationId,
      },
    });

    if (!comment) {
      await logSuccess({
        eventType: "Delete",
        description: `Comment not found: ${commentId}`,
        functionName: "deleteComment",
        fileName: "comments.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404]("Comment not found"));
    }

    // Check if user is the comment owner
    if (comment.user_id !== userId) {
      throw new BusinessLogicException(
        "You can only delete your own comments",
        "UNAUTHORIZED_DELETE",
        { commentId, userId }
      );
    }

    await comment.destroy();

    await logSuccess({
      eventType: "Delete",
      description: `Deleted comment ${commentId}`,
      functionName: "deleteComment",
      fileName: "comments.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200]({ message: "Comment deleted successfully" }));
  } catch (error) {
    if (error instanceof BusinessLogicException) {
      await logFailure({
        eventType: "Delete",
        description: "Unauthorized comment deletion",
        functionName: "deleteComment",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Delete",
      description: "Failed to delete comment",
      functionName: "deleteComment",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Remove a reaction from a comment
 * DELETE /api/comments/:commentId/reactions/:emoji
 */
export async function removeReaction(req: Request, res: Response): Promise<any> {
  const commentId = parseInt(req.params.commentId);
  const { emoji } = req.params;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  logProcessing({
    description: `Removing reaction from comment ${commentId}`,
    functionName: "removeReaction",
    fileName: "comments.ctrl.ts",
  });

  try {
    const reaction = await CommentReactionModel.findOne({
      where: {
        comment_id: commentId,
        emoji: emoji,
        user_id: userId,
        organization_id: organizationId,
      },
    });

    if (!reaction) {
      await logSuccess({
        eventType: "Delete",
        description: `Reaction not found`,
        functionName: "removeReaction",
        fileName: "comments.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404]("Reaction not found"));
    }

    await reaction.destroy();

    await logSuccess({
      eventType: "Delete",
      description: `Removed reaction ${emoji} from comment ${commentId}`,
      functionName: "removeReaction",
      fileName: "comments.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200]({ message: "Reaction removed successfully" }));
  } catch (error) {
    await logFailure({
      eventType: "Delete",
      description: "Failed to remove reaction",
      functionName: "removeReaction",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get comment and file counts for all rows in a table
 * GET /api/comments/:tableId/counts
 * Returns unread message counts based on user's last_read_at timestamp
 *
 * OPTIMIZED: Uses single query with LEFT JOIN instead of N+1 queries
 */
export async function getTableCounts(req: Request, res: Response): Promise<any> {
  const { tableId } = req.params;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  logProcessing({
    description: `Getting unread counts for table ${tableId}`,
    functionName: "getTableCounts",
    fileName: "comments.ctrl.ts",
  });

  try {
    // Single optimized query with LEFT JOIN - handles N+1 problem
    // Returns unread count per row in one database roundtrip
    const unreadCounts = await sequelize.query(`
      SELECT
        c.row_id,
        COUNT(
          CASE
            WHEN c.created_at > COALESCE(crs.last_read_at, '1970-01-01'::timestamp)
            THEN 1
          END
        ) as unread_count
      FROM comments c
      LEFT JOIN comment_read_status crs
        ON crs.user_id = :userId
        AND crs.table_id = :tableId
        AND crs.row_id = c.row_id
        AND crs.organization_id = :organizationId
      WHERE c.table_id = :tableId
        AND c.organization_id = :organizationId
      GROUP BY c.row_id
    `, {
      replacements: {
        userId,
        tableId,
        organizationId
      },
      type: QueryTypes.SELECT
    }) as Array<{ row_id: string; unread_count: string }>;

    // Build counts object from query results
    const counts: Record<string, { unreadCount: number; fileCount: number }> = {};

    unreadCounts.forEach((row) => {
      const rowId = String(row.row_id);
      counts[rowId] = {
        unreadCount: parseInt(row.unread_count),
        fileCount: 0
      };
    });

    // Get file counts - FIXED: Use proper WHERE object instead of string literal
    const fileCounts = await CommentFileModel.findAll({
      attributes: [
        'row_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        table_id: tableId,
        organization_id: organizationId,
        deleted_at: { [Op.is]: null } as any  // TypeScript workaround for null comparison
      },
      group: ['row_id'],
      raw: true,
    });

    fileCounts.forEach((row: any) => {
      const rowId = String(row.row_id);
      if (!counts[rowId]) {
        counts[rowId] = { unreadCount: 0, fileCount: 0 };
      }
      counts[rowId].fileCount = parseInt(row.count);
    });

    await logSuccess({
      eventType: "Read",
      description: `Retrieved unread counts for table ${tableId}`,
      functionName: "getTableCounts",
      fileName: "comments.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](counts));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to get table counts",
      functionName: "getTableCounts",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Mark messages as read for a specific table row
 * POST /api/comments/mark-read
 */
export async function markAsRead(req: Request, res: Response): Promise<any> {
  const { tableId, rowId } = req.body;
  const userId = req.userId!;
  const organizationId = req.organizationId!;

  logProcessing({
    description: `Marking as read for ${tableId}/${rowId}`,
    functionName: "markAsRead",
    fileName: "comments.ctrl.ts",
  });

  try {
    const readStatus = await CommentReadStatusModel.markAsRead(
      userId,
      tableId,
      rowId,
      organizationId
    );

    await logSuccess({
      eventType: "Update",
      description: `Marked ${tableId}/${rowId} as read for user ${userId}`,
      functionName: "markAsRead",
      fileName: "comments.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200]({
      message: "Messages marked as read",
      lastReadAt: readStatus.last_read_at,
    }));
  } catch (error) {
    if (error instanceof ValidationException) {
      await logFailure({
        eventType: "Update",
        description: "Validation error marking as read",
        functionName: "markAsRead",
        fileName: "comments.ctrl.ts",
        error: error as Error,
      });
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    await logFailure({
      eventType: "Update",
      description: "Failed to mark as read",
      functionName: "markAsRead",
      fileName: "comments.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
