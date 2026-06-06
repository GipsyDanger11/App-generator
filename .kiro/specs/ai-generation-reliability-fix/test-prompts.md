# Test Prompts Documentation

## Overview

This document provides example test prompts for verifying the AI app generation system. Each prompt is designed to test that the system generates complete CRUD applications with entities, table pages, form pages, and themes—not just hero landing pages.

These prompts can be used for:
- Manual testing during development
- Integration testing with template fallback
- Verifying the complete generation pipeline
- Debugging AI provider responses

## Template Matching Prompts

The following prompts are designed to match existing templates. They should produce high-quality configs either from the AI provider or from template fallback.

### 1. CRM Application

**Prompt:**
```
Build a CRM app for managing real estate properties and leads
```

**Alternative Prompts:**
- "Create a customer relationship management system"
- "Build a real estate CRM with property listings"
- "I need an app to track leads and properties"

**Expected Results:**

**Entities:**
- `Property` entity with fields: address, price, propertyType, bedrooms, bathrooms, squareFeet, status, description
- `Lead` entity with fields: name, email, phone, budget, leadSource, score, notes
- `Showing` entity with fields: property (relation), lead (relation), date, status, feedback

**Pages:**
- Home route (`/`) with hero and stats components
- Properties list route (`/properties`) with table component
- Property creation route (`/properties/new`) with form component
- Leads list route (`/leads`) with table component
- Lead creation route (`/leads/new`) with form component
- Showings list route (`/showings`) with table/timeline component
- Showing creation route (`/showings/new`) with form component

