import Image, { type ImageProps } from "next/image";
import { LinkButton } from "@repo/ui/components/button";
import { ModeToggle } from "@repo/ui/mode-toggle";

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="dark:hidden" />
      <Image {...rest} src={srcDark} className="hidden dark:block" />
    </>
  );
};

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20 font-sans">
      <header className="row-start-1 w-full max-w-xl flex justify-end">
        <ModeToggle />
      </header>
      <main className="flex flex-col gap-6 row-start-2 items-center sm:items-start text-center sm:text-left max-w-xl">
        <ThemeImage
          srcLight="turborepo-dark.svg"
          srcDark="turborepo-light.svg"
          alt="Turborepo logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-3xl font-bold tracking-tight">
          Landing & Auth App
        </h1>
        <p className="text-muted-foreground text-sm">
          I come from localhost:3000 (Landing / Auth host app)!
        </p>
        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs w-full">
          <p className="text-sm">
            👀 Access everything through proxy on{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold">
              http://localhost:3024
            </code>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start pt-2">
          <LinkButton href="/dashboard" variant="default">
            Go to User Dashboard →
          </LinkButton>
          <LinkButton href="/admin" variant="outline">
            Go to Admin Panel →
          </LinkButton>
          <LinkButton href="/login" variant="secondary">
            Login Page (Auth) →
          </LinkButton>
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-muted-foreground">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?search=turborepo&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://turborepo.dev?utm_source=create-turbo"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to turborepo.dev →
        </a>
      </footer>
    </div>
  );
}
