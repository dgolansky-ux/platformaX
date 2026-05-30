/**
 * content-v2/workplace-posts — repository port.
 */
import type { WorkplacePostRecord } from "./dto";

export interface WorkplacePostRepository {
  insert(record: WorkplacePostRecord): Promise<void>;
  update(record: WorkplacePostRecord): Promise<void>;
  getById(id: string): Promise<WorkplacePostRecord | null>;
  listForWorkplace(
    workplaceId: string,
    cursor: string | null,
    limit: number,
  ): Promise<WorkplacePostRecord[]>;
}
