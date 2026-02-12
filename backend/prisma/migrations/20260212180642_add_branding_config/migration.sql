-- CreateTable
CREATE TABLE "branding_configs" (
    "id" TEXT NOT NULL,
    "logo_url" TEXT,
    "logo_small_url" TEXT,
    "app_name" TEXT NOT NULL DEFAULT 'SCOT',
    "primary_color" TEXT NOT NULL DEFAULT '#9333ea',
    "secondary_color" TEXT NOT NULL DEFAULT '#2563eb',
    "login_bg_type" TEXT NOT NULL DEFAULT 'gradient',
    "login_bg_value" TEXT NOT NULL DEFAULT 'from-slate-900 via-purple-900 to-slate-900',
    "login_bg_image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_configs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "branding_configs" ADD CONSTRAINT "branding_configs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
