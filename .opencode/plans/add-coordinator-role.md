# Add Coordinator Role — Full Implementation Plan

## Goal
Introduce a `coordinator` role for CWTS/LTS/MTS component oversight. Coordinator creates facilitators and modules. Facilitator loses module creation; only handles grades/attendance. Admin creates coordinator accounts only.

---

## Step 1: Backend — Prisma Schema
**File:** `backend/prisma/schema.prisma`

### Changes
```diff
 enum UserRole {
   ADMIN
+  COORDINATOR
   INSTRUCTOR
   STUDENT
 }
```

Add after `InstructorProfile` model:
```prisma
model CoordinatorProfile {
  id             String          @id @default(cuid())
  userId         String          @unique
  employeeNumber String?         @unique
  componentId    String?
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  component      NSTPComponent?  @relation(fields: [componentId], references: [id], onDelete: SetNull)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([componentId])
  @@map("coordinator_profile")
}
```

Add to `User` model:
```diff
 model User {
   ...
   studentProfile    StudentProfile?
   instructorProfile InstructorProfile?
+  coordinatorProfile CoordinatorProfile?
   ...
 }
```

### Run migration
```
npx prisma migrate dev --name add_coordinator_role
```

---

## Step 2: Backend — NSTP Service
**File:** `backend/src/modules/nstp/nstp.service.js`

### Changes

**a) `toUserRole()` — add coordinator mapping:**
```javascript
const toUserRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') return 'ADMIN';
  if (normalized === 'coordinator') return 'COORDINATOR';
  if (normalized === 'instructor' || normalized === 'facilitator' || normalized === 'speaker') return 'INSTRUCTOR';
  return 'STUDENT';
};
```

**b) `listCollection()` for `'accounts'` — include coordinatorProfile:**
```diff
 if (name === 'accounts') {
   return withFallback(name, async () => prisma.user.findMany({
     orderBy: { createdAt: 'desc' },
-    include: { instructorProfile: true },
+    include: { instructorProfile: true, coordinatorProfile: true },
   }));
 }
```

**c) `upsertCollectionRecord()` for `'accounts'` — handle COORDINATOR role:**
After the `if (userRole === 'INSTRUCTOR')` block, add coordinator profile handling:
```javascript
if (userRole === 'COORDINATOR') {
  const component = profileData.componentId
    ? await prisma.nSTPComponent.findUnique({ where: { id: profileData.componentId } })
    : null;
  await prisma.coordinatorProfile.upsert({
    where: { userId: user.id },
    update: {
      employeeNumber: profileData.employeeNumber || `coord-${user.id.slice(0, 8)}`,
      componentId: component?.id || null,
    },
    create: {
      userId: user.id,
      employeeNumber: profileData.employeeNumber || `coord-${user.id.slice(0, 8)}`,
      componentId: component?.id || null,
    },
  });
}
```

---

## Step 3: Frontend — Types & Data Layer
**File:** `frontend/src/data/nstpData.ts`

### Changes

```diff
- export type NstpRole = 'admin' | 'student' | 'facilitator';
+ export type NstpRole = 'admin' | 'coordinator' | 'student' | 'facilitator';
```

```diff
-  ownerRole: 'admin' | 'facilitator';
+  ownerRole: 'admin' | 'coordinator' | 'facilitator';
```

**Update `createEmptyAssessment`:**
```diff
-   ownerRole: owner.role === 'facilitator' ? 'facilitator' : 'admin',
+   ownerRole: owner.role as 'admin' | 'coordinator' | 'facilitator',
```

**Update `syncCollectionFromApi` account mapping — add coordinator role to the mapped type:**
```typescript
role: (a.role || 'student').toLowerCase() as NstpRole,
```

This already works because NstpRole now includes 'coordinator'.

---

## Step 4: Frontend — Login Page
**File:** `frontend/src/pages/LoginPage.tsx`

### Changes

```diff
- const [loginRole, setLoginRole] = useState<'student' | 'facilitator' | 'admin'>('student');
+ const [loginRole, setLoginRole] = useState<'student' | 'facilitator' | 'coordinator' | 'admin'>('student');
```

