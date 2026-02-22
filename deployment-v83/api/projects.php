<?php
/**
 * Gantt Project Manager - Projects API
 * PHP 8.x Compatible
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Endpoints:
 * GET    /api/projects.php        - List all projects
 * GET    /api/projects.php?id=1   - Get single project
 * POST   /api/projects.php        - Create project
 * PUT    /api/projects.php?id=1   - Update project
 * DELETE /api/projects.php?id=1   - Delete project
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$projectId = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    $db = Database::getInstance();

    switch ($method) {
        case 'GET':
            if ($projectId) {
                getProject($db, $projectId);
            } else {
                getProjects($db);
            }
            break;

        case 'POST':
            createProject($db);
            break;

        case 'PUT':
            if (!$projectId) {
                errorResponse('Project ID is required', 400);
            }
            updateProject($db, $projectId);
            break;

        case 'DELETE':
            if (!$projectId) {
                errorResponse('Project ID is required', 400);
            }
            deleteProject($db, $projectId);
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Projects API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Get all projects
 */
function getProjects(PDO $db): void {
    // Check if filtering by client
    $clientId = isset($_GET['client_id']) ? (int)$_GET['client_id'] : null;

    // First get all projects
    $sql = 'SELECT * FROM projects WHERE is_active = 1';
    $params = array();

    if ($clientId) {
        $sql .= ' AND client_id = ?';
        $params[] = $clientId;
    }

    $sql .= ' ORDER BY updated_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $projects = $stmt->fetchAll();

    // Then get stats for each project
    $formattedProjects = array();
    foreach ($projects as $project) {
        // Get owner name
        $ownerName = null;
        if ($project['owner_id']) {
            $ownerStmt = $db->prepare('SELECT full_name FROM users WHERE id = ?');
            $ownerStmt->execute(array($project['owner_id']));
            $owner = $ownerStmt->fetch();
            $ownerName = $owner ? $owner['full_name'] : null;
        }

        // Get task counts
        $statsStmt = $db->prepare('
            SELECT
                COUNT(*) as task_count,
                SUM(CASE WHEN status = "complete" THEN 1 ELSE 0 END) as completed_count,
                COALESCE(AVG(progress), 0) as avg_progress
            FROM tasks WHERE project_id = ?
        ');
        $statsStmt->execute(array($project['id']));
        $stats = $statsStmt->fetch();

        $formattedProjects[] = array(
            'id' => (int)$project['id'],
            'name' => $project['name'],
            'description' => $project['description'] ? $project['description'] : '',
            'color' => $project['color'],
            'owner_id' => $project['owner_id'] ? (int)$project['owner_id'] : null,
            'owner_name' => $ownerName,
            'client_id' => $project['client_id'] ? (int)$project['client_id'] : null,
            'client_name' => $project['client_name'],
            'is_active' => (bool)$project['is_active'],
            'task_count' => (int)$stats['task_count'],
            'completed_count' => (int)$stats['completed_count'],
            'avg_progress' => round((float)$stats['avg_progress'], 1),
            'created_at' => $project['created_at'],
            'updated_at' => $project['updated_at']
        );
    }

    successResponse($formattedProjects);
}

/**
 * Get single project with statistics
 */
function getProject(PDO $db, int $projectId): void {
    $stmt = $db->prepare('
        SELECT
            p.*,
            u.full_name as owner_name,
            c.full_name as client_display_name,
            COUNT(DISTINCT t.id) as task_count,
            COUNT(DISTINCT CASE WHEN t.status = "complete" THEN t.id END) as completed_count,
            COUNT(DISTINCT CASE WHEN t.status = "in-progress" THEN t.id END) as in_progress_count,
            COUNT(DISTINCT CASE WHEN t.status = "not-started" THEN t.id END) as not_started_count,
            COUNT(DISTINCT CASE WHEN t.is_milestone = 1 THEN t.id END) as milestone_count,
            COALESCE(AVG(t.progress), 0) as avg_progress,
            MIN(t.start_date) as project_start,
            MAX(t.end_date) as project_end
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN users c ON p.client_id = c.id
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.id = ?
        GROUP BY p.id
    ');
    $stmt->execute([$projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        errorResponse('Project not found', 404);
    }

    successResponse(formatProject($project, true));
}

/**
 * Create new project
 * Uses template system to populate tasks based on template_id and start_date
 *
 * Parameters:
 * - name: Project name (required)
 * - description: Project description (optional)
 * - template_id: ID of project template to use (optional, creates empty project if not provided)
 * - start_date: Project start date in YYYY-MM-DD format (required if template_id provided)
 * - color: Project color (optional, defaults to template color or #14b8a6)
 * - owner_id: Owner user ID (optional)
 * - client_id: Client user ID (optional)
 */
function createProject(PDO $db): void {
    $input = getJsonInput();

    if (empty($input['name'])) {
        errorResponse('Project name is required', 400);
    }

    $templateId = isset($input['template_id']) ? (int)$input['template_id'] : null;
    $startDate = isset($input['start_date']) ? $input['start_date'] : null;

    // If template is provided, start_date is required
    if ($templateId && !$startDate) {
        errorResponse('Start date is required when using a template', 400);
    }

    // Validate start_date format
    if ($startDate && !isValidDate($startDate)) {
        errorResponse('Invalid start date format. Use YYYY-MM-DD', 400);
    }

    $db->beginTransaction();

    try {
        // Get template info if provided
        $templateColor = '#14b8a6';
        $templateName = null;
        if ($templateId) {
            $tplStmt = $db->prepare('SELECT * FROM project_templates WHERE id = ? AND is_active = 1');
            $tplStmt->execute(array($templateId));
            $template = $tplStmt->fetch();
            if (!$template) {
                $db->rollBack();
                errorResponse('Template not found', 404);
            }
            $templateColor = $template['color'];
            $templateName = $template['name'];
        }

        // Get client name if client_id provided
        $clientName = null;
        if (!empty($input['client_id'])) {
            $clientStmt = $db->prepare('SELECT full_name FROM users WHERE id = ? AND role = "client"');
            $clientStmt->execute(array($input['client_id']));
            $client = $clientStmt->fetch();
            $clientName = $client ? $client['full_name'] : (isset($input['client_name']) ? $input['client_name'] : null);
        }

        // Create the new project
        $stmt = $db->prepare('
            INSERT INTO projects (name, description, color, owner_id, client_id, client_name, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        ');

        $stmt->execute(array(
            sanitize($input['name']),
            sanitize(isset($input['description']) ? $input['description'] : ''),
            isset($input['color']) ? $input['color'] : $templateColor,
            isset($input['owner_id']) ? $input['owner_id'] : getCurrentUserId(),
            isset($input['client_id']) ? $input['client_id'] : null,
            $clientName
        ));

        $newProjectId = (int)$db->lastInsertId();
        $taskCount = 0;

        // If template provided, create tasks from template
        if ($templateId && $startDate) {
            $taskCount = createTasksFromTemplate($db, $newProjectId, $templateId, $startDate);
        }

        $db->commit();

        $logMessage = "Created project: {$input['name']}";
        if ($templateName) {
            $logMessage .= " from template '{$templateName}' with {$taskCount} tasks";
        }
        logActivity('project_created', $logMessage, $newProjectId);

        getProject($db, $newProjectId);

    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Create tasks from a project template
 * Calculates actual dates based on start_date, days_from_start, and duration_days
 */
function createTasksFromTemplate(PDO $db, int $projectId, int $templateId, string $startDate): int {
    // Get template tasks
    $tasksStmt = $db->prepare('
        SELECT * FROM task_templates WHERE template_id = ? ORDER BY days_from_start ASC, task_order ASC
    ');
    $tasksStmt->execute(array($templateId));
    $templateTasks = $tasksStmt->fetchAll();

    if (empty($templateTasks)) {
        return 0;
    }

    // Convert start date to DateTime for calculations
    $projectStart = new DateTime($startDate);

    // Maps template task IDs to new task IDs
    $taskIdMap = array();

    $insertTaskStmt = $db->prepare('
        INSERT INTO tasks (project_id, parent_id, name, description, notes, start_date, end_date,
                          progress, status, priority, is_milestone, task_order, color, assigned_to)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');

    // First pass: insert all tasks (without parent_id mapping)
    foreach ($templateTasks as $task) {
        // Calculate actual dates
        $taskStart = clone $projectStart;
        $taskStart->modify('+' . (int)$task['days_from_start'] . ' days');

        $taskEnd = clone $taskStart;
        $taskEnd->modify('+' . ((int)$task['duration_days'] - 1) . ' days');

        $insertTaskStmt->execute(array(
            $projectId,
            null, // Will update parent_id in second pass
            $task['name'],
            $task['description'],
            $task['notes'],
            $taskStart->format('Y-m-d'),
            $taskEnd->format('Y-m-d'),
            0, // Progress starts at 0%
            'not-started', // Status starts as not-started
            $task['priority'],
            $task['is_milestone'],
            $task['task_order'],
            $task['color'],
            null // No assignment initially
        ));
        $newTaskId = (int)$db->lastInsertId();
        $taskIdMap[$task['id']] = $newTaskId;
    }

    // Second pass: update parent_id references
    $updateParentStmt = $db->prepare('UPDATE tasks SET parent_id = ? WHERE id = ?');
    foreach ($templateTasks as $task) {
        if ($task['parent_template_task_id'] !== null && isset($taskIdMap[$task['parent_template_task_id']])) {
            $newTaskId = $taskIdMap[$task['id']];
            $newParentId = $taskIdMap[$task['parent_template_task_id']];
            $updateParentStmt->execute(array($newParentId, $newTaskId));
        }
    }

    // Copy task dependencies from template
    $depsStmt = $db->prepare('
        SELECT * FROM task_template_dependencies WHERE task_template_id IN (
            SELECT id FROM task_templates WHERE template_id = ?
        )
    ');
    $depsStmt->execute(array($templateId));
    $templateDeps = $depsStmt->fetchAll();

    $insertDepStmt = $db->prepare('
        INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type)
        VALUES (?, ?, ?)
    ');

    foreach ($templateDeps as $dep) {
        if (isset($taskIdMap[$dep['task_template_id']]) && isset($taskIdMap[$dep['depends_on_template_task_id']])) {
            $insertDepStmt->execute(array(
                $taskIdMap[$dep['task_template_id']],
                $taskIdMap[$dep['depends_on_template_task_id']],
                $dep['dependency_type']
            ));
        }
    }

    return count($templateTasks);
}

/**
 * Update project
 */
function updateProject(PDO $db, int $projectId): void {
    $input = getJsonInput();

    // Check project exists
    $stmt = $db->prepare('SELECT * FROM projects WHERE id = ?');
    $stmt->execute([$projectId]);
    $existingProject = $stmt->fetch();

    if (!$existingProject) {
        errorResponse('Project not found', 404);
    }

    $updates = [];
    $params = [];

    $allowedFields = ['name', 'description', 'color', 'owner_id', 'client_id', 'client_name', 'is_active'];

    // If client_id is being updated, fetch the client name
    if (isset($input['client_id']) && !isset($input['client_name'])) {
        if ($input['client_id']) {
            $clientStmt = $db->prepare('SELECT full_name FROM users WHERE id = ?');
            $clientStmt->execute([$input['client_id']]);
            $client = $clientStmt->fetch();
            $input['client_name'] = $client ? $client['full_name'] : null;
        } else {
            $input['client_name'] = null;
        }
    }

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            if ($field === 'name' || $field === 'description' || $field === 'client_name') {
                $params[] = $input[$field] ? sanitize($input[$field]) : null;
            } else {
                $params[] = $input[$field];
            }
            $updates[] = "$field = ?";
        }
    }

    if (!empty($updates)) {
        $params[] = $projectId;
        $sql = 'UPDATE projects SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    logActivity('project_updated', "Updated project ID: $projectId", $projectId);

    getProject($db, $projectId);
}

/**
 * Delete project (soft delete)
 */
function deleteProject(PDO $db, int $projectId): void {
    $stmt = $db->prepare('SELECT name FROM projects WHERE id = ?');
    $stmt->execute([$projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        errorResponse('Project not found', 404);
    }

    // Soft delete - set is_active to 0
    $stmt = $db->prepare('UPDATE projects SET is_active = 0 WHERE id = ?');
    $stmt->execute([$projectId]);

    logActivity('project_deleted', "Deleted project: {$project['name']}", $projectId);

    successResponse(null, 'Project deleted successfully');
}

/**
 * Format project for API response
 */
function formatProject(array $project, bool $detailed = false): array {
    $formatted = [
        'id' => (int)$project['id'],
        'name' => $project['name'],
        'description' => $project['description'] ?? '',
        'color' => $project['color'],
        'owner_id' => $project['owner_id'] ? (int)$project['owner_id'] : null,
        'owner_name' => $project['owner_name'] ?? null,
        'client_id' => $project['client_id'] ? (int)$project['client_id'] : null,
        'client_name' => $project['client_name'] ?? $project['client_display_name'] ?? null,
        'is_active' => (bool)$project['is_active'],
        'task_count' => (int)($project['task_count'] ?? 0),
        'completed_count' => (int)($project['completed_count'] ?? 0),
        'avg_progress' => round((float)($project['avg_progress'] ?? 0), 1),
        'created_at' => $project['created_at'] ?? null,
        'updated_at' => $project['updated_at'] ?? null
    ];

    if ($detailed) {
        $formatted['in_progress_count'] = (int)($project['in_progress_count'] ?? 0);
        $formatted['not_started_count'] = (int)($project['not_started_count'] ?? 0);
        $formatted['milestone_count'] = (int)($project['milestone_count'] ?? 0);
        $formatted['project_start'] = $project['project_start'] ?? null;
        $formatted['project_end'] = $project['project_end'] ?? null;
    }

    return $formatted;
}
