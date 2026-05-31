/**
 * app-v2/communities/CreateCommunityPage — /communities/new
 *
 * Hosts the 4-step CreateCommunityWizard; loads the category catalog from the
 * local MOCK_LOCAL_ONLY adapter and navigates to the new community's profile
 * on success.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreateCommunityWizard,
  communitiesMockAdapter,
} from "@client/features-v2/communities-v2";
import type { CommunityCategoryDTO } from "@shared/contracts/communities";

export function CreateCommunityPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<readonly CommunityCategoryDTO[]>([]);

  useEffect(() => {
    let alive = true;
    void communitiesMockAdapter.listCategories().then((list) => {
      if (alive) setCategories(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <CreateCommunityWizard
      categories={categories}
      onCreated={(profile) => navigate(`/communities/${profile.slug}`)}
      onCancel={() => navigate("/communities")}
    />
  );
}
