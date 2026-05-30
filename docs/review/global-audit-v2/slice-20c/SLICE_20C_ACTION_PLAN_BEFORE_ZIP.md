# SLICE 20C — Action Plan przed pełnym ZIP-em (Slice 21)

## P0 — brak (0 pozycji)

Brak P0 do naprawy. Wszystkie krytyczne bramki PASS, brak PII leak, brak fake save, brak złamań granic domenowych.

---

## P1 — wymagane przed Slice 21 (5 pozycji)

### P1-1. Mobile FAB → realny composer
**Plik:** `client/src/app-v2/navigation/FloatingNav.tsx:89-98`
**Problem:** Centralny `[+]` FAB pokazuje modal "Wkrótce" zamiast otwierać composer.
**Co zrobić:**
- Wpiąć `ComposerTrigger`/`ComposerModal` z `features-v2/publishing` lub emitować `CustomEvent("publishing:open")` którego nasłuchuje aktywny surface (`FriendFeedPage`, `CommunityFeedsShell`).
- Najprostsza droga: wbudować mini-state w `FloatingNav` z `ComposerModal` + `FriendFeedComposer` targetem `friend_feed` (najszerszy kontekst).
**Effort:** ~30 min.
**Akceptacja:** kliknięcie FAB otwiera composer modal, submit publikuje do feed znajomych, idempotency respected.

### P1-2. Banner runtime status "Działa na MOCK_LOCAL_ONLY"
**Plik:** nowy — najlepiej w `app-v2/navigation/AppShell.tsx` (po jego wdrożeniu) lub jednorazowo w `LandingPage`/`/profile`/`/friends-feed`.
**Problem:** Użytkownik (i auditor) nie widzą wprost, że całość pracuje na in-memory mock state. Po refreshu wszystko znika.
**Co zrobić:**
- Mały dyskretny banner u góry (zwijany) z tekstem: "Tryb demo — wpisy nie są jeszcze zapisywane na serwerze. Po przeładowaniu strony znikną."
- Może być kontrolowane env-flagiem `VITE_RUNTIME_BACKEND="mock"` (domyślnie `mock`).
**Effort:** ~20 min.
**Akceptacja:** banner widoczny na każdym route prowadzącym do mutacji (feed/composer), zniknie automatycznie gdy `VITE_RUNTIME_BACKEND="supabase"`.

### P1-3. Ważne wydarzenia / Prezentacja profilu — sekcja na profilu
**Pliki:** `client/src/features-v2/personal-profile/PersonalProfilePage.tsx`, nowe sekcje.
**Problem:** Composer w `publishing/composers/{ImportantEventComposer,ProfilePresentationComposer}.tsx` istnieje, karty `ImportantEventCard`/`ProfilePresentationCard` istnieją, route docelowy `/profile/me/important-events` (i analog) **NIE istnieje** w routerze. Composer zwraca `partial` z `blockedReason: backend_not_ready_v2`.
**Co zrobić:** 
- Albo: dodać sekcje read-only na profilu z mocked listą (do czasu backendu), aby pętla była czytelna.
- Albo: ukryć/oznaczyć composer "Wkrótce" z czytelnym message zamiast pokazywać go w domyślnym widoku (obecnie jest tylko w composer trigger flow).
**Effort:** ~45 min (mock sekcje), ~1.5 h (lekka domena backend).
**Akceptacja:** użytkownik klikając "Ważne wydarzenie" w composer triggerze widzi albo lista mock-wydarzeń + uczciwą notkę "backend wkrótce", albo wyłączoną opcję.

### P1-4. AppShell wpięty w route shells
**Plik:** `client/src/app-v2/navigation/AppShell.tsx` (untracked) → wpięcie w 10+ route shells.
**Problem:** AppShell istnieje, ale nie jest używany. Każdy route ręcznie składa `DesktopSidebar` + `main` + `FloatingNav`. Duplikacja, ryzyko rozjazdu (np. `ModerationAdminPage` nie ma sidebar w ogóle — UX wpadka).
**Co zrobić:** Wymienić w route shells:
```tsx
// before
<div className={styles.page}>
  <DesktopSidebar active="feed" displayName="..." ... />
  <main className={styles.content}><FriendFeedPage ... /></main>
  <FloatingNav active="feed" />
</div>

// after
<AppShell active="feed" displayName="..." ...>
  <FriendFeedPage ... />
</AppShell>
```
- Doszlifować na `ModerationAdminPage`, żeby był sidebar.
**Effort:** ~30-45 min.
**Akceptacja:** wszystkie route shells używają `AppShell`, brak ręcznego składania sidebar/nav.

