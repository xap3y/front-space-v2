# Shared UI

Preview controls at `/design`. The application uses shared styling for actions,
inputs, selection controls, surfaces and paginated resource lists.

Import new controls from `@/components/ui`. The `DeleteButton` and `SaveButton`
exports and the compatibility exports in `HoverDiv.tsx` share the same styling.
Native form actions use `NativeButton` / `NativeDeleteButton`, which delegate to
`HoverButton` in `HoverDiv.tsx` and retain native submit, event and ref semantics.

- `Button`: primary, secondary, save, delete and warning variants; normal/small
  sizes; disabled, loading and icon-only states.
- `DeleteButton`, `SaveButton`, `CopyButton`: fixed action icons and variants.
- `Field`, `SearchField`: labeled `MainStringInput` wrappers with hints/errors.
- `Checkbox`: boolean form values and multi-selection.
- `Toggle`: immediately applied on/off settings.
- `SegmentedControl`: mutually exclusive display modes using pressed buttons.
- `Panel`, `Grid`, `Toolbar`: consistent containers and responsive spacing.
- `ResourceCard`: compact/detailed content with the same loading structure.
- `Badge`, `Skeleton`, `EmptyState`, `Pagination`: shared supporting states.
- `ResourceList`, `Surface`: opaque list and panel shells.
- `SelectionInput`, `SelectControl`: native selection semantics with shared styling.

`Pagination` accepts one-based page numbers. Convert zero-based API pages at the
call site. Use `hasNext` without `pages` for APIs that do not provide a page count;
the UI displays an unknown total instead of inventing one. Keep page-size options
and filter reset behavior at the call site.

Always provide `aria-label` for icon-only buttons. Action components only render
UI; callers own permissions, requests, confirmation and error handling. No
destructive request is made by the showcase. Skeletons should use the same action
slots and widths as the real content when integrating a specific resource.

Visual tokens live in `ui.module.css`. Keep new additions here rather than copying
per-page styles. Media-player controls remain specialized so their hit targets,
positioning, sliders and playback behavior are not changed by form styling.
