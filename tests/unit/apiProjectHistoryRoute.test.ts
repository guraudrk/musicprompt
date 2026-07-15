import { beforeEach, describe, expect, it, vi } from "vitest";

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

const mockFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { promptPackage: { findMany: (...args: unknown[]) => mockFindMany(...args) } },
}));

const { GET } = await import("@/app/api/projects/[projectId]/history/route");

function makeParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

describe("/api/projects/[projectId]/history route", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGet.mockReset();
    mockFindMany.mockReset();
  });

  it("returns 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(new Request("http://test/history"), makeParams("p1"));
    expect(response.status).toBe(401);
  });

  it("returns 403 when the project belongs to a different user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGet.mockResolvedValue({ id: "p1", ownerId: "user-2" });

    const response = await GET(new Request("http://test/history"), makeParams("p1"));
    expect(response.status).toBe(403);
  });

  it("returns 404 when the project does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGet.mockResolvedValue(undefined);

    const response = await GET(new Request("http://test/history"), makeParams("p1"));
    expect(response.status).toBe(404);
  });

  it("returns the owner's past compiles, newest first, with style/lyrics extracted", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGet.mockResolvedValue({ id: "p1", ownerId: "user-1" });
    mockFindMany.mockResolvedValue([
      {
        id: "pkg-2",
        strategy: "balanced",
        providerId: "generic",
        model: "mock",
        apiMode: "mock",
        fields: { style: "warm indie-pop", lyrics: "la la la" },
        createdAt: new Date("2026-07-15T10:00:00Z"),
      },
      {
        id: "pkg-1",
        strategy: "safe",
        providerId: "generic",
        model: "gemini-3.5-flash",
        apiMode: "interactions",
        fields: { style: "gentle ballad" },
        createdAt: new Date("2026-07-14T10:00:00Z"),
      },
    ]);

    const response = await GET(new Request("http://test/history"), makeParams("p1"));
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.history).toHaveLength(2);
    expect(json.history[0]).toMatchObject({ id: "pkg-2", strategy: "balanced", style: "warm indie-pop", lyrics: "la la la" });
    expect(json.history[1]).toMatchObject({ id: "pkg-1", strategy: "safe", style: "gentle ballad", lyrics: null });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId: "p1" }, orderBy: { createdAt: "desc" } }),
    );
  });
});
