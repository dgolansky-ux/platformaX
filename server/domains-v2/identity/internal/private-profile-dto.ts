/**
 * identity — private profile DTO re-export (internal-only thin shim)
 *
 * The canonical location is `../private-dto.ts`. This file remains under
 * `/internal/` because earlier callers imported from here and the public-api
 * boundary guard now forbids public-api re-exporting from internal/*.
 * Keep this file as the internal alias for internal consumers (mapper, service).
 */
export type { PrivateProfileDTO } from "../private-dto";
