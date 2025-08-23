-- Step 4: Update existing data (run after all enum values are added)

-- Check current data first
SELECT id, "ageGroups", "createdAt" FROM posts WHERE "ageGroups" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 5;

-- Update data to use new enum values
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'PRESCHOOL_3_6', 'PRESCHOOL');
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'PRIMARY_7_10', 'PRIMARY_LOWER');  
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'MIDDLE_11_13', 'MIDDLE');
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'SECONDARY_14_16', 'SECONDARY');
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'HIGH_SCHOOL_17_19', 'SECONDARY');
UPDATE posts SET "ageGroups" = array_replace("ageGroups", 'ADULTS_20_PLUS', 'ADULTS');

-- Verify the update
SELECT DISTINCT unnest("ageGroups") as age_group FROM posts;