# Fix: Coordinator Not Created in Database

## Root Cause

When the admin creates a coordinator, `handleSave` in `AdminDashboard.tsx` calls `apiPost('/nstp/accounts', next, null)`. If the API returns an error response (e.g., `{ success: false, error: '...' }`), the `parseErrorResponse` function returns the parsed error object **which is truthy**. The code then enters the success branch (`if (result)`) and saves the coordinator to **localStorage only** — the modal closes, the coordinator appears in the list, but the DB record was never created.

Additionally, `handleDelete` only removes from localStorage (never calls the API), and `syncCollectionFromApi` drops coordinator-specific fields when syncing API data back to localStorage.

---

## Fix 1: `handleSave` — Proper error/success detection

**File:** `frontend/src/features/admin/pages/AdminDashboard.tsx` (lines 4248-4272)

**Problem:** `apiPost` returns the parsed error response body on non-OK responses. This body (e.g., `{ error: '...' }`) is truthy, so `if (result)` succeeds. The modal then closes and saves only to localStorage.

**Solution:** Two changes:
1. Check `result.error` to distinguish success vs error responses
2. Only close the modal on success — keep it open on failure so the admin sees the error

**Before:**
```tsx
const handleSave = async () => {
    if (!editingCoord) return;
    setSaveError(null);
    const next = { ...editingCoord, role: 'coordinator' as const };
    try {
      const result = await apiPost<any>('/nstp/accounts', next, null);
      if (result) {
        const allAccounts = loadAccounts();
        const others = allAccounts.filter((a) => a.role !== 'coordinator');
        const existing = allAccounts.filter((a) => a.role === 'coordinator');
        const updated = existing.some((c) => c.id === next.id)
          ? existing.map((c) => c.id === next.id ? next : c)
          : [next, ...existing];
        saveAccounts([...others, ...updated]);
      } else {
        setSaveError('Server did not confirm the account was created.');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to create account on server.';
      setSaveError(msg);
    }
    setEditorOpen(false);
    setEditingCoord(null);
    onRefresh();
  };
```

**After:**
```tsx
  const handleSave = async () => {
    if (!editingCoord) return;
    setSaveError(null);
    const next = { ...editingCoord, role: 'coordinator' as const };
    try {
      const result = await apiPost<any>('/nstp/accounts', next, null);
      if (result && !(result as any).error) {
        const allAccounts = loadAccounts();
        const others = allAccounts.filter((a) => a.role !== 'coordinator');
        const existing = allAccounts.filter((a) => a.role === 'coordinator');
        const updated = existing.some((c) => c.id === next.id)
          ? existing.map((c) => c.id === next.id ? next : c)
          : [next, ...existing];
        saveAccounts([...others, ...updated]);
        setEditorOpen(false);
        setEditingCoord(null);
        onRefresh();
      } else {
        const errMsg = (result as any)?.error || 'Server did not confirm the account was created.';
        setSaveError(errMsg);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to create account on server.';
      setSaveError(msg);
    }
  };
```

**Changes:**
- Line: `if (result)` → `if (result && !(result as any).error)` — rejects error-shaped responses
- Moved `setEditorOpen(false)`, `setEditingCoord(null)`, `onRefresh()` inside the success block
- Added `toast.success('Coordinator created successfully')` before closing the modal
- Else branch shows the server error message instead of generic message

**Add import** at the top of the file (if not already present):
```tsx
import { toast } from 'sonner';
```

The success block should now be:
```tsx
      if (result && !(result as any).error) {
        const allAccounts = loadAccounts();
        const others = allAccounts.filter((a) => a.role !== 'coordinator');
        const existing = allAccounts.filter((a) => a.role === 'coordinator');
        const updated = existing.some((c) => c.id === next.id)
          ? existing.map((c) => c.id === next.id ? next : c)
          : [next, ...existing];
        saveAccounts([...others, ...updated]);
        toast.success('Coordinator created successfully');
        setEditorOpen(false);
        setEditingCoord(null);
        onRefresh();
      }
```

---

## Fix 2: `handleDelete` — Delete from API too

**File:** `frontend/src/features/admin/pages/AdminDashboard.tsx` (lines 4274-4280)

**Problem:** Deleting a coordinator only removes from localStorage. The DB record (User + CoordinatorProfile) remains orphaned.

**Solution:** Call `DELETE /api/nstp/accounts/:id` before removing from localStorage. Ignore API errors (offline-first).

**Before:**
```tsx
  const handleDelete = async (id: string) => {
    const allAccounts = loadAccounts();
    const others = allAccounts.filter((a) => a.role !== 'coordinator');
    const remaining = allAccounts.filter((a) => a.role === 'coordinator' && a.id !== id);
    await saveAccounts([...others, ...remaining]);
    onRefresh();
  };
```

**After:**
```tsx
  const handleDelete = async (id: string) => {
    await apiDel(`/nstp/accounts/${id}`, null);
    const allAccounts = loadAccounts();
    const others = allAccounts.filter((a) => a.role !== 'coordinator');
    const remaining = allAccounts.filter((a) => a.role === 'coordinator' && a.id !== id);
    await saveAccounts([...others, ...remaining]);
    onRefresh();
  };
```

