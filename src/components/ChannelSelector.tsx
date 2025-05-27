
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, Mail, Phone, ChevronDown } from "lucide-react";

interface ChannelSelectorProps {
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
}

export const ChannelSelector = ({ selectedChannel, onChannelChange }: ChannelSelectorProps) => {
  const channels = [
    { id: 'sms', name: 'SMS', icon: MessageSquare, color: 'bg-green-100 text-green-800' },
    { id: 'email', name: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-800' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-800' },
    { id: 'facebook', name: 'Facebook', icon: MessageSquare, color: 'bg-blue-100 text-blue-800' },
    { id: 'instagram', name: 'Instagram', icon: MessageSquare, color: 'bg-pink-100 text-pink-800' },
    { id: 'phone', name: 'Phone', icon: Phone, color: 'bg-purple-100 text-purple-800' },
  ];

  const currentChannel = channels.find(channel => channel.id === selectedChannel);
  const CurrentIcon = currentChannel?.icon || MessageSquare;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentChannel?.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <DropdownMenuItem
              key={channel.id}
              onClick={() => onChannelChange(channel.id)}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{channel.name}</span>
              {selectedChannel === channel.id && (
                <Badge className={channel.color}>Active</Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
