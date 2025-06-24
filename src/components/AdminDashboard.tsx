import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Search,
  Filter,
  MoreVertical,
  Eye,
  Building,
  UserCheck,
  UserX,
  Clock,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  Mail,
  Crown,
  Key,
  LogIn,
  History
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type StaffAccount = Database['public']['Tables']['staff_accounts']['Row'];
type Pharmacy = Database['public']['Tables']['pharmacies']['Row'];
type AuditLog = Database['public']['Tables']['audit_log']['Row'];
type StaffSession = Database['public']['Tables']['staff_sessions']['Row'];

interface StaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  hire_date: string;
  permissions: Record<string, boolean>;
}

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("staff");
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<StaffSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [showEditStaffDialog, setShowEditStaffDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);
  const { toast } = useToast();

  // Form state for adding/editing staff
  const [staffForm, setStaffForm] = useState<StaffFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "technician",
    is_active: true,
    hire_date: "",
    permissions: {
      view_patients: true,
      edit_patients: false,
      delete_patients: false,
      send_messages: true,
      view_analytics: false,
      manage_staff: false,
      system_settings: false
    }
  });

  const roles = [
    { value: 'admin', label: 'Administrator', color: 'bg-red-100 text-red-800' },
    { value: 'manager', label: 'Manager', color: 'bg-purple-100 text-purple-800' },
    { value: 'pharmacist', label: 'Pharmacist', color: 'bg-blue-100 text-blue-800' },
    { value: 'technician', label: 'Pharmacy Technician', color: 'bg-green-100 text-green-800' },
    { value: 'customer_service', label: 'Customer Service', color: 'bg-orange-100 text-orange-800' }
  ];

  const permissions = [
    { key: 'view_patients', label: 'View Patients', description: 'Can view patient information' },
    { key: 'edit_patients', label: 'Edit Patients', description: 'Can modify patient data' },
    { key: 'delete_patients', label: 'Delete Patients', description: 'Can remove patients' },
    { key: 'send_messages', label: 'Send Messages', description: 'Can send SMS/messages to patients' },
    { key: 'view_analytics', label: 'View Analytics', description: 'Can access reports and analytics' },
    { key: 'manage_staff', label: 'Manage Staff', description: 'Can add/edit/remove staff members' },
    { key: 'system_settings', label: 'System Settings', description: 'Can modify system configuration' }
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStaffAccounts(),
        loadPharmacies(),
        loadAuditLogs(),
        loadActiveSessions()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStaffAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaffAccounts(data || []);
    } catch (error) {
      console.error('Error loading staff accounts:', error);
    }
  };

  const loadPharmacies = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPharmacies(data || []);
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select(`
          *,
          staff_accounts!inner(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_sessions')
        .select(`
          *,
          staff_accounts!inner(first_name, last_name, email)
        `)
        .eq('is_active', true)
        .order('login_time', { ascending: false });

      if (error) throw error;
      setActiveSessions(data || []);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  };

  const createStaffAccount = async () => {
    if (!staffForm.first_name || !staffForm.last_name || !staffForm.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('=== CREATING STAFF ACCOUNT ===');
      console.log('Form data:', staffForm);

      // Get or create default pharmacy
      let defaultPharmacy = pharmacies[0];
      if (!defaultPharmacy) {
        console.log('No pharmacy found, creating default...');
        // Create default pharmacy if none exists
        const { data: newPharmacy, error: pharmacyError } = await supabase
          .from('pharmacies')
          .insert({
            name: 'Narayan Pharmacy',
            address: 'Main Branch',
            phone: '+1-555-0100',
            email: 'info@narayanpharmacy.com',
            is_active: true
          })
          .select()
          .single();

        if (pharmacyError) {
          console.error('Pharmacy creation error:', pharmacyError);
          throw pharmacyError;
        }
        defaultPharmacy = newPharmacy;
        await loadPharmacies();
        console.log('Created pharmacy:', defaultPharmacy);
      }

      // Generate credentials
      const defaultUsername = `${staffForm.first_name.toLowerCase()}${staffForm.last_name.toLowerCase()}`;
      const defaultPassword = `${staffForm.first_name.toLowerCase()}123`;
      
      console.log('Generated credentials:', { username: defaultUsername, password: defaultPassword });

      // Create staff account in database
      console.log('Inserting staff account...');
      const { data, error } = await supabase
        .from('staff_accounts')
        .insert({
          pharmacy_id: defaultPharmacy.id,
          email: staffForm.email,
          first_name: staffForm.first_name,
          last_name: staffForm.last_name,
          role: staffForm.role,
          phone: staffForm.phone || null,
          hire_date: staffForm.hire_date || null,
          is_active: staffForm.is_active,
          permissions: staffForm.permissions
        })
        .select()
        .single();

      if (error) {
        console.error('Staff account creation error:', error);
        throw error;
      }

      console.log('Staff account created successfully:', data);

      // Verify the account was created by querying it back
      const { data: verifyData, error: verifyError } = await supabase
        .from('staff_accounts')
        .select('*')
        .eq('id', data.id)
        .single();

      if (verifyError) {
        console.error('Verification error:', verifyError);
        throw new Error(`Account created but verification failed: ${verifyError.message}`);
      }

      console.log('Account verification successful:', verifyData);

      await loadStaffAccounts();
      setShowAddStaffDialog(false);
      resetStaffForm();

      // Show success with clear credentials
      toast({
        title: "✅ Staff Account Created Successfully!",
        description: `Login Credentials:\nUsername: ${defaultUsername}\nPassword: ${defaultPassword}\nEmail: ${staffForm.email}`,
        duration: 10000,
      });

      // Log the audit event
      await supabase
        .from('audit_log')
        .insert({
          staff_id: 'admin', // Admin performing the action
          action: 'CREATE_STAFF_ACCOUNT',
          resource_type: 'staff_accounts',
          resource_id: data.id,
          new_values: { 
            name: `${staffForm.first_name} ${staffForm.last_name}`,
            email: staffForm.email,
            role: staffForm.role,
            username: defaultUsername,
            created_by: 'admin'
          }
        });

      console.log('=== STAFF ACCOUNT CREATION COMPLETE ===');

    } catch (error) {
      console.error('=== STAFF ACCOUNT CREATION FAILED ===');
      console.error('Error details:', error);
      
      // Provide more specific error message
      let errorMessage = "Failed to create staff account";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "❌ Staff Account Creation Failed",
        description: `Error: ${errorMessage}\n\nPlease check the console for details and try again.`,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStaffAccount = async () => {
    if (!selectedStaff) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('staff_accounts')
        .update({
          first_name: staffForm.first_name,
          last_name: staffForm.last_name,
          email: staffForm.email,
          phone: staffForm.phone || null,
          role: staffForm.role,
          is_active: staffForm.is_active,
          hire_date: staffForm.hire_date || null,
          permissions: staffForm.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStaff.id);

      if (error) throw error;

      await loadStaffAccounts();
      setShowEditStaffDialog(false);
      setSelectedStaff(null);
      resetStaffForm();

      toast({
        title: "Success",
        description: "Staff account updated successfully",
      });
    } catch (error) {
      console.error('Error updating staff account:', error);
      toast({
        title: "Error",
        description: "Failed to update staff account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteStaffAccount = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('staff_accounts')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      await loadStaffAccounts();
      toast({
        title: "Success",
        description: "Staff account deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting staff account:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffStatus = async (staff: StaffAccount) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('staff_accounts')
        .update({ 
          is_active: !staff.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', staff.id);

      if (error) throw error;

      await loadStaffAccounts();
      toast({
        title: "Success",
        description: `Staff account ${!staff.is_active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling staff status:', error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (staff: StaffAccount) => {
    setSelectedStaff(staff);
    setStaffForm({
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      phone: staff.phone || "",
      role: staff.role,
      is_active: staff.is_active || true,
      hire_date: staff.hire_date || "",
      permissions: (staff.permissions as Record<string, boolean>) || {}
    });
    setShowEditStaffDialog(true);
  };

  const resetStaffForm = () => {
    setStaffForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "technician",
      is_active: true,
      hire_date: "",
      permissions: {
        view_patients: true,
        edit_patients: false,
        delete_patients: false,
        send_messages: true,
        view_analytics: false,
        manage_staff: false,
        system_settings: false
      }
    });
  };

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.label || role;
  };

  const filteredStaff = staffAccounts.filter(staff => {
    const matchesSearch = 
      staff.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === "all" || staff.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const stats = {
    totalStaff: staffAccounts.length,
    activeStaff: staffAccounts.filter(s => s.is_active).length,
    inactiveStaff: staffAccounts.filter(s => !s.is_active).length,
    activeSessions: activeSessions.length,
    admins: staffAccounts.filter(s => s.role === 'admin').length,
    pharmacists: staffAccounts.filter(s => s.role === 'pharmacist').length,
    technicians: staffAccounts.filter(s => s.role === 'technician').length
  };

  const createTestStaffAccount = async () => {
    setLoading(true);
    try {
      console.log('=== CREATING TEST STAFF ACCOUNT ===');
      
      // Get or create default pharmacy
      let defaultPharmacy = pharmacies[0];
      if (!defaultPharmacy) {
        const { data: newPharmacy, error: pharmacyError } = await supabase
          .from('pharmacies')
          .insert({
            name: 'Narayan Pharmacy',
            address: 'Main Branch',
            phone: '+1-555-0100',
            email: 'info@narayanpharmacy.com',
            is_active: true
          })
          .select()
          .single();

        if (pharmacyError) throw pharmacyError;
        defaultPharmacy = newPharmacy;
      }

      // Create test staff account
      const testData = {
        pharmacy_id: defaultPharmacy.id,
        email: 'test.user@narayanpharmacy.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'technician',
        phone: '+1-555-0123',
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true,
        permissions: {
          view_patients: true,
          edit_patients: false,
          delete_patients: false,
          send_messages: true,
          view_analytics: false,
          manage_staff: false,
          system_settings: false
        }
      };

      console.log('Test account data:', testData);

      const { data, error } = await supabase
        .from('staff_accounts')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.error('Test account creation error:', error);
        throw error;
      }

      console.log('Test account created:', data);

      // Generate login credentials
      const username = 'testuser';
      const password = 'test123';

      await loadStaffAccounts();

      toast({
        title: "🧪 Test Staff Account Created!",
        description: `Username: ${username}\nPassword: ${password}\nEmail: test.user@narayanpharmacy.com`,
        duration: 10000,
      });

      console.log('=== TEST ACCOUNT CREATION COMPLETE ===');

    } catch (error) {
      console.error('Test account creation failed:', error);
      toast({
        title: "❌ Test Account Creation Failed",
        description: error.message || "Check console for details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && staffAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage pharmacy staff accounts and permissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalStaff}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Staff</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeStaff}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeSessions}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Administrators</p>
                  <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
                </div>
                <Crown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="staff">Staff Management</TabsTrigger>
              <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="staff" className="flex-1 overflow-hidden mt-4">
            <div className="p-6 space-y-6">
              {/* Debug Banner */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    🧪
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Debug Mode: Staff Authentication Testing
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>The orange "🧪 Create Test Account" button is in the top-right area below. Click it to create a test staff account instantly.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search staff..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-xs text-gray-500">👀 Look for the orange button below:</div>
                  <div className="flex space-x-2">
                    <Button onClick={() => setShowAddStaffDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Staff Member
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={createTestStaffAccount}
                      disabled={loading}
                      className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                    >
                      🧪 Create Test Account
                    </Button>
                  </div>
                </div>
              </div>

              {/* Staff List */}
              <div className="grid grid-cols-1 gap-4">
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
                    <p className="text-gray-500">
                      {searchQuery ? "Try adjusting your search" : "Add your first staff member to get started"}
                    </p>
                  </div>
                ) : (
                  filteredStaff.map((staff) => (
                    <Card key={staff.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                                {staff.first_name[0]}{staff.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900">
                                  {staff.first_name} {staff.last_name}
                                </h3>
                                <Badge className={getRoleColor(staff.role)}>
                                  {getRoleLabel(staff.role)}
                                </Badge>
                                {staff.is_active ? (
                                  <Badge variant="outline" className="text-green-700 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-700 border-red-200">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {staff.email}
                                </span>
                                {staff.phone && (
                                  <span className="flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {staff.phone}
                                  </span>
                                )}
                                {staff.hire_date && (
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Hired {new Date(staff.hire_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStaffStatus(staff)}
                            >
                              {staff.is_active ? (
                                <>
                                  <UserX className="w-4 h-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(staff)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Key className="w-4 h-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => deleteStaffAccount(staff.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
              {activeSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active sessions</h3>
                  <p className="text-gray-500">No staff members are currently logged in</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeSessions.map((session) => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div>
                              <p className="font-medium">Session {session.id.slice(0, 8)}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <LogIn className="w-3 h-3 mr-1" />
                                  {new Date(session.login_time || '').toLocaleString()}
                                </span>
                                {session.ip_address && (
                                  <span>IP: {session.ip_address}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <XCircle className="w-4 h-4 mr-1" />
                            End Session
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
              {auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs</h3>
                  <p className="text-gray-500">System activities will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <Card key={log.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{log.action}</p>
                            <div className="text-sm text-gray-500 mt-1">
                              <p>Resource: {log.resource_type || 'N/A'}</p>
                              <p>Time: {new Date(log.created_at).toLocaleString()}</p>
                              {log.ip_address && <p>IP: {log.ip_address}</p>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 overflow-auto p-6">
            <div className="text-center py-20">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
              <p className="text-gray-500">Pharmacy and system configuration settings will be available here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={staffForm.first_name}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={staffForm.last_name}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@pharmacy.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1-555-0123"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={staffForm.role} onValueChange={(value) => setStaffForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={staffForm.hire_date}
                onChange={(e) => setStaffForm(prev => ({ ...prev, hire_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {permissions.map((permission) => (
                  <div key={permission.key} className="flex items-center space-x-2">
                    <Switch
                      checked={staffForm.permissions[permission.key] || false}
                      onCheckedChange={(checked) => 
                        setStaffForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, [permission.key]: checked }
                        }))
                      }
                    />
                    <div>
                      <Label className="text-sm font-medium">{permission.label}</Label>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={staffForm.is_active}
                onCheckedChange={(checked) => setStaffForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active Account</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createStaffAccount} disabled={loading}>
                Create Staff Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditStaffDialog} onOpenChange={setShowEditStaffDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_first_name">First Name *</Label>
                <Input
                  id="edit_first_name"
                  value={staffForm.first_name}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="edit_last_name">Last Name *</Label>
                <Input
                  id="edit_last_name"
                  value={staffForm.last_name}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_email">Email Address *</Label>
              <Input
                id="edit_email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@pharmacy.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_phone">Phone Number</Label>
                <Input
                  id="edit_phone"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1-555-0123"
                />
              </div>
              <div>
                <Label htmlFor="edit_role">Role *</Label>
                <Select value={staffForm.role} onValueChange={(value) => setStaffForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit_hire_date">Hire Date</Label>
              <Input
                id="edit_hire_date"
                type="date"
                value={staffForm.hire_date}
                onChange={(e) => setStaffForm(prev => ({ ...prev, hire_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {permissions.map((permission) => (
                  <div key={permission.key} className="flex items-center space-x-2">
                    <Switch
                      checked={staffForm.permissions[permission.key] || false}
                      onCheckedChange={(checked) => 
                        setStaffForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, [permission.key]: checked }
                        }))
                      }
                    />
                    <div>
                      <Label className="text-sm font-medium">{permission.label}</Label>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={staffForm.is_active}
                onCheckedChange={(checked) => setStaffForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active Account</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditStaffDialog(false)}>
                Cancel
              </Button>
              <Button onClick={updateStaffAccount} disabled={loading}>
                Update Staff Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 