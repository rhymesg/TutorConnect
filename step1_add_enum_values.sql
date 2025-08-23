-- Step 1: Add new enum values (run this first)
-- Each ALTER TYPE must be in its own transaction

ALTER TYPE "AgeGroup" ADD VALUE IF NOT EXISTS 'PRESCHOOL';