"use client";

import {
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import React from "react";
import Link from "next/link";

interface NavbarProps {
  onCloseTodoSidebar?: () => void;
}

export function Navbar({ onCloseTodoSidebar }: NavbarProps = {}): React.JSX.Element {
  return (
    <div 
      className="border-b border-gray-100 bg-white" 
      onClick={() => {
        if (onCloseTodoSidebar) {
          onCloseTodoSidebar();
        }
      }}
    >
      <div className="flex h-16 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <div className="font-bold text-gray-800 text-lg">TODO Calendar</div>
          </Link>
        </div>
      </div>
    </div >
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
