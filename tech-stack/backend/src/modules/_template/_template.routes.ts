/**
 * Paths → guards → controller. No logic here, ever.
 *
 * State transitions get an action sub-resource (POST /:id/activate) rather than an overloaded
 * PATCH: explicit, individually guardable by role, and a clean mutation hook on the client.
 *
 * import { Router } from 'express'
 * import { requireAuth, requireRole } from '../../core/auth/rbac.js'
 * import * as controller from './_template.controller.js'
 *
 * export const thingRouter: Router = Router()
 *
 * thingRouter.use(requireAuth)                 // everything below needs a valid access token
 *
 * thingRouter.get('/', controller.list)
 * thingRouter.post('/', controller.create)
 * thingRouter.get('/:id', controller.getOne)
 * thingRouter.patch('/:id', controller.update)
 * thingRouter.post('/:id/activate', requireRole('MANAGER', 'ADMIN'), controller.activate)
 */
export {}
