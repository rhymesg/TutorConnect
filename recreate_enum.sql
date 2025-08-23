-- Step 1: Clear all ageGroups data first
UPDATE posts SET "ageGroups" = '{}';

-- Step 2: Create new enum type with desired values
CREATE TYPE "AgeGroup_new" AS ENUM ('PRESCHOOL', 'PRIMARY_LOWER', 'PRIMARY_UPPER', 'MIDDLE', 'SECONDARY', 'ADULTS');

-- Step 3: Change column type to use new enum
ALTER TABLE posts ALTER COLUMN "ageGroups" TYPE "AgeGroup_new"[] USING "ageGroups"::text[]::"AgeGroup_new"[];

-- Step 4: Drop old enum and rename new one
DROP TYPE "AgeGroup";
ALTER TYPE "AgeGroup_new" RENAME TO "AgeGroup";

-- Step 5: Verify the change
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'AgeGroup'
) ORDER BY enumlabel;