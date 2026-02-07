<?php
/**
 * Meeting Diary - API Index
 * Provides API information and health check
 */

require_once __DIR__ . '/config.php';

setCorsHeaders();

$apiInfo = [
    'name' => 'Meeting Diary API',
    'version' => '1.0.0',
    'status' => 'active',
    'endpoints' => [
        'persons' => [
            'GET /api/persons.php' => 'Get all persons',
            'GET /api/persons.php?id={id}' => 'Get person by ID',
            'POST /api/persons.php' => 'Create new person',
            'PUT /api/persons.php?id={id}' => 'Update person',
            'DELETE /api/persons.php?id={id}' => 'Delete person',
        ],
        'hotels' => [
            'GET /api/hotels.php' => 'Get all hotels',
            'GET /api/hotels.php?id={id}' => 'Get hotel by ID',
            'GET /api/hotels.php?country={country}' => 'Get hotels by country',
            'POST /api/hotels.php' => 'Create new hotel',
            'PUT /api/hotels.php?id={id}' => 'Update hotel',
            'DELETE /api/hotels.php?id={id}' => 'Delete hotel',
        ],
        'meetings' => [
            'GET /api/meetings.php' => 'Get all meetings',
            'GET /api/meetings.php?id={id}' => 'Get meeting by ID',
            'GET /api/meetings.php?status={status}' => 'Get meetings by status',
            'POST /api/meetings.php' => 'Create new meeting',
            'PUT /api/meetings.php?id={id}' => 'Update meeting',
            'DELETE /api/meetings.php?id={id}' => 'Delete meeting',
        ],
        'users' => [
            'GET /api/users.php' => 'Get all users',
            'GET /api/users.php?id={id}' => 'Get user by ID',
            'POST /api/users.php' => 'Create new user',
            'PUT /api/users.php?id={id}' => 'Update user',
            'DELETE /api/users.php?id={id}' => 'Delete user',
        ],
    ],
];

// Check database connection
try {
    $pdo = getDbConnection();
    $apiInfo['database'] = 'connected';
} catch (Exception $e) {
    $apiInfo['database'] = 'disconnected';
}

sendResponse($apiInfo);
