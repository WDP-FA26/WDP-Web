"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import { MenuTrigger, Popover, Menu, MenuItem } from "react-aria-components";
import { cn } from "cn";
import { Button } from "./button";

export function ModeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  return (
    <MenuTrigger>
      <Button
        variant="outline"
        size="icon"
        aria-label="Toggle theme"
        className={cn("relative", className)}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      <Popover
        placement="bottom end"
        className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95"
      >
        <Menu
          onAction={(key) => setTheme(String(key))}
          className="outline-none"
        >
          <MenuItem
            id="light"
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[focused]:bg-accent data-[focused]:text-accent-foreground"
          >
            Light
          </MenuItem>
          <MenuItem
            id="dark"
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[focused]:bg-accent data-[focused]:text-accent-foreground"
          >
            Dark
          </MenuItem>
          <MenuItem
            id="system"
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[focused]:bg-accent data-[focused]:text-accent-foreground"
          >
            System
          </MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      className={cn("relative", className)}
      onPress={() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
