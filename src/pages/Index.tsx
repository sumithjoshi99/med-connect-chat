import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings, 
  Bell,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  Shield,
  Zap,
  Send,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Star,
  Heart,
  LogOut
} from "lucide-react";
import { PatientList } from "@/components/PatientList";
import { MessageArea } from "@/components/MessageArea";
import { PatientProfile } from "@/components/PatientProfile";
import { SMSManager } from "@/components/SMSManager";
import { SMSAnalyticsDashboard } from "@/components/SMSAnalyticsDashboard";
import { TeamSidebar } from "@/components/TeamSidebar";
import { BulkSMSManager } from "@/components/BulkSMSManager";
import { ContactsManager } from "@/components/ContactsManager";
import { SMSAutomation } from "@/components/SMSAutomation";
import { NewMessageDialog } from "@/components/NewMessageDialog";
import { OmnichannelMessaging } from "@/components/OmnichannelMessaging";
import { AdminDashboard } from "@/components/AdminDashboard";
import { LoginPage } from "@/components/LoginPage";
import { supabase } from "@/integrations/supabase/client";

import { Database } from "@/integrations/supabase/types";

type Patient = Database['public']['Tables']['patients']['Row'];

interface ConversationData {
  patient: Patient;
  lastMessage?: {
    content: string;
    created_at: string;
    direction: 'inbound' | 'outbound';
    sender_name: string | null;
  };
  unreadCount: number;
  lastActivity: string;
}

export default function Index() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedChannel, setSelectedChannel] = useState("sms");
  // Initialize activeTab from localStorage or default to "dashboard"
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('activeTab');
    return savedTab || "dashboard";
  });
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeConversations: 0,
    messagesSentToday: 0,
    responseRate: 0
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPatients();
      fetchStats();
    }
  }, [isAuthenticated]);

  const checkAuthentication = () => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab("dashboard");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id');
      
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, direction');

      const totalPatients = patientsData?.length || 0;
      const totalMessages = messagesData?.length || 0;
      const sentMessages = messagesData?.filter(m => m.direction === 'outbound').length || 0;
      const receivedMessages = messagesData?.filter(m => m.direction === 'inbound').length || 0;
      
      setStats({
        totalPatients,
        messagesSentToday: sentMessages,
        activeConversations: Math.min(totalPatients, 15), // Mock active conversations
        responseRate: receivedMessages > 0 ? Math.round((receivedMessages / sentMessages) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedChannel(patient.preferred_channel);
    setActiveTab("messages");
    setShowPatientProfile(true); // Auto-show patient profile when selected
  };

  const handlePatientAdded = () => {
    fetchPatients();
    fetchStats();
    toast({
      title: "Success",
      description: "Patient added successfully",
    });
  };

  const handlePatientUpdated = (updatedPatient: Patient) => {
    // Update the patients list with the updated patient data
    setPatients(prevPatients => 
      prevPatients.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    );
    
    // Update selectedPatient if it's the one that was updated
    if (selectedPatient?.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient);
    }
    
    toast({
      title: "Success",
      description: "Patient updated successfully",
    });
  };

  const handlePatientDeleted = (deletedPatientId: string) => {
    // Remove patient from the list
    setPatients(prevPatients => 
      prevPatients.filter(p => p.id !== deletedPatientId)
    );
    
    // Clear selectedPatient if it was the deleted one
    if (selectedPatient?.id === deletedPatientId) {
      setSelectedPatient(null);
      setShowPatientProfile(false);
    }
    
    fetchStats(); // Refresh stats
    toast({
      title: "Success",
      description: "Patient deleted successfully",
    });
  };

  const handleNewMessagePatientSelected = (patient: Patient) => {
    handlePatientSelect(patient);
    setShowNewMessageDialog(false);
  };

  const handleNewMessagePatientAdded = (patient: Patient) => {
    // Add the new patient to the list
    setPatients(prevPatients => [patient, ...prevPatients]);
    fetchStats(); // Refresh stats
  };

  const fetchConversations = async () => {
    try {
      // Get all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('name');

      if (patientsError) throw patientsError;

      // For each patient, get their last message and unread count
      const conversationsData: ConversationData[] = [];
      
      for (const patient of patientsData || []) {
        // Get last message
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('content, created_at, direction, sender_name')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unread count (inbound messages that are not read)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patient.id)
          .eq('direction', 'inbound')
          .or('is_read.is.null,is_read.eq.false');

        const lastMessage = lastMessageData?.[0];
        
        // Only use actual message timestamps, not patient creation dates for conversations
        if (lastMessage) {
          // Patient has messages - use the actual message timestamp
          const lastActivity = lastMessage.created_at;

          conversationsData.push({
            patient,
            lastMessage,
            unreadCount: unreadCount || 0,
            lastActivity
          });
        } else {
          // Patient has no messages - use patient creation date but mark differently
          const lastActivity = patient.created_at;

          conversationsData.push({
            patient,
            lastMessage: undefined, // No last message
            unreadCount: unreadCount || 0,
            lastActivity
          });
        }
      }

      // Sort by last activity (most recent first)
      conversationsData.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

      setConversations(conversationsData);
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    }
  };

  const formatLastMessageTime = (timestamp: string) => {
    try {
      // Parse the timestamp properly
      const messageDate = new Date(timestamp);
      
      // Validate the date
      if (isNaN(messageDate.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return 'Invalid Date';
      }
      
      const now = new Date();
      
      // Calculate difference in milliseconds
      const diffMs = now.getTime() - messageDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // If message is from today (less than 24 hours ago and same calendar day)
      if (diffDays === 0 && messageDate.toDateString() === now.toDateString()) {
        const result = messageDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        return result;
      }
      
      // If message is from yesterday (1 day ago)
      if (diffDays === 1) {
        return "Yesterday";
      }
      
      // If message is from this week (less than 7 days ago)
      if (diffDays < 7) {
        const result = messageDate.toLocaleDateString([], { weekday: 'short' });
        return result;
      }
      
      // If message is older than a week
      const result = messageDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
      return result;
      
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid Date';
    }
  };

  const getLastMessagePreview = (conversation: ConversationData) => {
    if (!conversation.lastMessage) {
      return "No messages yet";
    }
    
    const { content, direction, sender_name } = conversation.lastMessage;
    const isOutbound = direction === 'outbound';
    const prefix = isOutbound ? "You: " : "";
    
    return `${prefix}${content}`.length > 50 
      ? `${prefix}${content.substring(0, 50)}...` 
      : `${prefix}${content}`;
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.patient.name.toLowerCase().includes(searchLower) ||
      (conv.patient.phone && conv.patient.phone.includes(searchLower)) ||
      (conv.patient.email && conv.patient.email.toLowerCase().includes(searchLower)) ||
      (conv.lastMessage && conv.lastMessage.content.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    if (activeTab === "messages") {
      fetchConversations();
    }
  }, [activeTab]);

  // Set up real-time subscription for all messages to update conversation list
  useEffect(() => {
    if (isAuthenticated && activeTab === "messages") {
      const subscription = supabase
        .channel('all_messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages'
          }, 
          (payload) => {
            console.log('Real-time message received:', payload);
            // Auto-refresh conversations when any message is received
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isAuthenticated, activeTab]);

  // Refresh conversations when a new message is sent
  const handleRefreshConversations = () => {
    fetchConversations();
  };

  // Add callback to refresh conversations when messages are sent
  const handleMessageSent = () => {
    // Refresh conversations to show updated order and last message
    fetchConversations();
  };

  // Main Dashboard
  const Dashboard = () => (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Healthcare Communication Hub</h1>
          <p className="text-gray-600">Manage patient communications across all channels</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesSentToday}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConversations}</div>
            <p className="text-xs text-muted-foreground">
              24 started today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("messages")}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Start New Conversation
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("sms")}>
              <Send className="w-4 h-4 mr-2" />
              Send Bulk SMS
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("contacts")}>
              <Users className="w-4 h-4 mr-2" />
              Manage Contacts
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Message sent to John Doe</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New patient added: Jane Smith</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Bulk SMS campaign completed</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-blue-900 mb-2">HIPAA Compliant</h3>
            <p className="text-sm text-blue-700">End-to-end encryption and secure messaging</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-green-900 mb-2">Multi-Channel</h3>
            <p className="text-sm text-green-700">SMS, Email, and WhatsApp integration</p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-purple-900 mb-2">Real-time Analytics</h3>
            <p className="text-sm text-purple-700">Track engagement and response rates</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm p-1">
              <img 
                src="/narayan-logo.png" 
                alt="Narayan Pharmacy Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to background with initials if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>';
                }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Narayan Pharmacy</h2>
              <p className="text-xs text-gray-500">MedConnect Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("messages")}
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              Messages
              {stats.activeConversations > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {stats.activeConversations}
                </Badge>
              )}
            </Button>
            
            <Button
              variant={activeTab === "contacts" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("contacts")}
            >
              <Users className="w-4 h-4 mr-3" />
              Contacts
              <Badge variant="secondary" className="ml-auto">
                {stats.totalPatients}
              </Badge>
            </Button>
            
            <Button
              variant={activeTab === "sms" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("sms")}
            >
              <Send className="w-4 h-4 mr-3" />
              SMS Manager
            </Button>
            
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("analytics")}
            >
              <TrendingUp className="w-4 h-4 mr-3" />
              Analytics
            </Button>
            
            <Button
              variant={activeTab === "team" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("team")}
            >
              <Users className="w-4 h-4 mr-3" />
              Team
            </Button>
            
            <Button
              variant={activeTab === "automation" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("automation")}
            >
              <Zap className="w-4 h-4 mr-3" />
              Automation
            </Button>
            
            <Button
              variant={activeTab === "omnichannel" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("omnichannel")}
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              Omnichannel
            </Button>
            
            {currentUser?.role === 'admin' && (
              <Button
                variant={activeTab === "admin" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("admin")}
              >
                <Shield className="w-4 h-4 mr-3" />
                Admin
              </Button>
            )}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-blue-600 text-white">
                {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0] || currentUser?.first_name?.[1]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser?.first_name} {currentUser?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {currentUser?.role?.replace('_', ' ')}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {activeTab === "dashboard" ? "Dashboard" : 
                 activeTab === "messages" ? "Messages" :
                 activeTab === "contacts" ? "Patient Contacts" :
                 activeTab === "sms" ? "SMS Manager" :
                 activeTab === "analytics" ? "Analytics & Reports" :
                 activeTab === "team" ? "Team Management" :
                 activeTab === "automation" ? "SMS Automation" :
                 activeTab === "omnichannel" ? "Omnichannel Messaging" :
                 activeTab === "admin" ? "Admin Dashboard" : activeTab}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search..." className="pl-10 w-64" />
              </div>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "dashboard" && <Dashboard />}
          
          {activeTab === "messages" && (
            <div className="h-full flex">
              <div className="w-96 bg-white border-r border-gray-200">
                <div className="h-full flex flex-col">
                  {/* Messages Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                        <Badge variant="secondary">{patients.length}</Badge>
                      </div>
                      <Button 
                        onClick={() => setShowNewMessageDialog(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Message
                      </Button>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search conversations..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">
                          {searchQuery ? "No conversations found" : "No conversations yet"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {searchQuery ? "Try adjusting your search" : "Start messaging your patients"}
                        </p>
                        {!searchQuery && (
                          <Button 
                            onClick={() => setShowNewMessageDialog(true)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Start First Conversation
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conversation) => {
                          const isSelected = selectedPatient?.id === conversation.patient.id;
                          
                          return (
                            <div
                              key={conversation.patient.id}
                              onClick={() => {
                                handlePatientSelect(conversation.patient);
                                handleRefreshConversations(); // Refresh to update unread counts
                              }}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                isSelected ? "bg-blue-50 border-r-2 border-blue-600" : ""
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="relative">
                                  <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-blue-600 text-white font-medium">
                                      {conversation.patient.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  {conversation.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className={`font-medium truncate ${
                                      conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {conversation.patient.name}
                                    </h3>
                                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                      {conversation.lastMessage 
                                        ? formatLastMessageTime(conversation.lastActivity)
                                        : "New patient"
                                      }
                                    </span>
                                  </div>
                                  
                                  <p className={`text-sm truncate mb-2 ${
                                    conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                                  }`}>
                                    {getLastMessagePreview(conversation)}
                                  </p>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1">
                                      <Badge 
                                        variant="secondary" 
                                        className="text-xs"
                                      >
                                        {conversation.patient.preferred_channel.toUpperCase()}
                                      </Badge>
                                      {conversation.patient.phone && (
                                        <Phone className="w-3 h-3 text-gray-400" />
                                      )}
                                      {conversation.patient.email && (
                                        <Mail className="w-3 h-3 text-gray-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 flex">
                <div className="flex-1">
                  {selectedPatient ? (
                    <div className="h-full flex flex-col">
                      {/* Chat Header with Patient Info Toggle */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-blue-600 text-white font-medium">
                              {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{selectedPatient.name}</h3>
                            <p className="text-sm text-gray-500">
                              {selectedPatient.phone || selectedPatient.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" title="Call patient">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant={showPatientProfile ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setShowPatientProfile(!showPatientProfile)}
                            title="Patient details"
                          >
                            Patient Info
                          </Button>
                        </div>
                      </div>
                      {/* Message Area */}
                      <div className="flex-1">
                        <MessageArea 
                          patient={selectedPatient} 
                          channel={selectedChannel} 
                          onMessageSent={handleMessageSent}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a patient to start messaging</h3>
                        <p className="text-gray-500">Choose from your patient list to begin a conversation</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Patient Profile Sidebar */}
                {showPatientProfile && selectedPatient && (
                  <div className="w-80 border-l border-gray-200 bg-white">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Patient Profile</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowPatientProfile(false)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    <PatientProfile patient={selectedPatient} />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === "contacts" && <ContactsManager onPatientUpdated={handlePatientUpdated} onPatientDeleted={handlePatientDeleted} />}
          {activeTab === "sms" && <BulkSMSManager />}
          {activeTab === "analytics" && <SMSAnalyticsDashboard />}
          {activeTab === "team" && <TeamSidebar selectedInbox={null} onSelectInbox={() => {}} />}
          {activeTab === "automation" && <SMSAutomation />}
          {activeTab === "omnichannel" && <OmnichannelMessaging />}
          {activeTab === "admin" && <AdminDashboard />}
        </div>
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}
        onPatientSelected={handleNewMessagePatientSelected}
        onPatientAdded={handleNewMessagePatientAdded}
      />
    </div>
  );
}
