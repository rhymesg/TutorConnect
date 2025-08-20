-- Migration to add privacy settings for profile fields
-- Apply this manually when database is accessible

-- First, update existing ON_REQUEST values to PRIVATE before removing the enum value
UPDATE users SET "privacyDocuments" = 'PRIVATE' WHERE "privacyDocuments" = 'ON_REQUEST';
UPDATE users SET "privacyGender" = 'PRIVATE' WHERE "privacyGender" = 'ON_REQUEST';
UPDATE users SET "privacyAge" = 'PRIVATE' WHERE "privacyAge" = 'ON_REQUEST';

-- Drop the privacyContact column (data loss acceptable as indicated)
ALTER TABLE users DROP COLUMN IF EXISTS "privacyContact";

-- Add new privacy columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "privacyRegion" "PrivacySetting" DEFAULT 'PUBLIC';

-- Remove ON_REQUEST from PrivacySetting enum
-- Note: This step may require recreating the enum type depending on PostgreSQL version
-- ALTER TYPE "PrivacySetting" DROP VALUE 'ON_REQUEST'; -- This might not work in older PostgreSQL versions

-- Alternative approach for enum modification (safer):
-- 1. Create new enum
CREATE TYPE "PrivacySetting_new" AS ENUM ('PUBLIC', 'PRIVATE');

-- 2. Update columns to use new enum
ALTER TABLE users ALTER COLUMN "privacyGender" TYPE "PrivacySetting_new" USING "privacyGender"::text::"PrivacySetting_new";
ALTER TABLE users ALTER COLUMN "privacyAge" TYPE "PrivacySetting_new" USING "privacyAge"::text::"PrivacySetting_new";
ALTER TABLE users ALTER COLUMN "privacyRegion" TYPE "PrivacySetting_new" USING "privacyRegion"::text::"PrivacySetting_new";
ALTER TABLE users ALTER COLUMN "privacyDocuments" TYPE "PrivacySetting_new" USING "privacyDocuments"::text::"PrivacySetting_new";

-- 3. Drop old enum and rename new one
DROP TYPE "PrivacySetting";
ALTER TYPE "PrivacySetting_new" RENAME TO "PrivacySetting";