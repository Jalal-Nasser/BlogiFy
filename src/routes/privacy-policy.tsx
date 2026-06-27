import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPageBySlug } from "@/lib/queries";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({ meta: [{ title: "Privacy Policy — BlogiFy" }] }),
  component: Privacy,
});

function Privacy() {
  const { data: page } = useQuery({ queryKey: ["page", "privacy-policy"], queryFn: () => fetchPageBySlug("privacy-policy") });
  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-6 pt-10">
      <h1 className="font-display text-4xl font-bold tracking-tight">{page?.title ?? "Privacy Policy"}</h1>
      <div className="prose-article mt-8" dangerouslySetInnerHTML={{ __html: page?.content ?? "" }} />
    </div>
  );
}
