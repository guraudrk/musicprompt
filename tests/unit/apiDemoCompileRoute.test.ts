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
    expect(json.package.fields.lyrics).toBeTruthy();

    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
  });
});
