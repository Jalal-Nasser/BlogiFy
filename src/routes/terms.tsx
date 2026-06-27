import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPageBySlug } from "@/lib/queries";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — BlogiFy" }] }),
  component: Terms,
});

function Terms() {
  const { data: page } = useQuery({ queryKey: ["page", "terms"], queryFn: () => fetchPageBySlug("terms") });
  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-6 pt-10">
      <h1 className="font-display text-4xl font-bold tracking-tight">{page?.title ?? "Terms"}</h1>
      <div className="prose-article mt-8" dangerouslySetInnerHTML={{ __html: page?.content ?? "" }} />
    </div>
  );
}
