
import React from "react";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useTimeHistory } from "@/hooks/time/useTimeHistory";
import TimeLogItem from "@/components/time/history/TimeLogItem";
import EmptyTimeLogState from "@/components/time/history/EmptyTimeLogState";
import TimeHistoryHeader from "@/components/time/history/TimeHistoryHeader";
import TimeHistoryFilters from "@/components/time/history/TimeHistoryFilters";
import EarningsAnalytics from "@/components/time/analytics/EarningsAnalytics";

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
    formatDuration,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    selectedShiftId,
    setSelectedShiftId,
    minEarnings,
    setMinEarnings,
    uniqueShifts,
    clearFilters
  } = useTimeHistory(user?.id);

  return (
    <AppLayout title="Time Tracking History">
      <div className="max-w-6xl mx-auto space-y-6">
        <TimeHistoryHeader totalEarnings={totalEarnings} />
        
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4 mt-6">
            <TimeHistoryFilters
              dateFrom={dateFrom}
              dateTo={dateTo}
              selectedShiftId={selectedShiftId}
              minEarnings={minEarnings}
              shifts={uniqueShifts}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onShiftChange={setSelectedShiftId}
              onMinEarningsChange={setMinEarnings}
              onClearFilters={clearFilters}
            />
            
            <Card>
              <CardHeader className="px-6 pt-6 pb-0" />
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
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <EarningsAnalytics userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TimeHistory;
