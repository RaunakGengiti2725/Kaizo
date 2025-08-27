import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ExternalLink, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { taskadeService, TaskadeWorkspace, TaskadeFolder, TaskadeProject } from '@/services/taskadeService';

interface TaskadeConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionEstablished: (workspaceId: string, folderId: string | null) => void;
}

const TaskadeConnectionModal = ({ isOpen, onClose, onConnectionEstablished }: TaskadeConnectionModalProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [workspaces, setWorkspaces] = useState<TaskadeWorkspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [folders, setFolders] = useState<TaskadeFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load saved API key from localStorage
      const savedApiKey = localStorage.getItem('taskade_api_key');
      if (savedApiKey) {
        setApiKey(savedApiKey);
        taskadeService.setApiKey(savedApiKey);
        setIsConnected(true);
        loadWorkspaces();
      }
    }
  }, [isOpen]);

  const loadWorkspaces = async () => {
    if (!taskadeService.isAuthenticated()) return;
    
    setIsLoadingWorkspaces(true);
    try {
      const workspacesData = await taskadeService.getWorkspaces();
      setWorkspaces(workspacesData);
      if (workspacesData.length > 0) {
        setSelectedWorkspaceId(workspacesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      toast({
        title: "Failed to Load Workspaces",
        description: "Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const loadFolders = async (workspaceId: string) => {
    setIsLoadingFolders(true);
    try {
      const foldersData = await taskadeService.getFolders(workspaceId);
      setFolders(foldersData);
      setSelectedFolderId('');
    } catch (error) {
      console.error('Failed to load folders:', error);
      toast({
        title: "Failed to Load Folders",
        description: "Could not load folders for this workspace.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFolders(false);
    }
  };

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadFolders(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Taskade API key.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      taskadeService.setApiKey(apiKey.trim());
      
      // Test the connection by loading workspaces
      await loadWorkspaces();
      
      // Save API key to localStorage
      localStorage.setItem('taskade_api_key', apiKey.trim());
      
      setIsConnected(true);
      toast({
        title: "Connected to Taskade!",
        description: "Successfully authenticated with Taskade API.",
      });
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Please check your API key and try again.",
        variant: "destructive",
      });
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('taskade_api_key');
    setApiKey('');
    setIsConnected(false);
    setWorkspaces([]);
    setFolders([]);
    setSelectedWorkspaceId('');
    setSelectedFolderId('');
    taskadeService.setApiKey('');
    toast({
      title: "Disconnected",
      description: "Successfully disconnected from Taskade.",
    });
  };

  const handleEstablishConnection = () => {
    if (selectedWorkspaceId) {
      onConnectionEstablished(selectedWorkspaceId, selectedFolderId || null);
      onClose();
      toast({
        title: "Connection Established",
        description: "Your Taskade workspace is now connected for shopping list sync.",
      });
    }
  };

  const getApiKeyInstructions = () => (
    <div className="space-y-3 text-sm text-muted-foreground">
      <p>To get your Taskade API key:</p>
      <ol className="list-decimal list-inside space-y-2">
        <li>Go to <a href="https://taskade.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">taskade.com</a> and sign in</li>
        <li>Click on your profile picture → Settings</li>
        <li>Go to "API & Integrations" section</li>
        <li>Click "Generate New API Key"</li>
        <li>Copy the generated key and paste it below</li>
      </ol>
      <p className="text-xs bg-muted p-2 rounded">
        <strong>Note:</strong> Keep your API key secure and don't share it publicly.
      </p>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="shadow-2xl border-border/50 h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Connect to Taskade
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your Taskade account to sync shopping lists
              </p>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden flex flex-col gap-6">
              {!isConnected ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key">Taskade API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your Taskade API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  {getApiKeyInstructions()}

                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting || !apiKey.trim()}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Connect to Taskade
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Connected to Taskade</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Workspace</Label>
                      <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaces.map((workspace) => (
                            <SelectItem key={workspace.id} value={workspace.id}>
                              {workspace.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedWorkspaceId && (
                      <div>
                        <Label>Folder (Optional)</Label>
                        <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select a folder (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No folder (root level)</SelectItem>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                {folder.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleEstablishConnection}
                        disabled={!selectedWorkspaceId}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Use This Connection
                      </Button>
                      
                      <Button
                        onClick={handleDisconnect}
                        variant="outline"
                        className="flex-1"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskadeConnectionModal;
