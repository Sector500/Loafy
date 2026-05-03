import { Link } from "wouter";
import { Cat, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-primary/10 p-6 rounded-full mb-6 text-primary">
        <Cat className="h-16 w-16" />
      </div>
      <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
        404
      </h1>
      <h2 className="text-2xl font-serif text-muted-foreground mb-6">
        Oops! This page ran away.
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        We couldn't find the page you're looking for. It might have been moved, deleted, or perhaps it's just hiding under the sofa.
      </p>
      <Link href="/">
        <Button size="lg" className="rounded-full">
          <Home className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
