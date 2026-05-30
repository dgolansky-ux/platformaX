/**
 * media — repository + storage port contracts (domain-root facade).
 *
 * The repository and storage *interfaces* are legitimate cross-boundary
 * contracts (the application layer and tests inject implementations). The
 * in-memory repository/intent repository and env-required storage *factories*
 * are NOT public. `public-api.ts` exports the interface types through this
 * module so it never exports from `./repository` directly — the boundary
 * guard treats any `public-api.ts` export from `repository` as an
 * implementation leak.
 */
export type {
  MediaRepository,
  UploadIntentRepository,
  MediaStoragePort,
  CreateMediaRecordInput,
  UpdateMediaRecordPatch,
  CreateUploadIntentRecordInput,
  CreateVariantInput,
  UploadTarget,
  UploadTargetRequest,
} from "./repository";
