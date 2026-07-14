import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildValidSpec } from "./fixtures/songDesignSpec.fixture";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));

const mockGet = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@/lib/repositories", () => ({
  projectRepository: {
    get: (...args: unknown[]) => mockGet(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

const { GET, PATCH } = await import("@/app/api/projects/[projectId]/route");

function makeParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

describe("/api/projects/[projectId] route", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGet.mockReset();
    mockUpdate.mockReset();
  });

  it("returns 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(new Request("http://test/api/projects/p1"), makeParams("p1"));
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

    const response = await GET(new Request("http://test/api/projects/p1"), makeParams("p1"));
    expect(response.status).toBe(403);
  });

  it("returns 404 when the project does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGet.mockResolvedValue(undefined);

    const response = await GET(new Request("http://test/api/projects/p1"), makeParams("p1"));
    expect(response.status).toBe(404);
  });

  it("bumps the version server-side on PATCH regardless of client-supplied version", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const existingSpec = buildValidSpec({ projectId: "p1", version: 3 });
    mockGet.mockResolvedValue({
      id: "p1",
      ownerId: "user-1",
      currentVersion: 3,
      spec: existingSpec,
      createdAt: "",
      updatedAt: "",
    });
    mockUpdate.mockImplementation(async (id: string, spec: typeof existingSpec) => ({
      id,
      ownerId: "user-1",
      currentVersion: spec.version,
      spec,
      createdAt: "",
      updatedAt: "",
    }));

    const clientSuppliedBody = { ...existingSpec, version: 999 };
    const request = new Request("http://test/api/projects/p1", {
      method: "PATCH",
      body: JSON.stringify(clientSuppliedBody),
    });

    const response = await PATCH(request, makeParams("p1"));
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.project.spec.version).toBe(4);
  });
});
