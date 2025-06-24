import React, { useState, useEffect, useRef } from "react";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Trash2, 
  Copy,
  Check,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChannelSelector } from "./ChannelSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  patient_id: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status: string;
  sender_name: string | null;
  created_at: string;
}

type Patient = Database['public']['Tables']['patients']['Row'];

interface MessageAreaProps {
  patient: Patient;
  channel: string;
}

export const MessageArea = ({ patient, channel }: MessageAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (patient?.id) {
      fetchMessages();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel(`messages_${patient.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `patient_id=eq.${patient.id}`
          }, 
          () => {
            console.log('Message changed, refreshing...');
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [patient?.id]);

  const fetchMessages = async () => {
    if (!patient?.id) return;
    
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it's a 10-digit US number, add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If it's an 11-digit number starting with 1, add +
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // If it already has a country code, return as is (but ensure + prefix)
    if (digits.length > 11) {
      return phone.startsWith('+') ? phone : `+${digits}`;
    }
    
    // Default: return with + if not present
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  const sendSMS = async (content: string) => {
    if (!patient.phone) {
      throw new Error('Patient phone number is required for SMS');
    }

    const formattedPhone = formatPhoneNumber(patient.phone);
    console.log('Attempting to send SMS via edge function...');
    console.log('Original phone:', patient.phone);
    console.log('Formatted phone:', formattedPhone);
    console.log('Message content:', content);

    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: formattedPhone,
          message: content,
          patientId: patient.id
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error details:', error);
        throw new Error(`SMS service error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to invoke SMS function:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    setIsTyping(true);
    console.log(`Sending ${channel} message to ${patient.name}: ${newMessage}`);

    try {
      // Store the message in the database first
      const { error: dbError } = await supabase
        .from('messages')
        .insert({
          patient_id: patient.id,
          channel: channel,
          direction: 'outbound',
          content: newMessage,
          sender_name: 'MedConnect',
          status: 'sending'
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Message saved to database successfully');

      // If it's an SMS, actually send it via Twilio
      if (channel === 'sms' && patient.phone) {
        try {
          console.log('Attempting to send SMS via Twilio...');
          await sendSMS(newMessage);
          console.log('SMS sent successfully via Twilio');
          
          // Update message status to sent
          await supabase
            .from('messages')
            .update({ status: 'sent' })
            .eq('patient_id', patient.id)
            .eq('content', newMessage)
            .eq('direction', 'outbound')
            .order('created_at', { ascending: false })
            .limit(1);
            
        } catch (smsError) {
          console.error('Failed to send SMS:', smsError);
          // Update message status to failed
          await supabase
            .from('messages')
            .update({ status: 'failed' })
            .eq('patient_id', patient.id)
            .eq('content', newMessage)
            .eq('direction', 'outbound')
            .order('created_at', { ascending: false })
            .limit(1);
          
          throw new Error(`SMS failed: ${smsError instanceof Error ? smsError.message : 'Unknown error'}`);
        }
      } else {
        // For non-SMS channels, just mark as sent (simulation)
        await supabase
          .from('messages')
          .update({ status: 'sent' })
          .eq('patient_id', patient.id)
          .eq('content', newMessage)
          .eq('direction', 'outbound')
          .order('created_at', { ascending: false })
          .limit(1);
      }

      setNewMessage("");
      
      // Refresh messages to show the new one
      await fetchMessages();
      
      toast({
        title: "Message sent",
        description: channel === 'sms' ? `SMS sent to ${patient.name}` : `${channel.toUpperCase()} message sent to ${patient.name}`,
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: "Message deleted",
        description: "Message has been removed",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-blue-500" />;
      case 'delivered':
        return <Check className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isOutbound = message.direction === 'outbound';
    
    return (
      <div className={cn(
        "flex mb-4 group",
        isOutbound ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "flex items-end space-x-2 max-w-[70%]",
          isOutbound ? "flex-row-reverse space-x-reverse" : "flex-row"
        )}>
          {!isOutbound && (
            <Avatar className="w-8 h-8 mb-1">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className={cn(
            "relative px-4 py-3 rounded-2xl shadow-sm",
            isOutbound 
              ? "bg-blue-500 text-white rounded-br-md" 
              : "bg-white border border-gray-200 rounded-bl-md"
          )}>
            <p className="text-sm leading-relaxed break-words">
              {message.content}
            </p>
            
            <div className={cn(
              "flex items-center justify-between mt-2 text-xs gap-2",
              isOutbound ? "text-blue-100" : "text-gray-500"
            )}>
              <span>{formatTime(message.created_at)}</span>
              {isOutbound && (
                <div className="flex items-center space-x-1">
                  {getStatusIcon(message.status)}
                </div>
              )}
            </div>
            
            {/* Message actions (visible on hover) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                    isOutbound ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200"
                  )}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => copyMessage(message.content)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => deleteMessage(message.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  if (loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{patient.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {channel === 'sms' && patient.phone && (
                  <span>{patient.phone}</span>
                )}
                {channel === 'email' && patient.email && (
                  <span>{patient.email}</span>
                )}
                <Badge variant="secondary" className="text-xs">
                  {channel.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ChannelSelector 
              selectedChannel={channel}
              onChannelChange={() => {}} // Channel changing handled at parent level
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (patient.phone) {
                  window.open(`tel:${patient.phone}`, '_self');
                } else {
                  toast({
                    title: "No phone number",
                    description: "This patient doesn't have a phone number on file",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Video Call",
                  description: "Video calling feature coming soon",
                });
              }}
            >
              <Video className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-gray-500 max-w-sm">
              Send a message to {patient.name} to begin your conversation.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Send a message to ${patient.name}...`}
              className="resize-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl"
              disabled={isLoading}
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            className="rounded-xl px-4 py-2 h-auto"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • {channel === 'sms' ? 'SMS' : channel.toUpperCase()} message
        </p>
      </div>
    </div>
  );
};
