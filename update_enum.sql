-- Step 1: Check current enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'AgeGroup'
);

-- Step 2: Add new enum values first
ALTER TYPE "AgeGroup" ADD VALUE IF NOT EXISTS 'PRESCHOOL';
ALTER TYPE "AgeGroup" ADD VALUE IF NOT EXISTS 'PRIMARY_LOWER';  
ALTER TYPE "AgeGroup" ADD VALUE IF NOT EXISTS 'PRIMARY_UPPER';
ALTER TYPE "AgeGroup" ADD VALUE IF NOT EXISTS 'MIDDLE';
ALTER TYPE "AgeGroup" ADD VALUE IF NOT EXISTS 'SECONDARY';
ALTER TYPE "AgeGroup" ADD VALUE IF NOT EXISTS 'ADULTS';

-- Step 3: Update existing data to use new values
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'PRESCHOOL_3_6', 'PRESCHOOL');
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'PRIMARY_7_10', 'PRIMARY_LOWER');  
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'MIDDLE_11_13', 'MIDDLE');
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'SECONDARY_14_16', 'SECONDARY');
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'HIGH_SCHOOL_17_19', 'SECONDARY');
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'ADULTS_20_PLUS', 'ADULTS');

-- Step 4: Check if any old values remain
SELECT DISTINCT unnest("ageGroups") as age_group FROM posts;