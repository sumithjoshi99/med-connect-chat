import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Send, 
  Users, 
  FileText, 
  Calendar as CalendarIcon,
  Clock,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Edit,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: 'appointment' | 'prescription' | 'reminder' | 'marketing' | 'emergency' | 'custom';
  variables: string[];
  usage_count: number;
  created_at: string;
  is_active: boolean;
}

interface SMSAnalytics {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  response_rate: number;
  opt_out_rate: number;
}

export const SMSManager = () => {
  const [activeTab, setActiveTab] = useState("compose");
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [analytics, setAnalytics] = useState<SMSAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Compose SMS State
  const [composeMessage, setComposeMessage] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [isScheduled, setIsScheduled] = useState(false);

  // Template Management
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    category: "custom" as const,
    variables: [] as string[]
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTemplates(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    const mockTemplates: SMSTemplate[] = [
      {
        id: "1",
        name: "Appointment Reminder",
        content: "Hi {{patient_name}}, this is a reminder for your appointment on {{appointment_date}} at {{appointment_time}}. Please reply CONFIRM or call us at {{pharmacy_phone}}.",
        category: "appointment",
        variables: ["patient_name", "appointment_date", "appointment_time", "pharmacy_phone"],
        usage_count: 45,
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "2",
        name: "Prescription Ready",
        content: "{{patient_name}}, your prescription {{medication_name}} is ready for pickup at {{pharmacy_name}}. Store hours: {{store_hours}}.",
        category: "prescription",
        variables: ["patient_name", "medication_name", "pharmacy_name", "store_hours"],
        usage_count: 123,
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "3",
        name: "Refill Reminder",
        content: "Time to refill your {{medication_name}}! You have {{refills_remaining}} refills remaining. Call {{pharmacy_phone}} or use our app.",
        category: "reminder",
        variables: ["medication_name", "refills_remaining", "pharmacy_phone"],
        usage_count: 78,
        created_at: new Date().toISOString(),
        is_active: true
      }
    ];
    setTemplates(mockTemplates);
  };

  const loadAnalytics = async () => {
    setAnalytics({
      total_sent: 1247,
      total_delivered: 1189,
      total_failed: 58,
      delivery_rate: 95.3,
      response_rate: 12.7,
      opt_out_rate: 2.1
    });
  };

  const sendSMS = async (recipients: string[], message: string, scheduled?: Date) => {
    setLoading(true);
    try {
      if (scheduled) {
        toast({
          title: "SMS Scheduled",
          description: `Message scheduled for ${format(scheduled, 'PPP at p')}`,
        });
      } else {
        for (const recipient of recipients) {
          const { error } = await supabase.functions.invoke('send-sms', {
            body: {
              to: recipient,
              message: message,
              patientId: 'bulk-' + Date.now()
            }
          });

          if (error) {
            throw error;
          }
        }

        toast({
          title: "SMS Sent Successfully",
          description: `Message sent to ${recipients.length} recipient(s)`,
        });
      }

      setComposeMessage("");
      setSelectedRecipients([]);
      setScheduleDate(undefined);
      setIsScheduled(false);

    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "SMS Failed",
        description: "Failed to send SMS message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Error",
        description: "Please fill in template name and content",
        variant: "destructive",
      });
      return;
    }

    const template: SMSTemplate = {
      id: Date.now().toString(),
      ...newTemplate,
      usage_count: 0,
      created_at: new Date().toISOString(),
      is_active: true
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: "",
      content: "",
      category: "custom",
      variables: []
    });

    toast({
      title: "Template Created",
      description: "SMS template created successfully",
    });
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.push(match[1]);
    }
    return [...new Set(variables)];
  };

  const handleTemplateContentChange = (content: string) => {
    setNewTemplate(prev => ({
      ...prev,
      content,
      variables: extractVariables(content)
    }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SMS Manager</h1>
              <p className="text-gray-600">Comprehensive SMS communication platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={loadInitialData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button>
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
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="compose">
                <Send className="w-4 h-4 mr-2" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileText className="w-4 h-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Compose Tab */}
            <TabsContent value="compose" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Message Composer */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Compose SMS
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Template Selection */}
                      <div>
                        <Label>Use Template (Optional)</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name} - {template.category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Message Content */}
                      <div>
                        <Label>Message Content</Label>
                        <Textarea
                          value={composeMessage}
                          onChange={(e) => setComposeMessage(e.target.value)}
                          placeholder="Type your SMS message here..."
                          className="min-h-[120px]"
                        />
                        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                          <span>{composeMessage.length}/160 characters</span>
                          <span>{Math.ceil(composeMessage.length / 160)} SMS part(s)</span>
                        </div>
                      </div>

                      {/* Recipients */}
                      <div>
                        <Label>Recipients</Label>
                        <div className="space-y-2">
                          <Input
                            placeholder="Enter phone numbers separated by commas"
                            onChange={(e) => setSelectedRecipients(e.target.value.split(',').map(s => s.trim()))}
                          />
                          <div className="flex flex-wrap gap-2">
                            {selectedRecipients.map((recipient, index) => (
                              <Badge key={index} variant="secondary">
                                {recipient}
                                <button
                                  onClick={() => setSelectedRecipients(prev => prev.filter((_, i) => i !== index))}
                                  className="ml-1 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Scheduling */}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="schedule-sms"
                          checked={isScheduled}
                          onCheckedChange={setIsScheduled}
                        />
                        <Label htmlFor="schedule-sms">Schedule for later</Label>
                      </div>

                      {isScheduled && (
                        <div>
                          <Label>Schedule Date & Time</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {scheduleDate ? format(scheduleDate, 'PPP at p') : 'Select date and time'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={scheduleDate}
                                onSelect={setScheduleDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      {/* Send Button */}
                      <Button
                        onClick={() => sendSMS(selectedRecipients, composeMessage, isScheduled ? scheduleDate : undefined)}
                        disabled={!composeMessage || selectedRecipients.length === 0 || loading}
                        className="w-full"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : isScheduled ? (
                          <Clock className="w-4 h-4 mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {isScheduled ? 'Schedule SMS' : 'Send SMS'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions & Preview */}
                <div className="space-y-6">
                  {/* Message Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Message Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-xs text-blue-600 mb-1">Preview</div>
                        <div className="text-sm text-gray-900">
                          {composeMessage || "Your message will appear here..."}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  {analytics && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Sent</span>
                          <span className="font-medium">{analytics.total_sent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Delivery Rate</span>
                          <span className="font-medium text-green-600">{analytics.delivery_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Response Rate</span>
                          <span className="font-medium text-blue-600">{analytics.response_rate}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template List */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>SMS Templates</CardTitle>
                      <Button 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Import Templates",
                            description: "Template import feature coming soon. You can create templates manually for now.",
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Import Templates
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {templates.map((template) => (
                          <div key={template.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{template.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    toast({
                                      title: "Template Preview",
                                      description: template.content,
                                    });
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setNewTemplate({
                                      name: template.name + " (Copy)",
                                      content: template.content,
                                      category: template.category,
                                      variables: template.variables
                                    });
                                    toast({
                                      title: "Template Loaded",
                                      description: "Template loaded for editing",
                                    });
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    navigator.clipboard.writeText(template.content);
                                    toast({
                                      title: "Copied!",
                                      description: "Template content copied to clipboard",
                                    });
                                  }}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{template.content}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>Used {template.usage_count} times</span>
                              <div className="flex space-x-2">
                                {template.variables.map((variable) => (
                                  <Badge key={variable} variant="secondary" className="text-xs">
                                    {variable}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Create Template */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Create New Template</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Template Name</Label>
                        <Input
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Appointment Reminder"
                        />
                      </div>

                      <div>
                        <Label>Category</Label>
                        <Select
                          value={newTemplate.category}
                          onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appointment">Appointment</SelectItem>
                            <SelectItem value="prescription">Prescription</SelectItem>
                            <SelectItem value="reminder">Reminder</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Template Content</Label>
                        <Textarea
                          value={newTemplate.content}
                          onChange={(e) => handleTemplateContentChange(e.target.value)}
                          placeholder="Use {{variable_name}} for dynamic content"
                          className="min-h-[100px]"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Use double curly braces for variables: {"{{patient_name}}"}
                        </div>
                      </div>

                      {newTemplate.variables.length > 0 && (
                        <div>
                          <Label>Detected Variables</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {newTemplate.variables.map((variable) => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button onClick={createTemplate} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Sent</p>
                          <p className="text-2xl font-bold">{analytics.total_sent.toLocaleString()}</p>
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
                          <p className="text-2xl font-bold text-green-600">{analytics.delivery_rate}%</p>
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
                          <p className="text-2xl font-bold text-blue-600">{analytics.response_rate}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Opt-out Rate</p>
                          <p className="text-2xl font-bold text-red-600">{analytics.opt_out_rate}%</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>SMS Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">General Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto-replies</Label>
                            <p className="text-sm text-gray-600">Automatically respond to incoming messages</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Delivery receipts</Label>
                            <p className="text-sm text-gray-600">Track message delivery status</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Opt-out compliance</Label>
                            <p className="text-sm text-gray-600">Automatically handle STOP requests</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}; 