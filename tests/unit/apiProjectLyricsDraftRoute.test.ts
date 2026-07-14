import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildValidSpec } from "./fixtures/songDesignSpec.fixture";

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

const { POST } = await import("@/app/api/projects/[projectId]/lyrics/draft/route");

function makeParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

describe("/api/projects/[projectId]/lyrics/draft route", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGet.mockReset();
  });

  it("returns 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(new Request("http://test/draft", { method: "POST" }), makeParams("p1"));
    expect(response.status).toBe(401);
  });

  it("returns 403 when the project belongs to a different user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGet.mockResolvedValue({
      id: "p1",
      ownerId: "user-2",
      currentVersion: 1,
      spec: buildValidSpec(),
      createdAt: "",
      updatedAt: "",
    });

    const response = await POST(new Request("http://test/draft", { method: "POST" }), makeParams("p1"));
    expect(response.status).toBe(403);
  });

  it("returns 404 when the project does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGet.mockResolvedValue(undefined);

    const response = await POST(new Request("http://test/draft", { method: "POST" }), makeParams("p1"));
    expect(response.status).toBe(404);
  });

  it("returns 3 valid drafts for the owner's project", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGet.mockResolvedValue({
      id: "p1",
      ownerId: "user-1",
      currentVersion: 1,
      spec: buildValidSpec(),
      createdAt: "",
      updatedAt: "",
    });

    const response = await POST(new Request("http://test/draft", { method: "POST" }), makeParams("p1"));
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.drafts).toHaveLength(3);
    expect(json.drafts.map((d: { label: string }) => d.label)).toEqual(["A", "B", "C"]);
  });
});
