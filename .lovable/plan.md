

# Remove Banking Details from Trainer Statement Emails

## The Issue

Trainer statement emails are showing banking details at the bottom (Account Holder, Bank, Account Number) which are meant for *clients paying McKaynine*. Since McKaynine is *paying the trainer*, these banking details are irrelevant and confusing.

---

## The Fix

A single-line change in `src/lib/email/generateTrainerStatementEmail.ts`:

**Line 137** - Change `includeBankingDetails: true` to `includeBankingDetails: false`

```typescript
// Before
return wrapEmailContent(content, {
  branchName,
  includeBankingDetails: true,  // Wrong for trainer payments
});

// After  
return wrapEmailContent(content, {
  branchName,
  includeBankingDetails: false,  // Correct - McKaynine pays the trainer
});
```

---

## Result

The trainer statement email will:
- Still include the McKaynine logo header
- Still include the statement summary and class list
- Still include the professional signature
- **No longer show the "Banking Details" section at the bottom**

---

## File to Modify

| File | Change |
|------|--------|
| `src/lib/email/generateTrainerStatementEmail.ts` | Set `includeBankingDetails: false` on line 137 |

