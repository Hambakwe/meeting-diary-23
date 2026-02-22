<?php
/**
 * Gantt Project Manager - Diary/Calendar Events API
 * PHP 8.x Compatible
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Endpoints:
 * GET    /api/diary.php                        - List all events
 * GET    /api/diary.php?id=X                   - Get single event
 * GET    /api/diary.php?project_id=X           - Get events by project
 * GET    /api/diary.php?date=YYYY-MM-DD        - Get events for specific date
 * GET    /api/diary.php?month=YYYY-MM          - Get events for month
 * GET    /api/diary.php?from=DATE&to=DATE      - Get events in date range
 * POST   /api/diary.php                        - Create event
 * PUT    /api/diary.php?id=X                   - Update event
 * DELETE /api/diary.php?id=X                   - Delete event
 * GET    /api/diary.php?action=types           - Get event types
 * POST   /api/diary.php?action=attendees&id=X  - Add attendees to event
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::getInstance();

    switch ($method) {
        case 'GET':
            $action = $_GET['action'] ?? '';

            if ($action === 'types') {
                getEventTypes($db);
            } elseif (isset($_GET['id'])) {
                getEvent($db, (int)$_GET['id']);
            } elseif (isset($_GET['project_id'])) {
                getEventsByProject($db, (int)$_GET['project_id']);
            } elseif (isset($_GET['date'])) {
                getEventsByDate($db, $_GET['date']);
            } elseif (isset($_GET['month'])) {
                getEventsByMonth($db, $_GET['month']);
            } elseif (isset($_GET['from']) && isset($_GET['to'])) {
                getEventsInRange($db, $_GET['from'], $_GET['to']);
            } else {
                getAllEvents($db);
            }
            break;

        case 'POST':
            $action = $_GET['action'] ?? '';
            if ($action === 'attendees' && isset($_GET['id'])) {
                addAttendees($db, (int)$_GET['id']);
            } else {
                createEvent($db);
            }
            break;

        case 'PUT':
            if (!isset($_GET['id'])) {
                errorResponse('Event ID required', 400);
            }
            updateEvent($db, (int)$_GET['id']);
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('Event ID required', 400);
            }
            deleteEvent($db, (int)$_GET['id']);
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Diary API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Get all events
 */
