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
    v_grade_0      TEXT := 'seed-grade-0';
    v_grade_1      TEXT := 'seed-grade-1';
    v_grade_2      TEXT := 'seed-grade-2';
    v_grade_3      TEXT := 'seed-grade-3';
    v_grade_4      TEXT := 'seed-grade-4';
    v_grade_5      TEXT := 'seed-grade-5';
    v_grade_6      TEXT := 'seed-grade-6';
    v_grade_7      TEXT := 'seed-grade-7';
    v_grade_8      TEXT := 'seed-grade-8';
    v_grade_9      TEXT := 'seed-grade-9';
    v_grade_10      TEXT := 'seed-grade-10';
    v_grade_11      TEXT := 'seed-grade-11';
    v_grade_12      TEXT := 'seed-grade-12';
    v_grade_13      TEXT := 'seed-grade-13';
    v_grade_14      TEXT := 'seed-grade-14';
    v_grade_15      TEXT := 'seed-grade-15';
    v_grade_16      TEXT := 'seed-grade-16';
    v_grade_17      TEXT := 'seed-grade-17';
    v_grade_18      TEXT := 'seed-grade-18';
    v_grade_19      TEXT := 'seed-grade-19';
    v_grade_20      TEXT := 'seed-grade-20';
    v_grade_21      TEXT := 'seed-grade-21';

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
        (gen_random_uuid()::text, 'KG 1 (PRE-KG)', 0, 0, 50, 70, 1, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'KG 2 (JKG)', 34, 1, 35, 70, 2, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'KG 3 (SKG)', 50, 7, 10, 70, 3, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 1 - YAAZH', 45, 1, 2, 35, 4, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 1 (ACS)', 29, 0, 1, 30, 5, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 2 (YAAZH & VEENAI)', 49, 0, 12, 70, 6, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 2 (ACS)', 28, 1, 0, 30, 7, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 3', 62, 0, 9, 70, 8, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 3 (ACS)', 25, 0, 0, 30, 9, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 4', 40, 6, 1, 35, 10, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 4 (ACS)', 27, 1, 0, 30, 11, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 5 Yaazh', 39, 5, 3, 35, 12, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 5 (ACS)', 26, 2, 0, 30, 13, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 6', 71, 18, 12, 70, 14, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 7', 64, 6, 9, 70, 15, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 8', 64, 12, 7, 70, 16, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 9', 65, 8, 2, 70, 17, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 10', 67, 0, 1, 70, 18, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Grade 11', 53, 22, 9, 60, 19, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, '12 Bio/Math', 19, 1, 0, 19, 20, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, '12 Math / CS', 18, 1, 0, 18, 21, v_ay_id, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, '12 Arts', 3, 1, 0, 3, 22, v_ay_id, CURRENT_TIMESTAMP)
    ON CONFLICT ("className", "academicYearId") DO NOTHING;

END $$;

COMMIT;

-- Transport Seed Data --
INSERT INTO "bus_routes" ("id", "routeNo", "name", "isActive", "createdAt") VALUES
  ('cmqnk5z7u002orgvfwkrfdomk', 'Stage 1', 'Stage 1 (<= 2.0 Km)', true, '2026-06-21T09:02:24.139Z'),
  ('cmqnk5z9g005brgvfxjnv9435', 'Stage 2', 'Stage 2 (2.1 - 4.0 Km)', true, '2026-06-21T09:02:24.196Z'),
  ('cmqnk5zbo0096rgvfdik01mta', 'Stage 3', 'Stage 3 (4.1 - 6.0 Km)', true, '2026-06-21T09:02:24.277Z'),
  ('cmqnk5ze200dbrgvfzvn6pus1', 'Stage 4', 'Stage 4 (6.1 - 8.0 Km)', true, '2026-06-21T09:02:24.362Z'),
  ('cmqnk5zh200iyrgvfq059hec9', 'Stage 5', 'Stage 5 (8.1 - 10.0 Km)', true, '2026-06-21T09:02:24.470Z'),
  ('cmqnk5zkc00pnrgvfj00q3tsb', 'Stage 6', 'Stage 6 (10.1 - 12.0 Km)', true, '2026-06-21T09:02:24.589Z'),
  ('cmqnk5zlu00smrgvf5m5nqtdf', 'Stage 7', 'Stage 7 (12.1 - 14.0 Km)', true, '2026-06-21T09:02:24.643Z'),
  ('cmqnk5zn000v1rgvfbo7396kg', 'Stage 8', 'Stage 8 (14.1 - 16.0 Km)', true, '2026-06-21T09:02:24.684Z'),
  ('cmqnk5znl00w8rgvftn2jxo0k', 'Stage 9', 'Stage 9 (> 16.0 Km)', true, '2026-06-21T09:02:24.706Z');

