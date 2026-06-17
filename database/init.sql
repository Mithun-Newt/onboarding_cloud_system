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
    'SYSTEM_ADMIN','TIC','ADMISSION_STAFF','CASHIER',
    'TRANSPORT_STAFF','READ_ONLY_MANAGEMENT'
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


-- ---------------------------------------------------------------------------
-- Tables (Generated from Prisma Schema)
-- ---------------------------------------------------------------------------
-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_seat_capacity" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_seat_capacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_user_roles" (
    "id" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "annualIncome" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "education" TEXT,
    "occupation" TEXT,
    "annualIncome" DECIMAL(12,2),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "familyId" TEXT,
    "fullNameEn" TEXT NOT NULL,
    "fullNameTa" TEXT,
    "givenName" TEXT,
    "surname" TEXT,
    "givenNameTa" TEXT,
    "surnameTa" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "bloodGroup" TEXT,
    "religion" TEXT,
    "community" TEXT,
    "category" TEXT,
    "motherTongue" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "emisNumber" TEXT,
    "aadhaarNo" TEXT,
    "address1" TEXT,
    "address1Ta" TEXT,
    "address2" TEXT,
    "address2Ta" TEXT,
    "city" TEXT,
    "cityTa" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "photoPath" TEXT,
    "referredStudentType" TEXT,
    "referredStudentName" TEXT,
    "referredStudentGrade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EnquirySourceType" NOT NULL DEFAULT 'OTHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "fatherName" TEXT,
    "fatherMobile" TEXT,
    "motherName" TEXT,
    "motherMobile" TEXT,
    "primaryContact" TEXT,
    "prevSchoolName" TEXT,
    "address1" TEXT,
    "address1Ta" TEXT,
    "address2" TEXT,
    "address2Ta" TEXT,
    "city" TEXT,
    "cityTa" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "enquirySourceId" TEXT,
    "parentRemarks" TEXT,
    "specialSupport" BOOLEAN NOT NULL DEFAULT false,
    "specialDetails" TEXT,
    "staffRemarks" TEXT,
    "ageRelaxation" BOOLEAN NOT NULL DEFAULT false,
    "referredStudentType" TEXT,
    "referredStudentName" TEXT,
    "referredStudentGrade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_applications" (
    "id" TEXT NOT NULL,
    "admissionNo" TEXT,
    "registrationId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "confirmedAt" TIMESTAMP(3),
    "confirmedByUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_status_history" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "fromStatus" "AdmissionStatus",
    "toStatus" "AdmissionStatus" NOT NULL,
    "changedByUser" TEXT,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "previous_school_details" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "schoolName" TEXT,
    "schoolAddress" TEXT,
    "lastClassPassed" TEXT,
    "prevAcademicYear" TEXT,
    "tcNumber" TEXT,
    "awards" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "previous_school_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_medical_profiles" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "walkingStatus" TEXT,
    "speechStatus" TEXT,
    "hasAllergies" BOOLEAN NOT NULL DEFAULT false,
    "allergyDetails" TEXT,
    "healthIssues" TEXT,
    "needsMedication" BOOLEAN NOT NULL DEFAULT false,
    "medicationDetails" TEXT,
    "specialAttention" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_medical_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vaccine_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_vaccinations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "vaccineId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_DONE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siblings_relatives" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "siblingName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "currentClass" TEXT,
    "section" TEXT,
    "admissionNumber" TEXT,
    "isCurrentStudent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siblings_relatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_routes" (
    "id" TEXT NOT NULL,
    "routeNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bus_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_stops" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopName" TEXT NOT NULL,
    "stage" TEXT,
    "pickupTime" TEXT,
    "dropTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distance" TEXT,

    CONSTRAINT "bus_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_requests" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "routeId" TEXT,
    "stopId" TEXT,
    "busNo" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_documents" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'NOT_RECEIVED',
    "filePath" TEXT,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "uploadedByUserId" TEXT,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "waiverReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "receiptNo" TEXT,
    "feeItemId" TEXT,
    "feeType" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "collectedById" TEXT,
    "chequeNo" TEXT,
    "bankName" TEXT,
    "upiRef" TEXT,
    "waiverReason" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" TEXT NOT NULL,
    "sequenceType" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentByUser" TEXT,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_strengths" (
    "id" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "promotedStrength" INTEGER NOT NULL DEFAULT 0,
    "tc" INTEGER NOT NULL DEFAULT 0,
    "newAdmission" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "academicYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohort_strengths_pkey" PRIMARY KEY ("id")
);


-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
-- CreateIndex
CREATE UNIQUE INDEX "academic_years_label_key" ON "academic_years"("label");

-- CreateIndex
CREATE UNIQUE INDEX "grades_name_key" ON "grades"("name");

-- CreateIndex
CREATE UNIQUE INDEX "grade_seat_capacity_academicYearId_gradeId_campusId_key" ON "grade_seat_capacity"("academicYearId", "gradeId", "campusId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_username_key" ON "staff_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_roles_staffUserId_roleId_key" ON "staff_user_roles"("staffUserId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "enquiry_sources_name_key" ON "enquiry_sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_registrationNo_key" ON "registrations"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_admissionNo_key" ON "admission_applications"("admissionNo");

-- CreateIndex
CREATE UNIQUE INDEX "previous_school_details_admissionId_key" ON "previous_school_details"("admissionId");

-- CreateIndex
CREATE UNIQUE INDEX "student_medical_profiles_studentId_key" ON "student_medical_profiles"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "vaccine_types_name_key" ON "vaccine_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "student_vaccinations_studentId_vaccineId_key" ON "student_vaccinations"("studentId", "vaccineId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_requests_admissionId_key" ON "transport_requests"("admissionId");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receiptNo_key" ON "payments"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_sequenceType_academicYear_key" ON "number_sequences"("sequenceType", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_strengths_className_academicYearId_key" ON "cohort_strengths"("className", "academicYearId");


-- ---------------------------------------------------------------------------
-- Foreign Key Constraints
-- ---------------------------------------------------------------------------
-- AddForeignKey
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_seat_capacity" ADD CONSTRAINT "grade_seat_capacity_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_seat_capacity" ADD CONSTRAINT "grade_seat_capacity_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_seat_capacity" ADD CONSTRAINT "grade_seat_capacity_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_user_roles" ADD CONSTRAINT "staff_user_roles_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_user_roles" ADD CONSTRAINT "staff_user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_enquirySourceId_fkey" FOREIGN KEY ("enquirySourceId") REFERENCES "enquiry_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_status_history" ADD CONSTRAINT "admission_status_history_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admission_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previous_school_details" ADD CONSTRAINT "previous_school_details_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admission_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_medical_profiles" ADD CONSTRAINT "student_medical_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_vaccinations" ADD CONSTRAINT "student_vaccinations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_vaccinations" ADD CONSTRAINT "student_vaccinations_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccine_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siblings_relatives" ADD CONSTRAINT "siblings_relatives_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_stops" ADD CONSTRAINT "bus_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "bus_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admission_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "bus_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "bus_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admission_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_feeItemId_fkey" FOREIGN KEY ("feeItemId") REFERENCES "fee_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_strengths" ADD CONSTRAINT "cohort_strengths_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;



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
WHERE sd.status IN ('NOT_RECEIVED', 'UPLOADED', 'REJECTED');

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
    v_school_id       TEXT := 'school-default';
    v_campus_id       TEXT := 'campus-main';
    v_ay_id           TEXT := 'seed-ay-2026-27';
    v_grade_prekg     TEXT := 'seed-grade-prekg';
    v_grade_lkg       TEXT := 'seed-grade-lkg';
    v_grade_ukg       TEXT := 'seed-grade-ukg';
    v_grade_g1_yaazh  TEXT := 'seed-grade-1-yaazh';
    v_grade_g1_acs    TEXT := 'seed-grade-1-acs';
    v_grade_g2_yv     TEXT := 'seed-grade-2-yaazh-veenai';
    v_grade_g2_acs    TEXT := 'seed-grade-2-acs';
    v_role_sysadmin   TEXT := 'seed-role-sysadmin';
    v_role_tic        TEXT := 'seed-role-tic';
    v_role_adm        TEXT := 'seed-role-adm';
    v_role_cashier    TEXT := 'seed-role-cashier';
    v_role_transport  TEXT := 'seed-role-transport';
    v_role_readonly   TEXT := 'seed-role-readonly';
    v_admin_id        TEXT := 'seed-staff-admin';
BEGIN

    -- School
    INSERT INTO schools (id, name, address, phone, email, "updatedAt")
    VALUES (v_school_id, 'Appu Arivaalayem', NULL, NULL, NULL, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;

    -- Campus
    INSERT INTO campuses (id, "schoolId", name, "isActive", "updatedAt")
    VALUES (v_campus_id, v_school_id, 'JSC', TRUE, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;

    -- Academic Year 2026-27
    INSERT INTO academic_years (id, label, "startYear", "endYear", "isActive", "isCurrent", "updatedAt")
    VALUES (v_ay_id, '2026-27', 2026, 2027, TRUE, TRUE, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;

    -- Grades
    INSERT INTO grades (id, name, "sortOrder", "isActive", "updatedAt") VALUES
        (v_grade_prekg,    'KG 1 (PRE-KG)',            1, TRUE, CURRENT_TIMESTAMP),
        (v_grade_lkg,      'KG 2 (JKG)',               2, TRUE, CURRENT_TIMESTAMP),
        (v_grade_ukg,      'KG 3 (SKG)',               3, TRUE, CURRENT_TIMESTAMP),
        (v_grade_g1_yaazh, 'Grade 1 - YAAZH',          4, TRUE, CURRENT_TIMESTAMP),
        (v_grade_g1_acs,   'Grade 1 (ACS)',            5, TRUE, CURRENT_TIMESTAMP),
        (v_grade_g2_yv,    'Grade 2 (YAAZH & VEENAI)', 6, TRUE, CURRENT_TIMESTAMP),
        (v_grade_g2_acs,   'Grade 2 (ACS)',            7, TRUE, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;

    -- Seat capacity: 40 per grade for the default campus + academic year
    INSERT INTO grade_seat_capacity (id, "academicYearId", "gradeId", "campusId", "totalSeats", "updatedAt")
    VALUES
        (gen_random_uuid()::text, v_ay_id, v_grade_prekg,    v_campus_id, 40, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_lkg,      v_campus_id, 40, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_ukg,      v_campus_id, 40, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_g1_yaazh, v_campus_id, 40, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_g1_acs,   v_campus_id, 40, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_g2_yv,    v_campus_id, 40, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_g2_acs,   v_campus_id, 40, CURRENT_TIMESTAMP)
    ON CONFLICT ("academicYearId", "gradeId", "campusId") DO NOTHING;

    -- Roles
    INSERT INTO roles (id, name, description) VALUES
        (v_role_sysadmin,  'SYSTEM_ADMIN',          'Full system access including user management'),
        (v_role_tic,       'TIC',                   'Teacher In Charge oversight'),
        (v_role_adm,       'ADMISSION_STAFF',        'Manage registrations and admissions'),
        (v_role_cashier,   'CASHIER',                'Record and manage fee payments'),
        (v_role_transport, 'TRANSPORT_STAFF',        'Manage transport requests and routes'),
        (v_role_readonly,  'READ_ONLY_MANAGEMENT',   'View-only access to all reports')
    ON CONFLICT (id) DO NOTHING;

    -- Admin user  (password: Admin@12345, cost 12, $2a$ from pgcrypto — compatible with bcryptjs)
    INSERT INTO staff_users (id, username, "passwordHash", "fullName", "isActive", "mustChangePassword", "updatedAt")
    VALUES (
        v_admin_id,
        'admin',
        crypt('Admin@12345', gen_salt('bf', 12)),
        'System Administrator',
        TRUE,
        TRUE,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (username) DO NOTHING;

    -- Assign SYSTEM_ADMIN role to admin
    INSERT INTO staff_user_roles (id, "staffUserId", "roleId")
    VALUES (gen_random_uuid()::text, v_admin_id, v_role_sysadmin)
    ON CONFLICT ("staffUserId", "roleId") DO NOTHING;

    -- Enquiry Sources
    INSERT INTO enquiry_sources (id, name, type, "isActive") VALUES
        (gen_random_uuid()::text, 'Flyer / Pamphlet',   'FLYER',        TRUE),
        (gen_random_uuid()::text, 'Parent Referral',    'PARENTS',       TRUE),
        (gen_random_uuid()::text, 'Sibling Reference',  'SIBLINGS',      TRUE),
        (gen_random_uuid()::text, 'Walk-in',            'SELF',          TRUE),
        (gen_random_uuid()::text, 'Social Media',       'SOCIAL_MEDIA',  TRUE),
        (gen_random_uuid()::text, 'School Website',     'WEBSITE',       TRUE),
        (gen_random_uuid()::text, 'Word of Mouth',      'WORD_OF_MOUTH', TRUE),
        (gen_random_uuid()::text, 'Other',              'OTHER',         TRUE)
    ON CONFLICT (name) DO NOTHING;

    -- Document Types
    INSERT INTO document_types (id, name, description, "isRequired", "isActive") VALUES
        (gen_random_uuid()::text, 'Birth Certificate',       'Original birth certificate',            TRUE,  TRUE),
        (gen_random_uuid()::text, 'Aadhaar Card',            'Child Aadhaar card copy',               TRUE,  TRUE),
        (gen_random_uuid()::text, 'Previous School TC',      'Transfer certificate from prior school', FALSE, TRUE),
        (gen_random_uuid()::text, 'Passport Size Photos',    '4 recent passport-size photographs',    TRUE,  TRUE),
        (gen_random_uuid()::text, 'Address Proof',           'Current residence proof',               TRUE,  TRUE),
        (gen_random_uuid()::text, 'Caste Certificate',       'Community / caste certificate',         FALSE, TRUE),
        (gen_random_uuid()::text, 'Medical Certificate',     'Fitness certificate from a doctor',     FALSE, TRUE)
    ON CONFLICT (name) DO NOTHING;

    -- Vaccine Types
    INSERT INTO vaccine_types (id, name, "isActive") VALUES
        (gen_random_uuid()::text, 'BCG',                    TRUE),
        (gen_random_uuid()::text, 'DTP / Pentavalent',      TRUE),
        (gen_random_uuid()::text, 'Polio (OPV)',            TRUE),
        (gen_random_uuid()::text, 'Measles / MMR',          TRUE),
        (gen_random_uuid()::text, 'Hepatitis B',            TRUE)
    ON CONFLICT (name) DO NOTHING;

    -- Fee Items
    INSERT INTO fee_items (id, name, description, "defaultAmount", "isActive") VALUES
        (gen_random_uuid()::text, 'Registration Fee',     'One-time registration fee',           500.00,  TRUE),
        (gen_random_uuid()::text, 'Admission Fee',        'One-time admission processing fee',  2000.00,  TRUE),
        (gen_random_uuid()::text, 'Annual Tuition Fee',   'Annual tuition charges',            15000.00,  TRUE),
        (gen_random_uuid()::text, 'Term Fee',             'Per-term fee',                       5000.00,  TRUE),
        (gen_random_uuid()::text, 'Transport Fee',        'Annual bus transport fee',           8000.00,  TRUE),
        (gen_random_uuid()::text, 'Miscellaneous',        'Other charges',                         0.00,  TRUE)
    ON CONFLICT DO NOTHING;

    -- App Settings
    INSERT INTO app_settings (id, key, value, label, "updatedAt") VALUES
        (gen_random_uuid()::text, 'school_name',           'Appu Arivaalayem', 'School Display Name', CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'current_academic_year', '2026-27',       'Current Academic Year Label', CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'max_file_size_mb',      '5',             'Max Upload File Size (MB)', CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO NOTHING;

    -- Cohort Strengths
    INSERT INTO cohort_strengths (id, "className", "promotedStrength", tc, "newAdmission", target, "sortOrder", "academicYearId", "updatedAt")
    VALUES
        (gen_random_uuid()::text, 'KG 1 (PRE-KG)',            0,  0, 47, 60, 1, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'KG 2 (JKG)',               34, 1, 36, 70, 2, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'KG 3 (SKG)',               50, 6, 10, 70, 3, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 1 - YAAZH',          45, 0, 2,  35, 4, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 1 (ACS)',            29, 0, 1,  30, 5, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 2 (YAAZH & VEENAI)', 49, 0, 11, 70, 6, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 2 (ACS)',            28, 1, 0,  30, 7, v_ay_id, CURRENT_TIMESTAMP)
    ON CONFLICT ("className", "academicYearId") DO NOTHING;

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