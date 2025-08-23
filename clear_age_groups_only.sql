-- Clear only ageGroups data from posts, keep everything else
UPDATE posts SET "ageGroups" = '{}' WHERE "ageGroups" IS NOT NULL;

-- Verify ageGroups are cleared
SELECT COUNT(*) as posts_with_age_groups 
FROM posts 
WHERE "ageGroups" IS NOT NULL AND array_length("ageGroups", 1) > 0;