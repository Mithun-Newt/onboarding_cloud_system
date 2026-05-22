-- =============================================================================
-- Junior School Admissions & Onboarding System
-- Database Initialization Script — PostgreSQL 14+
--
-- Usage:
--   psql -U <user> -d <database> -f database/init.sql
--
-- This script is idempotent: safe to run on an existing database.
-- Column names match Prisma-generated camelCase exactly (quoted identifiers).
--
-- Default admin credentials after seeding:
--   Username : admin
--   Password : Admin@12345   (mustChangePassword = true — change on first login)
--
-- NOTE: Use this script as an alternative to "prisma db push + npm run db:seed".
--       Do NOT run both — pick one method.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- needed for gen_random_uuid() and crypt()

-- ---------------------------------------------------------------------------
-- Enum Types (idempotent via exception handler)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "RoleName" AS ENUM (
    'SYSTEM_ADMIN','VICE_PRINCIPAL','ADMISSION_STAFF','CASHIER',
    'DOCUMENT_VERIFIER','TRANSPORT_STAFF','READ_ONLY_MANAGEMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RegistrationStatus" AS ENUM (
    'REGISTERED','ADMISSION_STARTED','ADMITTED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AdmissionStatus" AS ENUM ('DRAFT','CONFIRMED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM (
    'NOT_RECEIVED','UPLOADED','VERIFIED','REJECTED','WAIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMode" AS ENUM (
    'CASH','CARD','UPI','BANK_TRANSFER','CHEQUE','WAIVER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING','PARTIAL','PAID','WAIVED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Gender" AS ENUM ('MALE','FEMALE','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EnquirySourceType" AS ENUM (
    'FLYER','PARENTS','SIBLINGS','SELF','SOCIAL_MEDIA','WEBSITE','WORD_OF_MOUTH','OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Core entities ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS schools (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        TEXT        NOT NULL,
    address     TEXT,
    phone       TEXT,
    email       TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campuses (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "schoolId"  TEXT        NOT NULL REFERENCES schools(id),
    name        TEXT        NOT NULL,
    address     TEXT,
    phone       TEXT,
    "isActive"  BOOLEAN     NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_years (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    label       TEXT        NOT NULL UNIQUE,
    "startYear" INT         NOT NULL,
    "endYear"   INT         NOT NULL,
    "isActive"  BOOLEAN     NOT NULL DEFAULT FALSE,
    "isCurrent" BOOLEAN     NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grades (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        TEXT        NOT NULL UNIQUE,
    "sortOrder" INT         NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN     NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_seat_capacity (
    id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "academicYearId" TEXT        NOT NULL REFERENCES academic_years(id),
    "gradeId"        TEXT        NOT NULL REFERENCES grades(id),
    "campusId"       TEXT        NOT NULL REFERENCES campuses(id),
    "totalSeats"     INT         NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("academicYearId", "gradeId", "campusId")
);

-- Staff & auth ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        "RoleName"  NOT NULL UNIQUE,
    description TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_users (
    id                   TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username             TEXT        NOT NULL UNIQUE,
    email                TEXT        UNIQUE,
    "passwordHash"       TEXT        NOT NULL,
    "fullName"           TEXT        NOT NULL,
    phone                TEXT,
    "isActive"           BOOLEAN     NOT NULL DEFAULT TRUE,
    "mustChangePassword" BOOLEAN     NOT NULL DEFAULT TRUE,
    "lastLoginAt"        TIMESTAMP(3),
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_user_roles (
    id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "staffUserId" TEXT        NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
    "roleId"      TEXT        NOT NULL REFERENCES roles(id),
    "assignedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("staffUserId", "roleId")
);

-- Students & families ---------------------------------------------------

CREATE TABLE IF NOT EXISTS families (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guardians (
    id             TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "familyId"     TEXT         NOT NULL REFERENCES families(id),
    relationship   TEXT         NOT NULL,
    "fullName"     TEXT         NOT NULL,
    mobile         TEXT,
    email          TEXT,
    education      TEXT,
    occupation     TEXT,
    "annualIncome" NUMERIC(12,2),
    "isPrimary"    BOOLEAN      NOT NULL DEFAULT FALSE,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "familyId"     TEXT        REFERENCES families(id),
    "fullNameEn"   TEXT        NOT NULL,
    "fullNameTa"   TEXT,
    "givenName"    TEXT,
    surname        TEXT,
    "dateOfBirth"  TIMESTAMP(3) NOT NULL,
    gender         "Gender"    NOT NULL,
    "bloodGroup"   TEXT,
    religion       TEXT,
    community      TEXT,
    category       TEXT,
    "motherTongue" TEXT,
    nationality    TEXT        NOT NULL DEFAULT 'Indian',
    "emisNumber"   TEXT,
    "aadhaarLast4" TEXT,
    address1       TEXT,
    address2       TEXT,
    city           TEXT,
    state          TEXT,
    "pinCode"      TEXT,
    "photoPath"    TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Registration ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS enquiry_sources (
    id          TEXT                 PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        TEXT                 NOT NULL UNIQUE,
    type        "EnquirySourceType"  NOT NULL DEFAULT 'OTHER',
    "isActive"  BOOLEAN              NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
    id                TEXT                 PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "registrationNo"  TEXT                 NOT NULL UNIQUE,
    "academicYearId"  TEXT                 NOT NULL REFERENCES academic_years(id),
    "campusId"        TEXT                 NOT NULL REFERENCES campuses(id),
    "gradeId"         TEXT                 NOT NULL REFERENCES grades(id),
    "registrationDate" TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status            "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "studentId"       TEXT                 REFERENCES students(id),
    "studentName"     TEXT                 NOT NULL,
    "dateOfBirth"     TIMESTAMP(3)         NOT NULL,
    gender            "Gender"             NOT NULL,
    "fatherName"      TEXT,
    "fatherMobile"    TEXT,
    "motherName"      TEXT,
    "motherMobile"    TEXT,
    "primaryContact"  TEXT,
    "prevSchoolName"  TEXT,
    address1          TEXT,
    address2          TEXT,
    city              TEXT,
    state             TEXT,
    "pinCode"         TEXT,
    "enquirySourceId" TEXT                 REFERENCES enquiry_sources(id),
    "specialSupport"  BOOLEAN              NOT NULL DEFAULT FALSE,
    "specialDetails"  TEXT,
    "staffRemarks"    TEXT,
    "createdAt"       TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Admissions ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admission_applications (
    id                   TEXT              PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "admissionNo"        TEXT              UNIQUE,
    "registrationId"     TEXT              NOT NULL REFERENCES registrations(id),
    "academicYearId"     TEXT              NOT NULL REFERENCES academic_years(id),
    "campusId"           TEXT              NOT NULL REFERENCES campuses(id),
    "gradeId"            TEXT              NOT NULL REFERENCES grades(id),
    "studentId"          TEXT              NOT NULL REFERENCES students(id),
    status               "AdmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "confirmedAt"        TIMESTAMP(3),
    "confirmedByUserId"  TEXT,
    "cancelledAt"        TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt"          TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admission_status_history (
    id              TEXT              PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "admissionId"   TEXT              NOT NULL REFERENCES admission_applications(id),
    "fromStatus"    "AdmissionStatus",
    "toStatus"      "AdmissionStatus" NOT NULL,
    "changedByUser" TEXT,
    reason          TEXT,
    "changedAt"     TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS previous_school_details (
    id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "admissionId"     TEXT        NOT NULL UNIQUE REFERENCES admission_applications(id),
    "schoolName"      TEXT,
    "schoolAddress"   TEXT,
    "lastClassPassed" TEXT,
    "prevAcademicYear" TEXT,
    "tcNumber"        TEXT,
    awards            TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Medical & vaccination -------------------------------------------------

CREATE TABLE IF NOT EXISTS student_medical_profiles (
    id                  TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId"         TEXT        NOT NULL UNIQUE REFERENCES students(id),
    "walkingStatus"     TEXT,
    "speechStatus"      TEXT,
    "hasAllergies"      BOOLEAN     NOT NULL DEFAULT FALSE,
    "allergyDetails"    TEXT,
    "healthIssues"      TEXT,
    "needsMedication"   BOOLEAN     NOT NULL DEFAULT FALSE,
    "medicationDetails" TEXT,
    "specialAttention"  TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vaccine_types (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        TEXT        NOT NULL UNIQUE,
    "isActive"  BOOLEAN     NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_vaccinations (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT        NOT NULL REFERENCES students(id),
    "vaccineId" TEXT        NOT NULL REFERENCES vaccine_types(id),
    status      TEXT        NOT NULL DEFAULT 'NOT_DONE',
    remarks     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("studentId", "vaccineId")
);

CREATE TABLE IF NOT EXISTS siblings_relatives (
    id                  TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId"         TEXT        NOT NULL REFERENCES students(id),
    "siblingName"       TEXT        NOT NULL,
    relationship        TEXT        NOT NULL,
    "currentClass"      TEXT,
    section             TEXT,
    "admissionNumber"   TEXT,
    "isCurrentStudent"  BOOLEAN     NOT NULL DEFAULT FALSE,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transport -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bus_routes (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "routeNo"   TEXT        NOT NULL,
    name        TEXT        NOT NULL,
    "isActive"  BOOLEAN     NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bus_stops (
    id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "routeId"    TEXT        NOT NULL REFERENCES bus_routes(id),
    "stopName"   TEXT        NOT NULL,
    stage        TEXT,
    "pickupTime" TEXT,
    "dropTime"   TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_requests (
    id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "admissionId" TEXT       NOT NULL UNIQUE REFERENCES admission_applications(id),
    required     BOOLEAN     NOT NULL DEFAULT FALSE,
    "routeId"    TEXT        REFERENCES bus_routes(id),
    "stopId"     TEXT        REFERENCES bus_stops(id),
    remarks      TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Documents -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_types (
    id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name         TEXT        NOT NULL UNIQUE,
    description  TEXT,
    "isRequired" BOOLEAN     NOT NULL DEFAULT FALSE,
    "isActive"   BOOLEAN     NOT NULL DEFAULT TRUE,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_documents (
    id                   TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId"          TEXT             NOT NULL REFERENCES students(id),
    "documentTypeId"     TEXT             NOT NULL REFERENCES document_types(id),
    status               "DocumentStatus" NOT NULL DEFAULT 'NOT_RECEIVED',
    "filePath"           TEXT,
    "originalFilename"   TEXT,
    "mimeType"           TEXT,
    "fileSizeBytes"      INT,
    "uploadedByUserId"   TEXT             REFERENCES staff_users(id),
    "verifiedByUserId"   TEXT,
    "verifiedAt"         TIMESTAMP(3),
    "rejectedAt"         TIMESTAMP(3),
    remarks              TEXT,
    "waiverReason"       TEXT,
    "createdAt"          TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fee_items (
    id              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name            TEXT         NOT NULL,
    description     TEXT,
    "defaultAmount" NUMERIC(10,2) NOT NULL DEFAULT 0,
    "isActive"      BOOLEAN      NOT NULL DEFAULT TRUE,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id              TEXT            PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "admissionId"   TEXT            NOT NULL REFERENCES admission_applications(id),
    "receiptNo"     TEXT            UNIQUE,
    "feeItemId"     TEXT            REFERENCES fee_items(id),
    "feeType"       TEXT            NOT NULL,
    amount          NUMERIC(10,2)   NOT NULL,
    "paymentMode"   "PaymentMode"   NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate"   TIMESTAMP(3),
    "collectedById" TEXT            REFERENCES staff_users(id),
    "chequeNo"      TEXT,
    "bankName"      TEXT,
    "upiRef"        TEXT,
    "waiverReason"  TEXT,
    remarks         TEXT,
    "createdAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sequences -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS number_sequences (
    id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sequenceType"   TEXT        NOT NULL,
    "academicYear"   TEXT        NOT NULL,
    "lastNumber"     INT         NOT NULL DEFAULT 0,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("sequenceType", "academicYear")
);

-- Audit & communication -------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "actorUserId" TEXT        REFERENCES staff_users(id),
    action        TEXT        NOT NULL,
    "entityType"  TEXT        NOT NULL,
    "entityId"    TEXT,
    "oldValue"    JSONB,
    "newValue"    JSONB,
    "ipAddress"   TEXT,
    "userAgent"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communication_logs (
    id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "entityType" TEXT        NOT NULL,
    "entityId"   TEXT        NOT NULL,
    channel      TEXT        NOT NULL,
    subject      TEXT,
    body         TEXT,
    "sentAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentByUser" TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key         TEXT        NOT NULL UNIQUE,
    value       TEXT        NOT NULL,
    label       TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Registrations
CREATE INDEX IF NOT EXISTS idx_reg_status         ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_reg_academic_year  ON registrations("academicYearId");
CREATE INDEX IF NOT EXISTS idx_reg_campus         ON registrations("campusId");
CREATE INDEX IF NOT EXISTS idx_reg_grade          ON registrations("gradeId");
CREATE INDEX IF NOT EXISTS idx_reg_student        ON registrations("studentId");
CREATE INDEX IF NOT EXISTS idx_reg_date           ON registrations("registrationDate" DESC);

-- Admissions
CREATE INDEX IF NOT EXISTS idx_adm_status         ON admission_applications(status);
CREATE INDEX IF NOT EXISTS idx_adm_academic_year  ON admission_applications("academicYearId");
CREATE INDEX IF NOT EXISTS idx_adm_campus         ON admission_applications("campusId");
CREATE INDEX IF NOT EXISTS idx_adm_grade          ON admission_applications("gradeId");
CREATE INDEX IF NOT EXISTS idx_adm_student        ON admission_applications("studentId");
CREATE INDEX IF NOT EXISTS idx_adm_registration   ON admission_applications("registrationId");
CREATE INDEX IF NOT EXISTS idx_adm_confirmed_at   ON admission_applications("confirmedAt" DESC);

-- Payments
CREATE INDEX IF NOT EXISTS idx_pay_admission      ON payments("admissionId");
CREATE INDEX IF NOT EXISTS idx_pay_status         ON payments("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_pay_date           ON payments("paymentDate" DESC);

-- Documents
CREATE INDEX IF NOT EXISTS idx_doc_student        ON student_documents("studentId");
CREATE INDEX IF NOT EXISTS idx_doc_status         ON student_documents(status);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_actor        ON audit_logs("actorUserId");
CREATE INDEX IF NOT EXISTS idx_audit_entity       ON audit_logs("entityType", "entityId");
CREATE INDEX IF NOT EXISTS idx_audit_created      ON audit_logs("createdAt" DESC);

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_registration_summary AS
SELECT
    r.id,
    r."registrationNo",
    r."studentName",
    r."dateOfBirth",
    r.gender,
    g.name  AS grade,
    ay.label AS academic_year,
    c.name  AS campus,
    r.status,
    r."registrationDate",
    es.name AS enquiry_source,
    r."specialSupport"
FROM registrations r
JOIN grades g               ON r."gradeId"          = g.id
JOIN academic_years ay      ON r."academicYearId"   = ay.id
JOIN campuses c             ON r."campusId"          = c.id
LEFT JOIN enquiry_sources es ON r."enquirySourceId" = es.id;

CREATE OR REPLACE VIEW v_admission_summary AS
SELECT
    aa.id,
    aa."admissionNo",
    s."fullNameEn" AS student_name,
    s."dateOfBirth",
    s.gender,
    g.name  AS grade,
    ay.label AS academic_year,
    c.name  AS campus,
    aa.status,
    aa."confirmedAt"
FROM admission_applications aa
JOIN students s        ON aa."studentId"      = s.id
JOIN grades g          ON aa."gradeId"        = g.id
JOIN academic_years ay ON aa."academicYearId" = ay.id
JOIN campuses c        ON aa."campusId"       = c.id;

CREATE OR REPLACE VIEW v_seat_availability AS
SELECT
    g.name  AS grade,
    c.name  AS campus,
    ay.label AS academic_year,
    gsc."totalSeats",
    COUNT(aa.id) FILTER (WHERE aa.status = 'CONFIRMED') AS admitted,
    gsc."totalSeats" - COUNT(aa.id) FILTER (WHERE aa.status = 'CONFIRMED') AS available
FROM grade_seat_capacity gsc
JOIN grades g          ON gsc."gradeId"        = g.id
JOIN campuses c        ON gsc."campusId"       = c.id
JOIN academic_years ay ON gsc."academicYearId" = ay.id
LEFT JOIN admission_applications aa
    ON  aa."gradeId"        = gsc."gradeId"
    AND aa."campusId"       = gsc."campusId"
    AND aa."academicYearId" = gsc."academicYearId"
GROUP BY g.name, c.name, ay.label, gsc."totalSeats";

CREATE OR REPLACE VIEW v_fee_pending AS
SELECT
    s."fullNameEn" AS student_name,
    g.name AS grade,
    p."feeType",
    p.amount,
    p."paymentStatus"
FROM payments p
JOIN admission_applications aa ON p."admissionId"  = aa.id
JOIN students s                ON aa."studentId"   = s.id
JOIN grades g                  ON aa."gradeId"     = g.id
WHERE p."paymentStatus" IN ('PENDING', 'PARTIAL');

CREATE OR REPLACE VIEW v_pending_documents AS
SELECT
    s."fullNameEn" AS student_name,
    dt.name AS document_type,
    dt."isRequired",
    sd.status
FROM student_documents sd
JOIN students s      ON sd."studentId"       = s.id
JOIN document_types dt ON sd."documentTypeId" = dt.id
WHERE sd.status IN ('NOT_RECEIVED', 'UPLOADED');

CREATE OR REPLACE VIEW v_source_wise_enquiries AS
SELECT
    COALESCE(es.name, 'Unknown') AS source,
    COUNT(r.id) AS total
FROM registrations r
LEFT JOIN enquiry_sources es ON r."enquirySourceId" = es.id
GROUP BY es.name;

-- ---------------------------------------------------------------------------
-- Seed Data  (ON CONFLICT … DO NOTHING makes every INSERT idempotent)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    v_school_id       TEXT := 'seed-school-main';
    v_campus_id       TEXT := 'seed-campus-main';
    v_ay_id           TEXT := 'seed-ay-2026-27';
    v_grade_prekg     TEXT := 'seed-grade-prekg';
    v_grade_lkg       TEXT := 'seed-grade-lkg';
    v_grade_ukg       TEXT := 'seed-grade-ukg';
    v_grade_g1        TEXT := 'seed-grade-1';
    v_grade_g2        TEXT := 'seed-grade-2';
    v_role_sysadmin   TEXT := 'seed-role-sysadmin';
    v_role_vp         TEXT := 'seed-role-vp';
    v_role_adm        TEXT := 'seed-role-adm';
    v_role_cashier    TEXT := 'seed-role-cashier';
    v_role_docverify  TEXT := 'seed-role-docverify';
    v_role_transport  TEXT := 'seed-role-transport';
    v_role_readonly   TEXT := 'seed-role-readonly';
    v_admin_id        TEXT := 'seed-staff-admin';
BEGIN

    -- School
    INSERT INTO schools (id, name, address, phone, email)
    VALUES (v_school_id, 'Junior School', NULL, NULL, NULL)
    ON CONFLICT (id) DO NOTHING;

    -- Campus
    INSERT INTO campuses (id, "schoolId", name, "isActive")
    VALUES (v_campus_id, v_school_id, 'Main Campus', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Academic Year 2026-27
    INSERT INTO academic_years (id, label, "startYear", "endYear", "isActive", "isCurrent")
    VALUES (v_ay_id, '2026-27', 2026, 2027, TRUE, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Grades
    INSERT INTO grades (id, name, "sortOrder", "isActive") VALUES
        (v_grade_prekg, 'Pre-KG',  1, TRUE),
        (v_grade_lkg,   'LKG',     2, TRUE),
        (v_grade_ukg,   'UKG',     3, TRUE),
        (v_grade_g1,    'Grade 1', 4, TRUE),
        (v_grade_g2,    'Grade 2', 5, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Seat capacity: 40 per grade for the default campus + academic year
    INSERT INTO grade_seat_capacity ("academicYearId", "gradeId", "campusId", "totalSeats")
    VALUES
        (v_ay_id, v_grade_prekg, v_campus_id, 40),
        (v_ay_id, v_grade_lkg,   v_campus_id, 40),
        (v_ay_id, v_grade_ukg,   v_campus_id, 40),
        (v_ay_id, v_grade_g1,    v_campus_id, 40),
        (v_ay_id, v_grade_g2,    v_campus_id, 40)
    ON CONFLICT ("academicYearId", "gradeId", "campusId") DO NOTHING;

    -- Roles
    INSERT INTO roles (id, name, description) VALUES
        (v_role_sysadmin,  'SYSTEM_ADMIN',          'Full system access including user management'),
        (v_role_vp,        'VICE_PRINCIPAL',         'School administration oversight'),
        (v_role_adm,       'ADMISSION_STAFF',        'Manage registrations and admissions'),
        (v_role_cashier,   'CASHIER',                'Record and manage fee payments'),
        (v_role_docverify, 'DOCUMENT_VERIFIER',      'Verify and manage student documents'),
        (v_role_transport, 'TRANSPORT_STAFF',        'Manage transport requests and routes'),
        (v_role_readonly,  'READ_ONLY_MANAGEMENT',   'View-only access to all reports')
    ON CONFLICT (id) DO NOTHING;

    -- Admin user  (password: Admin@12345, cost 12, $2a$ from pgcrypto — compatible with bcryptjs)
    INSERT INTO staff_users (id, username, "passwordHash", "fullName", "isActive", "mustChangePassword")
    VALUES (
        v_admin_id,
        'admin',
        crypt('Admin@12345', gen_salt('bf', 12)),
        'System Administrator',
        TRUE,
        TRUE
    )
    ON CONFLICT (username) DO NOTHING;

    -- Assign SYSTEM_ADMIN role to admin
    INSERT INTO staff_user_roles ("staffUserId", "roleId")
    VALUES (v_admin_id, v_role_sysadmin)
    ON CONFLICT ("staffUserId", "roleId") DO NOTHING;

    -- Enquiry Sources
    INSERT INTO enquiry_sources (name, type, "isActive") VALUES
        ('Flyer / Pamphlet',   'FLYER',        TRUE),
        ('Parent Referral',    'PARENTS',       TRUE),
        ('Sibling Reference',  'SIBLINGS',      TRUE),
        ('Walk-in',            'SELF',          TRUE),
        ('Social Media',       'SOCIAL_MEDIA',  TRUE),
        ('School Website',     'WEBSITE',       TRUE),
        ('Word of Mouth',      'WORD_OF_MOUTH', TRUE),
        ('Other',              'OTHER',         TRUE)
    ON CONFLICT (name) DO NOTHING;

    -- Document Types
    INSERT INTO document_types (name, description, "isRequired", "isActive") VALUES
        ('Birth Certificate',       'Original birth certificate',            TRUE,  TRUE),
        ('Aadhaar Card',            'Child Aadhaar card copy',               TRUE,  TRUE),
        ('Previous School TC',      'Transfer certificate from prior school', FALSE, TRUE),
        ('Passport Size Photos',    '4 recent passport-size photographs',    TRUE,  TRUE),
        ('Address Proof',           'Current residence proof',               TRUE,  TRUE),
        ('Caste Certificate',       'Community / caste certificate',         FALSE, TRUE),
        ('Medical Certificate',     'Fitness certificate from a doctor',     FALSE, TRUE)
    ON CONFLICT (name) DO NOTHING;

    -- Vaccine Types
    INSERT INTO vaccine_types (name, "isActive") VALUES
        ('BCG',                    TRUE),
        ('DTP / Pentavalent',      TRUE),
        ('Polio (OPV)',            TRUE),
        ('Measles / MMR',          TRUE),
        ('Hepatitis B',            TRUE)
    ON CONFLICT (name) DO NOTHING;

    -- Fee Items
    INSERT INTO fee_items (name, description, "defaultAmount", "isActive") VALUES
        ('Registration Fee',     'One-time registration fee',           500.00,  TRUE),
        ('Admission Fee',        'One-time admission processing fee',  2000.00,  TRUE),
        ('Annual Tuition Fee',   'Annual tuition charges',            15000.00,  TRUE),
        ('Term Fee',             'Per-term fee',                       5000.00,  TRUE),
        ('Transport Fee',        'Annual bus transport fee',           8000.00,  TRUE),
        ('Miscellaneous',        'Other charges',                         0.00,  TRUE)
    ON CONFLICT DO NOTHING;

    -- App Settings
    INSERT INTO app_settings (key, value, label) VALUES
        ('school_name',           'Junior School', 'School Display Name'),
        ('current_academic_year', '2026-27',       'Current Academic Year Label'),
        ('max_file_size_mb',      '5',             'Max Upload File Size (MB)')
    ON CONFLICT (key) DO NOTHING;

END $$;

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification query — run after the script to confirm setup
-- ---------------------------------------------------------------------------
-- SELECT
--     (SELECT COUNT(*) FROM schools)         AS schools,
--     (SELECT COUNT(*) FROM campuses)        AS campuses,
--     (SELECT COUNT(*) FROM academic_years)  AS academic_years,
--     (SELECT COUNT(*) FROM grades)          AS grades,
--     (SELECT COUNT(*) FROM roles)           AS roles,
--     (SELECT COUNT(*) FROM staff_users)     AS staff_users,
--     (SELECT COUNT(*) FROM enquiry_sources) AS enquiry_sources,
--     (SELECT COUNT(*) FROM document_types)  AS document_types,
--     (SELECT COUNT(*) FROM vaccine_types)   AS vaccine_types,
--     (SELECT COUNT(*) FROM fee_items)       AS fee_items,
--     (SELECT COUNT(*) FROM app_settings)    AS app_settings;
