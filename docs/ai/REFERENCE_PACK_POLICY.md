# PlatformaX V2 — Reference Pack Policy

Status: `ACTIVE`  
Owner: Governance / Legacy Containment

## 1. Purpose

Reference packs allow old material, screenshots or external examples to be reviewed without contaminating the active V2 runtime.

## 2. Rule

Reference packs are source material only.

They must not be imported, executed, bundled or indexed as active code.

## 3. Allowed contents

- screenshots,
- selected source snippets,
- static HTML/CSS references,
- copy/microcopy references,
- JSON fixture examples without secrets,
- visual inventory documents,
- manifest and SHA256.

## 4. Forbidden contents

- `.env`,
- secrets,
- service role keys,
- database URLs,
- node_modules,
- dist/build,
- nested ZIPs,
- full old repository inside active workspace,
- package scripts that can run old app,
- old backend runtime,
- symlinks into active workspace.

## 5. Placement

Preferred:

```txt
outside active workspace
```

Allowed in repo only if explicitly approved:

```txt
docs/reference/<pack-name>/
```

with import guards proving no runtime imports.

## 6. Validation

A reference pack must include:

- manifest,
- file count,
- no secrets confirmation,
- no nested ZIP confirmation,
- no raw backslash paths,
- SHA256,
- `SOURCE_MATERIAL_ONLY` label.

## 7. Agent rule

An agent may read a reference pack only to understand design or intent. It must write new V2 code manually and must not import reference files.