function getAllEvents(PDO $db): void {
    $stmt = $db->query("
        SELECT e.*,
               et.name as event_type_name,
               et.slug as event_type_slug,
               et.color as event_type_color,
               et.icon as event_type_icon,
               u.full_name as created_by_name,
               p.name as project_name
        FROM diary_events e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.is_active = 1
        ORDER BY e.event_date ASC, e.start_time ASC
    ");

    $events = $stmt->fetchAll();

    // Add attendees to each event
    foreach ($events as &$event) {
        $event['attendees'] = getEventAttendees($db, (int)$event['id']);
    }

    successResponse($events);
}

/**
 * Get single event with attendees
 */
function getEvent(PDO $db, int $id): void {
    $stmt = $db->prepare("
        SELECT e.*,
               et.name as event_type_name,
               et.slug as event_type_slug,
               et.color as event_type_color,
               et.icon as event_type_icon,
               u.full_name as created_by_name,
               p.name as project_name
        FROM diary_events e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.id = ? AND e.is_active = 1
    ");
    $stmt->execute([$id]);
    $event = $stmt->fetch();

    if (!$event) {
        errorResponse('Event not found', 404);
    }

    $event['attendees'] = getEventAttendees($db, $id);

    successResponse($event);
}

/**
 * Get events by project
 */
function getEventsByProject(PDO $db, int $projectId): void {
    $stmt = $db->prepare("
        SELECT e.*,
               et.name as event_type_name,
               et.slug as event_type_slug,
               et.color as event_type_color,
               et.icon as event_type_icon,
               u.full_name as created_by_name
        FROM diary_events e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.project_id = ? AND e.is_active = 1
        ORDER BY e.event_date ASC, e.start_time ASC
    ");
    $stmt->execute([$projectId]);
    $events = $stmt->fetchAll();

    foreach ($events as &$event) {
        $event['attendees'] = getEventAttendees($db, (int)$event['id']);
    }

    successResponse($events);
}

/**
 * Get events by specific date
 */
function getEventsByDate(PDO $db, string $date): void {
    if (!isValidDate($date)) {
        errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
    }

    $stmt = $db->prepare("
        SELECT e.*,
               et.name as event_type_name,
               et.slug as event_type_slug,
               et.color as event_type_color,
               et.icon as event_type_icon,
               u.full_name as created_by_name,
               p.name as project_name
        FROM diary_events e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.event_date = ? AND e.is_active = 1
        ORDER BY e.start_time ASC
    ");
    $stmt->execute([$date]);
    $events = $stmt->fetchAll();

    foreach ($events as &$event) {
        $event['attendees'] = getEventAttendees($db, (int)$event['id']);
    }

    successResponse($events);
}

/**
 * Get events by month
 */
function getEventsByMonth(PDO $db, string $month): void {
    // Validate format YYYY-MM
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        errorResponse('Invalid month format. Use YYYY-MM', 400);
    }

    $stmt = $db->prepare("
        SELECT e.*,
               et.name as event_type_name,
               et.slug as event_type_slug,
               et.color as event_type_color,
               et.icon as event_type_icon,
               u.full_name as created_by_name,
               p.name as project_name
        FROM diary_events e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE DATE_FORMAT(e.event_date, '%Y-%m') = ? AND e.is_active = 1
        ORDER BY e.event_date ASC, e.start_time ASC
    ");
    $stmt->execute([$month]);
    $events = $stmt->fetchAll();

    foreach ($events as &$event) {
        $event['attendees'] = getEventAttendees($db, (int)$event['id']);
    }

    successResponse($events);
}

/**
 * Get events in date range
 */
function getEventsInRange(PDO $db, string $from, string $to): void {
    if (!isValidDate($from) || !isValidDate($to)) {
        errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
    }

    $stmt = $db->prepare("
        SELECT e.*,
               et.name as event_type_name,
               et.slug as event_type_slug,
               et.color as event_type_color,
               et.icon as event_type_icon,
               u.full_name as created_by_name,
               p.name as project_name
        FROM diary_events e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.event_date BETWEEN ? AND ? AND e.is_active = 1
        ORDER BY e.event_date ASC, e.start_time ASC
    ");
    $stmt->execute([$from, $to]);
    $events = $stmt->fetchAll();

    foreach ($events as &$event) {
        $event['attendees'] = getEventAttendees($db, (int)$event['id']);
    }

    successResponse($events);
}

/**
 * Get event types
 */
function getEventTypes(PDO $db): void {
    $stmt = $db->query("
        SELECT et.*,
               (SELECT COUNT(*) FROM diary_events e WHERE e.event_type_id = et.id AND e.is_active = 1) as event_count
        FROM event_types et
        WHERE et.is_active = 1
        ORDER BY et.name
    ");
    $types = $stmt->fetchAll();

    successResponse($types);
}

/**
 * Get attendees for an event
 */
function getEventAttendees(PDO $db, int $eventId): array {
    $stmt = $db->prepare("
        SELECT ea.*,
               u.full_name as user_name,
               u.email as user_email,
               tc.name as contact_name,
               tc.email as contact_email
        FROM event_attendees ea
        LEFT JOIN users u ON ea.user_id = u.id
        LEFT JOIN team_contacts tc ON ea.contact_id = tc.id
        WHERE ea.event_id = ?
    ");
    $stmt->execute([$eventId]);
    return $stmt->fetchAll();
}

/**
 * Create event
 */
function createEvent(PDO $db): void {
    $input = getJsonInput();

    $required = ['title', 'event_date'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            errorResponse("Field '$field' is required", 400);
        }
    }

    if (!isValidDate($input['event_date'])) {
        errorResponse('Invalid event_date format. Use YYYY-MM-DD', 400);
    }

    $stmt = $db->prepare("
        INSERT INTO diary_events
        (project_id, event_type_id, title, description, event_date, start_time, end_time,
         is_all_day, location, meeting_url, reminder_minutes, created_by, is_private)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $input['project_id'] ?? null,
        $input['event_type_id'] ?? null,
        sanitize($input['title']),
        sanitize($input['description'] ?? ''),
        $input['event_date'],
        $input['start_time'] ?? null,
        $input['end_time'] ?? null,
        $input['is_all_day'] ?? 0,
        sanitize($input['location'] ?? ''),
        sanitize($input['meeting_url'] ?? ''),
        $input['reminder_minutes'] ?? 15,
        $input['created_by'] ?? null,
        $input['is_private'] ?? 0,
    ]);

    $newId = (int)$db->lastInsertId();

    // Add attendees if provided
    if (!empty($input['attendees']) && is_array($input['attendees'])) {
        foreach ($input['attendees'] as $attendee) {
            addSingleAttendee($db, $newId, $attendee);
        }
    }

    // Fetch and return the new event
    $stmt = $db->prepare("
        SELECT e.*, et.name as event_type_name, et.slug as event_type_slug, et.color as event_type_color
        FROM diary_events e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        WHERE e.id = ?
    ");
    $stmt->execute([$newId]);
    $event = $stmt->fetch();
    $event['attendees'] = getEventAttendees($db, $newId);

    successResponse($event, 'Event created successfully');
}

/**
 * Add attendees to event
 */
function addAttendees(PDO $db, int $eventId): void {
    // Check event exists
    $stmt = $db->prepare("SELECT id FROM diary_events WHERE id = ? AND is_active = 1");
    $stmt->execute([$eventId]);
    if (!$stmt->fetch()) {
        errorResponse('Event not found', 404);
    }

    $input = getJsonInput();

    if (empty($input['attendees']) || !is_array($input['attendees'])) {
        errorResponse('Attendees array required', 400);
    }

    foreach ($input['attendees'] as $attendee) {
        addSingleAttendee($db, $eventId, $attendee);
    }

    $attendees = getEventAttendees($db, $eventId);
    successResponse($attendees, 'Attendees added successfully');
}

/**
 * Add single attendee to event
 */
function addSingleAttendee(PDO $db, int $eventId, array $attendee): void {
    $stmt = $db->prepare("
        INSERT INTO event_attendees (event_id, user_id, contact_id, name, email, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $eventId,
        $attendee['user_id'] ?? null,
        $attendee['contact_id'] ?? null,
        sanitize($attendee['name'] ?? ''),
        sanitize($attendee['email'] ?? ''),
        $attendee['status'] ?? 'pending',
    ]);
}

/**
 * Update event
 */
function updateEvent(PDO $db, int $id): void {
    $input = getJsonInput();

    // Check event exists
    $stmt = $db->prepare("SELECT id FROM diary_events WHERE id = ? AND is_active = 1");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Event not found', 404);
    }

    $updates = [];
    $params = [];

    $allowedFields = [
        'title', 'description', 'event_date', 'start_time', 'end_time',
        'is_all_day', 'location', 'meeting_url', 'event_type_id', 'project_id',
        'reminder_minutes', 'is_private'
    ];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "`$field` = ?";
            $params[] = is_string($input[$field]) ? sanitize($input[$field]) : $input[$field];
        }
    }

    if (empty($updates)) {
        errorResponse('No fields to update', 400);
    }

    $params[] = $id;
    $sql = "UPDATE diary_events SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    // Fetch and return updated event
    $stmt = $db->prepare("
        SELECT e.*, et.name as event_type_name, et.slug as event_type_slug, et.color as event_type_color
        FROM diary_events e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        WHERE e.id = ?
    ");
    $stmt->execute([$id]);
    $event = $stmt->fetch();
    $event['attendees'] = getEventAttendees($db, $id);

    successResponse($event, 'Event updated successfully');
}

/**
 * Delete event (soft delete)
 */
function deleteEvent(PDO $db, int $id): void {
    $stmt = $db->prepare("SELECT id FROM diary_events WHERE id = ? AND is_active = 1");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Event not found', 404);
    }

    $stmt = $db->prepare("UPDATE diary_events SET is_active = 0 WHERE id = ?");
    $stmt->execute([$id]);

    successResponse(null, 'Event deleted successfully');
}
