import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDefaultSpec } from "@/domain/songDesignSpec/defaultSpec";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));

const mockGet = vi.fn();
vi.mock("@/lib/repositories", () => ({
  projectRepository: {
    get: (...args: unknown[]) => mockGet(...args),
    update: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

const { POST } = await import("@/app/api/projects/[projectId]/spec/interpret/route");

function makeParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

describe("/api/projects/[projectId]/spec/interpret route (not persisted)", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGet.mockReset();
  });

  it("returns 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(new Request("http://test/interpret", { method: "POST" }), makeParams("p1"));
    expect(response.status).toBe(401);
  });

  it("returns 403 when the project belongs to a different user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGet.mockResolvedValue({
      id: "p1",
      ownerId: "user-2",
      currentVersion: 1,
      spec: buildDefaultSpec("p1"),
      createdAt: "",
      updatedAt: "",
    });

    const response = await POST(new Request("http://test/interpret", { method: "POST" }), makeParams("p1"));
    expect(response.status).toBe(403);
  });

  it("returns 404 when the project does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGet.mockResolvedValue(undefined);

    const response = await POST(new Request("http://test/interpret", { method: "POST" }), makeParams("p1"));
    expect(response.status).toBe(404);
  });

  it("returns a validated interpretation for the owner's project, without persisting anything", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const spec = buildDefaultSpec("p1");
    spec.northStar.audienceExperience = "기차역에서의 씁쓸한 이별 노래, kpop 락발라드 형식, 미드 템포, 남자 가수";
    mockGet.mockResolvedValue({
      id: "p1",
      ownerId: "user-1",
      currentVersion: 1,
      spec,
      createdAt: "",
      updatedAt: "",
    });

    const response = await POST(new Request("http://test/interpret", { method: "POST" }), makeParams("p1"));
    expect(response.status).toBe(200);

    const { interpretation } = await response.json();
    expect(interpretation.musicalIdentity.genres.map((g: { tag: string }) => g.tag)).toEqual(
      expect.arrayContaining(["K-pop", "Rock", "Ballad"]),
    );
    expect(interpretation.musicalIdentity.tempoDescription).toBe("mid-tempo");
    expect(interpretation.fieldProvenance.length).toBeGreaterThan(0);

    // Not persisted: this route's own dependency graph never touches an update/save call.
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
