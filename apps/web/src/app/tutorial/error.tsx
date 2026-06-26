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
          An unexpected error interrupted the tutorial. You can try again, or
          head back home.
        </>
      }
    />
  );
}
