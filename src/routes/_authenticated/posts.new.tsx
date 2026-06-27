import { createFileRoute } from "@tanstack/react-router";
import PostEditor from "@/components/admin/PostEditor";

export const Route = createFileRoute("/_authenticated/posts/new")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "New Post" }] }),
  component: () => <PostEditor />,
});
