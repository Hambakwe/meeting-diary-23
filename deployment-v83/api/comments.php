<?php
/**
 * Gantt Project Manager - Task Comments API
 * PHP 8.x Compatible
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Endpoints:
 * GET    /api/comments.php?task_id=1   - Get comments for a task
 * POST   /api/comments.php             - Create comment
 * PUT    /api/comments.php?id=1        - Update comment
 * DELETE /api/comments.php?id=1        - Delete comment
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$commentId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$taskId = isset($_GET['task_id']) ? (int)$_GET['task_id'] : null;

try {
    $db = Database::getInstance();

    switch ($method) {
        case 'GET':
            if (!$taskId) {
                errorResponse('Task ID is required', 400);
            }
            getComments($db, $taskId);
            break;

        case 'POST':
            createComment($db);
            break;

        case 'PUT':
            if (!$commentId) {
                errorResponse('Comment ID is required', 400);
            }
            updateComment($db, $commentId);
            break;

        case 'DELETE':
            if (!$commentId) {
                errorResponse('Comment ID is required', 400);
            }
            deleteComment($db, $commentId);
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Comments API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Get all comments for a task
 */
function getComments(PDO $db, int $taskId): void {
    $stmt = $db->prepare('
        SELECT
            c.*,
            COALESCE(c.user_name, u.full_name, "Anonymous") as display_name
        FROM task_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.task_id = ?
        ORDER BY c.created_at ASC
    ');
    $stmt->execute([$taskId]);
    $comments = $stmt->fetchAll();

    $formattedComments = array_map(function($comment) {
        return formatComment($comment);
    }, $comments);

    successResponse($formattedComments);
}

/**
 * Create new comment
 */
function createComment(PDO $db): void {
    $input = getJsonInput();

    if (empty($input['task_id'])) {
        errorResponse('Task ID is required', 400);
    }

    if (empty($input['comment']) && empty($input['content'])) {
        errorResponse('Comment content is required', 400);
    }

    $content = $input['comment'] ?? $input['content'];
    $userId = $input['user_id'] ?? getCurrentUserId();
    $userName = $input['user_name'] ?? null;

    // If no user_name provided, try to get it from the users table
    if (!$userName && $userId) {
        $stmt = $db->prepare('SELECT full_name FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        $userName = $user ? $user['full_name'] : 'Anonymous';
    }

    $stmt = $db->prepare('
        INSERT INTO task_comments (task_id, user_id, user_name, comment)
        VALUES (?, ?, ?, ?)
    ');

    $stmt->execute([
        (int)$input['task_id'],
        $userId,
        sanitize($userName ?? 'Anonymous'),
        sanitize($content)
    ]);

    $newCommentId = (int)$db->lastInsertId();

    // Get the task's project_id for logging
    $stmt = $db->prepare('SELECT project_id FROM tasks WHERE id = ?');
    $stmt->execute([$input['task_id']]);
    $task = $stmt->fetch();

    logActivity('comment_added', "Added comment to task ID: {$input['task_id']}", $task['project_id'] ?? null, $input['task_id']);

    // Return the created comment
    $stmt = $db->prepare('
        SELECT c.*, COALESCE(c.user_name, u.full_name, "Anonymous") as display_name
        FROM task_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    ');
    $stmt->execute([$newCommentId]);
    $comment = $stmt->fetch();

    successResponse(formatComment($comment), 'Comment added successfully');
}

/**
 * Update comment
 */
function updateComment(PDO $db, int $commentId): void {
    $input = getJsonInput();

    // Check comment exists
    $stmt = $db->prepare('SELECT * FROM task_comments WHERE id = ?');
    $stmt->execute([$commentId]);
    $existingComment = $stmt->fetch();

    if (!$existingComment) {
        errorResponse('Comment not found', 404);
    }

    // Check if user owns this comment (optional security check)
    $currentUserId = getCurrentUserId();
    if ($currentUserId && $existingComment['user_id'] && $existingComment['user_id'] != $currentUserId) {
        // Could add role check here for admins
        // errorResponse('You can only edit your own comments', 403);
    }

    if (empty($input['comment']) && empty($input['content'])) {
        errorResponse('Comment content is required', 400);
    }

    $content = $input['comment'] ?? $input['content'];

    $stmt = $db->prepare('UPDATE task_comments SET comment = ? WHERE id = ?');
    $stmt->execute([sanitize($content), $commentId]);

    logActivity('comment_updated', "Updated comment ID: $commentId", null, $existingComment['task_id']);

    // Return updated comment
    $stmt = $db->prepare('
        SELECT c.*, COALESCE(c.user_name, u.full_name, "Anonymous") as display_name
        FROM task_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    ');
    $stmt->execute([$commentId]);
    $comment = $stmt->fetch();

    successResponse(formatComment($comment), 'Comment updated successfully');
}

/**
 * Delete comment
 */
function deleteComment(PDO $db, int $commentId): void {
    $stmt = $db->prepare('SELECT * FROM task_comments WHERE id = ?');
    $stmt->execute([$commentId]);
    $comment = $stmt->fetch();

    if (!$comment) {
        errorResponse('Comment not found', 404);
    }

    $stmt = $db->prepare('DELETE FROM task_comments WHERE id = ?');
    $stmt->execute([$commentId]);

    logActivity('comment_deleted', "Deleted comment ID: $commentId", null, $comment['task_id']);

    successResponse(null, 'Comment deleted successfully');
}

/**
 * Format comment for API response
 */
function formatComment(array $comment): array {
    return [
        'id' => (int)$comment['id'],
        'task_id' => (int)$comment['task_id'],
        'user_id' => $comment['user_id'] ? (int)$comment['user_id'] : null,
        'user_name' => $comment['display_name'] ?? $comment['user_name'] ?? 'Anonymous',
        'content' => $comment['comment'],
        'created_at' => $comment['created_at'],
        'updated_at' => $comment['updated_at'] ?? $comment['created_at']
    ];
}
