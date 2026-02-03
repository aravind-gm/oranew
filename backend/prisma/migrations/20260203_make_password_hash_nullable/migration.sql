-- Make password_hash nullable for OTP users
-- OTP-authenticated users do not have passwords

ALTER TABLE "users"
ALTER COLUMN "password_hash" DROP NOT NULL;
