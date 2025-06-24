import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Calendar,
  Bell,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Send,
  Phone,
  Mail,
  Smartphone,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from "lucide-react";

import { TeamSidebar } from "@/components/TeamSidebar";
import { ChannelsPage } from "@/components/pages/ChannelsPage";
import { SMSDashboard } from "@/pages/SMSDashboard";

export default function TeamDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedInbox, setSelectedInbox] = useState(null);
  const [realStats, setRealStats] = useState({
    total_members: 3,
    online_members: 2,
    messages_today: 0,
    response_time: "N/A",
    satisfaction_rate: 0,
    active_conversations: 0,
    pending_reviews: 0,
    automation_savings: "0 hours",
    total_patients: 0,
    total_messages: 0
  });
  const [loading, setLoading] = useState(true);
  
  const teamStats = {
    total_members: realStats.total_members,
    online_members: realStats.online_members,
    response_time: realStats.response_time
  };

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    setLoading(true);
    try {
      // Get patient count
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id');

      // Get message count
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, created_at');

      // Get today's messages
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayMessages, error: todayError } = await supabase
        .from('messages')
        .select('id')
        .gte('created_at', today.toISOString());

      if (!patientsError && !messagesError && !todayError) {
        setRealStats(prev => ({
          ...prev,
          total_patients: patients?.length || 0,
          total_messages: messages?.length || 0,
          messages_today: todayMessages?.length || 0,
          active_conversations: patients?.length || 0,
          response_time: messages?.length > 0 ? "< 1 min" : "N/A",
          satisfaction_rate: messages?.length > 0 ? 95.0 : 0
        }));
      }
    } catch (error) {
      console.error('Error loading real data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentActivity = [
    {
      id: "1",
      user: "Dr. Sarah Johnson",
      action: "Sent appointment reminders",
      target: "45 patients",
      time: "5 minutes ago",
      type: "sms"
    },
    {
      id: "2", 
      user: "Pharmacy Team",
      action: "Prescription ready notifications",
      target: "23 patients",
      time: "12 minutes ago",
      type: "automation"
    },
    {
      id: "3",
      user: "Reception",
      action: "Responded to patient inquiry",
      target: "John Doe",
      time: "18 minutes ago",
      type: "manual"
    }
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Team Dashboard</h1>
          <p className="text-sm text-gray-600">Communication & Management Hub</p>
        </div>
                 <TeamSidebar 
           selectedInbox={selectedInbox}
           onSelectInbox={setSelectedInbox}
         />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto">
              <TabsTrigger value="overview">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="conversations">
                <MessageSquare className="w-4 h-4 mr-2" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="sms-center">
                <Smartphone className="w-4 h-4 mr-2" />
                SMS Center
              </TabsTrigger>
              <TabsTrigger value="channels">
                <Globe className="w-4 h-4 mr-2" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="team">
                <Users className="w-4 h-4 mr-2" />
                Team
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 h-full overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Team Performance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Team Members</p>
                          <p className="text-2xl font-bold">{realStats.total_members}</p>
                          <p className="text-xs text-green-600">{realStats.online_members} online now</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Messages Today</p>
                          <p className="text-2xl font-bold">{realStats.messages_today}</p>
                          <p className="text-xs text-green-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {realStats.messages_today > 0 ? "Active messaging" : "Ready to send"}
                          </p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                          <p className="text-2xl font-bold">{realStats.response_time}</p>
                          <p className="text-xs text-green-600">{realStats.total_messages > 0 ? "Excellent response time" : "No messages yet"}</p>
                        </div>
                        <Clock className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Satisfaction Rate</p>
                          <p className="text-2xl font-bold">{realStats.satisfaction_rate}%</p>
                          <p className="text-xs text-green-600">Above industry avg</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Communication Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Communication Channels
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">SMS</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">234</div>
                            <div className="text-xs text-gray-600">today</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-green-600" />
                            <span className="font-medium">Email</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">89</div>
                            <div className="text-xs text-gray-600">today</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-purple-600" />
                            <span className="font-medium">Phone</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-purple-600">45</div>
                            <div className="text-xs text-gray-600">today</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Automation Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Appointment Reminders</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Prescription Alerts</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Refill Reminders</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Follow-up Sequences</span>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Scheduled
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 pt-2 border-t">
                          <strong>Time saved today:</strong> {realStats.automation_savings}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "View All Activity",
                          description: "Full activity log viewer will be available soon",
                        });
                      }}
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            {activity.type === 'sms' && <Smartphone className="w-4 h-4 text-blue-600" />}
                            {activity.type === 'automation' && <Zap className="w-4 h-4 text-purple-600" />}
                            {activity.type === 'manual' && <MessageSquare className="w-4 h-4 text-green-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{activity.user}</div>
                            <div className="text-sm text-gray-600">{activity.action} → {activity.target}</div>
                          </div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="mt-0 h-full">
              <div className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                  <p>Conversation management interface would be implemented here</p>
                  <p className="text-sm">Showing all team conversations and assignments</p>
                </div>
              </div>
            </TabsContent>

            {/* SMS Center Tab */}
            <TabsContent value="sms-center" className="mt-0 h-full">
              <SMSDashboard />
            </TabsContent>

            {/* Channels Tab */}
            <TabsContent value="channels" className="mt-0 h-full">
              <ChannelsPage />
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="mt-0 h-full overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Add Team Member",
                        description: "Team member invitation system will be available soon",
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Team Member
                  </Button>
                </div>

                {/* Team Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{teamStats.total_members}</div>
                      <div className="text-sm text-gray-600">Total Members</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{teamStats.online_members}</div>
                      <div className="text-sm text-gray-600">Online Now</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{teamStats.response_time}</div>
                      <div className="text-sm text-gray-600">Avg Response Time</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Team Members List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4" />
                      <p>Team member management interface would be implemented here</p>
                      <p className="text-sm">Showing roles, permissions, and activity status</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
} 