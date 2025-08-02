import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Key, Sparkles } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const { toast } = useToast();

  // Load saved API key on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setGeminiApiKey(savedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!geminiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('gemini_api_key', geminiApiKey);
    toast({
      title: "Success",
      description: "Gemini API key saved successfully!",
    });
  };

  const handleTestApi = async () => {
    if (!geminiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingApi(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello, this is a test message. Please respond with 'API test successful'"
            }]
          }]
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Gemini API connection successful!",
        });
      } else {
        throw new Error('API test failed');
      }
    } catch (error) {
      console.error('API test error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to Gemini API. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleClearApiKey = () => {
    setGeminiApiKey('');
    localStorage.removeItem('gemini_api_key');
    toast({
      title: "Success",
      description: "API key cleared successfully!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="api" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api">API Settings</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Gemini AI Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gemini-api-key">Gemini API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gemini-api-key"
                      type="password"
                      placeholder="Enter your Gemini API key"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleTestApi}
                      disabled={isTestingApi || !geminiApiKey.trim()}
                      variant="outline"
                      size="sm"
                    >
                      {isTestingApi ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get your API key from{' '}
                    <a 
                      href="https://makersuite.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSaveApiKey} className="flex-1">
                    <Key className="w-4 h-4 mr-2" />
                    Save API Key
                  </Button>
                  <Button 
                    onClick={handleClearApiKey} 
                    variant="outline"
                    disabled={!geminiApiKey}
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">AI Auto-Fill Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Enhance and improve your image prompts</li>
                    <li>• Generate creative variations of your ideas</li>
                    <li>• Auto-suggest negative prompts</li>
                    <li>• Powered by Gemini 1.5 Flash</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  General settings will be available in future updates.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Hook untuk menggunakan settings dari komponen lain
export function useGeminiApi() {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const generatePromptEnhancement = async (originalPrompt: string) => {
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please enhance this image generation prompt to be more detailed and artistic while keeping the core concept. Original prompt: "${originalPrompt}". Return only the enhanced prompt without any explanations.`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to enhance prompt');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  };

  const generateNegativePrompt = async (originalPrompt: string) => {
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Based on this image prompt: "${originalPrompt}", generate a negative prompt that would help avoid common unwanted elements in AI image generation. Include things like: low quality, blurry, distorted, extra limbs, bad anatomy, etc. Return only the negative prompt without explanations.`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate negative prompt');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  };

  return {
    apiKey,
    isConfigured: !!apiKey,
    generatePromptEnhancement,
    generateNegativePrompt
  };
}
