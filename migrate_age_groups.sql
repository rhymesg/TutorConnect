-- Migration script to update AgeGroup enum values
-- Run this before pushing the new schema

-- First, update all existing ageGroups arrays in posts table
UPDATE posts 
SET "ageGroups" = ARRAY(
  SELECT CASE 
    WHEN unnest = 'PRESCHOOL_3_6' THEN 'PRESCHOOL'::text
    WHEN unnest = 'PRIMARY_7_10' THEN 'PRIMARY_LOWER'::text
    WHEN unnest = 'MIDDLE_11_13' THEN 'MIDDLE'::text
    WHEN unnest = 'SECONDARY_14_16' THEN 'SECONDARY'::text
    WHEN unnest = 'HIGH_SCHOOL_17_19' THEN 'SECONDARY'::text
    WHEN unnest = 'ADULTS_20_PLUS' THEN 'ADULTS'::text
    ELSE unnest::text
  END
  FROM unnest("ageGroups")
)::AgeGroup[]
WHERE "ageGroups" && ARRAY['PRESCHOOL_3_6', 'PRIMARY_7_10', 'MIDDLE_11_13', 'SECONDARY_14_16', 'HIGH_SCHOOL_17_19', 'ADULTS_20_PLUS']::AgeGroup[];

-- Check the current data before migration
SELECT 
  id, 
  "ageGroups",
  array_length("ageGroups", 1) as age_group_count
FROM posts 
WHERE "ageGroups" IS NOT NULL 
ORDER BY "createdAt" DESC 
LIMIT 10;