import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center sm:px-10">
        <p
          className="text-6xl font-bold tracking-tight text-pti-green/30 sm:text-7xl"
          aria-hidden
        >
          404
        </p>
        <h1 className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
          That page doesn&apos;t exist or may have been moved. Head back to
          browse campus events or open your dashboard.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button asChild className="h-10">
            <Link href="/">Browse events</Link>
          </Button>
          <Button asChild variant="outline" className="h-10">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
