<?php
/**
 * Gantt Project Manager - Team Contacts API
 * PHP 8.x Compatible
 *
 * @version v95
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Endpoints:
 * GET    /api/contacts.php                    - List all contacts
 * GET    /api/contacts.php?id=X               - Get single contact
 * GET    /api/contacts.php?project_id=X       - Get contacts by project (+ global)
 * GET    /api/contacts.php?category=slug      - Get contacts by category
 * POST   /api/contacts.php                    - Create contact
 * PUT    /api/contacts.php?id=X               - Update contact
 * DELETE /api/contacts.php?id=X               - Delete contact
 * GET    /api/contacts.php?action=categories  - Get all categories
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::getInstance();

    switch ($method) {
        case 'GET':
            $action = $_GET['action'] ?? '';

            if ($action === 'categories') {
                getCategories($db);
            } elseif (isset($_GET['id'])) {
                getContact($db, (int)$_GET['id']);
            } elseif (isset($_GET['project_id'])) {
                getContactsByProject($db, (int)$_GET['project_id']);
            } elseif (isset($_GET['category'])) {
                getContactsByCategory($db, $_GET['category']);
            } else {
                getAllContacts($db);
            }
            break;

        case 'POST':
            createContact($db);
            break;

        case 'PUT':
            if (!isset($_GET['id'])) {
                errorResponse('Contact ID required', 400);
            }
            updateContact($db, (int)$_GET['id']);
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('Contact ID required', 400);
            }
            deleteContact($db, (int)$_GET['id']);
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Contacts API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Get all contacts
 */
