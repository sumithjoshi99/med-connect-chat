
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, Phone, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock message data
const mockMessages = [
  {
    id: 1,
    senderId: "pharmacy",
    senderName: "PharmaCare",
    content: "Hello Sarah! Your prescription for Lisinopril is ready for pickup. Would you like to schedule a pickup time?",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    channel: "sms",
    status: "delivered"
  },
  {
    id: 2,
    senderId: "P001",
    senderName: "Sarah Johnson",
    content: "Hi! Yes, I can pick it up tomorrow afternoon. What time do you close?",
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    channel: "sms",
    status: "read"
  },
  {
    id: 3,
    senderId: "pharmacy",
    senderName: "PharmaCare",
    content: "We close at 8 PM. You can pick it up anytime before then. Do you have any questions about the medication?",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    channel: "sms",
    status: "delivered"
  },
  {
    id: 4,
    senderId: "P001",
    senderName: "Sarah Johnson",
    content: "Thank you for the prescription reminder",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    channel: "sms",
    status: "read"
  }
];

interface MessageAreaProps {
  patient: any;
  channel: string;
}

export const MessageArea = ({ patient, channel }: MessageAreaProps) => {
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    console.log(`Sending ${channel} message to ${patient.name}: ${newMessage}`);

    // Simulate API call
    const message = {
      id: messages.length + 1,
      senderId: "pharmacy",
      senderName: "PharmaCare",
      content: newMessage,
      timestamp: new Date(),
      channel: channel,
      status: "sending"
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, status: "delivered" } : msg
        )
      );
      setIsLoading(false);
      
      toast({
        title: "Message sent",
        description: `${channel.toUpperCase()} message sent to ${patient.name}`,
      });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getChannelBadgeColor = (messageChannel: string) => {
    switch (messageChannel) {
      case 'sms':
        return 'bg-green-100 text-green-800';
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'phone':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Channel Info Header */}
      <div className="bg-blue-50 border-b border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">
              Communicating via {channel.toUpperCase()}
            </h4>
            <p className="text-sm text-blue-700">
              {channel === 'sms' && `Phone: ${patient.phone}`}
              {channel === 'email' && `Email: ${patient.email}`}
              {channel === 'phone' && `Phone: ${patient.phone}`}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button variant="outline" size="sm">
              <Video className="h-4 w-4 mr-2" />
              Video
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === 'pharmacy' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] ${
                message.senderId === 'pharmacy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              } rounded-lg p-3 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">
                  {message.senderName}
                </span>
                <Badge 
                  className={`text-xs ${getChannelBadgeColor(message.channel)}`}
                >
                  {message.channel.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm mb-2">{message.content}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${
                  message.senderId === 'pharmacy' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                {message.senderId === 'pharmacy' && (
                  <span className={`text-xs ${
                    message.status === 'delivered' ? 'text-blue-100' : 
                    message.status === 'sending' ? 'text-blue-200' : 'text-blue-100'
                  }`}>
                    {message.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              placeholder={`Type your ${channel} message...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="p-2"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="p-2"
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="p-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
