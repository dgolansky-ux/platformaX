// RED-CASE FIXTURE — see bad-circular-a.ts.
// @ts-nocheck
import { fromA } from "./bad-circular-a";
export function fromB() {
  return fromA;
}
