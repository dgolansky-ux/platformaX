// PX-CONTRACT-001-ACK: scaffold-stage domain; public-api contract test will land when the domain reaches PARTIAL_RUNTIME. EXC-016.
/**
 * topics-v2 — public API surface (FOUNDATION_READY).
 */
export { createTopicsService } from "./service";
export type {
  TopicsService,
  TopicsServiceDeps,
  TopicsResult,
  TopicsErrorCode,
  TopicsClock,
  TopicsIdGen,
} from "./service";
export { createInMemoryTopicRepository } from "./store";
export type { TopicRepository } from "./store";
export type {
  TopicOwnershipResolver,
  TopicModuleEnablementResolver,
} from "./contracts";
export type {
  TopicDTO,
  TopicPublicDTO,
  TopicOwnerType,
  TopicVisibility,
  TopicStatus,
  CreateTopicInput,
  UpdateTopicInput,
} from "./dto";
export {
  TOPIC_TITLE_MAX,
  TOPIC_DESCRIPTION_MAX,
  TOPIC_SLUG_MAX,
  TOPIC_SLUG_RE,
} from "./dto";
export { isTopicVisibility } from "./policy";