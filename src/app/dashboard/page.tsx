import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { projectRepository } from "@/lib/repositories";
import { NewProjectButton } from "./NewProjectButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await projectRepository.list(session.user.id);

  return (
    <main style={{ maxWidth: "40rem", margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Your projects</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit">Log out</button>
        </form>
      </div>

      <NewProjectButton />

      {projects.length === 0 ? (
        <p>No projects yet. Create one to start designing a song.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/projects/${project.id}`}>
                {project.spec.identity.workingTitle ?? "Untitled"} (v{project.currentVersion})
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
