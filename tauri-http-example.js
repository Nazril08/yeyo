// Alternatif menggunakan Tauri HTTP client
import { fetch as tauriFetch } from '@tauri-apps/api/http';

// Di dalam komponen, ganti fetch biasa dengan:
const handleGenerateWithTauri = async () => {
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
    const params = {
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
    };

    const response = await tauriFetch(`https://api.nzr.web.id/api/ai-image/animagine`, {
      method: 'GET',
      query: params,
      responseType: 2 // Binary response
    });

    if (response.ok) {
      // Convert binary data to blob URL
      const blob = new Blob([new Uint8Array(response.data)], { type: 'image/png' });
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
