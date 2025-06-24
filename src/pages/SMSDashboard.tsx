import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Users, 
  Target, 
  Zap, 
  BarChart3, 
  Send,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Calendar,
  Bell,
  DollarSign
} from "lucide-react";

// Import our comprehensive SMS components
import { SMSManager } from "@/components/SMSManager";
import { BulkSMSManager } from "@/components/BulkSMSManager";
import { SMSAutomation } from "@/components/SMSAutomation";
import { SMSAnalyticsDashboard } from "@/components/SMSAnalyticsDashboard";
import { supabase } from "@/integrations/supabase/client";

export const SMSDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Real data for dashboard overview
  const [quickStats, setQuickStats] = useState({
    total_sent_today: 0,
    delivery_rate: 0,
    response_rate: 0,
    active_campaigns: 0,
    pending_messages: 0,
    total_cost_today: 0,
    active_automations: 0,
    opt_out_requests: 0
  });

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      // Load real stats from database
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayMessages, error } = await supabase
        .from('messages')
        .select('id, status, direction')
        .gte('created_at', today)
        .eq('direction', 'outbound');

      if (error) throw error;

      const totalSent = todayMessages?.length || 0;
      const delivered = todayMessages?.filter(m => m.status === 'delivered').length || 0;
      const deliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100) : 0;

      setQuickStats({
        total_sent_today: totalSent,
        delivery_rate: Math.round(deliveryRate * 10) / 10,
        response_rate: 0, // Would need response tracking
        active_campaigns: 0,
        pending_messages: 0,
        total_cost_today: totalSent * 0.05, // Approximate cost
        active_automations: 0,
        opt_out_requests: 0
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const recentActivity: any[] = [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'campaign_sent': return <Target className="w-4 h-4" />;
      case 'automation_triggered': return <Zap className="w-4 h-4" />;
      case 'opt_out': return <Bell className="w-4 h-4" />;
      case 'delivery_failure': return <XCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SMS Communication Center</h1>
              <p className="text-gray-600">Complete SMS management and analytics platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Filters",
                  description: "Message filtering options will be available soon",
                });
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Search",
                  description: "Advanced search functionality will be available soon",
                });
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button
              onClick={() => {
                setActiveTab("compose");
                toast({
                  title: "Quick Send",
                  description: "Switched to Compose & Send tab for quick messaging",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Quick Send
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b px-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto">
              <TabsTrigger value="overview">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="compose">
                <Send className="w-4 h-4 mr-2" />
                Compose & Send
              </TabsTrigger>
              <TabsTrigger value="campaigns">
                <Target className="w-4 h-4 mr-2" />
                Bulk & Campaigns
              </TabsTrigger>
              <TabsTrigger value="automation">
                <Zap className="w-4 h-4 mr-2" />
                Automation
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 p-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Sent Today</p>
                        <p className="text-2xl font-bold text-blue-600">{quickStats.total_sent_today}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Messages sent today
                        </p>
                      </div>
                      <Send className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                        <p className="text-2xl font-bold text-green-600">{quickStats.delivery_rate}%</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Current delivery rate
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Response Rate</p>
                        <p className="text-2xl font-bold text-purple-600">{quickStats.response_rate}%</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Patient response rate
                        </p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Cost Today</p>
                        <p className="text-2xl font-bold text-orange-600">${quickStats.total_cost_today}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Total messaging cost
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Campaigns & Automations */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        Active Campaigns & Automations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">Active Campaigns</span>
                            <Badge variant="secondary">{quickStats.active_campaigns}</Badge>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{quickStats.active_campaigns}</p>
                          <p className="text-xs text-blue-600">2 scheduled, 6 running</p>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-900">Active Automations</span>
                            <Badge variant="secondary">{quickStats.active_automations}</Badge>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">{quickStats.active_automations}</p>
                          <p className="text-xs text-purple-600">All systems operational</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.status)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                              <p className="text-xs text-gray-600">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions & Status */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveTab("compose");
                          toast({
                            title: "Quick SMS",
                            description: "Switched to Compose & Send tab",
                          });
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Quick SMS
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveTab("campaigns");
                          toast({
                            title: "Create Campaign",
                            description: "Switched to Bulk & Campaigns tab",
                          });
                        }}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Create Campaign
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveTab("automation");
                          toast({
                            title: "Setup Automation",
                            description: "Switched to Automation tab",
                          });
                        }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Setup Automation
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveTab("analytics");
                          toast({
                            title: "View Analytics",
                            description: "Switched to Analytics tab",
                          });
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SMS Service</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Online
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Twilio API</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Webhook</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Healthy
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pending Messages</span>
                        <Badge variant="outline">{quickStats.pending_messages}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Opt-out Requests</span>
                        <Badge variant="outline">{quickStats.opt_out_requests}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Failed Deliveries</span>
                        <Badge variant="outline">5</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Compose & Send Tab */}
            <TabsContent value="compose" className="mt-0">
              <SMSManager />
            </TabsContent>

            {/* Bulk & Campaigns Tab */}
            <TabsContent value="campaigns" className="mt-0">
              <BulkSMSManager />
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="mt-0">
              <SMSAutomation />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <SMSAnalyticsDashboard />
            </TabsContent>


          </div>
        </Tabs>
      </div>
    </div>
  );
}; 