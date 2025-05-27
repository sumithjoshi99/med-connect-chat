import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, Phone, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  preferred_channel: string;
  status: string;
  created_at: string;
}

interface MessageAreaProps {
  patient: Patient;
  channel: string;
}

export const MessageArea = ({ patient, channel }: MessageAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (patient?.id) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [patient?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Type cast the direction field to ensure it matches our interface
      const typedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        direction: msg.direction as 'inbound' | 'outbound'
      }));
      
      setMessages(typedMessages);
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

  const subscribeToMessages = () => {
    const channel_subscription = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `patient_id=eq.${patient.id}`
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            direction: payload.new.direction as 'inbound' | 'outbound'
          } as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel_subscription);
    };
  };

  const sendSMS = async (content: string) => {
    if (!patient.phone) {
      throw new Error('Patient phone number is required for SMS');
    }

    console.log('Attempting to send SMS via edge function...');
    console.log('Patient phone:', patient.phone);
    console.log('Message content:', content);

    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: patient.phone,
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
    console.log(`Sending ${channel} message to ${patient.name}: ${newMessage}`);

    try {
      // First, store the message in the database
      const { error: dbError } = await supabase
        .from('messages')
        .insert({
          patient_id: patient.id,
          channel: channel,
          direction: 'outbound',
          content: newMessage,
          sender_name: 'PharmaCare',
          status: 'sending'
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      // If it's an SMS, actually send it via Twilio
      if (channel === 'sms') {
        try {
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
          
          // Provide more specific error message
          const errorMessage = smsError instanceof Error ? smsError.message : 'Unknown SMS error';
          throw new Error(`Failed to send SMS: ${errorMessage}`);
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
      
      toast({
        title: "Message sent",
        description: `${channel.toUpperCase()} message sent to ${patient.name}`,
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
    }
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
      case 'whatsapp':
        return 'bg-green-100 text-green-800';
      case 'facebook':
        return 'bg-blue-100 text-blue-800';
      case 'instagram':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingMessages) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

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
              {channel === 'sms' && patient.phone && `Phone: ${patient.phone}`}
              {channel === 'email' && patient.email && `Email: ${patient.email}`}
              {channel === 'whatsapp' && patient.phone && `WhatsApp: ${patient.phone}`}
              {channel === 'facebook' && 'Facebook Messenger'}
              {channel === 'instagram' && 'Instagram Direct'}
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
            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] ${
                message.direction === 'outbound'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              } rounded-lg p-3 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">
                  {message.sender_name || (message.direction === 'outbound' ? 'PharmaCare' : patient.name)}
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
                  message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                {message.direction === 'outbound' && (
                  <span className={`text-xs text-blue-100`}>
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
