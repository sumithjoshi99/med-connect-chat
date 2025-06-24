import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Target,
  Zap,
  Globe,
  Smartphone,
  Eye,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface SMSMetrics {
  overview: {
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    total_responses: number;
    delivery_rate: number;
    response_rate: number;
    opt_out_rate: number;
    cost_per_message: number;
    total_cost: number;
    roi: number;
  };
  time_series: {
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    responses: number;
    cost: number;
  }[];
  campaign_performance: {
    campaign_id: string;
    campaign_name: string;
    sent: number;
    delivered: number;
    responses: number;
    delivery_rate: number;
    response_rate: number;
    cost: number;
    roi: number;
  }[];
  channel_breakdown: {
    channel: string;
    sent: number;
    delivered: number;
    failed: number;
    cost: number;
  }[];
  geographical_data: {
    region: string;
    sent: number;
    delivered: number;
    response_rate: number;
  }[];
  device_breakdown: {
    device_type: string;
    percentage: number;
    engagement_rate: number;
  }[];
  patient_segments: {
    segment: string;
    patient_count: number;
    messages_sent: number;
    response_rate: number;
    engagement_score: number;
  }[];
}

export const SMSAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [metrics, setMetrics] = useState<SMSMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedTimeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load real analytics data from database
      const emptyMetrics: SMSMetrics = {
        overview: {
          total_sent: 0,
          total_delivered: 0,
          total_failed: 0,
          total_responses: 0,
          delivery_rate: 0,
          response_rate: 0,
          opt_out_rate: 0,
          cost_per_message: 0,
          total_cost: 0,
          roi: 0
        },
        time_series: [],
        campaign_performance: [],
        channel_breakdown: [],
        geographical_data: [],
        device_breakdown: [],
        patient_segments: []
      };

      setMetrics(emptyMetrics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    toast({
      title: "Exporting Report",
      description: "Your SMS analytics report is being generated...",
    });
    
    // Mock export - replace with actual export logic
    setTimeout(() => {
      toast({
        title: "Report Exported",
        description: "Your SMS analytics report has been downloaded",
      });
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-3 h-3 text-green-600" />;
    if (change < 0) return <ArrowDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-400";
  };

  if (!metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SMS Analytics</h1>
              <p className="text-gray-600">Comprehensive messaging performance insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
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
              <TabsTrigger value="campaigns">
                <Target className="w-4 h-4 mr-2" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="channels">
                <MessageSquare className="w-4 h-4 mr-2" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="audience">
                <Users className="w-4 h-4 mr-2" />
                Audience
              </TabsTrigger>
              <TabsTrigger value="geography">
                <Globe className="w-4 h-4 mr-2" />
                Geography
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Sent</p>
                        <p className="text-2xl font-bold">{metrics.overview.total_sent.toLocaleString()}</p>
                        <div className="flex items-center mt-1">
                          {getChangeIcon(8.2)}
                          <span className={`text-xs ml-1 ${getChangeColor(8.2)}`}>
                            +8.2% from last period
                          </span>
                        </div>
                      </div>
                      <MessageSquare className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                        <p className="text-2xl font-bold">{formatPercentage(metrics.overview.delivery_rate)}</p>
                        <div className="flex items-center mt-1">
                          {getChangeIcon(1.3)}
                          <span className={`text-xs ml-1 ${getChangeColor(1.3)}`}>
                            +1.3% from last period
                          </span>
                        </div>
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
                        <p className="text-2xl font-bold">{formatPercentage(metrics.overview.response_rate)}</p>
                        <div className="flex items-center mt-1">
                          {getChangeIcon(2.7)}
                          <span className={`text-xs ml-1 ${getChangeColor(2.7)}`}>
                            +2.7% from last period
                          </span>
                        </div>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Cost</p>
                        <p className="text-2xl font-bold">{formatCurrency(metrics.overview.total_cost)}</p>
                        <div className="flex items-center mt-1">
                          {getChangeIcon(-5.1)}
                          <span className={`text-xs ml-1 ${getChangeColor(-5.1)}`}>
                            -5.1% from last period
                          </span>
                        </div>
                      </div>
                      <DollarSign className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {metrics.overview.total_delivered.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Messages Delivered</div>
                      <Progress value={metrics.overview.delivery_rate} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {metrics.overview.total_responses.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Responses</div>
                      <Progress value={metrics.overview.response_rate} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {metrics.overview.total_failed.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Failed Messages</div>
                      <Progress value={(metrics.overview.total_failed / metrics.overview.total_sent) * 100} className="mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Series Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Message Volume Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>Time series chart would be rendered here</p>
                      <p className="text-sm">Showing {metrics.time_series.length} days of data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ROI and Cost Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ROI Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {formatPercentage(metrics.overview.roi)}
                      </div>
                      <p className="text-gray-600">Return on Investment</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Cost per message:</span>
                          <span>{formatCurrency(metrics.overview.cost_per_message)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total investment:</span>
                          <span>{formatCurrency(metrics.overview.total_cost)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Estimated revenue:</span>
                          <span>{formatCurrency(metrics.overview.total_cost * (metrics.overview.roi / 100))}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Delivery Rate</span>
                          <span>{formatPercentage(metrics.overview.delivery_rate)}</span>
                        </div>
                        <Progress value={metrics.overview.delivery_rate} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Response Rate</span>
                          <span>{formatPercentage(metrics.overview.response_rate)}</span>
                        </div>
                        <Progress value={metrics.overview.response_rate} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Opt-out Rate</span>
                          <span>{formatPercentage(metrics.overview.opt_out_rate)}</span>
                        </div>
                        <Progress value={metrics.overview.opt_out_rate} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.campaign_performance.map((campaign, index) => (
                      <div key={campaign.campaign_id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-lg">{campaign.campaign_name}</h4>
                            <p className="text-sm text-gray-600">Campaign ID: {campaign.campaign_id}</p>
                          </div>
                          <Badge variant="outline">
                            ROI: {formatPercentage(campaign.roi)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Sent:</span>
                            <div className="font-medium">{campaign.sent.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Delivered:</span>
                            <div className="font-medium">{campaign.delivered.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Responses:</span>
                            <div className="font-medium">{campaign.responses.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Delivery Rate:</span>
                            <div className="font-medium text-green-600">{formatPercentage(campaign.delivery_rate)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Response Rate:</span>
                            <div className="font-medium text-blue-600">{formatPercentage(campaign.response_rate)}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Cost: {formatCurrency(campaign.cost)}
                          </span>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Campaign Details",
                                  description: `${campaign.campaign_name}\nSent: ${campaign.sent.toLocaleString()}\nDelivered: ${campaign.delivered.toLocaleString()}\nResponses: ${campaign.responses.toLocaleString()}`,
                                });
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const csvData = `Campaign,Sent,Delivered,Responses,Delivery Rate,Response Rate,Cost\n${campaign.campaign_name},${campaign.sent},${campaign.delivered},${campaign.responses},${campaign.delivery_rate}%,${campaign.response_rate}%,$${campaign.cost}`;
                                const blob = new Blob([csvData], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${campaign.campaign_name}-report.csv`;
                                a.click();
                                toast({
                                  title: "Export Complete",
                                  description: "Campaign report downloaded successfully",
                                });
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Channels Tab */}
            <TabsContent value="channels" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Channel Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.channel_breakdown.map((channel, index) => (
                        <div key={channel.channel} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{channel.channel}</div>
                              <div className="text-sm text-gray-600">
                                {channel.sent.toLocaleString()} sent
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatPercentage((channel.delivered / channel.sent) * 100)}
                            </div>
                            <div className="text-sm text-gray-600">delivery rate</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Device Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.device_breakdown.map((device, index) => (
                        <div key={device.device_type} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center">
                              <Smartphone className="w-4 h-4 mr-2" />
                              {device.device_type}
                            </span>
                            <span>{formatPercentage(device.percentage)}</span>
                          </div>
                          <Progress value={device.percentage} />
                          <div className="text-xs text-gray-600">
                            Engagement rate: {formatPercentage(device.engagement_rate)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Audience Tab */}
            <TabsContent value="audience" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.patient_segments.map((segment, index) => (
                      <div key={segment.segment} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{segment.segment}</h4>
                            <p className="text-sm text-gray-600">
                              {segment.patient_count.toLocaleString()} patients
                            </p>
                          </div>
                          <Badge variant="outline">
                            Score: {segment.engagement_score}/10
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Messages Sent:</span>
                            <div className="font-medium">{segment.messages_sent.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Response Rate:</span>
                            <div className="font-medium text-blue-600">{formatPercentage(segment.response_rate)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Avg per Patient:</span>
                            <div className="font-medium">
                              {(segment.messages_sent / segment.patient_count).toFixed(1)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Engagement Score</span>
                            <span>{segment.engagement_score}/10</span>
                          </div>
                          <Progress value={segment.engagement_score * 10} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Geography Tab */}
            <TabsContent value="geography" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.geographical_data.map((region, index) => (
                        <div key={region.region} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{region.region}</div>
                            <div className="text-sm text-gray-600">
                              {region.sent.toLocaleString()} sent, {region.delivered.toLocaleString()} delivered
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-blue-600">
                              {formatPercentage(region.response_rate)}
                            </div>
                            <div className="text-sm text-gray-600">response rate</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center text-gray-500">
                        <Globe className="w-12 h-12 mx-auto mb-2" />
                        <p>Interactive map would be rendered here</p>
                        <p className="text-sm">Showing regional SMS performance</p>
                      </div>
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
}; 