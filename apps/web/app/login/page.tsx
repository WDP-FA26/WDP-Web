import { LinkButton } from "@repo/ui/button";
import { ModeToggle } from "@repo/ui/mode-toggle";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@repo/ui/card";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8 font-sans">
      <div className="fixed top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Auth / Sign In</CardTitle>
          <CardDescription>
            This auth route belongs to the Landing & Auth app (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              apps/web
            </code>
            ).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <LinkButton href="/dashboard" variant="default" className="w-full">
            Sign In to Dashboard →
          </LinkButton>
          <LinkButton href="/" variant="ghost" className="w-full">
            ← Back to Landing
          </LinkButton>
        </CardFooter>
      </Card>
    </div>
  );
}
