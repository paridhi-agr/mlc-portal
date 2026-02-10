import { Suspense } from "react";
import AccessDeniedClient from "./AccessDeniedClient";

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <AccessDeniedClient />
    </Suspense>
  );
}