```diff
- {(['student', 'facilitator', 'admin'] as const).map((role) => (
+ {(['student', 'facilitator', 'coordinator', 'admin'] as const).map((role) => (
```

---

## Step 5: Frontend — App.tsx
**File:** `frontend/src/App.tsx`

### Changes

**a) Add `ShellSection` type — add `'coordinator'`:**
```diff
-type ShellSection = 'overview' | 'modules' | 'assessments' | 'progress' | 'grades' | 'admin' | 'facilitator' | 'announcements' | 'reports';
+type ShellSection = 'overview' | 'modules' | 'assessments' | 'progress' | 'grades' | 'admin' | 'facilitator' | 'coordinator' | 'announcements' | 'reports';
```

**b) Import CoordinatorDashboard:**
```diff
 import FacilitatorDashboard from './features/facilitator/pages/FacilitatorDashboard';
+import CoordinatorDashboard from './features/coordinator/pages/CoordinatorDashboard';
```

**c) Add `NAV_ITEMS` for coordinator:**
```typescript
coordinator: [
  { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
  { id: 'coordinator', label: 'Facilitators', icon: Users },
  { id: 'modules', label: 'Modules', icon: BookOpen },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'announcements', label: 'Announcements', icon: Bell },
],
```

**d) Update `completeAuthTransition`:**
```diff
  if (nextUser.role === 'admin') {
    setActiveSection('overview');
  } else if (nextUser.role === 'facilitator') {
    setActiveSection('facilitator');
+ } else if (nextUser.role === 'coordinator') {
+   setActiveSection('overview');
  } else {
    setActiveSection('overview');
  }
```

**e) Update `completeAuthTransition` for the active section default (around line 168-172):**
```diff
  if (parsedUser.role === 'admin') return 'overview';
  if (parsedUser.role === 'facilitator') return 'facilitator';
+ if (parsedUser.role === 'coordinator') return 'overview';
  return 'overview';
```

**f) Update workspace actions for coordinator:**
In the `workspaceActions` ternary:
```diff
+  : user.role === 'coordinator'
+    ? [
+       { label: 'Coordinator Dashboard', detail: 'Component overview and tools', run: () => { setActiveSection('overview'); setHeaderHint('Opened Coordinator Dashboard'); } },
+       { label: 'Module Library', detail: 'Create and manage modules', run: () => { setActiveSection('modules'); setHeaderHint('Opened Module Library'); } },
+       { label: 'Facilitator Accounts', detail: 'Manage facilitators', run: () => { setActiveSection('coordinator'); setHeaderHint('Opened Facilitator Accounts'); } },
+       { label: 'Reports Center', detail: 'Component analytics', run: () => { setActiveSection('reports'); setHeaderHint('Opened Reports Center'); } },
+       { label: 'Notice Center', detail: 'Announcements and alerts', run: () => { setActiveSection('announcements'); setHeaderHint('Opened Notice Center'); } },
+     ]
    : user.role === 'facilitator'
```

**g) Update `renderSection`:**
```tsx
if (user.role === 'coordinator') {
  if (activeSection === 'reports') return <SectionErrorBoundary name="Reports"><ReportsCenter user={user} /></SectionErrorBoundary>;
  if (activeSection === 'announcements') return <SectionErrorBoundary name="Announcements"><AnnouncementsCenter user={user} /></SectionErrorBoundary>;
  if (activeSection === 'modules') return <SectionErrorBoundary name="Modules"><ModulesPage user={user} role="admin" onBack={() => setActiveSection('overview')} /></SectionErrorBoundary>;
  return <SectionErrorBoundary name="Coordinator Dashboard"><CoordinatorDashboard embedded user={user} onLogout={handleLogout} onNavigate={(target) => setActiveSection(target as ShellSection)} /></SectionErrorBoundary>;
}
```

Insert this BEFORE the `if (user.role === 'facilitator')` block.

**h) Update the main render section (around lines 1014-1031) — add coordinator case:**
```tsx
if (user.role === 'coordinator') {
  return (
    <>
      <CoordinatorDashboard user={user} onLogout={handleLogout} onNavigate={(target) => setActiveSection(target as ShellSection)} />
      {showLogoutModal && renderLogoutModal()}
      {isBootSplashVisible && <AuthSplash mode="boot" userName={user?.name} />}
      {authSplash.visible && <AuthSplash mode={authSplash.mode} userName={authSplash.userName} />}
    </>
  );
}
```

