import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const DebugPanel = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addTestResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      console.log('Testing basic connection...');
      const { data, error } = await supabase
        .from('patients')
        .select('count', { count: 'exact', head: true });
      
      addTestResult('Connection Test', { success: !error, data, error });
      
      if (error) {
        throw error;
      }
      
      toast({ title: "Connection", description: "✅ Database connection successful!" });
    } catch (error) {
      console.error('Connection test failed:', error);
      addTestResult('Connection Test', { success: false, error });
      toast({ title: "Connection", description: `❌ ${error?.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const testTableStructure = async () => {
    setLoading(true);
    try {
      console.log('Testing table structure...');
      
      // Try to select first row to see table structure
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .limit(1);
      
      addTestResult('Table Structure', { success: !error, data, error });
      
      if (error) {
        throw error;
      }
      
      toast({ title: "Table Structure", description: "✅ Table accessible!" });
    } catch (error) {
      console.error('Table structure test failed:', error);
      addTestResult('Table Structure', { success: false, error });
      toast({ title: "Table Structure", description: `❌ ${error?.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const testInsert = async () => {
    setLoading(true);
    try {
      console.log('Testing insert operation...');
      
      const testData = {
        name: `Test Patient ${Date.now()}`,
        phone: "+1234567890",
        email: "test@example.com",
        preferred_channel: "sms",
        status: "active"
      };

      console.log('Insert data:', testData);

      const { data, error } = await supabase
        .from('patients')
        .insert(testData)
        .select()
        .single();

      addTestResult('Insert Test', { success: !error, data, error, insertData: testData });
      
      if (error) {
        console.error('Insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      toast({ title: "Insert Test", description: "✅ Insert successful!" });
      
      // Clean up - delete the test record
      if (data?.id) {
        await supabase.from('patients').delete().eq('id', data.id);
        console.log('Test record cleaned up');
      }
      
    } catch (error) {
      console.error('Insert test failed:', error);
      addTestResult('Insert Test', { success: false, error });
      toast({ title: "Insert Test", description: `❌ ${error?.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const testRLS = async () => {
    setLoading(true);
    try {
      console.log('Testing RLS policies...');
      
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Auth error: ${userError.message}`);
      }
      
      addTestResult('RLS/Auth Test', { 
        success: true, 
        user: user ? { id: user.id, email: user.email } : null,
        authenticated: !!user 
      });
      
      toast({ 
        title: "RLS/Auth Test", 
        description: user ? "✅ User authenticated" : "⚠️ No authenticated user" 
      });
      
    } catch (error) {
      console.error('RLS test failed:', error);
      addTestResult('RLS/Auth Test', { success: false, error });
      toast({ title: "RLS/Auth Test", description: `❌ ${error?.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Database Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={testConnection} disabled={loading} size="sm">
            Test Connection
          </Button>
          <Button onClick={testTableStructure} disabled={loading} size="sm">
            Test Table
          </Button>
          <Button onClick={testInsert} disabled={loading} size="sm">
            Test Insert
          </Button>
          <Button onClick={testRLS} disabled={loading} size="sm">
            Test Auth/RLS
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Test Results</h3>
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear Results
          </Button>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {testResults.map((result, index) => (
            <div key={index} className="p-3 border rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <strong>{result.test}</strong>
                <span className="text-sm text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
              <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 