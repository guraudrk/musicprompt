import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { projectRepository } from "@/lib/repositories";
import { ProjectEditor } from "./ProjectEditor";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await projectRepository.get(id);
  if (!project || project.ownerId !== session.user.id) notFound();

  return <ProjectEditor project={project} />;
}
