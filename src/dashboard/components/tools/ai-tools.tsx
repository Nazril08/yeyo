import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AIToolsProps {
  onToolSelect: (toolId: string) => void;
}

export function AITools({ onToolSelect }: AIToolsProps) {
  const aiTools = [
    {
      id: "chatgpt",
      title: "ChatGPT",
      description: "AI-powered conversational assistant",
      icon: (
        <div className="w-4 h-4 bg-green-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.078 6.078 0 0 0 6.529 2.9 5.952 5.952 0 0 0 4.258 1.786c1.497 0 2.896-.558 4.003-1.569a5.985 5.985 0 0 0 4.238-2.383 6.09 6.09 0 0 0-.743-7.112zM7.76 18.758a1.944 1.944 0 0 1-1.66-.948 2.025 2.025 0 0 1-.2-1.543l.743-2.29-2.29.743a2.025 2.025 0 0 1-1.543-.2 1.944 1.944 0 0 1-.948-1.66c0-.683.349-1.31.921-1.681L4.981 10.4 2.783 9.178a1.994 1.994 0 0 1-.921-1.681c0-.683.349-1.31.921-1.681a2.025 2.025 0 0 1 1.543-.2l2.29.743-.743-2.29a2.025 2.025 0 0 1 .2-1.543A1.944 1.944 0 0 1 7.76 1.578c.683 0 1.31.349 1.681.921L10.663 4.7l1.223-2.198a1.994 1.994 0 0 1 1.681-.921c.683 0 1.31.349 1.681.921a2.025 2.025 0 0 1 .2 1.543l-.743 2.29 2.29-.743a2.025 2.025 0 0 1 1.543.2c.572.371.921.998.921 1.681a1.994 1.994 0 0 1-.921 1.681L16.04 10.4l2.198 1.223c.572.371.921.998.921 1.681a1.994 1.994 0 0 1-.921 1.681 2.025 2.025 0 0 1-1.543.2l-2.29-.743.743 2.29a2.025 2.025 0 0 1-.2 1.543 1.944 1.944 0 0 1-1.66.948c-.683 0-1.31-.349-1.681-.921L10.663 16.1l-1.223 2.198c-.371.572-.998.921-1.681.921z"/>
          </svg>
        </div>
      )
    },
    {
      id: "text-generator",
      title: "Text Generator",
      description: "Generate content with AI assistance",
      icon: (
        <div className="w-4 h-4 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </div>
      )
    },
    {
      id: "image-generator",
      title: "Image Generator",
      description: "Create stunning images using AI technology",
      icon: (
        <div className="w-4 h-4 bg-purple-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
      )
    },
    {
      id: "code-assistant",
      title: "Code Assistant",
      description: "Get coding help and generate code snippets",
      icon: (
        <div className="w-4 h-4 bg-gray-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        </div>
      )
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {aiTools.map((tool) => (
        <Card 
          key={tool.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onToolSelect(tool.id)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tool.title}
            </CardTitle>
            {tool.icon}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{tool.title}</div>
            <p className="text-xs text-muted-foreground">
              {tool.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
