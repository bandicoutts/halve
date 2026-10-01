"use client";
import { RouteError } from "@/components/RouteError";

export default function PracticeError(props: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  return (
    <RouteError
      {...props}
      tag="practice"
      body={
        <>
          Practice didn’t load. Try again, or return home.
        </>
      }
    />
  );
}
