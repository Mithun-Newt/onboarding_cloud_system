-- =============================================================================
-- Junior School Admissions & Onboarding System
-- Database Initialization Script — PostgreSQL 14+
--
-- Usage:
--   psql -U <user> -d <database> -f database/init.sql
--
-- This script is idempotent: safe to run on an existing database.
-- It creates all enums, tables, indexes, views, and seeds reference data.
--
-- Default admin credentials after seeding:
--   Username : admin
--   Password : Admin@12345   (mustChangePassword = true — change on first login)
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
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campuses (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    school_id   TEXT        NOT NULL REFERENCES schools(id),
    name        TEXT        NOT NULL,
    address     TEXT,
    phone       TEXT,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_years (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    label       TEXT        NOT NULL UNIQUE,
    start_year  INT         NOT NULL,
    end_year    INT         NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT FALSE,
    is_current  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grades (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        TEXT        NOT NULL UNIQUE,
    sort_order  INT         NOT NULL DEFAULT 0,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grade_seat_capacity (
    id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    academic_year_id TEXT        NOT NULL REFERENCES academic_years(id),
    grade_id         TEXT        NOT NULL REFERENCES grades(id),
    campus_id        TEXT        NOT NULL REFERENCES campuses(id),
    total_seats      INT         NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (academic_year_id, grade_id, campus_id)
);

-- Staff & auth ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        "RoleName"  NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_users (
    id                   TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username             TEXT        NOT NULL UNIQUE,
    email                TEXT        UNIQUE,
    password_hash        TEXT        NOT NULL,
    full_name            TEXT        NOT NULL,
    phone                TEXT,
    is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN     NOT NULL DEFAULT TRUE,
    last_login_at        TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_user_roles (
    id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    staff_user_id TEXT        NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
    role_id       TEXT        NOT NULL REFERENCES roles(id),
    assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (staff_user_id, role_id)
);

-- Students & families ---------------------------------------------------

CREATE TABLE IF NOT EXISTS families (
    id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guardians (
    id             TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    family_id      TEXT         NOT NULL REFERENCES families(id),
    relationship   TEXT         NOT NULL,
    full_name      TEXT         NOT NULL,
    mobile         TEXT,
    email          TEXT,
    education      TEXT,
    occupation     TEXT,
    annual_income  NUMERIC(12,2),
    is_primary     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    family_id      TEXT        REFERENCES families(id),
    full_name_en   TEXT        NOT NULL,
    full_name_ta   TEXT,
    given_name     TEXT,
    surname        TEXT,
    date_of_birth  TIMESTAMPTZ NOT NULL,
    gender         "Gender"    NOT NULL,
    blood_group    TEXT,
    religion       TEXT,
    community      TEXT,
    category       TEXT,
    mother_tongue  TEXT,
    nationality    TEXT        NOT NULL DEFAULT 'Indian',
    emis_number    TEXT,
    aadhaar_last4  TEXT,
    address1       TEXT,
    address2       TEXT,
    city           TEXT,
    state          TEXT,
    pin_code       TEXT,
    photo_path     TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Registration ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS enquiry_sources (
    id         TEXT                 PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name       TEXT                 NOT NULL UNIQUE,
    type       "EnquirySourceType"  NOT NULL DEFAULT 'OTHER',
    is_active  BOOLEAN              NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
    id               TEXT                 PRIMARY KEY DEFAULT gen_random_uuid()::text,
    registration_no  TEXT                 NOT NULL UNIQUE,
    academic_year_id TEXT                 NOT NULL REFERENCES academic_years(id),
    campus_id        TEXT                 NOT NULL REFERENCES campuses(id),
    grade_id         TEXT                 NOT NULL REFERENCES grades(id),
    registration_date TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    status           "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    student_id       TEXT                 REFERENCES students(id),
    student_name     TEXT                 NOT NULL,
    date_of_birth    TIMESTAMPTZ          NOT NULL,
    gender           "Gender"             NOT NULL,
    father_name      TEXT,
    father_mobile    TEXT,
    mother_name      TEXT,
    mother_mobile    TEXT,
    primary_contact  TEXT,
    prev_school_name TEXT,
    address1         TEXT,
    address2         TEXT,
    city             TEXT,
    state            TEXT,
    pin_code         TEXT,
    enquiry_source_id TEXT               REFERENCES enquiry_sources(id),
    special_support  BOOLEAN             NOT NULL DEFAULT FALSE,
    special_details  TEXT,
    staff_remarks    TEXT,
    created_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Admissions ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admission_applications (
    id                   TEXT              PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_no         TEXT              UNIQUE,
    registration_id      TEXT              NOT NULL REFERENCES registrations(id),
    academic_year_id     TEXT              NOT NULL REFERENCES academic_years(id),
    campus_id            TEXT              NOT NULL REFERENCES campuses(id),
    grade_id             TEXT              NOT NULL REFERENCES grades(id),
    student_id           TEXT              NOT NULL REFERENCES students(id),
    status               "AdmissionStatus" NOT NULL DEFAULT 'DRAFT',
    confirmed_at         TIMESTAMPTZ,
    confirmed_by_user_id TEXT              REFERENCES staff_users(id),
    cancelled_at         TIMESTAMPTZ,
    cancellation_reason  TEXT,
    created_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admission_status_history (
    id               TEXT              PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_id     TEXT              NOT NULL REFERENCES admission_applications(id),
    from_status      "AdmissionStatus",
    to_status        "AdmissionStatus" NOT NULL,
    changed_by_user  TEXT              REFERENCES staff_users(id),
    reason           TEXT,
    changed_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS previous_school_details (
    id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_id      TEXT        NOT NULL UNIQUE REFERENCES admission_applications(id),
    school_name       TEXT,
    school_address    TEXT,
    last_class_passed TEXT,
    prev_academic_year TEXT,
    tc_number         TEXT,
    awards            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medical & vaccination -------------------------------------------------

CREATE TABLE IF NOT EXISTS student_medical_profiles (
    id                  TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id          TEXT        NOT NULL UNIQUE REFERENCES students(id),
    walking_status      TEXT,
    speech_status       TEXT,
    has_allergies       BOOLEAN     NOT NULL DEFAULT FALSE,
    allergy_details     TEXT,
    health_issues       TEXT,
    needs_medication    BOOLEAN     NOT NULL DEFAULT FALSE,
    medication_details  TEXT,
    special_attention   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaccine_types (
    id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name       TEXT        NOT NULL UNIQUE,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_vaccinations (
    id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT        NOT NULL REFERENCES students(id),
    vaccine_id TEXT        NOT NULL REFERENCES vaccine_types(id),
    status     TEXT        NOT NULL DEFAULT 'NOT_DONE',
    remarks    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, vaccine_id)
);

CREATE TABLE IF NOT EXISTS siblings_relatives (
    id                 TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id         TEXT        NOT NULL REFERENCES students(id),
    sibling_name       TEXT        NOT NULL,
    relationship       TEXT        NOT NULL,
    current_class      TEXT,
    section            TEXT,
    admission_number   TEXT,
    is_current_student BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transport -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bus_routes (
    id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    route_no   TEXT        NOT NULL,
    name       TEXT        NOT NULL,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_stops (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    route_id    TEXT        NOT NULL REFERENCES bus_routes(id),
    stop_name   TEXT        NOT NULL,
    stage       TEXT,
    pickup_time TEXT,
    drop_time   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transport_requests (
    id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_id TEXT        NOT NULL UNIQUE REFERENCES admission_applications(id),
    required     BOOLEAN     NOT NULL DEFAULT FALSE,
    route_id     TEXT        REFERENCES bus_routes(id),
    stop_id      TEXT        REFERENCES bus_stops(id),
    remarks      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_types (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        TEXT        NOT NULL UNIQUE,
    description TEXT,
    is_required BOOLEAN     NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_documents (
    id                   TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id           TEXT             NOT NULL REFERENCES students(id),
    document_type_id     TEXT             NOT NULL REFERENCES document_types(id),
    status               "DocumentStatus" NOT NULL DEFAULT 'NOT_RECEIVED',
    file_path            TEXT,
    original_filename    TEXT,
    mime_type            TEXT,
    file_size_bytes      INT,
    uploaded_by_user_id  TEXT             REFERENCES staff_users(id),
    verified_by_user_id  TEXT             REFERENCES staff_users(id),
    verified_at          TIMESTAMPTZ,
    rejected_at          TIMESTAMPTZ,
    remarks              TEXT,
    waiver_reason        TEXT,
    created_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Payments --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fee_items (
    id             TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name           TEXT         NOT NULL,
    description    TEXT,
    default_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id             TEXT            PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_id   TEXT            NOT NULL REFERENCES admission_applications(id),
    receipt_no     TEXT            UNIQUE,
    fee_item_id    TEXT            REFERENCES fee_items(id),
    fee_type       TEXT            NOT NULL,
    amount         NUMERIC(10,2)   NOT NULL,
    payment_mode   "PaymentMode"   NOT NULL,
    payment_status "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    payment_date   TIMESTAMPTZ,
    collected_by_id TEXT           REFERENCES staff_users(id),
    cheque_no      TEXT,
    bank_name      TEXT,
    upi_ref        TEXT,
    waiver_reason  TEXT,
    remarks        TEXT,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Sequences -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS number_sequences (
    id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sequence_type TEXT        NOT NULL,
    academic_year TEXT        NOT NULL,
    last_number   INT         NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sequence_type, academic_year)
);

-- Audit & communication -------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    actor_user_id TEXT        REFERENCES staff_users(id),
    action        TEXT        NOT NULL,
    entity_type   TEXT        NOT NULL,
    entity_id     TEXT,
    old_value     JSONB,
    new_value     JSONB,
    ip_address    TEXT,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_logs (
    id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    entity_type  TEXT        NOT NULL,
    entity_id    TEXT        NOT NULL,
    channel      TEXT        NOT NULL,
    subject      TEXT,
    body         TEXT,
    sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_by_user TEXT        REFERENCES staff_users(id)
);

CREATE TABLE IF NOT EXISTS app_settings (
    id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key        TEXT        NOT NULL UNIQUE,
    value      TEXT        NOT NULL,
    label      TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Registrations
CREATE INDEX IF NOT EXISTS idx_reg_status         ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_reg_academic_year  ON registrations(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_reg_campus         ON registrations(campus_id);
CREATE INDEX IF NOT EXISTS idx_reg_grade          ON registrations(grade_id);
CREATE INDEX IF NOT EXISTS idx_reg_student        ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_reg_date           ON registrations(registration_date DESC);

-- Admissions
CREATE INDEX IF NOT EXISTS idx_adm_status         ON admission_applications(status);
CREATE INDEX IF NOT EXISTS idx_adm_academic_year  ON admission_applications(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_adm_campus         ON admission_applications(campus_id);
CREATE INDEX IF NOT EXISTS idx_adm_grade          ON admission_applications(grade_id);
CREATE INDEX IF NOT EXISTS idx_adm_student        ON admission_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_adm_registration   ON admission_applications(registration_id);
CREATE INDEX IF NOT EXISTS idx_adm_confirmed_at   ON admission_applications(confirmed_at DESC);

-- Payments
CREATE INDEX IF NOT EXISTS idx_pay_admission      ON payments(admission_id);
CREATE INDEX IF NOT EXISTS idx_pay_status         ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_pay_date           ON payments(payment_date DESC);

-- Documents
CREATE INDEX IF NOT EXISTS idx_doc_student        ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_doc_status         ON student_documents(status);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_actor        ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity       ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created      ON audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_registration_summary AS
SELECT
    r.id,
    r.registration_no,
    r.student_name,
    r.date_of_birth,
    r.gender,
    g.name  AS grade,
    ay.label AS academic_year,
    c.name  AS campus,
    r.status,
    r.registration_date,
    es.name AS enquiry_source,
    r.special_support
FROM registrations r
JOIN grades g               ON r.grade_id          = g.id
JOIN academic_years ay      ON r.academic_year_id   = ay.id
JOIN campuses c             ON r.campus_id          = c.id
LEFT JOIN enquiry_sources es ON r.enquiry_source_id = es.id;

CREATE OR REPLACE VIEW v_admission_summary AS
SELECT
    aa.id,
    aa.admission_no,
    s.full_name_en AS student_name,
    s.date_of_birth,
    s.gender,
    g.name  AS grade,
    ay.label AS academic_year,
    c.name  AS campus,
    aa.status,
    aa.confirmed_at
FROM admission_applications aa
JOIN students s        ON aa.student_id      = s.id
JOIN grades g          ON aa.grade_id        = g.id
JOIN academic_years ay ON aa.academic_year_id = ay.id
JOIN campuses c        ON aa.campus_id       = c.id;

CREATE OR REPLACE VIEW v_seat_availability AS
SELECT
    g.name  AS grade,
    c.name  AS campus,
    ay.label AS academic_year,
    gsc.total_seats,
    COUNT(aa.id) FILTER (WHERE aa.status = 'CONFIRMED') AS admitted,
    gsc.total_seats - COUNT(aa.id) FILTER (WHERE aa.status = 'CONFIRMED') AS available
FROM grade_seat_capacity gsc
JOIN grades g          ON gsc.grade_id        = g.id
JOIN campuses c        ON gsc.campus_id       = c.id
JOIN academic_years ay ON gsc.academic_year_id = ay.id
LEFT JOIN admission_applications aa
    ON  aa.grade_id        = gsc.grade_id
    AND aa.campus_id       = gsc.campus_id
    AND aa.academic_year_id = gsc.academic_year_id
GROUP BY g.name, c.name, ay.label, gsc.total_seats;

CREATE OR REPLACE VIEW v_fee_pending AS
SELECT
    s.full_name_en AS student_name,
    g.name AS grade,
    p.fee_type,
    p.amount,
    p.payment_status
FROM payments p
JOIN admission_applications aa ON p.admission_id  = aa.id
JOIN students s                ON aa.student_id   = s.id
JOIN grades g                  ON aa.grade_id     = g.id
WHERE p.payment_status IN ('PENDING', 'PARTIAL');

CREATE OR REPLACE VIEW v_pending_documents AS
SELECT
    s.full_name_en AS student_name,
    dt.name AS document_type,
    dt.is_required,
    sd.status
FROM student_documents sd
JOIN students s      ON sd.student_id       = s.id
JOIN document_types dt ON sd.document_type_id = dt.id
WHERE sd.status IN ('NOT_RECEIVED', 'UPLOADED');

CREATE OR REPLACE VIEW v_source_wise_enquiries AS
SELECT
    COALESCE(es.name, 'Unknown') AS source,
    COUNT(r.id) AS total
FROM registrations r
LEFT JOIN enquiry_sources es ON r.enquiry_source_id = es.id
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
    INSERT INTO campuses (id, school_id, name, is_active)
    VALUES (v_campus_id, v_school_id, 'Main Campus', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Academic Year 2026-27
    INSERT INTO academic_years (id, label, start_year, end_year, is_active, is_current)
    VALUES (v_ay_id, '2026-27', 2026, 2027, TRUE, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Grades
    INSERT INTO grades (id, name, sort_order, is_active) VALUES
        (v_grade_prekg, 'Pre-KG',  1, TRUE),
        (v_grade_lkg,   'LKG',     2, TRUE),
        (v_grade_ukg,   'UKG',     3, TRUE),
        (v_grade_g1,    'Grade 1', 4, TRUE),
        (v_grade_g2,    'Grade 2', 5, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Seat capacity: 40 per grade for the default campus + academic year
    INSERT INTO grade_seat_capacity (academic_year_id, grade_id, campus_id, total_seats)
    VALUES
        (v_ay_id, v_grade_prekg, v_campus_id, 40),
        (v_ay_id, v_grade_lkg,   v_campus_id, 40),
        (v_ay_id, v_grade_ukg,   v_campus_id, 40),
        (v_ay_id, v_grade_g1,    v_campus_id, 40),
        (v_ay_id, v_grade_g2,    v_campus_id, 40)
    ON CONFLICT (academic_year_id, grade_id, campus_id) DO NOTHING;

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

    -- Admin user  (password: Admin@12345, cost 12, $2a$ from pgcrypto — verified by bcryptjs)
    INSERT INTO staff_users (id, username, password_hash, full_name, is_active, must_change_password)
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
    INSERT INTO staff_user_roles (staff_user_id, role_id)
    VALUES (v_admin_id, v_role_sysadmin)
    ON CONFLICT (staff_user_id, role_id) DO NOTHING;

    -- Enquiry Sources
    INSERT INTO enquiry_sources (name, type, is_active) VALUES
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
    INSERT INTO document_types (name, description, is_required, is_active) VALUES
        ('Birth Certificate',       'Original birth certificate',            TRUE,  TRUE),
        ('Aadhaar Card',            'Child Aadhaar card copy',               TRUE,  TRUE),
        ('Previous School TC',      'Transfer certificate from prior school', FALSE, TRUE),
        ('Passport Size Photos',    '4 recent passport-size photographs',    TRUE,  TRUE),
        ('Address Proof',           'Current residence proof',               TRUE,  TRUE),
        ('Caste Certificate',       'Community / caste certificate',         FALSE, TRUE),
        ('Medical Certificate',     'Fitness certificate from a doctor',     FALSE, TRUE)
    ON CONFLICT (name) DO NOTHING;

    -- Vaccine Types
    INSERT INTO vaccine_types (name, is_active) VALUES
        ('BCG',                    TRUE),
        ('DTP / Pentavalent',      TRUE),
        ('Polio (OPV)',            TRUE),
        ('Measles / MMR',          TRUE),
        ('Hepatitis B',            TRUE)
    ON CONFLICT (name) DO NOTHING;

    -- Fee Items
    INSERT INTO fee_items (name, description, default_amount, is_active) VALUES
        ('Registration Fee',     'One-time registration fee',           500.00,  TRUE),
        ('Admission Fee',        'One-time admission processing fee',  2000.00,  TRUE),
        ('Annual Tuition Fee',   'Annual tuition charges',            15000.00,  TRUE),
        ('Term Fee',             'Per-term fee',                       5000.00,  TRUE),
        ('Transport Fee',        'Annual bus transport fee',           8000.00,  TRUE),
        ('Miscellaneous',        'Other charges',                         0.00,  TRUE)
    ON CONFLICT DO NOTHING;

    -- App Settings
    INSERT INTO app_settings (key, value, label) VALUES
        ('school_name',         'Junior School',          'School Display Name'),
        ('current_academic_year', '2026-27',              'Current Academic Year Label'),
        ('max_file_size_mb',    '5',                      'Max Upload File Size (MB)')
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
