-- ===========================================================================
-- CLEANUP SCRIPT FOR TEST DATA & DUPLICATE ADMISSIONS
-- ===========================================================================
-- This script cleans up duplicate admissions and test data
-- Run this in your PostgreSQL database using: psql -U postgres -d school_admissions -f cleanup.sql
--
-- What it does:
-- 1. Identifies registrations with multiple admissions
-- 2. Deletes duplicate admissions (keeps the first one)
-- 3. Deletes test registrations (Akhil, Mithun, sample, test)
-- 4. Cleans up all related data
--
-- IMPORTANT: Review the queries first before running!
-- ===========================================================================

-- Step 1: Show registrations with duplicate admissions (for review)
SELECT 
    r.id,
    r.registration_no,
    r.student_name,
    COUNT(a.id) as admission_count,
    STRING_AGG(a.id::text, ', ' ORDER BY a.created_at) as admission_ids
FROM registrations r
LEFT JOIN admission_applications a ON r.id = a.registration_id
GROUP BY r.id, r.registration_no, r.student_name
HAVING COUNT(a.id) > 1
ORDER BY r.student_name;

-- Step 2: Delete duplicate admissions (keeps the earliest one per registration)
-- First, identify which admissions to delete
WITH duplicate_admissions AS (
    SELECT 
        a.id,
        a.registration_id,
        ROW_NUMBER() OVER (PARTITION BY a.registration_id ORDER BY a.created_at ASC) as rn
    FROM admission_applications a
)
-- Delete payments for duplicate admissions
DELETE FROM payments 
WHERE admission_id IN (
    SELECT id FROM duplicate_admissions WHERE rn > 1
);

-- Delete admission status history
DELETE FROM admission_status_history 
WHERE admission_id IN (
    WITH duplicate_admissions AS (
        SELECT 
            a.id,
            ROW_NUMBER() OVER (PARTITION BY a.registration_id ORDER BY a.created_at ASC) as rn
        FROM admission_applications a
    )
    SELECT id FROM duplicate_admissions WHERE rn > 1
);

-- Delete previous school details
DELETE FROM previous_school_details 
WHERE admission_id IN (
    WITH duplicate_admissions AS (
        SELECT 
            a.id,
            ROW_NUMBER() OVER (PARTITION BY a.registration_id ORDER BY a.created_at ASC) as rn
        FROM admission_applications a
    )
    SELECT id FROM duplicate_admissions WHERE rn > 1
);

-- Delete transport requests
DELETE FROM transport_requests 
WHERE admission_id IN (
    WITH duplicate_admissions AS (
        SELECT 
            a.id,
            ROW_NUMBER() OVER (PARTITION BY a.registration_id ORDER BY a.created_at ASC) as rn
        FROM admission_applications a
    )
    SELECT id FROM duplicate_admissions WHERE rn > 1
);

-- Finally, delete the duplicate admissions
DELETE FROM admission_applications 
WHERE id IN (
    WITH duplicate_admissions AS (
        SELECT 
            a.id,
            ROW_NUMBER() OVER (PARTITION BY a.registration_id ORDER BY a.created_at ASC) as rn
        FROM admission_applications a
    )
    SELECT id FROM duplicate_admissions WHERE rn > 1
);

-- Step 3: Show test registrations before deletion (for review)
SELECT 
    id,
    registration_no,
    student_name,
    status
FROM registrations 
WHERE LOWER(student_name) LIKE '%akhil%' 
   OR LOWER(student_name) LIKE '%mithun%'
   OR LOWER(student_name) LIKE '%test%'
   OR LOWER(student_name) LIKE '%sample%'
ORDER BY student_name;

-- Step 4: Delete test registrations and all their related data
-- Note: This is optional. Comment out if you want to keep these records.

-- Get list of test registration IDs and related student IDs
WITH test_regs AS (
    SELECT 
        id as reg_id,
        student_id
    FROM registrations 
    WHERE LOWER(student_name) LIKE '%akhil%' 
       OR LOWER(student_name) LIKE '%mithun%'
       OR LOWER(student_name) LIKE '%test%'
       OR LOWER(student_name) LIKE '%sample%'
)
DELETE FROM admission_applications 
WHERE registration_id IN (SELECT reg_id FROM test_regs);

-- Delete payments for test registrations
WITH test_regs AS (
    SELECT id FROM registrations 
    WHERE LOWER(student_name) LIKE '%akhil%' 
       OR LOWER(student_name) LIKE '%mithun%'
       OR LOWER(student_name) LIKE '%test%'
       OR LOWER(student_name) LIKE '%sample%'
),
test_admissions AS (
    SELECT id FROM admission_applications 
    WHERE registration_id IN (SELECT id FROM test_regs)
)
DELETE FROM payments 
WHERE admission_id IN (SELECT id FROM test_admissions);

-- Delete test registrations
DELETE FROM registrations 
WHERE LOWER(student_name) LIKE '%akhil%' 
   OR LOWER(student_name) LIKE '%mithun%'
   OR LOWER(student_name) LIKE '%test%'
   OR LOWER(student_name) LIKE '%sample%';

-- Step 5: Verify cleanup was successful
SELECT 
    'Registrations with duplicate admissions' as check_name,
    COUNT(*) as count
FROM (
    SELECT 
        r.id,
        COUNT(a.id) as admission_count
    FROM registrations r
    LEFT JOIN admission_applications a ON r.id = a.registration_id
    GROUP BY r.id
    HAVING COUNT(a.id) > 1
) subquery
UNION ALL
SELECT 
    'Test registrations remaining' as check_name,
    COUNT(*) as count
FROM registrations 
WHERE LOWER(student_name) LIKE '%akhil%' 
   OR LOWER(student_name) LIKE '%mithun%'
   OR LOWER(student_name) LIKE '%test%'
   OR LOWER(student_name) LIKE '%sample%';

-- ===========================================================================
-- CLEANUP COMPLETE!
-- ===========================================================================
-- Expected result: Both counts should be 0
-- If they're not, there may be an issue with the cleanup.
-- ===========================================================================
