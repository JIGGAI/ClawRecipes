import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchMarketplaceRecipeMarkdown } from "../src/marketplaceFetch";

describe("marketplaceFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("throws when slug is empty", async () => {
    await expect(
      fetchMarketplaceRecipeMarkdown({ registryBase: "https://registry.example.com", slug: "" })
    ).rejects.toThrow("slug is required");
    await expect(
      fetchMarketplaceRecipeMarkdown({ registryBase: "https://registry.example.com", slug: "   " })
    ).rejects.toThrow("slug is required");
  });

  test("throws on 404 from registry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 404 })
    );
    await expect(
      fetchMarketplaceRecipeMarkdown({ registryBase: "https://r.example.com", slug: "missing" })
    ).rejects.toThrow(/Registry lookup failed \(404\)/);
  });

  test("throws when meta response missing recipe.sourceUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, recipe: {} }),
      })
    );
    await expect(
      fetchMarketplaceRecipeMarkdown({ registryBase: "https://r.example.com", slug: "x" })
    ).rejects.toThrow(/missing recipe\.sourceUrl/);
  });

  test("returns md, metaUrl, sourceUrl on success", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ ok: true, recipe: { sourceUrl: "https://cdn.example.com/recipe.md" } }),
      })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("# Recipe\n\nContent") });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchMarketplaceRecipeMarkdown({
      registryBase: "https://r.example.com",
      slug: "my-recipe",
    });
    expect(result.md).toBe("# Recipe\n\nContent");
    expect(result.metaUrl).toBe("https://r.example.com/api/marketplace/recipes/my-recipe");
    expect(result.sourceUrl).toBe("https://cdn.example.com/recipe.md");
  });
});
