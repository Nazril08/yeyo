import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useGeminiApi } from '@/components/settings-dialog';
import { Sparkles, Wand2 } from 'lucide-react';

// API returns image directly, not JSON

export default function AnimagineXL() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState('1024');
  const [height, setHeight] = useState('1024');
  const [guidanceScale, setGuidanceScale] = useState('7.5');
  const [numInferenceSteps, setNumInferenceSteps] = useState('28');
  const [sampler, setSampler] = useState('Euler a');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [stylePreset, setStylePreset] = useState('(None)');
  const [useUpscaler, setUseUpscaler] = useState(false);
  const [strength, setStrength] = useState('0.55');
  const [upscaleBy, setUpscaleBy] = useState('1.5');
  const [addQualityTags, setAddQualityTags] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingNegative, setIsGeneratingNegative] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { isConfigured, generatePromptEnhancement, generateNegativePrompt } = useGeminiApi();

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive",
      });
      return;
    }

    if (!isConfigured) {
      toast({
        title: "API Not Configured",
        description: "Please configure your Gemini API key in Settings",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const enhancedPrompt = await generatePromptEnhancement(prompt);
      setPrompt(enhancedPrompt);
      toast({
        title: "Success",
        description: "Prompt enhanced successfully!",
      });
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast({
        title: "Error",
        description: "Failed to enhance prompt. Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateNegativePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a main prompt first",
        variant: "destructive",
      });
      return;
    }

    if (!isConfigured) {
      toast({
        title: "API Not Configured",
        description: "Please configure your Gemini API key in Settings",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingNegative(true);
    try {
      const newNegativePrompt = await generateNegativePrompt(prompt);
      setNegativePrompt(newNegativePrompt);
      toast({
        title: "Success",
        description: "Negative prompt generated successfully!",
      });
    } catch (error) {
      console.error('Error generating negative prompt:', error);
      toast({
        title: "Error",
        description: "Failed to generate negative prompt. Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingNegative(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const params = new URLSearchParams({
        prompt: prompt.trim(),
        ...(negativePrompt.trim() && { negative_prompt: negativePrompt.trim() }),
        width: width,
        height: height,
        guidance_scale: guidanceScale,
        numInference_steps: numInferenceSteps,
        sampler: sampler,
        aspect_ratio: aspectRatio,
        style_preset: stylePreset,
        use_upscaler: useUpscaler.toString(),
        strength: strength,
        upscale_by: upscaleBy,
        add_quality_tags: addQualityTags.toString(),
      });

      const response = await fetch(`https://api.nzr.web.id/api/ai-image/animagine?${params}`, {
        method: 'GET',
        headers: {
          'accept': 'image/png',
          'User-Agent': 'Yeyo-Desktop-App'
        }
      });

      if (response.ok) {
        // API returns image directly as blob
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setGeneratedImage(imageUrl);
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      // generatedImage is already a blob URL, we can download it directly
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `animagine-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Image downloaded successfully!",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="white"
                className="w-4 h-4"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
            Animagine XL - AI Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">Prompt *</Label>
              <Button
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim() || !isConfigured}
                variant="outline"
                size="sm"
                className="h-7"
              >
                {isEnhancing ? (
                  <>Enhancing...</>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Enhance
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="prompt"
              placeholder="mountain"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px]"
            />
            {!isConfigured && (
              <p className="text-xs text-muted-foreground">
                💡 Configure Gemini API in Settings to use AI enhancement features
              </p>
            )}
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="negative-prompt">Negative Prompt</Label>
              <Button
                onClick={handleGenerateNegativePrompt}
                disabled={isGeneratingNegative || !prompt.trim() || !isConfigured}
                variant="outline"
                size="sm"
                className="h-7"
              >
                {isGeneratingNegative ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3 mr-1" />
                    AI Generate
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="negative-prompt"
              placeholder="negative_prompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                placeholder="1024"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                placeholder="1024"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guidance-scale">Guidance Scale</Label>
              <Input
                id="guidance-scale"
                type="number"
                step="0.1"
                placeholder="7.5"
                value={guidanceScale}
                onChange={(e) => setGuidanceScale(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inference-steps">Inference Steps</Label>
              <Input
                id="inference-steps"
                type="number"
                placeholder="28"
                value={numInferenceSteps}
                onChange={(e) => setNumInferenceSteps(e.target.value)}
              />
            </div>
          </div>

          {/* Sampler and Aspect Ratio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sampler">Sampler</Label>
              <Select value={sampler} onValueChange={setSampler}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sampler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DPM++ 2M Karras">DPM++ 2M Karras</SelectItem>
                  <SelectItem value="DPM++ SDE Karras">DPM++ SDE Karras</SelectItem>
                  <SelectItem value="DPM++ 2M SDE Karras">DPM++ 2M SDE Karras</SelectItem>
                  <SelectItem value="Euler">Euler</SelectItem>
                  <SelectItem value="Euler a">Euler a</SelectItem>
                  <SelectItem value="DDIM">DDIM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="9:7">9:7</SelectItem>
                  <SelectItem value="7:9">7:9</SelectItem>
                  <SelectItem value="19:13">19:13</SelectItem>
                  <SelectItem value="13:19">13:19</SelectItem>
                  <SelectItem value="7:4">7:4</SelectItem>
                  <SelectItem value="4:7">4:7</SelectItem>
                  <SelectItem value="12:5">12:5</SelectItem>
                  <SelectItem value="5:12">5:12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Style Preset */}
          <div className="space-y-2">
            <Label htmlFor="style-preset">Style Preset</Label>
            <Select value={stylePreset} onValueChange={setStylePreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select style preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="(None)">(None)</SelectItem>
                <SelectItem value="Anim4gine">Anim4gine</SelectItem>
                <SelectItem value="Painting">Painting</SelectItem>
                <SelectItem value="Pixel art">Pixel art</SelectItem>
                <SelectItem value="1980s">1980s</SelectItem>
                <SelectItem value="1990s">1990s</SelectItem>
                <SelectItem value="2000s">2000s</SelectItem>
                <SelectItem value="Toon">Toon</SelectItem>
                <SelectItem value="Lineart">Lineart</SelectItem>
                <SelectItem value="Art Nouveau">Art Nouveau</SelectItem>
                <SelectItem value="Western Comics">Western Comics</SelectItem>
                <SelectItem value="3D">3D</SelectItem>
                <SelectItem value="Realistic">Realistic</SelectItem>
                <SelectItem value="Neonpunk">Neonpunk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upscaler Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-upscaler"
                checked={useUpscaler}
                onCheckedChange={(checked) => setUseUpscaler(checked === true)}
              />
              <Label htmlFor="use-upscaler">Use Upscaler</Label>
            </div>

            {useUpscaler && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strength">Strength</Label>
                  <Input
                    id="strength"
                    type="number"
                    step="0.01"
                    placeholder="0.55"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upscale-by">Upscale By</Label>
                  <Input
                    id="upscale-by"
                    type="number"
                    step="0.1"
                    placeholder="1.5"
                    value={upscaleBy}
                    onChange={(e) => setUpscaleBy(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quality Tags */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-quality-tags"
              checked={addQualityTags}
              onCheckedChange={(checked) => setAddQualityTags(checked === true)}
            />
            <Label htmlFor="add-quality-tags">Add Quality Tags</Label>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </Button>

          {/* Generated Image */}
          {generatedImage && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-auto rounded-lg border"
                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                  />
                </div>
                <Button onClick={handleDownload} className="w-full">
                  Download Image
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
