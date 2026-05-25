## Summary

<!-- What does this PR do? 1-3 sentences. -->

## Architecture Impact Statement

| Question | Answer |
|---|---|
| Dotknięte domeny | |
| Czy zmieniono public-api / contracts / events | YES / NO |
| Czy dodano cross-domain import | YES / NO |
| Czy dotknięto App.tsx / routing / nav | YES / NO |
| Czy dotknięto public DTO / PII | YES / NO |
| Czy dotknięto media / upload | YES / NO |
| Czy dotknięto list / feed / search pagination | YES / NO |
| Czy dotknięto removed legacy areas | YES / NO |

## Domain Impact

| Question | Answer |
|---|---|
| Czy dodano nową domenę | YES / NO |
| Czy domena jest w DOMAIN_REGISTRY | YES / NO |
| Czy folder domeny ma wymagane pliki | YES / NO |
| Czy zmieniono ownership matrix | YES / NO |
| Czy dodano cross-domain dependency | YES / NO |
| Czy public-api/contracts/events są użyte zamiast internals | YES / NO |

## Evidence

- **Evidence path:** `docs/review/step-XX-.../`
- **Gates run:** check / lint / test / build / rules:check / arch:check:v2 / guards:domains
- **Final status:** <!-- e.g. FULL_DOMAIN_BASELINE_READY -->

## Test plan

- [ ] `pnpm check` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm test` PASS
- [ ] `pnpm build` PASS
- [ ] `pnpm rules:check` PASS
- [ ] `pnpm arch:check:v2` PASS
- [ ] `pnpm guards:domains` PASS
- [ ] No `--no-verify` used
- [ ] No secrets committed
- [ ] No legacy code introduced
