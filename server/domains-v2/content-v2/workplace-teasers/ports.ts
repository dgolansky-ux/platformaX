/**
 * content-v2/workplace-teasers — repository port.
 */
import type { WorkplaceTeaserRecord } from "./dto";

export interface WorkplaceTeaserRepository {
  /** Insert returns false when a teaser with the same dedupeKey already exists. */
  insert(record: WorkplaceTeaserRecord): Promise<{ inserted: boolean }>;
  getByDedupeKey(dedupeKey: string): Promise<WorkplaceTeaserRecord | null>;
  listForOwners(
    ownerUserIds: readonly string[],
    cursor: string | null,
    limit: number,
  ): Promise<WorkplaceTeaserRecord[]>;
  countAll(): Promise<number>;
}