Make sure `apiDel` is imported at the top of the file (check if it's already imported):
```tsx
import { apiGet, apiPost, apiDel } from '../../../services/apiClient';
```

---

## Fix 3: `syncCollectionFromApi` — Map coordinator fields

**File:** `frontend/src/data/nstpData.ts` (lines 287-308)

**Problem:** When syncing accounts from the API back to localStorage, several coordinator-specific fields are not mapped:
- `component` (NSTP component display name) — stored in `user.data.component`
- `municipalities` (array of assigned municipalities) — stored in `user.data.municipalities`
- `title` — stored in `user.data.title`
- `contactNumber` — stored in `user.data.contactNumber`

This causes data loss when the API sync runs (e.g., on page refresh). Any subsequent `saveAccounts` call would overwrite the DB record with empty values.

**Solution:** Add these fields to the mapping.

**Find this code:**
```tsx
const mapped: NstpAccount[] = apiAccounts.map((a: any) => {
  const d = (a.data || {}) as Record<string, unknown>;
  const ip = (a.instructorProfile || {}) as Record<string, unknown>;
  const cp = (a.coordinatorProfile || {}) as Record<string, unknown>;
  return {
    id: a.id, name: a.name || '', email: a.email || '', password: '',
    role: (a.role || 'student').toLowerCase() as NstpRole,
    employeeNumber: (ip.employeeNumber as string) || (cp.employeeNumber as string) || (d.employeeNumber as string) || '',
    componentId: (cp.componentId as string) || (d.componentId as string) || '',
    studentId: (d.studentId as string) || '',
    surname: d.surname as string, firstName: d.firstName as string,
    middleName: d.middleName as string, school: d.school as string,
    department: d.department as string, degreeProgram: d.degreeProgram as string,
    yearLevel: d.yearLevel as string, major: d.major as string,
    gender: d.gender as string, birthdate: d.birthdate as string,
    houseStreetPurok: d.houseStreetPurok as string, barangay: d.barangay as string,
    province: (d.province as string) || 'Biliran',
    currentAddress: d.currentAddress as string, cityAddress: d.cityAddress as string,
    provincialAddress: d.provincialAddress as string,
    contactNumber: d.contactNumber as string,
    municipality: (d.municipality as BiliranMunicipality) || 'Naval',
  };
});
```

**Change to:**
```tsx
const mapped: NstpAccount[] = apiAccounts.map((a: any) => {
  const d = (a.data || {}) as Record<string, unknown>;
  const ip = (a.instructorProfile || {}) as Record<string, unknown>;
  const cp = (a.coordinatorProfile || {}) as Record<string, unknown>;
  return {
    id: a.id, name: a.name || '', email: a.email || '', password: '',
    role: (a.role || 'student').toLowerCase() as NstpRole,
    employeeNumber: (ip.employeeNumber as string) || (cp.employeeNumber as string) || (d.employeeNumber as string) || '',
    componentId: (cp.componentId as string) || (d.componentId as string) || '',
    component: (d.component as NstpComponent) || 'CWTS',
    municipalities: (d.municipalities as string[]) || [],
    title: (d.title as string) || '',
    contactNumber: (d.contactNumber as string) || '',
    studentId: (d.studentId as string) || '',
    surname: d.surname as string, firstName: d.firstName as string,
    middleName: d.middleName as string, school: d.school as string,
    department: d.department as string, degreeProgram: d.degreeProgram as string,
    yearLevel: d.yearLevel as string, major: d.major as string,
    gender: d.gender as string, birthdate: d.birthdate as string,
    houseStreetPurok: d.houseStreetPurok as string, barangay: d.barangay as string,
    province: (d.province as string) || 'Biliran',
    currentAddress: d.currentAddress as string, cityAddress: d.cityAddress as string,
    provincialAddress: d.provincialAddress as string,
    municipality: (d.municipality as BiliranMunicipality) || 'Naval',
  };
});
```

**Changes:**
- Added `component: (d.component as NstpComponent) || 'CWTS'`
- Added `municipalities: (d.municipalities as string[]) || []`
- Added `title: (d.title as string) || ''`
- Moved `contactNumber` extraction to use `d.contactNumber` (was already there — keep as is but ensure it reads from `data` field)

---

## Verification

After applying all fixes, run the app and test:

1. **Admin login** → navigate to Coordinator Management
2. **Create a new coordinator** with valid data
3. **Verify** the modal stays open on API error, shows the error message
4. **Verify** on success, the modal closes and coordinator appears in the list
5. **Refresh the page** — coordinator should still appear (confirming API → localStorage sync works)
6. **Check the database** — `SELECT * FROM "user" WHERE email = 'coordinator@test.com'` should return a row with `role = 'COORDINATOR'`
7. **Delete the coordinator** — verify it disappears from the list AND from the database
