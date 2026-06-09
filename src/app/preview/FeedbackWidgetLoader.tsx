"use client";

import dynamic from "next/dynamic";

const FeedbackWidget = dynamic(
  () =>
    import("@/modules/feedback/components/FeedbackWidget").then(
      (m) => m.FeedbackWidget
    ),
  { ssr: false }
);

interface Props {
  projectSlug: string;
  sessionId: string;
  token: string;
  iframeSrc?: string;
}

export function FeedbackWidgetLoader(props: Props) {
  return <FeedbackWidget {...props} />;
}
