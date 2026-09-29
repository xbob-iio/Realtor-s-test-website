-- CreateEnum
CREATE TYPE "City" AS ENUM ('KYIV', 'DNIPRO');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('UAH', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'RENTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RentalPeriod" AS ENUM ('MONTHS_1', 'MONTHS_3', 'MONTHS_6', 'MONTHS_12');

-- CreateEnum
CREATE TYPE "UtilitiesPayment" AS ENUM ('INCLUDED', 'SEPARATE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Messenger" AS ENUM ('TELEGRAM', 'VIBER', 'WHATSAPP', 'PHONE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateTable
CREATE TABLE "apartments" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "city" "City" NOT NULL,
    "district" VARCHAR(64) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'UAH',
    "price_uah" INTEGER NOT NULL,
    "rooms" SMALLINT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "floor" SMALLINT NOT NULL,
    "total_floors" SMALLINT NOT NULL,
    "description" TEXT NOT NULL,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "has_appliances" BOOLEAN NOT NULL DEFAULT false,
    "children_allowed" BOOLEAN NOT NULL DEFAULT false,
    "pets_allowed" BOOLEAN NOT NULL DEFAULT false,
    "dogs_allowed" BOOLEAN NOT NULL DEFAULT false,
    "cats_allowed" BOOLEAN NOT NULL DEFAULT false,
    "rental_period" "RentalPeriod" NOT NULL DEFAULT 'MONTHS_6',
    "deposit" INTEGER,
    "utilities" "UtilitiesPayment" NOT NULL DEFAULT 'SEPARATE',
    "utilities_note" VARCHAR(200),
    "status" "ApartmentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "published_at" TIMESTAMPTZ(3),

    CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartment_images" (
    "id" TEXT NOT NULL,
    "apartment_id" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "storage_key" VARCHAR(300) NOT NULL,
    "alt" VARCHAR(200),
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "blur_data_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apartment_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartment_slug_redirects" (
    "slug" VARCHAR(160) NOT NULL,
    "apartment_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apartment_slug_redirects_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "messenger" "Messenger",
    "message" VARCHAR(1000),
    "apartment_id" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" VARCHAR(300),
    "consent_at" TIMESTAMPTZ(3) NOT NULL,
    "ip_hash" VARCHAR(64),
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(80),
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "last_login_at" TIMESTAMPTZ(3),
    "password_changed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" VARCHAR(64) NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" VARCHAR(300),
    "ip_hash" VARCHAR(64),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "site_name" VARCHAR(60) NOT NULL DEFAULT 'DOMA RENT',
    "logo_url" VARCHAR(500),
    "logo_storage_key" VARCHAR(300),
    "phone" VARCHAR(32),
    "email" VARCHAR(254),
    "telegram_url" VARCHAR(300),
    "viber_url" VARCHAR(300),
    "whatsapp_url" VARCHAR(300),
    "working_hours" VARCHAR(120),
    "default_city" "City" NOT NULL DEFAULT 'KYIV',
    "company_description" VARCHAR(1500),
    "social_links" JSONB NOT NULL DEFAULT '[]',
    "seo_title" VARCHAR(120),
    "seo_description" VARCHAR(300),
    "legal_company_name" VARCHAR(200),
    "legal_address" VARCHAR(300),
    "legal_email" VARCHAR(254),
    "legal_phone" VARCHAR(32),
    "ga_measurement_id" VARCHAR(32),
    "meta_pixel_id" VARCHAR(32),
    "cookie_consent_version" INTEGER NOT NULL DEFAULT 1,
    "usd_rate" DOUBLE PRECISION NOT NULL DEFAULT 41.5,
    "eur_rate" DOUBLE PRECISION NOT NULL DEFAULT 48,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" VARCHAR(200) NOT NULL,
    "count" INTEGER NOT NULL,
    "reset_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(32),
    "entity_id" VARCHAR(64),
    "details" VARCHAR(500),
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "apartments_slug_key" ON "apartments"("slug");

-- CreateIndex
CREATE INDEX "apartments_status_city_price_uah_idx" ON "apartments"("status", "city", "price_uah");

-- CreateIndex
CREATE INDEX "apartments_status_published_at_idx" ON "apartments"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "apartments_status_city_district_idx" ON "apartments"("status", "city", "district");

-- CreateIndex
CREATE INDEX "apartments_updated_at_idx" ON "apartments"("updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "apartment_images_storage_key_key" ON "apartment_images"("storage_key");

-- CreateIndex
CREATE INDEX "apartment_images_apartment_id_sort_order_idx" ON "apartment_images"("apartment_id", "sort_order");

-- CreateIndex
CREATE INDEX "apartment_slug_redirects_apartment_id_idx" ON "apartment_slug_redirects"("apartment_id");

-- CreateIndex
CREATE INDEX "leads_status_created_at_idx" ON "leads"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits"("reset_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- AddForeignKey
ALTER TABLE "apartment_images" ADD CONSTRAINT "apartment_images_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_slug_redirects" ADD CONSTRAINT "apartment_slug_redirects_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
