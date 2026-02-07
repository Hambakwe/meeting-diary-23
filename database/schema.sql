-- Meeting Diary Database Schema for MariaDB/MySQL
-- Run this script to create the database structure
-- Version: 1.0.0
-- Date: 2026-02-03

-- Create database (run as root/admin user)
-- CREATE DATABASE IF NOT EXISTS meeting_diary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE meeting_diary;

-- =====================================================
-- USERS TABLE
-- Stores application users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) DEFAULT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT DEFAULT ADMIN USER
-- Email: admin@meetings.com
-- Password: Admin123!
--
-- NOTE: After running this schema, run reset_admin_password.php
-- on your server to set the correct password hash!
-- =====================================================
INSERT INTO users (id, name, email, password_hash, role) VALUES
('admin-001', 'Administrator', 'admin@meetings.com', '', 'admin')
ON DUPLICATE KEY UPDATE name = name;

-- =====================================================
-- PERSONS TABLE
-- Stores contacts/people for meetings
-- =====================================================
CREATE TABLE IF NOT EXISTS persons (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    company VARCHAR(255) DEFAULT NULL,
    role VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    home_country VARCHAR(100) DEFAULT NULL,
    badge_color VARCHAR(50) DEFAULT NULL,  -- CSS class for initials badge color
    notes TEXT DEFAULT NULL,
    photo LONGTEXT DEFAULT NULL,  -- Base64 encoded photo or URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_persons_name (name),
    INDEX idx_persons_company (company),
    INDEX idx_persons_country (home_country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: Add columns if they don't exist (for existing databases)
-- ALTER TABLE persons ADD COLUMN IF NOT EXISTS home_country VARCHAR(100) DEFAULT NULL;
-- ALTER TABLE persons ADD COLUMN IF NOT EXISTS badge_color VARCHAR(50) DEFAULT NULL;

-- =====================================================
-- HOTELS TABLE
-- Stores hotel information with location data
-- =====================================================
CREATE TABLE IF NOT EXISTS hotels (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) DEFAULT NULL,
    full_address TEXT NOT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hotels_country (country),
    INDEX idx_hotels_city (city),
    INDEX idx_hotels_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MEETINGS TABLE
-- Stores meeting records with relationships to persons and hotels
-- =====================================================
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    person_id VARCHAR(50) NOT NULL,
    hotel_id VARCHAR(50) DEFAULT NULL,
    destination VARCHAR(100) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    notes TEXT DEFAULT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_meetings_person FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_meetings_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_meetings_person (person_id),
    INDEX idx_meetings_hotel (hotel_id),
    INDEX idx_meetings_status (status),
    INDEX idx_meetings_dates (from_date, to_date),
    INDEX idx_meetings_destination (destination)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TRIPS TABLE (Optional - for migration from trip-based app)
-- Add hotel_id column to existing trip table
-- =====================================================
-- ALTER TABLE trip ADD COLUMN hotel_id VARCHAR(50) DEFAULT NULL;
-- ALTER TABLE trip ADD CONSTRAINT fk_trip_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL ON UPDATE CASCADE;
