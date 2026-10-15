/**
 * Public surface of the dashboard slice.
 *
 * These used to live in `app/(app)/admin/dashboard/_components/`. They belong
 * here instead: `app/` holds routing and layout only, so anything with domain
 * meaning — even if today only one page renders it — lives in a feature slice.
 * That also means the dashboard's activity feed can be reused on the activity
 * page without moving files again.
 *
 * When the aggregate endpoint exists, add `services/` + `hooks/` next to
 * `components/` and export the hooks from here too.
 */
export { ActivityFeed } from "./components/activity-feed";
export { DashboardStats } from "./components/dashboard-stats";
export { ThroughputChart } from "./components/throughput-chart";
