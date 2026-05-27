-- ============================================================
-- Junior School Admissions & Onboarding System
-- Database Schema Reference (PostgreSQL)
--
-- This file is a REFERENCE only — it lists table definitions
-- and views for documentation purposes.
--
-- To initialize a real database, use:
--   database/init.sql
-- That script creates all objects, indexes, views AND seeds
-- the required reference data in a single idempotent transaction.
-- ============================================================

-- ENUMS
CREATE TYPE "RoleName" AS ENUM (
  'SYSTEM_ADMIN','TIC','ADMISSION_STAFF','CASHIER',
  'TRANSPORT_STAFF','READ_ONLY_MANAGEMENT'
);
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED','ADMISSION_STARTED','ADMITTED','CANCELLED');
CREATE TYPE "AdmissionStatus" AS ENUM ('DRAFT','CONFIRMED','CANCELLED');
CREATE TYPE "DocumentStatus" AS ENUM ('NOT_RECEIVED','UPLOADED','VERIFIED','REJECTED','WAIVED');
CREATE TYPE "PaymentMode" AS ENUM ('CASH','CARD','UPI','BANK_TRANSFER','CHEQUE','WAIVER');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING','PARTIAL','PAID','WAIVED','CANCELLED');
CREATE TYPE "Gender" AS ENUM ('MALE','FEMALE','OTHER');
CREATE TYPE "EnquirySourceType" AS ENUM (
  'FLYER','PARENTS','SIBLINGS','SELF','SOCIAL_MEDIA','WEBSITE','WORD_OF_MOUTH','OTHER'
);

