-- Check current AgeGroup enum values in database
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AgeGroup')
ORDER BY enumlabel;

-- Check what AgeGroup values are currently used in posts
SELECT DISTINCT unnest("ageGroups") as used_age_group 
FROM posts 
WHERE "ageGroups" IS NOT NULL;

-- Check specific posts with their ageGroups
SELECT id, "ageGroups", "createdAt"
FROM posts 
WHERE "ageGroups" IS NOT NULL 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Count posts by age group usage
SELECT 
  unnest("ageGroups") as age_group,
  COUNT(*) as usage_count
FROM posts 
WHERE "ageGroups" IS NOT NULL
GROUP BY unnest("ageGroups")
ORDER BY usage_count DESC;