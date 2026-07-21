import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl font-bold bg-gradient-to-r from-sky-400 to-violet-500 bg-clip-text text-transparent">
        404
      </p>
      <h1 className="mt-4 text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This data structure doesn&apos;t exist in our syllabus.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background"
      >
        Back Home
      </Link>
    </div>
  );
}
