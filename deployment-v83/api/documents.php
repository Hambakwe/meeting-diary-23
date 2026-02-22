<?php
/**
 * Gantt Project Manager - Documents API
 * PHP 8.x Compatible
 *
 * @version v86
 * @package GanttProjectManager
 * @build 2026-02-21
 *
 * Endpoints:
 * GET    /api/documents.php                    - List all documents
 * GET    /api/documents.php?id=X               - Get single document
 * GET    /api/documents.php?project_id=X       - Get documents by project
 * GET    /api/documents.php?category=slug      - Get documents by category
 * POST   /api/documents.php                    - Create document record
 * PUT    /api/documents.php?id=X               - Update document
 * DELETE /api/documents.php?id=X               - Delete document
 * GET    /api/documents.php?action=categories  - Get all categories
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
                getDocument($db, (int)$_GET['id']);
            } elseif (isset($_GET['project_id'])) {
                getDocumentsByProject($db, (int)$_GET['project_id']);
            } elseif (isset($_GET['category'])) {
                getDocumentsByCategory($db, $_GET['category']);
            } else {
                getAllDocuments($db);
            }
            break;

        case 'POST':
            createDocument($db);
            break;

        case 'PUT':
            if (!isset($_GET['id'])) {
                errorResponse('Document ID required', 400);
            }
            updateDocument($db, (int)$_GET['id']);
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('Document ID required', 400);
            }
            deleteDocument($db, (int)$_GET['id']);
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Documents API Error: ' . $e->getMessage());
    errorResponse('Server error: ' . $e->getMessage(), 500);
}

/**
 * Get all documents
 */
function getAllDocuments(PDO $db): void {
    $stmt = $db->query("
        SELECT d.*,
               dc.name as category_name,
               dc.slug as category_slug,
               u.full_name as uploaded_by_name,
               p.name as project_name
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN projects p ON d.project_id = p.id
        WHERE d.is_active = 1
        ORDER BY d.created_at DESC
    ");

    $documents = $stmt->fetchAll();
    successResponse($documents);
}

/**
 * Get single document
 */
function getDocument(PDO $db, int $id): void {
    $stmt = $db->prepare("
        SELECT d.*,
               dc.name as category_name,
               dc.slug as category_slug,
               u.full_name as uploaded_by_name,
               p.name as project_name
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN projects p ON d.project_id = p.id
        WHERE d.id = ? AND d.is_active = 1
    ");
    $stmt->execute([$id]);
    $document = $stmt->fetch();

    if (!$document) {
        errorResponse('Document not found', 404);
    }

    successResponse($document);
}

/**
 * Get documents by project
 */
function getDocumentsByProject(PDO $db, int $projectId): void {
    $stmt = $db->prepare("
        SELECT d.*,
               dc.name as category_name,
               dc.slug as category_slug,
               u.full_name as uploaded_by_name
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.project_id = ? AND d.is_active = 1
        ORDER BY d.created_at DESC
    ");
    $stmt->execute([$projectId]);
    $documents = $stmt->fetchAll();

    successResponse($documents);
}

/**
 * Get documents by category
 */
function getDocumentsByCategory(PDO $db, string $categorySlug): void {
    $stmt = $db->prepare("
        SELECT d.*,
               dc.name as category_name,
               dc.slug as category_slug,
               u.full_name as uploaded_by_name,
               p.name as project_name
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN projects p ON d.project_id = p.id
        WHERE dc.slug = ? AND d.is_active = 1
        ORDER BY d.created_at DESC
    ");
    $stmt->execute([$categorySlug]);
    $documents = $stmt->fetchAll();

    successResponse($documents);
}

/**
 * Get all categories
 */
function getCategories(PDO $db): void {
    $stmt = $db->query("
        SELECT dc.*,
               (SELECT COUNT(*) FROM documents d WHERE d.category_id = dc.id AND d.is_active = 1) as document_count
        FROM document_categories dc
        WHERE dc.is_active = 1
        ORDER BY dc.sort_order, dc.name
    ");
    $categories = $stmt->fetchAll();

    successResponse($categories);
}

/**
 * Create document record
 */
function createDocument(PDO $db): void {
    $input = getJsonInput();

    $required = ['name', 'file_name', 'file_path', 'file_type'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            errorResponse("Field '$field' is required", 400);
        }
    }

    $stmt = $db->prepare("
        INSERT INTO documents
        (project_id, category_id, name, description, file_name, file_path, file_type, file_size, mime_type, version, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $input['project_id'] ?? null,
        $input['category_id'] ?? null,
        sanitize($input['name']),
        sanitize($input['description'] ?? ''),
        sanitize($input['file_name']),
        sanitize($input['file_path']),
        sanitize($input['file_type']),
        $input['file_size'] ?? 0,
        $input['mime_type'] ?? null,
        $input['version'] ?? '1.0',
        $input['uploaded_by'] ?? null,
    ]);

    $newId = (int)$db->lastInsertId();

    // Fetch and return the new document
    $stmt = $db->prepare("SELECT * FROM documents WHERE id = ?");
    $stmt->execute([$newId]);
    $document = $stmt->fetch();

    successResponse($document, 'Document created successfully');
}

/**
 * Update document
 */
function updateDocument(PDO $db, int $id): void {
    $input = getJsonInput();

    // Check document exists
    $stmt = $db->prepare("SELECT id FROM documents WHERE id = ? AND is_active = 1");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Document not found', 404);
    }

    $updates = [];
    $params = [];

    $allowedFields = ['name', 'description', 'category_id', 'project_id', 'version', 'is_confidential'];

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
    $sql = "UPDATE documents SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    // Fetch and return updated document
    $stmt = $db->prepare("SELECT * FROM documents WHERE id = ?");
    $stmt->execute([$id]);
    $document = $stmt->fetch();

    successResponse($document, 'Document updated successfully');
}

/**
 * Delete document (soft delete)
 */
function deleteDocument(PDO $db, int $id): void {
    $stmt = $db->prepare("SELECT id FROM documents WHERE id = ? AND is_active = 1");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Document not found', 404);
    }

    $stmt = $db->prepare("UPDATE documents SET is_active = 0 WHERE id = ?");
    $stmt->execute([$id]);

    successResponse(null, 'Document deleted successfully');
}
