-- 2026-09-30 — task attachments + board rank
--
-- Additive only: adds three columns to `todos`, drops nothing. The legacy
-- `link` / `image_url` columns stay in place (the app still reads them and
-- folds them into the new arrays), so this is safe to run before or after
-- deploying the matching code.
--
-- Apply with either:
--   npm run db:push          (drizzle-kit diff against db/schema)
--   or paste this file into the Neon SQL editor.

alter table todos add column if not exists links jsonb not null default '[]'::jsonb;
alter table todos add column if not exists images jsonb not null default '[]'::jsonb;
alter table todos add column if not exists sort_order double precision;

-- Rollback (only if you need to undo):
--   alter table todos drop column if exists links;
--   alter table todos drop column if exists images;
--   alter table todos drop column if exists sort_order;
