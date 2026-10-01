"use client";
import { RouteError } from "@/components/RouteError";

export default function TutorialError(props: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  return (
    <RouteError
      {...props}
      tag="tutorial"
      body={
        <>
          The tutorial didn’t load. Try again, or return home.
        </>
      }
    />
  );
}
