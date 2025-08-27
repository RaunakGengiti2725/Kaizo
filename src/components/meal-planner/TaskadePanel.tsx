import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const TaskadePanel = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Check for Taskade environment variables
  const hasTaskadeEmbed = import.meta.env.VITE_TASKADE_EMBED_URL;
  const hasTaskadeAPI = import.meta.env.VITE_TASKADE_API_KEY;

  useEffect(() => {
    // Simulate checking connection status
    const checkConnection = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(!!hasTaskadeAPI);
      setIsLoading(false);
    };

    checkConnection();
  }, [hasTaskadeAPI]);

  const handleSync = async () => {
    setIsLoading(true);
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastSync(new Date());
    setIsLoading(false);
  };

  const handleConnect = () => {
    // In a real app, this would open Taskade OAuth flow
    window.open('https://taskade.com', '_blank');
  };

  if (!hasTaskadeEmbed && !hasTaskadeAPI) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Taskade Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Taskade Not Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add Taskade environment variables to enable integration
            </p>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg text-left">
              <p className="font-medium mb-2">Required Environment Variables:</p>
              <code className="block bg-background p-2 rounded mb-2">
                VITE_TASKADE_EMBED_URL
              </code>
              <code className="block bg-background p-2 rounded">
                VITE_TASKADE_API_KEY (optional)
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Taskade Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className={cn(
                isConnected ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : ""
              )}
            >
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleConnect}
            className="h-8 w-8 p-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <Separator />

        {/* Sync Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Sync</span>
            <span className="text-xs text-muted-foreground">
              {lastSync ? lastSync.toLocaleTimeString() : "Never"}
            </span>
          </div>
          
          <Button
            onClick={handleSync}
            disabled={isLoading || !isConnected}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            {isLoading ? "Syncing..." : "Sync Now"}
          </Button>
        </div>

        <Separator />

        {/* Taskade Embed */}
        {hasTaskadeEmbed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taskade Workspace</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(import.meta.env.VITE_TASKADE_EMBED_URL, '_blank')}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="bg-muted rounded-lg p-3 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Taskade workspace is connected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your meal plan will sync automatically
              </p>
            </div>
          </div>
        )}

        {/* API Status */}
        {hasTaskadeAPI && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                API Connected
              </Badge>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Full Integration
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Meal items automatically sync to Taskade
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>• Meal items sync as tasks in Taskade</li>
                <li>• Due dates match your meal plan</li>
                <li>• Tags include meal type and slot</li>
                <li>• Notes and links are preserved</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskadePanel;

