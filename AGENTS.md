<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All demo data and mutations live in `src/lib/store.tsx` (React context + localStorage); swap `actions` for API calls when a backend is added, so UI never touches storage directly.
- Signed-in pages live under the pathless `_console` layout, which gates on hydration and checks role access via `src/lib/nav.ts`.
- Leaflet is only imported by `IncidentMap.tsx`, loaded lazily through `MapView` so SSR never evaluates it.
