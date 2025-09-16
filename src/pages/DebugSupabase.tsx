import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Database, Users, Shield } from 'lucide-react';

export default function DebugSupabase() {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    const testResults: Record<string, unknown> = {};

    try {
      // Test 1: Basic connection
      console.log('Testing basic connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      testResults.connection = {
        status: connectionError ? 'error' : 'success',
        message: connectionError ? connectionError.message : 'Connection successful'
      };

      // Test 2: Check table existence
      console.log('Checking table structure...');
      const tables = ['tenants', 'tenant_memberships', 'profiles'];
      testResults.tables = {};
      let missingTables = 0;

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (error && error.message.includes('does not exist')) {
            testResults.tables[table] = {
              status: 'missing',
              message: 'Table does not exist - needs creation'
            };
            missingTables++;
          } else if (error) {
            testResults.tables[table] = {
              status: 'error',
              message: error.message
            };
          } else {
            testResults.tables[table] = {
              status: 'success',
              message: `${count || 0} records`,
              count: count || 0
            };
          }
        } catch (err: any) {
          testResults.tables[table] = {
            status: 'error',
            message: err.message
          };
        }
      }

      // Set overall database status
      if (missingTables > 0) {
        testResults.needsSetup = {
          status: 'warning',
          message: `${missingTables} table(s) missing - database setup required`,
          missingCount: missingTables
        };
      }

      // Test 3: Check RLS policies
      console.log('Testing RLS policies...');
      testResults.rlsPolicies = {};

      // Test tenant insert policy
      try {
        const testSlug = `test-${Date.now()}`;
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: 'Test Tenant',
            slug: testSlug,
            subscription_tier: 'starter',
            subscription_status: 'active',
            max_users: 1,
            settings: {}
          })
          .select();

        if (tenantError) {
          testResults.rlsPolicies.tenantInsert = {
            status: 'error',
            message: tenantError.message
          };
        } else {
          testResults.rlsPolicies.tenantInsert = {
            status: 'success',
            message: 'Tenant insert allowed'
          };
          
          // Clean up test data
          if (tenantData && tenantData[0]) {
            await supabase.from('tenants').delete().eq('id', tenantData[0].id);
          }
        }
        } catch (err: unknown) {
          testResults.rlsPolicies = {
            tenantInsert: {
              status: 'error',
              message: err instanceof Error ? err.message : 'Unknown RLS error'
            }
          };
        }
    } catch (error: unknown) {
      testResults.generalError = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    setResults(testResults);
    setLoading(false);
  };

  const showMigrationInstructions = () => {
    const hasMissingTables = results.needsSetup && results.needsSetup.missingCount > 0;
    
    setResults(prev => ({
      ...prev,
      migration: {
        status: 'info',
        message: hasMissingTables ? 'Complete database setup required' : 'Database policies update required',
        instructions: hasMissingTables ? `
⚠️  MISSING DATABASE TABLES DETECTED

Your database is missing core tables needed for the multi-tenant signup system.

🔧 COMPLETE SETUP REQUIRED:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (znjtryqrqxjghvvdlvdg)
3. Go to SQL Editor
4. Copy and paste the ENTIRE content from complete-database-setup.sql file
5. Click "Run" to execute the complete setup
6. Come back here and click "Test Database" to verify

This will create:
✓ tenants table (for organizations/workspaces)
✓ tenant_memberships table (for user-tenant relationships)  
✓ shift_assignments table (for shift management)
✓ audit_logs table (for security tracking)
✓ RLS policies for secure signup
✓ Helper functions for tenant management

After setup, signup will work for both individual users and companies.
        ` : `
🔧 DATABASE POLICIES UPDATE:

Your tables exist but need signup-friendly policies.

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (znjtryqrqxjghvvdlvdg)
3. Go to SQL Editor
4. Copy and paste the SQL from manual-migration.sql file
5. Click "Run" to execute the migration
6. Come back here and click "Test Database" to verify

This will add policies that allow:
- Users to create tenants during signup
- Users to create tenant memberships
- Users to create profiles with tenant association
        `
      }
    }));
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Supabase Debug Panel</h1>
        <p className="text-muted-foreground">
          Test your Supabase connection and apply necessary fixes for signup authentication
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button 
          onClick={testConnection}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Test Database
        </Button>
        
        <Button 
          onClick={showMigrationInstructions}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Show Migration Instructions
        </Button>
      </div>

      {loading && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Running database tests...
          </AlertDescription>
        </Alert>
      )}

      {results.connection && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon status={results.connection.status} />
              Database Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={results.connection.status === 'success' ? 'text-green-600' : 'text-red-600'}>
              {results.connection.message}
            </p>
          </CardContent>
        </Card>
      )}

      {results.needsSetup && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <StatusIcon status={results.needsSetup.status} />
              Database Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 font-medium">
              {results.needsSetup.message}
            </p>
            <p className="text-sm text-orange-600 mt-2">
              Click "Show Migration Instructions" below for complete setup steps.
            </p>
          </CardContent>
        </Card>
      )}

      {results.tables && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Table Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(results.tables).map(([table, result]: [string, unknown]) => (
                <div key={table} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={result.status} />
                    <span className="font-medium">{table}</span>
                  </div>
                  <span className={
                    result.status === 'success' ? 'text-green-600' : 
                    result.status === 'missing' ? 'text-orange-600' :
                    'text-red-600'
                  }>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.rlsPolicies && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              RLS Policy Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(results.rlsPolicies).map(([test, result]: [string, unknown]) => (
                <div key={test} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={result.status} />
                    <span className="font-medium">{test}</span>
                  </div>
                  <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.migration && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon status={results.migration.status} />
              Migration Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={
              results.migration.status === 'success' ? 'text-green-600' : 
              results.migration.status === 'error' ? 'text-red-600' : 'text-blue-600'
            }>
              {results.migration.message}
            </p>
            {results.migration.instructions && (
              <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto whitespace-pre-wrap">
                {results.migration.instructions}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {results.generalError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {results.generalError.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}