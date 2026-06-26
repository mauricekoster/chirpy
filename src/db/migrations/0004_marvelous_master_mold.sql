ALTER TABLE "users" ALTER COLUMN "hashed_password" SET DEFAULT 'unset';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "hashed_password" SET NOT NULL;