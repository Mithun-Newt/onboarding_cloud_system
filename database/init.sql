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
    VALUES (v_school_id, 'Appu Arivaalayam', NULL, NULL, NULL, CURRENT_TIMESTAMP)
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
        (v_grade_0, 'KG 1 (PRE-KG)', 1, TRUE, CURRENT_TIMESTAMP),
        (v_grade_1, 'KG 2 (JKG)', 2, TRUE, CURRENT_TIMESTAMP),
        (v_grade_2, 'KG 3 (SKG)', 3, TRUE, CURRENT_TIMESTAMP),
        (v_grade_3, 'Grade 1 - YAAZH', 4, TRUE, CURRENT_TIMESTAMP),
        (v_grade_4, 'Grade 1 (ACS)', 5, TRUE, CURRENT_TIMESTAMP),
        (v_grade_5, 'Grade 2 (YAAZH & VEENAI)', 6, TRUE, CURRENT_TIMESTAMP),
        (v_grade_6, 'Grade 2 (ACS)', 7, TRUE, CURRENT_TIMESTAMP),
        (v_grade_7, 'Grade 3', 8, TRUE, CURRENT_TIMESTAMP),
        (v_grade_8, 'Grade 3 (ACS)', 9, TRUE, CURRENT_TIMESTAMP),
        (v_grade_9, 'Grade 4', 10, TRUE, CURRENT_TIMESTAMP),
        (v_grade_10, 'Grade 4 (ACS)', 11, TRUE, CURRENT_TIMESTAMP),
        (v_grade_11, 'Grade 5 Yaazh', 12, TRUE, CURRENT_TIMESTAMP),
        (v_grade_12, 'Grade 5 (ACS)', 13, TRUE, CURRENT_TIMESTAMP),
        (v_grade_13, 'Grade 6', 14, TRUE, CURRENT_TIMESTAMP),
        (v_grade_14, 'Grade 7', 15, TRUE, CURRENT_TIMESTAMP),
        (v_grade_15, 'Grade 8', 16, TRUE, CURRENT_TIMESTAMP),
        (v_grade_16, 'Grade 9', 17, TRUE, CURRENT_TIMESTAMP),
        (v_grade_17, 'Grade 10', 18, TRUE, CURRENT_TIMESTAMP),
        (v_grade_18, 'Grade 11', 19, TRUE, CURRENT_TIMESTAMP),
        (v_grade_19, '12 Bio/Math', 20, TRUE, CURRENT_TIMESTAMP),
        (v_grade_20, '12 Math / CS', 21, TRUE, CURRENT_TIMESTAMP),
        (v_grade_21, '12 Arts', 22, TRUE, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;

    -- Seat capacity: 40 per grade for the default campus + academic year
    INSERT INTO grade_seat_capacity (id, "academicYearId", "gradeId", "campusId", "totalSeats", "updatedAt")
    VALUES
        (gen_random_uuid()::text, v_ay_id, v_grade_0, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_1, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_2, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_3, v_campus_id, 35, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_4, v_campus_id, 30, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_5, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_6, v_campus_id, 30, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_7, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_8, v_campus_id, 30, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_9, v_campus_id, 35, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_10, v_campus_id, 30, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_11, v_campus_id, 35, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_12, v_campus_id, 30, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_13, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_14, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_15, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_16, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_17, v_campus_id, 70, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_18, v_campus_id, 60, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_19, v_campus_id, 19, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_20, v_campus_id, 18, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, v_ay_id, v_grade_21, v_campus_id, 3, CURRENT_TIMESTAMP)
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
        (gen_random_uuid()::text, 'school_name',           'Appu Arivaalayam', 'School Display Name', CURRENT_TIMESTAMP),
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



DO $$ BEGIN
    -- ---------------------------------------------------------------------------
    -- Bus Routes (Stages)
    -- ---------------------------------------------------------------------------
    INSERT INTO bus_routes (id, "routeNo", name, "isActive") VALUES
        ('298bd402-16b9-5abd-b6d0-f169738dbfa3', 'STAGE_1', 'Stage 1', TRUE),
        ('a212fb93-4887-56a8-a516-a40c48a30630', 'STAGE_2', 'Stage 2', TRUE),
        ('13bd296f-afcf-5c02-98ef-7dd294762ea5', 'STAGE_3', 'Stage 3', TRUE),
        ('e86daab4-fb8b-5d34-9e3c-c2dac1a81699', 'STAGE_4', 'Stage 4', TRUE),
        ('0f2f38dd-9cb2-5aa0-9103-fb46553375f8', 'STAGE_5', 'Stage 5', TRUE),
        ('d97787d9-a86e-5c5f-a84a-dc334afc2a2a', 'STAGE_6', 'Stage 6', TRUE),
        ('538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', 'STAGE_7', 'Stage 7', TRUE),
        ('b9a479d1-d249-566a-b1b8-67979dd1be84', 'STAGE_8', 'Stage 8', TRUE),
        ('3f06de48-b419-50a5-925b-5a41600ba7a3', 'STAGE_9', 'Stage 9', TRUE)
    ON CONFLICT ("id") DO NOTHING;


    -- Bus Stops
    INSERT INTO bus_stops (id, "routeId", "stopName", stage, distance) VALUES
        ('960566cf-197c-56a2-9b3b-f97f4995f333', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 லட்சுமி நகர்', '1', '1.74'),
        ('3a0ef0bc-8c03-5a8b-8ee8-fb9ffe8d417d', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 ஸ்ரீமஹால்', '1', '1.66'),
        ('8a98010f-6c44-5d5a-bd09-2d39b48c0aa9', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 தோட்டக்காடு', '1', '1.91'),
        ('0ef00752-b55a-54cc-a53f-480546163211', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 மாடர்ன்வேபிரிட்ஜ்', '1', '1.73'),
        ('9927e756-c761-5da5-8c50-f971fee46f05', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 மடத்தூர்', '1', '1.99'),
        ('7fcf2125-9ee6-5ceb-9eb4-3e95c5791619', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம் அரசுப்பள்ளி-2', '1', '1.93'),
        ('c7b785d1-9d75-5222-882f-1ffae5b485e0', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம் அரசுப்பள்ளி-1', '1', '1.93'),
        ('bde70f81-e7f4-57bc-b2a0-252b3b3186d3', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 சிமெண்ட் கடை', '1', '1.79'),
        ('6e4391af-8e6a-55ef-8d25-f21fba473603', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 பச்சாங்காட்டு பிரிவு', '1', '1.74'),
        ('fd4f5aeb-fe34-5a60-bd09-6b541ceffa21', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 காட்டூர்-6', '1', '2'),
        ('c8f31880-3598-5105-b188-87b8e5984ef4', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 காட்டூர்-7', '1', '1.7'),
        ('45622376-8f19-5a8d-bd88-6b3d4afd833d', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 காட்டூர்-8', '1', '1.2'),
        ('6fdbafcf-1f57-513b-9aab-a331fb2bf9d7', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம்-மொரம்புக்காடு-1', '1', '1.8'),
        ('e8d3e633-c934-59e8-866b-efb153ed2c14', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம்-மொரம்புக்காடு-2', '1', '1.7'),
        ('792daaff-7d0e-5999-8673-fbb67e90d0b8', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம்-மொரம்புக்காடு-3', '1', '1.6'),
        ('0e294ea1-bb1c-5592-a0c6-cc54254f8f40', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம்-ஸ்டேட் பேங்க்', '1', '1.2'),
        ('d8782ff9-e572-5eca-aef7-260db615863b', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம் பேக்கரி', '1', '1'),
        ('660c5b15-6654-5a5c-b5c4-1bf6f89d56fe', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 மேட்டுக்காடு டேங்க்', '1', '1.92'),
        ('78508d2d-adb8-5f6a-b7c3-6c23c744d354', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 குண்டுருசம்பாளையம்', '1', '1.19'),
        ('9700843c-1079-5cb2-9e44-27d8af48fb99', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 எண்ணெய் மண்டி-2', '1', '1.76'),
        ('102ea46b-7ebd-579c-bfdd-a76cc315fd70', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 பைபாஸ்-1', '1', '1.85'),
        ('59a00439-22e9-52ad-b30d-007aabf903a7', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 பைபாஸ்-2', '1', '1.85'),
        ('e185f860-4c5b-5815-b8f5-fbfb5afff6a8', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 பைபாஸ்-3', '1', '1.85'),
        ('772fa8ac-1f3d-5872-a67f-966b96cad8c0', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 பைபாஸ்-4', '1', '1.85'),
        ('b2fad1de-7c52-5563-9bd5-d28c8afcdaf9', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 வைகுந்தம் ரோடு', '1', '1.59'),
        ('223ef446-edd9-59c4-b08c-93be44e74b4e', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம் பஸ் ஸ்டாப்-1', '1', '1.28'),
        ('2f684eba-ed9b-5550-a78f-88f8762d6966', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம் பஸ் ஸ்டாப்-2', '1', '1.28'),
        ('f32853fd-a73f-5765-a3b3-30f18682d40c', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 சாந்தி சில்க் ஹவுஸ்', '1', '1.07'),
        ('ca7eb83e-2545-5eef-bd75-d70a90be39d5', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 ரெங்கபாளையம்-1', '1', '1.02'),
        ('8b939c08-2e40-589b-8451-2f6b0a3370c6', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 ரெங்கபாளையம்-2', '1', '1.02'),
        ('5a798fdd-7adc-5817-9e5e-9811c6be3c1a', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 ரங்கம்பாளையம்-1', '1', '1.23'),
        ('24f4f48f-a063-5849-bee6-aa5b41499ef2', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 ரங்கம்பாளையம்-2', '1', '1.05'),
        ('2450f6ee-18b0-52d4-9ed2-0b6b86788301', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 ரங்கம்பாளையம்-3', '1', '1.02'),
        ('96a3fa25-f354-5b8e-8708-ecc0d1303ea9', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 மோரி வளவு', '1', '1.23'),
        ('b272d034-c376-5297-8551-919f7461eb73', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 பாலாஜி பர்னிச்சர்', '1', '1.54'),
        ('4d9f0a35-524d-5350-bad9-79dba631cd7f', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 ரெட்டிப்பட்டி பார்க்', '1', '1.78'),
        ('33c259d7-898b-5212-86eb-2068d930f416', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 ரெட்டிப்பட்டி', '1', '1.78'),
        ('a654b2a3-a80e-5741-8f32-d6a55c427d68', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 வைகுந்தம் பிரிவு ரோடு', '1', '1.69'),
        ('6f4f6f26-f084-57f0-a2ce-975dc22de237', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம்-அரசுப்பள்ளி-1', '1', '1.98'),
        ('43c728af-357e-56c2-a87d-e77f0e7949bf', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம்-அரசுப்பள்ளி-2', '1', '1.98'),
        ('01245204-61a2-503b-a8b6-1ac359a3e73e', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 ரங்கம்பாளையம்', '1', '1'),
        ('bc8c7614-aa36-5d53-ae46-d200436ece0b', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 பெரிய மாரியம்மன் கோவில் பிரிவு', '1', '1.45'),
        ('a0cc0f50-200c-5720-9a16-44ca70464cdc', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கே.எஸ்.நகர்-1', '1', '1.71'),
        ('e18bdf05-aaa6-58ad-8fb0-0a175376b8a7', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கே.எஸ்.நகர்-2', '1', '1.65'),
        ('35dd8691-55ae-5c2f-a5e5-b23bb42e0f13', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம் காவல் நிலையம்', '1', '1.65'),
        ('c6668c98-028b-5959-a1bc-90e078924c6e', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 பச்சாங்காடு பிரிவு', '1', '1.72'),
        ('490f2f5a-e108-5a2a-bbb5-7510f1432f1a', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம் அரசு பள்ளி', '1', '1.98'),
        ('3bf6369d-d0c0-57f5-9c7b-12ca366e4036', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 கொங்கணாபுரம்', '1', '1.31'),
        ('fac2eeb1-329d-5958-a51f-7c787e8e5957', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 சின்ன மாரியம்மன் கோவில்', '1', '1.45'),
        ('defdd491-8512-5554-b233-1d47b07aea02', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 குண்டரசம்பாளையம்', '1', '0.4'),
        ('4a63a1d4-42d5-5aa4-8f83-ee405804511e', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 குண்டரசம்பாளையம் முள்ளிக்காடு', '1', '0.4'),
        ('d7f7673b-0fd8-51ff-805b-9c14a07958d5', '298bd402-16b9-5abd-b6d0-f169738dbfa3', '1 மோரிவளவு', '1', '1'),
        ('2be6f834-e632-5b77-ad0d-03db0711b42e', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஸ்ரீஅம்மன் நகர் பருத்தி மில்', '2', '3.4'),
        ('81a417ec-098b-5ba0-abfd-ef75d51d197a', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 மட்டம்பட்டி', '2', '3.58'),
        ('1d86e8e1-9b36-5571-a24d-a19be6cdb9e7', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 வேல்முருகன் மில்', '2', '3.55'),
        ('b07da3e2-dca2-5ff4-bd0a-c64d2a592dfe', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 எருமைப்பட்டி பிரிவு', '2', '3.55'),
        ('6286e723-c520-5da2-a462-87b56a6d6661', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 முத்துசாமி மில்', '2', '3.75'),
        ('d9778c79-c9a0-5677-a9d3-b772c3d5a3d1', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஒடுவங்காட்டுவளவு', '2', '3.8'),
        ('0a0372cd-f026-5d73-8f95-a513c14b4117', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஆனைக்காட்டூர்தென்னைமரம்', '2', '2.72'),
        ('5f672679-beb3-5297-a534-e3d298844979', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கட்டியனூர்', '2', '2.88'),
        ('6b3bb2ee-7558-5f34-a03b-a699fd5e7919', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கோரக்குட்டப்பட்டி', '2', '3.32'),
        ('d0d8efc8-6b6c-59af-b862-1053d89949a8', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 அய்யம்பாளையம்', '2', '3.66'),
        ('96fd4721-cb5a-5869-9f12-3ed26851994d', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 தொண்டிபாளையம்', '2', '3.95'),
        ('dcd2ba6b-c2e4-5b42-a5a3-084891350d90', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 மசக்குமாரபாளையம்', '2', '3.75'),
        ('9cf44c0d-0d6c-5571-9192-ce66eb4fb202', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஆயில் மில்', '2', '2.82'),
        ('142bb484-27dd-5c75-9dbf-0a4fae1f6f33', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 வெள்ளக்கல்பட்டி-1', '2', '3.85'),
        ('2fb6026c-743b-563d-9703-1458dc8d8b6d', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 வெள்ளக்கல்பட்டி-2', '2', '3.97'),
        ('89f7ab53-1573-55cc-a5a0-79b9566fee2f', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 வெள்ளக்கல்பட்டி பால் சென்டர்', '2', '3.81'),
        ('a0de8a12-2dd2-59c7-b561-4326ac7c3d7d', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 மாரியம்மன் கோவில்-1', '2', '3.97'),
        ('28af4f3a-81ab-5f57-9bbb-c96c6e47e503', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 மாரியம்மன் கோவில்-2', '2', '3.97'),
        ('bed6c8db-fc7a-599f-8a40-a5a0b6439ec2', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 வெட்டுக்காடு', '2', '2.5'),
        ('56078871-1ec1-5051-bf3c-4aa143182145', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஆசாரி பட்டறை', '2', '4'),
        ('5b72a40b-c331-55d5-b0a8-a2459b54225b', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 அலகாபாத்வங்கி', '2', '3.74'),
        ('3c4e4959-2005-5e90-b8f3-0ae37648244d', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 சுண்ணாம்புசூலை', '2', '3.64'),
        ('7ed894e2-530e-5b86-ab56-43764155604b', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 நத்தக்காட்டூர்-1', '2', '3.41'),
        ('23906cee-c7c7-54b6-a333-8e6bc43628ee', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 நத்தக்காட்டூர்-2', '2', '2.99'),
        ('3c2e3fb2-43fa-5379-a9f2-5da06b146b8b', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 காட்டுவளவு', '2', '2.14'),
        ('194d95a5-096f-58ce-9a90-cbd8f7dfce0b', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 செக்காங்காடு-3', '2', '3.52'),
        ('e4b6d488-a037-5a56-885c-69d8ffcd09cc', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 செக்காங்காடு-2', '2', '3.63'),
        ('c9f0c972-089a-5ae4-918d-8d542f5b03e9', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 செக்காங்காடு-1', '2', '3.82'),
        ('129cbe4c-8d4f-5c52-8fec-b9502f5fb3ab', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 எருமைப்பட்டி ஊராட்சிநிலையம்', '2', '3.15'),
        ('77fb1cc4-6a10-56c7-859b-e457f15888d0', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 காவடிக்காரனூர் கோவில்', '2', '3.8'),
        ('4639285f-d291-58bd-a4ce-605ca8bc2441', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 சேலத்தான்காடு-1', '2', '3.5'),
        ('4cbbb3e6-7216-5789-9a43-e65f1992d35e', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 சேலத்தான்காடு-2', '2', '3.2'),
        ('5b64b163-ce7b-5983-a676-f84197286a37', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 சேலத்தான்காடு-3', '2', '3.2'),
        ('f5c3b518-efe1-582f-8252-7dd1e9d24dde', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 காட்டூர்-1', '2', '2.7'),
        ('22aaab7f-aa8b-5d16-9c5b-c0cd68969733', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 காட்டூர்-2', '2', '2.3'),
        ('24589ed8-0af1-5fbb-93e1-ff32a7ce4e1e', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 காட்டூர்-3', '2', '2.1'),
        ('1fd467f5-6cdb-5400-a3cd-510971b64937', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 காட்டூர்-4', '2', '2'),
        ('174b3584-5823-5362-90d6-2748950ac624', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 காட்டூர்-5', '2', '2.2'),
        ('124fbb9b-9672-5266-8be2-664341d3f0f7', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கொங்கணாபுரம்-குமரன்நகர்-2', '2', '2.2'),
        ('d8f230a8-42f8-5b80-8816-014a093e90b8', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கொங்கணாபுரம்-குமரன்நகர்-3', '2', '2.1'),
        ('b9ae1ec6-ea56-5566-9664-7724a71e1fed', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கல்கி கேஸ்குடோன்-1', '2', '3.24'),
        ('a17b9dcb-e813-59ef-9980-3a99a244ae17', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கல்கி கேஸ்குடோன்-2', '2', '3.24'),
        ('8bb5be79-9e42-5574-9e95-ca52dd160889', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 எட்டிமரத்தான் காடு', '2', '2.37'),
        ('acf7ba5b-8d00-514c-b654-c6842c36b1b8', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கெங்குப்பட்டி-1', '2', '2.61'),
        ('d526710c-c2b8-5ea8-98c3-eb445541633c', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 குறிக்கியான் காடு', '2', '2.51'),
        ('aedfe0a2-8834-5540-b18b-12c5c244b65d', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 தூங்கானூர்-1', '2', '3.29'),
        ('640a25ad-3009-56dd-9307-d8bb3643595e', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 தூங்கானூர்-2', '2', '2.84'),
        ('2f7fd7c7-9abd-56de-b385-d5cc2b7c1240', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 தூங்கானூர்-3', '2', '2.84'),
        ('351329a2-9782-594f-98a0-851de90de082', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 வெட்டுக்காடு ஈ.பி.ஆர்', '2', '3.97'),
        ('e08cfc6a-7584-5059-80cb-a7ee844b2fad', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 வெட்டுக்காடு பால்சென்டர்', '2', '3.95'),
        ('8917fb45-e78c-52ff-9ffa-de1e410eaed1', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 வெட்டுக்காடு பஸ்ஸ்டாப்', '2', '3.56'),
        ('85bd8f02-3e0c-58e2-9fe3-f9c435b20930', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கூலையங்காடு', '2', '3.04'),
        ('4a6f08fa-bc8a-565b-8387-6c8905de7f5d', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஆன்றபட்டியான்காடு -1', '2', '2.22'),
        ('9f89ea87-48ae-5d16-b15f-7e2500154ded', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஆன்றபட்டியான்காடு - 2', '2', '2.22'),
        ('63626377-64d2-5788-8c14-15a7c92040cb', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 பழனியாங்காடு', '2', '2.86'),
        ('5644c07d-3742-5a7d-b6f5-46e8d1dfb8e1', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கடவளவு', '2', '2.64'),
        ('4322bdec-3a33-5e2b-9e7d-ed0e26dce7b7', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 கீழ்க்கூத்தாடிபாளையம்', '2', '3.55'),
        ('2337814d-1eb9-59d4-8642-9d11d62c4059', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 தூங்கானூர்', '2', '2.91'),
        ('f5095435-e4ef-505d-b79f-86df73f9bd08', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 புதுக்காடு', '2', '2.31'),
        ('90666f6b-5ade-5979-a6a1-0d9bf3606534', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஆணைக்காடு மாரியம்மன் கோவில்', '2', '2.53'),
        ('aa69b9a5-139d-5ee9-91bf-4d7eb14bc243', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஆனைக்காடு', '2', '2.86'),
        ('e214cd18-f763-581c-9a21-1a9bb630c428', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஐயம்பாளையம்', '2', '3.67'),
        ('453b410c-5317-51fd-8e36-9729efcbcf7b', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 மூலப்பாதை-1', '2', '3.85'),
        ('4aed4ec0-763e-50b3-b676-312800e8f9f3', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 மூலப்பாதை-2', '2', '3.75'),
        ('143c10be-4d8a-5d37-81e3-6b949bfb986f', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஆசாரிப்பட்டறை-1', '2', '2.84'),
        ('c0e17df4-4554-5233-bfec-9f64e89cde9b', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 ஆசாரிப்பட்டறை-2', '2', '2.84'),
        ('23f1d3c4-2ca3-50cc-8448-4fc47397ded1', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 குமரன் நகர்-1', '2', '2.52'),
        ('4eafe2ae-e5ec-5ce5-8077-6d058315f63c', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 மொரம்புக்காடு - 1', '2', '2.27'),
        ('a17c0d14-03c9-56e8-a083-996ccc1ffc53', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 பாலிபெருமாள்கோவில்-1', '2', '4'),
        ('b993fb31-5518-5d35-b8a3-734d82f9e0cd', 'a212fb93-4887-56a8-a516-a40c48a30630', '2 பாலிபெருமாள்கோவில் - 2', '2', '4'),
        ('a953651b-deb4-573a-9480-429ec544b378', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பூவானூர் பங்க்', '3', '5.6'),
        ('0beeedc7-88ee-5e74-8f35-bd94b1c7d265', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 ஜோசியர்காடு', '3', '4.8'),
        ('27106e9f-42a3-5575-83ac-5d3729c82aed', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கன்னந்தேரி-1', '3', '4.6'),
        ('de1d38ee-49f9-51a7-a641-54d90409cd67', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கன்னந்தேரி-2', '3', '4.11'),
        ('29112ab9-74e5-5f03-9fe0-aac1de96722c', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கன்னந்தேரி-3', '3', '4.44'),
        ('c052731f-bd97-5e0d-8ac3-fd30d20a6e01', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கன்னந்தேரி-4', '3', '4.36'),
        ('06b7ad46-759a-543e-8e3e-0c73b8cc9e4a', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கன்னந்தேரி-5', '3', '4.22'),
        ('a22adb50-ceb1-5284-9c48-69bf2b1d18ac', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பாலிக்காடு', '3', '5.5'),
        ('ca93f34e-f60a-5b3f-9502-d5b0bac5be2e', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 நாயக்கன் வளவு பிரிவு', '3', '5.3'),
        ('fd7f21ec-1115-52db-90a7-cf78ae1e63ad', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கூத்தாடிபாளையம் (மேலே-1)', '3', '5.15'),
        ('09933da8-c098-5e55-bf07-fcca339626ec', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கூத்தாடிபாளையம்', '3', '4.3'),
        ('91426e71-44d3-5325-b6f9-310c5b1057a2', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கூத்தாடிபாளையம் (பஸ் ஸ்டாப்)', '3', '4.3'),
        ('a38d91cb-0770-57c8-ab1a-41727247718f', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பாலப்பட்டி பிரிவு', '3', '4.2'),
        ('efd4f3ec-4783-5430-95e2-b2920b741492', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 எருமைப்பட்டி பிரிவு', '3', '4.18'),
        ('456ace4a-3738-5254-ad8e-0ee62fee3317', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கீழ்கூத்தாடிபாளையம்', '3', '4.1'),
        ('6dfa0d94-e419-51ab-8d79-9230e55749e5', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பூசாரி காட்டுவளவு-1', '3', '5.21'),
        ('1cb34c6c-a73f-5857-8d50-2f5d13cc420c', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பூசாரி காட்டுவளவு-2', '3', '5.37'),
        ('96924073-18fe-56b9-a139-d655ac2a903b', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பூசாரி காட்டுவளவு-3', '3', '5.61'),
        ('c106e445-c692-5e8d-a83f-5595aa79339a', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 தெற்கு வளவு', '3', '5.13'),
        ('2f110f0d-8ab7-5460-a0d0-a0e750f81627', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 மேட்டுக்காடு', '3', '4.27'),
        ('5e466217-696d-5a43-8ac4-990026f03c97', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 அப்புசாமி மில்', '3', '4.21'),
        ('dcc2a26c-9850-5897-97fb-8c9ac5d7b9ae', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பூங்கா நகர்', '3', '4.35'),
        ('53b3ce79-3f68-515e-9967-f9a696e52bb6', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வீரப்பம்பாளையம் ரிங்ரோடு', '3', '5.42'),
        ('56255ea9-087d-5745-97c1-7fc2f8cce6b5', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 SRS பால்பண்ணை', '3', '5.76'),
        ('78bbf452-045a-5479-9a7f-f93152019f69', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வெல்லுத்து பெருமாள் கோவில்', '3', '5.88'),
        ('df53938e-374d-5a87-9c55-580457f8e342', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வீரப்பம்பாளையம்', '3', '5.45'),
        ('8d10cbf2-2403-556e-8de5-5f6f2723d026', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வீரப்பம்பாளையம்-1', '3', '5.45'),
        ('4085d136-c782-59e8-a201-6657e2784c88', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 புதூர்-1', '3', '4.35'),
        ('506b3a5f-5c0f-57b1-8be7-a5acb4ee0684', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 புதூர்-2', '3', '4.35'),
        ('c4cf7b5e-d1f1-5174-a366-76b3caf09aef', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பரையங்காடு வளவு', '3', '5.85'),
        ('500beb33-bd3c-58fb-90f1-479f2666a52d', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 எருமைப்பட்டி-1', '3', '5.28'),
        ('f0ff90f3-b0c5-5921-9546-f8ced4839271', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 எருமைப்பட்டி-2', '3', '4.92'),
        ('8fb7c092-e49c-5105-ab2b-c381989c4931', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 எருமைப்பட்டி-3', '3', '4.87'),
        ('2ad7494b-9519-5917-a4b9-c9d614ac6503', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கூத்தாடிபாளையம்-1', '3', '4.24'),
        ('ca4a0418-dac1-503a-8ceb-f93d35480982', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 ஆலமரம்-1', '3', '5.28'),
        ('e269f12f-0cda-5881-a5f3-6c9bc0225b90', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 ஆலமரம்-2', '3', '5.28'),
        ('ef52c6ec-a11d-5dd0-b975-073b2d46b35f', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 தங்காயூர்', '3', '5.8'),
        ('a8720225-4ccb-5396-832d-004be0388751', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 நோட்டக்காரன்குட்டை', '3', '5.3'),
        ('3d7ac780-6fe6-5448-a684-2aca1f08a0c5', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 தேவனூர்பிரிவு', '3', '4.75'),
        ('726a2e5c-425e-5299-92ac-3ddddc52dc11', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கருக்கன் காட்டுவளவு', '3', '4.33'),
        ('4f4c9d74-9c8e-5a7e-97dd-46a61695dfe7', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 மூலப்பாதை-1', '3', '4.18'),
        ('0b5b0e13-a1f6-503c-8eeb-dd1b6f35c2f4', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 மூலப்பாதை-2', '3', '4.18'),
        ('897695d4-2e2b-569c-818e-6d84d63de3fd', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பூவானூர்- 1', '3', '5.64'),
        ('2bad2d5a-7cf3-5856-852e-6d68d65f276a', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பூவானூர்- 2', '3', '5.64'),
        ('4e032e50-4bec-5a13-95cd-1aea5a7223e8', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கச்சுப்பள்ளி-1', '3', '5.04'),
        ('0e41057f-c572-5174-882f-fdea3a757e26', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கச்சுப்பள்ளி-2', '3', '5.31'),
        ('5496f330-7c5d-583a-882f-5706f3aa37af', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கச்சுப்பள்ளி-3', '3', '5.31'),
        ('7140a9de-2f8c-5221-a4e2-8b35d8ca52b3', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கச்சுப்பள்ளி பூங்கா', '3', '5.31'),
        ('e3e6f761-5bbd-5d30-90d7-7af7492ce2f5', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 எருமைப்பட்டி தபால்நிலையம்', '3', '4.08'),
        ('d8201f21-54b5-5bf3-b4d2-26d2ee970252', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 எருமைப்பட்டி -2', '3', '4.14'),
        ('877ca20e-0c1f-52b8-b81c-12bf34b8dbce', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 எருமைப்பட்டி -1', '3', '4.63'),
        ('bf4bd520-f68d-5039-a927-f8db694cff63', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பாலப்பட்டி -3', '3', '5.27'),
        ('f004a9fe-f968-54d0-9d7b-21f75183253f', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பாலப்பட்டி -2', '3', '5.45'),
        ('68f77b98-aa87-56c1-8f42-38eb51697ddc', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பாலப்பட்டி -1', '3', '5.77'),
        ('8c0d94bd-35ee-5215-9c85-2d29c90240f9', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பலகாரவலவு', '3', '4.98'),
        ('37546a9d-826c-5dfd-9f74-4448ea142c96', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வெள்ளையம்பாளையம்-3', '3', '5.71'),
        ('090ad4f7-a8e9-53fc-beab-1a933f25af9f', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வெள்ளையம்பாளையம்-2', '3', '5.71'),
        ('ed875da6-ec0c-55bb-83df-866f7d58aba7', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வெள்ளையம்பாளையம்-1', '3', '5.98'),
        ('e43b000d-497a-570b-b5a3-2345cc359635', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 மோட்டூர்', '3', '4.39'),
        ('475ed8eb-6ad7-56ea-847b-ea58dd43b450', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 நாச்சனூர்-2', '3', '5.08'),
        ('cc1757a8-4379-5675-975c-a57edaec6e50', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 நாச்சனூர்-1', '3', '5.12'),
        ('f4a0d8d9-c13d-50c6-8d52-a622eca965ef', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கோரணம்பட்டி-2', '3', '5.68'),
        ('51c4dbe2-ec7e-52da-9f54-698baf3bb925', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கோரணம்பட்டி-1', '3', '5.81'),
        ('79de335b-ad61-5e10-a722-906ec6eeb282', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 நாச்சனூர் காட்டுவளவு', '3', '5.76'),
        ('e4ee8da5-2d8f-54ca-a15e-b31b1dd6bf98', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 சாமுண்டிவளவு', '3', '5.88'),
        ('01c17710-74b3-501d-8b1e-e542e514df8b', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பெரிய நாச்சியூர்', '3', '5.46'),
        ('d606ba6c-e1be-59e8-aeef-a6968c3af89a', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர் எலந்தக்குட்டை-1', '3', '4.6'),
        ('36092265-f135-5957-b23e-90c8d75d7b28', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர் எலந்தக்குட்டை-2', '3', '4.6'),
        ('da7253d0-4017-58ba-9634-eb828fb6f3e2', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர் வளவு', '3', '4.2'),
        ('1f610efe-9ec0-5f3d-a4c6-c2da7ad558f1', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர்-1', '3', '4.6'),
        ('9ed0b3c0-9630-5e61-a76f-e6aca2503f94', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர்-2', '3', '4.6'),
        ('c4d5da58-f9f4-5096-890a-5547d9cbfe26', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர்-3', '3', '4.4'),
        ('a25f1abb-09a3-528a-9fef-2461cf5e5c7e', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பவர் ஆபிஸ்', '3', '4.36'),
        ('ea3d78b9-77bd-5405-98ff-933326ee74d0', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 குரும்பப்பட்டி மாரியம்மன் கோவில்', '3', '4.1'),
        ('51cbdaa5-12ac-5b86-8256-1386acc67290', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 மூலப்பாதை (மேட்டுக்காடு)', '3', '4.38'),
        ('da590798-f594-532c-a402-ee9555d697b5', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 சின்னமணிவளவு', '3', '5.69'),
        ('51c830c6-6c0d-54c2-a7bf-aa6089560e6b', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வெண்டனூர்', '3', '4.67'),
        ('6929ce25-ddbf-5132-ade9-5aaa4d1e9f8a', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 குரும்பபட்டி பழனி அண்டிகாடு', '3', '4.16'),
        ('b769a4a8-055a-5c5a-8f64-ec5034593c7d', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பெரியநாச்சியூர்', '3', '4.43'),
        ('303afe77-9c36-5f5f-91ab-3742a300c303', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கட்டபுளியங்காடு', '3', '5.35'),
        ('fba9fcd2-a4f3-5538-89ac-c214c86dcb13', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 முள்ளுக்காடு', '3', '5.68'),
        ('9debf763-9f47-57c0-a015-a1a1d63392ce', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 துளுக்கங்காடு', '3', '4.4'),
        ('327a7d29-999f-588f-9611-6d3d4c1590c5', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 சாந்தங்காடு', '3', '4.4'),
        ('226f59dd-af3b-5cb2-b2ee-5ea1cc8494e6', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 அம்மன்காட்டூர் பஸ் ஸ்டாப்', '3', '4.09'),
        ('fa9ab350-5fd8-50d6-b32b-4bb641f8866d', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கந்தன் நகர்', '3', '4.68'),
        ('7f87aeda-45d6-5e1a-a143-150efd324230', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 அம்மன்காட்டூர் மாரியம்மன் கோவில்', '3', '4.68'),
        ('0adc65a5-fdee-594a-8699-33480e1a6bf2', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 அம்மன்காட்டூர் ஊர்', '3', '4.96'),
        ('6120bbe2-1887-573f-a181-f96fa6d86cea', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 அம்மன்காட்டூர் குரை', '3', '4.94'),
        ('5c5e6d2a-c4aa-50fc-b5bb-47746d2de71c', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கௌரி மெஸ்', '3', '4.51'),
        ('8e2f379c-b75b-53ef-98b1-372447872c23', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பன்னாரி அம்மன்கடை', '3', '4.57'),
        ('751fa5ce-2886-5281-9e9c-33f0b85e17e2', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 ஸ்வெலக்ட கம்பனி', '3', '4.64'),
        ('37076cdc-dbc6-52f3-b1a4-e9d5c853e6b7', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கேட்டுக்கடை', '3', '4.82'),
        ('0380f6d1-673d-5aa4-9149-4f754930dfcc', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வெள்ளாண்டிவலசு', '3', '5.59'),
        ('cde87d5f-00c8-5fff-b08d-0194ee6b6e74', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காளியம்மன் கோவில்', '3', '5.81'),
        ('077fffa6-af2e-5ce9-98dc-7d9218436e0f', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 சக்தி தியேட்டர்', '3', '5.93'),
        ('a8b07daf-9c6e-540d-9609-8297f657eddf', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பெட்ரோல் பங்க்', '3', '5.28'),
        ('bdfe273c-09af-52ef-9fe0-fc972091a348', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 எருமைப்பட்டி', '3', '4.66'),
        ('a7a7b8b5-4b1d-530b-99af-b5afcbfdbc33', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பாலப்பட்டி', '3', '4.73'),
        ('d1bf23a7-808d-5c76-9b36-c78a0975750b', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 முனியப்பன் கோவில்', '3', '5.34'),
        ('1068dafb-55a8-525a-b40e-8517197ad832', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கருக்கங்காடு', '3', '5.21'),
        ('0d4b7661-5d2e-5675-ad3a-1ed2ba4827e2', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 சந்தோஷ்நகர்', '3', '5.45'),
        ('4af357e7-28ac-5230-a415-d9a5c7c91d1c', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வித்யா காலேஜ்', '3', '4.54'),
        ('2c5bad18-8cce-51ef-8058-bd7de7b03ea1', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கச்சுப்பள்ளி', '3', '5.06'),
        ('6ee2a89a-3d15-55af-bc6f-3dc8ccd004a9', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 சக்தி மஹால் திருமண மண்டபம்', '3', '5.45'),
        ('56bf4825-144c-5268-9cf5-f7454afe31e8', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 மசக்காரம்பாளையம்-1', '3', '4.27'),
        ('99c09604-3669-52d9-8329-70c8c003062b', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 மசக்காரம்பாளையம்-2', '3', '4.27'),
        ('e2604bd9-e49d-5c91-b153-bd23d04d4518', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 மசக்காரம்பாளையம்-3', '3', '4.27'),
        ('d1d66501-6783-592d-a528-1ef810d9801e', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 பூவானூர் பேருந்து நிறுத்தம்', '3', '5.64'),
        ('74bcfcd1-0dd0-575f-863e-c8d9f149f433', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கன்னந்தேரி -1', '3', '4.17'),
        ('dd957722-6abe-5178-bab9-956695cf805f', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கன்னந்தேரி -2', '3', '4.17'),
        ('207fb9a1-bb89-5280-90af-1f8ca14897ab', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கன்னந்தேரி -3', '3', '4.17'),
        ('fe6d4433-46e2-51a4-b9ea-fe10107083a0', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர் -2', '3', '5.4'),
        ('ccfd6674-1ba1-5558-9f6e-7960bac28683', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர் -3', '3', '5.4'),
        ('2f343b64-5964-5ade-8500-6bfa43640c1e', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர் -4', '3', '5.4'),
        ('4a0b04fd-fbe6-576a-8026-871bf4423a2a', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 காவடிக்காரனூர் -5', '3', '4.4'),
        ('39bdfebc-17f4-5f85-b3b2-a29dd9410d91', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 மேல் தங்காயூர்', '3', '5.7 Km'),
        ('2e82959c-7602-56c5-ae24-508154786b4b', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 கீழ் தங்காயூர்', '3', '5.7 Km'),
        ('9d17550f-ed6f-5cf0-af72-dbf9819d4280', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 அம்மன்காட்டூர்', '3', '4.8 Km'),
        ('44cda875-0335-5d17-a10f-bb92ed3a639c', '13bd296f-afcf-5c02-98ef-7dd294762ea5', '3 வெள்ளக்கல்பட்டி', '3', '5.5 Km'),
        ('7c18e889-d6b9-5cac-ac36-0f6b8666d38d', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 சுண்டமேட்டூர்-1', '4', '7.9'),
        ('39419e13-35b9-5b82-9cec-2dea7da612fc', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 சுண்டமேட்டூர்-2', '4', '6.7'),
        ('69817cae-07d5-5f18-9dcc-79fdb86d8ae7', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 சுண்டமேட்டூர்-3', '4', '6.7'),
        ('89c37fc7-1734-5a5f-9592-05011e6c8d11', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 சுண்டமேட்டூர்-4', '4', '6.6'),
        ('63a85cb2-eafb-558a-933e-6d2668260574', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஒண்டிபனை-1', '4', '6.5'),
        ('342c117a-6b78-5825-90dd-955a2d894b7d', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஒண்டிபனை-2', '4', '6.5'),
        ('17e4cddc-e323-5afb-84b5-d1e4239f48a7', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஒண்டிபனை-4', '4', '6.4'),
        ('b5b8b2e8-8b57-5fec-bdc4-94d64861896d', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஒண்டிகடை-1', '4', '6.15'),
        ('ef7c238e-f714-552e-8c19-db3cf3fa56c0', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 குண்டல் பட்டி', '4', '6.6'),
        ('7525209f-a475-5347-8e1f-6ac2a9679810', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பாபி கடை-1', '4', '7.23'),
        ('91e4b0d7-2d03-57fd-b60e-931995a9685f', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பாபி கடை-3', '4', '7.23'),
        ('a71553b3-d0b4-5469-bea0-1452b1d72d26', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 காட்டூர்-1', '4', '6.63'),
        ('77926265-d1fd-5b2b-9a92-e8f9e478258d', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கரையானூர்', '4', '9.21'),
        ('1b4c6b8e-be48-55b3-99cc-90ad3f3ebe91', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மாங்குட்டப்பட்டி-1', '4', '7.59'),
        ('b29adda2-8078-5afb-9f5c-c23c747781f3', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மாங்குட்டப்பட்டி-2', '4', '7.41'),
        ('dca746df-c8fd-56a2-b89c-863ba4f61443', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மாங்குட்டப்பட்டி-3', '4', '7.39'),
        ('236f4d3d-48c5-5017-b928-1dd1a8c24eef', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மாங்குட்டப்பட்டி-4', '4', '7.39'),
        ('8a536dc6-3279-5976-9899-d8ae64b79d55', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மாங்குட்டப்பட்டி-5', '4', '7.39'),
        ('8ac37359-f50c-599f-ac35-6c3453dcec68', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கொண்டக்கார வளவு-1', '4', '6.64'),
        ('7fc7ffc6-a4a6-5ca2-a895-c73f021392ef', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கொண்டக்கார வளவு-2', '4', '6.77'),
        ('140131a8-a795-502d-b8ec-c5b9fb9aff3a', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பனங்காட்டூர்-1', '4', '6.25'),
        ('e2fd25db-038f-5b87-a7c1-7819771e2e1b', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பனங்காட்டூர்-2', '4', '6.25'),
        ('cf91c03c-9122-56c5-916d-026d8d815ea5', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 வரதங்காட்டானூர்', '4', '6.77'),
        ('27f2b803-3e46-594f-8c4a-6187b7c8805c', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 குட்டிபையன் வளவு-1', '4', '7.83'),
        ('9f3aaf79-dbe9-52a5-8c45-5a5c9cf04294', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 குட்டிபையன் வளவு-2', '4', '7.83'),
        ('2725e6d5-c2d7-5535-9b11-a76c4a1dd7ba', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 முனியப்பன்கோவில்(கோரணம்பட்டி)', '4', '7.24'),
        ('b82ad96d-eff8-5a33-bcdc-4610361607fc', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஏரிக்காடு', '4', '6.12'),
        ('d2c98d52-4658-5026-bbc3-dc5a41c717c5', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ராயணம்பட்டி பிரிவு', '4', '7.48'),
        ('5c884b9a-7aff-58e1-aee8-ddb8fb394a1c', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கோம்பைக்காடு', '4', '7.15'),
        ('a7f560b4-faa1-51f1-99d2-e341d2443542', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஆண்டிபாளையம்', '4', '6.77'),
        ('ee928255-4e73-563c-b2db-b9fe68f2076f', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 செட்டியூர்', '4', '6.25'),
        ('03feff81-dcaa-5c0f-97d4-550408cb10e4', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஒண்டிப்பனை', '4', '7.11'),
        ('5c972ccb-7888-512c-bbbc-052b172c9b6a', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தண்ணீர் பைப்', '4', '7.15'),
        ('9c623e2d-31af-5aec-a8f6-9b1f7a7bea3a', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 அ.புதூர்', '4', '7.86'),
        ('d043e384-12df-5de9-9164-b15900d3efd2', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கரட்டூர் மாரியம்மன்கோவில்', '4', '7.61'),
        ('5e8e587e-9764-5366-b220-1ee4db324af0', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கரட்டூர்-2', '4', '6.97'),
        ('3612018a-bdaa-533a-899f-17b43c5a02c2', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பெருமாள் கோவில்', '4', '7.28'),
        ('e165914b-1387-530e-bdb9-7e40e6f0be77', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 காட்டூர்-2', '4', '6.97'),
        ('e0241c42-5057-508e-b4f4-8e0c364ec879', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 காட்டூர்-3', '4', '6.97'),
        ('4592f2e3-9bec-542b-88d0-0f615a6cfa1c', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 காட்டூர்-4', '4', '6.62'),
        ('d8077794-ceca-5944-8f39-70a8f7ad8066', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 காட்டூர்-5', '4', '6.62'),
        ('5911e10f-eaf8-5ded-8db4-b5b1946178f1', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஒண்டிக்கடை-1', '4', '6.37'),
        ('119d7ce7-5ee7-523a-b874-2396ab783033', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஒண்டிக்கடை-2', '4', '6.37'),
        ('17c6af80-e301-53c0-916a-54f2c5bea04b', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கோசேரிப்பட்டி-1', '4', '6.86'),
        ('f0e4d633-652f-5433-9edf-a61b3844be93', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கோசேரிப்பட்டி-2', '4', '6.86'),
        ('1a9756f6-c164-559e-8de0-9a2377e01323', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கோசேரிப்பட்டி-3', '4', '6.86'),
        ('35241d9f-bb5b-5578-b785-810734e6f96b', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கருப்பாய்காடு', '4', '6.54'),
        ('1e986782-9b04-57e3-868d-0c709194ae98', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பள்ளிப்பட்டி', '4', '6.85'),
        ('ace617a7-1cc1-5751-84a5-9c61f88779f4', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பள்ளிப்பட்டி-பிரிவு', '4', '6.38'),
        ('b9c360f6-92e5-586c-872b-617354bbf628', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கல்லங்காடு', '4', '7.82'),
        ('3af7b469-a021-532f-8e39-24cb80e14e36', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கோவலங்காடு பிள்ளையார் கோவில்-1', '4', '7.8'),
        ('f71639a5-b11e-51e1-8411-21c87173485d', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தெற்குகாடு-1', '4', '6.91'),
        ('a4121b84-3c76-5968-ac74-0c533aa2d36c', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தெற்குகாடு', '4', '6.91'),
        ('ba45d67a-b24a-5bf5-8b61-da86bd9ef2f5', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தெற்குகாடு-2', '4', '6.91'),
        ('ef19a538-1af1-5885-95e5-97b7d43e65dd', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கோவலங்காடு கொடிகம்பம்', '4', '6.11'),
        ('0b7a2e4a-bbf6-5d43-9bb5-f09cd277c8b4', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மூலக்கடை-2', '4', '6.37'),
        ('f731aea9-30ea-5837-8402-b3980fe6f42e', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மூலக்கடை-1', '4', '6.45'),
        ('6736c040-8c8e-54be-9885-fb65e90f54e3', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கரட்டுக்காடு-2', '4', '6.71'),
        ('0b95cd1b-daf9-5a5e-b3b2-1540b61297d9', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கரட்டுக்காடு-1', '4', '6.71'),
        ('e86a0c54-e30c-5ae6-8e19-6914d324e83a', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 செல்லியம்மன்கோவில் மோரி-2', '4', '7.76'),
        ('12b3fe4a-750d-589c-abd6-6280215eeb90', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 செல்லியம்மன்கோவில் மோரி-1', '4', '7.76'),
        ('6523843d-10b8-5467-8a34-c0c85ec78f4d', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஆசாரிகாடு-2', '4', '6.02'),
        ('e5d3cc34-33e5-5702-8acd-d57dd3f763fe', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஆசாரிகாடு-1', '4', '6.02'),
        ('9b08ed3c-3d36-5dac-a6d7-9ca63cb40eca', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பனங்காடு', '4', '6.04'),
        ('f56ec90d-557c-5e10-b534-a4b37485ecfd', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பட்டரை காட்டு வளவு', '4', '7.57'),
        ('4124622f-7714-5307-8a83-eff82c0cb03a', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பக்கரிக்காட்டு வளவு', '4', '7.66'),
        ('774be79c-48c8-5aac-8d4e-9a2f706a9b2a', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பள்ளிப்பட்டி பிரிவு', '4', '6.13'),
        ('16358c25-84bb-5434-8db9-d1bc150d2c48', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஸ்டேட் பேங்க்', '4', '7.72'),
        ('4a7ed110-2973-59b1-a1ba-00f1b8eb20f8', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 போலீஸ் குவார்ட்டர்ஸ்', '4', '7.76'),
        ('da4c81fd-a1d0-5787-bcd7-5304d364f9a1', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மாட்டு ஹாஸ்பிட்டல்', '4', '7.61'),
        ('d871af29-5c59-54ea-9492-ee862f6b4e85', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 வைத்தியலிங்கம் திருமணமண்டபம்', '4', '7.43'),
        ('66e81397-17e8-51a3-a6a8-6058bb18430e', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பத்திரஆபிஸ்-1', '4', '7.27'),
        ('c0e80086-7982-5524-b5b6-94ff91e15a14', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பத்திரஆபிஸ்-2', '4', '7.27'),
        ('5c3d4d09-6b72-521a-9b91-bb1969e48bd6', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 போலீஸ் ஸ்டேசன்', '4', '7.15'),
        ('7d3eb1e6-346a-5f70-b1ad-2dd54c1d37e8', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கும்பகோணம் பாத்திரக்கடை-1', '4', '7.89'),
        ('382da2ca-f2e0-5609-937c-20149439f3fc', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கும்பகோணம் பாத்திரக்கடை-2', '4', '7.89'),
        ('96dce518-4e91-559d-a4fa-474564529a08', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மோகன் ஹாஸ்பிட்டல்', '4', '7.81'),
        ('81ed7af8-8350-5065-b260-97a98d2a3a54', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 Y.V.B சில்க்ஸ்-1', '4', '7.72'),
        ('42788fbd-547c-583b-a4c7-b4de02b70554', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 Y.V.B சில்க்ஸ்-2', '4', '7.72'),
        ('b44cb6fd-dee7-5056-8122-bdb2f6e00051', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 S.K.பல் மருத்துவமனை', '4', '7.67'),
        ('cafed4a2-54a5-55aa-aeeb-038a672f49a0', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மேட்டுத்தெரு', '4', '7.55'),
        ('91a3e84b-5206-5275-846d-6e0cdb79fa43', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கோகிலா மெடிக்கல்', '4', '7.46'),
        ('00fed28a-ad95-572b-a55c-c17b636353f8', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கோகுலகிருஷ்ணன் மருத்துவமனை', '4', '7.36'),
        ('bfe05ea2-bccb-5d41-ba69-ca0a493b0c28', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 அங்காளம்மன் கோவில் தெரு-1', '4', '7.25'),
        ('69153cbd-0b4f-5243-ac7f-78ed4c83b79f', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 அங்காளம்மன் கோவில் தெரு-2', '4', '7.25'),
        ('fbc28174-135a-50de-9034-6c3c40db8151', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 திரௌபதி அம்மன்கோவில்', '4', '7.14'),
        ('e35fcfb7-ccd3-5a94-80cc-e9679f7663a7', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 யூனியன் ஆபிஸ்', '4', '6.33'),
        ('8948bfc0-1534-5ae3-a1a4-9397f8fa4d3e', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பாவா மெடிக்கல்', '4', '6.79'),
        ('fed10320-4107-5708-bc8e-bf6d1c60abf2', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மோட்டூர்-1', '4', '6.11'),
        ('0524d444-2e25-5b01-a5fa-7293551ba773', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மோட்டூர்-2', '4', '6.11'),
        ('89013344-07a1-560a-b15d-55bef1ed686a', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 வாழக்குட்டைப்பட்டி', '4', '7.18'),
        ('694f3953-a374-5d8a-8c65-15ca56368f87', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 வாழக்குட்டைப்பட்டி-1', '4', '7.18'),
        ('b84cf570-5da7-5cd6-8c87-04f75bfc08a8', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 சின்னமணிவளவு பால் சொசைட்டி', '4', '7.04'),
        ('5b0f8f52-a94d-5029-941d-19d5f45a03ac', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தளவாய்ப்பட்டி', '4', '6.11'),
        ('422ac67c-3cef-58d4-9081-cdb7526c4be7', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தங்காயூர் மாரியம்மன்கோவில்', '4', '7.33'),
        ('7610eb95-b613-5f46-80c6-33a0d131f538', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பரையங்காட்டானூர்', '4', '7.88'),
        ('8184b8af-9687-50fa-9715-9fd789b9c87d', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தங்காயூர் மேல்கடை', '4', '6.76'),
        ('dcd2961d-f158-5a69-a92a-435f098cc8f1', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தங்காயூர்கீழ்கடை', '4', '6.76'),
        ('eb1d7925-8ca8-570d-b13c-ac0fa9a084a0', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மாமரத்தானூர்', '4', '6.17'),
        ('40fae43c-eba8-539f-944e-3a68f0bf8ae0', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஊஞ்சான்காடு-1', '4', '6.4'),
        ('0954e93c-b885-5da0-8aba-c0c52a1d7c57', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஊஞ்சான்காடு-2', '4', '6.4'),
        ('9db4415d-c03c-5812-aeca-9c9f11ded427', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 எடப்பாடி-குமரன் தியேட்டர்', '4', '7.58'),
        ('d29b7eb8-3e69-5643-ad18-e3e31405e9ff', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 செல்லாண்டிஅம்மன் கோவில் தெரு', '4', '7.36'),
        ('158939a7-941e-5160-a261-952d9fa228ea', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கவுண்டம்பட்டி', '4', '7.69'),
        ('3f2eaa5f-0b7a-5e55-a876-e48d84bc71ae', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 BSNL ஆபிஸ்', '4', '7.31'),
        ('ce5fa5cc-386a-58c3-b744-b46d63c38bac', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 சிங்காரவேல் கடை', '4', '7.23'),
        ('8ae51ac9-3204-5dad-99f6-09a91b99dd20', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 KRS ஹாஸ்பிட்டல்', '4', '6.06'),
        ('4ed895ff-9824-517e-95e0-3caa41e89f0d', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கல்கிகேஸ் ஆபிஸ்', '4', '6.16'),
        ('302d1e9b-fdd6-5e15-8432-ba9eebc6872e', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 எடப்பாடி அரசு ஆண்கள் பள்ளி', '4', '6.62'),
        ('cb313c14-3111-5cf8-af11-55f43225fba8', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தொப்பக்காடு-2', '4', '7.91'),
        ('4d956610-f164-5dcb-9300-2790f00bee80', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 தொப்பக்காடு-1', '4', '7.91'),
        ('2734df4f-ccfd-5c99-8c9d-51e57e77a827', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 எட்டிகுட்டைமேடு', '4', '7.94'),
        ('25ecb3dd-e1c5-5803-9d48-589f2a6fcf39', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கள்ளங்காடு', '4', '7.73'),
        ('90884c47-9788-5573-ad4f-ca7e7b87ebd1', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கொல்லப்பட்டி நிறுத்தம்-1', '4', '6.25'),
        ('404e1211-4914-5c20-8316-96d04be23fc0', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கொல்லப்பட்டி நிறுத்தம்-2', '4', '6.02'),
        ('97f9a4ba-00bc-5071-bd81-261aa284dbb1', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 குண்டல்பட்டி பழையபால் சொசைட்டி', '4', '6.56'),
        ('93edd654-d710-5414-8803-3f9f70e04dc2', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 குமரகுரு ரைஸ்மில்', '4', '6.94'),
        ('1b61831c-d721-556c-938a-1a0e3ac3e1b5', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 குண்டல்பட்டி', '4', '6.91'),
        ('89a65ac4-a7ca-5878-823f-c7ee3d5afa24', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 செல்லியம்மன் கோவில்', '4', '7.74'),
        ('5ae721e5-0955-5791-921b-a3d7111d7825', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பள்ளிப்பட்டி-2', '4', '7.58'),
        ('3268632b-0772-5d7c-9635-b980121784e2', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 எலந்தமரத்தான் காடு', '4', '7.32'),
        ('ec252c5e-8959-57a5-8945-a5d777e52aec', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 புது ஏரிக்காடு-1', '4', '6.52'),
        ('18b582ce-94b2-5f06-a8e9-32a5b1fe6a84', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 புது ஏரிக்காடு-2', '4', '6.76'),
        ('a3c52873-a454-58af-ba8a-7c888b88413c', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஏ.டி.சி. டிப்போ-1', '4', '7.58'),
        ('fb31db6c-1f49-5977-9b1a-5e2d7ca201ba', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மேட்டுத்தெரு-1', '4', '7.43'),
        ('24a81ee8-a4bc-5224-87b4-6e080d4ba7c7', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மேட்டுத்தெரு-2', '4', '7.34'),
        ('33af07b7-5439-5ad2-85d3-1ba23cd829f4', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மேட்டுத்தெரு-3', '4', '7.12'),
        ('c11af83f-bfd2-588b-8000-7762a1be13c9', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 எடப்பாடி பஸ்நிலையம்', '4', '7.09'),
        ('3818c980-9dd1-538d-b93e-6b2845c8bdb6', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 சாணாரப்பட்டி', '4', '6.38'),
        ('99080526-ef24-5d72-89b9-7c26821258fe', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 சின்னமுனியன் வளவு', '4', '7.04'),
        ('3682460c-47e7-5b30-a5f7-74af505d2592', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மோட்டூர்-3', '4', '6.11'),
        ('d4c0e386-0323-5619-9fed-a160c21ea4d9', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 வாழக்குட்டைப்பட்டி-3', '4', '7.18'),
        ('224e287c-774f-5e6c-9c00-48a48a3e2ca0', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கவுண்டம்பட்டி-1', '4', '7.69'),
        ('006e9e48-8a34-59da-a9f5-93d7c0aa2eed', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கவுண்டம்பட்டி-2', '4', '7.69'),
        ('131b455e-7840-50f7-a623-731d7845162c', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கவுண்டம்பட்டி-3', '4', '7.69'),
        ('281dc903-624c-5f68-8b75-5bf53beeaa86', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 குப்பதாசன்வளவு', '4', NULL),
        ('530011fb-2aeb-55b7-8808-2577e3378161', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 குமரன் தியேட்டர்', '4', '7.61'),
        ('a863e525-a767-5830-98c3-df0473d1b938', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பிஎஸ்என்எல் ஆபிஸ்-1', '4', '7.31'),
        ('281dbe5c-2acb-5b4a-bfec-e76934edd6bc', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 பிஎஸ்என்எல் ஆபிஸ்-2', '4', '7.31'),
        ('4a9ea930-00dc-5d1b-a1f2-43dbb51b54e2', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 மோட்டூர் காட்டு வளவு', '4', '9.58'),
        ('943a9aa7-5345-560a-8e9f-74dc70028bc2', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 வடக்காடு', '4', NULL),
        ('02bd7e4b-5f7d-5b1b-aacb-4ed1bebb3c52', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 சுண்டமேட்டூர்', '4', '6.07'),
        ('22ac03f9-c2cf-5a00-9035-2467901a98c9', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ஒண்டிக்கடை', '4', '6.15'),
        ('b93e586c-db9c-5746-a83d-48dd68694b64', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 வக்கீல்தோட்டம்', '4', '6.31'),
        ('1bf22373-f994-57fb-ac69-fb6d4cc66903', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 இடைப்பாடி SBI வங்கி', '4', '7'),
        ('575464bd-ddcc-5ed6-9e6b-c5b87da0432d', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 இடைப்பாடி காவலர் குடியிருப்பு', '4', '6.9'),
        ('df05e42b-6e68-5a6b-9803-4f463711237f', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 இடைப்பாடி கால்நடை மருத்துவமனை', '4', '6.9'),
        ('b46c5dc2-7e4f-5a3c-a9a4-846a7c80cd60', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 இடைப்பாடி காவல் நிலையம்', '4', '6.9'),
        ('c11108cd-7f57-5f6e-ac2c-9ee7744beec5', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 இடைப்பாடி பேருந்து நிலையம்', '4', '6.8'),
        ('5c025a5d-4e55-57af-9b5a-052f99737d5c', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கோதாரண்காடு', '4', '7.9'),
        ('4d6f8239-dc34-50ad-940e-e81855291613', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 ராமகிருஷ்ணா மண்டபம்', '4', '7.4 Km'),
        ('ac5bd506-18e1-53e9-a7e0-149ffd77c1a6', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 SP கண் மருத்துவமனை', '4', '7.4 Km'),
        ('2cf99456-d4a8-511d-b617-003e0b1299ef', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 விஸ்டம் பள்ளி', '4', '7.2 Km'),
        ('ab6075e1-2650-5056-9bca-5eb171b9a5e3', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 காளியம்மன் கோவில்', '4', '7 Km'),
        ('54e1b028-90c6-5d85-a0fe-d36eefadc428', 'e86daab4-fb8b-5d34-9e3c-c2dac1a81699', '4 கும்பகோண பாத்திரக்கடை', '4', '7 Km'),
        ('fe2592ae-06c6-5197-9ae3-eaf817323ac5', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகனூர்-1', '5', '9.5'),
        ('4a6eed68-80e9-56dc-af4b-31d59a3a5c1f', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகனூர்-2', '5', '9.5'),
        ('2edef2e4-5907-5cec-be0e-618c90820747', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகனூர் -3', '5', '9.4'),
        ('bb134f73-1116-5854-b935-fccaaa3e7ed0', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகனூர் -4', '5', '9.4'),
        ('11ec52ad-9a5f-54c8-88f7-8903f6d4fa49', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆசாரிபட்டரை-1', '5', '9.2'),
        ('6b12210d-6016-5b60-b6a3-9955a2d4226d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அண்ணாநகர்-1', '5', '8.9'),
        ('d759f284-95fb-5300-833c-97c4990799b3', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அண்ணாநகர் -2', '5', '8.9'),
        ('798f0ab6-3940-5f1b-9ed9-05969b7aaafd', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 செல்லியம்மன் கோவில் மோரி', '5', '8.71'),
        ('2d8dab09-dd13-5a22-afa9-9a00dd8bb4f8', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 தோலுக்காரன் காடு', '5', '10'),
        ('eacc2c77-60e3-5d5d-b48f-387d2e861752', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 சரவணா ஹோட்டல் பின்புறம்', '5', '10.2'),
        ('8f10315b-e68d-5dcd-a70d-369fff2291f0', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வைகுந்தம்', '5', '10'),
        ('a2bf8ffa-f4a8-576a-b101-c7a759b4f929', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வண்ணங்குட்டை பிரிவு', '5', '9'),
        ('87f30dfe-2553-56b1-ba98-8755de05027e', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 குண்டல்பட்டி விநாயகர் கோவில்', '5', '10'),
        ('773cfa0a-94db-5ed7-bb9d-2c1d914dec53', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பெருமாகவுண்டன் வளவு', '5', NULL),
        ('f9fff7f8-8a70-5171-a171-31ec74a0bdaa', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஏரிமூலை', '5', '8.85'),
        ('2d3af88e-5e4a-50d3-b0a3-3ffc806d22f8', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கொம்பாடி காடு', '5', '8.5'),
        ('114e48eb-fc2c-5cc9-ba2f-723c04dc1f9d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோணபைப்', '5', '8.58'),
        ('036b4e76-cb30-5de2-96f0-ca827e154fb6', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வெள்ளரி வெள்ளி ரிங் ரோடு', '5', '9.54'),
        ('b7ca8195-4203-53ed-898b-e6f40755f9da', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 நெசவாளர் காலணி', '5', '8.84'),
        ('400c3f5c-8315-5e04-af08-d4c50d1f6182', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பெயின்டிங் பட்டறை', '5', '8.46'),
        ('01ff9064-1856-5b63-bec3-919f75cb96fd', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வெள்ளரி வெள்ளி பிரிவு-1', '5', '8.34'),
        ('f904b080-dc7f-5020-8ecd-33d8f79b44c0', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வெள்ளரி வெள்ளி பிரிவு-2', '5', '8.34'),
        ('5f352778-7ce4-5d7c-a6af-50b771774937', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஹவுசிங் போர்டு-2', '5', '8.24'),
        ('0b937efc-b04f-5e81-aa4a-c11807f4cb9a', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 விஸ்டம் பள்ளி', '5', '8.2'),
        ('5ea1e265-5646-5f0e-ba9e-acff02169570', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 காளியம்மன் கோவில்', '5', '8.1'),
        ('ffa21687-fa78-52c5-87bd-12a6c76037f0', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஹவுசிங் போர்டு-1', '5', '8.24'),
        ('562d2b5f-8f9d-5cea-8168-a226b0eba919', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஐயன்காட்டூர்', '5', '9.8'),
        ('b0a5a616-70f5-5493-9be4-caf636677539', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மாரியம்மன் கோவில்', '5', '9.8'),
        ('a63a77c5-f4cb-54fe-99d8-b7cf99597138', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ராஜாமணித்தோட்டம்', '5', '9.98'),
        ('8440f35f-ef80-5f80-9f16-d64dc5122ad3', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஒருக்காமலை', '5', '8.39'),
        ('b8dd3c22-50f4-5afe-b018-46e9f0073af5', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 புதுப்பாளையம் -1', '5', '9.97'),
        ('1ffb102d-b4dd-5887-97bb-f87f3ecb7de0', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எட்டிக்குட்டைமேடு-1', '5', '9.98'),
        ('d018e849-f8ca-5131-8be5-69394ee04328', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 புதுப்பாளையம்-2', '5', '9.97'),
        ('1fadc6b9-cbd0-551f-babd-5b40c77d0c7e', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 புதுப்பாளையம்-3', '5', '9.97'),
        ('883fd924-0671-5f3e-a00f-e04558babace', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 புதுப்பாளையம் வாய்க்கால் பாளையம்', '5', '9.71'),
        ('cda5f852-4906-530e-b503-6cf520af1b2f', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 புதுப்பாளையம் பெருமாள்கோவில்-1', '5', '9.46'),
        ('e950a529-d38b-5f1e-ae48-c8227054f4e3', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 புதுப்பாளையம் பெருமாள்கோவில்-2', '5', '9.46'),
        ('e25517a7-bc5a-56f9-b5f2-1f031fc3be10', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஈஸ்வரன் கோவில்', '5', '8.75'),
        ('50472f44-15b5-55e0-bdb0-b508b5dfb152', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ராாயணம்பட்டி கரட்டுக்காடு', '5', '8.56'),
        ('f5261552-2874-5962-8743-0b2c5c90a62d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ராாயணம்பட்டி', '5', '8.77'),
        ('16466e4a-6a6e-513b-9f6d-d50e266c0264', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 சடையம்பாளையம்', '5', '10'),
        ('c5ac737d-59ef-5cd3-99c5-9227cf8c671a', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ராாயணம்பட்டி காட்டுவளவு', '5', '8.56'),
        ('43fd54be-df32-591f-9a86-2349ccd75566', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ராயணம்பட்டி பெரியமாரியம்மன் கோவில்', '5', '9'),
        ('884de7c2-62d7-5eb4-93e7-58ebd68347c1', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பாச்சாலியூர் காட்டுவளவு', '5', '9.5'),
        ('7f8a04af-a716-59da-9e0d-cc4894665402', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பாச்சாலியூர்', '5', '9.5'),
        ('a20238b1-4370-5887-916a-0a0223a84bb3', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 தொப்பக்காடு-1', '5', '8.12'),
        ('5d73dc6a-967b-526c-a7ac-ad2758d77679', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 தொப்பக்காடு-2', '5', '8.12'),
        ('ffdeac6d-00fa-55a0-ad72-6a39b78496d1', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பச்சியம்மன்கோவில்', '5', '9.25'),
        ('4c8d4da1-3b6f-51ee-b9c2-f8ae22176594', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 காட்டுவளவு-1', '5', '9.75'),
        ('93d82fcf-3f53-50fe-a15a-6b3ab8e57f0e', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 காட்டுவளவு-2', '5', '9.75'),
        ('ae959c00-177a-5ec7-9656-a49b645e11bd', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 புதுக்குடியானூர்', '5', '9.51'),
        ('8a903abf-2864-556f-a65d-d55ede8d43ab', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 சிவன் கரடு-1', '5', '8.49'),
        ('73f0dfd6-82c0-5f2f-8559-a27715f8331f', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 சிவன் கரடு-2', '5', '8.49'),
        ('4255a34b-ffd9-5ad1-8c64-ce57c2a73618', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 தோப்புக்காடு-1', '5', '9.92'),
        ('bda6397d-beca-55b3-bc4a-a83d4bf50380', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 தோப்புக்காடு-2', '5', '9.92'),
        ('0931e457-1361-51b2-92c9-381f17071107', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோம்மைக்காடு', '5', '8.08'),
        ('d9a5218a-872b-5a6b-b2ef-1850f687dba1', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எட்டிக்குட்டைமேடு-2', '5', '8.11'),
        ('8c43463e-033c-5f2f-9db1-69b9dc5f3408', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆலச்சம்பாளையம் ரிங்ரோடு', '5', '9.98'),
        ('a778754d-f838-58e1-ab31-89a09ceb39a7', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆலச்சம்பாளையம்', '5', '9.55'),
        ('4d8b260b-4151-5f80-99b7-07bb9f85de53', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆலச்சம்பாளையம் பாறைக்காட்டு மேடு', '5', '9.39'),
        ('baf21156-6fa4-5403-969f-d35b9ac9d18d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஏ.டி.சி.டிப்போ', '5', '8.55'),
        ('46ca1829-f907-5b18-bcf1-e76b8f6c88d7', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மேட்டுத்தெரு', '5', '8.21'),
        ('c35f7c90-07b5-5a39-a168-ac2fec6dffbb', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 குஞ்சப்பனூர்', '5', '9.89'),
        ('764fb2ff-adbd-5cbe-8dbe-60b7d8dbd3e1', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகப்பம்பாளையம் ஆயில் மில்', '5', '9.35'),
        ('77659ca0-ebbc-58c1-91a6-fd7649b6777f', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகப்பம்பாளையம்', '5', '9.17'),
        ('ce8ec4f4-035a-58c1-88e1-e7b18b54590b', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகப்பம்பாளையம்-1', '5', '9.17'),
        ('762aaa93-ee32-582a-9e5f-f1f2db37a644', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகப்பம்பாளையம் -2', '5', '9.17'),
        ('9d4a737e-8884-51e7-9b52-02605e7f0af8', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகப்பம்பாளையம் -3', '5', '8.79'),
        ('7d9ecb85-fca1-5d0c-92a5-0ab3df8ae32f', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கொல்லப்பட்டி கிணறு', '5', '9.8'),
        ('0cc61e6a-328c-5090-b575-87b2793d9b20', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கொல்லப்பட்டி-1', '5', '8.6'),
        ('1752efd1-e3be-51f8-9b98-5d410175ef6e', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கொல்லப்பட்டி-2', '5', '8.5'),
        ('8588febc-3b5c-5e57-85e1-df5541852430', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கொல்லப்பட்டி-3', '5', '8.4'),
        ('3982c5eb-5025-516a-ae23-53b6755a33bf', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கொல்லப்பட்டி-4', '5', '8.3'),
        ('cf455b8d-864e-5f71-b7f9-ef552b108a2d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கொல்லப்பட்டி ஏரிக்காடு', '5', '9.8'),
        ('ecc95e5a-e51d-5b0b-88ee-b8cf4b5425a2', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 போஸ்ட் ஆபிஸ்', '5', '8.5'),
        ('ea319abc-5370-500c-8dc9-5dce8fe36e36', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 நாதன்காடு', '5', '9.01'),
        ('4e307cc1-b03c-5f5d-a780-ba7278f81b3d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 காளிப்பட்டி பிரிவு -3', '5', '8.59'),
        ('bbd4e99a-f4d8-5a95-9547-60d24a927636', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 காளிப்பட்டி பிரிவு -2`', '5', '8.59'),
        ('1b42cc04-ba93-53b1-a760-cfa3b451d44a', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 காளிப்பட்டி பிரிவு -1', '5', '8.59'),
        ('b8d17cef-640b-5b8b-9e4a-db693153887d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 செல்லப்பம்பட்டி', '5', '9.95'),
        ('6790631e-66aa-519c-b27a-260b5609b2e8', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வேலாக்கோவில்-4', '5', '8.26'),
        ('39628dad-5e44-5875-83e5-37bc945ecffe', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வேலாக்கோவில்-3', '5', '8.23'),
        ('e03c7c40-ddff-5a57-a519-7da5abd47bf5', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வேலாக்கோவில்-2', '5', '8.21'),
        ('3ed8cf7f-540b-56bb-a353-b0064aecfb5b', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வேலாக்கோவில்-1', '5', '8.13'),
        ('3f04fb53-5cd8-5633-85b6-a7c859e8235e', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஏரிக்காடு', '5', '9.27'),
        ('fd4d47e9-f9d1-5cbd-8843-021b67dab1d4', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மெய்யம்பளையம்-5', '5', '8.26'),
        ('8523e984-c793-5ccf-a421-26f5ee811f87', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மெய்யம்பளையம்-4', '5', '8.48'),
        ('3b90e4af-928a-5fee-95cb-1a54915c57d0', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மெய்யம்பளையம்-3', '5', '8.58'),
        ('20ae02ed-9970-55e4-9539-cbf7b04d2fc8', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மெய்யம்பளையம்-2', '5', '8.88'),
        ('a6505405-42f7-59bd-a3d0-0ea6b7e88fde', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மெய்யம்பளையம்-1', '5', '9.15'),
        ('2c54f5c7-c327-504a-87ad-9c91b6ab7f04', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வாழக்குட்டை', '5', NULL),
        ('3592c0c4-25ad-5d08-8c9e-273c144e5c86', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 குப்பதாசன் வளவு-1', '5', '9.02'),
        ('26a59e77-dd28-5301-a8da-0aa2ad64bf67', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வாளன் வளவு', '5', '8.31'),
        ('10913fda-a239-55a9-be5c-a46d739a69f5', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வேலமாவலசு-2', '5', '10'),
        ('72a195cf-4d90-54ac-84f8-3ba5045cd869', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அண்ணாமலைக்காடு', '5', '9.7'),
        ('38dded20-04a1-5ec8-bf47-6e172e126645', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பிள்ளையார் கோவில்', '5', '9.5'),
        ('acb477a3-c187-58e9-b1e6-9f8fe45573d1', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோழிப்பண்ணை', '5', '8'),
        ('7f090141-64b4-5444-b483-648d96718683', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பாசபாலிக்காடு', '5', '9.2'),
        ('4ab62af1-e07d-5f41-9728-078e30af833b', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பாசபாலிக்காடு முருகன் கோவில்', '5', '9'),
        ('0c5ba536-9aa1-5455-9ce5-4669d3385a36', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பாலதலையான்காடு', '5', '8.4'),
        ('27d5df71-aee0-596c-9325-f45beb2cc6e5', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோணமோரி', '5', '8.91'),
        ('27db3c6e-3b41-54d2-b079-d4c231d76e1d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எலவம்பாளையம் ஊர்', '5', '9.1'),
        ('b759d044-4bfe-5e74-95d6-fe5582e526e0', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பள்ளிப்பட்டி-1', '5', '8.3'),
        ('9a1d8054-e6ac-5ba4-8873-f24a116b575f', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 இலவம்பாளையம்-1', '5', '9'),
        ('9c630241-3091-5d26-861d-5b5e962c056d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 இலவம்பாளையம் - 2', '5', '8.8'),
        ('9113804a-cf2d-5571-a24a-877d78e0b097', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பள்ளிப்பட்டி -1', '5', '8.46'),
        ('26893bea-8547-5ac8-9181-62acd0b7794d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பள்ளிப்பட்டி -2', '5', '8.46'),
        ('4d2a9c9f-341b-53ce-a6a1-524014791942', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பள்ளிப்பட்டி', '5', '8.46'),
        ('5883bfc4-7723-5668-aeb2-c36e7a2d3a80', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆவணியூர்', '5', '9.24'),
        ('5125abc1-de75-522b-891f-833936d6531f', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கிரேஸி சில்க்ஸ்', '5', '8.64'),
        ('66a6707e-bf35-5fc4-90dc-41b9ed516e88', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 P.R.M.பங்க்', '5', '8.37'),
        ('8d79d5bc-215a-5c51-95fe-f2a5dd74183d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மூக்கரை பெருமாள் கோவில்-1', '5', '8.06'),
        ('d58d4e0c-797e-573c-9c52-4999e6bf94d1', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மூக்கரை பெருமாள் கோவில்-2', '5', '8.02'),
        ('3e496518-f96a-5aae-bd29-7fe9dfdbbe60', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 காளிகவுண்டன்வளவு', '5', '9.39'),
        ('e9e99b69-fe3c-5722-b499-415dfe404f0e', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மோட்டூர் பிரிவு', '5', '8.51'),
        ('e10ab4a6-32e4-5886-a65f-e8c9748738ed', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எடப்பாடி-ஹவுசிங்போர்டு-1', '5', '8.26'),
        ('0b094922-eca8-55ed-91ad-3f54931bca0c', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எடப்பாடி-ஹவுசிங்போர்டு-2', '5', '8.34'),
        ('738816b0-1b12-52a9-abfe-7a811cb41d2b', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எடப்பாடி-ஹவுசிங்போர்டு-3', '5', '8.34'),
        ('6b8998fd-8a90-56ab-ad1f-dcde3bd02160', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எடப்பாடி-ஹவுசிங்போர்டு-4', '5', '8.48'),
        ('3c9c9926-52dd-568c-aabc-d55393e0f407', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எடப்பாடி-ஹவுசிங்போர்டு-5', '5', '8.56'),
        ('ee50518e-3f7a-5414-9658-6a0b65c4c7f3', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எடப்பாடி-ஹவுசிங்போர்டு-6', '5', '8.67'),
        ('687804b3-6dcb-5f0c-9ddd-38561c704e8a', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எடப்பாடி-ஹவுசிங்போர்டு-7', '5', '8.67'),
        ('ca639565-c026-546a-84e8-7b39577f5712', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பனஞ்சாரி', '5', NULL),
        ('24786a15-06e1-51fd-be57-005b3dd2b325', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 காட்டூர் ரோடு', '5', NULL),
        ('efaba4bf-a0d9-5bd8-9f1a-fdc9f971b89c', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஏரி ரோடு', '5', '8.58'),
        ('29c83aa4-d3d8-5b34-816e-2884504212ac', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஏரி ரோடு-1', '5', '8.58'),
        ('15f6fb86-7bc5-5fd2-a77e-07d2fa3eb20a', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கன்னியாம்பட்டி', '5', '9.53'),
        ('c3df382f-1c20-5a12-9ee4-cb8b89d82b61', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பாச்சலியூர் பிரிவு சமுதாயக்கூடம்', '5', '9.15'),
        ('aff6ebba-8f7e-591f-8469-f177ef7343be', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 சிவன்கரடு', '5', '8.45'),
        ('6a6e73fb-3a53-542c-8a3f-4ca999670cfb', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோணங்கியூர்-4', '5', '9.49'),
        ('6def4eee-60df-5834-8be1-e9db0505c73c', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோணங்கியூர்-3', '5', '9.49'),
        ('cb011360-20db-5bd5-8abb-c4a1f93dfd5b', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோணங்கியூர்-2', '5', '9.49'),
        ('8c1daa5d-ac0e-53f4-ba50-5a94a4fb064b', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோணங்கியூர்-1', '5', '9.49'),
        ('aa0728ef-4cb2-56f3-bc6c-93731db66cf6', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகப்பம்பாளையம் புதூர்-1', '5', '9.63'),
        ('e2b3231e-0c23-5a2c-b1eb-ab22f3e5655f', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகப்பம்பாளையம் புதூர்-2', '5', '9.63'),
        ('0136fd33-9cfa-536b-a1bf-b7ed0b070ff3', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 KVS ஆயில் மில்', '5', '9.13'),
        ('2bb49d59-9598-5450-878d-a6fbb5d2a683', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 போர்வல் ஸ்டாப்-1', '5', '8.51'),
        ('5efadd1f-3bdf-5fcb-bf93-693c80ddb516', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 போர்வல் ஸ்டாப்-2', '5', '8.13'),
        ('219674c0-ff38-5d8e-bb4f-33c6100e4a0a', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வடக்கத்தியங்காடு', '5', NULL),
        ('705511cc-85be-5a90-aeeb-6c641349e6cf', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 காளிப்பட்டி பிரிவு ரோடு', '5', '8.46'),
        ('c14f59da-46d7-5853-b8df-e7664e120944', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோரணம்பட்டி', '5', '8.21'),
        ('1bfce299-2bcd-58ec-8f76-212e82b030be', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வேலாயுதக்கரடு', '5', '9.83'),
        ('df3cd4f6-9857-5cdd-97d3-212607b3a64d', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 சிவன்கோவில்', '5', '9.83'),
        ('8067cce1-1972-5072-8044-63be2a7fda82', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மேட்டுப்பாளையம் பஸ்ஸ்டாப்', '5', '9.58'),
        ('b8487eba-967c-5949-8020-f66961a63e8b', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 செக்குமேடு', '5', '9.19'),
        ('94b2ebf7-a8b6-5aff-bb43-7d6100ddd48a', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எட்டிக்குட்டைமேடு', '5', '8.22'),
        ('125ff725-c44b-5f4a-8cb4-28d81e727056', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எட்டிக்குட்டைமேடு-4', '5', '8.22'),
        ('1f22fb6f-e7fc-51cb-9417-9a58659e10e5', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பருப்பு மில்', '5', '8.14'),
        ('f2b51a4b-dd21-5540-b694-885d62f281f7', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எலவம்பாளையம்', '5', '9.02'),
        ('18c7406e-efd8-57ca-b4fa-68d8ef4d2571', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆலச்சம்பாளையம் - 1', '5', '9.55'),
        ('4d553903-f6e8-5d66-a07d-2b25369eaa13', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆலச்சம்பாளையம் - 2', '5', '9.55'),
        ('02263e2b-ef3c-5946-a726-b3a2968bd8ea', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 மோட்டூர் காட்டு வளவு', '5', '9.58'),
        ('1a3876a5-f74e-5267-b2f3-ff3187d05241', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அழகனூர்', '5', '9.05'),
        ('b99bc1bc-375a-57e5-aadf-15b61aeb8a7b', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆசாரிப்பட்டறை', '5', '8.67'),
        ('cfe6c6b0-cf30-5987-a1ec-33549dbb8363', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 அண்ணாநகர்-2', '5', '8.09'),
        ('85468322-477f-5c01-9db7-45c4939c11de', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆவணியூர்-1', '5', '9.2'),
        ('0bc0bfec-2f5c-59f7-b603-0c99e90c3aea', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆவணியூர்-2', '5', '9.2'),
        ('ec7db864-c49d-53f0-841b-6c0463285be8', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 PRM பங்க்', '5', '8.2'),
        ('e96b6ee5-21d7-5609-baf8-13c779d6f959', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 பாலத்தலையாங்காடு', '5', '9.7'),
        ('a93384cf-9428-586a-be07-d1782b37e1c9', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 வண்டித்தடம்', '5', '8.3'),
        ('c9fcb035-42a6-51ad-9e92-09b3db9d7f3e', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 ஆச்சார்யா பள்ளி', '5', '9.9 Km'),
        ('1c4bd75f-1ac1-55a7-9ebd-1ed08e170691', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 கோணபைப்-1', '5', '8.7 Km'),
        ('d260b246-983a-5745-b044-2b2325383dae', '0f2f38dd-9cb2-5aa0-9103-fb46553375f8', '5 எடப்பாடி-ஹவுசிங் போர்டு', '5', '8 Km'),
        ('edb62d46-6432-57fe-ac6e-7bb886f8cf2a', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 பாட்டப்பன்கோவில்', '6', '11.7'),
        ('3a1df512-1f3c-5227-bb49-741697b84193', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மகுடஞ்சாவடி-1', '6', '10.7'),
        ('fa0df9da-dcb3-5550-a5d7-53c329102107', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மகுடஞ்சாவடி-2', '6', '10.4'),
        ('5a8e34de-fbf1-534b-b140-98f881c51de0', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மகுடஞ்சாவடி-3', '6', '10'),
        ('1e8e1055-270f-5bff-8929-a04304396326', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மணியங்கரான் காடு', '6', '11'),
        ('6fe3fb9e-9217-50ee-b68c-acf5b92faae6', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கணக்கச்சிப்பாளையம்', '6', '11'),
        ('c95f38b8-9f52-53f1-a574-d5c476077ff6', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 ஊஞ்சக்காடு-1', '6', '11.05'),
        ('0cbadf28-e00c-5cc4-8e59-ee1539f5de3b', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 ஊஞ்சக்காடு-2', '6', '11.05'),
        ('7e984049-c467-5864-b735-5a17f04291e2', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 ஊஞ்சக்காடு-3', '6', '11.05'),
        ('a30e6ba3-83fe-5cd4-8dbc-9b2de372ab4f', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 ஊஞ்சக்காடு-4', '6', '11.05'),
        ('1309175c-04a3-5c1e-8f3c-aad326df6bd7', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 ஊஞ்சக்காடு-5', '6', '11.05'),
        ('9faaa101-403c-5345-83b5-5a5b63468364', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சுண்டாக்கல்-1', '6', '11.81'),
        ('97e5419f-993d-5452-8411-4be87a7ad5dd', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சுண்டாக்கல்-2', '6', '11.81'),
        ('2777b27b-2f9f-5922-aad0-a984e9febf46', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கரடு-1', '6', '11.81'),
        ('4d35e53a-2bef-587d-8828-8fb7b6a213a1', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கரடு-2', '6', '11.81'),
        ('d1d6af4b-5ccb-5437-b37b-ad745bf2ab5d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கரடு-3', '6', '11.81'),
        ('b6b7172a-8a86-5789-a132-0a7fdcc2bcea', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மாரியம்மன் கோவில்', '6', '11.9'),
        ('6450ac0f-76c9-5dd7-8fa9-6b3bb2b68470', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சங்ககிரி ஆர்.கே.நகர்', '6', '11.8'),
        ('d224d186-3881-5750-bf26-b686cd9bca32', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மாவிலிப்பாளையம்', '6', '11.2'),
        ('e294d5bd-56d2-5e31-bce8-651eeb8fd874', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கொங்கணாபுரம் பிரிவு ரோடு', '6', '10.5'),
        ('bc820956-0469-5381-9d0a-32bcb390d95f', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சமுத்திரம்-1', '6', '11.14'),
        ('2808df7e-7ae6-52a3-b988-55f2cc44c411', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சமுத்திரம்-2', '6', '11.14'),
        ('d0e8106d-1e3c-5c87-89d6-2d7303b5af8d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சமுத்திரம்-3', '6', '11.11'),
        ('fc353ae7-6ed8-56ee-a167-764f48e69c26', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சமுத்திரம்-4', '6', '11.07'),
        ('1195e803-b104-5758-9563-ff2646fa36dd', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சமுத்திரம்-5', '6', '11.07'),
        ('1f8f3669-fa4a-565b-a915-873b062d1951', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 முத்தையம்பட்டி அரசுபள்ளி', '6', '11.39'),
        ('1ba5f51e-98a7-5ad4-9919-a7152e10020a', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 முத்தையம்பட்டி', '6', '11.84'),
        ('61c37566-ca89-54f4-af8d-156f567e3f52', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 காட்டூர்', '6', '11.04'),
        ('480ea968-ecfa-5bc8-9b2d-ff24dc7a4d3c', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கரும்பாலை', '6', '11.01'),
        ('4d5fe64f-6eb5-544b-ac6b-e60d114f47dd', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 புதுப்பாளையம் சந்தை', '6', '10.08'),
        ('36478fa1-198f-5efa-9da0-0ae1890ff74f', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 புதுப்பாளையம் மெடிக்கல்', '6', '10.03'),
        ('583502db-c4c7-510b-8ae9-6274023d44c6', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கன்னியாம்பட்டி காட்டுவளவு', '6', '11.2'),
        ('1ea6e369-d030-5dad-aad8-44954c21dba4', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கண்ணியாம்பட்டி', '6', '11.2'),
        ('f08e031b-e340-56af-a786-582862224e96', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 காளியம்மன் கோவில்', '6', '11.2'),
        ('bafcf26d-cf86-56cf-bf27-a53050db5b12', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மூலக்கடை-1', '6', '10.7'),
        ('f7d64f03-cd5b-5964-b8b9-569b55883725', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மூலக்கடை-2', '6', '10.7'),
        ('7ad2d030-b4a1-5361-a438-033f2d7a901d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 பணங்காடு', '6', '10.2'),
        ('3859b85b-85ed-5c75-914a-a0e549854849', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 செக்குமேடு', '6', '10.02'),
        ('a96c58ba-6fd8-5ed9-ba74-414038d04e4b', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 அக்கரைப்பட்டி-1', '6', '11.02'),
        ('a6463d1f-b28a-560b-9d89-e65bf4c85570', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 அக்கரைப்பட்டி-2', '6', '11.02'),
        ('860ecded-6827-5b61-a3fb-23a7d6fb0754', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 அக்கரைப்பட்டி-3', '6', '11.02'),
        ('d58f7149-44cf-50bd-a639-34850c12beea', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மூலப்பாதை (கல்வடங்கம்)', '6', '11.07'),
        ('390ab0da-066d-55a5-ac64-7007d353888d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 அருவங்காட்டூர்-1', '6', '11.08'),
        ('36e6d71a-1b36-5be5-9471-0791edcbe8d5', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 அருவங்காட்டூர்-2', '6', '11.08'),
        ('420dfba3-b13d-574e-861b-bb5acd4c77f9', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 புதூர் மூலக்கடை', '6', '11.03'),
        ('da26522e-06ce-5290-9288-4cb62bd39e3f', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 புதூர்', '6', '11.01'),
        ('6c039c89-38ba-5683-be00-6b0fb58aa1ee', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 நாடார் காலணி-1', '6', '11.1'),
        ('d1706a59-e2ff-5bb4-b8e3-221bf2555bab', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 நாடார் காலணி-2', '6', '11'),
        ('aa040e3e-8460-5274-ae70-b263ae188a00', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 வேலமாவலசு-1', '6', '10.3'),
        ('9172026b-c7a4-5982-a4d2-adbbfb7fbf3d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 பாண்டியமேடு', '6', '10.1'),
        ('bf163397-23e1-5c87-a97c-8fdb2478349e', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 ஆலங்கொட்டாய்-1', '6', '12'),
        ('ffff66a5-315d-5a6d-8c45-935bb9517a1a', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 ஆலங்கொட்டாய்-2', '6', '12'),
        ('9a321956-e70c-5786-ae51-2a048a42d41d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 எட்டிக்குட்டைமேடு-1', '6', '10'),
        ('f93316fa-6749-51c4-b1ab-9a162c235348', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 எட்டிக்குட்டைமேடு-2', '6', '10'),
        ('1e017cb8-a5f0-5426-9e5b-c4fdcac5829e', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மகுடஞ்சாவடி கோயில்', '6', '11.5'),
        ('e1e50fe3-7d77-5136-b1e2-7e98104870df', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மகுடஞ்சாவடி', '6', '11'),
        ('2abe8936-d0b0-56b1-87ea-d62d044ec888', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '5 ஆலக்கொட்டாய்', '6', '10.82'),
        ('35825043-bca8-5c83-87d8-d2487a219213', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 ஏகாபுரம்-2', '6', '10.72'),
        ('78d1e06b-16a1-591c-a0e4-7b9beff53af2', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 ஏகாபுரம்-1', '6', '10.72'),
        ('a01fc0ed-ba0c-5515-9592-d64e070103a5', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மோட்டூர்', '6', '11.07'),
        ('055f42ad-59de-5673-94b3-62ea1a9e9805', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மோட்டூர்-2', '6', '11.07'),
        ('a0c9d28b-6d38-5dea-a0d1-c3aec699791d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மோட்டூர்-1', '6', '11.07'),
        ('62114b7f-9e8e-54b2-b8d6-9c16d0d0994d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கூத்தம்பாளையம்', '6', '11.08'),
        ('20ca5ac4-fc78-5724-8aea-85cdd2c9dcc7', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 அருவங்காட்டூர்', '6', '11.01'),
        ('a45b4ae8-03db-51f2-8a24-ce61e4fb55e4', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 புதுப்பாளையம்', '6', '11.59'),
        ('9d1605e1-ab6c-51c5-bdae-ae4d8b65a3f5', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 பனங்காட்டூர்-1', '6', '10.08'),
        ('02396d1e-bf01-5a95-b09b-5c68c0f3143d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 பனங்காட்டூர்-2', '6', '10.08'),
        ('33c674f3-c7d5-5820-bb7e-575a267b198c', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 குள்ளம்பட்டி', '6', '11.09'),
        ('cb8ff30a-5a30-552b-8f42-cad6e5b2a82e', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மகுடஞ்சாவடி -1', '6', '11.04'),
        ('2ccbdb9e-6ea0-5596-9835-a45826b5b8dc', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மகுடஞ்சாவடி அரசு பள்ளி', '6', '10.05'),
        ('927af1a9-b708-5429-990a-8042cdce84a7', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 குப்பாண்டி பாளையம்-1', '6', '10.01'),
        ('a3b8164c-51af-56dd-a9f2-2a739ef915dc', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 குப்பாண்டி பாளையம்-2', '6', '10.01'),
        ('9ba7a817-0ced-5fc1-b787-f9623bfd550a', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 வெள்ளநாய்க்கன்பாளையம்', '6', '10.2'),
        ('f65f3b26-db98-5caf-8b05-7b4f884e55dc', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', 'வாள அங்காளம்மன் கோவில்', '6', '11.3'),
        ('d88c596f-5997-536b-afc0-92b10854c965', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சுண்ணாம்புகுட்டை', '6', '11.9'),
        ('92312459-46cb-5a4b-9207-8dfdc9e2b11a', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மலையனூர்', '6', '10.5'),
        ('81e6f1ac-51d7-58e0-94aa-d10429a101e2', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 மாரிமுத்தான்', '6', '11.1'),
        ('739ffc75-61cd-5e1f-bd54-8ccddf94abbc', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 நாடார் காலணி', '6', '11.9'),
        ('b3fab89e-93cd-5242-b907-2f2800bd9f82', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 நெட்ட பெருமாள் காடு', '6', '10.2'),
        ('c11c7c5f-181b-553c-9033-4924ba711b16', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 சங்ககிரி எஸ்.கே. நகர்', '6', '11.8 Km'),
        ('91c65383-dbd2-5b23-8637-ca9ead67e53d', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கள்ளுக்கடை-1', '6', '11.3 Km'),
        ('ee4a2f4d-ee3c-5def-96fe-8f4112e415f3', 'd97787d9-a86e-5c5f-a84a-dc334afc2a2a', '6 கள்ளுக்கடை-2', '6', '11.3 Km'),
        ('105ba8ba-f037-5ee1-902f-d59a00de30b6', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கௌதம் மெடிக்கல்', '7', '13.5'),
        ('e3af2941-28d7-5e57-af45-022d5be440a4', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 சந்தைப்பேட்டை', '7', '13.8'),
        ('bc9ee6e6-1bb7-544b-a590-57e7e4096768', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 ஃபயர் சர்வீஸ்', '7', '12.4'),
        ('f88584f1-d0b4-52d7-8acf-6cf7bd6d552a', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கிருஷ்ணா நகர்', '7', '12.7'),
        ('e9006419-4d5f-5c15-bd22-5dedcffe5f82', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 முனியப்பன்கோவில்-2', '7', '13.26'),
        ('f118e3d3-799c-5d0d-9483-2ce13a602f0d', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 பூசாரிவளவு', '7', '13.92'),
        ('7a627483-a097-5368-b346-d65b9557133f', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 பனிக்கனூர் மூலக்கடை', '7', '13.12'),
        ('fad3e087-2133-55d1-a8e5-01ecbf7f1986', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 பனிக்கனூர்', '7', '12.66'),
        ('07424622-33ea-5099-bf19-badc57e19589', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மன்மதன் வளவு', '7', '13.08'),
        ('dc270872-9831-5862-926a-c25ec1260110', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கசப்பேரி', '7', '13.11'),
        ('8b8bb6f4-15fc-5755-8da3-7f6268796f94', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 பனஞ்சாரி', '7', '13.08'),
        ('f23d0aeb-5772-563f-b146-164d5f7e8041', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 ஓடக்காடு', '7', '13.02'),
        ('41fc5f2f-844e-5db7-924e-1a61648ada21', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கனரா வங்கி', '7', '12.04'),
        ('20cc8914-17ce-51b8-9ffc-5d59a46b0daf', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 சின்னப்பம்பட்டி', '7', '12.02'),
        ('768cb32a-c8bd-5c34-9abf-3949d3873bae', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுப்பாளையம்-1', '7', '13.9'),
        ('5a37b799-c0d3-5fbe-83eb-f2ec8ad6bd20', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுப்பாளையம்-2', '7', '13.8'),
        ('c3497406-b50c-5753-8b53-770b85463801', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுப்பாளையம்-3', '7', '13.2'),
        ('bf42e1b0-fa8e-5453-b195-619f17597c31', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுப்பாளையம்-4', '7', '13.1'),
        ('81051a62-aac0-59d5-8b7e-8fcb1edd01f9', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 குள்ளம்பட்டி', '7', '12.09'),
        ('ccbd112d-89f0-51c9-b719-feda04e9ba69', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 பாரதிநகர்', '7', '12.05'),
        ('9de04770-d84a-5c82-a55a-c4b3cb4568a0', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 செங்கானூர்', '7', '13.8'),
        ('d2dc14b4-ad01-5321-91ec-86c1e2651c51', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 சக்தி வேபிரிட்ஜ்', '7', '12.03'),
        ('1938013f-5b10-524b-bbe4-6a67464323b4', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 அத்தனூர்', '7', '13.08'),
        ('35ac5029-1f8e-5045-ba6b-2ee42c80b95e', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுக்காடு-1', '7', '13.03'),
        ('ec31ad85-fb83-5481-adfd-bace793b2356', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுக்காடு-2', '7', '13.03'),
        ('892a8fa9-bceb-5bd0-b81d-eeedb1edf876', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுக்காடு-3', '7', '13.03'),
        ('b40844e2-c611-5786-8e0d-b0cf793f0dcf', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுக்காடு-4', '7', '13.01'),
        ('f5fb422b-4f38-548e-b94e-ed29da2e6595', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுக்காடு-5', '7', '13.01'),
        ('64c37ed7-0851-5435-9141-206f6287df00', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மேட்டுக்காடு-6', '7', '13.01'),
        ('8ac4cc09-bc53-55ce-8bb2-2e030e73adab', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 காச்சக்காரனூர்', '7', '12.06'),
        ('5b981cd6-c3bd-5a64-a045-350a871806a0', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கூத்தம்பாளையம்-1', '7', '12.04'),
        ('e91ac2a7-2da9-5faa-a986-36aa8bdd9c23', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கூத்தம்பாளையம்-2', '7', '12.04'),
        ('0568efc9-5a6a-5def-83be-0be66084327c', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 பொன்னியங்கோவில்', '7', '12.02'),
        ('2677680e-5ee9-5414-9e93-74436ec6fc44', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 பறையங்காட்டானூர்', '7', '13'),
        ('ebe4dcc2-fdc4-5726-a5bf-20ac55d9f8c6', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 வளையசெட்டிப்பட்டி பஸ் ஸ்டாப்', '7', '13.6'),
        ('e9d09ed2-cc47-5d9e-9785-b7a31f8dcfac', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கலியகவுண்டனூர்-1', '7', '13.98'),
        ('5ecbcbf7-2f99-5d1b-bcff-40e6ed7afe48', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கலியகவுண்டனூர்-2', '7', '13.98'),
        ('c77d9578-d3e0-5e7c-9201-41857e164442', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கலியகவுண்டனூர்-3', '7', '13.8'),
        ('fc978fed-36a1-522e-b779-8b2d5dbaaa6f', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கலியகவுண்டனூர்-4', '7', '13.5'),
        ('3ccc6adf-009c-5e69-b009-ed0847944b7c', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கலியகவுண்டனூர்-5', '7', '13.5'),
        ('d713fe8f-3816-5fc4-8b84-2a5161308c90', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மோட்டூர்', '7', '13'),
        ('ddf98834-4619-5b2f-ac17-8b0db3b7b594', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மோட்டூர் பிரிவு', '7', '12.8'),
        ('f9abdc0b-9cc0-536f-a2f4-edca3edc1d52', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 ஏகாபுரம்', '7', '12.6'),
        ('1c3c88b1-d437-5fa2-a15d-1204d70c726d', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 ஏகாபுரம்-1', '7', '12.6'),
        ('0c36d5d8-914f-5eac-8538-29a2ee4d06a8', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 காக்காபாளையம்', '7', '13.3'),
        ('6b8a2481-b9a1-5f10-83ea-ea83d4c14fed', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 R.K. தோப்பு', '7', '13'),
        ('d6456966-3255-5cce-b637-dfbce7034326', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 வடுகப்பட்டி', '7', '13.08'),
        ('894fd371-0a6a-5aa4-9e8a-cba8aa96892f', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 கலியகவுண்டனூர்', '7', '12.05'),
        ('acef75f6-3633-5307-a36a-109465c1f5ae', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 சமுத்திரம்', '7', '13.03'),
        ('7bbab66a-c7f6-5849-ab5e-0d50452c49c1', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 சின்னப்பம்பட்டி -2', '7', '12.03'),
        ('c33123ff-6979-5943-869e-7995b45af082', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மூலப்பாதை எடைநிலையம்', '7', '12.02'),
        ('925f757f-9233-5d84-aff9-0f8fba060dfe', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 வாய்க்கால் பாலம்', '7', '12.09'),
        ('d8d7298e-4bee-5d4e-bc42-f36d9de7fa6b', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 காகாபாளையம்', '7', '13.98'),
        ('1991b488-c921-5bd0-97ed-5a5690a61abc', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 மஞ்சகல்பட்டி', '7', '13.9'),
        ('699714f4-8c5c-51f2-80f6-2350f71096a2', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 எபினேசர் காலனி', '7', '13.8 Km'),
        ('7fae31df-26c0-5c92-8b93-7900fb42babe', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 டி.பி. ரோடு', '7', '14 Km'),
        ('28dc0e2b-c176-5885-b0cd-bd8567bfc3a5', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 திரு ஸ்டுடியோ', '7', '13.8 Km'),
        ('7bea7ea0-f638-5b8a-95d6-b1f1ca6f5bc9', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 சங்ககிரி சந்தைப்பேட்டை', '7', '13.2'),
        ('ecb15abf-e370-5f50-bd1e-2dee78a52fa2', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 வெள்ளக்கவுண்டனூர்', '7', '13 Km'),
        ('d21718d6-8f7d-59e8-a24a-7733492f1126', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 அமலா பள்ளி-1', '7', '12 Km'),
        ('b1789dc0-ed3d-5cca-bb09-710ad04c9b6e', '538e038d-1908-5fc5-a0a5-b50dd4dd1a9e', '7 அமலா பள்ளி-2', '7', '12 Km'),
        ('72ce3a4d-1663-5135-9aa0-123a0e07cd7a', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 தாசங்காடு', '8', '14.8'),
        ('edb97eb9-9a69-5cc3-9db7-c6f23ddeccb4', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 ஆசிரியர் காலனி', '8', '14.08'),
        ('4a07235f-d29e-522a-a65f-14cbee84bbbd', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 முனியம்பட்டி ரைஸ்மில்', '8', '14.74'),
        ('57d460bc-2ea4-5791-a8fb-244627339746', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 தாடிக்காரன்பட்டி', '8', '14.08'),
        ('a63ac98d-e65b-5fa2-9083-b0da6f7c4b09', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 மடத்தூர்', '8', '14.02'),
        ('495cdb7e-85bb-5d1b-942e-8324543f8be8', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 செட்டிப்பட்டி சந்தை', '8', '15.01'),
        ('530fe848-2d6d-5f7b-8041-a1563ffee524', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 பொன்னம்பாளையம்', '8', '15.8'),
        ('fbbc6683-8809-5821-9032-49bbd12008c2', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 காவனூர்', '8', '15.8'),
        ('335f263d-4df1-5d7a-8eae-ca4e533c243a', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 பூமணியூர்', '8', '15.4'),
        ('0be33533-9fb5-5bf4-9413-d2a6c5b3e38e', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 பூச்சிமரத்துக்காடு', '8', '15.8'),
        ('ccf36548-796a-5c6f-bbbe-63a684c12532', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 பூமணியூர் ஸ்கூல்', '8', '15.08'),
        ('8dfd6635-32a3-5be6-8dd9-1a5de4780b66', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 ஒக்கிலிப்பட்டி', '8', '15.06'),
        ('866b5492-8721-556e-baf0-a56e7c0250a0', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 எட்டிக்குட்டைமேடு (கல்வடங்கம்)', '8', '15.04'),
        ('de8ccf10-9b2e-5033-bed6-45b755b964f8', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 தண்ணீர்தாசனூர்', '8', '15.01'),
        ('a451fc65-878d-552d-ab48-d590fb7b52a0', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 அய்யனூர்', '8', '15.08'),
        ('96bb7606-ba24-5356-a539-dba4135f1acb', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 தாடிக்காரனூர்-1', '8', '14.09'),
        ('1052d358-cff7-542d-b762-26e591115881', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 தாடிக்காரனூர்-2', '8', '14.08'),
        ('3889fb5c-21d3-567a-bec7-265eebaa04e6', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 தப்பக்குட்டை பிரிவு', '8', '15.09'),
        ('be89bbed-d491-5d5b-a30d-881be8ab524b', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 குப்பதாசன்வளவு', '8', '15'),
        ('8cb5c441-c2ab-5508-9310-5a9f1f5609b6', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 கூலக்கண்ணன் காடு', '8', '14..8'),
        ('671f48e4-76eb-5285-a4f8-4b34d4d8e381', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 வளையசெட்டிப்பட்டி பிரிவு', '8', '15'),
        ('e04b2014-7670-5431-a5bc-3349e15fb6c9', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 வேம்படிதாளம் பாலம்', '8', '15'),
        ('c22ba4a5-25c3-5af8-9115-561b521a947f', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 கவுண்டனேரி-1', '8', '15.07'),
        ('5b9d31d9-921a-50cb-9e0a-8a9fb37f49a9', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 அத்தனூர்', '8', '15.01'),
        ('12a862bd-04f3-5cb5-9a79-f1e0f5379b43', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 தாடிக்காரனூர்', '8', '15.06'),
        ('43a0ea1e-83b5-5101-80da-f44839c3420f', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 மேட்டுக்காடு', '8', '14.01'),
        ('7db01cf6-2df1-5e57-8431-1c52f6bca389', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 மேட்டுக்காடு விநாயகர் கோவில்', '8', '14.04'),
        ('69527a7b-a93e-5c9c-bdc2-52d83f1247f7', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 பனிக்கனுர்', '8', '15.03'),
        ('2c03fc43-7939-5940-9a96-6e06f5369be5', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 முனியம்பட்டி', '8', '15.98'),
        ('19c00fcc-b3f0-5700-bb01-fe05b038de05', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 முனியப்பன் கோவில்', '8', '15.98'),
        ('82feb030-65b8-5f38-bdd9-b985a09c5dff', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 வேம்படிதாளம்', '8', '15.08'),
        ('b24b5cfa-ef3d-597d-aeb8-e7d5fb400043', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 பனங்காடு', '8', NULL),
        ('214264de-bed1-5c22-82a3-82dd789bb7a4', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 செட்டிமாங்குறிச்சி', '8', '13.6'),
        ('2ca73ee6-3582-5af4-94ef-719ab4e9929d', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 ரெயின்போ காலனி', '8', '15.2 Km'),
        ('8a8ec2d5-3648-5b23-9f7a-67883554bb27', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 கொங்கு நகர்', '8', '14.6 Km'),
        ('a82ca0dd-788b-581c-b39d-87272b23e511', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 பில்லுக்குறிச்சி', '8', '14.5 Km'),
        ('e8fdc011-0d76-5d2e-a47b-25f0a5afa264', 'b9a479d1-d249-566a-b1b8-67979dd1be84', '8 பில்லுக்குறிச்சி வே பிரிட்ஜ்', '8', '14.3'),
        ('cba32efc-ccf7-5c26-b9c9-71e2c619b379', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 மயிலம்பட்டி', '9', '20.02'),
        ('a1631338-716f-5b4c-8536-7f658555330a', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 கொட்டாயூர்', '9', '17.08'),
        ('344c8d64-eb88-54b5-8b0b-9e575b0f740d', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 கல்வடங்கம்', '9', '18.04'),
        ('079a5476-6308-5417-8022-aa5e1ad38ee1', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 இளம்பிள்ளை-கறிக்கடை', '9', '18'),
        ('9ad4301f-1428-51ab-88ce-7638783d3edb', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 புளியம்பட்டி', '9', '20.2'),
        ('93e3fbd8-0799-50b0-8bd4-0ec075e5440a', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 இளம்பிள்ளை நான்கு ரோடு', '9', '19.9'),
        ('2ed09bd5-f1c1-59cd-8a60-68776020673e', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 இளம்பிள்ளை', '9', '19.9'),
        ('e0ae47fb-5bc1-5712-bc5b-cb588c4fa5f1', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 இளம்பிள்ளை ராதா மெடிக்கல்ஸ்', '9', '20.2'),
        ('681aac8f-47ca-5cce-bfac-634e4d5103fd', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 ராஜன் கண் மருத்துவமனை', '9', '19.6'),
        ('98d9dcb8-a8f9-5d9f-8cef-f412023da548', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 இளம்பிள்ளை ஏரிக்கரை', '9', '19.2'),
        ('2e35a564-f4d0-57e7-8a42-4308cd5bf7d9', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 வாரி பேக்கரி', '9', '19.2'),
        ('8e114392-18da-51e6-b81e-07f8499f837a', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 ராமாபுரம்', '9', '19.5'),
        ('588d530c-acb4-5485-a6a0-8d6a31554168', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 மண்கரடு பிரிவு', '9', '19.2'),
        ('5af183e4-826e-50ab-a5cb-31990f291937', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 பெருமாகவுண்டம்பட்டி', '9', '18.6'),
        ('dd117739-cd83-5e47-b2e4-045be33b9fc4', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 வேம்படிதாளம்', '9', '17.8'),
        ('0f0983f9-87db-5b54-ad58-a80e806ae2b3', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 பெருமாகவுண்டம்பட்டி-3', '9', '18.6'),
        ('4f96a969-8a43-5e3d-9582-b6252b6ef8af', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 பாட்டப்பன் நகர்', '9', '17.01'),
        ('6b7c0f45-d39b-527d-9f11-cb9ccb0bf6ad', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 தேவூர்', '9', '19.08'),
        ('98cd73ca-bf1e-54f2-8ab6-07979baa5ffc', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 செட்டிப்பட்டி', '9', '16.05'),
        ('eb0154ce-e216-5e18-b3c3-a25586174edc', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 கரையானூர் பிரிவு', '9', '16.01'),
        ('b0248ca9-c083-5dc3-aedd-876338985147', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 ராதா மெடிக்கல்ஸ்', '9', '20.06'),
        ('2777e604-ddfb-5f71-b5f4-98a03d755841', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 சந்தைப்பேட்டை', '9', '19.05'),
        ('13792eef-86c0-5329-825b-a1c0da2b1d2b', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 பெருமாகவுண்டம்பட்டி ஹைஸ்கூல்', '9', '18.07'),
        ('868b8117-0c7f-5a99-96ae-17da2d426ab9', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 ஜலகண்டாபுரம்', '9', '20.4'),
        ('a4235833-6ced-5f90-9d8e-71ff2b05daf6', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 கட்டிநாய்க்கன்பட்டி', '9', '19.5'),
        ('c0938f7a-fe25-549e-89b0-81c035dc9e7a', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 குருக்குப்பட்டி', '9', '18.1'),
        ('89fa5d9d-e433-5b9c-91d0-cc773104f322', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 சக்தி நகர்', '9', '17.4 Km'),
        ('4254e892-270f-58d5-a07f-bb8a52bd80ea', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 பூலாம்பட்டி பங்', '9', '18.4'),
        ('b99da419-6f02-52e8-8484-322abbfb1d8c', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 காட்டூர்-1', '9', '18.4'),
        ('f9d77526-e5ea-54ac-9bab-43b1e16ac383', '3f06de48-b419-50a5-925b-5a41600ba7a3', '9 காட்டூர்-2', '9', '18.4')
    ON CONFLICT ("id") DO NOTHING;
END $$;
    v_grade_0 text := '289ea7b4-c218-4c62-bda5-fdc1c3955252';
    v_grade_1 text := 'c80184f8-9027-4156-875d-877c1b514fb9';
    v_grade_2 text := '2aea7749-be03-488b-9f77-f64bd557cb24';
    v_grade_3 text := 'a9e640cd-ef78-40c2-8b20-3dc5c31d7a8e';
    v_grade_4 text := 'ea837179-56cd-4273-a697-ede4f8532628';
    v_grade_5 text := '07b6e82f-8f89-443b-a78a-7b6c4f5d7e80';
    v_grade_6 text := 'd26ef0de-1c18-4e8f-9a20-f710b9c3e568';
    v_grade_7 text := 'cc04462b-ac5b-4498-a15c-d1767f1fd741';
    v_grade_8 text := '578ff29d-5ecb-462d-af4e-975bfb540178';
    v_grade_9 text := 'a2676d67-70ec-418e-8da7-02ee839540f1';
    v_grade_10 text := '0038ed3c-06d9-416d-ae1b-ee7b6c17dc3c';
    v_grade_11 text := '2417b96c-a304-4e64-a666-39565aaf678f';
    v_grade_12 text := '6dee8e0b-d3c7-4a0a-b562-0149055a495c';
    v_grade_13 text := '556c0918-fe08-4e36-9946-8ec50dfae2d1';
    v_grade_14 text := '9e387ec4-9242-4699-9ac8-278385f20e24';
    v_grade_15 text := '95c4ac58-3ebb-4689-ad40-6dfd355b4094';
    v_grade_16 text := '745d7110-2638-4b18-a775-7cf50918f4bc';
    v_grade_17 text := 'c8719d84-3e4a-4b28-b1b1-7461bbd69612';
    v_grade_18 text := 'ca63e5da-eac2-42b6-8bcb-66f1cd1b7f11';
    v_grade_19 text := 'af31f1fd-dd70-4c4c-afc9-2444cd21e44e';
    v_grade_20 text := '6411f64b-f175-4912-bbb7-bd02d33914e8';
    v_grade_21 text := '7285f4b5-b2b3-4f37-a833-e7c2a560d9ad';

