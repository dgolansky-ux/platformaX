/**
 * application-v2/use-cases/contacts — public API.
 *
 * Server bootstrap (and the frontend mock adapter for the MOCK_LOCAL_ONLY
 * phase) imports the factory + the application-level types from here.
 */
export { createContactsApplicationService } from "./service";
export type {
  ContactsApplicationService,
  ContactsApplicationServiceDeps,
  ContactsApplicationError,
  ContactsApplicationErrorCode,
  ContactsApplicationResult,
} from "./service";
export { makeRelationshipSignalResolver, buildContactsDashboard } from "./internals";
export type { ContactsDashboardDTO } from "./internals";