### P1-5. Code-splitting (chunk size warning)
**Plik:** `vite.config.ts`.
**Problem:** `vite build` ostrzega: chunk 724 KB > 500 KB. Wpłynie na TTI mobile.
**Co zrobić:** Dodać `build.rollupOptions.output.manualChunks` z grupami:
```ts
manualChunks: {
  react: ['react', 'react-dom', 'react-router-dom'],
  publishing: ['client/src/features-v2/publishing'],
  communities: ['client/src/features-v2/communities-v2'],
  // ...
}
```
LUB dynamiczne `lazy()` na heavy pages (`CommunityFeedsShell`, `ChannelProfilePage`, `ModerationAdminPage`).
**Effort:** ~20-30 min.
**Akceptacja:** największy chunk < 500 KB, build bez warningu.

---

## P2 — polish / spójność (8 pozycji)

### P2-1. Mobile ikony emoji → SVG (spójność z desktop)
Plik: `FloatingNav.tsx:86-107`. Zamienić emoji `🏠 👥 ＋ 🔔 👤` na te same SVG ikony co w `desktop-sidebar-icons.tsx`. Effort: ~15 min.

### P2-2. Hardcoded `DEMO_VIEWER_ID = "u-viewer"` w 5+ miejscach
Wyciągnąć do `useDemoViewer()` lub `useAuthViewer()` hook (`client/src/app-v2/auth/`). Effort: ~30 min.

### P2-3. Hardcoded `displayName="Demo użytkownik"`, `handle="demo"`
Wyciągnąć do hook'a / context. Effort: ~30 min.

### P2-4. `ModerationAdminPage` bez nav
Po P1-4 (AppShell) → opakować `ModerationAdminPage` w AppShell. Effort: ~5 min.

### P2-5. Card variants — różnice tylko CSS
Rozważyć więcej zróżnicowania: StaffFeedPostCard powinien mieć "kadra" badge, RelationalFeedPostCard meta-bar z relation type. Effort: ~1 h.

### P2-6. Skeleton loading states
`NotificationsPage`, `ChannelsShell`, `WorkplacePage` mają proste `aria-busy` div'y. Dodać skeleton placeholders. Effort: ~45 min.

### P2-7. Inline media lightbox
Klikanie media w `PostMediaGrid` powinno otwierać lightbox, nie `PostRouteLink` na cały post. Effort: ~1 h.

### P2-8. Knip cleanup
Uruchomić `pnpm knip:check` i posprzątać dead exports. Effort: ~30 min - 1 h.

---

## P3 — kosmetyka (6 pozycji)

### P3-1. Empty index.ts w scaffold dirs
44 orphans w depcruise. Dodać minimal exports lub usunąć pliki do czasu kolejnych slice'ów. Effort: ~10 min.

### P3-2. Komentarze nagłówkowe ujednolicić
W kilku plikach komentarze są długie eseje (ok), w innych jednolinijkowe. Effort: ~1 h.

### P3-3. CSS modules — nazewnictwo
`Cards.module.css`, `Channels.module.css`, `CommunitiesShell.module.css` itd. — niejednolite styl nazw klas. Effort: ~30 min.

### P3-4. Polskie diakrytyki w komentarzach
Większość ok, w paru testach angielskie. Effort: ~15 min.

### P3-5. Testy ARIA snapshot stability
Brak — można dodać `@testing-library/jest-dom` accessibility assertions w kilku miejscach. Effort: ~30 min.

### P3-6. Migrations
`supabase/` — sprawdzone że nie ma destrukcyjnych migracji (`check-migration-safety.mjs` PASS). Czysto. Effort: 0.

---

## Sugerowana kolejność wykonania

**Day 1 (Slice 20D pre-zip pass)** — P1-1, P1-2, P1-4, P1-5 (~2 h).
**Day 2 (Slice 21 polish)** — P1-3, P2-1..P2-4 (~2 h).
**Po Slice 21** — pozostałe P2/P3.

---

## Co MOŻNA już teraz robić: ZIP Slice 20C raportowy

Bramki zielone, brak P0, P1 są opisane jako "do naprawy przed Slice 21 pełnym ZIP-em", a NIE "blokery dla SLICE 20C raportowego ZIP-a". 

ZIP SLICE 20C (raporty) → **GO**.
