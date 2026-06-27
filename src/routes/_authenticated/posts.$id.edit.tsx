import { createFileRoute } from "@tanstack/react-router";
import PostEditor from "@/components/admin/PostEditor";

export const Route = createFileRoute("/_authenticated/posts/$id/edit")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Edit Post" }] }),
  component: EditPostRoute,
});

function EditPostRoute() {
  const { id } = Route.useParams();
  return <PostEditor postId={id} />;
}
