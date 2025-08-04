import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

export function RemoveBackgroundAdvanced() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('bria');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, WebP)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      setResultUrl('');

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('method', selectedMethod);

      const response = await fetch('https://api.nzr.web.id/api/image/remove-background-advanced', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create blob URL for the result
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

    } catch (error) {
      console.error('Error removing background:', error);
      setError('Failed to remove background. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `background-removed-${selectedFile?.name || 'image.png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResultUrl('');
    setSelectedMethod('bria'); // Reset to default method
    setError('');
    
    // Clean up URLs to prevent memory leaks
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Remove Background Advanced
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="image-upload">Select Image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Supported formats: JPEG, PNG, WebP (max 10MB)
            </p>
          </div>

          <div>
            <Label htmlFor="method-select">Background Removal Method</Label>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select removal method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bria">BRIA - High-quality general purpose (recommended)</SelectItem>
                <SelectItem value="inspyrenet">InspyreNet - Good for detailed objects</SelectItem>
                <SelectItem value="u2net">U²-Net - Fast and reliable</SelectItem>
                <SelectItem value="tracer">Tracer - Good for portraits</SelectItem>
                <SelectItem value="basnet">BASNet - Boundary-aware</SelectItem>
                <SelectItem value="deeplab">DeepLab - Semantic segmentation</SelectItem>
                <SelectItem value="u2net_human_seg">U²-Net Human Seg - Optimized for humans</SelectItem>
                <SelectItem value="ormbg">ORMBG - Object removal</SelectItem>
                <SelectItem value="isnet-general-use">ISNet General - General purpose</SelectItem>
                <SelectItem value="isnet-anime">ISNet Anime - Optimized for anime/cartoon</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Choose the best method for your image type
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleRemoveBackground}
              disabled={!selectedFile || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Remove Background
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {previewUrl && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Original Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src={previewUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                File: {selectedFile?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Size: {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB
              </p>
              <p className="text-sm text-muted-foreground">
                Method: {selectedMethod.toUpperCase()}
              </p>
            </CardContent>
          </Card>

          {/* Result Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Background Removed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                {resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Background removed"
                    className="w-full h-full object-contain"
                    style={{
                      backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    {isLoading ? (
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Removing background...</p>
                      </div>
                    ) : (
                      <p>Result will appear here</p>
                    )}
                  </div>
                )}
              </div>
              
              {resultUrl && (
                <Button 
                  onClick={handleDownload}
                  className="w-full mt-4"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Result
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
