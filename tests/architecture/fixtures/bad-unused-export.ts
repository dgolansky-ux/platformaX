// RED-CASE FIXTURE — excluded from every active gate.
// Knip MUST report `unusedHelper` as an unused export.
// @ts-nocheck
export function unusedHelper(): string {
  return "knip should report me";
}
