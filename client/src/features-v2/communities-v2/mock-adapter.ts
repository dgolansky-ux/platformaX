/**
 * features-v2/communities-v2 / mock-adapter — MOCK_LOCAL_ONLY transport.
 *
 * There is no HTTP transport yet. The adapter reads deterministic public-safe
 * fixtures from shared and exposes the async shape expected from a future API.
 */
import type { CommunitiesShellData } from "@shared/contracts/communities";
import { COMMUNITIES_SHELL_FIXTURE } from "@shared/fixtures/communities";

type MockState = {
  data: CommunitiesShellData;
  failure: string | null;
};

const initialState: MockState = {
  data: COMMUNITIES_SHELL_FIXTURE,
  failure: null,
};

let state: MockState = { ...initialState };

export type CommunitiesMockAdapter = {
  listCommunitiesShell(): Promise<CommunitiesShellData>;
  __setDataForTests(data: CommunitiesShellData): void;
  __setFailureForTests(message: string | null): void;
  __resetForTests(): void;
};

export const communitiesMockAdapter: CommunitiesMockAdapter = {
  async listCommunitiesShell() {
    if (state.failure) throw new Error(state.failure);
    return state.data;
  },
  __setDataForTests(data) {
    state = { ...state, data };
  },
  __setFailureForTests(message) {
    state = { ...state, failure: message };
  },
  __resetForTests() {
    state = { ...initialState };
  },
};
