"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleClick() {
    setCreating(true);
    const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setCreating(false);

    if (!response.ok) return;
    const { project } = await response.json();
    router.push(`/projects/${project.id}`);
  }

  return (
    <button onClick={handleClick} disabled={creating}>
      {creating ? "Creating..." : "New project"}
    </button>
  );
}
