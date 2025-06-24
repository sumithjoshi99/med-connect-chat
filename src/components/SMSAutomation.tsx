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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Zap, 
  Clock, 
  Calendar as CalendarIcon,
  Bell,
  Repeat,
  MessageSquare,
  User,
  Pill,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Loader2,
  RefreshCw,
  BarChart3,
  Target,
  Filter,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, addHours } from "date-fns";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger_type: 'appointment' | 'prescription' | 'refill' | 'birthday' | 'lab_result' | 'custom';
  trigger_conditions: any;
  message_template: string;
  timing: {
    delay_amount: number;
    delay_unit: 'minutes' | 'hours' | 'days' | 'weeks';
    send_time?: string; // HH:MM format
    business_hours_only: boolean;
  };
  is_active: boolean;
  created_at: string;
  last_triggered: string;
  total_sent: number;
  success_rate: number;
}

interface AutomationSequence {
  id: string;
  name: string;
  description: string;
  steps: AutomationStep[];
  trigger_type: string;
  is_active: boolean;
  enrolled_patients: number;
  completion_rate: number;
  created_at: string;
}

interface AutomationStep {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_days: number;
  message_template: string;
  condition?: string;
  is_active: boolean;
}

interface AutomationLog {
  id: string;
  rule_id: string;
  patient_id: string;
  message_content: string;
  scheduled_date: string;
  sent_date?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  error_message?: string;
  created_at: string;
}

interface AutomationStats {
  total_rules: number;
  active_rules: number;
  messages_sent_today: number;
  success_rate: number;
  pending_messages: number;
}

