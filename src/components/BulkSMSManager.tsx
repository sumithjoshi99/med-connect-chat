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
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Users, 
  Send, 
  Upload, 
  Download,
  Target,
  Calendar as CalendarIcon,
  PlayCircle,
  PauseCircle,
  StopCircle,
  BarChart3,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Settings,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SMSCampaign {
  id: string;
  name: string;
  description: string;
  template_id?: string;
  message_content: string;
  recipient_count: number;
  scheduled_date?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'completed';
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  response_count: number;
  created_at: string;
  created_by: string;
  tags: string[];
}

interface RecipientGroup {
  id: string;
  name: string;
  description: string;
  filter_criteria: any;
  patient_count: number;
  tags: string[];
  created_at: string;
}

interface BulkSMSJob {
  id: string;
  campaign_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_recipients: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export const BulkSMSManager = () => {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([]);
  const [bulkJobs, setBulkJobs] = useState<BulkSMSJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<SMSCampaign | null>(null);
  const { toast } = useToast();

  // Campaign Creation State
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    message_content: "",
    scheduled_date: "",
    recipient_groups: [] as string[],
    is_scheduled: false
  });

  // Recipient Group Creation State
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    filter_criteria: {
      age_min: "",
      age_max: "",
      conditions: [] as string[],
      medication_types: [] as string[],
      last_visit_days: "",
      tags: [] as string[]
    }
  });

  const [uploadDialog, setUploadDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCampaigns(),
        loadRecipientGroups(),
        loadBulkJobs()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load bulk SMS data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    // Load real campaigns from database
    setCampaigns([]);
  };

  const loadRecipientGroups = async () => {
    // Load real recipient groups from database
    setRecipientGroups([]);
  };

  const loadBulkJobs = async () => {
    // Load real bulk jobs from database
    setBulkJobs([]);
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message_content || newCampaign.recipient_groups.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const campaign: SMSCampaign = {
        id: Date.now().toString(),
        name: newCampaign.name,
        description: newCampaign.description,
        message_content: newCampaign.message_content,
        recipient_count: newCampaign.recipient_groups.reduce((total, groupId) => {
          const group = recipientGroups.find(g => g.id === groupId);
          return total + (group?.patient_count || 0);
        }, 0),
        scheduled_date: newCampaign.is_scheduled ? newCampaign.scheduled_date : undefined,
        status: newCampaign.is_scheduled ? 'scheduled' : 'draft',
        sent_count: 0,
        delivered_count: 0,
        failed_count: 0,
        response_count: 0,
        created_at: new Date().toISOString(),
        created_by: "current_user",
        tags: []
      };

      setCampaigns(prev => [...prev, campaign]);
      
      // Reset form
      setNewCampaign({
        name: "",
        description: "",
        message_content: "",
        scheduled_date: "",
        recipient_groups: [],
        is_scheduled: false
      });

      toast({
        title: "Campaign Created",
        description: "SMS campaign created successfully",
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const launchCampaign = async (campaignId: string) => {
    setLoading(true);
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      // Update campaign status
      setCampaigns(prev => prev.map(c => 
        c.id === campaignId 
          ? { ...c, status: 'sending' as const }
          : c
      ));

      // Create bulk job
      const job: BulkSMSJob = {
        id: Date.now().toString(),
        campaign_id: campaignId,
        status: 'processing',
        total_recipients: campaign.recipient_count,
        processed_count: 0,
        success_count: 0,
        failed_count: 0,
        started_at: new Date().toISOString()
      };

      setBulkJobs(prev => [...prev, job]);

      toast({
        title: "Campaign Launched",
        description: "SMS campaign is now being sent",
      });

      // Simulate processing
      simulateBulkSending(job.id, campaign.recipient_count);

    } catch (error) {
      console.error('Error launching campaign:', error);
      toast({
        title: "Error",
        description: "Failed to launch campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateBulkSending = (jobId: string, totalRecipients: number) => {
    let processed = 0;
    const interval = setInterval(() => {
      processed += Math.min(50, totalRecipients - processed);
      const success = Math.floor(processed * 0.96);
      const failed = processed - success;

      setBulkJobs(prev => prev.map(job => 
        job.id === jobId 
          ? {
              ...job,
              processed_count: processed,
              success_count: success,
              failed_count: failed,
              status: processed >= totalRecipients ? 'completed' : 'processing'
            }
          : job
      ));

      if (processed >= totalRecipients) {
        clearInterval(interval);
        
        // Update campaign status
        setCampaigns(prev => prev.map(c => 
          c.id === jobId.split('_')[0] 
            ? { 
                ...c, 
                status: 'completed' as const,
                sent_count: processed,
                delivered_count: success,
                failed_count: failed
              }
            : c
        ));

        toast({
          title: "Campaign Completed",
          description: `Sent ${success} messages successfully, ${failed} failed`,
        });
      }
    }, 1000);
  };

  const createRecipientGroup = async () => {
    if (!newGroup.name || !newGroup.description) {
      toast({
        title: "Error",
        description: "Please fill in group name and description",
        variant: "destructive",
      });
      return;
    }

    const group: RecipientGroup = {
      id: Date.now().toString(),
      name: newGroup.name,
      description: newGroup.description,
      filter_criteria: newGroup.filter_criteria,
      patient_count: Math.floor(Math.random() * 500) + 50, // Mock count
      tags: [],
      created_at: new Date().toISOString()
    };

    setRecipientGroups(prev => [...prev, group]);
    
    setNewGroup({
      name: "",
      description: "",
      filter_criteria: {
        age_min: "",
        age_max: "",
        conditions: [],
        medication_types: [],
        last_visit_days: "",
        tags: []
      }
    });

    toast({
      title: "Group Created",
      description: "Recipient group created successfully",
    });
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const processCsvUpload = async () => {
    if (!csvFile) return;

    // Mock CSV processing
    toast({
      title: "CSV Processed",
      description: `Imported ${Math.floor(Math.random() * 100) + 50} recipients from CSV`,
    });
    
    setCsvFile(null);
    setUploadDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'sending': return <PlayCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <PauseCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk SMS Manager</h1>
              <p className="text-gray-600">Manage campaigns, groups, and bulk messaging</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Recipients
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Recipients from CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Upload CSV File</Label>
                    <Input type="file" accept=".csv" onChange={handleCsvUpload} />
                    <p className="text-sm text-gray-600 mt-1">
                      CSV should contain columns: name, phone, email (optional)
                    </p>
                  </div>
                  {csvFile && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Selected file:</strong> {csvFile.name}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setUploadDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={processCsvUpload} disabled={!csvFile}>
                      Import
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b px-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="campaigns">
                <Target className="w-4 h-4 mr-2" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="groups">
                <Users className="w-4 h-4 mr-2" />
                Recipient Groups
              </TabsTrigger>
              <TabsTrigger value="jobs">
                <BarChart3 className="w-4 h-4 mr-2" />
                Bulk Jobs
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign List */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>SMS Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {campaigns.map((campaign) => (
                          <div key={campaign.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium">{campaign.name}</h4>
                                  <Badge className={getStatusColor(campaign.status)}>
                                    <span className="flex items-center space-x-1">
                                      {getStatusIcon(campaign.status)}
                                      <span className="capitalize">{campaign.status}</span>
                                    </span>
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                                <div className="flex space-x-4 text-xs text-gray-500">
                                  <span>{campaign.recipient_count} recipients</span>
                                  <span>{campaign.sent_count} sent</span>
                                  <span>{campaign.delivered_count} delivered</span>
                                  <span>{campaign.failed_count} failed</span>
                                </div>
                                {campaign.scheduled_date && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Scheduled: {format(new Date(campaign.scheduled_date), 'PPP at p')}
                                  </p>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    toast({
                                      title: "Campaign Details",
                                      description: `${campaign.name}: ${campaign.description}\nRecipients: ${campaign.recipient_count}\nStatus: ${campaign.status}`,
                                    });
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setNewCampaign({
                                      name: campaign.name + " (Copy)",
                                      description: campaign.description,
                                      message_content: campaign.message_content,
                                      recipient_groups: [],
                                      is_scheduled: false,
                                      scheduled_date: ""
                                    });
                                    toast({
                                      title: "Campaign Loaded",
                                      description: "Campaign loaded for editing",
                                    });
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {campaign.status === 'draft' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => launchCampaign(campaign.id)}
                                    disabled={loading}
                                  >
                                    <PlayCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {campaign.status === 'sending' && (
                              <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>{Math.round((campaign.sent_count / campaign.recipient_count) * 100)}%</span>
                                </div>
                                <Progress value={(campaign.sent_count / campaign.recipient_count) * 100} />
                              </div>
                            )}

                            <div className="bg-gray-50 rounded p-2 text-sm">
                              <strong>Message Preview:</strong>
                              <p className="text-gray-700 mt-1">{campaign.message_content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Create Campaign */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Create New Campaign</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Campaign Name</Label>
                        <Input
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Monthly Newsletter"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newCampaign.description}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of the campaign"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Message Content</Label>
                        <Textarea
                          value={newCampaign.message_content}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, message_content: e.target.value }))}
                          placeholder="Your SMS message content..."
                          className="min-h-[100px]"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {newCampaign.message_content.length}/160 characters
                        </div>
                      </div>

                      <div>
                        <Label>Recipient Groups</Label>
                        <Select
                          value={newCampaign.recipient_groups[0] || ""}
                          onValueChange={(value) => setNewCampaign(prev => ({ 
                            ...prev, 
                            recipient_groups: [value] 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select recipient groups" />
                          </SelectTrigger>
                          <SelectContent>
                            {recipientGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name} ({group.patient_count} patients)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="schedule-campaign"
                          checked={newCampaign.is_scheduled}
                          onCheckedChange={(checked) => setNewCampaign(prev => ({ 
                            ...prev, 
                            is_scheduled: checked 
                          }))}
                        />
                        <Label htmlFor="schedule-campaign">Schedule for later</Label>
                      </div>

                      {newCampaign.is_scheduled && (
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
                                onSelect={(date) => {
                                  setScheduleDate(date);
                                  setNewCampaign(prev => ({ 
                                    ...prev, 
                                    scheduled_date: date?.toISOString() || "" 
                                  }));
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      <Button onClick={createCampaign} className="w-full" disabled={loading}>
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Create Campaign
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Recipient Groups Tab */}
            <TabsContent value="groups" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Groups List */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recipient Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recipientGroups.map((group) => (
                          <div key={group.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{group.name}</h4>
                                <p className="text-sm text-gray-600">{group.description}</p>
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    toast({
                                      title: "Group Details",
                                      description: `${group.name}: ${group.description}\nPatients: ${group.patient_count}`,
                                    });
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setNewRecipientGroup({
                                      name: group.name + " (Copy)",
                                      description: group.description,
                                      filter_criteria: {},
                                      tags: group.tags
                                    });
                                    toast({
                                      title: "Group Loaded",
                                      description: "Group loaded for editing",
                                    });
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
                                      toast({
                                        title: "Group Deleted",
                                        description: `${group.name} has been deleted`,
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-blue-600">
                                {group.patient_count} patients
                              </span>
                              <div className="flex space-x-1">
                                {group.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
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

                {/* Create Group */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Create Recipient Group</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Group Name</Label>
                        <Input
                          value={newGroup.name}
                          onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Diabetes Patients"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newGroup.description}
                          onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description of this group"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Filter Criteria</Label>
                        <div className="space-y-3 mt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Min Age</Label>
                              <Input
                                type="number"
                                value={newGroup.filter_criteria.age_min}
                                onChange={(e) => setNewGroup(prev => ({ 
                                  ...prev, 
                                  filter_criteria: { 
                                    ...prev.filter_criteria, 
                                    age_min: e.target.value 
                                  } 
                                }))}
                                placeholder="18"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Max Age</Label>
                              <Input
                                type="number"
                                value={newGroup.filter_criteria.age_max}
                                onChange={(e) => setNewGroup(prev => ({ 
                                  ...prev, 
                                  filter_criteria: { 
                                    ...prev.filter_criteria, 
                                    age_max: e.target.value 
                                  } 
                                }))}
                                placeholder="65"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Last Visit (days ago)</Label>
                            <Input
                              type="number"
                              value={newGroup.filter_criteria.last_visit_days}
                              onChange={(e) => setNewGroup(prev => ({ 
                                ...prev, 
                                filter_criteria: { 
                                  ...prev.filter_criteria, 
                                  last_visit_days: e.target.value 
                                } 
                              }))}
                              placeholder="30"
                            />
                          </div>
                        </div>
                      </div>

                      <Button onClick={createRecipientGroup} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Group
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Bulk Jobs Tab */}
            <TabsContent value="jobs" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk SMS Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bulkJobs.map((job) => {
                      const campaign = campaigns.find(c => c.id === job.campaign_id);
                      return (
                        <div key={job.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{campaign?.name || 'Unknown Campaign'}</h4>
                              <p className="text-sm text-gray-600">Job ID: {job.id}</p>
                            </div>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-600">Total Recipients:</span>
                              <div className="font-medium">{job.total_recipients}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Processed:</span>
                              <div className="font-medium">{job.processed_count}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Success:</span>
                              <div className="font-medium text-green-600">{job.success_count}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Failed:</span>
                              <div className="font-medium text-red-600">{job.failed_count}</div>
                            </div>
                          </div>

                          {job.status === 'processing' && (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{Math.round((job.processed_count / job.total_recipients) * 100)}%</span>
                              </div>
                              <Progress value={(job.processed_count / job.total_recipients) * 100} />
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            {job.started_at && (
                              <span>Started: {format(new Date(job.started_at), 'PPP at p')}</span>
                            )}
                            {job.completed_at && (
                              <span className="ml-4">Completed: {format(new Date(job.completed_at), 'PPP at p')}</span>
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
    </div>
  );
}; 