**i) Update search commands:**
```typescript
...(user.role === 'coordinator'
  ? [
    { label: 'Module Library', keywords: ['module', 'modules', 'lesson', 'learning'], run: () => { setActiveSection('modules'); setHeaderHint('Opened Module Library'); } },
    { label: 'Facilitator Accounts', keywords: ['facilitator', 'facilitators', 'accounts'], run: () => { setActiveSection('coordinator'); setHeaderHint('Opened Facilitator Accounts'); } },
  ]
  : []),
```

**j) Update `refreshPermissionCheck`:**
```diff
  const roleSummary = user.role === 'admin'
    ? 'Full administrative permissions confirmed.'
+   : user.role === 'coordinator'
+     ? 'Coordinator permissions confirmed for module and facilitator management.'
    : user.role === 'facilitator'
```

**k) Update `visibleNotifications` audience filter — add coordinator:**
The filter already uses `notice.audience === userRole`. Add `'coordinator'` to the notice audience type in notices state (look for `audience: 'all' | 'student' | 'admin' | 'facilitator'` and add coordinator):
```diff
-audience: 'all' | 'student' | 'admin' | 'facilitator';
+audience: 'all' | 'student' | 'admin' | 'facilitator' | 'coordinator';
```

---

## Step 6: New Coordinator Dashboard
**File:** `frontend/src/features/coordinator/pages/CoordinatorDashboard.tsx` (NEW)

This is a large new file. Create it with the following structure:

1. **Types:** `CoordinatorView = 'dashboard' | 'modules' | 'facilitators' | 'reports'`
2. **State:** view, modules, facilitators (accounts filtered), students, search
3. **Derived data:** user's component from `user.component` or their account data
4. **Dashboard view:** Stat cards (modules count, facilitators count, students count), quick actions
5. **Modules view:** Full CRUD table — list modules, create/edit modal (title, description, hours, difficulty, component), delete
6. **Facilitators view:** Full CRUD — list facilitators in their component, create/edit modal (name, email, password, department, municipality assignment), delete
7. **Reports view:** Simple stats

Use the same UI patterns as FacilitatorDashboard (bento panels, sidebar navigation, etc.).

**Key imports:**
```typescript
import { loadAccounts, saveAccounts, loadModules, saveModules, loadStudents, NstpAccount, NstpModule, NstpStudent, NstpComponent, NSTP_COMPONENTS, BiliranMunicipality, BILIRAN_MUNICIPALITIES, createEmptyModule, syncToApi } from '../../../data/nstpData';
```

---

## Step 7: Admin Dashboard — Add Coordinators View
**File:** `frontend/src/features/admin/pages/AdminDashboard.tsx`

### Changes

**a) Add `'coordinators'` to `AdminDashboardView`:**
```diff
-type AdminDashboardView = 'overview' | 'enrollment' | 'students' | 'tools' | 'modules' | 'assessments' | 'facilitators' | 'municipalities' | 'assignments' | 'exports' | 'settings' | 'account';
+type AdminDashboardView = 'overview' | 'enrollment' | 'students' | 'tools' | 'modules' | 'assessments' | 'facilitators' | 'coordinators' | 'municipalities' | 'assignments' | 'exports' | 'settings' | 'account';
```

**b) Add coordinator state:**
```typescript
const [coordinators, setCoordinators] = useState<NstpAccount[]>([]);
// ...coordinators filtered from loadAccounts
const coordinatorsList = useMemo(() => loadAccounts().filter((a) => a.role === 'coordinator'), [accountVersion]);
```

**c) Add the coordinators view rendering (similar to facilitators view but admin-only for creating coordinators):**
```tsx
) : view === 'coordinators' ? (
  <CoordinatorManagementView admin={currentAdmin} />
) : view === 'facilitators' ? (
```

**d) Create a `CoordinatorManagementView` component within AdminDashboard (or inline):**
- Table: name, email, assigned component, actions
- Create modal: name, email, password, component selector (CWTS/LTS/MTS)
- Save to accounts list with `role: 'coordinator'` and `component` field

