
# Database Egress Optimization Plan

## Problem Summary

Your Supabase project is experiencing excessive database egress (500MB-1.8GB/day) due to aggressive polling and inefficient queries. The data rarely changes, so continuous polling is unnecessary.

---

## Root Causes Identified

| Issue | Location | Impact |
|-------|----------|--------|
| **5-second polling** | `useEmailQueue.ts` (line 68) | 17,280 queries/day per active user |
| **5-second polling** | `useProcessingJobs.ts` (line 28) | 17,280 queries/day per active user |
| **10-second manual polling** | `ClassHandlersTable.tsx` (lines 78-85) | 8,640 queries/day per open class tab |
| **30-second polling** | `useClassHandlers.ts` (line 172) | Already set, but doubled by manual interval above |
| **Fetch ALL invoices** | `useFranchiseMonthlyData.ts` (line 133) | No branch filter on initial query - fetches entire invoices table |
| **refetchOnWindowFocus: true** | 7 hooks override global setting | Full refetch every time user switches tabs |
| **select('*')** | 24+ locations | Fetching all columns when only a few are needed |

---

## Optimization Strategy

### Phase 1: Remove Aggressive Polling (Biggest Impact)

**1.1 - Remove polling from `useEmailQueue.ts`**
- Remove `refetchInterval: 5000` from outbox query
- Data only changes when user adds/processes emails - mutations already invalidate the query

**1.2 - Remove polling from `useProcessingJobs.ts`**
- Remove `refetchInterval: 5000`
- Scan jobs only change when user uploads - mutations handle invalidation

**1.3 - Remove manual setInterval from `ClassHandlersTable.tsx`**
- Delete the `useEffect` with `setInterval(() => refetch(), 10000)`
- This duplicates the hook's own refresh mechanism

**1.4 - Disable polling in `useClassHandlers.ts`**
- Remove `refetchInterval: 30000`
- Handler data only changes when handlers are added/removed - rely on mutation invalidation

---

### Phase 2: Remove refetchOnWindowFocus Overrides

**Files to update** (change `refetchOnWindowFocus: true` to `false`):
- `src/components/class-handlers/hooks/useClassHandlers.ts`
- `src/hooks/invoices/queries/useClientInvoices.ts`
- `src/hooks/financial/useFinancialQuery.ts`
- `src/hooks/useFranchiseMonthlyData.ts`
- `src/hooks/useFranchiseClassesData.ts`
- `src/hooks/useClassesListData.ts`
- `src/components/class-handlers/booking-row/useInvoiceStatus.ts`

The global default in `query-client.ts` is already `refetchOnWindowFocus: false` - these overrides defeat that.

---

### Phase 3: Optimize Heavy Queries

**3.1 - Fix `useFranchiseMonthlyData.ts` (line 133-170)**
Currently fetches ALL invoices without branch filter, then filters client-side:
```typescript
// CURRENT - fetches everything
const { data: invoicesData } = await supabase
  .from('invoices')
  .select(`...`) // No .eq('branch_id', ...) here!
```

Change to filter at database level:
```typescript
// OPTIMIZED - filter on database
const { data: invoicesData } = await supabase
  .from('invoices')
  .select(`...`)
  .eq('branch_id', currentBranch.id) // Add this!
```

**3.2 - Add limits to unbounded queries**
- `useProcessingJobs.ts`: Add `.limit(50)` - old jobs aren't needed
- `useClientsData.ts`: Add `.limit(100)` or implement pagination

**3.3 - Reduce select('*') usage**
For the most impactful files, select only needed columns:
- `useProcessingJobs.ts`: Select only `id, filename, status, created_at, extracted_data`
- `useClientsData.ts`: Select only `id, first_name, last_name, email, phone`

---

### Phase 4: Increase staleTime for Report Data

Financial and franchise reports are historical data that rarely changes. Increase `staleTime`:

| Hook | Current | Proposed |
|------|---------|----------|
| `useFranchiseMonthlyData.ts` | 30s | 5 minutes |
| `useFranchiseClassesData.ts` | 30s | 5 minutes |
| `useFinancialQuery.ts` | 30s | 5 minutes |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useEmailQueue.ts` | Remove `refetchInterval: 5000` |
| `src/components/intake-scans/hooks/useProcessingJobs.ts` | Remove `refetchInterval`, add `.limit(50)`, optimize select |
| `src/components/class-handlers/ClassHandlersTable.tsx` | Remove manual `setInterval` useEffect (lines 77-85) |
| `src/components/class-handlers/hooks/useClassHandlers.ts` | Remove `refetchInterval`, set `refetchOnWindowFocus: false` |
| `src/hooks/invoices/queries/useClientInvoices.ts` | Set `refetchOnWindowFocus: false` |
| `src/hooks/financial/useFinancialQuery.ts` | Set `refetchOnWindowFocus: false`, increase `staleTime` to 5min |
| `src/hooks/useFranchiseMonthlyData.ts` | Add branch filter to invoices query, set `refetchOnWindowFocus: false`, increase `staleTime` to 5min |
| `src/hooks/useFranchiseClassesData.ts` | Set `refetchOnWindowFocus: false`, increase `staleTime` to 5min |
| `src/hooks/useClassesListData.ts` | Set `refetchOnWindowFocus: false` |
| `src/components/class-handlers/booking-row/useInvoiceStatus.ts` | Set `refetchOnWindowFocus: false` |
| `src/hooks/useClientsData.ts` | Add `.limit(100)` |

---

## Expected Impact

| Optimization | Estimated Reduction |
|--------------|---------------------|
| Remove 5s email queue polling | ~40% of egress |
| Remove 5s scan jobs polling | ~20% of egress |
| Remove class handlers double-polling | ~15% of egress |
| Add branch filter to franchise data | ~10% of egress |
| Remove window focus refetching | ~10% of egress |

**Total estimated reduction: 80-90% of current egress**

---

## How Data Will Stay Fresh

After these changes, data refreshes:
1. **On page load** - Initial fetch when navigating to a page
2. **After mutations** - React Query invalidates queries when data changes (add handler, send email, etc.)
3. **On manual refresh** - Users can still click refresh buttons where available
4. **On reconnect** - Data refreshes when internet connection is restored

This is the correct pattern - fetch once, update on changes.
