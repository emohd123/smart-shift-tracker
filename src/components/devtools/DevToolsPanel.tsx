import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Bug, 
  Clock, 
  Database, 
  Download, 
  Eye, 
  Gauge, 
  HardDrive, 
  Network, 
  Zap 
} from 'lucide-react';
import { usePerformanceMonitor, useErrorTracking, useRealUserMonitoring } from '@/hooks/monitoring/usePerformanceMonitor';

const DevToolsPanel: React.FC = () => {
  const { metrics } = usePerformanceMonitor('DevToolsPanel');
  const { errors, clearErrors, errorCount } = useErrorTracking();
  const { vitals, getVitalsScore } = useRealUserMonitoring();
  const [isVisible, setIsVisible] = useState(false);
  const [networkRequests, setNetworkRequests] = useState<Array<{
    url: string;
    method: string;
    status: number;
    duration: number;
    timestamp: number;
  }>>([]);

  // Show dev tools only in development or when explicitly enabled
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const isEnabled = localStorage.getItem('devtools-enabled') === 'true';
    setIsVisible(isDev || isEnabled);
  }, []);

  // Monitor network requests
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        setNetworkRequests(prev => [...prev.slice(-49), {
          url: args[0].toString(),
          method: (args[1]?.method || 'GET').toUpperCase(),
          status: response.status,
          duration,
          timestamp: Date.now()
        }]);
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        setNetworkRequests(prev => [...prev.slice(-49), {
          url: args[0].toString(),
          method: (args[1]?.method || 'GET').toUpperCase(),
          status: 0,
          duration,
          timestamp: Date.now()
        }]);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const { scores, overallScore } = getVitalsScore();

  const exportLogs = () => {
    const data = {
      timestamp: new Date().toISOString(),
      performance: metrics,
      errors: errors,
      vitals: vitals,
      networkRequests: networkRequests
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devtools-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-background border rounded-lg shadow-lg z-50">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="h-4 w-4" />
              DevTools
            </CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={exportLogs}>
                <Download className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsVisible(false)}>
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="performance" className="h-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="performance" className="text-xs">
                <Gauge className="h-3 w-3 mr-1" />
                Perf
              </TabsTrigger>
              <TabsTrigger value="errors" className="text-xs">
                <Bug className="h-3 w-3 mr-1" />
                Errors
                {errorCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                    {errorCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs">
                <Network className="h-3 w-3 mr-1" />
                Net
              </TabsTrigger>
              <TabsTrigger value="vitals" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Vitals
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-64 p-4">
              <TabsContent value="performance" className="space-y-3 mt-0">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Renders</p>
                    <p className="font-mono">{metrics.renderCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Render</p>
                    <p className="font-mono">{metrics.averageRenderTime.toFixed(1)}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Render</p>
                    <p className="font-mono">{metrics.maxRenderTime.toFixed(1)}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Render</p>
                    <p className="font-mono">{metrics.lastRenderTime.toFixed(1)}ms</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="errors" className="space-y-2 mt-0">
                {errors.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No errors recorded</p>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">{errors.length} errors</p>
                      <Button size="sm" variant="outline" onClick={clearErrors} className="h-6 text-xs">
                        Clear
                      </Button>
                    </div>
                    {errors.slice(-5).map((error) => (
                      <div key={error.id} className="p-2 bg-destructive/10 rounded text-xs">
                        <p className="font-medium text-destructive">{error.message}</p>
                        <p className="text-muted-foreground">{error.component}</p>
                        <p className="text-muted-foreground">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="network" className="space-y-2 mt-0">
                {networkRequests.slice(-10).map((request, index) => (
                  <div key={index} className="flex justify-between items-center text-xs p-1 border-b">
                    <div className="flex-1 truncate">
                      <span className={`mr-2 font-mono ${
                        request.status >= 200 && request.status < 300 ? 'text-green-600' :
                        request.status >= 400 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {request.status || 'ERR'}
                      </span>
                      <span className="text-muted-foreground">{request.method}</span>
                    </div>
                    <span className="font-mono">{request.duration}ms</span>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="vitals" className="space-y-3 mt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs">Overall Score</span>
                    <Badge variant={
                      overallScore === 'good' ? 'default' :
                      overallScore === 'needs-improvement' ? 'secondary' : 'destructive'
                    }>
                      {overallScore}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {Object.entries(scores).map(([metric, score]) => (
                      <div key={metric} className="flex justify-between">
                        <span>{metric}</span>
                        <span className={`font-mono ${
                          score === 'good' ? 'text-green-600' :
                          score === 'needs-improvement' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {vitals[metric as keyof typeof vitals]?.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevToolsPanel;