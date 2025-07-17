import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { ChannelSelector } from './ChannelSelector';
import { 
  Phone, 
  Video, 
  Send, 
  Check, 
  CheckCheck, 
  Copy, 
  Clock,
  AlertCircle,
  Loader2,
  MessageSquare,
  X,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

interface Message {
  id: string;
  content: string;
  created_at: string;
  direction: 'inbound' | 'outbound';
  sender_name: string;
  status: 'sent' | 'delivered' | 'failed' | 'read' | 'sending';
  external_id?: string;
  delivered_at?: string;
  is_read?: boolean;
}

interface MessageAreaProps {
  patient: Patient;
  channel: string;
  currentPhoneNumberId: string;
  onMessageSent?: () => void;
  onMessagesRead?: () => void;
}

type Patient = Database['public']['Tables']['patients']['Row'];

export const MessageArea = ({ patient, channel, currentPhoneNumberId, onMessageSent, onMessagesRead }: MessageAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    if (patient?.id && currentPhoneNumberId) {
      fetchMessages();
      markInboundMessagesAsRead(); // Mark as read immediately
      return () => {};
    }
  }, [patient.id, currentPhoneNumberId]);

  const fetchMessages = async () => {
    if (!patient?.id || !currentPhoneNumberId) return;

    try {
      // Get the current phone number details
      const { data: phoneData, error: phoneError } = await supabase
        .from('twilio_phone_numbers')
        .select('phone_number')
        .eq('id', currentPhoneNumberId)
        .single();

      if (phoneError || !phoneData) {
        console.error('Error fetching phone number:', phoneError);
        return;
      }

      // Fetch messages that used the current phone number
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('patient_id', patient.id)
        .or(`twilio_number_from.eq.${phoneData.phone_number},twilio_number_to.eq.${phoneData.phone_number}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  };

  const markInboundMessagesAsRead = async () => {
    if (!patient?.id || !currentPhoneNumberId) return;
    
    try {
      console.log('🔴 YOU opened conversation - marking THEIR messages as read');
      
      // Get the current phone number details
      const { data: phoneData, error: phoneError } = await supabase
        .from('twilio_phone_numbers')
        .select('phone_number')
        .eq('id', currentPhoneNumberId)
        .single();

      if (phoneError || !phoneData) return;

      // Mark THEIR unread messages as read when YOU open conversation
      const { data: updatedMessages, error } = await supabase
        .from('messages')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString(),
          is_read: true
        })
        .eq('patient_id', patient.id)
        .eq('direction', 'inbound')
        .eq('twilio_number_to', phoneData.phone_number)
        .neq('status', 'read')
        .select();

      if (error) {
        console.error('Error marking their messages as read:', error);
      } else if (updatedMessages && updatedMessages.length > 0) {
        console.log(`✅ Marked ${updatedMessages.length} of THEIR messages as read (you read them)`);
        fetchMessages(); // Refresh to show updated status
        if (onMessagesRead) onMessagesRead(); // Notify parent to refresh conversations
      }
    } catch (error) {
      console.error('Error in markInboundMessagesAsRead:', error);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    if (digits.length > 11) {
      return phone.startsWith('+') ? phone : `+${digits}`;
    }
    
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  const sendSMS = async (content: string) => {
    if (!patient.phone || !currentPhoneNumberId) {
      throw new Error('Patient phone number and phone number ID are required for SMS');
    }

    const formattedPhone = formatPhoneNumber(patient.phone);
    console.log('Attempting to send SMS via edge function...');
    console.log('Original phone:', patient.phone);
    console.log('Formatted phone:', formattedPhone);
    console.log('Message content:', content);
    console.log('Using phone number ID:', currentPhoneNumberId);

    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: formattedPhone,
          message: content,
          patientId: patient.id,
          phoneNumberId: currentPhoneNumberId
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
    if (!newMessage.trim() || !currentPhoneNumberId) return;

    setIsLoading(true);
    setIsTyping(true);
    console.log(`Sending ${channel} message to ${patient.name}: ${newMessage}`);

    try {
      // Store the message in the database first
      const { data: insertedMessage, error: dbError } = await supabase
        .from('messages')
        .insert({
          patient_id: patient.id,
          channel: channel,
          direction: 'outbound',
          content: newMessage,
          sender_name: 'MedConnect',
          status: 'sending'
        })
        .select();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Message saved to database successfully:', insertedMessage);

      // If it's an SMS, actually send it via Twilio
      if (channel === 'sms' && patient.phone) {
        try {
          console.log('Attempting to send SMS via Twilio...');
          const smsResult = await sendSMS(newMessage);
          console.log('SMS sent successfully via Twilio:', smsResult);
          
          // Update message status to sent and store the Twilio SID
          const { data: updateData, error: updateError } = await supabase
            .from('messages')
            .update({ 
              status: 'sent',
              external_id: smsResult?.messageId || null
            })
            .eq('patient_id', patient.id)
            .eq('content', newMessage)
            .eq('direction', 'outbound')
            .order('created_at', { ascending: false })
            .limit(1)
            .select();
            
          if (updateError) {
            console.error('Error updating message status:', updateError);
          } else {
            console.log('Message status updated to sent:', updateData);
          }
            
        } catch (smsError) {
          console.error('Failed to send SMS:', smsError);
          // Update message status to failed
          const { error: failedUpdateError } = await supabase
            .from('messages')
            .update({ status: 'failed' })
            .eq('patient_id', patient.id)
            .eq('content', newMessage)
            .eq('direction', 'outbound')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (failedUpdateError) {
            console.error('Error updating message status to failed:', failedUpdateError);
          } else {
            console.log('Message status updated to failed');
          }
          
          throw new Error(`SMS failed: ${smsError instanceof Error ? smsError.message : 'Unknown error'}`);
        }
      } else {
        // For non-SMS channels, just mark as sent (simulation)
        const { error: nonSmsUpdateError } = await supabase
          .from('messages')
          .update({ status: 'sent' })
          .eq('patient_id', patient.id)
          .eq('content', newMessage)
          .eq('direction', 'outbound')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (nonSmsUpdateError) {
          console.error('Error updating non-SMS message status:', nonSmsUpdateError);
        } else {
          console.log('Non-SMS message status updated to sent');
        }
      }

      setNewMessage("");
      
      // Refresh messages to show the new one with updated status
      await fetchMessages();
      
      // Call the callback to notify parent component (refresh conversation list)
      if (onMessageSent) {
        onMessageSent();
      }
      
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

  const triggerReadReceipts = async () => {
    if (!patient?.id || !currentPhoneNumberId) return;
    
    try {
      // Get the current phone number details
      const { data: phoneData, error: phoneError } = await supabase
        .from('twilio_phone_numbers')
        .select('phone_number')
        .eq('id', currentPhoneNumberId)
        .single();

      if (phoneError || !phoneData) return;

      const { data: updatedMessages, error } = await supabase
        .from('messages')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('patient_id', patient.id)
        .eq('direction', 'outbound')
        .eq('twilio_number_from', phoneData.phone_number)
        .neq('status', 'read')
        .select();

      if (error) {
        console.error('Error updating read receipts:', error);
      } else if (updatedMessages && updatedMessages.length > 0) {
        console.log(`✅ Updated ${updatedMessages.length} of YOUR messages to read (patient read them)`);
        fetchMessages(); // Refresh to show updated status
        
        toast({
          title: "Read receipts updated",
          description: `${updatedMessages.length} message(s) marked as read by patient`,
        });
      } else {
        toast({
          title: "No updates",
          description: "No messages to mark as read",
        });
      }
    } catch (error) {
      console.error('Error in triggerReadReceipts:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.direction === 'outbound'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs opacity-75">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                  {message.direction === 'outbound' && (
                    <div className="flex items-center space-x-1">
                      {message.status === 'sending' && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      {message.status === 'sent' && (
                        <Check className="w-3 h-3" />
                      )}
                      {message.status === 'delivered' && (
                        <CheckCheck className="w-3 h-3" />
                      )}
                      {message.status === 'read' && (
                        <CheckCheck className="w-3 h-3 text-blue-200" />
                      )}
                      {message.status === 'failed' && (
                        <X className="w-3 h-3 text-red-200" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-3 md:p-4 flex-shrink-0">
        <div className="flex items-end space-x-2 md:space-x-3">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Send a message to ${patient.name}...`}
              className="resize-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-base" 
              disabled={isLoading}
            />
          </div>
          <Button 
            onClick={triggerReadReceipts}
            variant="outline"
            size="sm"
            className="rounded-xl px-2 md:px-3 py-2 h-auto text-xs hidden md:flex"
            title="Force read receipts for testing"
          >
            📖 Read
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            className="rounded-xl px-3 md:px-4 py-2 h-auto touch-target"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 hidden md:block">
          Press Enter to send • {channel === 'sms' ? 'SMS' : channel.toUpperCase()} message • Click "📖 Read" to simulate patient reading YOUR messages (blue ✓✓)
        </p>
      </div>
    </div>
  );
};
