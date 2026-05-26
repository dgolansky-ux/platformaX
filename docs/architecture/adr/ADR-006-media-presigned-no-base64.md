# ADR-006 — Media Presigned Upload, No Base64 Runtime

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-24  
Owner: Media

## Context

Base64/dataUrl uploads cause performance, memory, security and API problems.

## Decision

Runtime media uploads go through the media domain and presigned upload flow.

## Consequences

- owner domains store media refs,
- media validation is centralized,
- provider can change later,
- UI placeholders are allowed before media runtime exists.

## What this forbids

- base64 upload in runtime,
- dataUrl upload in runtime,
- readAsDataURL as production upload path,
- large files in JSON bodies,
- random domains owning file upload.

## Required enforcement

- `check-media-base64`,
- media DTO tests,
- upload adapter tests,
- CI media gate.
