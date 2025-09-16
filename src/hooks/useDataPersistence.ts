import { useState, useCallback, useEffect } from 'react';
import { supabase, enhancedQuery, withRetry } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface DataPersistenceOptions {
  autoSave?: boolean;
  autoSaveDelay?: number;
  enableRetry?: boolean;
  maxRetries?: number;
  enableOptimisticUpdates?: boolean;
  enableRealtime?: boolean;
}

export interface PersistenceState<T> {
  data: T | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
  isDirty: boolean;
}

export function useDataPersistence<T extends Record<string, unknown>>(
  table: string,
  initialData: T | null = null,
  options: DataPersistenceOptions = {}
) {
  const {
    autoSave = false,
    autoSaveDelay = 2000,
    enableRetry = true,
    maxRetries = 3,
    enableOptimisticUpdates = true,
    enableRealtime = false
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<PersistenceState<T>>({
    data: initialData,
    isLoading: false,
    isSaving: false,
    error: null,
    lastSaved: null,
    isDirty: false
  });

  // Auto-save timer
  useEffect(() => {
    if (!autoSave || !state.isDirty || state.isSaving) return;

    const timer = setTimeout(() => {
      if (state.data?.id) {
        saveData(state.data);
      }
    }, autoSaveDelay);

    return () => clearTimeout(timer);
  }, [state.data, state.isDirty, autoSave, autoSaveDelay]);

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime || !state.data?.id) return;

    const channel = supabase
      .channel(`${table}:${state.data.id}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table,
          filter: `id=eq.${state.data.id}`
        },
        (payload) => {
          setState(prev => ({
            ...prev,
            data: { ...prev.data, ...payload.new } as T,
            lastSaved: new Date()
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, state.data?.id, enableRealtime]);

  const loadData = useCallback(async (id: string): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const operation = async () => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data as T;
      };

      const result = enableRetry 
        ? await withRetry(operation, maxRetries)
        : await operation();

      setState(prev => ({
        ...prev,
        data: result,
        isLoading: false,
        isDirty: false,
        lastSaved: new Date()
      }));

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
      
      toast({
        title: "Error Loading Data",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    }
  }, [table, enableRetry, maxRetries, toast]);

  const saveData = useCallback(async (data: T): Promise<boolean> => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const operation = async () => {
        if (data.id) {
          // Update existing record
          const { data: result, error } = await supabase
            .from(table)
            .update(data)
            .eq('id', data.id)
            .select()
            .single();

          if (error) throw error;
          return result as T;
        } else {
          // Create new record
          const { data: result, error } = await supabase
            .from(table)
            .insert([data])
            .select()
            .single();

          if (error) throw error;
          return result as T;
        }
      };

      const result = enableRetry 
        ? await withRetry(operation, maxRetries)
        : await operation();

      setState(prev => ({
        ...prev,
        data: result,
        isSaving: false,
        isDirty: false,
        lastSaved: new Date()
      }));

      // Log activity
      if (data.id) {
        await supabase.rpc('log_user_activity', {
          p_activity_type: `${table}_updated`,
          p_activity_data: { table, record_id: result.id }
        });
      } else {
        await supabase.rpc('log_user_activity', {
          p_activity_type: `${table}_created`,
          p_activity_data: { table, record_id: result.id }
        });
      }

      toast({
        title: "Data Saved",
        description: `${table} saved successfully`,
        variant: "default"
      });

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save data';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isSaving: false 
      }));
      
      toast({
        title: "Error Saving Data",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  }, [table, enableRetry, maxRetries, toast]);

  const updateData = useCallback((updates: Partial<T>) => {
    setState(prev => {
      if (!prev.data) return prev;

      const newData = { ...prev.data, ...updates } as T;
      
      // Optimistic update
      if (enableOptimisticUpdates) {
        return {
          ...prev,
          data: newData,
          isDirty: true
        };
      }

      return prev;
    });
  }, [enableOptimisticUpdates]);

  const deleteData = useCallback(async (id: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const operation = async () => {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;
      };

      if (enableRetry) {
        await withRetry(operation, maxRetries);
      } else {
        await operation();
      }

      // Log activity
      await supabase.rpc('log_user_activity', {
        p_activity_type: `${table}_deleted`,
        p_activity_data: { table, record_id: id }
      });

      setState(prev => ({
        ...prev,
        data: null,
        isSaving: false,
        isDirty: false
      }));

      toast({
        title: "Data Deleted",
        description: `${table} deleted successfully`,
        variant: "default"
      });

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete data';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isSaving: false 
      }));
      
      toast({
        title: "Error Deleting Data",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  }, [table, enableRetry, maxRetries, toast]);

  const resetData = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      isSaving: false,
      error: null,
      lastSaved: null,
      isDirty: false
    });
  }, [initialData]);

  const forceSave = useCallback(async (): Promise<boolean> => {
    if (state.data) {
      return await saveData(state.data);
    }
    return false;
  }, [state.data, saveData]);

  return {
    // State
    ...state,
    
    // Actions
    loadData,
    saveData,
    updateData,
    deleteData,
    resetData,
    forceSave,
    
    // Utilities
    hasUnsavedChanges: state.isDirty,
    canSave: !state.isSaving && state.isDirty && state.data !== null,
    canLoad: !state.isLoading
  };
}

// Enhanced hook for handling collections/lists
export function useCollectionPersistence<T extends Record<string, unknown>>(
  table: string,
  filters?: Record<string, unknown>,
  options: DataPersistenceOptions = {}
) {
  const { toast } = useToast();
  const [state, setState] = useState<{
    data: T[];
    isLoading: boolean;
    error: string | null;
    lastLoaded: Date | null;
  }>({
    data: [],
    isLoading: false,
    error: null,
    lastLoaded: null
  });

  const loadCollection = useCallback(async (): Promise<T[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await enhancedQuery.select<T>(table, '*', filters);
      
      setState(prev => ({
        ...prev,
        data,
        isLoading: false,
        lastLoaded: new Date()
      }));

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load collection';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
      
      toast({
        title: "Error Loading Data",
        description: errorMessage,
        variant: "destructive"
      });
      
      return [];
    }
  }, [table, filters, toast]);

  const addItem = useCallback(async (item: Omit<T, 'id'>): Promise<T | null> => {
    try {
      const result = await enhancedQuery.insert<T>(table, item);
      const newItem = result[0] as T;
      
      setState(prev => ({
        ...prev,
        data: [...prev.data, newItem]
      }));

      return newItem;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
      toast({
        title: "Error Adding Item",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  }, [table, toast]);

  const updateItem = useCallback(async (id: string, updates: Partial<T>): Promise<boolean> => {
    try {
      await enhancedQuery.update<T>(table, updates, id);
      
      setState(prev => ({
        ...prev,
        data: prev.data.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
      toast({
        title: "Error Updating Item",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [table, toast]);

  const removeItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      await enhancedQuery.delete(table, id);
      
      setState(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== id)
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item';
      toast({
        title: "Error Removing Item",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [table, toast]);

  // Auto-load on mount
  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  return {
    ...state,
    loadCollection,
    addItem,
    updateItem,
    removeItem,
    refresh: loadCollection
  };
}