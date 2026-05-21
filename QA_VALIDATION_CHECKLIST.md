# QA Validation Checklist
## Junior School Admissions & Onboarding System

---

## 1. First Launch

- [ ] `build_and_deploy.bat seed` completes without errors
- [ ] Browser opens `http://localhost:3000` and redirects to `/login`
- [ ] Login page shows school name and "Staff Login" heading
- [ ] Login with wrong password shows error toast
- [ ] Login with `admin` / `Admin@12345` redirects to `/change-password` (force change)
- [ ] Change password to a new value → redirected to `/login`
- [ ] Login with new password → lands on `/dashboard`

---

## 2. Dashboard

- [ ] Dashboard shows 6 KPI cards (Today's Registrations, Admissions, Pending Docs, Fee Pending, Special Support, Transport)
- [ ] Class-wise Summary table shows seeded grades (Pre-KG through Grade 2)
- [ ] Seat Availability progress bars render
- [ ] Source-wise enquiries section shows "No enquiry data yet" initially

---

## 3. Settings

### Academic Years
- [ ] `/settings/academic-years` lists seeded year `2026-27` as Current
- [ ] "New Year" creates e.g. `2027-28` and appears in list
- [ ] "Set Current" changes current year

### Grades
- [ ] `/settings/grades` lists Pre-KG, LKG, UKG, Grade 1, Grade 2

### Staff Users
- [ ] `/settings/users` lists `admin` user
- [ ] "Add Staff" form creates a new user with selected roles
- [ ] Deactivate user prevents that user from logging in
- [ ] Reset password forces password change on next login

### Document Types
- [ ] All seeded document types appear in list

### Enquiry Sources
- [ ] All seeded enquiry sources appear in list

---

## 4. Registration Module

### Create Registration
- [ ] `/registrations/new` form loads with academic year and campus pre-selected
- [ ] Submit without Student Name shows validation error
- [ ] Submit without any contact number shows validation error
- [ ] Submit with Special Support = Yes but no details shows validation error
- [ ] Valid submit creates registration and redirects to detail page
- [ ] Registration number format is `REG-2026-0001`
- [ ] Registration appears in `/registrations` list

### Registration Detail
- [ ] All fields display correctly on detail page
- [ ] Status badge shows "Registered"
- [ ] "Edit" button navigates to edit form
- [ ] "Print" button shows print-friendly page with registration number
- [ ] "Cancel" button requires reason, cancels registration
- [ ] "Start Admission" button starts the admission flow

### Search & Filter
- [ ] Search by student name filters results
- [ ] Search by registration number filters results
- [ ] Filter by grade filters correctly
- [ ] Filter by status filters correctly
- [ ] "Clear" button removes all filters

---

## 5. Admission Module

### Create Admission
- [ ] "Start Admission" from registration navigates to `/admissions/new?registrationId=...`
- [ ] Admission is created with DRAFT status
- [ ] Registration status changes to "Admission Started"
- [ ] Redirect lands on `/admissions/[id]` detail page

### Student Information Tab
- [ ] Displays pre-filled data from registration
- [ ] "Edit" mode allows update of all fields including Tamil name, Aadhaar last 4
- [ ] Save updates the student record

### Parent/Guardian Tab
- [ ] Can enter Father, Mother, and Guardian details
- [ ] Primary contact person dropdown works
- [ ] Save stores guardian records in DB

### Previous School Tab
- [ ] Can enter and save previous school details

### Medical Tab
- [ ] "Has Allergies" checkbox reveals allergy details field
- [ ] "Requires Medication" checkbox reveals medication details field
- [ ] Save stores medical profile

### Documents Tab
- [ ] Shows list of uploaded documents
- [ ] Upload a PDF — file appears with UPLOADED status
- [ ] Upload non-allowed file type shows error
- [ ] "Verify" button changes status to VERIFIED
- [ ] "Reject" button requires reason, changes status to REJECTED
- [ ] "Waive" button requires reason, changes status to WAIVED

### Payments Tab
- [ ] "Add Payment" form shows all payment modes
- [ ] WAIVER mode requires waiver reason
- [ ] Submit records payment with receipt number (`RCP-2026-0001`)
- [ ] Payment appears in list with status PAID or WAIVED
- [ ] Total collected summary updates

### Confirm Admission
- [ ] "Confirm Admission" button appears on DRAFT admissions
- [ ] If required documents not verified/waived → error toast
- [ ] If pending payments exist → error toast
- [ ] After verifying docs and recording payments → confirmation succeeds
- [ ] Admission number generated: `ADM-2026-0001`
- [ ] Registration status changes to "Admitted"
- [ ] Status badge changes to "Confirmed"

### Cancel Admission
- [ ] Cancel requires reason
- [ ] Cancelled admission shows CANCELLED status
- [ ] Registration reverts to REGISTERED status

---

## 6. Documents Module

- [ ] `/documents` shows all pending (Not Received, Uploaded) documents
- [ ] Count in page header matches actual records

---

## 7. Payments Module

- [ ] `/payments` lists all payment records with receipt numbers
- [ ] Total collected shown in page header
- [ ] Links to admission detail pages work

---

## 8. Reports

### All reports must:
- [ ] Have academic year filter
- [ ] Show correct data (no mock/static data)
- [ ] "CSV" button downloads a valid CSV file
- [ ] "Print" button triggers browser print dialog

### Registration Summary
- [ ] Shows all registrations with correct status badges
- [ ] Grade and date range filters work

### Admission Summary
- [ ] Shows only CONFIRMED admissions
- [ ] Admission numbers shown

### Pending Documents
- [ ] Shows documents in NOT_RECEIVED or UPLOADED status
- [ ] Required vs Optional shown correctly

### Fee Pending
- [ ] Shows PENDING and PARTIAL payments
- [ ] Total pending amount shown in summary card

### Fee Collected
- [ ] Shows PAID and WAIVED payments
- [ ] Total collected shown in summary card

### Seat Availability
- [ ] Shows all grades with fill percentage bars

### Source-wise Enquiries
- [ ] Shows cards per source with counts

### Medical / Special Support
- [ ] Shows only registrations with special_support = true

### Transport
- [ ] Shows students with transport required = true

### Meeting Summary
- [ ] Today's date used as default date range
- [ ] Shows counts for registrations, admissions, and fees collected today

---

## 9. Audit Logs

- [ ] Login success logged
- [ ] Login failure logged (wrong password)
- [ ] Registration creation logged
- [ ] Admission creation logged
- [ ] Admission confirmation logged
- [ ] Password change logged
- [ ] Document upload logged

---

## 10. Security

- [ ] Accessing `/dashboard` without login redirects to `/login`
- [ ] Accessing `/registrations` without login redirects to `/login`
- [ ] `storage/uploads/` files are not directly accessible via browser URL
- [ ] Session expires after 8 hours (re-login required)
- [ ] `must_change_password = true` users are redirected to `/change-password`

---

## 11. Edge Cases

- [ ] Creating two registrations with same name + DOB + mobile works (no hard block — duplicate warning system is informational)
- [ ] Admission confirmation blocked if required doc is NOT_RECEIVED
- [ ] Admission confirmation blocked if fee is PENDING
- [ ] Cancelling a CONFIRMED admission is blocked (UI should not allow)
- [ ] Registration number sequence continues correctly across sessions
- [ ] Pagination works on registrations list with 21+ records

---

## 12. Print / Export

- [ ] Registration Acknowledgement print has registration number and school name
- [ ] Admission print page shows all filled sections
- [ ] Report CSV exports have correct column headers and data

---

## First Things to Test

1. Complete login flow (admin → force password change → dashboard)
2. Create one Registration end-to-end
3. Start Admission → fill all tabs → confirm admission
4. Verify Dashboard KPIs update after each step
5. Download Registration Summary CSV and verify data
