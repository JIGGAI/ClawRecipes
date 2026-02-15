import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Container } from "react-bootstrap";
import {
  fetchRecipes,
  fetchRecipe,
  fetchRecipeStatus,
  fetchHealth,
  scaffoldRecipeTeam,
  scaffoldRecipeAgent,
  installRecipeSkills,
  type Recipe,
  type RecipeStatus,
} from "../api";
import { useAsync } from "../hooks/useAsync";
import { HealthGuard } from "../components/HealthGuard";
import { PageLoadingState } from "../components/PageLoadingState";
import { RecipeCard } from "../components/RecipeCard";
import { RecipeDetailModal } from "../components/RecipeDetailModal";
import { ScaffoldTeamModal } from "../components/ScaffoldTeamModal";
import { ScaffoldAgentModal } from "../components/ScaffoldAgentModal";

type RecipesWithStatus = {
  recipes: Recipe[];
  statusMap: Record<string, RecipeStatus>;
};

export function RecipesPage() {
  const navigate = useNavigate();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [scaffoldModalRecipe, setScaffoldModalRecipe] = useState<Recipe | null>(null);
  const [scaffoldAgentModalRecipe, setScaffoldAgentModalRecipe] = useState<Recipe | null>(null);
  const [installingRecipeId, setInstallingRecipeId] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  const health = useAsync(
    () => fetchHealth(),
    [],
    { fallbackOnError: { ok: true, openclaw: false } }
  );

  const recipesData = useAsync<RecipesWithStatus>(
    () =>
      health.data?.openclaw
        ? Promise.all([fetchRecipes(), fetchRecipeStatus()]).then(
            ([recipes, statusList]) => ({
              recipes,
              statusMap: Object.fromEntries(
                statusList.map((s) => [s.id, s])
              ),
            })
          )
        : Promise.resolve(null),
    [health.data?.openclaw],
    { enabled: !!health.data?.openclaw }
  );

  const recipeDetail = useAsync<{ md: string }>(
    () =>
      selectedRecipe
        ? fetchRecipe(selectedRecipe.id)
        : Promise.resolve(null),
    [selectedRecipe?.id],
    { enabled: !!selectedRecipe }
  );

  const handleInstallSkills = async (recipeId: string) => {
    setInstallError(null);
    setInstallingRecipeId(recipeId);
    try {
      const result = await installRecipeSkills(recipeId, { scope: "global" });
      if (result.ok || (result.installed?.length ?? 0) > 0) {
        const statusList = await fetchRecipeStatus(recipeId);
        const updated = statusList[0];
        if (updated) {
          recipesData.retry();
        }
      }
      if (!result.ok && result.errors?.length) {
        setInstallError(
          result.errors.map((e) => `${e.skill}: ${e.error}`).join("; ")
        );
      }
    } catch (e) {
      setInstallError(String(e));
    } finally {
      setInstallingRecipeId(null);
    }
  };

  const handleScaffoldTeam = async (teamId: string, overwrite: boolean) => {
    if (!scaffoldModalRecipe) return;
    await scaffoldRecipeTeam(scaffoldModalRecipe.id, teamId, overwrite);
    setScaffoldModalRecipe(null);
    navigate(`/board?team=${encodeURIComponent(teamId)}`);
  };

  const handleScaffoldAgent = async (
    agentId: string,
    options?: { name?: string; overwrite?: boolean }
  ) => {
    if (!scaffoldAgentModalRecipe) return;
    await scaffoldRecipeAgent(scaffoldAgentModalRecipe.id, agentId, options);
    setScaffoldAgentModalRecipe(null);
  };

  const openScaffoldTeam = (recipe: Recipe) => {
    setScaffoldModalRecipe(recipe);
  };

  const openScaffoldAgent = (recipe: Recipe) => {
    setScaffoldAgentModalRecipe(recipe);
  };

  const closeDetail = () => {
    setSelectedRecipe(null);
    setInstallError(null);
  };

  const recipes = recipesData.data?.recipes ?? [];
  const recipeStatusMap = recipesData.data?.statusMap ?? {};
  const teamRecipes = recipes.filter((r) => r.kind === "team" || !r.kind);
  const agentRecipes = recipes.filter((r) => r.kind === "agent");
  const otherRecipes = recipes.filter(
    (r) => r.kind !== "team" && r.kind !== "agent" && r.kind
  );

  return (
    <HealthGuard
      health={health}
      openclawMessage="Connect OpenClaw to browse recipes"
      openclawDetail="Recipes require OpenClaw to be configured (agents.defaults.workspace)."
    >
      <PageLoadingState
        loading={recipesData.loading}
        error={recipesData.error}
        onRetry={recipesData.retry}
        loadingMessage="Loading recipes..."
      >
    <Container fluid="lg" className="py-4">
      <h2 className="h5 mb-3">Recipes</h2>
      {recipes.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <svg
              className="empty-state-icon mb-3 mx-auto d-block"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M9 2h6v2H9V2zm4 14h2v2h-2v-2zm-4 0h2v2H9v-2zm0-4h2v2H9v-2zm4 0h2v2h-2v-2zM5 4v16h14V4H5zm2 2h10v12H7V6z" />
            </svg>
            <h5 className="card-title mb-2">No recipes found</h5>
            <p className="text-muted mb-0 small">
              Connect OpenClaw and scaffold a team to browse recipes.
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {teamRecipes.length > 0 && (
            <div className="col-12">
              <h3 className="h6 text-muted mb-2">Team recipes</h3>
              <div className="row g-2">
                {teamRecipes.map((r) => (
                  <div key={r.id} className="col-12 col-md-6 col-lg-4">
                    <RecipeCard
                      recipe={r}
                      status={recipeStatusMap[r.id]}
                      onSelect={() => setSelectedRecipe(r)}
                      onScaffoldTeam={() => openScaffoldTeam(r)}
                      onInstallSkills={() => handleInstallSkills(r.id)}
                      installing={installingRecipeId === r.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {agentRecipes.length > 0 && (
            <div className="col-12">
              <h3 className="h6 text-muted mb-2 mt-3">Agent recipes</h3>
              <div className="row g-2">
                {agentRecipes.map((r) => (
                  <div key={r.id} className="col-12 col-md-6 col-lg-4">
                    <RecipeCard
                      recipe={r}
                      status={recipeStatusMap[r.id]}
                      onSelect={() => setSelectedRecipe(r)}
                      onScaffoldAgent={() => openScaffoldAgent(r)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {otherRecipes.length > 0 && (
            <div className="col-12">
              <h3 className="h6 text-muted mb-2 mt-3">Other recipes</h3>
              <div className="row g-2">
                {otherRecipes.map((r) => (
                  <div key={r.id} className="col-12 col-md-6 col-lg-4">
                    <RecipeCard
                      recipe={r}
                      status={recipeStatusMap[r.id]}
                      onSelect={() => setSelectedRecipe(r)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          md={recipeDetail.data?.md ?? null}
          loading={recipeDetail.loading}
          error={recipeDetail.error}
          onRetry={recipeDetail.retry}
          status={recipeStatusMap[selectedRecipe.id]}
          installError={installError}
          installing={installingRecipeId === selectedRecipe.id}
          onInstallSkills={handleInstallSkills}
          onScaffoldTeam={() => openScaffoldTeam(selectedRecipe)}
          onScaffoldAgent={() => openScaffoldAgent(selectedRecipe)}
          onClose={closeDetail}
        />
      )}

      {scaffoldModalRecipe && (
        <ScaffoldTeamModal
          recipe={scaffoldModalRecipe}
          onScaffold={handleScaffoldTeam}
          onClose={() => setScaffoldModalRecipe(null)}
        />
      )}

      {scaffoldAgentModalRecipe && (
        <ScaffoldAgentModal
          recipe={scaffoldAgentModalRecipe}
          onScaffold={handleScaffoldAgent}
          onClose={() => setScaffoldAgentModalRecipe(null)}
        />
      )}
    </Container>
    </PageLoadingState>
    </HealthGuard>
  );
}
