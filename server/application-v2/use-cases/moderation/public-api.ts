/**
 * application-v2/use-cases/moderation — public surface.
 *
 * Composes the moderation domain with optional per-source target preview
 * resolvers. Source domains stay decoupled — the use-case never imports their
 * internals, only their `public-api.ts`.
 */
export {
  createModerationUseCase,
} from "./service";
export type {
  ModerationActionDispatcher,
  ModerationDispatchContext,
  ModerationDispatchOutcome,
  ModerationTargetPreviewResolver,
  ModerationUseCase,
  ModerationUseCaseDeps,
} from "./service";
export {
  createContentModerationDispatcher,
} from "./dispatcher";
export type {
  ContentDispatcherDeps,
} from "./dispatcher";
