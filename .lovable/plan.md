

# Show Substitute Trainer Details in Statement

## Problem

The trainer statement (HTML preview and PDF) doesn't show substitution information. The data is already calculated and available in `TrainerClassDetail` (with fields like `isSubstitute`, `substituteDates`, `originalTrainerName`, etc.), and it's displayed correctly in the financial report table. However, the statement dialog's `prepareClassData()` method strips this metadata away when mapping to its own `ClassDetail` interface, which lacks substitution fields.

## What Changes

### Statement HTML Preview
Each class card will show a line below the class name indicating:
- **If trainer is a substitute**: "Substitute for [Original Trainer] (X of Y dates)"
- **If trainer had a substitute**: "Subbed by [Name] (X of Y dates)"

### Statement PDF
Same substitution info rendered below the class name in each class header bar.

## Technical Details

### 1. Update `ClassDetail` interfaces in 3 files

Add substitution fields to the `ClassDetail` interface in:
- `TrainerStatementDialog.tsx` (lines 30-37)
- `TrainerStatementHTMLPreview.tsx` (lines 15-22)
- `pdf/TrainerStatementPDF.tsx` (lines 16-26)

New fields:
```
isSubstitute?: boolean;
substituteDates?: number;
totalDates?: number;
originalTrainerName?: string;
substituteTrainerName?: string;
```

### 2. Pass substitution data through in `prepareClassData()` (TrainerStatementDialog.tsx)

In the `prepareClassData()` method (around line 153), pass through the substitution fields from the source `classDetail` data to the mapped `ClassDetail`:
```
isSubstitute: cls.isSubstitute,
substituteDates: cls.substituteDates,
totalDates: cls.totalDates,
originalTrainerName: cls.originalTrainerName,
substituteTrainerName: cls.substituteTrainerName,
```

### 3. Display substitution info in HTML Preview (TrainerStatementHTMLPreview.tsx)

Below the class date line (around line 184), add a conditional line showing substitution context -- same pattern as `ClassDetailRow.tsx`.

### 4. Display substitution info in PDF (TrainerStatementPDF.tsx)

In the class header section (around line 174), add a second line below the class name showing substitution details when applicable. This will add a small text line in the class header bar or just below it.

