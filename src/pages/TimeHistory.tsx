
import React from "react";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useTimeHistory } from "@/hooks/time/useTimeHistory";
import TimeLogItem from "@/components/time/history/TimeLogItem";
import EmptyTimeLogState from "@/components/time/history/EmptyTimeLogState";
import TimeHistoryHeader from "@/components/time/history/TimeHistoryHeader";

const TimeHistory = () => {
  const { user } = useAuth();
  const {
    filteredLogs,
    loading,
    searchTerm,
    setSearchTerm,
    totalEarnings,
    formatTime,
    formatDate,
    formatDuration
  } = useTimeHistory(user?.id);

  return (
    <AppLayout title="Time Tracking History">
      <div className="max-w-4xl mx-auto space-y-6">
        <TimeHistoryHeader totalEarnings={totalEarnings} />
        
        <Card>
          <CardHeader className="px-6 pt-6 pb-0">
            {/* No additional header here, we already have it above the card */}
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by shift name, location or date..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {loading ? (
              <div className="flex flex-col space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="space-y-4">
                {filteredLogs.map((log, index) => (
                  <TimeLogItem 
                    key={log.id} 
                    log={log}
                    formatTime={formatTime}
                    formatDate={formatDate}
                    formatDuration={formatDuration}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyTimeLogState searchTerm={searchTerm} />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TimeHistory;
