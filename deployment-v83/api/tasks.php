<?php
/**
 * Gantt Project Manager - Tasks API
 * PHP 8.x Compatible
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Endpoints:
 * GET    /api/tasks.php              - List all tasks
 * GET    /api/tasks.php?id=1         - Get single task
 * GET    /api/tasks.php?project_id=1 - Get tasks by project
 * POST   /api/tasks.php              - Create task
 * PUT    /api/tasks.php?id=1         - Update task
 * DELETE /api/tasks.php?id=1         - Delete task
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$taskId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 1;

try {
    $db = Database::getInstance();

    switch ($method) {
        case 'GET':
            if ($taskId) {
                getTask($db, $taskId);
            } else {
                getTasks($db, $projectId);
            }
            break;

        case 'POST':
            createTask($db);
            break;

        case 'PUT':
            if (!$taskId) {
                errorResponse('Task ID is required', 400);
            }
            updateTask($db, $taskId);
            break;

        case 'DELETE':
            if (!$taskId) {
                errorResponse('Task ID is required', 400);
            }
            deleteTask($db, $taskId);
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Tasks API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Get all tasks for a project
 */
function getTasks(PDO $db, int $projectId): void {
    $stmt = $db->prepare('
        SELECT
            t.*,
            GROUP_CONCAT(td.depends_on_task_id) as dependencies,
            u.full_name as assigned_to_name
        FROM tasks t
        LEFT JOIN task_dependencies td ON t.id = td.task_id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = ?
        GROUP BY t.id
        ORDER BY t.start_date ASC, t.end_date ASC, t.task_order ASC
    ');
    $stmt->execute([$projectId]);
    $tasks = $stmt->fetchAll();

    // Format tasks
    $formattedTasks = array_map(function($task) {
        return formatTask($task);
    }, $tasks);

    successResponse($formattedTasks);
}

/**
 * Get single task
 */
function getTask(PDO $db, int $taskId): void {
    $stmt = $db->prepare('
        SELECT
            t.*,
            GROUP_CONCAT(td.depends_on_task_id) as dependencies,
            u.full_name as assigned_to_name
        FROM tasks t
        LEFT JOIN task_dependencies td ON t.id = td.task_id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = ?
        GROUP BY t.id
    ');
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();

    if (!$task) {
        errorResponse('Task not found', 404);
    }

    successResponse(formatTask($task));
}

/**
 * Create new task
 */
function createTask(PDO $db): void {
    $input = getJsonInput();

    // Validate required fields
    $required = ['name', 'start_date', 'end_date'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            errorResponse("Field '$field' is required", 400);
        }
    }

    // Validate dates
    if (!isValidDate($input['start_date']) || !isValidDate($input['end_date'])) {
        errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
    }

    if ($input['end_date'] < $input['start_date']) {
        errorResponse('End date must be after start date', 400);
    }

    $projectId = (int)($input['project_id'] ?? 1);

    // Get next task order
    $stmt = $db->prepare('SELECT COALESCE(MAX(task_order), 0) + 1 FROM tasks WHERE project_id = ?');
    $stmt->execute([$projectId]);
    $nextOrder = (int)$stmt->fetchColumn();

    // Insert task
    $stmt = $db->prepare('
        INSERT INTO tasks (
            project_id, parent_id, name, description, notes, start_date, end_date,
            progress, status, priority, is_milestone, task_order, color, assigned_to
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');

    $stmt->execute([
        $projectId,
        $input['parent_id'] ?? null,
        sanitize($input['name']),
        sanitize($input['description'] ?? ''),
        sanitize($input['notes'] ?? ''),
        $input['start_date'],
        $input['end_date'],
        min(100, max(0, (int)($input['progress'] ?? 0))),
        $input['status'] ?? 'not-started',
        $input['priority'] ?? 'medium',
        (int)($input['is_milestone'] ?? 0),
        (int)($input['task_order'] ?? $nextOrder),
        $input['color'] ?? null,
        $input['assigned_to'] ?? null
    ]);

    $newTaskId = (int)$db->lastInsertId();

    // Add dependencies
    if (!empty($input['dependencies']) && is_array($input['dependencies'])) {
        addDependencies($db, $newTaskId, $input['dependencies']);
    }

    logActivity('task_created', "Created task: {$input['name']}", $projectId, $newTaskId);

    // Return created task
    getTask($db, $newTaskId);
}

/**
 * Update task
 */
function updateTask(PDO $db, int $taskId): void {
    $input = getJsonInput();

    // Check task exists
    $stmt = $db->prepare('SELECT * FROM tasks WHERE id = ?');
    $stmt->execute([$taskId]);
    $existingTask = $stmt->fetch();

    if (!$existingTask) {
        errorResponse('Task not found', 404);
    }

    // Build update query dynamically
    $updates = [];
    $params = [];

    $allowedFields = [
        'name', 'description', 'notes', 'start_date', 'end_date', 'progress',
        'status', 'priority', 'is_milestone', 'task_order', 'color',
        'assigned_to', 'parent_id'
    ];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            if ($field === 'name' || $field === 'description' || $field === 'notes') {
                $params[] = sanitize($input[$field]);
            } elseif ($field === 'progress') {
                $params[] = min(100, max(0, (int)$input[$field]));
            } elseif ($field === 'is_milestone') {
                $params[] = (int)$input[$field];
            } else {
                $params[] = $input[$field];
            }
            $updates[] = "$field = ?";
        }
    }

    if (!empty($updates)) {
        $params[] = $taskId;
        $sql = 'UPDATE tasks SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    // Update dependencies
    if (isset($input['dependencies'])) {
        // Remove existing dependencies
        $stmt = $db->prepare('DELETE FROM task_dependencies WHERE task_id = ?');
        $stmt->execute([$taskId]);

        // Add new dependencies
        if (is_array($input['dependencies']) && !empty($input['dependencies'])) {
            addDependencies($db, $taskId, $input['dependencies']);
        }
    }

    logActivity('task_updated', "Updated task ID: $taskId", $existingTask['project_id'], $taskId);

    // Return updated task
    getTask($db, $taskId);
}

/**
 * Delete task
 */
function deleteTask(PDO $db, int $taskId): void {
    // Check task exists
    $stmt = $db->prepare('SELECT project_id, name FROM tasks WHERE id = ?');
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();

    if (!$task) {
        errorResponse('Task not found', 404);
    }

    // Delete task (dependencies will be deleted via CASCADE)
    $stmt = $db->prepare('DELETE FROM tasks WHERE id = ?');
    $stmt->execute([$taskId]);

    logActivity('task_deleted', "Deleted task: {$task['name']}", $task['project_id'], $taskId);

    successResponse(null, 'Task deleted successfully');
}

/**
 * Add dependencies to a task
 */
function addDependencies(PDO $db, int $taskId, array $dependencyIds): void {
    $stmt = $db->prepare('
        INSERT IGNORE INTO task_dependencies (task_id, depends_on_task_id, dependency_type)
        VALUES (?, ?, ?)
    ');

    foreach ($dependencyIds as $depId) {
        $depId = (int)$depId;
        if ($depId > 0 && $depId !== $taskId) {
            $stmt->execute([$taskId, $depId, 'finish-to-start']);
        }
    }
}

/**
 * Format task for API response
 */
function formatTask(array $task): array {
    $dependencies = [];
    if (!empty($task['dependencies'])) {
        $dependencies = array_map('intval', explode(',', $task['dependencies']));
    }

    return [
        'id' => (int)$task['id'],
        'project_id' => (int)$task['project_id'],
        'parent_id' => $task['parent_id'] ? (int)$task['parent_id'] : null,
        'name' => $task['name'],
        'description' => $task['description'] ?? '',
        'notes' => $task['notes'] ?? '',
        'start_date' => $task['start_date'],
        'end_date' => $task['end_date'],
        'progress' => (int)$task['progress'],
        'status' => $task['status'],
        'priority' => $task['priority'] ?? 'medium',
        'is_milestone' => (bool)$task['is_milestone'],
        'task_order' => (int)$task['task_order'],
        'color' => $task['color'],
        'assigned_to' => $task['assigned_to'] ? (int)$task['assigned_to'] : null,
        'assigned_to_name' => $task['assigned_to_name'] ?? null,
        'dependencies' => $dependencies,
        'created_at' => $task['created_at'] ?? null,
        'updated_at' => $task['updated_at'] ?? null
    ];
}
