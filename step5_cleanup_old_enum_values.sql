-- Step 5: Remove old enum values (run after data is updated)
-- WARNING: This will fail if any old values are still in use

-- First verify no old values remain
SELECT DISTINCT unnest("ageGroups") as age_group FROM posts 
WHERE 'PRESCHOOL_3_6' = ANY("ageGroups") 
   OR 'PRIMARY_7_10' = ANY("ageGroups")
   OR 'MIDDLE_11_13' = ANY("ageGroups")
   OR 'SECONDARY_14_16' = ANY("ageGroups") 
   OR 'HIGH_SCHOOL_17_19' = ANY("ageGroups")
   OR 'ADULTS_20_PLUS' = ANY("ageGroups");

-- If the above query returns no rows, then you can safely remove old values
-- Note: PostgreSQL doesn't support DROP VALUE for enums, so we'll keep them for now
-- They will be ignored in the application code

-- Check all current enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'AgeGroup'
) ORDER BY enumlabel;