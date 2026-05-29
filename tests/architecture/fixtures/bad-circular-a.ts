// RED-CASE FIXTURE — excluded from every active gate.
// Paired with bad-circular-b.ts to produce a circular import that
// dependency-cruiser's `no-circular` rule MUST report.
// @ts-nocheck
import { fromB } from "./bad-circular-b";
export function fromA() {
  return fromB();
}
