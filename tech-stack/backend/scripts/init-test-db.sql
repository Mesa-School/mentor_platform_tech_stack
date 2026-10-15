-- Runs once on first container start: creates the database used by integration tests
-- (TEST_DATABASE_URL) alongside the dev database.
CREATE DATABASE app_test OWNER app;
