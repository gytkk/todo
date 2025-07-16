"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@calendar-todo/ui";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  onCloseTodoSidebar?: () => void;
  showBackButton?: boolean;
  backUrl?: string;
}

export function PageHeader({ 
  title, 
  onCloseTodoSidebar, 
  showBackButton = false, 
  backUrl = "/" 
}: PageHeaderProps) {

  return (
    <div 
      className="border-b border-gray-100 bg-white shadow-sm" 
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex items-center space-x-2"
            >
              <Link href={backUrl}>
                <ArrowLeft className="h-4 w-4" />
                <span>뒤로</span>
              </Link>
            </Button>
          )}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              if (onCloseTodoSidebar) {
                onCloseTodoSidebar();
              }
            }}
          >
            <div className="font-bold text-gray-800 text-lg">TODO Calendar</div>
            {title && (
              <>
                <span className="text-gray-400">|</span>
                <h1 className="font-semibold text-gray-700">{title}</h1>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}