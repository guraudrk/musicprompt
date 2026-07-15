import { describe, expect, it, vi } from "vitest";

const mockCreateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { promptPackage: { createMany: (...args: unknown[]) => mockCreateMany(...args) } },
}));

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));

const { POST } = await import("@/app/api/demo/compile/route");

function makeRequest(body: unknown) {
  return new Request("http://test/api/demo/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/demo/compile route (anonymous, Mock-only)", () => {
  it("returns 400 for an empty idea", async () => {
    const response = await POST(makeRequest({ idea: "" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for an idea over 2000 characters", async () => {
    const response = await POST(makeRequest({ idea: "a".repeat(2001) }));
    expect(response.status).toBe(400);
  });

  it("returns a compiled package for a valid idea, with no auth check and no persistence", async () => {
    const response = await POST(
      makeRequest({ idea: "A bittersweet farewell at a train station, warm indie-pop, mid-tempo." }),
    );
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.package.fields.style).toBeTruthy();

    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it("leaves lyrics unset since the idea is a description, not written lyric text", async () => {
    const response = await POST(
      makeRequest({ idea: "A bittersweet farewell at a train station, warm indie-pop, mid-tempo." }),
    );
    const json = await response.json();
    expect(json.package.fields.lyrics).toBeUndefined();
  });

  it("extracts genre/tempo/vocal hints from the free-text idea into the Style field", async () => {
    const response = await POST(
      makeRequest({
        idea: "기차역에서의 씁쓸한 이별 노래, kpop 락발라드 형식, 미드 템포, 남자 가수",
      }),
    );
    expect(response.status).toBe(200);

    const json = await response.json();
    const style: string = json.package.fields.style;
    expect(style).toContain("K-pop");
    expect(style).toContain("Rock");
    expect(style).toContain("Ballad");
    expect(style).toContain("mid-tempo");
    expect(style).not.toContain("unspecified genre");
    expect(style).not.toContain("at unspecified");
  });

  it("falls back to 'unspecified' when the idea has no recognizable genre/tempo keywords", async () => {
    const response = await POST(makeRequest({ idea: "something I feel deeply about, please help" }));
    const json = await response.json();
    expect(json.package.fields.style).toContain("unspecified genre");
  });
});