**Theme:**
- Primary color: cyan/teal range (#0891b2 or similar)
- Accent color: lighter cyan (#06b6d4 or similar)
- Logo text: includes property/real estate emoji (🏡)

**Verification Steps:**
1. Check logs for complete request trace with request ID
2. Verify `validation_pass` log entry shows entities ≥ 3, tablePages ≥ 3, formPages ≥ 3
3. Verify `augmentation_complete` log shows minimal pages added (config should be complete from AI)
4. Check generated app in UI:
   - Navigate to each entity route (e.g., `/properties`)
   - Verify table displays with sortable columns
   - Click "Add [Entity]" button and verify form appears
   - Verify theme colors are applied in header and buttons
5. Verify no errors in browser console

---

### 2. Task/Project Manager

**Prompt:**
```
Build a task manager app with projects and sprints
```

**Alternative Prompts:**
- "Create a project management system"
- "Build a sprint planning tool with user stories"
- "I need an app to track tasks and milestones"

**Expected Results:**

**Entities:**
- `Project` entity with fields: name, client, status, startDate, deadline, budget, description
- `Sprint` entity with fields: name, project (relation), startDate, endDate, status, goal
- `Story` entity with fields: title, sprint (relation), storyPoints, status, assignee, description
- `Milestone` entity with fields: title, project (relation), dueDate, status, description

**Pages:**
- Home route (`/`) with hero, stats, and kanban board for current sprint
- Projects list route (`/projects`) with table component
- Project creation route (`/projects/new`) with form component
- Sprints list route (`/sprints`) with table component
- Sprint creation route (`/sprints/new`) with form component
- Backlog route (`/backlog`) with table component showing stories
- Story creation route (`/backlog/new`) with form component
- Milestones route (`/milestones`) with timeline component
- Milestone creation route (`/milestones/new`) with form component

**Theme:**
- Primary color: purple range (#8b5cf6 or similar)
- Accent color: lighter purple (#a78bfa or similar)
- Logo text: includes project/rocket emoji (🚀)

**Verification Steps:**
1. Check logs for `provider_success` with structure showing 4 entities, 9+ pages
2. Verify `validation_pass` log entry confirms presence of table and form pages
3. Check generated app in UI:
   - Verify home page shows kanban board (Stories grouped by status)
   - Navigate to `/projects` and verify table loads
   - Click "New Project" and verify form has all fields (name, client, status, etc.)
   - Navigate to `/milestones` and verify timeline component renders
   - Verify theme colors are consistently applied
4. Verify relations work: Create a project, then create a sprint linked to that project

---

### 3. Restaurant Manager

**Prompt:**
```
Build a restaurant management app with reservations and menu
```

**Alternative Prompts:**
- "Create a restaurant reservation system"
- "Build an app for managing tables, menus, and staff"
- "I need a dining management system"

**Expected Results:**

**Entities:**
- `Reservation` entity with fields: guestName, phone, email, partySize, dateTime, tableNumber, status, specialRequests
- `MenuItem` entity with fields: name, category, price, available, ingredients, description
- `Staff` entity with fields: name, role, phone, email, hireDate, status
- `Shift` entity with fields: staff (relation), date, shiftType, status

**Pages:**
- Home route (`/`) with hero, stats, and timeline of today's reservations
- Reservations list route (`/reservations`) with table component
- Reservation creation route (`/reservations/new`) with form component
- Menu route (`/menu`) with table component showing menu items
- Menu item creation route (`/menu/new`) with form component
- Staff route (`/staff`) with table component
- Staff creation route (`/staff/new`) with form component
- Schedule route (`/schedule`) with kanban board (shifts by shift type)
- Shift creation route (`/schedule/new`) with form component

**Theme:**
- Primary color: red range (#dc2626 or similar)
- Accent color: lighter red/pink (#f87171 or similar)
- Logo text: includes dining emoji (🍽️)

**Verification Steps:**
1. Check logs for complete pipeline execution (request_start → provider_attempt → validation_pass → augmentation_complete → request_complete)
2. Verify execution time in logs is reasonable (<5 seconds)
3. Check generated app in UI:
   - Verify home page shows timeline component with reservations
   - Navigate to `/menu` and verify menu items table with category grouping
   - Create a new reservation and verify datetime picker works
   - Navigate to `/schedule` and verify kanban shows shifts grouped by shift type
   - Verify select fields have proper options (e.g., reservation status: Confirmed, Seated, Completed, Cancelled)
4. Verify theme colors are applied to stats cards, buttons, and navigation

---

### 4. Fitness Tracker

**Prompt:**
```
Build a fitness tracker app with workouts and meals
```

**Alternative Prompts:**
- "Create a workout logging app"
- "Build a fitness app to track exercise and nutrition"
- "I need an app for tracking workouts and body metrics"

**Expected Results:**

**Entities:**
- `Workout` entity with fields: date, type, duration, caloriesBurned, intensity, notes
- `Exercise` entity with fields: name, category, equipment, difficulty, description
- `Meal` entity with fields: date, mealType, description, calories, protein, carbs, fats, notes
- `BodyMetric` entity with fields: date, weight, bodyFat, muscleMass

**Pages:**
- Home route (`/`) with hero, stats (total workouts, total calories burned, etc.)
- Workouts list route (`/workouts`) with table component
- Workout creation route (`/workouts/new`) with form component
- Exercise library route (`/exercises`) with table component
- Exercise creation route (`/exercises/new`) with form component
- Meals list route (`/meals`) with table component
- Meal creation route (`/meals/new`) with form component
- Body metrics route (`/metrics`) with chart/table component
- Body metric creation route (`/metrics/new`) with form component

**Theme:**
- Primary color: orange range (#ea580c or similar)
- Accent color: lighter orange (#fb923c or similar)
- Logo text: includes fitness emoji (💪)

**Verification Steps:**
1. Check logs for provider used (should show which AI provider succeeded)
2. Verify `validation_pass` log confirms all required page types present
3. Check generated app in UI:
   - Verify stats on home page show workout counts and calorie totals
   - Navigate to `/workouts` and verify table shows date, type, duration, calories
   - Create a new workout and verify select fields have options (type: Strength, Cardio, Flexibility, Sports)
   - Navigate to `/exercises` and verify exercise library table
   - Verify chart component renders for body metrics (if present)
4. Verify number fields accept decimals (e.g., bodyFat: 18.5%)

---

### 5. Habit Tracker

**Prompt:**
```
Build a habit tracker app to track daily habits
```

**Alternative Prompts:**
- "Create a habit tracking system"
- "Build an app to track daily routines and streaks"
- "I need an app for building better habits"

**Expected Results:**

**Entities:**
- `Habit` entity with fields: name, description, category, frequency, targetDays, status
- `HabitLog` entity with fields: habit (relation), date, completed, notes

**Pages:**
- Home route (`/`) with hero and stats (total habits, completion rate, current streaks)
- Habits list route (`/habits`) with table component
- Habit creation route (`/habits/new`) with form component
- Habit logs route (`/logs`) with table/calendar component
- Habit log creation route (`/logs/new`) with form component

**Theme:**
- Primary color: generated based on app name hash
- Accent color: complementary to primary
- Logo text: includes appropriate emoji

**Verification Steps:**
1. Check logs for theme generation (should log `themeGenerated: true` if AI didn't provide theme)
2. Verify `augmentation_complete` log shows pages added if AI returned incomplete config
3. Check generated app in UI:
   - Verify home page shows habit stats
   - Navigate to `/habits` and verify table shows all habit fields
   - Create a new habit and verify form validation works (required fields)
   - Navigate to `/logs` and verify habit logs table
   - Verify relation field works (selecting a habit when creating a log)
4. Verify theme colors are valid hex codes and visually distinct

---

### 6. Book Library

**Prompt:**
```
Build a book library app to manage my reading list
```

**Alternative Prompts:**
- "Create a book collection manager"
- "Build an app to track books I've read"
- "I need a reading list app with book reviews"

**Expected Results:**

**Entities:**
- `Book` entity with fields: title, author, isbn, genre, status, rating, publishedDate, pageCount, coverUrl, summary
- `Review` entity with fields: book (relation), rating, reviewText, date

**Pages:**
- Home route (`/`) with hero and stats (total books, books read, average rating)
- Books list route (`/books`) with table component
- Book creation route (`/books/new`) with form component
- Reviews list route (`/reviews`) with table component
- Review creation route (`/reviews/new`) with form component

**Theme:**
- Primary color: generated or AI-provided
- Accent color: generated or AI-provided
- Logo text: includes book emoji (📚)

**Verification Steps:**
1. Check logs for complete request trace from start to finish
2. Verify no errors in logs (no provider failures if API keys are configured)
3. Check generated app in UI:
   - Verify home page stats show book counts
   - Navigate to `/books` and verify table shows title, author, genre, status, rating
   - Create a new book and verify all field types work (string, select, number, date, url, text)
   - Navigate to `/reviews` and verify reviews table with book relation
   - Create a review and verify relation picker shows list of books
4. Verify sorting and searching work in tables

---

## Generic Test Prompts

These prompts test the system's ability to generate custom apps that don't match existing templates. The AI should generate appropriate entities and pages based on the domain.

### 7. Inventory Management

**Prompt:**
```
Build an inventory management system for a warehouse
```

**Expected Results:**
- Entities: `Product`, `Category`, `Supplier`, `StockMovement`
- Each entity has appropriate fields (e.g., Product: name, sku, quantity, price, category)
- Table pages for listing each entity
- Form pages for creating/editing each entity
- Home page with inventory stats (total products, low stock alerts, etc.)
- Theme with business-appropriate colors

**Verification Steps:**
1. Check logs confirm AI generated custom entities (not template fallback)
2. Verify `validation_pass` shows entities ≥ 1, tablePages ≥ 1, formPages ≥ 1
3. Verify generated entities make sense for the domain (warehouse/inventory)
4. Verify relations are created where appropriate (Product → Category)

---

### 8. Event Management

**Prompt:**
```
Build an event management app for conferences
```

**Expected Results:**
- Entities: `Event`, `Speaker`, `Session`, `Attendee`, `Venue`
- Each entity has domain-appropriate fields (Event: name, date, location, capacity)
- Table and form pages for each entity
- Home page with event stats
- Relations between entities (Session → Event, Session → Speaker)

**Verification Steps:**
1. Check logs for provider selection and response time
2. Verify generated config passes validation
3. Verify entity fields are relevant to event management
4. Verify relations are logical (sessions belong to events)

---

### 9. Medical Clinic

**Prompt:**
```
Build a medical clinic management system
```

**Expected Results:**
- Entities: `Patient`, `Appointment`, `Doctor`, `MedicalRecord`
- Appropriate fields (Patient: name, dateOfBirth, phone, email, address)
- HIPAA-appropriate field types (no overly specific medical data in basic fields)
- Table and form pages for all entities
- Timeline or calendar component for appointments

**Verification Steps:**
1. Check logs for complete generation without errors
2. Verify entities are appropriate for medical domain
3. Verify sensitive fields use appropriate types (e.g., text area for notes)
4. Verify appointment entity has datetime field and relations to Patient/Doctor

---

### 10. School Management

**Prompt:**
```
Build a school management system with students and classes
```

**Expected Results:**
- Entities: `Student`, `Class`, `Teacher`, `Grade`, `Assignment`
- Appropriate fields (Student: name, studentId, grade, enrollmentDate)
- Relations between entities (Student → Class, Assignment → Class)
- Table and form pages for all entities
- Stats showing student counts, class counts, etc.

**Verification Steps:**
1. Check logs for validation and augmentation results
2. Verify education-appropriate entities and fields
3. Verify relations make sense (students enroll in classes)
4. Verify select fields have appropriate options (e.g., grade level: K-12)

---

## Verification Checklist

For every test prompt, verify the following:

### Log Verification

1. **Request Trace Complete:**
   - `request_start` log with prompt and request ID
   - `provider_attempt` log(s) showing which providers were tried
   - `provider_success` or `provider_failure` logs
   - `validation_pass` or `validation_fail` log
   - `augmentation_complete` log
   - `request_complete` log with execution time

2. **Provider Execution:**
   - At least one provider was attempted
   - If provider failed, fallback was attempted or template was used
   - Success logs show response time and structure summary

3. **Validation Results:**
   - `validation_pass` log confirms entities > 0
   - `validation_pass` log confirms tablePages > 0
   - `validation_pass` log confirms formPages > 0

4. **Augmentation Results:**
   - `augmentation_complete` log shows pages added (if any)
   - If AI returned complete config, pagesAdded should be 0 or minimal
   - `themeGenerated` field indicates whether theme was AI-provided or generated

### UI Verification

1. **Home Page:**
   - Hero component displays with app name and description
   - Stats component shows entity counts
   - No "Unknown Component" notices appear

2. **Entity List Pages:**
   - Navigate to each entity route (e.g., `/books`, `/customers`)
   - Table component renders with data
   - Columns show fields marked `showInList: true`
   - "Add [Entity]" button is visible
   - Sorting works (click column headers)
   - Search works (if searchable fields exist)

3. **Entity Form Pages:**
   - Navigate to creation route (e.g., `/books/new`)
   - Form component renders with all entity fields
   - Field types are correct (string → text input, select → dropdown, date → date picker)
   - Required fields are marked with asterisk
   - Submit button is present
   - Form validation works (try submitting empty form for required fields)

4. **Entity Edit Pages:**
   - Click edit icon on a table row
   - Form pre-fills with existing data
   - Changes can be saved
   - Cancel button returns to list

5. **Relations:**
   - If entities have relations (e.g., Book → Author), verify relation picker appears in form
   - Verify relation picker shows list of related entities
   - Verify selecting a relation works
   - Verify related entity displays in table (shows label, not raw ID)

6. **Theme Application:**
   - Header uses primary color
   - Buttons use primary color
   - Accent color appears in hover states or secondary elements
   - Logo text appears in header
   - Colors are visually distinct and readable

7. **Special Components:**
   - If config includes chart component, verify it renders (may need data first)
   - If config includes kanban component, verify columns display correctly
   - If config includes timeline component, verify events display chronologically
   - If config includes stats component, verify aggregations work (counts, sums, averages)

### Data Operations

1. **Create:**
   - Fill out form and submit
   - Verify success message or redirect to list page
   - Verify new entity appears in table

2. **Read:**
   - Verify table shows created entities
   - Verify pagination works if more than pageSize entities
   - Verify entity count in stats updates

3. **Update:**
   - Click edit on an entity
   - Modify a field
   - Submit form
   - Verify changes appear in table

4. **Delete:**
   - Click delete icon on a table row
   - Confirm deletion (if confirmation prompt appears)
   - Verify entity removed from table
   - Verify entity count in stats updates

### Error Handling

1. **Form Validation:**
   - Try submitting form with required fields empty → should show validation error
   - Try invalid email format → should show validation error
   - Try negative number in number field (if not allowed) → should show validation error

2. **Network Errors:**
   - Verify loading states appear during API calls
   - Verify error messages display if API call fails (can simulate by stopping dev server)

3. **Unknown Components:**
   - If config contains unknown component kind, verify "Unknown Component" notice displays instead of crash

---

## Test Mode Usage

To test without consuming AI API credits:

1. **Set Environment Variable:**
   ```bash
   AI_TEST_MODE=true npm run dev
   ```

2. **Expected Behavior:**
   - System skips external AI provider calls
   - Falls back to template immediately
   - Logs show: `provider_skip` events with reason "test mode"
   - Logs show: `template_fallback` with selected template

3. **Verification:**
   - All test prompts should work in test mode
   - Template fallback should match prompt keywords
   - Complete log trace should appear even in test mode

---

## Debugging Failed Tests

If a test prompt fails to produce a complete app:

### Symptom: Hero-only page generated

**Diagnostic Steps:**
1. Check logs for `validation_fail` entries → indicates AI returned incomplete config
2. Check logs for `augmentation_complete` → should show pages added
3. If `pagesAdded: 0`, the validation might not be working correctly
4. If no `augmentation_complete` log, `ensureCompleteApp()` might not be called

**Common Causes:**
- AI provider returned only hero page, validation didn't catch it
- `ensureCompleteApp()` not called on the config
- Dev server running stale code (restart and clear cache)

### Symptom: No logs appear

**Diagnostic Steps:**
1. Check health endpoint: `GET http://localhost:3000/api/apps/generate/health`
2. Verify `version` field matches current code
3. Check `processUptime` → if high, restart might not have occurred

**Common Causes:**
- Dev server not restarted after code changes
- Next.js cache not cleared (`.next/` directory)
- Logger not instantiated (check `createLogger` is called in API route)

### Symptom: All providers fail

**Diagnostic Steps:**
1. Check logs for `provider_failure` entries
2. Check error messages in logs
3. Verify API keys are configured in `.env`
4. Check `providers.configured` array in health endpoint

**Common Causes:**
- Missing or invalid API keys
- Rate limiting from provider
- Network connectivity issues
- Provider API downtime

**Fallback:**
- System should fall back to template (check for `template_fallback` log)
- If no template fallback, template matching might be broken

### Symptom: Generated app doesn't work

**Diagnostic Steps:**
1. Open browser console and check for errors
2. Check Network tab for failed API requests
3. Verify database connection (try creating an entity)
4. Check config structure in logs (`finalConfig` or via Config View tab)

**Common Causes:**
- Invalid field types in config (parser should handle this)
- Missing required component props (renderer should handle this)
- Database schema out of sync (run `npx prisma db push`)
- Circular relations or invalid entity references

---

## Success Criteria Summary

A test prompt is considered **successful** if:

1. ✅ Complete log trace appears in console (request_start through request_complete)
2. ✅ `validation_pass` log confirms entities, table pages, and form pages exist
3. ✅ Generated app has at least 1 entity
4. ✅ Generated app has table page for the entity
5. ✅ Generated app has form page for the entity
6. ✅ Theme colors are present and valid hex codes
7. ✅ Home page renders without errors
8. ✅ Entity list page displays table
9. ✅ Entity form page displays form with all fields
10. ✅ CRUD operations work (create, read, update, delete)
11. ✅ No "Unknown Component" notices appear
12. ✅ No errors in browser console
13. ✅ Execution time < 5 seconds (logged in `request_complete`)

---

## Appendix: Expected Template Matches

When using template fallback (either explicitly or when all AI providers fail), these prompts should match these templates:

| Prompt Keywords | Expected Template | Template ID |
|----------------|-------------------|-------------|
| "CRM", "customer", "lead", "real estate", "property" | Real Estate CRM | `crm` |
| "task", "project", "sprint", "milestone", "story" | Project Manager | `tasks` |
| "restaurant", "reservation", "menu", "dining", "table" | Restaurant Manager | `inventory` |
| "fitness", "workout", "exercise", "meal", "body metric" | Fitness Tracker | `expenses` |
| "habit", "routine", "daily", "streak", "tracking" | Habit Tracker | (if exists) |
| "book", "library", "reading", "author", "review" | Book Library | `library` |

If no keywords match, system should use a generic template (typically CRM as default).

---

## Continuous Testing

As the system evolves, continuously test with these prompts to catch regressions:

**Daily:** Test at least 2 template matching prompts (e.g., CRM + Tasks)
**Weekly:** Test all 10 prompts in this document
**Before Release:** Full test suite + manual verification of all checklist items

**Automated Testing (Future):**
- Integration tests that call `/api/apps/generate` with these prompts
- Assert on returned config structure (entities.length > 0, etc.)
- Assert on log output (validation_pass appears, etc.)
- Visual regression testing on rendered apps

---

## Notes

- These prompts are continuously updated based on testing results
- Add new test cases when bugs are discovered or new templates are added
- Keep this document in sync with `lib/config/templates.ts`
- Share test results with the team (log findings, failure patterns)

**Last Updated:** 2024-01-15 (Initial version for AI Generation Reliability Fix spec)
