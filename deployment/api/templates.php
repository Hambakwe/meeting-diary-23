<?php
/**
 * Gantt Project Manager - Templates API
 * PHP 8.x Compatible
 *
 * @version v125
 * @package GanttProjectManager
 * @build 2026-02-22
 *
 * Endpoints:
 * GET    /api/templates.php              - List all active templates
 * GET    /api/templates.php?id=1         - Get single template with tasks
 * GET    /api/templates.php?id=1&tasks=1 - Get template tasks only
 * POST   /api/templates.php              - Create new template
 * PUT    /api/templates.php?id=1         - Update template
 * DELETE /api/templates.php?id=1         - Delete template (soft delete)
 *
 * Task operations:
 * POST   /api/templates.php?id=1&action=add_task    - Add task to template
 * PUT    /api/templates.php?task_id=1               - Update template task
 * DELETE /api/templates.php?task_id=1               - Delete template task
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$templateId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$taskId = isset($_GET['task_id']) ? (int)$_GET['task_id'] : null;
$tasksOnly = isset($_GET['tasks']);
$action = isset($_GET['action']) ? $_GET['action'] : null;

try {
    $db = Database::getInstance();

    switch ($method) {
        case 'GET':
            if ($templateId) {
                if ($tasksOnly) {
                    getTemplateTasks($db, $templateId);
                } else {
                    getTemplate($db, $templateId);
                }
            } else {
                getTemplates($db);
            }
            break;

        case 'POST':
            if ($templateId && $action === 'add_task') {
                addTemplateTask($db, $templateId);
            } else {
                createTemplate($db);
            }
            break;

        case 'PUT':
            if ($taskId) {
                updateTemplateTask($db, $taskId);
            } elseif ($templateId) {
                updateTemplate($db, $templateId);
            } else {
                errorResponse('Template ID or Task ID is required', 400);
            }
            break;

        case 'DELETE':
            if ($taskId) {
                deleteTemplateTask($db, $taskId);
            } elseif ($templateId) {
                deleteTemplate($db, $templateId);
            } else {
                errorResponse('Template ID or Task ID is required', 400);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Templates API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Get all active templates
 */
