import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, LogIn, Building, Eye, EyeOff } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (staffData: any) => void;
}

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for admin account first
    if (username === "admin" && password === "admin123") {
      const adminData = {
        id: "admin",
        first_name: "Administrator",
        last_name: "",
        email: "admin@narayanpharmacy.com",
        role: "admin",
        is_active: true,
        permissions: {
          view_patients: true,
          edit_patients: true,
          delete_patients: true,
          send_messages: true,
          view_analytics: true,
          manage_staff: true,
          system_settings: true
        }
      };
      
      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(adminData));
      
      onLoginSuccess(adminData);
      toast({
        title: "Welcome Administrator!",
        description: "Successfully logged in to MedConnect",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('=== ATTEMPTING STAFF LOGIN ===');
      console.log('Username provided:', username);
      console.log('Password provided:', password);
      
      // Look up staff account by multiple criteria
      const { data: staffAccounts, error } = await supabase
        .from('staff_accounts')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Database query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Total active staff accounts found:', staffAccounts?.length || 0);
      console.log('Staff accounts:', staffAccounts);

      if (!staffAccounts || staffAccounts.length === 0) {
        // Check if ANY staff accounts exist
        const { data: allStaff } = await supabase
          .from('staff_accounts')
          .select('first_name, last_name, email, role, is_active')
          .limit(10);
        
        console.log('All staff accounts in database (including inactive):', allStaff);
        throw new Error('No active staff accounts found. Please contact administrator to create staff accounts.');
      }

      // For now, we'll use a simple password check
      // In production, you'd want proper password hashing
      let matchedStaff = null;
      
      console.log('=== CHECKING LOGIN CREDENTIALS ===');
      
      // Check if any staff member matches the login criteria
      for (const staff of staffAccounts) {
        const staffUsername = `${staff.first_name.toLowerCase()}${staff.last_name.toLowerCase()}`;
        const defaultPassword = `${staff.first_name.toLowerCase()}123`; // Default password pattern
        
        console.log(`\n--- Checking staff: ${staff.first_name} ${staff.last_name} ---`);
        console.log(`Staff ID: ${staff.id}`);
        console.log(`Staff Email: ${staff.email}`);
        console.log(`Staff Role: ${staff.role}`);
        console.log(`Staff Active: ${staff.is_active}`);
        console.log(`Expected username: "${staffUsername}"`);
        console.log(`Provided username: "${username.toLowerCase()}"`);
        console.log(`Expected password: "${defaultPassword}"`);
        console.log(`Provided password: "${password}"`);
        console.log(`Email match: ${staff.email === username}`);
        console.log(`Username match: ${staffUsername === username.toLowerCase()}`);
        console.log(`Password match: ${password === defaultPassword}`);
        
        // Check multiple login criteria
        const usernameMatches = (
          staff.email === username || 
          staffUsername === username.toLowerCase() ||
          staff.email.toLowerCase() === username.toLowerCase()
        );
        
        const passwordMatches = password === defaultPassword;
        
        if (usernameMatches && passwordMatches) {
          matchedStaff = staff;
          console.log(`✅ MATCH FOUND! Staff ${staff.first_name} ${staff.last_name} authenticated successfully`);
          break;
        } else {
          console.log(`❌ No match for ${staff.first_name} ${staff.last_name}`);
        }
      }

      if (!matchedStaff) {
        console.log('=== NO MATCHING STAFF FOUND ===');
        console.log('Available login options:');
        staffAccounts.forEach(staff => {
          const username = `${staff.first_name.toLowerCase()}${staff.last_name.toLowerCase()}`;
          const password = `${staff.first_name.toLowerCase()}123`;
          console.log(`- ${staff.first_name} ${staff.last_name}: username="${username}", password="${password}"`);
        });
        throw new Error('Invalid username or password. Check the debug info below for available accounts.');
      }

      console.log('=== LOGIN SUCCESSFUL ===');
      console.log('Authenticated staff:', matchedStaff);

      // Update last login
      const { error: updateError } = await supabase
        .from('staff_accounts')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', matchedStaff.id);

      if (updateError) {
        console.warn('Failed to update last login:', updateError);
      }

      // Create session record
      const { error: sessionError } = await supabase
        .from('staff_sessions')
        .insert({
          staff_id: matchedStaff.id,
          login_time: new Date().toISOString(),
          ip_address: null, // Could be populated from request
          is_active: true
        });

      if (sessionError) {
        console.warn('Failed to create session record:', sessionError);
      }

      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(matchedStaff));

      onLoginSuccess(matchedStaff);
      toast({
        title: `🎉 Welcome ${matchedStaff.first_name}!`,
        description: `Successfully logged in to MedConnect as ${matchedStaff.role}`,
      });

      console.log('=== LOGIN PROCESS COMPLETE ===');

    } catch (error) {
      console.error('=== LOGIN FAILED ===');
      console.error('Login error:', error);
      toast({
        title: "❌ Login Failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Narayan Pharmacy
          </h2>
          <h3 className="text-xl font-semibold text-blue-600 mb-2">
            MedConnect
          </h3>
          <p className="text-gray-600">
            Healthcare Communication Platform
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center text-xl">
              <Shield className="w-6 h-6 mr-2 text-blue-600" />
              Staff Login
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username or Email
                </Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / username / email@pharmacy.com"
                  className="mt-1 h-12"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
                disabled={loading}
              >
                <LogIn className="w-5 h-5 mr-2" />
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Admin Account:</strong> username: admin, password: admin123
          </p>
          <p className="text-sm text-gray-500">
            Staff accounts use: firstname123 as default password
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              try {
                const { data, error } = await supabase.from('staff_accounts').select('first_name, last_name, email, role').limit(5);
                
                if (error) {
                  setDebugInfo(`Error: ${error.message}`);
                  return;
                }
                
                if (!data || data.length === 0) {
                  setDebugInfo("No staff accounts found in database");
                  return;
                }
                
                let info = "=== STAFF LOGIN CREDENTIALS ===\n\n";
                data.forEach(staff => {
                  const username = `${staff.first_name.toLowerCase()}${staff.last_name.toLowerCase()}`;
                  const password = `${staff.first_name.toLowerCase()}123`;
                  info += `${staff.first_name} ${staff.last_name} (${staff.role})\n`;
                  info += `  Username: ${username}\n`;
                  info += `  Password: ${password}\n`;
                  info += `  Email: ${staff.email}\n\n`;
                });
                setDebugInfo(info);
              } catch (err) {
                setDebugInfo(`Error: ${err.message}`);
              }
            }}
            className="mb-2"
          >
            🔍 Show Staff Login Details
          </Button>
          
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">{debugInfo}</pre>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDebugInfo("")}
                className="mt-2"
              >
                Clear
              </Button>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Need access? Contact your pharmacy administrator
          </p>
        </div>
      </div>
    </div>
  );
}; 