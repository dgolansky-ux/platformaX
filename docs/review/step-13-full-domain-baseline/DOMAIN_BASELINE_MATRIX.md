# Step 13 — Domain Baseline Matrix

| Domain | Server scaffold | Client feature | Registry | Ownership | Required files | Guard coverage | Status |
|---|---|---|---|---|---|---|---|
| identity | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| social | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| communities-v2 | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| content-v2 | YES (+ 7 submodules) | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| channels | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| chat | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| events | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| modules | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| public-hub | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| notifications | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| media | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| search | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| moderation | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| audit | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |
| system | YES | YES | YES | YES | 7/7 + test | registry + scaffold + boundaries | SCAFFOLD_ONLY |

## Application layers

| Layer | Scaffold | Registry | Status |
|---|---|---|---|
| publisher | YES | YES (DOMAIN_REGISTRY.md) | SCAFFOLD_ONLY |
| app-shell | YES | YES (DOMAIN_REGISTRY.md) | SCAFFOLD_ONLY |
| onboarding | YES | YES (DOMAIN_REGISTRY.md) | SCAFFOLD_ONLY |

## content-v2 submodules

| Submodule | Scaffold | Status |
|---|---|---|
| posts | YES | SCAFFOLD_ONLY |
| feeds | YES | SCAFFOLD_ONLY |
| comments | YES | SCAFFOLD_ONLY |
| reactions | YES | SCAFFOLD_ONLY |
| topics | YES | SCAFFOLD_ONLY |
| read-models | YES | SCAFFOLD_ONLY |
| publisher | YES | SCAFFOLD_ONLY |
