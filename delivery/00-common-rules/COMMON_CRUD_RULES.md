# Common CRUD Rules — the repeatable master-data recipe

> Most of Phase 1 (Master Data) and many lists elsewhere are CRUD. Build them the **same way every time**
> using the host's generic base classes, so they're cheap and uniform. Reference mock: any `erp-md-*.html`.

## Backend recipe (per entity)
1. **Entity** `Wms<Entity>` in `WMS.Entities` (+ migration).
2. **DTOs** `Wms<Entity>DTO / CreationDTO / EditorDTO / FilterDTO` in `WMS.DTO`.
3. **AutoMapper** profile `Wms<Entity>Profile`.
4. **Repository** — reuse `IGenericBaseRepository<Wms<Entity>>`; add a per-entity repo only for custom queries.
5. **Service** `IWms<Entity>Service : IBaseService<Wms<Entity>DTO>` → `ConcreteBaseService<...>`; override/extend only for rules.
6. **Controller** — standard endpoints:
   - `POST /api/<entity>/gridfilter` → `DataSourceResult` (list, server-side filter/sort/page)
   - `GET /api/<entity>/{id}` → `OperationResult` (Data = DTO)
   - `POST /api/<entity>` (CreationDTO) · `PUT /api/<entity>` (EditorDTO) · `DELETE /api/<entity>/{id}`
7. **Scope (CC-08):** filter list + assert scope on write. **Audit:** master-data edits log via the host audit fields; stock-affecting changes also `logTxn`.

## Frontend recipe (per entity)
- **List** = Kendo grid bound to `gridfilter`; standard toolbar (search, create, filters, the **Assignee/My-requests filter** where the entity is a work-item — CC-09).
- **Form** = Nebular dialog or routed component, Reactive Forms, validators mirroring server rules; create/edit reuse one form.
- **NgRx** = `load<Entity>s`, `save<Entity>`, `delete<Entity>` actions/effects; selectors for the grid + the selected item.
- Permission-gate create/edit/delete buttons (CC-10). Tracking-flag fields only where relevant (CC-05).

## Standard validation
- Uniqueness of the business `Code` per scope → server returns `CodeAlreadyExist`.
- Required fields → `RequiredField`. FK existence → `ForeignKeyConflict` on delete.
- `active/inactive` status rather than hard delete where the entity is referenced.

## Don't
- Don't hand-roll list pagination/filtering — use `DataSourceRequest`.
- Don't hand-write the Angular API service — use the generated client.
- Don't duplicate the recipe per entity in a card — link here; the card lists only the **deltas** (extra fields, special rules).