INSERT INTO "bus_stops" ("id", "routeId", "stopName", "stage", "pickupTime", "dropTime", "distance", "createdAt") VALUES
  ('cmqnk5z7w002qrgvf4yhjgbcc', 'cmqnk5z7u002orgvfwkrfdomk', 'லட்சுமி நகர்', 'Stage 1', NULL, NULL, '1.74 Km', '2026-06-21T09:02:24.140Z'),
  ('cmqnk5z83002srgvfchg6ee2v', 'cmqnk5z7u002orgvfwkrfdomk', 'ஸ்ரீமஹால்', 'Stage 1', NULL, NULL, '1.66 Km', '2026-06-21T09:02:24.148Z'),
  ('cmqnk5z85002urgvf83nkb9mu', 'cmqnk5z7u002orgvfwkrfdomk', 'தோட்டக்காடு', 'Stage 1', NULL, NULL, '1.91 Km', '2026-06-21T09:02:24.149Z'),
  ('cmqnk5z86002wrgvfjn1u7i4b', 'cmqnk5z7u002orgvfwkrfdomk', 'மாடர்ன்வேபிரிட்ஜ்', 'Stage 1', NULL, NULL, '1.73 Km', '2026-06-21T09:02:24.150Z'),
  ('cmqnk5z87002yrgvfccod8nxq', 'cmqnk5z7u002orgvfwkrfdomk', 'மடத்தூர்', 'Stage 1', NULL, NULL, '1.99 Km', '2026-06-21T09:02:24.151Z'),
  ('cmqnk5z880030rgvfh4g6gymq', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம் அரசுப்பள்ளி-1', 'Stage 1', NULL, NULL, '1.93 Km', '2026-06-21T09:02:24.152Z'),
  ('cmqnk5z890032rgvf3exuk3sy', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம் அரசுப்பள்ளி-2', 'Stage 1', NULL, NULL, '1.93 Km', '2026-06-21T09:02:24.153Z'),
  ('cmqnk5z8a0034rgvf6bb6eb2d', 'cmqnk5z7u002orgvfwkrfdomk', 'சிமெண்ட் கடை', 'Stage 1', NULL, NULL, '1.79 Km', '2026-06-21T09:02:24.154Z'),
  ('cmqnk5z8b0036rgvf38x9eapk', 'cmqnk5z7u002orgvfwkrfdomk', 'பச்சாங்காடு பிரிவு', 'Stage 1', NULL, NULL, '1.74 Km', '2026-06-21T09:02:24.155Z'),
  ('cmqnk5z8b0038rgvf1y74x4n4', 'cmqnk5z7u002orgvfwkrfdomk', 'காட்டூர்-6', 'Stage 1', NULL, NULL, '2.0 Km', '2026-06-21T09:02:24.156Z'),
  ('cmqnk5z8c003argvfpu6cd3l7', 'cmqnk5z7u002orgvfwkrfdomk', 'காட்டூர்-7', 'Stage 1', NULL, NULL, '1.7 Km', '2026-06-21T09:02:24.157Z'),
  ('cmqnk5z8e003crgvf7ox432iv', 'cmqnk5z7u002orgvfwkrfdomk', 'காட்டூர்-8', 'Stage 1', NULL, NULL, '1.2 Km', '2026-06-21T09:02:24.159Z'),
  ('cmqnk5z8g003ergvfic8o5ogi', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம்-மொரம்பக்காடு-1', 'Stage 1', NULL, NULL, '1.8 Km', '2026-06-21T09:02:24.160Z'),
  ('cmqnk5z8h003grgvfhe5mg5y4', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம்-மொரம்பக்காடு-2', 'Stage 1', NULL, NULL, '1.7 Km', '2026-06-21T09:02:24.161Z'),
  ('cmqnk5z8i003irgvfz0po4u3s', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம்-மொரம்பக்காடு-3', 'Stage 1', NULL, NULL, '1.6 Km', '2026-06-21T09:02:24.162Z'),
  ('cmqnk5z8j003krgvf22ufmelh', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம்-ஸ்டேட் பேங்க்', 'Stage 1', NULL, NULL, '1.2 Km', '2026-06-21T09:02:24.163Z'),
  ('cmqnk5z8k003mrgvffymcn21j', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம் பேக்கரி', 'Stage 1', NULL, NULL, '1.0 Km', '2026-06-21T09:02:24.164Z'),
  ('cmqnk5z8l003orgvfzksjpphs', 'cmqnk5z7u002orgvfwkrfdomk', 'மேட்டுக்காடு டேங்க்', 'Stage 1', NULL, NULL, '1.92 Km', '2026-06-21T09:02:24.165Z'),
  ('cmqnk5z8l003qrgvfw4zfdfrl', 'cmqnk5z7u002orgvfwkrfdomk', 'குண்டுரம்பாளையம்', 'Stage 1', NULL, NULL, '1.19 Km', '2026-06-21T09:02:24.166Z'),
  ('cmqnk5z8m003srgvf3y1m6f9q', 'cmqnk5z7u002orgvfwkrfdomk', 'எண்ணெய் மண்டி-2', 'Stage 1', NULL, NULL, '1.76 Km', '2026-06-21T09:02:24.167Z'),
  ('cmqnk5z8n003urgvf8uofgxdy', 'cmqnk5z7u002orgvfwkrfdomk', 'பைபாஸ்-1', 'Stage 1', NULL, NULL, '1.85 Km', '2026-06-21T09:02:24.168Z'),
  ('cmqnk5z8o003wrgvfqjx1u5dq', 'cmqnk5z7u002orgvfwkrfdomk', 'பைபாஸ்-2', 'Stage 1', NULL, NULL, '1.85 Km', '2026-06-21T09:02:24.168Z'),
  ('cmqnk5z8p003yrgvfg99ve8w9', 'cmqnk5z7u002orgvfwkrfdomk', 'பைபாஸ்-3', 'Stage 1', NULL, NULL, '1.85 Km', '2026-06-21T09:02:24.169Z'),
  ('cmqnk5z8q0040rgvf9vlt35du', 'cmqnk5z7u002orgvfwkrfdomk', 'பைபாஸ்-4', 'Stage 1', NULL, NULL, '1.85 Km', '2026-06-21T09:02:24.170Z'),
  ('cmqnk5z8r0042rgvfhki53ns5', 'cmqnk5z7u002orgvfwkrfdomk', 'வைகுந்தம் ரோடு', 'Stage 1', NULL, NULL, '1.59 Km', '2026-06-21T09:02:24.171Z'),
  ('cmqnk5z8r0044rgvfgm64gidt', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம் பஸ் ஸ்டாப்-1', 'Stage 1', NULL, NULL, '1.28 Km', '2026-06-21T09:02:24.172Z'),
  ('cmqnk5z8s0046rgvfqq5dkkhf', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம் பஸ் ஸ்டாப்-2', 'Stage 1', NULL, NULL, '1.28 Km', '2026-06-21T09:02:24.173Z'),
  ('cmqnk5z8u0048rgvfj4c7aqfn', 'cmqnk5z7u002orgvfwkrfdomk', 'சாந்தி சில்க் ஹவுஸ்', 'Stage 1', NULL, NULL, '1.07 Km', '2026-06-21T09:02:24.175Z'),
  ('cmqnk5z8w004argvfpokn0nku', 'cmqnk5z7u002orgvfwkrfdomk', 'ரெங்கபாளையம்-1', 'Stage 1', NULL, NULL, '1.02 Km', '2026-06-21T09:02:24.176Z'),
  ('cmqnk5z8x004crgvfwkr579j9', 'cmqnk5z7u002orgvfwkrfdomk', 'ரெங்கபாளையம்-2', 'Stage 1', NULL, NULL, '1.02 Km', '2026-06-21T09:02:24.177Z'),
  ('cmqnk5z8y004ergvf227lf132', 'cmqnk5z7u002orgvfwkrfdomk', 'ரெங்கபாளையம்-3', 'Stage 1', NULL, NULL, '1.02 Km', '2026-06-21T09:02:24.178Z'),
  ('cmqnk5z8z004grgvfvn9x5ojr', 'cmqnk5z7u002orgvfwkrfdomk', 'ரங்கம்பாளையம்-1', 'Stage 1', NULL, NULL, '1.23 Km', '2026-06-21T09:02:24.179Z'),
  ('cmqnk5z90004irgvfwwgpk8hc', 'cmqnk5z7u002orgvfwkrfdomk', 'ரங்கம்பாளையம்-2', 'Stage 1', NULL, NULL, '1.05 Km', '2026-06-21T09:02:24.181Z'),
  ('cmqnk5z91004krgvfv42k5btq', 'cmqnk5z7u002orgvfwkrfdomk', 'மோரி வளவு', 'Stage 1', NULL, NULL, '1.23 Km', '2026-06-21T09:02:24.182Z'),
  ('cmqnk5z92004mrgvfogwhjz2w', 'cmqnk5z7u002orgvfwkrfdomk', 'பாலாஜி பர்னிச்சர்', 'Stage 1', NULL, NULL, '1.54 Km', '2026-06-21T09:02:24.183Z'),
  ('cmqnk5z93004orgvff82zhwva', 'cmqnk5z7u002orgvfwkrfdomk', 'ரெட்டிப்பட்டி பார்க்', 'Stage 1', NULL, NULL, '1.77 Km', '2026-06-21T09:02:24.184Z'),
  ('cmqnk5z94004qrgvfsdlnd2u4', 'cmqnk5z7u002orgvfwkrfdomk', 'ரெட்டிப்பட்டி', 'Stage 1', NULL, NULL, '1.78 Km', '2026-06-21T09:02:24.185Z'),
  ('cmqnk5z95004srgvfux4w7o6x', 'cmqnk5z7u002orgvfwkrfdomk', 'வைகுந்தம் பிரிவு ரோடு', 'Stage 1', NULL, NULL, '1.69 Km', '2026-06-21T09:02:24.185Z'),
  ('cmqnk5z96004urgvf1hdl32xc', 'cmqnk5z7u002orgvfwkrfdomk', 'பெரிய மாரியம்மன் கோவில் பிரிவு', 'Stage 1', NULL, NULL, '1.45 Km', '2026-06-21T09:02:24.186Z'),
  ('cmqnk5z97004wrgvfnkrosxax', 'cmqnk5z7u002orgvfwkrfdomk', 'கே.எஸ்.நகர்-1', 'Stage 1', NULL, NULL, '1.71 Km', '2026-06-21T09:02:24.187Z'),
  ('cmqnk5z98004yrgvf0wns2bmp', 'cmqnk5z7u002orgvfwkrfdomk', 'கே.எஸ்.நகர்-2', 'Stage 1', NULL, NULL, '1.65 Km', '2026-06-21T09:02:24.188Z'),
  ('cmqnk5z980050rgvfpwsd6goy', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம் காவல் நிலையம்', 'Stage 1', NULL, NULL, '1.65 Km', '2026-06-21T09:02:24.189Z'),
  ('cmqnk5z9a0052rgvflm1a99gt', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம் அரசு பள்ளி', 'Stage 1', NULL, NULL, '1.98 Km', '2026-06-21T09:02:24.190Z'),
  ('cmqnk5z9c0054rgvfi1kh5aot', 'cmqnk5z7u002orgvfwkrfdomk', 'கொங்கணாபுரம்', 'Stage 1', NULL, NULL, '1.31 Km', '2026-06-21T09:02:24.192Z'),
  ('cmqnk5z9d0056rgvf7rjc3239', 'cmqnk5z7u002orgvfwkrfdomk', 'மாரியம்மன் கோவில்', 'Stage 1', NULL, NULL, '1.45 Km', '2026-06-21T09:02:24.194Z'),
  ('cmqnk5z9e0058rgvfnzsgwxk6', 'cmqnk5z7u002orgvfwkrfdomk', 'குண்டரசம்பாளையம்', 'Stage 1', NULL, NULL, '0.4 Km', '2026-06-21T09:02:24.194Z'),
  ('cmqnk5z9f005argvfyzepr680', 'cmqnk5z7u002orgvfwkrfdomk', 'குண்டரசம்பாளையம் முள்ளிக்காடு', 'Stage 1', NULL, NULL, '0.4 Km', '2026-06-21T09:02:24.195Z'),
  ('cmqnk5z9h005drgvf5dw7xzpc', 'cmqnk5z9g005brgvfxjnv9435', 'ஸ்ரீஅம்மன் நகர் பருத்தி மில்', 'Stage 2', NULL, NULL, '3.4 Km', '2026-06-21T09:02:24.197Z'),
  ('cmqnk5z9i005frgvflsl305cj', 'cmqnk5z9g005brgvfxjnv9435', 'மட்டம்பட்டி', 'Stage 2', NULL, NULL, '3.58 Km', '2026-06-21T09:02:24.198Z'),
  ('cmqnk5z9j005hrgvf6g15zrx3', 'cmqnk5z9g005brgvfxjnv9435', 'வேல்முருகன் மில்', 'Stage 2', NULL, NULL, '3.55 Km', '2026-06-21T09:02:24.199Z'),
  ('cmqnk5z9k005jrgvfywbdnknx', 'cmqnk5z9g005brgvfxjnv9435', 'எருமைப்பட்டி பிரிவு', 'Stage 2', NULL, NULL, '3.55 Km', '2026-06-21T09:02:24.200Z'),
  ('cmqnk5z9l005lrgvfqnoynkjg', 'cmqnk5z9g005brgvfxjnv9435', 'முத்துசாமி மில்', 'Stage 2', NULL, NULL, '3.75 Km', '2026-06-21T09:02:24.201Z'),
  ('cmqnk5z9l005nrgvfd5blij3a', 'cmqnk5z9g005brgvfxjnv9435', 'ஓடுவன்காட்டுவளவு', 'Stage 2', NULL, NULL, '3.8 Km', '2026-06-21T09:02:24.202Z'),
  ('cmqnk5z9n005prgvffihh3klk', 'cmqnk5z9g005brgvfxjnv9435', 'ஆனைக்காட்டூர் தென்னைமரம்', 'Stage 2', NULL, NULL, '2.72 Km', '2026-06-21T09:02:24.203Z'),
  ('cmqnk5z9o005rrgvfyhemx670', 'cmqnk5z9g005brgvfxjnv9435', 'கட்டியனூர்', 'Stage 2', NULL, NULL, '2.88 Km', '2026-06-21T09:02:24.204Z'),
  ('cmqnk5z9o005trgvfr4p9gclz', 'cmqnk5z9g005brgvfxjnv9435', 'கோரக்குட்டப்பட்டி', 'Stage 2', NULL, NULL, '3.32 Km', '2026-06-21T09:02:24.205Z'),
  ('cmqnk5z9q005vrgvft1si9dix', 'cmqnk5z9g005brgvfxjnv9435', 'அய்யம்பாளையம்', 'Stage 2', NULL, NULL, '3.66 Km', '2026-06-21T09:02:24.206Z'),
  ('cmqnk5z9r005xrgvfgdjymz6n', 'cmqnk5z9g005brgvfxjnv9435', 'தொண்டிபாளையம்', 'Stage 2', NULL, NULL, '3.95 Km', '2026-06-21T09:02:24.208Z'),
  ('cmqnk5z9t005zrgvfmobdakii', 'cmqnk5z9g005brgvfxjnv9435', 'மசக்குமாரபாளையம்', 'Stage 2', NULL, NULL, '3.75 Km', '2026-06-21T09:02:24.209Z'),
  ('cmqnk5z9u0061rgvf8mmkh2to', 'cmqnk5z9g005brgvfxjnv9435', 'ஆயில் மில்', 'Stage 2', NULL, NULL, '2.82 Km', '2026-06-21T09:02:24.210Z'),
  ('cmqnk5z9v0063rgvfafwrjk1p', 'cmqnk5z9g005brgvfxjnv9435', 'வெள்ளக்கல்பட்டி-1', 'Stage 2', NULL, NULL, '3.85 Km', '2026-06-21T09:02:24.211Z'),
  ('cmqnk5z9w0065rgvfa2v6t8yd', 'cmqnk5z9g005brgvfxjnv9435', 'வெள்ளக்கல்பட்டி-2', 'Stage 2', NULL, NULL, '3.97 Km', '2026-06-21T09:02:24.212Z'),
  ('cmqnk5z9x0067rgvflivpifmq', 'cmqnk5z9g005brgvfxjnv9435', 'வெள்ளக்கல்பட்டி பால் சென்டர்', 'Stage 2', NULL, NULL, '3.81 Km', '2026-06-21T09:02:24.213Z'),
  ('cmqnk5za40069rgvffqxtkpcn', 'cmqnk5z9g005brgvfxjnv9435', 'மாரியம்மன் கோவில்-1', 'Stage 2', NULL, NULL, '3.97 Km', '2026-06-21T09:02:24.221Z'),
  ('cmqnk5za5006brgvfskk1qfz5', 'cmqnk5z9g005brgvfxjnv9435', 'மாரியம்மன் கோவில்-2', 'Stage 2', NULL, NULL, '3.97 Km', '2026-06-21T09:02:24.222Z'),
  ('cmqnk5za6006drgvf9y30wyz2', 'cmqnk5z9g005brgvfxjnv9435', 'வெட்டுக்காடு', 'Stage 2', NULL, NULL, '2.5 Km', '2026-06-21T09:02:24.223Z'),
  ('cmqnk5za8006frgvf20fzasvc', 'cmqnk5z9g005brgvfxjnv9435', 'ஆசாரி பட்டறை', 'Stage 2', NULL, NULL, '4.0 Km', '2026-06-21T09:02:24.224Z'),
  ('cmqnk5za9006hrgvfhgkhxm9q', 'cmqnk5z9g005brgvfxjnv9435', 'அலகாபாத் வங்கி', 'Stage 2', NULL, NULL, '3.74 Km', '2026-06-21T09:02:24.226Z'),
  ('cmqnk5zaa006jrgvfsds1g2ca', 'cmqnk5z9g005brgvfxjnv9435', 'சுண்ணாம்புபுதூர்', 'Stage 2', NULL, NULL, '3.64 Km', '2026-06-21T09:02:24.227Z'),
  ('cmqnk5zab006lrgvflppfyi04', 'cmqnk5z9g005brgvfxjnv9435', 'நத்தக்காட்டூர்-1', 'Stage 2', NULL, NULL, '3.41 Km', '2026-06-21T09:02:24.228Z'),
  ('cmqnk5zac006nrgvfy4r26nff', 'cmqnk5z9g005brgvfxjnv9435', 'நத்தக்காட்டூர்-2', 'Stage 2', NULL, NULL, '2.99 Km', '2026-06-21T09:02:24.229Z'),
  ('cmqnk5zad006prgvfa8icpz4u', 'cmqnk5z9g005brgvfxjnv9435', 'காட்டுவளவு', 'Stage 2', NULL, NULL, '2.14 Km', '2026-06-21T09:02:24.229Z'),
  ('cmqnk5zae006rrgvfktmwkh16', 'cmqnk5z9g005brgvfxjnv9435', 'செக்காங்காடு-3', 'Stage 2', NULL, NULL, '3.52 Km', '2026-06-21T09:02:24.230Z'),
  ('cmqnk5zaf006trgvf33ldahkq', 'cmqnk5z9g005brgvfxjnv9435', 'செக்காங்காடு-2', 'Stage 2', NULL, NULL, '3.63 Km', '2026-06-21T09:02:24.231Z'),
  ('cmqnk5zag006vrgvf4d7p41qo', 'cmqnk5z9g005brgvfxjnv9435', 'செக்காங்காடு-1', 'Stage 2', NULL, NULL, '3.82 Km', '2026-06-21T09:02:24.233Z'),
  ('cmqnk5zah006xrgvfpgpxm0ar', 'cmqnk5z9g005brgvfxjnv9435', 'எருமைப்பட்டி ஊராட்சி நிலையம்', 'Stage 2', NULL, NULL, '3.15 Km', '2026-06-21T09:02:24.234Z'),
  ('cmqnk5zai006zrgvfs66z8c1w', 'cmqnk5z9g005brgvfxjnv9435', 'காவடிகாரனூர் கோவில்', 'Stage 2', NULL, NULL, '3.8 Km', '2026-06-21T09:02:24.234Z'),
  ('cmqnk5zaj0071rgvfszvc4kyy', 'cmqnk5z9g005brgvfxjnv9435', 'சேலத்தான்காடு-1', 'Stage 2', NULL, NULL, '3.5 Km', '2026-06-21T09:02:24.235Z'),
  ('cmqnk5zak0073rgvfmoc91fuc', 'cmqnk5z9g005brgvfxjnv9435', 'சேலத்தான்காடு-2', 'Stage 2', NULL, NULL, '3.2 Km', '2026-06-21T09:02:24.236Z'),
  ('cmqnk5zal0075rgvfbzdk5bjz', 'cmqnk5z9g005brgvfxjnv9435', 'சேலத்தான்காடு-3', 'Stage 2', NULL, NULL, '3.2 Km', '2026-06-21T09:02:24.237Z'),
  ('cmqnk5zam0077rgvf951tk4q7', 'cmqnk5z9g005brgvfxjnv9435', 'காட்டூர்-1', 'Stage 2', NULL, NULL, '2.7 Km', '2026-06-21T09:02:24.238Z'),
  ('cmqnk5zan0079rgvfia7soddr', 'cmqnk5z9g005brgvfxjnv9435', 'காட்டூர்-2', 'Stage 2', NULL, NULL, '2.3 Km', '2026-06-21T09:02:24.239Z'),
  ('cmqnk5zap007brgvf026bzd27', 'cmqnk5z9g005brgvfxjnv9435', 'காட்டூர்-3', 'Stage 2', NULL, NULL, '2.1 Km', '2026-06-21T09:02:24.241Z'),
  ('cmqnk5zaq007drgvfd74k2k8g', 'cmqnk5z9g005brgvfxjnv9435', 'காட்டூர்-4', 'Stage 2', NULL, NULL, '2.0 Km', '2026-06-21T09:02:24.243Z'),
  ('cmqnk5zar007frgvfhw1quto1', 'cmqnk5z9g005brgvfxjnv9435', 'காட்டூர்-5', 'Stage 2', NULL, NULL, '2.2 Km', '2026-06-21T09:02:24.244Z'),
  ('cmqnk5zas007hrgvfhu0093qs', 'cmqnk5z9g005brgvfxjnv9435', 'கொங்கணாபுரம்-குமரன்நகர்-2', 'Stage 2', NULL, NULL, '2.2 Km', '2026-06-21T09:02:24.245Z'),
  ('cmqnk5zat007jrgvfnpasltel', 'cmqnk5z9g005brgvfxjnv9435', 'கொங்கணாபுரம்-குமரன்நகர்-3', 'Stage 2', NULL, NULL, '2.1 Km', '2026-06-21T09:02:24.246Z'),
  ('cmqnk5zau007lrgvf2b1sbr27', 'cmqnk5z9g005brgvfxjnv9435', 'கல்கி கேஸ்குடோன்-1', 'Stage 2', NULL, NULL, '3.24 Km', '2026-06-21T09:02:24.247Z'),
  ('cmqnk5zav007nrgvfnmjt6wwv', 'cmqnk5z9g005brgvfxjnv9435', 'கல்கி கேஸ்குடோன்-2', 'Stage 2', NULL, NULL, '3.24 Km', '2026-06-21T09:02:24.248Z'),
  ('cmqnk5zaw007prgvfuoypsm2z', 'cmqnk5z9g005brgvfxjnv9435', 'எட்டிமரத்தான் காடு', 'Stage 2', NULL, NULL, '2.37 Km', '2026-06-21T09:02:24.249Z'),
  ('cmqnk5zax007rrgvfzgm8urk5', 'cmqnk5z9g005brgvfxjnv9435', 'கொங்குப்பட்டி-1', 'Stage 2', NULL, NULL, '2.61 Km', '2026-06-21T09:02:24.249Z'),
  ('cmqnk5zay007trgvf2ybl8n2s', 'cmqnk5z9g005brgvfxjnv9435', 'குறிக்கியான் காடு', 'Stage 2', NULL, NULL, '2.51 Km', '2026-06-21T09:02:24.250Z'),
  ('cmqnk5zaz007vrgvfrdwtpusd', 'cmqnk5z9g005brgvfxjnv9435', 'தூங்கானூர்-1', 'Stage 2', NULL, NULL, '3.29 Km', '2026-06-21T09:02:24.251Z'),
  ('cmqnk5zb0007xrgvfraz3dw7k', 'cmqnk5z9g005brgvfxjnv9435', 'தூங்கானூர்-2', 'Stage 2', NULL, NULL, '2.84 Km', '2026-06-21T09:02:24.252Z'),
  ('cmqnk5zb1007zrgvfi9h5xy2s', 'cmqnk5z9g005brgvfxjnv9435', 'தூங்கானூர்-3', 'Stage 2', NULL, NULL, '2.84 Km', '2026-06-21T09:02:24.253Z'),
  ('cmqnk5zb10081rgvfitl9zoxh', 'cmqnk5z9g005brgvfxjnv9435', 'வெட்டுக்காடு ஈ.பி.ஆர்', 'Stage 2', NULL, NULL, '3.97 Km', '2026-06-21T09:02:24.254Z'),
  ('cmqnk5zb20083rgvf2nch1968', 'cmqnk5z9g005brgvfxjnv9435', 'வெட்டுக்காடு பஸ்ஸ்டாப்', 'Stage 2', NULL, NULL, '3.56 Km', '2026-06-21T09:02:24.255Z'),
  ('cmqnk5zb30085rgvf3vtyutmw', 'cmqnk5z9g005brgvfxjnv9435', 'கூலையங்காடு', 'Stage 2', NULL, NULL, '3.04 Km', '2026-06-21T09:02:24.256Z'),
  ('cmqnk5zb40087rgvfudns9xru', 'cmqnk5z9g005brgvfxjnv9435', 'ஆன்றபட்டியான்காடு-1', 'Stage 2', NULL, NULL, '2.22 Km', '2026-06-21T09:02:24.257Z'),
  ('cmqnk5zb60089rgvfoi69hiqb', 'cmqnk5z9g005brgvfxjnv9435', 'ஆன்றபட்டியான்காடு-2', 'Stage 2', NULL, NULL, '2.22 Km', '2026-06-21T09:02:24.259Z'),
  ('cmqnk5zb8008brgvffeif0aga', 'cmqnk5z9g005brgvfxjnv9435', 'பழனியாங்காடு', 'Stage 2', NULL, NULL, '2.86 Km', '2026-06-21T09:02:24.260Z'),
  ('cmqnk5zb9008drgvfzrm0opln', 'cmqnk5z9g005brgvfxjnv9435', 'கடவளவு', 'Stage 2', NULL, NULL, '2.64 Km', '2026-06-21T09:02:24.261Z'),
  ('cmqnk5zba008frgvfmbajvppm', 'cmqnk5z9g005brgvfxjnv9435', 'கீழ்க்கூத்தாடிபாளையம்', 'Stage 2', NULL, NULL, '3.55 Km', '2026-06-21T09:02:24.262Z'),
  ('cmqnk5zbb008hrgvfeyft1b2k', 'cmqnk5z9g005brgvfxjnv9435', 'தூங்கானூர்', 'Stage 2', NULL, NULL, '2.91 Km', '2026-06-21T09:02:24.263Z'),
  ('cmqnk5zbc008jrgvfryyzkn8e', 'cmqnk5z9g005brgvfxjnv9435', 'புதுக்காடு', 'Stage 2', NULL, NULL, '2.31 Km', '2026-06-21T09:02:24.264Z'),
  ('cmqnk5zbd008lrgvfina6gdir', 'cmqnk5z9g005brgvfxjnv9435', 'ஆணைக்காடு மாரியம்மன் கோவில்', 'Stage 2', NULL, NULL, '2.53 Km', '2026-06-21T09:02:24.265Z'),
  ('cmqnk5zbe008nrgvfpt039dp2', 'cmqnk5z9g005brgvfxjnv9435', 'ஆணைக்காடு', 'Stage 2', NULL, NULL, '2.86 Km', '2026-06-21T09:02:24.266Z'),
  ('cmqnk5zbe008prgvfmc6xvpow', 'cmqnk5z9g005brgvfxjnv9435', 'ஐயம்பாளையம்', 'Stage 2', NULL, NULL, '3.67 Km', '2026-06-21T09:02:24.267Z'),
  ('cmqnk5zbf008rrgvfoz0imbo7', 'cmqnk5z9g005brgvfxjnv9435', 'மூலப்பாதை-1', 'Stage 2', NULL, NULL, '3.85 Km', '2026-06-21T09:02:24.268Z'),
  ('cmqnk5zbg008trgvf2lhc4dk4', 'cmqnk5z9g005brgvfxjnv9435', 'மூலப்பாதை-2', 'Stage 2', NULL, NULL, '3.75 Km', '2026-06-21T09:02:24.269Z'),
  ('cmqnk5zbh008vrgvf40akg9qs', 'cmqnk5z9g005brgvfxjnv9435', 'ஆசாரிப்பட்டறை-1', 'Stage 2', NULL, NULL, '2.84 Km', '2026-06-21T09:02:24.269Z'),
  ('cmqnk5zbi008xrgvfnh0rwomx', 'cmqnk5z9g005brgvfxjnv9435', 'ஆசாரிப்பட்டறை-2', 'Stage 2', NULL, NULL, '2.84 Km', '2026-06-21T09:02:24.270Z'),
  ('cmqnk5zbj008zrgvfk56layi4', 'cmqnk5z9g005brgvfxjnv9435', 'குமரன் நகர்-1', 'Stage 2', NULL, NULL, '2.52 Km', '2026-06-21T09:02:24.271Z'),
  ('cmqnk5zbk0091rgvfvyjcqaot', 'cmqnk5z9g005brgvfxjnv9435', 'மொரம்புக்காடு-1', 'Stage 2', NULL, NULL, '2.27 Km', '2026-06-21T09:02:24.272Z'),
  ('cmqnk5zbl0093rgvfwnl313du', 'cmqnk5z9g005brgvfxjnv9435', 'பாலிபெருமாள்கோவில்-1', 'Stage 2', NULL, NULL, '4.0 Km', '2026-06-21T09:02:24.273Z'),
  ('cmqnk5zbn0095rgvfnj4om3aw', 'cmqnk5z9g005brgvfxjnv9435', 'பாலிபெருமாள்கோவில்-2', 'Stage 2', NULL, NULL, '4.0 Km', '2026-06-21T09:02:24.275Z'),
  ('cmqnk5zbp0098rgvf9eydb5qp', 'cmqnk5zbo0096rgvfdik01mta', 'பூவானூர் பங்க்', 'Stage 3', NULL, NULL, '5.6 Km', '2026-06-21T09:02:24.278Z'),
  ('cmqnk5zbq009argvf2nj625cj', 'cmqnk5zbo0096rgvfdik01mta', 'ஜோசியர்காடு', 'Stage 3', NULL, NULL, '4.8 Km', '2026-06-21T09:02:24.279Z'),
  ('cmqnk5zbr009crgvffenuzkz2', 'cmqnk5zbo0096rgvfdik01mta', 'கன்னந்தேரி-1', 'Stage 3', NULL, NULL, '4.6 Km', '2026-06-21T09:02:24.279Z'),
  ('cmqnk5zbs009ergvfwngi7s80', 'cmqnk5zbo0096rgvfdik01mta', 'கன்னந்தேரி-2', 'Stage 3', NULL, NULL, '4.11 Km', '2026-06-21T09:02:24.280Z'),
  ('cmqnk5zbt009grgvflt0opqdi', 'cmqnk5zbo0096rgvfdik01mta', 'கன்னந்தேரி-3', 'Stage 3', NULL, NULL, '4.44 Km', '2026-06-21T09:02:24.281Z'),
  ('cmqnk5zbu009irgvf7dmobu7v', 'cmqnk5zbo0096rgvfdik01mta', 'கன்னந்தேரி-4', 'Stage 3', NULL, NULL, '4.36 Km', '2026-06-21T09:02:24.282Z'),
  ('cmqnk5zbv009krgvf6ualajs7', 'cmqnk5zbo0096rgvfdik01mta', 'கன்னந்தேரி-5', 'Stage 3', NULL, NULL, '4.22 Km', '2026-06-21T09:02:24.283Z'),
  ('cmqnk5zbw009mrgvf6gbexxmk', 'cmqnk5zbo0096rgvfdik01mta', 'பாலிக்காடு', 'Stage 3', NULL, NULL, '5.5 Km', '2026-06-21T09:02:24.284Z'),
  ('cmqnk5zbw009orgvfo0ceymnp', 'cmqnk5zbo0096rgvfdik01mta', 'நாயக்கன் வளவு பிரிவு', 'Stage 3', NULL, NULL, '5.3 Km', '2026-06-21T09:02:24.285Z'),
  ('cmqnk5zby009qrgvfy5ymdkj9', 'cmqnk5zbo0096rgvfdik01mta', 'கூத்தாடிபாளையம் (மேலே-1)', 'Stage 3', NULL, NULL, '5.15 Km', '2026-06-21T09:02:24.286Z'),
  ('cmqnk5zby009srgvfh12jz8rg', 'cmqnk5zbo0096rgvfdik01mta', 'கூத்தாடிபாளையம்', 'Stage 3', NULL, NULL, '4.3 Km', '2026-06-21T09:02:24.287Z'),
  ('cmqnk5zbz009urgvf69ghzzg0', 'cmqnk5zbo0096rgvfdik01mta', 'கூத்தாடிபாளையம் (பஸ் ஸ்டாப்)', 'Stage 3', NULL, NULL, '4.3 Km', '2026-06-21T09:02:24.288Z'),
  ('cmqnk5zc0009wrgvfwgqmngmw', 'cmqnk5zbo0096rgvfdik01mta', 'பாலப்பட்டி பிரிவு', 'Stage 3', NULL, NULL, '4.2 Km', '2026-06-21T09:02:24.289Z'),
  ('cmqnk5zc1009yrgvfuaz4hjsu', 'cmqnk5zbo0096rgvfdik01mta', 'எருமைப்பட்டி பிரிவு', 'Stage 3', NULL, NULL, '4.18 Km', '2026-06-21T09:02:24.290Z'),
  ('cmqnk5zc300a0rgvf9qp152nm', 'cmqnk5zbo0096rgvfdik01mta', 'கீழ்கூத்தாடிபாளையம்', 'Stage 3', NULL, NULL, '4.1 Km', '2026-06-21T09:02:24.292Z'),
  ('cmqnk5zc500a2rgvfbxclatsg', 'cmqnk5zbo0096rgvfdik01mta', 'பூசாரி காட்டுவளவு-1', 'Stage 3', NULL, NULL, '5.21 Km', '2026-06-21T09:02:24.293Z'),
  ('cmqnk5zc600a4rgvfk4jhapsb', 'cmqnk5zbo0096rgvfdik01mta', 'பூசாரி காட்டுவளவு-2', 'Stage 3', NULL, NULL, '5.37 Km', '2026-06-21T09:02:24.294Z'),
  ('cmqnk5zc700a6rgvfitend68i', 'cmqnk5zbo0096rgvfdik01mta', 'பூசாரி காட்டுவளவு-3', 'Stage 3', NULL, NULL, '5.61 Km', '2026-06-21T09:02:24.295Z'),
  ('cmqnk5zc800a8rgvfng24uvr0', 'cmqnk5zbo0096rgvfdik01mta', 'தெற்கு வளவு', 'Stage 3', NULL, NULL, '5.13 Km', '2026-06-21T09:02:24.296Z'),
  ('cmqnk5zc900aargvfoftu45qv', 'cmqnk5zbo0096rgvfdik01mta', 'மேட்டுக்காடு', 'Stage 3', NULL, NULL, '4.27 Km', '2026-06-21T09:02:24.297Z'),
  ('cmqnk5zca00acrgvfqeh7ohvq', 'cmqnk5zbo0096rgvfdik01mta', 'அப்புசாமி மில்', 'Stage 3', NULL, NULL, '4.21 Km', '2026-06-21T09:02:24.298Z'),
  ('cmqnk5zcb00aergvf5vqjoi6h', 'cmqnk5zbo0096rgvfdik01mta', 'பூங்கா நகர்', 'Stage 3', NULL, NULL, '4.35 Km', '2026-06-21T09:02:24.299Z'),
  ('cmqnk5zcb00agrgvfgxmfpfsg', 'cmqnk5zbo0096rgvfdik01mta', 'வீரப்பம்பாளையம் ரிங்ரோடு', 'Stage 3', NULL, NULL, '5.42 Km', '2026-06-21T09:02:24.300Z'),
  ('cmqnk5zcc00airgvfn8fb9b2a', 'cmqnk5zbo0096rgvfdik01mta', 'SRS பால்பண்ணை', 'Stage 3', NULL, NULL, '5.76 Km', '2026-06-21T09:02:24.301Z'),
  ('cmqnk5zcd00akrgvf15z6i62a', 'cmqnk5zbo0096rgvfdik01mta', 'வெல்லுத்து பெருமாள் கோவில்', 'Stage 3', NULL, NULL, '5.88 Km', '2026-06-21T09:02:24.302Z'),
  ('cmqnk5zce00amrgvff1m69mro', 'cmqnk5zbo0096rgvfdik01mta', 'வீரப்பம்பாளையம்', 'Stage 3', NULL, NULL, '5.45 Km', '2026-06-21T09:02:24.303Z'),
  ('cmqnk5zcf00aorgvfiib0v7z0', 'cmqnk5zbo0096rgvfdik01mta', 'வீரப்பம்பாளையம்1', 'Stage 3', NULL, NULL, '5.45 Km', '2026-06-21T09:02:24.304Z'),
  ('cmqnk5zcg00aqrgvf4ebcrzot', 'cmqnk5zbo0096rgvfdik01mta', 'புதூர்-1', 'Stage 3', NULL, NULL, '4.35 Km', '2026-06-21T09:02:24.305Z'),
  ('cmqnk5zch00asrgvflerazvu4', 'cmqnk5zbo0096rgvfdik01mta', 'புதூர்-2', 'Stage 3', NULL, NULL, '4.35 Km', '2026-06-21T09:02:24.306Z'),
  ('cmqnk5zci00aurgvfyvqrgu4b', 'cmqnk5zbo0096rgvfdik01mta', 'பறையங்காடு வளவு', 'Stage 3', NULL, NULL, '5.85 Km', '2026-06-21T09:02:24.307Z'),
  ('cmqnk5zck00awrgvfd8mutbyd', 'cmqnk5zbo0096rgvfdik01mta', 'எருமைப்பட்டி-1', 'Stage 3', NULL, NULL, '5.28 Km', '2026-06-21T09:02:24.309Z'),
  ('cmqnk5zcm00ayrgvfro6oaexv', 'cmqnk5zbo0096rgvfdik01mta', 'எருமைப்பட்டி-2', 'Stage 3', NULL, NULL, '4.92 Km', '2026-06-21T09:02:24.310Z'),
  ('cmqnk5zcn00b0rgvfqqomtnfp', 'cmqnk5zbo0096rgvfdik01mta', 'எருமைப்பட்டி-3', 'Stage 3', NULL, NULL, '4.87 Km', '2026-06-21T09:02:24.311Z'),
  ('cmqnk5zco00b2rgvfsb81wq97', 'cmqnk5zbo0096rgvfdik01mta', 'கூத்தாடிபாளையம்-1', 'Stage 3', NULL, NULL, '4.24 Km', '2026-06-21T09:02:24.312Z'),
  ('cmqnk5zco00b4rgvffgiegk87', 'cmqnk5zbo0096rgvfdik01mta', 'ஆலமரம்-1', 'Stage 3', NULL, NULL, '5.28 Km', '2026-06-21T09:02:24.313Z'),
  ('cmqnk5zcq00b6rgvfa38jb80z', 'cmqnk5zbo0096rgvfdik01mta', 'ஆலமரம்-2', 'Stage 3', NULL, NULL, '5.28 Km', '2026-06-21T09:02:24.314Z'),
  ('cmqnk5zcr00b8rgvfbc9m1u56', 'cmqnk5zbo0096rgvfdik01mta', 'தங்காயூர்', 'Stage 3', NULL, NULL, '5.8 Km', '2026-06-21T09:02:24.315Z'),
  ('cmqnk5zcs00bargvfj90o6tzn', 'cmqnk5zbo0096rgvfdik01mta', 'நோட்டக்காரன்குட்டை', 'Stage 3', NULL, NULL, '5.3 Km', '2026-06-21T09:02:24.316Z'),
  ('cmqnk5zct00bcrgvfyp47hf59', 'cmqnk5zbo0096rgvfdik01mta', 'தேவணூர்பிரிவு', 'Stage 3', NULL, NULL, '4.75 Km', '2026-06-21T09:02:24.317Z'),
  ('cmqnk5zcu00bergvfr5v4c2bl', 'cmqnk5zbo0096rgvfdik01mta', 'கருக்கன் காட்டுவளவு', 'Stage 3', NULL, NULL, '4.33 Km', '2026-06-21T09:02:24.319Z'),
  ('cmqnk5zcv00bgrgvf961e7qmq', 'cmqnk5zbo0096rgvfdik01mta', 'மூலப்பாதை-1', 'Stage 3', NULL, NULL, '4.18 Km', '2026-06-21T09:02:24.320Z'),
  ('cmqnk5zcx00birgvfn6sb69b6', 'cmqnk5zbo0096rgvfdik01mta', 'மூலப்பாதை-2', 'Stage 3', NULL, NULL, '4.6 Km', '2026-06-21T09:02:24.321Z'),
  ('cmqnk5zcy00bkrgvfmgi0xul3', 'cmqnk5zbo0096rgvfdik01mta', 'பூவானூர்-1', 'Stage 3', NULL, NULL, '5.64 Km', '2026-06-21T09:02:24.323Z'),
  ('cmqnk5zd000bmrgvffes3r0wo', 'cmqnk5zbo0096rgvfdik01mta', 'பூவானூர்-2', 'Stage 3', NULL, NULL, '5.64 Km', '2026-06-21T09:02:24.325Z'),
  ('cmqnk5zd400borgvfyw7exyuq', 'cmqnk5zbo0096rgvfdik01mta', 'கச்சுப்பள்ளி-1', 'Stage 3', NULL, NULL, '5.04 Km', '2026-06-21T09:02:24.328Z'),
  ('cmqnk5zd500bqrgvfph7refq7', 'cmqnk5zbo0096rgvfdik01mta', 'கச்சுப்பள்ளி-2', 'Stage 3', NULL, NULL, '5.31 Km', '2026-06-21T09:02:24.329Z'),
  ('cmqnk5zd600bsrgvf6jty50rn', 'cmqnk5zbo0096rgvfdik01mta', 'கச்சுப்பள்ளி-3', 'Stage 3', NULL, NULL, '5.31 Km', '2026-06-21T09:02:24.330Z'),
  ('cmqnk5zd700burgvf9mhd6ydl', 'cmqnk5zbo0096rgvfdik01mta', 'கச்சுப்பள்ளி பூங்கா', 'Stage 3', NULL, NULL, '5.31 Km', '2026-06-21T09:02:24.331Z'),
  ('cmqnk5zd800bwrgvfenzilpu6', 'cmqnk5zbo0096rgvfdik01mta', 'எருமைப்பட்டி தபால்நிலையம்', 'Stage 3', NULL, NULL, '4.08 Km', '2026-06-21T09:02:24.332Z'),
  ('cmqnk5zd800byrgvf2qgau2se', 'cmqnk5zbo0096rgvfdik01mta', 'எருமைப்பட்டி அம்மன்கோவில்', 'Stage 3', NULL, NULL, '4.12 Km', '2026-06-21T09:02:24.333Z'),
  ('cmqnk5zda00c0rgvf75or6xrg', 'cmqnk5zbo0096rgvfdik01mta', 'பாலப்பட்டி-3', 'Stage 3', NULL, NULL, '5.27 Km', '2026-06-21T09:02:24.334Z'),
  ('cmqnk5zdb00c2rgvfmfnwh1k4', 'cmqnk5zbo0096rgvfdik01mta', 'பாலப்பட்டி-2', 'Stage 3', NULL, NULL, '5.45 Km', '2026-06-21T09:02:24.335Z'),
  ('cmqnk5zdc00c4rgvffi3tmegi', 'cmqnk5zbo0096rgvfdik01mta', 'பாலப்பட்டி-1', 'Stage 3', NULL, NULL, '5.77 Km', '2026-06-21T09:02:24.336Z'),
  ('cmqnk5zdd00c6rgvflkke3xsw', 'cmqnk5zbo0096rgvfdik01mta', 'பலகாரவளவு', 'Stage 3', NULL, NULL, '4.98 Km', '2026-06-21T09:02:24.337Z'),
  ('cmqnk5zdd00c8rgvfflyf7v06', 'cmqnk5zbo0096rgvfdik01mta', 'வெள்ளையம்பாளையம்-3', 'Stage 3', NULL, NULL, '5.71 Km', '2026-06-21T09:02:24.338Z'),
  ('cmqnk5zde00cargvfghj7kqnt', 'cmqnk5zbo0096rgvfdik01mta', 'வெள்ளையம்பாளையம்-2', 'Stage 3', NULL, NULL, '5.71 Km', '2026-06-21T09:02:24.339Z'),
  ('cmqnk5zdf00ccrgvfvwp0bqem', 'cmqnk5zbo0096rgvfdik01mta', 'வெள்ளையம்பாளையம்-1', 'Stage 3', NULL, NULL, '5.98 Km', '2026-06-21T09:02:24.340Z'),
  ('cmqnk5zdh00cergvfwa6s2dhc', 'cmqnk5zbo0096rgvfdik01mta', 'மோட்டூர்', 'Stage 3', NULL, NULL, '4.39 Km', '2026-06-21T09:02:24.341Z'),
  ('cmqnk5zdi00cgrgvfpwoshym5', 'cmqnk5zbo0096rgvfdik01mta', 'நாச்சனூர்-2', 'Stage 3', NULL, NULL, '5.08 Km', '2026-06-21T09:02:24.343Z'),
  ('cmqnk5zdj00cirgvfnrkkiwk6', 'cmqnk5zbo0096rgvfdik01mta', 'நாச்சனூர்-1', 'Stage 3', NULL, NULL, '5.12 Km', '2026-06-21T09:02:24.344Z'),
  ('cmqnk5zdk00ckrgvfgmggs02p', 'cmqnk5zbo0096rgvfdik01mta', 'கோரண்டம்பட்டி-2', 'Stage 3', NULL, NULL, '5.68 Km', '2026-06-21T09:02:24.345Z'),
  ('cmqnk5zdl00cmrgvf96jskaiu', 'cmqnk5zbo0096rgvfdik01mta', 'கோரண்டம்பட்டி-1', 'Stage 3', NULL, NULL, '5.81 Km', '2026-06-21T09:02:24.346Z'),
  ('cmqnk5zdm00corgvfkdxdksbb', 'cmqnk5zbo0096rgvfdik01mta', 'நாச்சனூர் காட்டுவளவு', 'Stage 3', NULL, NULL, '5.76 Km', '2026-06-21T09:02:24.347Z'),
  ('cmqnk5zdn00cqrgvfn7syy9ue', 'cmqnk5zbo0096rgvfdik01mta', 'சாமுண்டிவளவு', 'Stage 3', NULL, NULL, '5.88 Km', '2026-06-21T09:02:24.347Z'),
  ('cmqnk5zdo00csrgvfrztvwyxb', 'cmqnk5zbo0096rgvfdik01mta', 'பெரிய நாச்சியூர்', 'Stage 3', NULL, NULL, '5.46 Km', '2026-06-21T09:02:24.348Z'),
  ('cmqnk5zdp00curgvfq8gnrftd', 'cmqnk5zbo0096rgvfdik01mta', 'காவடிகாரனூர் நலந்தக்குட்டை-1', 'Stage 3', NULL, NULL, '4.6 Km', '2026-06-21T09:02:24.349Z'),
  ('cmqnk5zdq00cwrgvfqmfqkdrg', 'cmqnk5zbo0096rgvfdik01mta', 'காவடிகாரனூர் நலந்தக்குட்டை-2', 'Stage 3', NULL, NULL, '4.6 Km', '2026-06-21T09:02:24.350Z'),
  ('cmqnk5zdr00cyrgvflsqatnep', 'cmqnk5zbo0096rgvfdik01mta', 'காவடிகாரனூர் வளவு', 'Stage 3', NULL, NULL, '4.2 Km', '2026-06-21T09:02:24.351Z'),
  ('cmqnk5zds00d0rgvfhgjli2sj', 'cmqnk5zbo0096rgvfdik01mta', 'காவடிகாரனூர்-1', 'Stage 3', NULL, NULL, '4.6 Km', '2026-06-21T09:02:24.352Z'),
  ('cmqnk5zdt00d2rgvfzafuztt5', 'cmqnk5zbo0096rgvfdik01mta', 'காவடிகாரனூர்-2', 'Stage 3', NULL, NULL, '4.6 Km', '2026-06-21T09:02:24.353Z'),
  ('cmqnk5zdu00d4rgvf8svpzwio', 'cmqnk5zbo0096rgvfdik01mta', 'காவடிகாரனூர்-3', 'Stage 3', NULL, NULL, '4.4 Km', '2026-06-21T09:02:24.355Z'),
  ('cmqnk5zdv00d6rgvfmc95f88q', 'cmqnk5zbo0096rgvfdik01mta', 'கச்சுப்பள்ளி', 'Stage 3', NULL, NULL, '4.97 Km', '2026-06-21T09:02:24.355Z'),
  ('cmqnk5zdx00d8rgvf05pabw7u', 'cmqnk5zbo0096rgvfdik01mta', 'பவர் ஆபீஸ்', 'Stage 3', NULL, NULL, '4.36 Km', '2026-06-21T09:02:24.358Z'),
  ('cmqnk5ze000dargvf9fxm9axa', 'cmqnk5zbo0096rgvfdik01mta', 'குரும்பப்பட்டி மாரியம்மன் கோவில்', 'Stage 3', NULL, NULL, '4.1 Km', '2026-06-21T09:02:24.360Z'),
  ('cmqnk5ze300ddrgvfba1pkdhw', 'cmqnk5ze200dbrgvfzvn6pus1', 'குண்டேரிமேடு-1', 'Stage 4', NULL, NULL, '7.9 Km', '2026-06-21T09:02:24.364Z'),
  ('cmqnk5ze500dfrgvfqy5m5a3k', 'cmqnk5ze200dbrgvfzvn6pus1', 'குண்டேரிமேடு-2', 'Stage 4', NULL, NULL, '6.7 Km', '2026-06-21T09:02:24.365Z'),
  ('cmqnk5ze600dhrgvfmo6ukz3x', 'cmqnk5ze200dbrgvfzvn6pus1', 'குண்டேரிமேடு-3', 'Stage 4', NULL, NULL, '6.7 Km', '2026-06-21T09:02:24.367Z'),
  ('cmqnk5ze800djrgvf3p6tkjle', 'cmqnk5ze200dbrgvfzvn6pus1', 'குண்டேரிமேடு-4', 'Stage 4', NULL, NULL, '6.6 Km', '2026-06-21T09:02:24.368Z'),
  ('cmqnk5ze900dlrgvfbswmvhap', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஒண்டிபுனை-1', 'Stage 4', NULL, NULL, '6.5 Km', '2026-06-21T09:02:24.370Z'),
  ('cmqnk5zeb00dnrgvf1twslwvx', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஒண்டிபுனை-2', 'Stage 4', NULL, NULL, '6.5 Km', '2026-06-21T09:02:24.371Z'),
  ('cmqnk5zec00dprgvfkb1l6w5m', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஒண்டிபுனை-4', 'Stage 4', NULL, NULL, '6.4 Km', '2026-06-21T09:02:24.373Z'),
  ('cmqnk5zef00drrgvf2kisy2op', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஒண்டிக்கடை-1', 'Stage 4', NULL, NULL, '6.15 Km', '2026-06-21T09:02:24.375Z'),
  ('cmqnk5zeg00dtrgvfux83ykek', 'cmqnk5ze200dbrgvfzvn6pus1', 'குண்டல் பட்டி', 'Stage 4', NULL, NULL, '6.6 Km', '2026-06-21T09:02:24.377Z'),
  ('cmqnk5zei00dvrgvfauei26hk', 'cmqnk5ze200dbrgvfzvn6pus1', 'பாபி கடை-1', 'Stage 4', NULL, NULL, '7.23 Km', '2026-06-21T09:02:24.378Z'),
  ('cmqnk5zej00dxrgvfl6z7h1j0', 'cmqnk5ze200dbrgvfzvn6pus1', 'பாபி கடை-3', 'Stage 4', NULL, NULL, '7.23 Km', '2026-06-21T09:02:24.379Z'),
  ('cmqnk5zek00dzrgvfhw9b1a9w', 'cmqnk5ze200dbrgvfzvn6pus1', 'காட்டூர்-1', 'Stage 4', NULL, NULL, '6.63 Km', '2026-06-21T09:02:24.380Z'),
  ('cmqnk5zel00e1rgvfg91k1qe9', 'cmqnk5ze200dbrgvfzvn6pus1', 'கரையனூர்', 'Stage 4', NULL, NULL, '9.21 Km', '2026-06-21T09:02:24.381Z'),
  ('cmqnk5zem00e3rgvfmympm5ko', 'cmqnk5ze200dbrgvfzvn6pus1', 'மாங்குட்டப்பட்டி-1', 'Stage 4', NULL, NULL, '7.59 Km', '2026-06-21T09:02:24.382Z'),
  ('cmqnk5zeo00e5rgvf37si2dxh', 'cmqnk5ze200dbrgvfzvn6pus1', 'மாங்குட்டப்பட்டி-2', 'Stage 4', NULL, NULL, '7.41 Km', '2026-06-21T09:02:24.384Z'),
  ('cmqnk5zep00e7rgvfump3xbpx', 'cmqnk5ze200dbrgvfzvn6pus1', 'மாங்குட்டப்பட்டி-3', 'Stage 4', NULL, NULL, '7.39 Km', '2026-06-21T09:02:24.385Z'),
  ('cmqnk5zeq00e9rgvfml1jfwhq', 'cmqnk5ze200dbrgvfzvn6pus1', 'மாங்குட்டப்பட்டி-4', 'Stage 4', NULL, NULL, '7.39 Km', '2026-06-21T09:02:24.386Z'),
  ('cmqnk5zer00ebrgvfidlmp73m', 'cmqnk5ze200dbrgvfzvn6pus1', 'மாங்குட்டப்பட்டி-5', 'Stage 4', NULL, NULL, '7.39 Km', '2026-06-21T09:02:24.387Z'),
  ('cmqnk5zer00edrgvfp359xxpu', 'cmqnk5ze200dbrgvfzvn6pus1', 'கொண்டைக்கார வளவு-1', 'Stage 4', NULL, NULL, '6.64 Km', '2026-06-21T09:02:24.388Z'),
  ('cmqnk5zes00efrgvfsg1gntdg', 'cmqnk5ze200dbrgvfzvn6pus1', 'கொண்டைக்கார வளவு-2', 'Stage 4', NULL, NULL, '6.77 Km', '2026-06-21T09:02:24.389Z'),
  ('cmqnk5zet00ehrgvf62yseye5', 'cmqnk5ze200dbrgvfzvn6pus1', 'பனங்காட்டூர்-1', 'Stage 4', NULL, NULL, '6.25 Km', '2026-06-21T09:02:24.390Z'),
  ('cmqnk5zev00ejrgvfawjqlgmg', 'cmqnk5ze200dbrgvfzvn6pus1', 'பனங்காட்டூர்-2', 'Stage 4', NULL, NULL, '6.25 Km', '2026-06-21T09:02:24.391Z'),
  ('cmqnk5zex00elrgvfluq9ztso', 'cmqnk5ze200dbrgvfzvn6pus1', 'வரதங்காட்டானூர்', 'Stage 4', NULL, NULL, '6.77 Km', '2026-06-21T09:02:24.393Z'),
  ('cmqnk5zey00enrgvfneb1owcz', 'cmqnk5ze200dbrgvfzvn6pus1', 'குட்டிபையன் வளவு-1', 'Stage 4', NULL, NULL, '7.83 Km', '2026-06-21T09:02:24.394Z'),
  ('cmqnk5zez00eprgvf6swxf8xo', 'cmqnk5ze200dbrgvfzvn6pus1', 'குட்டிபையன் வளவு-2', 'Stage 4', NULL, NULL, '7.83 Km', '2026-06-21T09:02:24.396Z'),
  ('cmqnk5zf000errgvfi7lq19i1', 'cmqnk5ze200dbrgvfzvn6pus1', 'முனியப்பன்கோவில்(கோரணம்பட்டி)', 'Stage 4', NULL, NULL, '7.24 Km', '2026-06-21T09:02:24.396Z'),
  ('cmqnk5zf100etrgvfrbgtjrs3', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஏரிக்காடு', 'Stage 4', NULL, NULL, '6.12 Km', '2026-06-21T09:02:24.398Z'),
  ('cmqnk5zf200evrgvf0bc4hvyo', 'cmqnk5ze200dbrgvfzvn6pus1', 'ராயணம்பட்டி பிரிவு', 'Stage 4', NULL, NULL, '7.48 Km', '2026-06-21T09:02:24.398Z'),
  ('cmqnk5zf300exrgvfa1sbtb3g', 'cmqnk5ze200dbrgvfzvn6pus1', 'கோம்பைக்காடு', 'Stage 4', NULL, NULL, '7.15 Km', '2026-06-21T09:02:24.399Z'),
  ('cmqnk5zf400ezrgvfclzjt41t', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஆண்டிபாளையம்', 'Stage 4', NULL, NULL, '6.77 Km', '2026-06-21T09:02:24.400Z'),
  ('cmqnk5zf500f1rgvfm1knrn5f', 'cmqnk5ze200dbrgvfzvn6pus1', 'செட்டியூர்', 'Stage 4', NULL, NULL, '6.25 Km', '2026-06-21T09:02:24.401Z'),
  ('cmqnk5zf600f3rgvfcazj0kif', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஒண்டிப்பனை', 'Stage 4', NULL, NULL, '7.11 Km', '2026-06-21T09:02:24.402Z'),
  ('cmqnk5zf700f5rgvfsl7a5aoy', 'cmqnk5ze200dbrgvfzvn6pus1', 'தண்ணீர் பைப்', 'Stage 4', NULL, NULL, '7.15 Km', '2026-06-21T09:02:24.403Z'),
  ('cmqnk5zf700f7rgvf2kyyr6to', 'cmqnk5ze200dbrgvfzvn6pus1', 'அ.புதூர்', 'Stage 4', NULL, NULL, '7.86 Km', '2026-06-21T09:02:24.404Z'),
  ('cmqnk5zf800f9rgvfddhub2tv', 'cmqnk5ze200dbrgvfzvn6pus1', 'கரட்டூர் மாரியம்மன்கோவில்', 'Stage 4', NULL, NULL, '7.61 Km', '2026-06-21T09:02:24.405Z'),
  ('cmqnk5zf900fbrgvfnbd7qkmv', 'cmqnk5ze200dbrgvfzvn6pus1', 'கரட்டூர்-2', 'Stage 4', NULL, NULL, '6.97 Km', '2026-06-21T09:02:24.406Z'),
  ('cmqnk5zfa00fdrgvffz4kg8qq', 'cmqnk5ze200dbrgvfzvn6pus1', 'பெருமாள் கோவில்', 'Stage 4', NULL, NULL, '7.28 Km', '2026-06-21T09:02:24.407Z'),
  ('cmqnk5zfd00ffrgvf5d37znkj', 'cmqnk5ze200dbrgvfzvn6pus1', 'காட்டூர்-2', 'Stage 4', NULL, NULL, '6.97 Km', '2026-06-21T09:02:24.409Z'),
  ('cmqnk5zfe00fhrgvfz6wvex2p', 'cmqnk5ze200dbrgvfzvn6pus1', 'காட்டூர்-3', 'Stage 4', NULL, NULL, '6.97 Km', '2026-06-21T09:02:24.410Z'),
  ('cmqnk5zff00fjrgvfwqgo3ra3', 'cmqnk5ze200dbrgvfzvn6pus1', 'காட்டூர்-4', 'Stage 4', NULL, NULL, '6.62 Km', '2026-06-21T09:02:24.411Z'),
  ('cmqnk5zfg00flrgvfuxjbazom', 'cmqnk5ze200dbrgvfzvn6pus1', 'காட்டூர்-5', 'Stage 4', NULL, NULL, '6.62 Km', '2026-06-21T09:02:24.412Z'),
  ('cmqnk5zfh00fnrgvfuhql9k8p', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஒண்டிக்கடை-2', 'Stage 4', NULL, NULL, '6.37 Km', '2026-06-21T09:02:24.414Z'),
  ('cmqnk5zfi00fprgvf7o7fujq2', 'cmqnk5ze200dbrgvfzvn6pus1', 'கோசேரிப்பட்டி-1', 'Stage 4', NULL, NULL, '6.86 Km', '2026-06-21T09:02:24.415Z'),
  ('cmqnk5zfj00frrgvfncz6u9df', 'cmqnk5ze200dbrgvfzvn6pus1', 'கோசேரிப்பட்டி-2', 'Stage 4', NULL, NULL, '6.86 Km', '2026-06-21T09:02:24.415Z'),
  ('cmqnk5zfk00ftrgvfeih6vtez', 'cmqnk5ze200dbrgvfzvn6pus1', 'கோசேரிப்பட்டி-3', 'Stage 4', NULL, NULL, '6.86 Km', '2026-06-21T09:02:24.416Z'),
  ('cmqnk5zfl00fvrgvf4lu7egzn', 'cmqnk5ze200dbrgvfzvn6pus1', 'கருப்பாய்காடு', 'Stage 4', NULL, NULL, '6.54 Km', '2026-06-21T09:02:24.417Z'),
  ('cmqnk5zfm00fxrgvfdgkkigwk', 'cmqnk5ze200dbrgvfzvn6pus1', 'பள்ளிப்பட்டி', 'Stage 4', NULL, NULL, '6.85 Km', '2026-06-21T09:02:24.418Z'),
  ('cmqnk5zfn00fzrgvfebxj5gys', 'cmqnk5ze200dbrgvfzvn6pus1', 'பள்ளிப்பட்டி-பிரிவு', 'Stage 4', NULL, NULL, '6.38 Km', '2026-06-21T09:02:24.419Z'),
  ('cmqnk5zfn00g1rgvfoa5qfcf3', 'cmqnk5ze200dbrgvfzvn6pus1', 'கல்லங்காடு', 'Stage 4', NULL, NULL, '7.82 Km', '2026-06-21T09:02:24.420Z'),
  ('cmqnk5zfo00g3rgvf0k5qztne', 'cmqnk5ze200dbrgvfzvn6pus1', 'கோவலங்காடு பிள்ளையார் கோவில்-1', 'Stage 4', NULL, NULL, '7.8 Km', '2026-06-21T09:02:24.421Z'),
  ('cmqnk5zfp00g5rgvfynwe6pe1', 'cmqnk5ze200dbrgvfzvn6pus1', 'தெற்குகாடு-1', 'Stage 4', NULL, NULL, '6.91 Km', '2026-06-21T09:02:24.422Z'),
  ('cmqnk5zfq00g7rgvfaq9bttz7', 'cmqnk5ze200dbrgvfzvn6pus1', 'தெற்குகாடு', 'Stage 4', NULL, NULL, '6.91 Km', '2026-06-21T09:02:24.423Z'),
  ('cmqnk5zfs00g9rgvfjqyhvkh6', 'cmqnk5ze200dbrgvfzvn6pus1', 'தெற்குகாடு-2', 'Stage 4', NULL, NULL, '6.91 Km', '2026-06-21T09:02:24.424Z'),
  ('cmqnk5zft00gbrgvftxbkufs4', 'cmqnk5ze200dbrgvfzvn6pus1', 'கோவலங்காடு கொடிகம்பம்', 'Stage 4', NULL, NULL, '6.11 Km', '2026-06-21T09:02:24.426Z'),
  ('cmqnk5zfu00gdrgvfc18iioi6', 'cmqnk5ze200dbrgvfzvn6pus1', 'மூலக்கடை-2', 'Stage 4', NULL, NULL, '6.37 Km', '2026-06-21T09:02:24.427Z'),
  ('cmqnk5zfv00gfrgvf694h4xmb', 'cmqnk5ze200dbrgvfzvn6pus1', 'மூலக்கடை-1', 'Stage 4', NULL, NULL, '6.45 Km', '2026-06-21T09:02:24.428Z'),
  ('cmqnk5zfw00ghrgvfw26391cn', 'cmqnk5ze200dbrgvfzvn6pus1', 'கரட்டுக்காடு-2', 'Stage 4', NULL, NULL, '6.71 Km', '2026-06-21T09:02:24.429Z'),
  ('cmqnk5zfx00gjrgvfz1yb97a8', 'cmqnk5ze200dbrgvfzvn6pus1', 'கரட்டுக்காடு-1', 'Stage 4', NULL, NULL, '6.71 Km', '2026-06-21T09:02:24.429Z'),
  ('cmqnk5zfy00glrgvfhsp5ewc8', 'cmqnk5ze200dbrgvfzvn6pus1', 'செல்லியம்மன்கோவில் மோரி-2', 'Stage 4', NULL, NULL, '7.76 Km', '2026-06-21T09:02:24.430Z'),
  ('cmqnk5zfz00gnrgvf8iiykmip', 'cmqnk5ze200dbrgvfzvn6pus1', 'செல்லியம்மன்கோவில் மோரி-1', 'Stage 4', NULL, NULL, '7.76 Km', '2026-06-21T09:02:24.432Z'),
  ('cmqnk5zg000gprgvfrr5yv66p', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஆசாரிகாடு-2', 'Stage 4', NULL, NULL, '6.02 Km', '2026-06-21T09:02:24.433Z'),
  ('cmqnk5zg100grrgvfd2qfc9s9', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஆசாரிகாடு-1', 'Stage 4', NULL, NULL, '6.02 Km', '2026-06-21T09:02:24.434Z'),
  ('cmqnk5zg200gtrgvfsy4e60jq', 'cmqnk5ze200dbrgvfzvn6pus1', 'பனங்காடு', 'Stage 4', NULL, NULL, '6.04 Km', '2026-06-21T09:02:24.434Z'),
  ('cmqnk5zg300gvrgvfnbid2lt6', 'cmqnk5ze200dbrgvfzvn6pus1', 'பட்டரை காட்டு வளவு', 'Stage 4', NULL, NULL, '7.57 Km', '2026-06-21T09:02:24.435Z'),
  ('cmqnk5zg400gxrgvfmp4dcw76', 'cmqnk5ze200dbrgvfzvn6pus1', 'பக்கரிக்காட்டு வளவு', 'Stage 4', NULL, NULL, '7.66 Km', '2026-06-21T09:02:24.436Z'),
  ('cmqnk5zg400gzrgvf0qv7tcyq', 'cmqnk5ze200dbrgvfzvn6pus1', 'பள்ளிப்பட்டி பிரிவு', 'Stage 4', NULL, NULL, '6.13 Km', '2026-06-21T09:02:24.437Z'),
  ('cmqnk5zg500h1rgvfz7d6tyl7', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஸ்டேட் பேங்க்', 'Stage 4', NULL, NULL, '7.72 Km', '2026-06-21T09:02:24.438Z'),
  ('cmqnk5zg600h3rgvfn2tz24gt', 'cmqnk5ze200dbrgvfzvn6pus1', 'போளீஸ் குவார்ட்டர்ஸ்', 'Stage 4', NULL, NULL, '7.76 Km', '2026-06-21T09:02:24.439Z'),
  ('cmqnk5zg700h5rgvfbilk8nd3', 'cmqnk5ze200dbrgvfzvn6pus1', 'மாட்டு ஹாஸ்பிட்டல்', 'Stage 4', NULL, NULL, '7.61 Km', '2026-06-21T09:02:24.439Z'),
  ('cmqnk5zg800h7rgvff46v0ucg', 'cmqnk5ze200dbrgvfzvn6pus1', 'வைத்தியலிங்கம் திருமணமண்டபம்', 'Stage 4', NULL, NULL, '7.43 Km', '2026-06-21T09:02:24.440Z'),
  ('cmqnk5zga00h9rgvfdcysda4c', 'cmqnk5ze200dbrgvfzvn6pus1', 'பத்திரஆபீஸ்-1', 'Stage 4', NULL, NULL, '7.27 Km', '2026-06-21T09:02:24.442Z'),
  ('cmqnk5zgb00hbrgvfnhbrlo9z', 'cmqnk5ze200dbrgvfzvn6pus1', 'பதிரஆபீஸ்-2', 'Stage 4', NULL, NULL, '7.27 Km', '2026-06-21T09:02:24.443Z'),
  ('cmqnk5zgc00hdrgvf26tjkms7', 'cmqnk5ze200dbrgvfzvn6pus1', 'போலீஸ் ஸ்டேஷன்', 'Stage 4', NULL, NULL, '7.15 Km', '2026-06-21T09:02:24.444Z'),
  ('cmqnk5zgd00hfrgvfvaayztmw', 'cmqnk5ze200dbrgvfzvn6pus1', 'கும்பகோணம் பாத்திரக்கடை-1', 'Stage 4', NULL, NULL, '7.89 Km', '2026-06-21T09:02:24.445Z'),
  ('cmqnk5zge00hhrgvfzo3v20g9', 'cmqnk5ze200dbrgvfzvn6pus1', 'கும்பகோணம் பாத்திரக்கடை-2', 'Stage 4', NULL, NULL, '7.89 Km', '2026-06-21T09:02:24.446Z'),
  ('cmqnk5zge00hjrgvf9q9fxkyo', 'cmqnk5ze200dbrgvfzvn6pus1', 'மோகன் ஹாஸ்பிட்டல்', 'Stage 4', NULL, NULL, '7.81 Km', '2026-06-21T09:02:24.447Z'),
  ('cmqnk5zgf00hlrgvfcgrjhw20', 'cmqnk5ze200dbrgvfzvn6pus1', 'Y.V.B சில்க்ஸ்-1', 'Stage 4', NULL, NULL, '7.72 Km', '2026-06-21T09:02:24.448Z'),
  ('cmqnk5zgg00hnrgvfz7dx2j1d', 'cmqnk5ze200dbrgvfzvn6pus1', 'Y.V.B சில்க்ஸ்-2', 'Stage 4', NULL, NULL, '7.72 Km', '2026-06-21T09:02:24.448Z'),
  ('cmqnk5zgh00hprgvf0a4uu2vl', 'cmqnk5ze200dbrgvfzvn6pus1', 'S.K.பல் மருத்துவமனை', 'Stage 4', NULL, NULL, '7.67 Km', '2026-06-21T09:02:24.449Z'),
  ('cmqnk5zgi00hrrgvfs3de7sqv', 'cmqnk5ze200dbrgvfzvn6pus1', 'மேட்டுத்தெரு', 'Stage 4', NULL, NULL, '7.55 Km', '2026-06-21T09:02:24.450Z'),
  ('cmqnk5zgj00htrgvfsmhxc282', 'cmqnk5ze200dbrgvfzvn6pus1', 'கோகிலா மெடிக்கல்', 'Stage 4', NULL, NULL, '7.46 Km', '2026-06-21T09:02:24.451Z'),
  ('cmqnk5zgj00hvrgvf1co7z3dz', 'cmqnk5ze200dbrgvfzvn6pus1', 'கோகுலகிருஷ்ணன் மருத்துவமனை', 'Stage 4', NULL, NULL, '7.36 Km', '2026-06-21T09:02:24.452Z'),
  ('cmqnk5zgk00hxrgvfxt45fe75', 'cmqnk5ze200dbrgvfzvn6pus1', 'அங்காளம்மன் கோவில் தெரு-1', 'Stage 4', NULL, NULL, '7.25 Km', '2026-06-21T09:02:24.453Z'),
  ('cmqnk5zgl00hzrgvfrhzz5z29', 'cmqnk5ze200dbrgvfzvn6pus1', 'அங்காளம்மன் கோவில் தெரு-2', 'Stage 4', NULL, NULL, '7.25 Km', '2026-06-21T09:02:24.454Z'),
  ('cmqnk5zgm00i1rgvfydsgwhzt', 'cmqnk5ze200dbrgvfzvn6pus1', 'திரெளபதி அம்மன்கோவில்', 'Stage 4', NULL, NULL, '7.14 Km', '2026-06-21T09:02:24.454Z'),
  ('cmqnk5zgn00i3rgvf24idvggt', 'cmqnk5ze200dbrgvfzvn6pus1', 'யூனியன் ஆபீஸ்', 'Stage 4', NULL, NULL, '6.33 Km', '2026-06-21T09:02:24.455Z'),
  ('cmqnk5zgo00i5rgvfkgbg26se', 'cmqnk5ze200dbrgvfzvn6pus1', 'பாவா மெடிக்கல்', 'Stage 4', NULL, NULL, '6.79 Km', '2026-06-21T09:02:24.456Z'),
  ('cmqnk5zgp00i7rgvfmp51bpua', 'cmqnk5ze200dbrgvfzvn6pus1', 'மோட்டூர்-1', 'Stage 4', NULL, NULL, '6.11 Km', '2026-06-21T09:02:24.458Z'),
  ('cmqnk5zgr00i9rgvfi8ts8dzj', 'cmqnk5ze200dbrgvfzvn6pus1', 'மோட்டூர்-2', 'Stage 4', NULL, NULL, '6.11 Km', '2026-06-21T09:02:24.459Z'),
  ('cmqnk5zgs00ibrgvf6qnkwj7c', 'cmqnk5ze200dbrgvfzvn6pus1', 'வாழக்குட்டைப்பட்டி', 'Stage 4', NULL, NULL, '7.18 Km', '2026-06-21T09:02:24.460Z'),
  ('cmqnk5zgt00idrgvfz4tbd1pc', 'cmqnk5ze200dbrgvfzvn6pus1', 'வாழக்குட்டைப்பட்டி-1', 'Stage 4', NULL, NULL, '7.18 Km', '2026-06-21T09:02:24.461Z'),
  ('cmqnk5zgu00ifrgvfl5ctu2ut', 'cmqnk5ze200dbrgvfzvn6pus1', 'சின்னமணிவளவு பால் சொசைட்டி', 'Stage 4', NULL, NULL, '7.04 Km', '2026-06-21T09:02:24.462Z'),
  ('cmqnk5zgu00ihrgvfyoaehezs', 'cmqnk5ze200dbrgvfzvn6pus1', 'தளவாய்ப்பட்டி', 'Stage 4', NULL, NULL, '6.11 Km', '2026-06-21T09:02:24.463Z'),
  ('cmqnk5zgv00ijrgvf12pcj6hb', 'cmqnk5ze200dbrgvfzvn6pus1', 'தங்காயூர் மாரியம்மன்கோவில்', 'Stage 4', NULL, NULL, '7.33 Km', '2026-06-21T09:02:24.464Z'),
  ('cmqnk5zgw00ilrgvfv8yfhh8v', 'cmqnk5ze200dbrgvfzvn6pus1', 'பறையங்காட்டானூர்', 'Stage 4', NULL, NULL, '7.88 Km', '2026-06-21T09:02:24.465Z'),
  ('cmqnk5zgx00inrgvf0txpwal6', 'cmqnk5ze200dbrgvfzvn6pus1', 'தங்காயூர் மேல்கடை', 'Stage 4', NULL, NULL, '6.76 Km', '2026-06-21T09:02:24.465Z'),
  ('cmqnk5zgy00iprgvfkkediwcd', 'cmqnk5ze200dbrgvfzvn6pus1', 'தங்காயூர் கீழ்கடை', 'Stage 4', NULL, NULL, '6.76 Km', '2026-06-21T09:02:24.466Z'),
  ('cmqnk5zgz00irrgvfqv85zd87', 'cmqnk5ze200dbrgvfzvn6pus1', 'மாமரத்தானூர்', 'Stage 4', NULL, NULL, '6.17 Km', '2026-06-21T09:02:24.467Z'),
  ('cmqnk5zgz00itrgvfj3mrrx7v', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஊஞ்சான்காடு-1', 'Stage 4', NULL, NULL, '6.4 Km', '2026-06-21T09:02:24.468Z'),
  ('cmqnk5zh000ivrgvfxd3gv0f2', 'cmqnk5ze200dbrgvfzvn6pus1', 'ஊஞ்சான்காடு-2', 'Stage 4', NULL, NULL, '6.4 Km', '2026-06-21T09:02:24.469Z'),
  ('cmqnk5zh100ixrgvfvim1pw0c', 'cmqnk5ze200dbrgvfzvn6pus1', 'எடப்பாடி-குமரன் தியேட்டர்', 'Stage 4', NULL, NULL, '7.58 Km', '2026-06-21T09:02:24.470Z'),
  ('cmqnk5zh300j0rgvfawdee6p4', 'cmqnk5zh200iyrgvfq059hec9', 'அழகனூர்-1', 'Stage 5', NULL, NULL, '9.5 Km', '2026-06-21T09:02:24.471Z'),
  ('cmqnk5zh400j2rgvfy8s578ef', 'cmqnk5zh200iyrgvfq059hec9', 'அழகனூர்-2', 'Stage 5', NULL, NULL, '9.5 Km', '2026-06-21T09:02:24.472Z'),
  ('cmqnk5zh500j4rgvfaooyt5ik', 'cmqnk5zh200iyrgvfq059hec9', 'அழகனூர்-3', 'Stage 5', NULL, NULL, '9.4 Km', '2026-06-21T09:02:24.473Z'),
  ('cmqnk5zh700j6rgvfvs3iy715', 'cmqnk5zh200iyrgvfq059hec9', 'அழகனூர்-4', 'Stage 5', NULL, NULL, '9.4 Km', '2026-06-21T09:02:24.475Z'),
  ('cmqnk5zh800j8rgvfpynshtup', 'cmqnk5zh200iyrgvfq059hec9', 'ஆசாரிப்பட்டறை-1', 'Stage 5', NULL, NULL, '9.2 Km', '2026-06-21T09:02:24.476Z'),
  ('cmqnk5zh900jargvf6muzsqsg', 'cmqnk5zh200iyrgvfq059hec9', 'அண்ணாநகர்-1', 'Stage 5', NULL, NULL, '8.9 Km', '2026-06-21T09:02:24.477Z'),
  ('cmqnk5zha00jcrgvf3ngpl90x', 'cmqnk5zh200iyrgvfq059hec9', 'அண்ணாநகர்-2', 'Stage 5', NULL, NULL, '8.9 Km', '2026-06-21T09:02:24.478Z'),
  ('cmqnk5zhb00jergvff4c559sd', 'cmqnk5zh200iyrgvfq059hec9', 'செல்லியம்மன் கோவில் மோரி', 'Stage 5', NULL, NULL, '8.71 Km', '2026-06-21T09:02:24.479Z'),
  ('cmqnk5zhb00jgrgvfhp9z03vq', 'cmqnk5zh200iyrgvfq059hec9', 'தோலுக்காரன் காடு', 'Stage 5', NULL, NULL, '10 Km', '2026-06-21T09:02:24.480Z'),
  ('cmqnk5zhc00jirgvfke8b72ug', 'cmqnk5zh200iyrgvfq059hec9', 'சரவணா ஹோட்டல் பின்புறம்', 'Stage 5', NULL, NULL, '10.2 Km', '2026-06-21T09:02:24.481Z'),
  ('cmqnk5zhd00jkrgvf82okhpon', 'cmqnk5zh200iyrgvfq059hec9', 'வைகுந்தம்', 'Stage 5', NULL, NULL, '10 Km', '2026-06-21T09:02:24.482Z'),
  ('cmqnk5zhe00jmrgvfp1dksfzf', 'cmqnk5zh200iyrgvfq059hec9', 'வண்ணாங்குட்டை பிரிவு', 'Stage 5', NULL, NULL, '9 Km', '2026-06-21T09:02:24.483Z'),
  ('cmqnk5zhf00jorgvfq9hxodmh', 'cmqnk5zh200iyrgvfq059hec9', 'குண்டல்பட்டி விநாயகர் கோவில்', 'Stage 5', NULL, NULL, '10 Km', '2026-06-21T09:02:24.484Z'),
  ('cmqnk5zhg00jqrgvf76i3qoxg', 'cmqnk5zh200iyrgvfq059hec9', 'ஏரிமூலை', 'Stage 5', NULL, NULL, '8.85 Km', '2026-06-21T09:02:24.484Z'),
  ('cmqnk5zhh00jsrgvflyh7t4jv', 'cmqnk5zh200iyrgvfq059hec9', 'கொம்பாடி காடு', 'Stage 5', NULL, NULL, '8.5 Km', '2026-06-21T09:02:24.485Z'),
  ('cmqnk5zhi00jurgvfeaw5gxr2', 'cmqnk5zh200iyrgvfq059hec9', 'கோணம்பை', 'Stage 5', NULL, NULL, '8.58 Km', '2026-06-21T09:02:24.486Z'),
  ('cmqnk5zhi00jwrgvf9pl7k6w4', 'cmqnk5zh200iyrgvfq059hec9', 'நெசவாளர் காலனி', 'Stage 5', NULL, NULL, '8.84 Km', '2026-06-21T09:02:24.487Z'),
  ('cmqnk5zhj00jyrgvfy427hope', 'cmqnk5zh200iyrgvfq059hec9', 'பெயிண்டிங் பட்டறை', 'Stage 5', NULL, NULL, '8.46 Km', '2026-06-21T09:02:24.488Z'),
  ('cmqnk5zhk00k0rgvfm748skre', 'cmqnk5zh200iyrgvfq059hec9', 'வெள்ளரி வெள்ளரி ரிங் ரோடு', 'Stage 5', NULL, NULL, '9.54 Km', '2026-06-21T09:02:24.488Z'),
  ('cmqnk5zhl00k2rgvfco047bre', 'cmqnk5zh200iyrgvfq059hec9', 'வெள்ளரி வெள்ளரி பிரிவு-1', 'Stage 5', NULL, NULL, '8.34 Km', '2026-06-21T09:02:24.489Z'),
  ('cmqnk5zhn00k4rgvfr33ipm34', 'cmqnk5zh200iyrgvfq059hec9', 'வெள்ளரி வெள்ளரி பிரிவு-2', 'Stage 5', NULL, NULL, '8.34 Km', '2026-06-21T09:02:24.491Z'),
  ('cmqnk5zho00k6rgvfzj9c99r3', 'cmqnk5zh200iyrgvfq059hec9', 'ஹவுசிங் போர்டு-1', 'Stage 5', NULL, NULL, '8.24 Km', '2026-06-21T09:02:24.493Z'),
  ('cmqnk5zhp00k8rgvffhdfu9lr', 'cmqnk5zh200iyrgvfq059hec9', 'ஹவுசிங் போர்டு-2', 'Stage 5', NULL, NULL, '8.24 Km', '2026-06-21T09:02:24.494Z'),
  ('cmqnk5zhq00kargvf1ytljlvl', 'cmqnk5zh200iyrgvfq059hec9', 'விஸ்டம் பள்ளி', 'Stage 5', NULL, NULL, '8.2 Km', '2026-06-21T09:02:24.494Z'),
  ('cmqnk5zhr00kcrgvf40tbbg91', 'cmqnk5zh200iyrgvfq059hec9', 'காளியம்மன் கோவில்', 'Stage 5', NULL, NULL, '8.1 Km', '2026-06-21T09:02:24.495Z'),
  ('cmqnk5zhs00kergvf9s6fqrsm', 'cmqnk5zh200iyrgvfq059hec9', 'ஐயன்காட்டூர்', 'Stage 5', NULL, NULL, '9.8 Km', '2026-06-21T09:02:24.496Z'),
  ('cmqnk5zht00kgrgvfax08009s', 'cmqnk5zh200iyrgvfq059hec9', 'மாரியம்மன் கோவில்', 'Stage 5', NULL, NULL, '9.8 Km', '2026-06-21T09:02:24.497Z'),
  ('cmqnk5zht00kirgvfihyxpjmp', 'cmqnk5zh200iyrgvfq059hec9', 'ராஜாமணித்தோட்டம்', 'Stage 5', NULL, NULL, '9.98 Km', '2026-06-21T09:02:24.498Z'),
  ('cmqnk5zhu00kkrgvfv0q6p6md', 'cmqnk5zh200iyrgvfq059hec9', 'ஒருக்காமலை', 'Stage 5', NULL, NULL, '8.39 Km', '2026-06-21T09:02:24.499Z'),
  ('cmqnk5zhv00kmrgvfytwzfvja', 'cmqnk5zh200iyrgvfq059hec9', 'புதுப்பாளையம்-1', 'Stage 5', NULL, NULL, '9.97 Km', '2026-06-21T09:02:24.500Z'),
  ('cmqnk5zhw00korgvft1b8ac8i', 'cmqnk5zh200iyrgvfq059hec9', 'புதுப்பாளையம்-2', 'Stage 5', NULL, NULL, '9.97 Km', '2026-06-21T09:02:24.500Z'),
  ('cmqnk5zhx00kqrgvfpdogr54t', 'cmqnk5zh200iyrgvfq059hec9', 'புதுப்பாளையம்-3', 'Stage 5', NULL, NULL, '9.97 Km', '2026-06-21T09:02:24.501Z'),
  ('cmqnk5zhy00ksrgvf6y7mjytn', 'cmqnk5zh200iyrgvfq059hec9', 'புதுப்பாளையம் வாய்க்கால் பாளையம்', 'Stage 5', NULL, NULL, '9.71 Km', '2026-06-21T09:02:24.502Z'),
  ('cmqnk5zhz00kurgvffxi4z1ij', 'cmqnk5zh200iyrgvfq059hec9', 'புதுப்பாளையம் பெருமாள்கோவில்-1', 'Stage 5', NULL, NULL, '9.46 Km', '2026-06-21T09:02:24.503Z'),
  ('cmqnk5zhz00kwrgvf7t0i3v96', 'cmqnk5zh200iyrgvfq059hec9', 'புதுப்பாளையம் பெருமாள்கோவில்-2', 'Stage 5', NULL, NULL, '9.46 Km', '2026-06-21T09:02:24.504Z'),
  ('cmqnk5zi000kyrgvfnnp4hwj7', 'cmqnk5zh200iyrgvfq059hec9', 'ஈஸ்வரன் கோவில்', 'Stage 5', NULL, NULL, '8.75 Km', '2026-06-21T09:02:24.505Z'),
  ('cmqnk5zi100l0rgvfrry3b14d', 'cmqnk5zh200iyrgvfq059hec9', 'ராயணம்பட்டி கரட்டுக்காடு', 'Stage 5', NULL, NULL, '8.56 Km', '2026-06-21T09:02:24.506Z'),
  ('cmqnk5zi200l2rgvf9oljf6nd', 'cmqnk5zh200iyrgvfq059hec9', 'ராயணம்பட்டி', 'Stage 5', NULL, NULL, '8.77 Km', '2026-06-21T09:02:24.506Z'),
  ('cmqnk5zi400l4rgvf92ckfo4w', 'cmqnk5zh200iyrgvfq059hec9', 'சடையம்பாளையம்', 'Stage 5', NULL, NULL, '10 Km', '2026-06-21T09:02:24.508Z'),
  ('cmqnk5zi500l6rgvfwzzpp1jk', 'cmqnk5zh200iyrgvfq059hec9', 'ராயணம்பட்டி பிரிவு', 'Stage 5', NULL, NULL, '8.56 Km', '2026-06-21T09:02:24.510Z'),
  ('cmqnk5zi600l8rgvfl3ei90ry', 'cmqnk5zh200iyrgvfq059hec9', 'ராயணம்பட்டி பெரியமாரியம்மன் கோவில்', 'Stage 5', NULL, NULL, '9 Km', '2026-06-21T09:02:24.511Z'),
  ('cmqnk5zi700largvfdl6psjkz', 'cmqnk5zh200iyrgvfq059hec9', 'பாச்சாலியூர் காட்டுவளவு', 'Stage 5', NULL, NULL, '9.5 Km', '2026-06-21T09:02:24.511Z'),
  ('cmqnk5zi800lcrgvf4ominzl8', 'cmqnk5zh200iyrgvfq059hec9', 'பாச்சாலியூர்', 'Stage 5', NULL, NULL, '9.5 Km', '2026-06-21T09:02:24.512Z'),
  ('cmqnk5zi900lergvfboayu4lf', 'cmqnk5zh200iyrgvfq059hec9', 'தொப்பக்காடு-1', 'Stage 5', NULL, NULL, '8.12 Km', '2026-06-21T09:02:24.513Z'),
  ('cmqnk5zia00lgrgvfuwfgyslj', 'cmqnk5zh200iyrgvfq059hec9', 'தொப்பக்காடு-2', 'Stage 5', NULL, NULL, '8.12 Km', '2026-06-21T09:02:24.514Z'),
  ('cmqnk5zib00lirgvf3e1djw3a', 'cmqnk5zh200iyrgvfq059hec9', 'பச்சியம்மன்கோவில்', 'Stage 5', NULL, NULL, '9.25 Km', '2026-06-21T09:02:24.515Z'),
  ('cmqnk5zib00lkrgvf8zqknfhq', 'cmqnk5zh200iyrgvfq059hec9', 'காட்டுவளவு-1', 'Stage 5', NULL, NULL, '9.75 Km', '2026-06-21T09:02:24.516Z'),
  ('cmqnk5zic00lmrgvfx8loczk2', 'cmqnk5zh200iyrgvfq059hec9', 'காட்டுவளவு-2', 'Stage 5', NULL, NULL, '9.75 Km', '2026-06-21T09:02:24.517Z'),
  ('cmqnk5zid00lorgvfrno7mbjd', 'cmqnk5zh200iyrgvfq059hec9', 'புதுக்குடியனூர்', 'Stage 5', NULL, NULL, '9.51 Km', '2026-06-21T09:02:24.518Z'),
  ('cmqnk5zie00lqrgvf5k6kzdin', 'cmqnk5zh200iyrgvfq059hec9', 'சிவன் காடு-1', 'Stage 5', NULL, NULL, '8.49 Km', '2026-06-21T09:02:24.518Z'),
  ('cmqnk5zif00lsrgvfjdln4nzo', 'cmqnk5zh200iyrgvfq059hec9', 'சிவன் காடு-2', 'Stage 5', NULL, NULL, '8.49 Km', '2026-06-21T09:02:24.519Z'),
  ('cmqnk5zig00lurgvfp3d5erd9', 'cmqnk5zh200iyrgvfq059hec9', 'தோப்புக்காடு-1', 'Stage 5', NULL, NULL, '9.92 Km', '2026-06-21T09:02:24.520Z'),
  ('cmqnk5zih00lwrgvfxswaqzee', 'cmqnk5zh200iyrgvfq059hec9', 'தோப்புக்காடு-2', 'Stage 5', NULL, NULL, '9.92 Km', '2026-06-21T09:02:24.521Z'),
  ('cmqnk5zii00lyrgvfsu1e4hc7', 'cmqnk5zh200iyrgvfq059hec9', 'எட்டிக்கூட்டைமேடு-1', 'Stage 5', NULL, NULL, '8.11 Km', '2026-06-21T09:02:24.522Z'),
  ('cmqnk5zij00m0rgvfaqzh1yg8', 'cmqnk5zh200iyrgvfq059hec9', 'எட்டிக்கூட்டைமேடு-2', 'Stage 5', NULL, NULL, '8.11 Km', '2026-06-21T09:02:24.523Z'),
  ('cmqnk5zil00m2rgvf7l1zsi2j', 'cmqnk5zh200iyrgvfq059hec9', 'கோம்மைக்காடு', 'Stage 5', NULL, NULL, '8.08 Km', '2026-06-21T09:02:24.525Z'),
  ('cmqnk5zim00m4rgvfimsqi75x', 'cmqnk5zh200iyrgvfq059hec9', 'ஆலச்சம்பாளையம் ரிங்ரோடு', 'Stage 5', NULL, NULL, '9.98 Km', '2026-06-21T09:02:24.527Z'),
  ('cmqnk5zin00m6rgvfh07mzscn', 'cmqnk5zh200iyrgvfq059hec9', 'ஆலச்சம்பாளையம்', 'Stage 5', NULL, NULL, '9.55 Km', '2026-06-21T09:02:24.528Z'),
  ('cmqnk5zio00m8rgvf6ng4dw26', 'cmqnk5zh200iyrgvfq059hec9', 'ஆலச்சம்பாளையம் பாறைக்காட்டு மேடு', 'Stage 5', NULL, NULL, '9.39 Km', '2026-06-21T09:02:24.529Z'),
  ('cmqnk5zip00margvfpyq5cn39', 'cmqnk5zh200iyrgvfq059hec9', 'ஏ.டி.சி.டிப்போ', 'Stage 5', NULL, NULL, '8.55 Km', '2026-06-21T09:02:24.530Z'),
  ('cmqnk5ziq00mcrgvf4sod12mw', 'cmqnk5zh200iyrgvfq059hec9', 'மேட்டுத்தெரு', 'Stage 5', NULL, NULL, '8.21 Km', '2026-06-21T09:02:24.530Z'),
  ('cmqnk5zir00mergvfov782zwd', 'cmqnk5zh200iyrgvfq059hec9', 'குஞ்சப்பனூர்', 'Stage 5', NULL, NULL, '9.89 Km', '2026-06-21T09:02:24.531Z'),
  ('cmqnk5zis00mgrgvfrckvu2di', 'cmqnk5zh200iyrgvfq059hec9', 'அழகப்பம்பாளையம் ஆயில் மில்', 'Stage 5', NULL, NULL, '9.35 Km', '2026-06-21T09:02:24.532Z'),
  ('cmqnk5zit00mirgvfizjlwyrt', 'cmqnk5zh200iyrgvfq059hec9', 'அழகப்பம்பாளையம்-1', 'Stage 5', NULL, NULL, '9.17 Km', '2026-06-21T09:02:24.533Z'),
  ('cmqnk5ziu00mkrgvfbd3qyf1j', 'cmqnk5zh200iyrgvfq059hec9', 'அழகப்பம்பாளையம்-2', 'Stage 5', NULL, NULL, '9.17 Km', '2026-06-21T09:02:24.534Z'),
  ('cmqnk5ziu00mmrgvfdjnkbder', 'cmqnk5zh200iyrgvfq059hec9', 'அழகப்பம்பாளையம்-3', 'Stage 5', NULL, NULL, '8.79 Km', '2026-06-21T09:02:24.535Z'),
  ('cmqnk5ziv00morgvf3hhctzzy', 'cmqnk5zh200iyrgvfq059hec9', 'அழகப்பம்பாளையம்', 'Stage 5', NULL, NULL, '8.83 Km', '2026-06-21T09:02:24.536Z'),
  ('cmqnk5ziw00mqrgvfwtegztk2', 'cmqnk5zh200iyrgvfq059hec9', 'போஸ்ட் ஆபீஸ்', 'Stage 5', NULL, NULL, '8.5 Km', '2026-06-21T09:02:24.537Z'),
  ('cmqnk5zix00msrgvfrrvqpkal', 'cmqnk5zh200iyrgvfq059hec9', 'நாதன்காடு', 'Stage 5', NULL, NULL, '9.01 Km', '2026-06-21T09:02:24.538Z'),
  ('cmqnk5ziy00murgvfqcw1i1qb', 'cmqnk5zh200iyrgvfq059hec9', 'காளிப்பட்டி பிரிவு-3', 'Stage 5', NULL, NULL, '8.59 Km', '2026-06-21T09:02:24.539Z'),
  ('cmqnk5ziz00mwrgvfg3bspdhx', 'cmqnk5zh200iyrgvfq059hec9', 'காளிப்பட்டி பிரிவு-2`', 'Stage 5', NULL, NULL, '8.59 Km', '2026-06-21T09:02:24.540Z'),
  ('cmqnk5zj200myrgvf18vveh2x', 'cmqnk5zh200iyrgvfq059hec9', 'காளிப்பட்டி பிரிவு-1', 'Stage 5', NULL, NULL, '8.59 Km', '2026-06-21T09:02:24.542Z'),
  ('cmqnk5zj300n0rgvfov0jevdx', 'cmqnk5zh200iyrgvfq059hec9', 'செல்லப்பம்பட்டி', 'Stage 5', NULL, NULL, '9.95 Km', '2026-06-21T09:02:24.543Z'),
  ('cmqnk5zj400n2rgvfffelrzj8', 'cmqnk5zh200iyrgvfq059hec9', 'வேலாக்கோவில்-4', 'Stage 5', NULL, NULL, '8.26 Km', '2026-06-21T09:02:24.544Z'),
  ('cmqnk5zj500n4rgvffsdpq9ah', 'cmqnk5zh200iyrgvfq059hec9', 'வேலாக்கோவில்-3', 'Stage 5', NULL, NULL, '8.23 Km', '2026-06-21T09:02:24.545Z'),
  ('cmqnk5zj600n6rgvf6hiqx0qg', 'cmqnk5zh200iyrgvfq059hec9', 'வேலாக்கோவில்-2', 'Stage 5', NULL, NULL, '8.21 Km', '2026-06-21T09:02:24.546Z'),
  ('cmqnk5zj600n8rgvfz19cmvxp', 'cmqnk5zh200iyrgvfq059hec9', 'வேலாக்கோவில்-1', 'Stage 5', NULL, NULL, '8.13 Km', '2026-06-21T09:02:24.547Z'),
  ('cmqnk5zj700nargvfn4bt9o7s', 'cmqnk5zh200iyrgvfq059hec9', 'ஏரிக்காடு', 'Stage 5', NULL, NULL, '9.27 Km', '2026-06-21T09:02:24.548Z'),
  ('cmqnk5zj800ncrgvf4mmcmash', 'cmqnk5zh200iyrgvfq059hec9', 'மெய்யம்பாளையம்-5', 'Stage 5', NULL, NULL, '8.26 Km', '2026-06-21T09:02:24.549Z'),
  ('cmqnk5zj900nergvfa1lj4hrr', 'cmqnk5zh200iyrgvfq059hec9', 'மெய்யம்பாளையம்-4', 'Stage 5', NULL, NULL, '8.48 Km', '2026-06-21T09:02:24.550Z'),
  ('cmqnk5zja00ngrgvfewhpzwnw', 'cmqnk5zh200iyrgvfq059hec9', 'மெய்யம்பாளையம்-3', 'Stage 5', NULL, NULL, '8.58 Km', '2026-06-21T09:02:24.551Z'),
  ('cmqnk5zjb00nirgvfuwb7p9cp', 'cmqnk5zh200iyrgvfq059hec9', 'மெய்யம்பாளையம்-2', 'Stage 5', NULL, NULL, '8.88 Km', '2026-06-21T09:02:24.552Z'),
  ('cmqnk5zjc00nkrgvfktlu5nae', 'cmqnk5zh200iyrgvfq059hec9', 'மெய்யம்பாளையம்-1', 'Stage 5', NULL, NULL, '9.15 Km', '2026-06-21T09:02:24.553Z'),
  ('cmqnk5zjd00nmrgvfe2i08ua4', 'cmqnk5zh200iyrgvfq059hec9', 'வாழைக்குட்டை', 'Stage 5', NULL, NULL, '9.15 Km', '2026-06-21T09:02:24.553Z'),
  ('cmqnk5zje00norgvfxdo4kux5', 'cmqnk5zh200iyrgvfq059hec9', 'குப்பதாசன் வளவு-1', 'Stage 5', NULL, NULL, '9.02 Km', '2026-06-21T09:02:24.554Z'),
  ('cmqnk5zjf00nqrgvfv75848yn', 'cmqnk5zh200iyrgvfq059hec9', 'வாளன் வளவு', 'Stage 5', NULL, NULL, '8.31 Km', '2026-06-21T09:02:24.555Z'),
  ('cmqnk5zjf00nsrgvfpeh2edhz', 'cmqnk5zh200iyrgvfq059hec9', 'வேலமாவலசு-2', 'Stage 5', NULL, NULL, '10 Km', '2026-06-21T09:02:24.556Z'),
  ('cmqnk5zjh00nurgvfpgoq01xq', 'cmqnk5zh200iyrgvfq059hec9', 'அண்ணாமலைக்காடு', 'Stage 5', NULL, NULL, '9.7 Km', '2026-06-21T09:02:24.557Z'),
  ('cmqnk5zji00nwrgvfqg15xr8w', 'cmqnk5zh200iyrgvfq059hec9', 'பிள்ளையார் கோவில்', 'Stage 5', NULL, NULL, '9.5 Km', '2026-06-21T09:02:24.559Z'),
  ('cmqnk5zjj00nyrgvf1gwfs6ii', 'cmqnk5zh200iyrgvfq059hec9', 'கோழிப்பண்ணை', 'Stage 5', NULL, NULL, '8 Km', '2026-06-21T09:02:24.560Z'),
  ('cmqnk5zjk00o0rgvfnfdzqmhj', 'cmqnk5zh200iyrgvfq059hec9', 'பாசபாலிக்காடு', 'Stage 5', NULL, NULL, '9.2 Km', '2026-06-21T09:02:24.561Z'),
  ('cmqnk5zjl00o2rgvfk4sev9qg', 'cmqnk5zh200iyrgvfq059hec9', 'பாசபாலிக்காடு முருகன் கோவில்', 'Stage 5', NULL, NULL, '9 Km', '2026-06-21T09:02:24.562Z'),
  ('cmqnk5zjm00o4rgvfs7tdd9gp', 'cmqnk5zh200iyrgvfq059hec9', 'பாலதலையான்காடு', 'Stage 5', NULL, NULL, '8.4 Km', '2026-06-21T09:02:24.563Z'),
  ('cmqnk5zjn00o6rgvf6qrghszf', 'cmqnk5zh200iyrgvfq059hec9', 'கோணமோரி', 'Stage 5', NULL, NULL, '8.91 Km', '2026-06-21T09:02:24.564Z'),
  ('cmqnk5zjo00o8rgvfyv4cnqqy', 'cmqnk5zh200iyrgvfq059hec9', 'எலவம்பாளையம் ஊர்', 'Stage 5', NULL, NULL, '9.1 Km', '2026-06-21T09:02:24.564Z'),
  ('cmqnk5zjp00oargvfyii0gj2r', 'cmqnk5zh200iyrgvfq059hec9', 'பள்ளிப்பட்டி-1', 'Stage 5', NULL, NULL, '8.3 Km', '2026-06-21T09:02:24.565Z'),
  ('cmqnk5zjq00ocrgvfrb2bhpne', 'cmqnk5zh200iyrgvfq059hec9', 'பள்ளிப்பட்டி-2', 'Stage 5', NULL, NULL, '8.46 Km', '2026-06-21T09:02:24.566Z'),
  ('cmqnk5zjq00oergvfnf4gqz0t', 'cmqnk5zh200iyrgvfq059hec9', 'பள்ளிப்பட்டி', 'Stage 5', NULL, NULL, '8.46 Km', '2026-06-21T09:02:24.567Z'),
  ('cmqnk5zjr00ogrgvf8ywss52x', 'cmqnk5zh200iyrgvfq059hec9', 'ஆவணியூர்', 'Stage 5', NULL, NULL, '9.24 Km', '2026-06-21T09:02:24.568Z'),
  ('cmqnk5zjs00oirgvfx7sovqle', 'cmqnk5zh200iyrgvfq059hec9', 'கிரேஸி சில்க்ஸ்', 'Stage 5', NULL, NULL, '8.64 Km', '2026-06-21T09:02:24.569Z'),
  ('cmqnk5zjt00okrgvf1fpac9wo', 'cmqnk5zh200iyrgvfq059hec9', 'P.R.M.பங்க்', 'Stage 5', NULL, NULL, '8.37 Km', '2026-06-21T09:02:24.570Z'),
  ('cmqnk5zju00omrgvfsj2j4cdg', 'cmqnk5zh200iyrgvfq059hec9', 'மூக்கரை பெருமாள் கோவில்-1', 'Stage 5', NULL, NULL, '8.06 Km', '2026-06-21T09:02:24.570Z'),
  ('cmqnk5zjv00oorgvf1hebnty8', 'cmqnk5zh200iyrgvfq059hec9', 'மூக்கரை பெருமாள் கோவில்-2', 'Stage 5', NULL, NULL, '8.02 Km', '2026-06-21T09:02:24.571Z'),
  ('cmqnk5zjw00oqrgvfjavffsu3', 'cmqnk5zh200iyrgvfq059hec9', 'காளிகவுண்டன்வளவு', 'Stage 5', NULL, NULL, '9.39 Km', '2026-06-21T09:02:24.572Z'),
  ('cmqnk5zjx00osrgvfqr3ikmpq', 'cmqnk5zh200iyrgvfq059hec9', 'மோட்டூர் பிரிவு', 'Stage 5', NULL, NULL, '8.51 Km', '2026-06-21T09:02:24.573Z'),
  ('cmqnk5zjz00ourgvfu33t2vpu', 'cmqnk5zh200iyrgvfq059hec9', 'எடப்பாடி-ஹவுசிங் போர்டு-1', 'Stage 5', NULL, NULL, '8.26 Km', '2026-06-21T09:02:24.575Z'),
  ('cmqnk5zk000owrgvfz1glmazs', 'cmqnk5zh200iyrgvfq059hec9', 'எடப்பாடி-ஹவுசிங் போர்டு-2', 'Stage 5', NULL, NULL, '8.34 Km', '2026-06-21T09:02:24.576Z'),
  ('cmqnk5zk100oyrgvfcjdrgkmy', 'cmqnk5zh200iyrgvfq059hec9', 'எடப்பாடி-ஹவுசிங் போர்டு-3', 'Stage 5', NULL, NULL, '8.34 Km', '2026-06-21T09:02:24.577Z'),
  ('cmqnk5zk200p0rgvfyo7ln0i0', 'cmqnk5zh200iyrgvfq059hec9', 'எடப்பாடி-ஹவுசிங் போர்டு-4', 'Stage 5', NULL, NULL, '8.48 Km', '2026-06-21T09:02:24.578Z'),
  ('cmqnk5zk300p2rgvf7d8tsem6', 'cmqnk5zh200iyrgvfq059hec9', 'எடப்பாடி-ஹவுசிங் போர்டு-5', 'Stage 5', NULL, NULL, '8.56 Km', '2026-06-21T09:02:24.579Z'),
  ('cmqnk5zk300p4rgvft4z29iiq', 'cmqnk5zh200iyrgvfq059hec9', 'எடப்பாடி-ஹவுசிங் போர்டு-6', 'Stage 5', NULL, NULL, '8.56 Km', '2026-06-21T09:02:24.580Z'),
  ('cmqnk5zk400p6rgvf5gwsb5nk', 'cmqnk5zh200iyrgvfq059hec9', 'எடப்பாடி-ஹவுசிங் போர்டு-7', 'Stage 5', NULL, NULL, '8.67 Km', '2026-06-21T09:02:24.581Z'),
  ('cmqnk5zk500p8rgvffl98kyre', 'cmqnk5zh200iyrgvfq059hec9', 'பனஞ்சாரி', 'Stage 5', NULL, NULL, '5 Km', '2026-06-21T09:02:24.582Z'),
  ('cmqnk5zk600pargvf3g1jt5vv', 'cmqnk5zh200iyrgvfq059hec9', 'காட்டூர் ரோடு-1', 'Stage 5', NULL, NULL, '5 Km', '2026-06-21T09:02:24.583Z'),
  ('cmqnk5zk700pcrgvfa75dw6f0', 'cmqnk5zh200iyrgvfq059hec9', 'காட்டூர் ரோடு-2', 'Stage 5', NULL, NULL, '5 Km', '2026-06-21T09:02:24.584Z'),
  ('cmqnk5zk800pergvfyb6keb9g', 'cmqnk5zh200iyrgvfq059hec9', 'காட்டூர் ரோடு-3', 'Stage 5', NULL, NULL, '5 Km', '2026-06-21T09:02:24.584Z'),
  ('cmqnk5zk900pgrgvfsc6w2obg', 'cmqnk5zh200iyrgvfq059hec9', 'காட்டூர் ரோடு-4', 'Stage 5', NULL, NULL, '5 Km', '2026-06-21T09:02:24.585Z'),
  ('cmqnk5zka00pirgvfr7a91mj6', 'cmqnk5zh200iyrgvfq059hec9', 'காட்டூர் ரோடு-5', 'Stage 5', NULL, NULL, '5 Km', '2026-06-21T09:02:24.586Z'),
  ('cmqnk5zka00pkrgvfcex8neri', 'cmqnk5zh200iyrgvfq059hec9', 'ஏரி ரோடு', 'Stage 5', NULL, NULL, '8.58 Km', '2026-06-21T09:02:24.587Z'),
  ('cmqnk5zkb00pmrgvfqq1sbyew', 'cmqnk5zh200iyrgvfq059hec9', 'ஏரி ரோடு-1', 'Stage 5', NULL, NULL, '8.58 Km', '2026-06-21T09:02:24.588Z'),
  ('cmqnk5zkd00pprgvft90gyku6', 'cmqnk5zkc00pnrgvfj00q3tsb', 'மகுடஞ்சாவடி-1', 'Stage 6', NULL, NULL, '10.7 Km', '2026-06-21T09:02:24.589Z'),
  ('cmqnk5zkf00prrgvff4vtxx6k', 'cmqnk5zkc00pnrgvfj00q3tsb', 'மகுடஞ்சாவடி-2', 'Stage 6', NULL, NULL, '10.4 Km', '2026-06-21T09:02:24.591Z'),
  ('cmqnk5zkg00ptrgvfy9olr903', 'cmqnk5zkc00pnrgvfj00q3tsb', 'மகுடஞ்சாவடி-3', 'Stage 6', NULL, NULL, '10 Km', '2026-06-21T09:02:24.593Z'),
  ('cmqnk5zkh00pvrgvf2371uw7a', 'cmqnk5zkc00pnrgvfj00q3tsb', 'மணியங்காரன் காடு', 'Stage 6', NULL, NULL, '11 Km', '2026-06-21T09:02:24.594Z'),
  ('cmqnk5zki00pxrgvf51mp07u3', 'cmqnk5zkc00pnrgvfj00q3tsb', 'கணக்கச்சிப்பாளையம்', 'Stage 6', NULL, NULL, '11 Km', '2026-06-21T09:02:24.595Z'),
  ('cmqnk5zkj00pzrgvfy7boa07r', 'cmqnk5zkc00pnrgvfj00q3tsb', 'ஊஞ்சக்காடு-1', 'Stage 6', NULL, NULL, '11.05 Km', '2026-06-21T09:02:24.595Z'),
  ('cmqnk5zkk00q1rgvflj7h0his', 'cmqnk5zkc00pnrgvfj00q3tsb', 'ஊஞ்சக்காடு-2', 'Stage 6', NULL, NULL, '11.05 Km', '2026-06-21T09:02:24.596Z'),
  ('cmqnk5zkl00q3rgvflosp1iv9', 'cmqnk5zkc00pnrgvfj00q3tsb', 'ஊஞ்சக்காடு-3', 'Stage 6', NULL, NULL, '11.05 Km', '2026-06-21T09:02:24.597Z'),
  ('cmqnk5zkl00q5rgvfqxp3t5fa', 'cmqnk5zkc00pnrgvfj00q3tsb', 'ஊஞ்சக்காடு-4', 'Stage 6', NULL, NULL, '11.05 Km', '2026-06-21T09:02:24.598Z'),
  ('cmqnk5zkn00q7rgvfk37r9x6p', 'cmqnk5zkc00pnrgvfj00q3tsb', 'ஊஞ்சக்காடு-5', 'Stage 6', NULL, NULL, '11.05 Km', '2026-06-21T09:02:24.599Z'),
  ('cmqnk5zkn00q9rgvfkxssqikj', 'cmqnk5zkc00pnrgvfj00q3tsb', 'சுண்டாக்கல்-1', 'Stage 6', NULL, NULL, '11.81 Km', '2026-06-21T09:02:24.600Z'),
  ('cmqnk5zko00qbrgvffd4qhf96', 'cmqnk5zkc00pnrgvfj00q3tsb', 'சுண்டாக்கல்-2', 'Stage 6', NULL, NULL, '11.81 Km', '2026-06-21T09:02:24.601Z'),
  ('cmqnk5zkp00qdrgvfewnj6xnb', 'cmqnk5zkc00pnrgvfj00q3tsb', 'கரடு-1', 'Stage 6', NULL, NULL, '11.81 Km', '2026-06-21T09:02:24.602Z'),
  ('cmqnk5zkq00qfrgvfjekuxok0', 'cmqnk5zkc00pnrgvfj00q3tsb', 'கரடு-2', 'Stage 6', NULL, NULL, '11.81 Km', '2026-06-21T09:02:24.603Z'),
  ('cmqnk5zkr00qhrgvfc9zd2ewv', 'cmqnk5zkc00pnrgvfj00q3tsb', 'கரடு-3', 'Stage 6', NULL, NULL, '11.81 Km', '2026-06-21T09:02:24.604Z'),
  ('cmqnk5zks00qjrgvf08fy6wj9', 'cmqnk5zkc00pnrgvfj00q3tsb', 'மாரியம்மன்கோவில்', 'Stage 6', NULL, NULL, '11.9 Km', '2026-06-21T09:02:24.604Z'),
  ('cmqnk5zkt00qlrgvfq0wxmpyd', 'cmqnk5zkc00pnrgvfj00q3tsb', 'சங்ககிரி ஆர்.கே.நகர்', 'Stage 6', NULL, NULL, '11.8 Km', '2026-06-21T09:02:24.605Z'),
  ('cmqnk5zku00qnrgvf6hnjdfap', 'cmqnk5zkc00pnrgvfj00q3tsb', 'மாவிலிப்பாளையம்', 'Stage 6', NULL, NULL, '11.2 Km', '2026-06-21T09:02:24.606Z'),
  ('cmqnk5zkw00qprgvf3ppw7nlv', 'cmqnk5zkc00pnrgvfj00q3tsb', 'கொங்கணாபுரம் பிரிவு ரோடு', 'Stage 6', NULL, NULL, '10.5 Km', '2026-06-21T09:02:24.608Z'),
  ('cmqnk5zkx00qrrgvfuk80m04p', 'cmqnk5zkc00pnrgvfj00q3tsb', 'சமுத்திரம்-1', 'Stage 6', NULL, NULL, '11.14 Km', '2026-06-21T09:02:24.609Z'),
  ('cmqnk5zky00qtrgvfrne5qvq3', 'cmqnk5zkc00pnrgvfj00q3tsb', 'சமுத்திரம்-2', 'Stage 6', NULL, NULL, '11.14 Km', '2026-06-21T09:02:24.610Z'),
  ('cmqnk5zkz00qvrgvftbqj1x46', 'cmqnk5zkc00pnrgvfj00q3tsb', 'சமுத்திரம்-3', 'Stage 6', NULL, NULL, '11.11 Km', '2026-06-21T09:02:24.611Z'),
  ('cmqnk5zl000qxrgvftsls9z8g', 'cmqnk5zkc00pnrgvfj00q3tsb', 'சமுத்திரம்-4', 'Stage 6', NULL, NULL, '11.07 Km', '2026-06-21T09:02:24.612Z'),
  ('cmqnk5zl100qzrgvf6oawz595', 'cmqnk5zkc00pnrgvfj00q3tsb', 'சமுத்திரம்-5', 'Stage 6', NULL, NULL, '11.07 Km', '2026-06-21T09:02:24.613Z'),
  ('cmqnk5zl200r1rgvfxxnmopc2', 'cmqnk5zkc00pnrgvfj00q3tsb', 'முத்தையம்பட்டி அரசுபள்ளி', 'Stage 6', NULL, NULL, '11.39 Km', '2026-06-21T09:02:24.614Z'),
  ('cmqnk5zl300r3rgvf2rxzurg9', 'cmqnk5zkc00pnrgvfj00q3tsb', 'முத்தையம்பட்டி', 'Stage 6', NULL, NULL, '11.84 Km', '2026-06-21T09:02:24.616Z'),
  ('cmqnk5zl400r5rgvfq1rj8juf', 'cmqnk5zkc00pnrgvfj00q3tsb', 'காட்டூர்', 'Stage 6', NULL, NULL, '11.04 Km', '2026-06-21T09:02:24.616Z'),
  ('cmqnk5zl500r7rgvfpe6l3qz9', 'cmqnk5zkc00pnrgvfj00q3tsb', 'கரும்பாலை', 'Stage 6', NULL, NULL, '11.01 Km', '2026-06-21T09:02:24.617Z'),
  ('cmqnk5zl600r9rgvfhrvputpz', 'cmqnk5zkc00pnrgvfj00q3tsb', 'புதுப்பாளையம் சந்தை', 'Stage 6', NULL, NULL, '10.08 Km', '2026-06-21T09:02:24.618Z'),
  ('cmqnk5zl700rbrgvfrfbbo71x', 'cmqnk5zkc00pnrgvfj00q3tsb', 'புதுப்பாளையம் மெடிக்கல்', 'Stage 6', NULL, NULL, '10.03 Km', '2026-06-21T09:02:24.619Z'),
  ('cmqnk5zl700rdrgvfpynvxvx7', 'cmqnk5zkc00pnrgvfj00q3tsb', 'கன்னியாம்பட்டி காட்டுவளவு', 'Stage 6', NULL, NULL, '11.2 Km', '2026-06-21T09:02:24.620Z'),
  ('cmqnk5zl800rfrgvfqftjl3uw', 'cmqnk5zkc00pnrgvfj00q3tsb', 'கன்னியாம்பட்டி', 'Stage 6', NULL, NULL, '11.2 Km', '2026-06-21T09:02:24.621Z'),
  ('cmqnk5zl900rhrgvfxdmsx8i6', 'cmqnk5zkc00pnrgvfj00q3tsb', 'காளியம்மன் கோவில்', 'Stage 6', NULL, NULL, '11.2 Km', '2026-06-21T09:02:24.622Z'),
  ('cmqnk5zla00rjrgvfwoge9k4i', 'cmqnk5zkc00pnrgvfj00q3tsb', 'மூலக்கடை-1', 'Stage 6', NULL, NULL, '10.7 Km', '2026-06-21T09:02:24.622Z'),
  ('cmqnk5zlb00rlrgvf6pk7tkjc', 'cmqnk5zkc00pnrgvfj00q3tsb', 'மூலக்கடை-2', 'Stage 6', NULL, NULL, '10.7 Km', '2026-06-21T09:02:24.624Z'),
  ('cmqnk5zld00rnrgvfk2jruxrc', 'cmqnk5zkc00pnrgvfj00q3tsb', 'பணங்காடு', 'Stage 6', NULL, NULL, '10.2 Km', '2026-06-21T09:02:24.625Z'),
  ('cmqnk5zle00rprgvf88dtvesj', 'cmqnk5zkc00pnrgvfj00q3tsb', 'செக்குமேடு', 'Stage 6', NULL, NULL, '10.02 Km', '2026-06-21T09:02:24.627Z'),
  ('cmqnk5zlf00rrrgvf4rz2fgdf', 'cmqnk5zkc00pnrgvfj00q3tsb', 'அக்கரைப்பட்டி-1', 'Stage 6', NULL, NULL, '11.02 Km', '2026-06-21T09:02:24.628Z'),
  ('cmqnk5zlg00rtrgvfnh1xymf0', 'cmqnk5zkc00pnrgvfj00q3tsb', 'அக்கரைப்பட்டி-2', 'Stage 6', NULL, NULL, '11.02 Km', '2026-06-21T09:02:24.628Z'),
  ('cmqnk5zlh00rvrgvfluhko73o', 'cmqnk5zkc00pnrgvfj00q3tsb', 'அக்கரைப்பட்டி-3', 'Stage 6', NULL, NULL, '11.02 Km', '2026-06-21T09:02:24.629Z'),
  ('cmqnk5zli00rxrgvf9yh3mxug', 'cmqnk5zkc00pnrgvfj00q3tsb', 'மூலப்பாதை (கல்வடங்கம்)', 'Stage 6', NULL, NULL, '11.07 Km', '2026-06-21T09:02:24.630Z'),
  ('cmqnk5zlj00rzrgvfaqundjsl', 'cmqnk5zkc00pnrgvfj00q3tsb', 'அருவங்காட்டூர்-1', 'Stage 6', NULL, NULL, '11.08 Km', '2026-06-21T09:02:24.631Z'),
  ('cmqnk5zlj00s1rgvfhofcjjzj', 'cmqnk5zkc00pnrgvfj00q3tsb', 'அருவங்காட்டூர்-2', 'Stage 6', NULL, NULL, '11.08 Km', '2026-06-21T09:02:24.632Z'),
  ('cmqnk5zlk00s3rgvf3xymuse7', 'cmqnk5zkc00pnrgvfj00q3tsb', 'புதூர் மூலக்கடை', 'Stage 6', NULL, NULL, '11.03 Km', '2026-06-21T09:02:24.633Z'),
  ('cmqnk5zll00s5rgvf1q2jw8uu', 'cmqnk5zkc00pnrgvfj00q3tsb', 'புதூர்', 'Stage 6', NULL, NULL, '11.01 Km', '2026-06-21T09:02:24.634Z'),
  ('cmqnk5zlm00s7rgvf430cmpxd', 'cmqnk5zkc00pnrgvfj00q3tsb', 'நாடார் காலனி-1', 'Stage 6', NULL, NULL, '11.1 Km', '2026-06-21T09:02:24.635Z'),
  ('cmqnk5zln00s9rgvf33gph0qi', 'cmqnk5zkc00pnrgvfj00q3tsb', 'நாடார் காலனி-2', 'Stage 6', NULL, NULL, '11 Km', '2026-06-21T09:02:24.635Z'),
  ('cmqnk5zlo00sbrgvf46f4dv9w', 'cmqnk5zkc00pnrgvfj00q3tsb', 'வேலமாவலசு-1', 'Stage 6', NULL, NULL, '10.3 Km', '2026-06-21T09:02:24.636Z'),
  ('cmqnk5zlp00sdrgvf6cnw4rak', 'cmqnk5zkc00pnrgvfj00q3tsb', 'பாண்டியம்மேடு', 'Stage 6', NULL, NULL, '10.1 Km', '2026-06-21T09:02:24.637Z'),
  ('cmqnk5zlp00sfrgvfa6e0ex64', 'cmqnk5zkc00pnrgvfj00q3tsb', 'ஆலங்கொட்டாய்-1', 'Stage 6', NULL, NULL, '12 Km', '2026-06-21T09:02:24.638Z'),
  ('cmqnk5zlq00shrgvfwa4l3z2e', 'cmqnk5zkc00pnrgvfj00q3tsb', 'ஆலங்கொட்டாய்-2', 'Stage 6', NULL, NULL, '12 Km', '2026-06-21T09:02:24.639Z'),
  ('cmqnk5zlr00sjrgvfvgqwknwc', 'cmqnk5zkc00pnrgvfj00q3tsb', 'எட்டிக்கூட்டைமேடு-1', 'Stage 6', NULL, NULL, '10 Km', '2026-06-21T09:02:24.640Z'),
  ('cmqnk5zlt00slrgvfctnd47xm', 'cmqnk5zkc00pnrgvfj00q3tsb', 'எட்டிக்கூட்டைமேடு-2', 'Stage 6', NULL, NULL, '10 Km', '2026-06-21T09:02:24.641Z'),
  ('cmqnk5zlv00sorgvf0id5bn9s', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கெளதம் மெடிக்கல்', 'Stage 7', NULL, NULL, '13.5 Km', '2026-06-21T09:02:24.643Z'),
  ('cmqnk5zlw00sqrgvf2is43yiw', 'cmqnk5zlu00smrgvf5m5nqtdf', 'சந்தைப்பேட்டை', 'Stage 7', NULL, NULL, '13.8 Km', '2026-06-21T09:02:24.644Z'),
  ('cmqnk5zlx00ssrgvfycsgtcnn', 'cmqnk5zlu00smrgvf5m5nqtdf', 'ஃபயர் சர்வீஸ்', 'Stage 7', NULL, NULL, '12.4 Km', '2026-06-21T09:02:24.645Z'),
  ('cmqnk5zly00surgvffz0czbdq', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கிருஷ்ணா நகர்', 'Stage 7', NULL, NULL, '12.7 Km', '2026-06-21T09:02:24.646Z'),
  ('cmqnk5zlz00swrgvfri2go97e', 'cmqnk5zlu00smrgvf5m5nqtdf', 'பூசாரிவளவு', 'Stage 7', NULL, NULL, '13.92 Km', '2026-06-21T09:02:24.647Z'),
  ('cmqnk5zm000syrgvfu1d0y1u3', 'cmqnk5zlu00smrgvf5m5nqtdf', 'பனிக்கனூர் மூலக்கடை', 'Stage 7', NULL, NULL, '13.12 Km', '2026-06-21T09:02:24.648Z'),
  ('cmqnk5zm000t0rgvf4ntnxq45', 'cmqnk5zlu00smrgvf5m5nqtdf', 'பனிக்கனூர்', 'Stage 7', NULL, NULL, '12.66 Km', '2026-06-21T09:02:24.649Z'),
  ('cmqnk5zm100t2rgvfu2ekh2hj', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மன்மதன் வளவு', 'Stage 7', NULL, NULL, '13.08 Km', '2026-06-21T09:02:24.650Z'),
  ('cmqnk5zm200t4rgvf44e61riv', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கசப்பேரி', 'Stage 7', NULL, NULL, '13.11 Km', '2026-06-21T09:02:24.651Z'),
  ('cmqnk5zm300t6rgvfd3xcdprv', 'cmqnk5zlu00smrgvf5m5nqtdf', 'பனஞ்சாரி', 'Stage 7', NULL, NULL, '13.08 Km', '2026-06-21T09:02:24.651Z'),
  ('cmqnk5zm400t8rgvff2wkhbjq', 'cmqnk5zlu00smrgvf5m5nqtdf', 'ஓடக்காடு', 'Stage 7', NULL, NULL, '13.02 Km', '2026-06-21T09:02:24.652Z'),
  ('cmqnk5zm500targvff5o7j97k', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கனரா வங்கி', 'Stage 7', NULL, NULL, '12.04 Km', '2026-06-21T09:02:24.653Z'),
  ('cmqnk5zm600tcrgvfxvfvvwix', 'cmqnk5zlu00smrgvf5m5nqtdf', 'சின்னப்பம்பட்டி', 'Stage 7', NULL, NULL, '12.02 Km', '2026-06-21T09:02:24.654Z'),
  ('cmqnk5zm600tergvfd9jgeya3', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுப்பாளையம்-1', 'Stage 7', NULL, NULL, '13.9 Km', '2026-06-21T09:02:24.655Z'),
  ('cmqnk5zm700tgrgvfbyjrpj6o', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுப்பாளையம்-2', 'Stage 7', NULL, NULL, '13.8 Km', '2026-06-21T09:02:24.656Z'),
  ('cmqnk5zm800tirgvfi6wfhi9v', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுப்பாளையம்-3', 'Stage 7', NULL, NULL, '13.2 Km', '2026-06-21T09:02:24.657Z'),
  ('cmqnk5zma00tkrgvf1msnhfe5', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுப்பாளையம்-4', 'Stage 7', NULL, NULL, '13.1 Km', '2026-06-21T09:02:24.659Z'),
  ('cmqnk5zmb00tmrgvfrtwp4i38', 'cmqnk5zlu00smrgvf5m5nqtdf', 'குள்ளம்பட்டி', 'Stage 7', NULL, NULL, '12.09 Km', '2026-06-21T09:02:24.660Z'),
  ('cmqnk5zmc00torgvf6m3q41ed', 'cmqnk5zlu00smrgvf5m5nqtdf', 'பாரதிநகர்', 'Stage 7', NULL, NULL, '12.05 Km', '2026-06-21T09:02:24.661Z'),
  ('cmqnk5zmd00tqrgvffcjxbf4k', 'cmqnk5zlu00smrgvf5m5nqtdf', 'செங்கானூர்', 'Stage 7', NULL, NULL, '13.8 Km', '2026-06-21T09:02:24.662Z'),
  ('cmqnk5zme00tsrgvf2nzlfwja', 'cmqnk5zlu00smrgvf5m5nqtdf', 'சக்தி வேபிரிட்ஜ்', 'Stage 7', NULL, NULL, '12.03 Km', '2026-06-21T09:02:24.663Z'),
  ('cmqnk5zmf00turgvfoed7f947', 'cmqnk5zlu00smrgvf5m5nqtdf', 'அத்தனூர்', 'Stage 7', NULL, NULL, '13.08 Km', '2026-06-21T09:02:24.663Z'),
  ('cmqnk5zmg00twrgvf7adb9awx', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுக்காடு-1', 'Stage 7', NULL, NULL, '13.03 Km', '2026-06-21T09:02:24.664Z'),
  ('cmqnk5zmh00tyrgvfv2g9x1js', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுக்காடு-2', 'Stage 7', NULL, NULL, '13.03 Km', '2026-06-21T09:02:24.665Z'),
  ('cmqnk5zmh00u0rgvfe5gdobel', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுக்காடு-3', 'Stage 7', NULL, NULL, '13.03 Km', '2026-06-21T09:02:24.666Z'),
  ('cmqnk5zmi00u2rgvff654gn2d', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுக்காடு-4', 'Stage 7', NULL, NULL, '13.01 Km', '2026-06-21T09:02:24.667Z'),
  ('cmqnk5zmj00u4rgvfrzuabh8p', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுக்காடு-5', 'Stage 7', NULL, NULL, '13.01 Km', '2026-06-21T09:02:24.668Z'),
  ('cmqnk5zmk00u6rgvf53bbumgj', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மேட்டுக்காடு-6', 'Stage 7', NULL, NULL, '13.01 Km', '2026-06-21T09:02:24.668Z'),
  ('cmqnk5zml00u8rgvfpyttngqv', 'cmqnk5zlu00smrgvf5m5nqtdf', 'காச்சக்காரனூர்', 'Stage 7', NULL, NULL, '12.06 Km', '2026-06-21T09:02:24.669Z'),
  ('cmqnk5zmm00uargvf7xj3ksiw', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கூத்தம்பாளையம்-1', 'Stage 7', NULL, NULL, '12.04 Km', '2026-06-21T09:02:24.671Z'),
  ('cmqnk5zmn00ucrgvf8d6p3xlm', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கூத்தம்பாளையம்-2', 'Stage 7', NULL, NULL, '12.04 Km', '2026-06-21T09:02:24.671Z'),
  ('cmqnk5zmo00uergvfkak6zh9k', 'cmqnk5zlu00smrgvf5m5nqtdf', 'பொன்னியங்கோவில்', 'Stage 7', NULL, NULL, '12.02 Km', '2026-06-21T09:02:24.672Z'),
  ('cmqnk5zmp00ugrgvfmcvk59b5', 'cmqnk5zlu00smrgvf5m5nqtdf', 'பறையங்காட்டானூர்', 'Stage 7', NULL, NULL, '13 Km', '2026-06-21T09:02:24.673Z'),
  ('cmqnk5zmr00uirgvfywgqalgd', 'cmqnk5zlu00smrgvf5m5nqtdf', 'வளையசெட்டிப்பட்டி பஸ் ஸ்டாப்', 'Stage 7', NULL, NULL, '13.6 Km', '2026-06-21T09:02:24.675Z'),
  ('cmqnk5zms00ukrgvf2y10ykd8', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கலியகவுண்டனூர்-1', 'Stage 7', NULL, NULL, '13.98 Km', '2026-06-21T09:02:24.677Z'),
  ('cmqnk5zmt00umrgvfhcvvzt3u', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கலியகவுண்டனூர்-2', 'Stage 7', NULL, NULL, '13.98 Km', '2026-06-21T09:02:24.677Z'),
  ('cmqnk5zmu00uorgvf5padcq9q', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கலியகவுண்டனூர்-3', 'Stage 7', NULL, NULL, '13.8 Km', '2026-06-21T09:02:24.678Z'),
  ('cmqnk5zmv00uqrgvfdpv6glca', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கலியகவுண்டனூர்-4', 'Stage 7', NULL, NULL, '13.5 Km', '2026-06-21T09:02:24.679Z'),
  ('cmqnk5zmw00usrgvf3rvolhoa', 'cmqnk5zlu00smrgvf5m5nqtdf', 'கலியகவுண்டனூர்-5', 'Stage 7', NULL, NULL, '13.5 Km', '2026-06-21T09:02:24.680Z'),
  ('cmqnk5zmw00uurgvfp0zobq2l', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மோட்டூர்', 'Stage 7', NULL, NULL, '13 Km', '2026-06-21T09:02:24.681Z'),
  ('cmqnk5zmx00uwrgvfuww58yw9', 'cmqnk5zlu00smrgvf5m5nqtdf', 'மோட்டூர் பிரிவு', 'Stage 7', NULL, NULL, '12.8 Km', '2026-06-21T09:02:24.682Z'),
  ('cmqnk5zmy00uyrgvfuix1pvyd', 'cmqnk5zlu00smrgvf5m5nqtdf', 'ஏகாபுரம்', 'Stage 7', NULL, NULL, '12.6 Km', '2026-06-21T09:02:24.683Z'),
  ('cmqnk5zmz00v0rgvfn6a7vcqv', 'cmqnk5zlu00smrgvf5m5nqtdf', 'ஏகாபுரம்-1', 'Stage 7', NULL, NULL, '12.6 Km', '2026-06-21T09:02:24.684Z'),
  ('cmqnk5zn100v3rgvfjvpal3nw', 'cmqnk5zn000v1rgvfbo7396kg', 'தாசங்காடு', 'Stage 8', NULL, NULL, '14.8 Km', '2026-06-21T09:02:24.685Z'),
  ('cmqnk5zn200v5rgvfwt8dbxpf', 'cmqnk5zn000v1rgvfbo7396kg', 'ஆசிரியர் காலனி', 'Stage 8', NULL, NULL, '14.08 Km', '2026-06-21T09:02:24.686Z'),
  ('cmqnk5zn300v7rgvffdkn1v8v', 'cmqnk5zn000v1rgvfbo7396kg', 'முனியம்பட்டி ரைஸ்மில்', 'Stage 8', NULL, NULL, '14.74 Km', '2026-06-21T09:02:24.687Z'),
  ('cmqnk5zn400v9rgvfq9iun9yr', 'cmqnk5zn000v1rgvfbo7396kg', 'தாடிக்காரன்பட்டி', 'Stage 8', NULL, NULL, '14.08 Km', '2026-06-21T09:02:24.688Z'),
  ('cmqnk5zn500vbrgvf7an68pv2', 'cmqnk5zn000v1rgvfbo7396kg', 'மடத்தூர்', 'Stage 8', NULL, NULL, '14.02 Km', '2026-06-21T09:02:24.689Z'),
  ('cmqnk5zn600vdrgvfbpbo86l4', 'cmqnk5zn000v1rgvfbo7396kg', 'செட்டிப்பட்டி சந்தை', 'Stage 8', NULL, NULL, '15.01 Km', '2026-06-21T09:02:24.690Z'),
  ('cmqnk5zn800vfrgvfqscjvj6b', 'cmqnk5zn000v1rgvfbo7396kg', 'பொன்னம்பாளையம்', 'Stage 8', NULL, NULL, '15.8 Km', '2026-06-21T09:02:24.692Z'),
  ('cmqnk5zn900vhrgvft57ozww3', 'cmqnk5zn000v1rgvfbo7396kg', 'காவனூர்', 'Stage 8', NULL, NULL, '15.8 Km', '2026-06-21T09:02:24.693Z'),
  ('cmqnk5zna00vjrgvfbg94oecx', 'cmqnk5zn000v1rgvfbo7396kg', 'பூமணியூர்', 'Stage 8', NULL, NULL, '15.4 Km', '2026-06-21T09:02:24.694Z'),
  ('cmqnk5znb00vlrgvf0rhxv278', 'cmqnk5zn000v1rgvfbo7396kg', 'பூச்சிமரத்துக்காடு', 'Stage 8', NULL, NULL, '15.8 Km', '2026-06-21T09:02:24.695Z'),
  ('cmqnk5znc00vnrgvfsci8z1ov', 'cmqnk5zn000v1rgvfbo7396kg', 'பூமணியூர் ஸ்கூல்', 'Stage 8', NULL, NULL, '15.08 Km', '2026-06-21T09:02:24.696Z'),
  ('cmqnk5znd00vprgvfq8f07blz', 'cmqnk5zn000v1rgvfbo7396kg', 'ஒக்கிலிப்பட்டி', 'Stage 8', NULL, NULL, '15.06 Km', '2026-06-21T09:02:24.697Z'),
  ('cmqnk5znd00vrrgvf2il2tklo', 'cmqnk5zn000v1rgvfbo7396kg', 'எட்டிக்கூட்டைமேடு (கல்வடங்கம்)', 'Stage 8', NULL, NULL, '15.04 Km', '2026-06-21T09:02:24.698Z'),
  ('cmqnk5zne00vtrgvftnxakcyz', 'cmqnk5zn000v1rgvfbo7396kg', 'தண்ணீர்தாசனூர்', 'Stage 8', NULL, NULL, '15.01 Km', '2026-06-21T09:02:24.699Z'),
  ('cmqnk5znf00vvrgvfxyhag6za', 'cmqnk5zn000v1rgvfbo7396kg', 'அய்யனூர்', 'Stage 8', NULL, NULL, '15.08 Km', '2026-06-21T09:02:24.700Z'),
  ('cmqnk5zng00vxrgvfrg03ip1d', 'cmqnk5zn000v1rgvfbo7396kg', 'தாடிக்காரனூர்-1', 'Stage 8', NULL, NULL, '14.09 Km', '2026-06-21T09:02:24.700Z'),
  ('cmqnk5znh00vzrgvfgz55akja', 'cmqnk5zn000v1rgvfbo7396kg', 'தாடிக்காரனூர்-2', 'Stage 8', NULL, NULL, '14.08 Km', '2026-06-21T09:02:24.701Z'),
  ('cmqnk5zni00w1rgvfrd8v6wct', 'cmqnk5zn000v1rgvfbo7396kg', 'தப்பக்குட்டை பிரிவு', 'Stage 8', NULL, NULL, '15.09 Km', '2026-06-21T09:02:24.702Z'),
  ('cmqnk5znj00w3rgvfil1rmxl8', 'cmqnk5zn000v1rgvfbo7396kg', 'குப்பதாசன்வளவு', 'Stage 8', NULL, NULL, '15 Km', '2026-06-21T09:02:24.703Z'),
  ('cmqnk5znj00w5rgvfdgmayj18', 'cmqnk5zn000v1rgvfbo7396kg', 'கூலக்கண்ணண் காடு', 'Stage 8', NULL, NULL, '14.8 Km', '2026-06-21T09:02:24.704Z'),
  ('cmqnk5znl00w7rgvfqvp0oevo', 'cmqnk5zn000v1rgvfbo7396kg', 'வளையசெட்டிப்பட்டி பிரிவு', 'Stage 8', NULL, NULL, '15 Km', '2026-06-21T09:02:24.705Z'),
  ('cmqnk5znn00wargvfpo02838p', 'cmqnk5znl00w8rgvftn2jxo0k', 'மயிலம்பட்டி', 'Stage 9', NULL, NULL, '20.02 Km', '2026-06-21T09:02:24.707Z'),
  ('cmqnk5zno00wcrgvfru4hg92i', 'cmqnk5znl00w8rgvftn2jxo0k', 'கொட்டாயூர்', 'Stage 9', NULL, NULL, '17.08 Km', '2026-06-21T09:02:24.709Z'),
  ('cmqnk5znp00wergvfi7zcvsvm', 'cmqnk5znl00w8rgvftn2jxo0k', 'கல்வடங்கம்', 'Stage 9', NULL, NULL, '18.04 Km', '2026-06-21T09:02:24.710Z'),
  ('cmqnk5znr00wgrgvfnk97kkyv', 'cmqnk5znl00w8rgvftn2jxo0k', 'புளியம்பட்டி', 'Stage 9', NULL, NULL, '20.2 Km', '2026-06-21T09:02:24.711Z'),
  ('cmqnk5zns00wirgvfartga1jw', 'cmqnk5znl00w8rgvftn2jxo0k', 'இளம்பிள்ளை', 'Stage 9', NULL, NULL, '19.9 Km', '2026-06-21T09:02:24.712Z'),
  ('cmqnk5znt00wkrgvf0397g5xl', 'cmqnk5znl00w8rgvftn2jxo0k', 'ராமாபுரம்', 'Stage 9', NULL, NULL, '19.5 Km', '2026-06-21T09:02:24.713Z'),
  ('cmqnk5znt00wmrgvf6cew0zky', 'cmqnk5znl00w8rgvftn2jxo0k', 'பெருமாகவுண்டம்பட்டி', 'Stage 9', NULL, NULL, '18.6 Km', '2026-06-21T09:02:24.714Z'),
  ('cmqnk5znu00worgvfhs8o4asc', 'cmqnk5znl00w8rgvftn2jxo0k', 'வேம்படிதாளம்', 'Stage 9', NULL, NULL, '17.8 Km', '2026-06-21T09:02:24.715Z'),
  ('cmqnk5znv00wqrgvfqw380iz5', 'cmqnk5znl00w8rgvftn2jxo0k', 'தேலூர்', 'Stage 9', NULL, NULL, '19.08 Km', '2026-06-21T09:02:24.716Z'),
  ('cmqnk5znw00wsrgvf1kb176bw', 'cmqnk5znl00w8rgvftn2jxo0k', 'ஜலகண்டாபுரம்', 'Stage 9', NULL, NULL, '20.4 Km', '2026-06-21T09:02:24.717Z');

