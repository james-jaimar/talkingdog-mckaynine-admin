## Verified diagnosis

The July 2026 Delta financial report is showing a real calculation error, not a display issue.

For **15h00 Puppy Class July August**, the database shows:

- Course revenue in the report: **R14,527.50**
- Franchise fee: **15% = R2,179.13**
- Admin fee: **10% = R1,452.75**
- Trainer fee setting: **75%**

That means the class is configured to pay out exactly 100% of course revenue:

```text
15% franchise + 10% admin + 75% trainer = 100%
```

So profit should be **R0.00** apart from a possible 1c rounding adjustment.

The actual bad number comes from one invoice:

- **INV-McD-2607-0009**
- Handler: Shannon de Vries
- Puppy line: **R1,117.50**
- Other class line: **R1,680.00**
- Discount reason: multi-dog discount across different classes
- Puppy trainer rate: **75%**
- Other trainer rate: **40%**

The current shared calculator averages the trainer base across trainers for multi-dog invoices. That changes the Puppy trainer base from **R1,117.50** to **R1,398.75**, then applies the Puppy class’s **75%** rate:

```text
Correct Puppy commission on actual Puppy line:
R1,117.50 × 75% = R838.13

Current redistributed Puppy commission:
R1,398.75 × 75% = R1,049.06

Overstatement:
R210.93
```

That overstatement matches the negative profit almost exactly:

```text
Expected normal profit: about -R0.01 rounding
Current report profit: -R210.94
Difference: R210.93
```

So the root issue is confirmed: **the multi-dog fairness rule is being applied to invoices where classes have different trainer percentages. That inflates the high-percentage class and creates impossible negative profit.**

I also found a data hygiene issue on the same invoice: an enrollment fee row is marked as `course_fee`, and there is an extra unbooked enrollment row. The report’s current code excludes it by description, so it is not the main cause of the negative profit, but it should still be cleaned up/audited.

## Plan

### 1. Tighten the canonical multi-dog fairness rule

Update the shared calculator so redistribution only happens when it is mathematically valid:

```text
Apply fairness redistribution only when:
- invoice has a multi-dog discount
- all course lines belong to one handler
- more than one trainer is involved
- all affected course lines use the same trainer fee type
- all affected course lines use the same trainer fee value
```

If trainer percentages differ, do **not** redistribute. Each class gets commission from its own invoice line amount.

For this case, Puppy remains:

```text
R1,117.50 × 75% = R838.13
```

and the other class remains:

```text
R1,680.00 × 40% = R672.00
```

### 2. Mirror the same rule in the database function

Update `calculate_trainer_payment_for_schedule` so DB-generated/recalculated trainer payments use the same rule as the frontend calculator.

This is essential because the UI and the stored `trainer_payments` ledger must not drift again.

### 3. Add a financial invariant guard

Add a line-level warning/guard in the shared calculator for impossible financial lines:

```text
If franchise fee + admin fee + trainer fee > line net revenue:
- flag the line as invalid/overallocated
- do not silently produce a negative profit without an audit signal
```

For now I would not hide the problem by clamping everything to zero. The system should expose impossible maths, not mask it. But for classes configured to total exactly 100%, we should eliminate recurring 1c display noise by normalizing near-zero totals to R0.00.

### 4. Add regression checks for the known problem cases

Create targeted tests/checks for:

- **INV-McD-2607-0009**
  - Puppy: **R838.13**, not **R1,049.06**
  - Puppy profit returns to **R0.00 / near-zero**
- **INV-McD-2607-0014**
  - WT/Yoga stays full-price per actual line
  - no unwanted averaging
- Previous multi-dog fairness case where same-rate trainers should still split fairly

### 5. Repair the dirty invoice item metadata

Clean/audit the bad `INV-McD-2607-0009` enrollment rows:

- enrollment fee attached to Puppy booking but marked `course_fee`
- duplicate unbooked enrollment fee row also marked `course_fee`

This is not the main negative-profit cause, but it is exactly the sort of data inconsistency that makes financial reports fragile.

### 6. Verify in the live report

After implementation, verify the July 2026 Delta report shows:

```text
15h00 Puppy Class July August
Revenue: R14,527.50
Franchise: R2,179.13
Admin: R1,452.75
Instructor: about R10,895.63
Profit: R0.00 / no negative R210.94
```

Also verify the Trainers tab agrees with the same canonical line totals.