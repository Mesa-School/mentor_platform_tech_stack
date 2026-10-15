/**
 * Integration tests for the slice: the full HTTP stack against the real dockerized Postgres.
 * Do not mock the database — the SQL and the constraints are exactly what is worth testing.
 *
 * Five categories, every slice:
 *   1. happy path (create + each transition) → status code + envelope shape
 *   2. validation      → 422 VALIDATION_ERROR with field details
 *   3. uniqueness      → 409 with the domain error.code
 *   4. RBAC            → wrong role 403; out-of-scope GET /:id 404, never 403 (no existence leak)
 *   5. transitions     → wrong prior state 409 INVALID_STATUS_TRANSITION
 *
 * import request from 'supertest'
 * import { describe, expect, it } from 'vitest'
 * import { app, authFor, seedUser } from '../../../tests/helpers.js'
 *
 * describe('POST /api/v1/things', () => {
 *   it('creates a thing and returns it in the envelope', async () => {
 *     const user = await seedUser({ role: 'USER' })
 *     const res = await request(app)
 *       .post('/api/v1/things')
 *       .set('Authorization', await authFor(user))
 *       .send({ name: 'Acme' })
 *
 *     expect(res.status).toBe(201)
 *     expect(res.body.data).toMatchObject({ name: 'Acme', status: 'DRAFT' })
 *   })
 *
 *   it('rejects invalid input with 422', async () => {
 *     const user = await seedUser({ role: 'USER' })
 *     const res = await request(app)
 *       .post('/api/v1/things')
 *       .set('Authorization', await authFor(user))
 *       .send({ name: '' })
 *
 *     expect(res.status).toBe(422)
 *     expect(res.body.error.code).toBe('VALIDATION_ERROR')
 *   })
 *
 *   it('forbids a USER from activating', async () => {
 *     const user = await seedUser({ role: 'USER' })
 *     const res = await request(app)
 *       .post('/api/v1/things/' + id + '/activate')
 *       .set('Authorization', await authFor(user))
 *
 *     expect(res.status).toBe(403)
 *   })
 * })
 */
export {}
