import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loader({ size = "md", className }: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-primary border-t-transparent",
          sizeClasses[size],
          className
        )}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center">
      <Loader size="lg" />
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  );
}
