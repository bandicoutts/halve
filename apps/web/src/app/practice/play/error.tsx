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
          We couldn&rsquo;t load this puzzle. Try again, or choose another difficulty.
        </>
      }
      backHref="/practice"
      backLabel="Back to practice"
    />
  );
}