**e) Remove FacilitatorManagement import** (or keep it for historical view but restrict creation):
Since the answer was "Only Coordinators manage facilitators", remove the FacilitatorManagement import and the view handler for `'facilitators'` or change it to a read-only list.

**f) Update overview stat cards — add coordinators count:**
```tsx
{ label: 'Coordinators', value: coordinatorsList.length, detail: 'Component coordinators', icon: UserCog, tone: '...' },
```

**g) Update `openQuickAction`:**
```diff
- const openQuickAction = (action: 'facilitator' | 'municipality' | 'enrollment' | 'reports') => {
+ const openQuickAction = (action: 'facilitator' | 'coordinator' | 'municipality' | 'enrollment' | 'reports') => {
```

**h) Update sidebar nav items to include coordinators:**
```diff
{ label: 'Facilitators', icon: Users, onClick: () => setView('facilitators'), active: view === 'facilitators' },
+{ label: 'Coordinators', icon: UserCog, onClick: () => setView('coordinators'), active: view === 'coordinators' },
```

---

## Step 8: Facilitator Dashboard — Remove Module Capabilities
**File:** `frontend/src/features/facilitator/pages/FacilitatorDashboard.tsx`

### Changes

**a) Remove imports related to modules:**
- Remove `loadModules`, `saveModules` from imports (if present — likely only assessments)
- Remove lecture-related state (`FacilitatorLecture` type, `lectures` state, `lectureTitle`, `fileInputRef`)

**b) Remove lecture upload section** from the UI.

**c) Add read-only module list view (optional, since user said "read-only view"):**
- Add a simple section in the dashboard that shows modules from `loadModules()` 
- Render as read-only table/cards (no edit/delete buttons)

**d) Simplify navigation — remove lecture uploads from views:**
```diff
-type FacilitatorView = 'dashboard' | 'enrollment-requests' | 'attendance-sheet' | 'grade-book' | 'lecture-uploads' | 'assessment-builder' | 'reports';
+type FacilitatorView = 'dashboard' | 'enrollment-requests' | 'attendance-sheet' | 'grade-book' | 'reports';
```

**e) Remove module store loading from useEffect.**

---

## Step 9: ModulesPage — Accept Coordinator Role
**File:** `frontend/src/pages/ModulesPage.tsx`

### Changes

```diff
-export default function ModulesPage({ user, role = 'student', onBack }: { user: any; role?: 'student' | 'admin'; onBack?: () => void }) {
+export default function ModulesPage({ user, role = 'student', onBack }: { user: any; role?: 'student' | 'admin' | 'coordinator'; onBack?: () => void }) {
```

Then `isAdmin` logic — rename or add `isCoordinator`:
```diff
-const isAdmin = role === 'admin';
+const isAdmin = role === 'admin' || role === 'coordinator';
```

This gives coordinators the same CRUD capabilities as admin on the ModulesPage.

---

## Summary of All Files Changed

| # | File | Action |
|---|------|--------|
| 1 | `backend/prisma/schema.prisma` | Edit — add COORDINATOR enum + CoordinatorProfile model |
| 2 | `backend/src/modules/nstp/nstp.service.js` | Edit — 3 function updates |
| 3 | `frontend/src/data/nstpData.ts` | Edit — type updates |
| 4 | `frontend/src/pages/LoginPage.tsx` | Edit — add coordinator to login selector |
| 5 | `frontend/src/App.tsx` | Edit — routing, nav, sidebar |
| 6 | `frontend/src/features/coordinator/pages/CoordinatorDashboard.tsx` | **New file** |
| 7 | `frontend/src/features/admin/pages/AdminDashboard.tsx` | Edit — add coordinators view |
| 8 | `frontend/src/features/facilitator/pages/FacilitatorDashboard.tsx` | Edit — remove module capabilities |
| 9 | `frontend/src/pages/ModulesPage.tsx` | Edit — accept coordinator role |

---

## Rollback Strategy
If something goes wrong:
1. Revert the Prisma schema and run `prisma migrate dev` again to rollback
2. Revert the code changes using `git checkout -- <file>` for each modified file
3. Delete the new CoordinatorDashboard.tsx