export const SMSAutomation = () => {
  const [activeTab, setActiveTab] = useState("rules");
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationSequences, setAutomationSequences] = useState<AutomationSequence[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Rule Creation State
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    trigger_type: "appointment" as const,
    trigger_conditions: {},
    message_template: "",
    timing: {
      delay_amount: 24,
      delay_unit: "hours" as const,
      send_time: "09:00",
      business_hours_only: true
    }
  });

  // Sequence Creation State
  const [newSequence, setNewSequence] = useState({
    name: "",
    description: "",
    trigger_type: "prescription",
    steps: [] as Partial<AutomationStep>[]
  });

  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showSequenceDialog, setShowSequenceDialog] = useState(false);

  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAutomationRules(),
        loadAutomationSequences(),
        loadAutomationLogs(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading automation data:', error);
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAutomationRules = async () => {
    const mockRules: AutomationRule[] = [
      {
        id: "1",
        name: "Appointment Reminder - 24h",
        description: "Send reminder 24 hours before scheduled appointment",
        trigger_type: "appointment",
        trigger_conditions: {
          appointment_type: "all",
          department: "all"
        },
        message_template: "Hi {{patient_name}}, this is a reminder for your appointment tomorrow at {{appointment_time}} with {{doctor_name}}. Please reply CONFIRM or call {{pharmacy_phone}} if you need to reschedule.",
        timing: {
          delay_amount: 24,
          delay_unit: "hours",
          send_time: "09:00",
          business_hours_only: true
        },
        is_active: true,
        created_at: new Date().toISOString(),
        last_triggered: new Date(Date.now() - 3600000).toISOString(),
        total_sent: 456,
        success_rate: 94.2
      },
      {
        id: "2",
        name: "Prescription Ready Notification",
        description: "Notify when prescription is ready for pickup",
        trigger_type: "prescription",
        trigger_conditions: {
          status: "ready",
          priority: "all"
        },
        message_template: "{{patient_name}}, your prescription {{medication_name}} is ready for pickup at {{pharmacy_name}}. Store hours: {{store_hours}}. Questions? Call {{pharmacy_phone}}.",
        timing: {
          delay_amount: 0,
          delay_unit: "minutes",
          send_time: "10:00",
          business_hours_only: true
        },
        is_active: true,
        created_at: new Date().toISOString(),
        last_triggered: new Date(Date.now() - 1800000).toISOString(),
        total_sent: 789,
        success_rate: 96.7
      },
      {
        id: "3",
        name: "Refill Reminder - 7 days",
        description: "Remind patients to refill medications 7 days before running out",
        trigger_type: "refill",
        trigger_conditions: {
          days_remaining: 7,
          medication_type: "chronic"
        },
        message_template: "Time to refill your {{medication_name}}! You have about 7 days of medication left. Call {{pharmacy_phone}} or use our app to request a refill.",
        timing: {
          delay_amount: 0,
          delay_unit: "hours",
          send_time: "10:30",
          business_hours_only: true
        },
        is_active: true,
        created_at: new Date().toISOString(),
        last_triggered: new Date(Date.now() - 7200000).toISOString(),
        total_sent: 234,
        success_rate: 91.8
      },
      {
        id: "4",
        name: "Birthday Wishes",
        description: "Send birthday wishes with special offer",
        trigger_type: "birthday",
        trigger_conditions: {},
        message_template: "Happy Birthday {{patient_name}}! 🎉 Thank you for trusting {{pharmacy_name}} with your healthcare. Enjoy 10% off your next purchase with code BIRTHDAY10.",
        timing: {
          delay_amount: 0,
          delay_unit: "hours",
          send_time: "09:00",
          business_hours_only: true
        },
        is_active: true,
        created_at: new Date().toISOString(),
        last_triggered: new Date(Date.now() - 86400000).toISOString(),
        total_sent: 23,
        success_rate: 100.0
      }
    ];
    setAutomationRules(mockRules);
  };

  const loadAutomationSequences = async () => {
    const mockSequences: AutomationSequence[] = [
      {
        id: "1",
        name: "New Patient Onboarding",
        description: "Welcome sequence for new patients",
        steps: [
          {
            id: "1",
            sequence_id: "1",
            step_number: 1,
            delay_days: 0,
            message_template: "Welcome to {{pharmacy_name}}! We're excited to serve your healthcare needs. Download our app for easy prescription management.",
            is_active: true
          },
          {
            id: "2",
            sequence_id: "1",
            step_number: 2,
            delay_days: 3,
            message_template: "Hi {{patient_name}}, just checking in! Did you have any questions about our services? Our pharmacists are here to help.",
            is_active: true
          },
          {
            id: "3",
            sequence_id: "1",
            step_number: 3,
            delay_days: 7,
            message_template: "Remember to ask your doctor about any medication questions. We offer free consultations! Call {{pharmacy_phone}} to schedule.",
            is_active: true
          }
        ],
        trigger_type: "new_patient",
        is_active: true,
        enrolled_patients: 45,
        completion_rate: 78.5,
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        name: "Diabetes Management Support",
        description: "Educational series for diabetes patients",
        steps: [
          {
            id: "4",
            sequence_id: "2",
            step_number: 1,
            delay_days: 0,
            message_template: "Managing diabetes starts with medication adherence. Take your medications as prescribed and monitor your blood sugar regularly.",
            is_active: true
          },
          {
            id: "5",
            sequence_id: "2",
            step_number: 2,
            delay_days: 7,
            message_template: "Diet tip: Focus on whole grains, lean proteins, and vegetables. Limit processed foods and sugary drinks.",
            is_active: true
          },
          {
            id: "6",
            sequence_id: "2",
            step_number: 3,
            delay_days: 14,
            message_template: "Regular exercise helps control blood sugar. Even a 30-minute walk daily can make a big difference!",
            is_active: true
          }
        ],
        trigger_type: "condition_diabetes",
        is_active: true,
        enrolled_patients: 156,
        completion_rate: 85.2,
        created_at: new Date().toISOString()
      }
    ];
    setAutomationSequences(mockSequences);
  };

  const loadAutomationLogs = async () => {
    const mockLogs: AutomationLog[] = [
      {
        id: "1",
        rule_id: "1",
        patient_id: "patient_123",
        message_content: "Hi John, this is a reminder for your appointment tomorrow at 2:30 PM with Dr. Smith.",
        scheduled_date: addHours(new Date(), 2).toISOString(),
        status: "pending",
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        rule_id: "2",
        patient_id: "patient_456",
        message_content: "Sarah, your prescription Metformin is ready for pickup at Downtown Pharmacy.",
        scheduled_date: new Date().toISOString(),
        sent_date: new Date().toISOString(),
        status: "delivered",
        created_at: new Date().toISOString()
      }
    ];
    setAutomationLogs(mockLogs);
  };

  const loadStats = async () => {
    setStats({
      total_rules: 4,
      active_rules: 4,
      messages_sent_today: 23,
      success_rate: 94.2,
      pending_messages: 12
    });
  };

  const createAutomationRule = async () => {
    if (!newRule.name || !newRule.message_template) {
      toast({
        title: "Error",
        description: "Please fill in rule name and message template",
        variant: "destructive",
      });
      return;
    }

    const rule: AutomationRule = {
      id: Date.now().toString(),
      ...newRule,
      is_active: true,
      created_at: new Date().toISOString(),
      last_triggered: "",
      total_sent: 0,
      success_rate: 0
    };

    setAutomationRules(prev => [...prev, rule]);
    
    setNewRule({
      name: "",
      description: "",
      trigger_type: "appointment",
      trigger_conditions: {},
      message_template: "",
      timing: {
        delay_amount: 24,
        delay_unit: "hours",
        send_time: "09:00",
        business_hours_only: true
      }
    });

    setShowRuleDialog(false);

    toast({
      title: "Automation Rule Created",
      description: "SMS automation rule created successfully",
    });
  };

  const toggleRuleStatus = async (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, is_active: !rule.is_active }
        : rule
    ));

    toast({
      title: "Rule Status Updated",
      description: "Automation rule status changed",
    });
  };

  const createAutomationSequence = async () => {
    if (!newSequence.name || newSequence.steps.length === 0) {
      toast({
        title: "Error",
        description: "Please provide sequence name and at least one step",
        variant: "destructive",
      });
      return;
    }

    const sequence: AutomationSequence = {
      id: Date.now().toString(),
      name: newSequence.name,
      description: newSequence.description,
      steps: newSequence.steps.map((step, index) => ({
        id: `${Date.now()}_${index}`,
        sequence_id: Date.now().toString(),
        step_number: index + 1,
        delay_days: step.delay_days || 0,
        message_template: step.message_template || "",
        condition: step.condition,
        is_active: true
      })),
      trigger_type: newSequence.trigger_type,
      is_active: true,
      enrolled_patients: 0,
      completion_rate: 0,
      created_at: new Date().toISOString()
    };

    setAutomationSequences(prev => [...prev, sequence]);
    
    setNewSequence({
      name: "",
      description: "",
      trigger_type: "prescription",
      steps: []
    });

    setShowSequenceDialog(false);

    toast({
      title: "Automation Sequence Created",
      description: "SMS automation sequence created successfully",
    });
  };

  const addSequenceStep = () => {
    setNewSequence(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          step_number: prev.steps.length + 1,
          delay_days: 0,
          message_template: "",
          is_active: true
        }
      ]
    }));
  };

  const updateSequenceStep = (index: number, field: string, value: any) => {
    setNewSequence(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeSequenceStep = (index: number) => {
    setNewSequence(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'prescription': return <Pill className="w-4 h-4" />;
      case 'refill': return <Repeat className="w-4 h-4" />;
      case 'birthday': return <Bell className="w-4 h-4" />;
      case 'lab_result': return <Stethoscope className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SMS Automation</h1>
              <p className="text-gray-600">Automated workflows and intelligent messaging</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={loadAutomationData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Rule
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-600">Total Rules</div>
              <div className="text-xl font-bold text-blue-900">{stats.total_rules}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-600">Active Rules</div>
              <div className="text-xl font-bold text-green-900">{stats.active_rules}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-600">Sent Today</div>
              <div className="text-xl font-bold text-purple-900">{stats.messages_sent_today}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-sm text-orange-600">Success Rate</div>
              <div className="text-xl font-bold text-orange-900">{stats.success_rate}%</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-sm text-yellow-600">Pending</div>
              <div className="text-xl font-bold text-yellow-900">{stats.pending_messages}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b px-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="rules">
                <Zap className="w-4 h-4 mr-2" />
                Rules
              </TabsTrigger>
              <TabsTrigger value="sequences">
                <Target className="w-4 h-4 mr-2" />
                Sequences
              </TabsTrigger>
              <TabsTrigger value="logs">
                <BarChart3 className="w-4 h-4 mr-2" />
                Activity Logs
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Rules Tab */}
            <TabsContent value="rules" className="mt-0">
              <div className="space-y-6">
                {/* Rules List */}
                <div className="grid gap-6">
                  {automationRules.map((rule) => (
                    <Card key={rule.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              {getTriggerIcon(rule.trigger_type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">{rule.name}</h3>
                              <p className="text-gray-600 text-sm mb-2">{rule.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Trigger: {rule.trigger_type}</span>
                                <span>Delay: {rule.timing.delay_amount} {rule.timing.delay_unit}</span>
                                <span>Send time: {rule.timing.send_time}</span>
                                <span>Sent: {rule.total_sent}</span>
                                <span>Success: {rule.success_rate}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={() => toggleRuleStatus(rule.id)}
                            />
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                toast({
                                  title: "Rule Details",
                                  description: `${rule.name}: ${rule.description}\nTrigger: ${rule.trigger_type}\nTotal Sent: ${rule.total_sent}`,
                                });
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setNewRule({
                                  name: rule.name + " (Copy)",
                                  description: rule.description,
                                  trigger_type: rule.trigger_type,
                                  trigger_conditions: rule.trigger_conditions,
                                  message_template: rule.message_template,
                                  timing: rule.timing
                                });
                                setShowRuleDialog(true);
                                toast({
                                  title: "Rule Loaded",
                                  description: "Rule loaded for editing",
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
                                  toast({
                                    title: "Rule Deleted",
                                    description: `${rule.name} has been deleted`,
                                  });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-medium mb-1">Message Template:</div>
                          <div className="text-sm text-gray-700">{rule.message_template}</div>
                        </div>

                        {rule.last_triggered && (
                          <div className="mt-3 text-xs text-gray-500">
                            Last triggered: {format(new Date(rule.last_triggered), 'PPP at p')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Sequences Tab */}
            <TabsContent value="sequences" className="mt-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Automation Sequences</h2>
                  <Dialog open={showSequenceDialog} onOpenChange={setShowSequenceDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Sequence
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Automation Sequence</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Sequence Name</Label>
                            <Input
                              value={newSequence.name}
                              onChange={(e) => setNewSequence(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., New Patient Onboarding"
                            />
                          </div>
                          <div>
                            <Label>Trigger Type</Label>
                            <Select
                              value={newSequence.trigger_type}
                              onValueChange={(value) => setNewSequence(prev => ({ ...prev, trigger_type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new_patient">New Patient</SelectItem>
                                <SelectItem value="prescription">New Prescription</SelectItem>
                                <SelectItem value="condition_diabetes">Diabetes Diagnosis</SelectItem>
                                <SelectItem value="condition_hypertension">Hypertension Diagnosis</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newSequence.description}
                            onChange={(e) => setNewSequence(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description of this sequence"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <Label>Sequence Steps</Label>
                            <Button size="sm" onClick={addSequenceStep}>
                              <Plus className="w-4 h-4 mr-1" />
                              Add Step
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            {newSequence.steps.map((step, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium">Step {index + 1}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeSequenceStep(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                  <div>
                                    <Label className="text-xs">Delay (days)</Label>
                                    <Input
                                      type="number"
                                      value={step.delay_days || 0}
                                      onChange={(e) => updateSequenceStep(index, 'delay_days', parseInt(e.target.value))}
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Message Template</Label>
                                  <Textarea
                                    value={step.message_template || ""}
                                    onChange={(e) => updateSequenceStep(index, 'message_template', e.target.value)}
                                    placeholder="Message content for this step..."
                                    rows={2}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowSequenceDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={createAutomationSequence}>
                            Create Sequence
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Sequences List */}
                <div className="grid gap-6">
                  {automationSequences.map((sequence) => (
                    <Card key={sequence.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-lg">{sequence.name}</h3>
                            <p className="text-gray-600 text-sm mb-2">{sequence.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Trigger: {sequence.trigger_type}</span>
                              <span>Steps: {sequence.steps.length}</span>
                              <span>Enrolled: {sequence.enrolled_patients}</span>
                              <span>Completion: {sequence.completion_rate}%</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch checked={sequence.is_active} />
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                toast({
                                  title: "Sequence Details",
                                  description: `${sequence.name}: ${sequence.description}\nSteps: ${sequence.steps.length}\nEnrolled: ${sequence.enrolled_patients}`,
                                });
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setNewSequence({
                                  name: sequence.name + " (Copy)",
                                  description: sequence.description,
                                  trigger_type: sequence.trigger_type,
                                  steps: sequence.steps.map(step => ({
                                    delay_days: step.delay_days,
                                    message_template: step.message_template,
                                    condition: step.condition
                                  }))
                                });
                                setShowSequenceDialog(true);
                                toast({
                                  title: "Sequence Loaded",
                                  description: "Sequence loaded for editing",
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {sequence.steps.map((step, index) => (
                            <div key={step.id} className="bg-gray-50 rounded p-3">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium">Step {step.step_number}</span>
                                <span className="text-xs text-gray-500">
                                  {step.delay_days === 0 ? 'Immediate' : `+${step.delay_days} days`}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{step.message_template}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Activity Logs Tab */}
            <TabsContent value="logs" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Automation Activity Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {automationLogs.map((log) => {
                      const rule = automationRules.find(r => r.id === log.rule_id);
                      return (
                        <div key={log.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">{rule?.name || 'Unknown Rule'}</div>
                              <div className="text-sm text-gray-600">Patient ID: {log.patient_id}</div>
                            </div>
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                          </div>
                          
                          <div className="bg-gray-50 rounded p-2 text-sm mb-2">
                            {log.message_content}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            <span>Scheduled: {format(new Date(log.scheduled_date), 'PPP at p')}</span>
                            {log.sent_date && (
                              <span className="ml-4">Sent: {format(new Date(log.sent_date), 'PPP at p')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Create Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rule Name</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Appointment Reminder"
                />
              </div>
              <div>
                <Label>Trigger Type</Label>
                <Select
                  value={newRule.trigger_type}
                  onValueChange={(value: any) => setNewRule(prev => ({ ...prev, trigger_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="refill">Refill</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="lab_result">Lab Result</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={newRule.description}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this rule"
              />
            </div>

            <div>
              <Label>Message Template</Label>
              <Textarea
                value={newRule.message_template}
                onChange={(e) => setNewRule(prev => ({ ...prev, message_template: e.target.value }))}
                placeholder="Use {{variable_name}} for dynamic content"
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Delay Amount</Label>
                <Input
                  type="number"
                  value={newRule.timing.delay_amount}
                  onChange={(e) => setNewRule(prev => ({ 
                    ...prev, 
                    timing: { ...prev.timing, delay_amount: parseInt(e.target.value) } 
                  }))}
                />
              </div>
              <div>
                <Label>Delay Unit</Label>
                <Select
                  value={newRule.timing.delay_unit}
                  onValueChange={(value: any) => setNewRule(prev => ({ 
                    ...prev, 
                    timing: { ...prev.timing, delay_unit: value } 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Send Time</Label>
                <Input
                  type="time"
                  value={newRule.timing.send_time}
                  onChange={(e) => setNewRule(prev => ({ 
                    ...prev, 
                    timing: { ...prev.timing, send_time: e.target.value } 
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={newRule.timing.business_hours_only}
                onCheckedChange={(checked) => setNewRule(prev => ({ 
                  ...prev, 
                  timing: { ...prev.timing, business_hours_only: checked } 
                }))}
              />
              <Label>Only send during business hours</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createAutomationRule}>
                Create Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 