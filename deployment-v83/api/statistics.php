<?php
/**
 * Gantt Project Manager - Statistics API
 * PHP 8.x Compatible
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Endpoints:
 * GET /api/statistics.php?project_id=1 - Get project statistics
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    errorResponse('Method not allowed', 405);
}

$projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 1;

try {
    $db = Database::getInstance();

    // Get task statistics
    $stmt = $db->prepare('
        SELECT
            COUNT(*) as total_tasks,
            COUNT(CASE WHEN status = "complete" THEN 1 END) as completed,
            COUNT(CASE WHEN status = "in-progress" THEN 1 END) as in_progress,
            COUNT(CASE WHEN status = "not-started" THEN 1 END) as not_started,
            COUNT(CASE WHEN is_milestone = 1 THEN 1 END) as milestones,
            COALESCE(AVG(progress), 0) as avg_progress,
            MIN(start_date) as earliest_start,
            MAX(end_date) as latest_end
        FROM tasks
        WHERE project_id = ?
    ');
    $stmt->execute([$projectId]);
    $stats = $stmt->fetch();

    // Get priority breakdown
    $stmt = $db->prepare('
        SELECT
            priority,
            COUNT(*) as count
        FROM tasks
        WHERE project_id = ?
        GROUP BY priority
    ');
    $stmt->execute([$projectId]);
    $priorityBreakdown = $stmt->fetchAll();

    // Get overdue tasks
    $stmt = $db->prepare('
        SELECT COUNT(*) as overdue_count
        FROM tasks
        WHERE project_id = ?
        AND status != "complete"
        AND end_date < CURDATE()
    ');
    $stmt->execute([$projectId]);
    $overdue = $stmt->fetch();

    // Get tasks due this week
    $stmt = $db->prepare('
        SELECT COUNT(*) as due_this_week
        FROM tasks
        WHERE project_id = ?
        AND status != "complete"
        AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    ');
    $stmt->execute([$projectId]);
    $dueThisWeek = $stmt->fetch();

    // Get recent activity
    $stmt = $db->prepare('
        SELECT
            al.action,
            al.description,
            al.created_at,
            u.full_name as user_name
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.project_id = ?
        ORDER BY al.created_at DESC
        LIMIT 10
    ');
    $stmt->execute([$projectId]);
    $recentActivity = $stmt->fetchAll();

    // Format priority breakdown
    $priorityStats = [];
    foreach ($priorityBreakdown as $row) {
        $priorityStats[$row['priority']] = (int)$row['count'];
    }

    successResponse([
        'total_tasks' => (int)$stats['total_tasks'],
        'completed' => (int)$stats['completed'],
        'in_progress' => (int)$stats['in_progress'],
        'not_started' => (int)$stats['not_started'],
        'milestones' => (int)$stats['milestones'],
        'avg_progress' => round((float)$stats['avg_progress'], 1),
        'overdue_count' => (int)$overdue['overdue_count'],
        'due_this_week' => (int)$dueThisWeek['due_this_week'],
        'earliest_start' => $stats['earliest_start'],
        'latest_end' => $stats['latest_end'],
        'priority_breakdown' => $priorityStats,
        'completion_rate' => $stats['total_tasks'] > 0
            ? round(($stats['completed'] / $stats['total_tasks']) * 100, 1)
            : 0,
        'recent_activity' => $recentActivity
    ]);

} catch (Exception $e) {
    error_log('Statistics API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
