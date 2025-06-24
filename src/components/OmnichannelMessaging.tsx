import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Search, 
  Filter,
  Settings,
  Smartphone,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  Phone,
  Mail,
  Zap,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Plus,
  Link,
  Wifi,
  WifiOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  name: string;
  type: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'pending';
  lastActivity: string;
  messageCount: number;
  responseTime: string;
  color: string;
}

interface Conversation {
  id: string;
  patientName: string;
  channel: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  status: 'active' | 'pending' | 'archived';
  avatar?: string;
}

export const OmnichannelMessaging = () => {
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState("conversations");
  const { toast } = useToast();

  // Mock data - will be replaced with real API calls
  const channels: Channel[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      type: 'whatsapp',
      icon: <MessageSquare className="w-5 h-5" />,
      status: 'connected',
      lastActivity: '2 minutes ago',
      messageCount: 156,
      responseTime: '< 1 min',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'instagram',
      name: 'Instagram Direct',
      type: 'instagram',
      icon: <Instagram className="w-5 h-5" />,
      status: 'connected',
      lastActivity: '15 minutes ago',
      messageCount: 89,
      responseTime: '2 min',
      color: 'bg-pink-100 text-pink-800'
    },
    {
      id: 'facebook',
      name: 'Facebook Messenger',
      type: 'facebook',
      icon: <Facebook className="w-5 h-5" />,
      status: 'connected',
      lastActivity: '1 hour ago',
      messageCount: 45,
      responseTime: '5 min',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'apple',
      name: 'Apple Business Chat',
      type: 'apple',
      icon: <Smartphone className="w-5 h-5" />,
      status: 'pending',
      lastActivity: 'Never',
      messageCount: 0,
      responseTime: '-',
      color: 'bg-gray-100 text-gray-800'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      type: 'telegram',
      icon: <MessageSquare className="w-5 h-5" />,
      status: 'disconnected',
      lastActivity: '2 days ago',
      messageCount: 23,
      responseTime: '-',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'twitter',
      name: 'Twitter DM',
      type: 'twitter',
      icon: <Twitter className="w-5 h-5" />,
      status: 'connected',
      lastActivity: '30 minutes ago',
      messageCount: 12,
      responseTime: '10 min',
      color: 'bg-sky-100 text-sky-800'
    },
    {
      id: 'webchat',
      name: 'Website Chat',
      type: 'webchat',
      icon: <Globe className="w-5 h-5" />,
      status: 'connected',
      lastActivity: '5 minutes ago',
      messageCount: 78,
      responseTime: '< 1 min',
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  const conversations: Conversation[] = [
    {
      id: '1',
      patientName: 'Sarah Johnson',
      channel: 'whatsapp',
      lastMessage: 'Thank you for the appointment reminder!',
      timestamp: '2 minutes ago',
      unreadCount: 0,
      status: 'active'
    },
    {
      id: '2',
      patientName: 'Mike Chen',
      channel: 'instagram',
      lastMessage: 'Can I reschedule my appointment for next week?',
      timestamp: '15 minutes ago',
      unreadCount: 2,
      status: 'pending'
    },
    {
      id: '3',
      patientName: 'Emma Davis',
      channel: 'facebook',
      lastMessage: 'I have a question about my prescription',
      timestamp: '1 hour ago',
      unreadCount: 1,
      status: 'active'
    },
    {
      id: '4',
      patientName: 'David Wilson',
      channel: 'twitter',
      lastMessage: 'Is the clinic open on weekends?',
      timestamp: '30 minutes ago',
      unreadCount: 1,
      status: 'pending'
    },
    {
      id: '5',
      patientName: 'Lisa Rodriguez',
      channel: 'webchat',
      lastMessage: 'Thank you for the great service!',
      timestamp: '5 minutes ago',
      unreadCount: 0,
      status: 'active'
    }
  ];

  const getChannelIcon = (channelType: string) => {
    const channel = channels.find(c => c.type === channelType);
    return channel?.icon || <MessageSquare className="w-4 h-4" />;
  };

  const getChannelColor = (channelType: string) => {
    const channel = channels.find(c => c.type === channelType);
    return channel?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = selectedChannel === "all" || conv.channel === selectedChannel;
    return matchesSearch && matchesChannel;
  });

  const totalMessages = channels.reduce((sum, channel) => sum + channel.messageCount, 0);
  const connectedChannels = channels.filter(c => c.status === 'connected').length;
  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Omnichannel Messaging</h1>
              <p className="text-gray-600">Manage all patient communications from every platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Channel Settings
            </Button>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Connect Channel
            </Button>
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
                  <p className="text-sm font-medium text-gray-600">Connected Channels</p>
                  <p className="text-2xl font-bold text-purple-600">{connectedChannels}</p>
                </div>
                <Wifi className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-blue-600">{totalMessages}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                  <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-green-600">2.5min</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="conversations" className="flex-1 overflow-hidden mt-4">
            <div className="h-full flex">
              {/* Conversation List */}
              <div className="w-96 bg-white border-r border-gray-200">
                <div className="h-full flex flex-col">
                  {/* Search and Filter */}
                  <div className="p-4 border-b border-gray-200 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                      <SelectTrigger>
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        {channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.type}>
                            <div className="flex items-center space-x-2">
                              {channel.icon}
                              <span>{channel.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conversations */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">No conversations found</h3>
                        <p className="text-sm text-gray-500">
                          {searchQuery ? "Try adjusting your search" : "Connect channels to start receiving messages"}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conversation) => {
                          const isSelected = selectedConversation?.id === conversation.id;
                          
                          return (
                            <div
                              key={conversation.id}
                              onClick={() => setSelectedConversation(conversation)}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                isSelected ? "bg-blue-50 border-r-2 border-blue-600" : ""
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="relative">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                                      {conversation.patientName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-1 -right-1">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${getChannelColor(conversation.channel)}`}>
                                      {getChannelIcon(conversation.channel)}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-medium text-gray-900 truncate">{conversation.patientName}</h3>
                                    <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 truncate mb-2">{conversation.lastMessage}</p>
                                  <div className="flex items-center justify-between">
                                    <Badge className={getChannelColor(conversation.channel)}>
                                      {conversation.channel}
                                    </Badge>
                                    {conversation.unreadCount > 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        {conversation.unreadCount}
                                      </Badge>
                                    )}
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

              {/* Chat Area */}
              <div className="flex-1">
                {selectedConversation ? (
                  <div className="h-full flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                              {selectedConversation.patientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{selectedConversation.patientName}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={getChannelColor(selectedConversation.channel)}>
                                {selectedConversation.channel}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                Last seen {selectedConversation.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Patient Profile</DropdownMenuItem>
                            <DropdownMenuItem>Archive Conversation</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Block Contact</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 bg-gray-50">
                      <div className="text-center text-gray-500 mt-20">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                        <p>Real-time messaging interface will be integrated when channels are connected</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                      <p className="text-gray-500">Choose a conversation from the list to view messages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="channels" className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map((channel) => (
                <Card key={channel.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${channel.color}`}>
                          {channel.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{channel.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(channel.status)}
                            <span className={`text-sm font-medium ${
                              channel.status === 'connected' ? 'text-green-600' :
                              channel.status === 'disconnected' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Configure Channel</DropdownMenuItem>
                          <DropdownMenuItem>View Analytics</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {channel.status === 'connected' ? (
                            <DropdownMenuItem className="text-red-600">Disconnect</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600">Connect</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Messages</p>
                        <p className="font-semibold">{channel.messageCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Response Time</p>
                        <p className="font-semibold">{channel.responseTime}</p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600">Last Activity</p>
                      <p className="font-semibold">{channel.lastActivity}</p>
                    </div>
                    <Button 
                      className="w-full"
                      variant={channel.status === 'connected' ? 'outline' : 'default'}
                      disabled={channel.status === 'pending'}
                    >
                      {channel.status === 'connected' ? (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </>
                      ) : channel.status === 'pending' ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Setting Up...
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-auto p-6">
            <div className="text-center py-20">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-500 mb-6">Comprehensive analytics and reporting will be available here</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium">Message Analytics</h4>
                    <p className="text-sm text-gray-500 mt-1">Volume, engagement, response times</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium">Patient Insights</h4>
                    <p className="text-sm text-gray-500 mt-1">Behavior, preferences, satisfaction</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium">Performance Metrics</h4>
                    <p className="text-sm text-gray-500 mt-1">KPIs, trends, recommendations</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 