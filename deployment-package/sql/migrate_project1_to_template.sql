-- ============================================================
-- Gantt Project Manager - Migrate Project 1 to Template
-- Version: v77
-- Build: 2026-02-20
-- ============================================================
-- This script copies project ID=1 from the 'projects' table
-- to create a new template called 'OCF Nordic Bond Issue'
-- and transfers all related tasks to the template tasks table.
--
-- Compatible with MySQL 5.7+ / MariaDB 10.2+
-- ============================================================

USE `oasiscapfin_gantt_project_manager`;

-- Start transaction for safety
START TRANSACTION;

-- ============================================================
-- Step 1: Create the project template from project ID=1
-- ============================================================

INSERT INTO `project_templates` (
    `name`,
    `description`,
    `project_type`,
    `color`,
    `is_active`,
    `created_by`,
    `created_at`
)
SELECT
    'OCF Nordic Bond Issue' AS `name`,
    COALESCE(p.`description`, 'OCF Nordic Bond Issuance process template') AS `description`,
    'bond_issuance' AS `project_type`,
    COALESCE(p.`color`, '#14b8a6') AS `color`,
    1 AS `is_active`,
    p.`owner_id` AS `created_by`,
    NOW() AS `created_at`
FROM `projects` p
WHERE p.`id` = 1;

-- Get the new template ID
SET @new_template_id = LAST_INSERT_ID();

-- Verify template was created
SELECT CONCAT('Created template ID: ', @new_template_id, ' - OCF Nordic Bond Issue') AS status;

-- ============================================================
-- Step 2: Find the project start date (earliest task start)
-- ============================================================

SET @project_start_date = (
    SELECT MIN(`start_date`)
    FROM `tasks`
    WHERE `project_id` = 1
);

SELECT CONCAT('Project start date: ', @project_start_date) AS status;

-- ============================================================
-- Step 3: Create temporary table to map old task IDs to new
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS `task_id_map`;
CREATE TEMPORARY TABLE `task_id_map` (
    `old_task_id` INT NOT NULL,
    `new_template_task_id` INT NOT NULL,
    PRIMARY KEY (`old_task_id`)
);

-- ============================================================
-- Step 4: Insert tasks into task_templates
-- Calculate days_from_start and duration_days from actual dates
-- ============================================================

-- Insert tasks without parent_id first (we'll update parent references after)
INSERT INTO `task_templates` (
    `template_id`,
    `parent_template_task_id`,
    `name`,
    `description`,
    `notes`,
    `days_from_start`,
    `duration_days`,
    `priority`,
    `is_milestone`,
    `task_order`,
    `color`
)
SELECT
    @new_template_id AS `template_id`,
    NULL AS `parent_template_task_id`,  -- Will update after
    t.`name`,
    t.`description`,
    t.`notes`,
    DATEDIFF(t.`start_date`, @project_start_date) AS `days_from_start`,
    GREATEST(1, DATEDIFF(t.`end_date`, t.`start_date`) + 1) AS `duration_days`,
    t.`priority`,
    t.`is_milestone`,
    t.`task_order`,
    t.`color`
FROM `tasks` t
WHERE t.`project_id` = 1
ORDER BY t.`start_date` ASC, t.`task_order` ASC;

-- ============================================================
-- Step 5: Build the ID mapping table
-- ============================================================

-- We need to match old tasks to new template tasks by name and order
-- Since we inserted in the same order, we can match by position

INSERT INTO `task_id_map` (`old_task_id`, `new_template_task_id`)
SELECT
    old_tasks.`id` AS `old_task_id`,
    new_tasks.`id` AS `new_template_task_id`
FROM (
    SELECT `id`, `name`, `task_order`,
           ROW_NUMBER() OVER (ORDER BY `start_date` ASC, `task_order` ASC) AS `row_num`
    FROM `tasks`
    WHERE `project_id` = 1
) old_tasks
JOIN (
    SELECT `id`, `name`, `task_order`,
           ROW_NUMBER() OVER (ORDER BY `days_from_start` ASC, `task_order` ASC) AS `row_num`
    FROM `task_templates`
    WHERE `template_id` = @new_template_id
) new_tasks ON old_tasks.`row_num` = new_tasks.`row_num`;

-- Show mapping count
SELECT CONCAT('Mapped ', COUNT(*), ' tasks') AS status FROM `task_id_map`;

-- ============================================================
-- Step 6: Update parent_template_task_id references
-- ============================================================

UPDATE `task_templates` tt
JOIN `tasks` t ON t.`name` = tt.`name` AND t.`project_id` = 1
JOIN `task_id_map` parent_map ON t.`parent_id` = parent_map.`old_task_id`
SET tt.`parent_template_task_id` = parent_map.`new_template_task_id`
WHERE tt.`template_id` = @new_template_id
  AND t.`parent_id` IS NOT NULL;

-- Show how many parent references were updated
SELECT CONCAT('Updated ', ROW_COUNT(), ' parent task references') AS status;

-- ============================================================
-- Step 7: Copy task dependencies to template dependencies
-- ============================================================

INSERT INTO `task_template_dependencies` (
    `task_template_id`,
    `depends_on_template_task_id`,
    `dependency_type`
)
SELECT
    task_map.`new_template_task_id` AS `task_template_id`,
    dep_map.`new_template_task_id` AS `depends_on_template_task_id`,
    td.`dependency_type`
FROM `task_dependencies` td
JOIN `task_id_map` task_map ON td.`task_id` = task_map.`old_task_id`
JOIN `task_id_map` dep_map ON td.`depends_on_task_id` = dep_map.`old_task_id`;

-- Show how many dependencies were copied
SELECT CONCAT('Copied ', ROW_COUNT(), ' task dependencies') AS status;

-- ============================================================
-- Step 8: Verify the migration
-- ============================================================

SELECT 'Migration Summary:' AS ``;

SELECT
    pt.`id` AS `template_id`,
    pt.`name` AS `template_name`,
    pt.`project_type`,
    COUNT(tt.`id`) AS `task_count`,
    MAX(tt.`days_from_start` + tt.`duration_days`) AS `total_duration_days`
FROM `project_templates` pt
LEFT JOIN `task_templates` tt ON pt.`id` = tt.`template_id`
WHERE pt.`id` = @new_template_id
GROUP BY pt.`id`;

-- Show first 10 tasks with their calculated dates
SELECT
    tt.`id`,
    tt.`name`,
    tt.`days_from_start`,
    tt.`duration_days`,
    CONCAT('Day ', tt.`days_from_start` + 1, ' - Day ', tt.`days_from_start` + tt.`duration_days`) AS `relative_days`,
    tt.`priority`,
    IF(tt.`is_milestone`, 'Yes', 'No') AS `milestone`
FROM `task_templates` tt
WHERE tt.`template_id` = @new_template_id
ORDER BY tt.`days_from_start` ASC, tt.`task_order` ASC
LIMIT 15;

-- Clean up
DROP TEMPORARY TABLE IF EXISTS `task_id_map`;

-- Commit the transaction
COMMIT;

SELECT 'Migration completed successfully!' AS status;
SELECT CONCAT('New template ID: ', @new_template_id) AS result;
