import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Settings, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  user_id: string;
}

interface SharedInbox {
  id: string;
  name: string;
  phone_number: string;
  description: string | null;
  unreadCount?: number;
}

interface TeamSidebarProps {
  selectedInbox: SharedInbox | null;
  onSelectInbox: (inbox: SharedInbox) => void;
}

export const TeamSidebar = ({ selectedInbox, onSelectInbox }: TeamSidebarProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sharedInboxes, setSharedInboxes] = useState<SharedInbox[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Load real team data - customize for your pharmacy
      setSharedInboxes([]);
      setTeamMembers([]);
      
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'pharmacist':
        return 'bg-blue-100 text-blue-800';
      case 'pharmacy technician':
        return 'bg-green-100 text-green-800';
      case 'customer service':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="w-80 border-r border-gray-200 bg-white p-4">
        <div className="text-gray-500">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
      {/* Team Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            PharmaCare Team
          </h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              toast({
                title: "Team Settings",
                description: "Team management settings will be available soon",
              });
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Shared Inboxes */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Shared Inboxes</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={() => {
              toast({
                title: "Add Shared Inbox",
                description: "Shared inbox creation will be available soon",
              });
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-2">
          {sharedInboxes.map((inbox) => (
            <Card
              key={inbox.id}
              className={`p-3 cursor-pointer transition-colors ${
                selectedInbox?.id === inbox.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectInbox(inbox)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {inbox.name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {inbox.phone_number}
                  </p>
                  {inbox.description && (
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {inbox.description}
                    </p>
                  )}
                </div>
                {inbox.unreadCount && inbox.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] text-xs">
                    {inbox.unreadCount}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Members */}
      <div className="flex-1 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Team Members</h3>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                  member.is_active ? 'bg-green-400' : 'bg-gray-300'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {member.name}
                </p>
                <Badge className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                  {member.role}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 