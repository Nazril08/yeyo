import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ToolsOverview } from './tools-overview';
import { ToolsRouter } from './tools-router';

interface ToolsLayoutProps {
  className?: string;
}

export function ToolsLayout({ className }: ToolsLayoutProps) {
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [toolsSubPage, setToolsSubPage] = useState<'overview' | 'download' | 'ai'>('overview');

  const handleToolSelect = (toolId: string) => {
    setCurrentTool(toolId);
  };

  const handleBack = () => {
    setCurrentTool(null);
  };

  if (currentTool) {
    return (
      <div className={className}>
        <ToolsRouter currentTool={currentTool} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Sub Navigation */}
      <div className="flex items-center space-x-4 lg:space-x-6 border-b pb-4">
        <button
          onClick={() => setToolsSubPage("overview")}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            toolsSubPage === "overview" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setToolsSubPage("download")}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            toolsSubPage === "download" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Download
        </button>
        <button
          onClick={() => setToolsSubPage("ai")}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            toolsSubPage === "ai" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          AI
        </button>
      </div>
      
      {/* Tools Content */}
      {toolsSubPage === "overview" && (
        <ToolsOverview onToolSelect={handleToolSelect} category="overview" />
      )}
      
      {toolsSubPage === "download" && (
        <ToolsOverview onToolSelect={handleToolSelect} category="download" />
      )}
      
      {toolsSubPage === "ai" && (
        <ToolsOverview onToolSelect={handleToolSelect} category="ai" />
      )}
    </div>
  );
}
