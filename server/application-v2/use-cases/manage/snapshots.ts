/**
 * application-v2/use-cases/manage — port snapshot types (Slice 21).
 *
 * Shapes the manage orchestrator reads from underlying domains. Each
 * snapshot is a tiny, owner-only summary — no raw records leak through.
 */
export interface ManageOwnerSummary {
  readonly userId: string;
  readonly displayName: string;
  readonly handle: string;
  readonly avatarInitial: string;
  readonly accountEmailMasked: string | null;
  readonly accountStatus: "active" | "limited" | "blocked";
  readonly bioSummary: string | null;
  readonly visibility: "public" | "friends_only" | "private";
}

export interface ManagePrivacySnapshot {
  readonly profileVisibility: "public" | "friends_only" | "private";
  readonly professionalLayerVisibility: "public" | "friends_only" | "private";
  readonly publicHubVisibility: "public" | "friends_only" | "private";
  readonly feedPreviewVisibility: "public" | "friends_only" | "private";
  readonly workplaceVisibility: "public" | "friends_only" | "private";
}

export interface ManageContactSnapshot {
  readonly approvedConsentsCount: number;
  readonly pendingRequestsCount: number;
  readonly revokedAccessCount: number;
  readonly fieldsAvailable: readonly ("email" | "phone")[];
  readonly defaultFieldVisibilityLabel: string;
}

export interface ManageFriendsSnapshot {
  readonly friendsCount: number;
  readonly invitesSentCount: number;
  readonly invitesReceivedCount: number;
  readonly blockedCount: number;
}

export interface ManageNotificationsSnapshot {
  readonly categories: readonly {
    readonly key:
      | "friend_feed"
      | "communities"
      | "channels"
      | "professional_profile"
      | "modules"
      | "system";
    readonly label: string;
    readonly inAppEnabled: boolean;
    readonly transportPartial: boolean;
  }[];
  readonly unreadTotal: number;
}

export interface ManageMediaSnapshot {
  readonly hasAvatar: boolean;
  readonly hasBanner: boolean;
  readonly profileMediaCount: number;
  readonly uploadPipelineStatus: "ready" | "partial" | "blocked";
}

export interface ManageProfessionalSnapshot {
  readonly selectedCategoriesCount: number;
  readonly selectedProfessionsCount: number;
  readonly selectedSpecializationsCount: number;
}

export interface ManageWorkplacesSnapshot {
  readonly activeWorkplacesCount: number;
  readonly archivedWorkplacesCount: number;
}

export interface ManageModulesSnapshot {
  readonly enabledModulesCount: number;
  readonly publicHubVisibilityLabel: string;
}

export interface ManageChannelsSnapshot {
  readonly leadOfCount: number;
  readonly followingCount: number;
}

export interface ManageCommunitiesSnapshot {
  readonly founderOfCount: number;
  readonly adminOfCount: number;
  readonly moderatorOfCount: number;
}

export interface ManageSecuritySnapshot {
  readonly activeSessionsCount: number;
  readonly lastSignInAt: string | null;
  readonly twoFactorEnabled: boolean;
  readonly featureReadiness: "future_ready" | "partial" | "available";
}

export interface ManageDashboardPort {
  loadOwnerSummary(currentUserId: string): Promise<ManageOwnerSummary | null>;
  loadPrivacySnapshot(currentUserId: string): Promise<ManagePrivacySnapshot>;
  loadContactSnapshot(currentUserId: string): Promise<ManageContactSnapshot>;
  loadFriendsSnapshot(currentUserId: string): Promise<ManageFriendsSnapshot>;
  loadNotificationsSnapshot(currentUserId: string): Promise<ManageNotificationsSnapshot>;
  loadMediaSnapshot(currentUserId: string): Promise<ManageMediaSnapshot>;
  loadProfessionalSnapshot(currentUserId: string): Promise<ManageProfessionalSnapshot>;
  loadWorkplacesSnapshot(currentUserId: string): Promise<ManageWorkplacesSnapshot>;
  loadModulesSnapshot(currentUserId: string): Promise<ManageModulesSnapshot>;
  loadChannelsSnapshot(currentUserId: string): Promise<ManageChannelsSnapshot>;
  loadCommunitiesSnapshot(currentUserId: string): Promise<ManageCommunitiesSnapshot>;
  loadSecuritySnapshot(currentUserId: string): Promise<ManageSecuritySnapshot>;
}
