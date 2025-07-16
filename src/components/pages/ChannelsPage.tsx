import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Plus, 
  MessageSquare, 
  Phone, 
  Mail, 
  Facebook,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Webhook,
  ExternalLink,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  name: string;
  type: 'sms' | 'whatsapp' | 'email' | 'facebook' | 'phone';
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  provider: string;
  description: string;
  messagesCount: number;
  setupRequired: boolean;
  config: Record<string, any>;
  lastUsed?: string;
}

export const ChannelsPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [selectedChannelId, setSelectedChannelId] = useState("sms");
  const [showApiKeys, setShowApiKeys] = useState(false);
  const { toast } = useToast();

  const [channels, setChannels] = useState<Channel[]>([
    {
      id: 'sms',
      name: 'SMS (Twilio)',
      type: 'sms',
      status: 'connected',
      provider: 'Twilio',
      description: 'Text messaging for patient communication',
      messagesCount: 1247,
      setupRequired: false,
      config: {
        phoneNumber: '+1 (914) 222-1900',
        accountSid: 'AC956237533bdb4805ba26c3191c••••••••',
        authToken: '••••••••••••••••••••••••••••••••',
        webhookUrl: 'https://wfhslrzkjgyrxwxlyjyx.supabase.co/functions/v1/sms-webhook'
      },
      lastUsed: '2 minutes ago'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      type: 'whatsapp',
      status: 'pending',
      provider: 'Meta (WhatsApp Business API)',
      description: 'WhatsApp messaging for enhanced patient engagement',
      messagesCount: 0,
      setupRequired: true,
      config: {
        phoneNumberId: '',
        accessToken: '',
        businessAccountId: '',
        webhookUrl: 'https://your-domain.supabase.co/functions/v1/whatsapp-webhook',
        verifyToken: 'your_verify_token_here'
      }
    },
    {
      id: 'email',
      name: 'Email (SendGrid)',
      type: 'email',
      status: 'connected',
      provider: 'SendGrid',
      description: 'Email notifications and appointment reminders',
      messagesCount: 834,
      setupRequired: false,
      config: {
        fromEmail: 'support@narayanpharmacy.com',
        fromName: 'Narayan Pharmacy',
        apiKey: '••••••••••••••••••••••••••••••••',
        templateId: 'd-••••••••••••••••••••••••••••••'
      },
      lastUsed: '1 hour ago'
    },
    {
      id: 'facebook',
      name: 'Facebook Messenger',
      type: 'facebook',
      status: 'disconnected',
      provider: 'Meta (Facebook)',
      description: 'Facebook page messaging integration',
      messagesCount: 0,
      setupRequired: true,
      config: {
        pageId: '',
        pageAccessToken: '',
        appSecret: '',
        webhookUrl: 'https://your-domain.supabase.co/functions/v1/facebook-webhook'
      }
    }
  ]);



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const toggleChannelStatus = (channelId: string) => {
    setChannels(prev => prev.map(channel => {
      if (channel.id === channelId) {
        const newStatus = channel.status === 'connected' ? 'disconnected' : 'connected';
        return { ...channel, status: newStatus };
      }
      return channel;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'pending': return 'Setup Required';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'sms': return MessageSquare;
      case 'whatsapp': return MessageSquare;
      case 'email': return Mail;
      case 'facebook': return Facebook;
      case 'phone': return Phone;
      default: return MessageSquare;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communication Channels</h1>
            <p className="text-gray-600 mt-1">Configure and manage your omnichannel communication setup</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              toast({
                title: "Add Channel",
                description: "Channel setup wizard will be available soon",
              });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Channel
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Channel Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Channels</p>
                  <p className="text-2xl font-bold text-gray-900">{channels.length}</p>
                </div>
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {channels.filter(c => c.status === 'connected').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {channels.reduce((sum, c) => sum + c.messagesCount, 0).toLocaleString()}
                  </p>
                </div>
                <Send className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Setup Required</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {channels.filter(c => c.setupRequired).length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Channel Configuration Cards */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Channel Configuration</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {channels.map((channel) => {
                const IconComponent = getChannelIcon(channel.type);
                return (
                  <Card key={channel.id} className="bg-white">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            channel.status === 'connected' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <IconComponent className={`w-6 h-6 ${
                              channel.status === 'connected' ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{channel.name}</CardTitle>
                            <p className="text-sm text-gray-500">{channel.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(channel.status)}`} />
                          <Badge variant={channel.status === 'connected' ? 'default' : 'secondary'}>
                            {getStatusText(channel.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{channel.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Messages sent:</span>
                          <span className="font-medium ml-2">{channel.messagesCount.toLocaleString()}</span>
                        </div>
                        {channel.lastUsed && (
                          <div>
                            <span className="text-gray-500">Last used:</span>
                            <span className="font-medium ml-2">{channel.lastUsed}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Channel-specific configuration */}
                      {channel.status === 'connected' && (
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          {channel.type === 'sms' && (
                            <div className="text-xs text-gray-600">
                              <strong>Phone:</strong> {channel.config.phoneNumber}
                            </div>
                          )}
                          {channel.type === 'email' && (
                            <div className="text-xs text-gray-600">
                              <strong>From:</strong> {channel.config.fromEmail}
                            </div>
                          )}
                          {channel.type === 'whatsapp' && (
                            <div className="text-xs text-gray-600">
                              <strong>Business Account:</strong> {channel.config.businessAccountId || 'Not configured'}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        {channel.setupRequired ? (
                          <Button 
                            size="sm" 
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              toast({
                                title: `Setup ${channel.name}`,
                                description: "Channel configuration wizard will be available soon",
                              });
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Setup Now
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              toast({
                                title: `Configure ${channel.name}`,
                                description: "Advanced channel settings will be available soon",
                              });
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                        )}
                        

                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleChannelStatus(channel.id)}
                        >
                          {channel.status === 'connected' ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>



          {/* Webhook Configuration */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Webhook className="w-5 h-5 text-blue-600" />
                  <span>Webhook Configuration</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                >
                  {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showApiKeys ? 'Hide' : 'Show'} API Keys
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {channels.map(channel => (
                  <div key={channel.id} className="space-y-3">
                    <h4 className="font-medium text-gray-900">{channel.name}</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Webhook URL</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input 
                            value={channel.config.webhookUrl || `https://your-domain.supabase.co/functions/v1/${channel.type}-webhook`}
                            readOnly
                            className="flex-1 text-xs bg-gray-50"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(channel.config.webhookUrl || '')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {showApiKeys && channel.config.accountSid && (
                        <div>
                          <Label className="text-xs text-gray-500 uppercase tracking-wide">Account SID</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input 
                              value={channel.config.accountSid}
                              readOnly
                              className="flex-1 text-xs bg-gray-50"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(channel.config.accountSid)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Webhook Setup Instructions</p>
                    <ul className="text-blue-800 mt-2 space-y-1 list-disc list-inside">
                      <li>Configure these webhook URLs in your provider dashboards</li>
                      <li>Ensure your Supabase functions are deployed and accessible</li>
                      <li>Test webhooks using the provider's testing tools</li>
                      <li>Monitor webhook delivery in your provider's logs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 