function getTemplates(PDO $db): void {
    $stmt = $db->query('
        SELECT
            pt.*,
            COUNT(tt.id) as task_count,
            COALESCE(MAX(tt.days_from_start + tt.duration_days), 0) as total_duration_days
        FROM project_templates pt
        LEFT JOIN task_templates tt ON pt.id = tt.template_id
        WHERE pt.is_active = 1
        GROUP BY pt.id
        ORDER BY pt.project_type ASC, pt.name ASC
    ');
    $templates = $stmt->fetchAll();

    $formattedTemplates = array();
    foreach ($templates as $template) {
        $formattedTemplates[] = array(
            'id' => (int)$template['id'],
            'name' => $template['name'],
            'description' => $template['description'] ?: '',
            'project_type' => $template['project_type'],
            'color' => $template['color'],
            'task_count' => (int)$template['task_count'],
            'total_duration_days' => (int)$template['total_duration_days'],
            'created_at' => $template['created_at']
        );
    }

    successResponse($formattedTemplates);
}

/**
 * Get single template with task details
 */
function getTemplate(PDO $db, int $templateId): void {
    // Get template info
    $stmt = $db->prepare('SELECT * FROM project_templates WHERE id = ? AND is_active = 1');
    $stmt->execute(array($templateId));
    $template = $stmt->fetch();

    if (!$template) {
        errorResponse('Template not found', 404);
    }

    // Get template tasks
    $taskStmt = $db->prepare('
        SELECT
            tt.*,
            GROUP_CONCAT(ttd.depends_on_template_task_id) as dependencies
        FROM task_templates tt
        LEFT JOIN task_template_dependencies ttd ON tt.id = ttd.task_template_id
        WHERE tt.template_id = ?
        GROUP BY tt.id
        ORDER BY tt.days_from_start ASC, tt.task_order ASC
    ');
    $taskStmt->execute(array($templateId));
    $tasks = $taskStmt->fetchAll();

    $formattedTasks = array();
    foreach ($tasks as $task) {
        $dependencies = array();
        if (!empty($task['dependencies'])) {
            $dependencies = array_map('intval', explode(',', $task['dependencies']));
        }

        $formattedTasks[] = array(
            'id' => (int)$task['id'],
            'template_id' => (int)$task['template_id'],
            'parent_template_task_id' => $task['parent_template_task_id'] ? (int)$task['parent_template_task_id'] : null,
            'name' => $task['name'],
            'description' => $task['description'] ?: '',
            'notes' => $task['notes'] ?: '',
            'days_from_start' => (int)$task['days_from_start'],
            'duration_days' => (int)$task['duration_days'],
            'priority' => $task['priority'],
            'is_milestone' => (bool)$task['is_milestone'],
            'task_order' => (int)$task['task_order'],
            'color' => $task['color'],
            'dependencies' => $dependencies
        );
    }

    // Calculate total duration
    $maxEndDay = 0;
    foreach ($formattedTasks as $task) {
        $endDay = $task['days_from_start'] + $task['duration_days'];
        if ($endDay > $maxEndDay) {
            $maxEndDay = $endDay;
        }
    }

    successResponse(array(
        'id' => (int)$template['id'],
        'name' => $template['name'],
        'description' => $template['description'] ?: '',
        'project_type' => $template['project_type'],
        'color' => $template['color'],
        'total_duration_days' => $maxEndDay,
        'tasks' => $formattedTasks,
        'created_at' => $template['created_at']
    ));
}

/**
 * Get template tasks only
 */
function getTemplateTasks(PDO $db, int $templateId): void {
    // Verify template exists
    $stmt = $db->prepare('SELECT id FROM project_templates WHERE id = ? AND is_active = 1');
    $stmt->execute(array($templateId));
    if (!$stmt->fetch()) {
        errorResponse('Template not found', 404);
    }

    // Get tasks
    $taskStmt = $db->prepare('
        SELECT
            tt.*,
            GROUP_CONCAT(ttd.depends_on_template_task_id) as dependencies
        FROM task_templates tt
        LEFT JOIN task_template_dependencies ttd ON tt.id = ttd.task_template_id
        WHERE tt.template_id = ?
        GROUP BY tt.id
        ORDER BY tt.days_from_start ASC, tt.task_order ASC
    ');
    $taskStmt->execute(array($templateId));
    $tasks = $taskStmt->fetchAll();

    $formattedTasks = array();
    foreach ($tasks as $task) {
        $dependencies = array();
        if (!empty($task['dependencies'])) {
            $dependencies = array_map('intval', explode(',', $task['dependencies']));
        }

        $formattedTasks[] = array(
            'id' => (int)$task['id'],
            'template_id' => (int)$task['template_id'],
            'parent_template_task_id' => $task['parent_template_task_id'] ? (int)$task['parent_template_task_id'] : null,
            'name' => $task['name'],
            'description' => $task['description'] ?: '',
            'notes' => $task['notes'] ?: '',
            'days_from_start' => (int)$task['days_from_start'],
            'duration_days' => (int)$task['duration_days'],
            'priority' => $task['priority'],
            'is_milestone' => (bool)$task['is_milestone'],
            'task_order' => (int)$task['task_order'],
            'color' => $task['color'],
            'dependencies' => $dependencies
        );
    }

    successResponse($formattedTasks);
}

/**
 * Create new template
 */
function createTemplate(PDO $db): void {
    $input = getJsonInput();

    if (empty($input['name'])) {
        errorResponse('Template name is required', 400);
    }

    if (empty($input['project_type'])) {
        errorResponse('Project type is required', 400);
    }

    $stmt = $db->prepare('
        INSERT INTO project_templates (name, description, project_type, color, created_by, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    ');

    $stmt->execute(array(
        sanitize($input['name']),
        sanitize($input['description'] ?? ''),
        sanitize($input['project_type']),
        $input['color'] ?? '#14b8a6',
        $input['created_by'] ?? null
    ));

    $newId = (int)$db->lastInsertId();

    logActivity('template_created', "Created template: {$input['name']}");

    getTemplate($db, $newId);
}

/**
 * Update template
 */
function updateTemplate(PDO $db, int $templateId): void {
    $input = getJsonInput();

    // Check template exists
    $stmt = $db->prepare('SELECT * FROM project_templates WHERE id = ?');
    $stmt->execute(array($templateId));
    if (!$stmt->fetch()) {
        errorResponse('Template not found', 404);
    }

    $updates = array();
    $params = array();

    $allowedFields = array('name', 'description', 'project_type', 'color', 'is_active');

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            if ($field === 'name' || $field === 'description' || $field === 'project_type') {
                $params[] = sanitize($input[$field]);
            } else {
                $params[] = $input[$field];
            }
            $updates[] = "$field = ?";
        }
    }

    if (!empty($updates)) {
        $params[] = $templateId;
        $sql = 'UPDATE project_templates SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    logActivity('template_updated', "Updated template ID: $templateId");

    getTemplate($db, $templateId);
}

/**
 * Delete template (soft delete)
 */
function deleteTemplate(PDO $db, int $templateId): void {
    $stmt = $db->prepare('SELECT name FROM project_templates WHERE id = ?');
    $stmt->execute(array($templateId));
    $template = $stmt->fetch();

    if (!$template) {
        errorResponse('Template not found', 404);
    }

    // Soft delete - set is_active to 0
    $stmt = $db->prepare('UPDATE project_templates SET is_active = 0 WHERE id = ?');
    $stmt->execute(array($templateId));

    logActivity('template_deleted', "Deleted template: {$template['name']}");

    successResponse(null, 'Template deleted successfully');
}

/**
 * Add task to template
 */
function addTemplateTask(PDO $db, int $templateId): void {
    $input = getJsonInput();

    // Verify template exists
    $stmt = $db->prepare('SELECT id FROM project_templates WHERE id = ? AND is_active = 1');
    $stmt->execute(array($templateId));
    if (!$stmt->fetch()) {
        errorResponse('Template not found', 404);
    }

    if (empty($input['name'])) {
        errorResponse('Task name is required', 400);
    }

    // Get next task order
    $orderStmt = $db->prepare('SELECT COALESCE(MAX(task_order), 0) + 1 FROM task_templates WHERE template_id = ?');
    $orderStmt->execute(array($templateId));
    $nextOrder = (int)$orderStmt->fetchColumn();

    $stmt = $db->prepare('
        INSERT INTO task_templates (template_id, parent_template_task_id, name, description, notes,
            days_from_start, duration_days, priority, is_milestone, task_order, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');

    $stmt->execute(array(
        $templateId,
        $input['parent_template_task_id'] ?? null,
        sanitize($input['name']),
        sanitize($input['description'] ?? ''),
        sanitize($input['notes'] ?? ''),
        (int)($input['days_from_start'] ?? 0),
        (int)($input['duration_days'] ?? 1),
        $input['priority'] ?? 'medium',
        (int)($input['is_milestone'] ?? 0),
        (int)($input['task_order'] ?? $nextOrder),
        $input['color'] ?? null
    ));

    $newTaskId = (int)$db->lastInsertId();

    // Add dependencies if provided
    if (!empty($input['dependencies']) && is_array($input['dependencies'])) {
        $depStmt = $db->prepare('
            INSERT INTO task_template_dependencies (task_template_id, depends_on_template_task_id, dependency_type)
            VALUES (?, ?, ?)
        ');
        foreach ($input['dependencies'] as $depId) {
            $depStmt->execute(array($newTaskId, (int)$depId, 'finish-to-start'));
        }
    }

    logActivity('template_task_added', "Added task to template ID: $templateId");

    // Return the updated template
    getTemplate($db, $templateId);
}

/**
 * Update template task
 */
function updateTemplateTask(PDO $db, int $taskId): void {
    $input = getJsonInput();

    // Get existing task
    $stmt = $db->prepare('SELECT * FROM task_templates WHERE id = ?');
    $stmt->execute(array($taskId));
    $task = $stmt->fetch();

    if (!$task) {
        errorResponse('Template task not found', 404);
    }

    $updates = array();
    $params = array();

    $allowedFields = array('name', 'description', 'notes', 'days_from_start', 'duration_days',
        'priority', 'is_milestone', 'task_order', 'color', 'parent_template_task_id');

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            if ($field === 'name' || $field === 'description' || $field === 'notes') {
                $params[] = sanitize($input[$field]);
            } elseif ($field === 'days_from_start' || $field === 'duration_days' || $field === 'task_order' || $field === 'is_milestone') {
                $params[] = (int)$input[$field];
            } else {
                $params[] = $input[$field];
            }
            $updates[] = "$field = ?";
        }
    }

    if (!empty($updates)) {
        $params[] = $taskId;
        $sql = 'UPDATE task_templates SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    // Update dependencies if provided
    if (isset($input['dependencies'])) {
        // Remove existing
        $db->prepare('DELETE FROM task_template_dependencies WHERE task_template_id = ?')->execute(array($taskId));

        // Add new
        if (is_array($input['dependencies']) && !empty($input['dependencies'])) {
            $depStmt = $db->prepare('
                INSERT INTO task_template_dependencies (task_template_id, depends_on_template_task_id, dependency_type)
                VALUES (?, ?, ?)
            ');
            foreach ($input['dependencies'] as $depId) {
                $depStmt->execute(array($taskId, (int)$depId, 'finish-to-start'));
            }
        }
    }

    logActivity('template_task_updated', "Updated template task ID: $taskId");

    // Return updated template
    getTemplate($db, (int)$task['template_id']);
}

/**
 * Delete template task
 */
function deleteTemplateTask(PDO $db, int $taskId): void {
    // Get task info
    $stmt = $db->prepare('SELECT template_id, name FROM task_templates WHERE id = ?');
    $stmt->execute(array($taskId));
    $task = $stmt->fetch();

    if (!$task) {
        errorResponse('Template task not found', 404);
    }

    // Delete task (dependencies will be deleted via CASCADE)
    $stmt = $db->prepare('DELETE FROM task_templates WHERE id = ?');
    $stmt->execute(array($taskId));

    logActivity('template_task_deleted', "Deleted template task: {$task['name']}");

    // Return updated template
    getTemplate($db, (int)$task['template_id']);
}