-- SCHOOLS & CAMPUSES
CREATE TABLE schools (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campuses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    school_id TEXT NOT NULL REFERENCES schools(id),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACADEMIC YEARS & GRADES
CREATE TABLE academic_years (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    label TEXT UNIQUE NOT NULL,
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grades (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grade_seat_capacity (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
    grade_id TEXT NOT NULL REFERENCES grades(id),
    campus_id TEXT NOT NULL REFERENCES campuses(id),
    total_seats INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (academic_year_id, grade_id, campus_id)
);

-- STAFF & AUTH
CREATE TABLE roles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name "RoleName" UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff_user_roles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    staff_user_id TEXT NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (staff_user_id, role_id)
);

-- STUDENTS & FAMILIES
CREATE TABLE families (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guardians (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    family_id TEXT NOT NULL REFERENCES families(id),
    relationship TEXT NOT NULL,
    full_name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    education TEXT,
    occupation TEXT,
    annual_income NUMERIC(12,2),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    family_id TEXT REFERENCES families(id),
    full_name_en TEXT NOT NULL,
    full_name_ta TEXT,
    given_name TEXT,
    surname TEXT,
    date_of_birth TIMESTAMPTZ NOT NULL,
    gender "Gender" NOT NULL,
    blood_group TEXT,
    religion TEXT,
    community TEXT,
    category TEXT,
    mother_tongue TEXT,
    nationality TEXT DEFAULT 'Indian',
    emis_number TEXT,
    aadhaar_last4 TEXT,
    address1 TEXT,
    address2 TEXT,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    photo_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REGISTRATIONS
CREATE TABLE enquiry_sources (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    type "EnquirySourceType" DEFAULT 'OTHER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE registrations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    registration_no TEXT UNIQUE NOT NULL,
    academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
    campus_id TEXT NOT NULL REFERENCES campuses(id),
    grade_id TEXT NOT NULL REFERENCES grades(id),
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    status "RegistrationStatus" DEFAULT 'REGISTERED',
    student_id TEXT REFERENCES students(id),
    student_name TEXT NOT NULL,
    date_of_birth TIMESTAMPTZ NOT NULL,
    gender "Gender" NOT NULL,
    father_name TEXT,
    father_mobile TEXT,
    mother_name TEXT,
    mother_mobile TEXT,
    primary_contact TEXT,
    prev_school_name TEXT,
    address1 TEXT,
    address2 TEXT,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    enquiry_source_id TEXT REFERENCES enquiry_sources(id),
    special_support BOOLEAN DEFAULT FALSE,
    special_details TEXT,
    staff_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMISSIONS
CREATE TABLE admission_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_no TEXT UNIQUE,
    registration_id TEXT NOT NULL REFERENCES registrations(id),
    academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
    campus_id TEXT NOT NULL REFERENCES campuses(id),
    grade_id TEXT NOT NULL REFERENCES grades(id),
    student_id TEXT NOT NULL REFERENCES students(id),
    status "AdmissionStatus" DEFAULT 'DRAFT',
    confirmed_at TIMESTAMPTZ,
    confirmed_by_user_id TEXT REFERENCES staff_users(id),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admission_status_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_id TEXT NOT NULL REFERENCES admission_applications(id),
    from_status "AdmissionStatus",
    to_status "AdmissionStatus" NOT NULL,
    changed_by_user TEXT REFERENCES staff_users(id),
    reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE previous_school_details (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_id TEXT UNIQUE NOT NULL REFERENCES admission_applications(id),
    school_name TEXT,
    school_address TEXT,
    last_class_passed TEXT,
    prev_academic_year TEXT,
    tc_number TEXT,
    awards TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEDICAL
CREATE TABLE student_medical_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT UNIQUE NOT NULL REFERENCES students(id),
    walking_status TEXT,
    speech_status TEXT,
    has_allergies BOOLEAN DEFAULT FALSE,
    allergy_details TEXT,
    health_issues TEXT,
    needs_medication BOOLEAN DEFAULT FALSE,
    medication_details TEXT,
    special_attention TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vaccine_types (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_vaccinations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL REFERENCES students(id),
    vaccine_id TEXT NOT NULL REFERENCES vaccine_types(id),
    status TEXT DEFAULT 'NOT_DONE',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, vaccine_id)
);

CREATE TABLE siblings_relatives (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL REFERENCES students(id),
    sibling_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    current_class TEXT,
    section TEXT,
    admission_number TEXT,
    is_current_student BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSPORT
CREATE TABLE bus_routes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    route_no TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bus_stops (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    route_id TEXT NOT NULL REFERENCES bus_routes(id),
    stop_name TEXT NOT NULL,
    stage TEXT,
    pickup_time TEXT,
    drop_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transport_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_id TEXT UNIQUE NOT NULL REFERENCES admission_applications(id),
    required BOOLEAN DEFAULT FALSE,
    route_id TEXT REFERENCES bus_routes(id),
    stop_id TEXT REFERENCES bus_stops(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE document_types (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_documents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL REFERENCES students(id),
    document_type_id TEXT NOT NULL REFERENCES document_types(id),
    status "DocumentStatus" DEFAULT 'NOT_RECEIVED',
    file_path TEXT,
    original_filename TEXT,
    mime_type TEXT,
    file_size_bytes INT,
    uploaded_by_user_id TEXT REFERENCES staff_users(id),
    verified_by_user_id TEXT REFERENCES staff_users(id),
    verified_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    remarks TEXT,
    waiver_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE fee_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    default_amount NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admission_id TEXT NOT NULL REFERENCES admission_applications(id),
    receipt_no TEXT UNIQUE,
    fee_item_id TEXT REFERENCES fee_items(id),
    fee_type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_mode "PaymentMode" NOT NULL,
    payment_status "PaymentStatus" DEFAULT 'PENDING',
    payment_date TIMESTAMPTZ,
    collected_by_id TEXT REFERENCES staff_users(id),
    cheque_no TEXT,
    bank_name TEXT,
    upi_ref TEXT,
    waiver_reason TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEQUENCES
CREATE TABLE number_sequences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sequence_type TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    last_number INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (sequence_type, academic_year)
);

-- AUDIT & COMMUNICATION
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    actor_user_id TEXT REFERENCES staff_users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE communication_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    sent_by_user TEXT REFERENCES staff_users(id)
);

CREATE TABLE app_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    label TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_registration_summary AS
SELECT
    r.registration_no,
    r.student_name,
    r.date_of_birth,
    r.gender,
    g.name AS grade,
    ay.label AS academic_year,
    c.name AS campus,
    r.status,
    r.registration_date,
    es.name AS enquiry_source,
    r.special_support
FROM registrations r
JOIN grades g ON r.grade_id = g.id
JOIN academic_years ay ON r.academic_year_id = ay.id
JOIN campuses c ON r.campus_id = c.id
LEFT JOIN enquiry_sources es ON r.enquiry_source_id = es.id;

CREATE OR REPLACE VIEW v_admission_summary AS
SELECT
    aa.admission_no,
    s.full_name_en AS student_name,
    s.date_of_birth,
    s.gender,
    g.name AS grade,
    ay.label AS academic_year,
    c.name AS campus,
    aa.status,
    aa.confirmed_at
FROM admission_applications aa
JOIN students s ON aa.student_id = s.id
JOIN grades g ON aa.grade_id = g.id
JOIN academic_years ay ON aa.academic_year_id = ay.id
JOIN campuses c ON aa.campus_id = c.id;

CREATE OR REPLACE VIEW v_seat_availability AS
SELECT
    g.name AS grade,
    c.name AS campus,
    ay.label AS academic_year,
    gsc.total_seats,
    COUNT(aa.id) FILTER (WHERE aa.status = 'CONFIRMED') AS admitted,
    gsc.total_seats - COUNT(aa.id) FILTER (WHERE aa.status = 'CONFIRMED') AS available
FROM grade_seat_capacity gsc
JOIN grades g ON gsc.grade_id = g.id
JOIN campuses c ON gsc.campus_id = c.id
JOIN academic_years ay ON gsc.academic_year_id = ay.id
LEFT JOIN admission_applications aa
    ON aa.grade_id = gsc.grade_id
    AND aa.campus_id = gsc.campus_id
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
JOIN admission_applications aa ON p.admission_id = aa.id
JOIN students s ON aa.student_id = s.id
JOIN grades g ON aa.grade_id = g.id
WHERE p.payment_status IN ('PENDING', 'PARTIAL');

CREATE OR REPLACE VIEW v_pending_documents AS
SELECT
    s.full_name_en AS student_name,
    dt.name AS document_type,
    dt.is_required,
    sd.status
FROM student_documents sd
JOIN students s ON sd.student_id = s.id
JOIN document_types dt ON sd.document_type_id = dt.id
WHERE sd.status IN ('NOT_RECEIVED', 'UPLOADED', 'REJECTED');

CREATE OR REPLACE VIEW v_source_wise_enquiries AS
SELECT
    COALESCE(es.name, 'Unknown') AS source,
    COUNT(r.id) AS count
FROM registrations r
LEFT JOIN enquiry_sources es ON r.enquiry_source_id = es.id
GROUP BY es.name;
