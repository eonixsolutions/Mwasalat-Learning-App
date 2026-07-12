# New Module Generator

Generate a complete backend + frontend module for the Eonix platform.

**Module name from argument:** $ARGUMENTS

---

## Backend files to generate

All files go in `backend/src/modules/$ARGUMENTS/`:

1. **`$ARGUMENTS.model.js`** — Mongoose schema
   - Use `{ timestamps: true }`
   - Add proper indexes
   - Field validation
   - Soft delete field (`isDeleted`, `deletedAt`) if the entity needs it
   - `select: false` on sensitive fields
   - `.toJSON()` to strip sensitive data

2. **`$ARGUMENTS.routes.js`** — Express Router
   - Import `authMiddleware.authenticate` and `authMiddleware.authorize`
   - Import `validate` middleware and the validation schemas
   - Map HTTP methods to controller functions

3. **`$ARGUMENTS.controller.js`** — Thin controller
   - Wrap every handler in `asyncHandler`
   - Call service methods only
   - Return `successResponse()` with appropriate status codes
   - No business logic here

4. **`$ARGUMENTS.service.js`** — Business logic
   - Import from repository (or model for simple queries)
   - Throw `new AppError(message, statusCode)` on failure
   - Never send HTTP responses
   - Handle all workflows, validation logic, external calls

5. **`$ARGUMENTS.repository.js`** — DB queries
   - Named query functions only
   - Handle complex aggregations, filtering, pagination
   - Export as a named object `export const $ARGUMENTSRepository = { ... }`

6. **`$ARGUMENTS.validation.js`** — express-validator schemas
   - Body, params, query validation
   - Export named arrays (e.g., `createSchema`, `updateSchema`, `listSchema`)

After generating backend files, **add the route to `backend/src/routes.js`**:
```js
import $ARGUMENTSRoutes from './modules/$ARGUMENTS/$ARGUMENTS.routes.js';
router.use('/$ARGUMENTS', $ARGUMENTSRoutes);
```

---

## Frontend files to generate

1. **`frontend/src/services/$ARGUMENTS.service.js`**
   - All API calls using `api` from `../api/axios.js`
   - Named exports
   - Return `res.data` or `res.data.data`

2. **`frontend/src/pages/$ARGUMENTS/`**
   - Page-level components
   - Use TanStack Query `useQuery` / `useMutation`
   - Use React Hook Form for forms
   - Toast notifications for success/error

3. **`frontend/src/components/$ARGUMENTS/`** (if module needs reusable components)
   - Module-specific components
   - Use `components/ui/` primitives

4. **Add routes to `frontend/src/routes/AppRoutes.jsx`** for the new pages

---

## Checklist
- [ ] All backend files created
- [ ] Route registered in `backend/src/routes.js`
- [ ] Frontend service file created
- [ ] Frontend pages created
- [ ] Frontend routes added to AppRoutes.jsx
- [ ] Auth middleware applied where needed
- [ ] Input validation on all endpoints