function getAllContacts(PDO $db): void {
    $stmt = $db->query("
        SELECT tc.*,
               cc.name as category_name,
               cc.slug as category_slug,
               cc.color as category_color,
               p.name as project_name
        FROM team_contacts tc
        LEFT JOIN contact_categories cc ON tc.category_id = cc.id
        LEFT JOIN projects p ON tc.project_id = p.id
        WHERE tc.is_active = 1
        ORDER BY cc.sort_order, tc.is_primary DESC, tc.sort_order, tc.name
    ");

    $contacts = $stmt->fetchAll();
    successResponse($contacts);
}

/**
 * Get single contact
 */
function getContact(PDO $db, int $id): void {
    $stmt = $db->prepare("
        SELECT tc.*,
               cc.name as category_name,
               cc.slug as category_slug,
               cc.color as category_color,
               p.name as project_name
        FROM team_contacts tc
        LEFT JOIN contact_categories cc ON tc.category_id = cc.id
        LEFT JOIN projects p ON tc.project_id = p.id
        WHERE tc.id = ? AND tc.is_active = 1
    ");
    $stmt->execute([$id]);
    $contact = $stmt->fetch();

    if (!$contact) {
        errorResponse('Contact not found', 404);
    }

    successResponse($contact);
}

/**
 * Get contacts by project (includes global contacts where project_id is NULL)
 */
function getContactsByProject(PDO $db, int $projectId): void {
    $stmt = $db->prepare("
        SELECT tc.*,
               cc.name as category_name,
               cc.slug as category_slug,
               cc.color as category_color
        FROM team_contacts tc
        LEFT JOIN contact_categories cc ON tc.category_id = cc.id
        WHERE (tc.project_id = ? OR tc.project_id IS NULL) AND tc.is_active = 1
        ORDER BY cc.sort_order, tc.is_primary DESC, tc.sort_order, tc.name
    ");
    $stmt->execute([$projectId]);
    $contacts = $stmt->fetchAll();

    successResponse($contacts);
}

/**
 * Get contacts by category
 */
function getContactsByCategory(PDO $db, string $categorySlug): void {
    $stmt = $db->prepare("
        SELECT tc.*,
               cc.name as category_name,
               cc.slug as category_slug,
               cc.color as category_color,
               p.name as project_name
        FROM team_contacts tc
        LEFT JOIN contact_categories cc ON tc.category_id = cc.id
        LEFT JOIN projects p ON tc.project_id = p.id
        WHERE cc.slug = ? AND tc.is_active = 1
        ORDER BY tc.is_primary DESC, tc.sort_order, tc.name
    ");
    $stmt->execute([$categorySlug]);
    $contacts = $stmt->fetchAll();

    successResponse($contacts);
}

/**
 * Get all categories
 */
function getCategories(PDO $db): void {
    $stmt = $db->query("
        SELECT cc.*,
               (SELECT COUNT(*) FROM team_contacts tc WHERE tc.category_id = cc.id AND tc.is_active = 1) as contact_count
        FROM contact_categories cc
        WHERE cc.is_active = 1
        ORDER BY cc.sort_order, cc.name
    ");
    $categories = $stmt->fetchAll();

    successResponse($categories);
}

/**
 * Create contact
 */
function createContact(PDO $db): void {
    $input = getJsonInput();

    if (empty($input['name'])) {
        errorResponse("Field 'name' is required", 400);
    }

    $stmt = $db->prepare("
        INSERT INTO team_contacts
        (project_id, category_id, user_id, name, role, company, email, phone, mobile, location, linkedin_url, avatar_url, notes, is_primary, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $input['project_id'] ?? null,
        $input['category_id'] ?? null,
        $input['user_id'] ?? null,
        sanitize($input['name']),
        sanitize($input['role'] ?? ''),
        sanitize($input['company'] ?? ''),
        sanitize($input['email'] ?? ''),
        sanitize($input['phone'] ?? ''),
        sanitize($input['mobile'] ?? ''),
        sanitize($input['location'] ?? ''),
        sanitize($input['linkedin_url'] ?? ''),
        sanitize($input['avatar_url'] ?? ''),
        sanitize($input['notes'] ?? ''),
        $input['is_primary'] ?? 0,
        $input['sort_order'] ?? 0,
    ]);

    $newId = (int)$db->lastInsertId();

    // Fetch and return the new contact
    $stmt = $db->prepare("
        SELECT tc.*, cc.name as category_name, cc.slug as category_slug
        FROM team_contacts tc
        LEFT JOIN contact_categories cc ON tc.category_id = cc.id
        WHERE tc.id = ?
    ");
    $stmt->execute([$newId]);
    $contact = $stmt->fetch();

    successResponse($contact, 'Contact created successfully');
}

/**
 * Update contact
 */
function updateContact(PDO $db, int $id): void {
    $input = getJsonInput();

    // Check contact exists
    $stmt = $db->prepare("SELECT id FROM team_contacts WHERE id = ? AND is_active = 1");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Contact not found', 404);
    }

    $updates = [];
    $params = [];

    $allowedFields = [
        'name', 'role', 'company', 'email', 'phone', 'mobile',
        'location', 'linkedin_url', 'avatar_url', 'notes',
        'category_id', 'project_id', 'is_primary', 'sort_order'
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
    $sql = "UPDATE team_contacts SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    // Fetch and return updated contact
    $stmt = $db->prepare("
        SELECT tc.*, cc.name as category_name, cc.slug as category_slug
        FROM team_contacts tc
        LEFT JOIN contact_categories cc ON tc.category_id = cc.id
        WHERE tc.id = ?
    ");
    $stmt->execute([$id]);
    $contact = $stmt->fetch();

    successResponse($contact, 'Contact updated successfully');
}

/**
 * Delete contact (soft delete)
 */
function deleteContact(PDO $db, int $id): void {
    $stmt = $db->prepare("SELECT id FROM team_contacts WHERE id = ? AND is_active = 1");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Contact not found', 404);
    }

    $stmt = $db->prepare("UPDATE team_contacts SET is_active = 0 WHERE id = ?");
    $stmt->execute([$id]);

    successResponse(null, 'Contact deleted successfully');
}
