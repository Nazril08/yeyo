import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  Folder, 
  Settings, 
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  Eye,
  Layers,
  Wand2
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

interface ProcessingTask {
  id: string;
  inputPath: string;
  outputPath: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

const MODEL_DESCRIPTIONS = {
  'u2net': 'General purpose - Best for most images',
  'u2netp': 'Lightweight - Faster processing, good quality',
  'u2net_human_seg': 'Human segmentation - Optimized for people',
  'u2net_cloth_seg': 'Clothing - Parse clothes from human portraits',
  'silueta': 'Compact - Small size (43MB), good quality',
  'isnet-general-use': 'Modern general - Latest general purpose model',
  'isnet-anime': 'Anime characters - High accuracy for anime',
  'sam': 'Segment Anything - Universal segmentation',
  'birefnet-general': 'BiRefNet - High accuracy general model',
  'birefnet-general-lite': 'BiRefNet Lite - Faster BiRefNet version',
  'birefnet-portrait': 'Portrait - Optimized for human portraits',
  'birefnet-dis': 'Dichotomous - Image segmentation',
  'birefnet-hrsod': 'High-res detection - Salient object detection',
  'birefnet-cod': 'Concealed objects - Hidden object detection',
  'birefnet-massive': 'Massive dataset - Trained on large dataset',
};

export default function BackgroundRemover() {
  const [inputPath, setInputPath] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [inputDir, setInputDir] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [model, setModel] = useState('u2net');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [alphaMatting, setAlphaMatting] = useState(false);
  const [onlyMask, setOnlyMask] = useState(false);
  const [watchMode, setWatchMode] = useState(false);
  const [tasks, setTasks] = useState<ProcessingTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rembgStatus, setRembgStatus] = useState<string | null>(null);

  // Check rembg availability on component mount
  React.useEffect(() => {
    checkRembgAvailability();
    loadAvailableModels();
  }, []);

