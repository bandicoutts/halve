"use client";
import { RouteError } from "@/components/RouteError";

export default function PracticePlayError(props: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  return (
    <RouteError
      {...props}
      tag="practice/play"
      body={
        <>
          Couldn&rsquo;t load the practice puzzle. You can try again or pick a
          different difficulty.
        </>
      }
      backHref="/practice"
      backLabel="Back to practice"
    />
  );
}