  const checkRembgAvailability = async () => {
    try {
      const result = await invoke('check_rembg') as string;
      setRembgStatus(result);
      setError('');
    } catch (error) {
      setRembgStatus(null);
      setError(error as string);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const models = await invoke('rembg_list_models') as string[];
      setAvailableModels(models);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleSelectInputFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Images',
            extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff']
          }
        ]
      });

      if (selected && typeof selected === 'string') {
        setInputPath(selected);
        // Auto-generate output path
        const pathParts = selected.split('.');
        const extension = pathParts.pop();
        const basePath = pathParts.join('.');
        setOutputPath(`${basePath}_no_bg.png`);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      setError('Failed to select input file');
    }
  };

  const handleSelectOutputFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'PNG Images',
            extensions: ['png']
          }
        ],
        defaultPath: outputPath
      });

      if (selected && typeof selected === 'string') {
        setOutputPath(selected);
      }
    } catch (error) {
      console.error('Error selecting output file:', error);
      setError('Failed to select output file');
    }
  };

  const handleSelectInputDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        setInputDir(selected);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setError('Failed to select input directory');
    }
  };

  const handleSelectOutputDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        setOutputDir(selected);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setError('Failed to select output directory');
    }
  };

  const handleSingleFileProcess = async () => {
    if (!inputPath.trim()) {
      setError('Please select an input file');
      return;
    }

    if (!outputPath.trim()) {
      setError('Please specify an output path');
      return;
    }

    setIsLoading(true);
    setError('');

    const taskId = Date.now().toString();
    const fileName = inputPath.split('/').pop() || inputPath.split('\\').pop() || 'Unknown';
    
    const newTask: ProcessingTask = {
      id: taskId,
      inputPath,
      outputPath,
      fileName,
      status: 'pending',
      progress: 0,
    };

    setTasks(prev => [newTask, ...prev]);

    // Update task to processing
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'processing' as const, progress: 50 } : task
    ));

    try {
      await invoke('rembg_remove_background', {
        inputPath,
        outputPath,
        model,
        alphaMatting,
        onlyMask,
      });

      // Update task to completed
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: 'completed' as const, 
          progress: 100 
        } : task
      ));

      // Clear form
      setInputPath('');
      setOutputPath('');
      
    } catch (error) {
      console.error('Background removal error:', error);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: 'error' as const, 
          error: error as string 
        } : task
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchProcess = async () => {
    if (!inputDir.trim()) {
      setError('Please select an input directory');
      return;
    }

    if (!outputDir.trim()) {
      setError('Please select an output directory');
      return;
    }

    setIsLoading(true);
    setError('');

    const taskId = Date.now().toString();
    
    const newTask: ProcessingTask = {
      id: taskId,
      inputPath: inputDir,
      outputPath: outputDir,
      fileName: `Batch: ${inputDir.split('/').pop() || inputDir.split('\\').pop()}`,
      status: 'pending',
      progress: 0,
    };

    setTasks(prev => [newTask, ...prev]);

    // Update task to processing
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'processing' as const, progress: 50 } : task
    ));

    try {
      await invoke('rembg_batch_process', {
        inputDir,
        outputDir,
        model,
        alphaMatting,
        onlyMask,
        watchMode,
      });

      // Update task to completed
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: 'completed' as const, 
          progress: 100 
        } : task
      ));

      // Clear form
      setInputDir('');
      setOutputDir('');
      
    } catch (error) {
      console.error('Batch processing error:', error);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: 'error' as const, 
          error: error as string 
        } : task
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ProcessingTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusBadge = (status: ProcessingTask['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      error: 'destructive',
    } as const;

    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Wand2 className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-bold">Background Remover</h1>
      </div>

      {/* rembg Status Check */}
      {error && !rembgStatus && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkRembgAvailability}
                className="mr-2"
              >
                Retry Check
              </Button>
              <span className="text-sm text-gray-600">
                Install with: <code className="bg-gray-100 px-1 rounded">pip install "rembg[cli]"</code>
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {rembgStatus && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700">
            {rembgStatus} - Ready to remove backgrounds!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Single File</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center space-x-2">
            <Folder className="w-4 h-4" />
            <span>Batch Process</span>
          </TabsTrigger>
        </TabsList>

        {/* Model Selection - Common for both tabs */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Model & Settings</span>
            </CardTitle>
            <CardDescription>
              Choose the AI model and processing options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((modelName) => (
                    <SelectItem key={modelName} value={modelName}>
                      <div>
                        <div className="font-medium">{modelName}</div>
                        <div className="text-xs text-gray-500">
                          {MODEL_DESCRIPTIONS[modelName as keyof typeof MODEL_DESCRIPTIONS] || 'AI model for background removal'}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="alphaMatting" 
                  checked={alphaMatting} 
                  onCheckedChange={(checked) => setAlphaMatting(checked as boolean)}
                />
                <Label htmlFor="alphaMatting" className="text-sm">
                  Alpha Matting
                  <span className="block text-xs text-gray-500">Better edge quality</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="onlyMask" 
                  checked={onlyMask} 
                  onCheckedChange={(checked) => setOnlyMask(checked as boolean)}
                />
                <Label htmlFor="onlyMask" className="text-sm">
                  Only Mask
                  <span className="block text-xs text-gray-500">Return mask only</span>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Single File Processing</CardTitle>
              <CardDescription>
                Remove background from a single image file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Input File</Label>
                <div className="flex space-x-2">
                  <Input
                    value={inputPath}
                    onChange={(e) => setInputPath(e.target.value)}
                    placeholder="Select input image file..."
                    readOnly
                  />
                  <Button onClick={handleSelectInputFile} variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Output File</Label>
                <div className="flex space-x-2">
                  <Input
                    value={outputPath}
                    onChange={(e) => setOutputPath(e.target.value)}
                    placeholder="Output file path..."
                  />
                  <Button onClick={handleSelectOutputFile} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleSingleFileProcess}
                disabled={isLoading || !inputPath || !outputPath || !rembgStatus}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Remove Background
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Processing</CardTitle>
              <CardDescription>
                Process multiple images in a folder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Input Directory</Label>
                <div className="flex space-x-2">
                  <Input
                    value={inputDir}
                    onChange={(e) => setInputDir(e.target.value)}
                    placeholder="Select input folder..."
                    readOnly
                  />
                  <Button onClick={handleSelectInputDirectory} variant="outline">
                    <Folder className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Output Directory</Label>
                <div className="flex space-x-2">
                  <Input
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder="Select output folder..."
                    readOnly
                  />
                  <Button onClick={handleSelectOutputDirectory} variant="outline">
                    <Folder className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="watchMode" 
                  checked={watchMode} 
                  onCheckedChange={(checked) => setWatchMode(checked as boolean)}
                />
                <Label htmlFor="watchMode" className="text-sm">
                  Watch Mode
                  <span className="block text-xs text-gray-500">Monitor folder for new files</span>
                </Label>
              </div>

              <Button 
                onClick={handleBatchProcess}
                disabled={isLoading || !inputDir || !outputDir || !rembgStatus}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing Batch...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 mr-2" />
                    Process Batch
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Processing Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing History</CardTitle>
            <CardDescription>
              Track your background removal tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  {getStatusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{task.fileName}</p>
                      {getStatusBadge(task.status)}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{task.inputPath}</p>
                    {task.status === 'processing' && (
                      <Progress value={task.progress} className="mt-2" />
                    )}
                    {task.error && (
                      <p className="text-xs text-red-500 mt-1">{task.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
