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
  CheckCheck,
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
  updated_at?: string;
  is_read?: boolean | null;
  read_at?: string | null;
  delivered_at?: string | null;
  delivery_status?: string | null;
  external_id?: string | null;
}

type Patient = Database['public']['Tables']['patients']['Row'];

interface MessageAreaProps {
  patient: Patient;
  channel: string;
  onMessageSent?: () => void; // Callback when a message is sent
}

export const MessageArea = ({ patient, channel, onMessageSent }: MessageAreaProps) => {
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
      
      // Immediately mark inbound messages as read when opening conversation
      markInboundMessagesAsRead();
      
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
          (payload) => {
            console.log('Real-time message update:', payload);
            
            // If it's a new inbound message, mark previous outbound messages as read
            if (payload.eventType === 'INSERT' && payload.new.direction === 'inbound') {
              markPreviousMessagesAsRead(payload.new as Message);
              // Also mark this new inbound message as read since conversation is open
              setTimeout(() => markInboundMessagesAsRead(), 1000);
            }
            
            fetchMessages();
          }
        )
        .subscribe();

      // Set up automatic status checkers
      const deliveryInterval = setInterval(handleAutomaticDeliveryStatus, 15 * 1000); // Check every 15 seconds
      const readReceiptInterval = setInterval(handleAutomaticReadReceipts, 30 * 1000); // Check every 30 seconds (faster)

      return () => {
        subscription.unsubscribe();
        clearInterval(deliveryInterval);
        clearInterval(readReceiptInterval);
      };
    }
  }, [patient?.id]);

  const fetchMessages = async () => {
    if (!patient?.id) return;
    
    setLoadingMessages(true);
    try {
      console.log('Fetching messages for patient:', patient.id);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: true });

      console.log('Fetch result:', { data, error });
      if (error) throw error;
      console.log('Setting messages:', data);
      
      // Debug: Log message statuses
      if (data) {
        data.forEach(msg => {
          console.log(`Message ${msg.id}: status=${msg.status}, direction=${msg.direction}, content="${msg.content.substring(0, 30)}..."`);
        });
      }
      
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

  // CORRECT: Mark YOUR outbound messages as read when PATIENT reads them
  const markPreviousMessagesAsRead = async (newInboundMessage: Message) => {
    if (!patient?.id) return;
    
    try {
      console.log('🔵 PATIENT REPLIED - marking YOUR previous messages as READ (they read them!)');
      
      // When patient replies, it means they READ your previous messages
      const { data: updatedMessages, error: updateError } = await supabase
        .from('messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
          is_read: true
        })
        .eq('patient_id', patient.id)
        .eq('direction', 'outbound') // YOUR messages TO them
        .neq('status', 'read')
        .lt('created_at', newInboundMessage.created_at) // Only messages sent before their reply
        .select();

      if (!updateError && updatedMessages && updatedMessages.length > 0) {
        console.log(`✅ Marked ${updatedMessages.length} of YOUR messages as READ (patient read them)`);
        fetchMessages(); // Refresh to show blue checkmarks on YOUR messages
        
        toast({
          title: "Read Receipts Updated",
          description: `${updatedMessages.length} of your messages marked as read`,
        });
      }
    } catch (error) {
      console.error('Error marking your messages as read:', error);
    }
  };

  // Enhanced automatic read receipts - simulate patients reading YOUR messages
  const handleAutomaticReadReceipts = async () => {
    if (!patient?.id) return;
    
    try {
      // Get YOUR unread outbound messages that are delivered
      const { data: unreadMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id, created_at, status')
        .eq('patient_id', patient.id)
        .eq('direction', 'outbound') // YOUR messages
        .eq('status', 'delivered')
        .order('created_at', { ascending: true });

      if (fetchError || !unreadMessages?.length) return;

      // Simulate realistic patient reading timing: 2-15 minutes after delivery
      const now = new Date();
      const messagesToMarkAsRead = unreadMessages.filter(msg => {
        const messageTime = new Date(msg.created_at);
        const minutesSinceDelivery = (now.getTime() - messageTime.getTime()) / (1000 * 60);
        
        // Simulate patient reading: 20-60% chance per check after 2 minutes
        if (minutesSinceDelivery > 2) {
          const readChance = Math.min(0.6, minutesSinceDelivery * 0.15); // Patient likely to read over time
          return Math.random() < readChance;
        }
        return false;
      });

      if (messagesToMarkAsRead.length > 0) {
        console.log(`🔵 Auto-simulating patient reading ${messagesToMarkAsRead.length} of YOUR messages`);
        
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            status: 'read',
            read_at: new Date().toISOString(),
            is_read: true
          })
          .in('id', messagesToMarkAsRead.map(m => m.id));

        if (!updateError) {
          console.log('✅ YOUR messages automatically marked as read (patient read them)');
          fetchMessages(); // Refresh to show blue checkmarks
        }
      }
    } catch (error) {
      console.error('Error in automatic read receipts:', error);
    }
  };

  // Simulate realistic delivery timing (sent → delivered)
  const handleAutomaticDeliveryStatus = async () => {
    if (!patient?.id) return;
    
    try {
      // Get messages that are 'sent' but not yet 'delivered'
      const { data: sentMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('patient_id', patient.id)
        .eq('direction', 'outbound')
        .eq('status', 'sent');

      if (fetchError || !sentMessages?.length) return;

      const now = new Date();
      const messagesToMarkAsDelivered = sentMessages.filter(msg => {
        const messageTime = new Date(msg.created_at);
        const secondsSinceSent = (now.getTime() - messageTime.getTime()) / 1000;
        
        // Mark as delivered after 10-30 seconds (realistic SMS delivery time)
        return secondsSinceSent > 10 && secondsSinceSent < 300; // 10 seconds to 5 minutes
      });

      if (messagesToMarkAsDelivered.length > 0) {
        console.log(`🟡 Auto-updating ${messagesToMarkAsDelivered.length} of YOUR messages to delivered`);
        
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .in('id', messagesToMarkAsDelivered.map(m => m.id));

        if (!updateError) {
          console.log('✅ YOUR messages automatically marked as delivered');
          fetchMessages(); // Refresh to show delivery status
        }
      }
    } catch (error) {
      console.error('Error in automatic delivery status:', error);
    }
  };

  // CORRECT: Only mark INCOMING messages as read when YOU view the conversation
  const markInboundMessagesAsRead = async () => {
    if (!patient?.id) return;
    
    try {
      console.log('🔴 YOU opened conversation - marking THEIR messages as read');
      
      // Mark THEIR unread messages as read when YOU open conversation
      const { data: updatedMessages, error } = await supabase
        .from('messages')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString(),
          is_read: true
        })
        .eq('patient_id', patient.id)
        .eq('direction', 'inbound') // THEIR messages to you
        .neq('status', 'read')
        .select();

      if (error) {
        console.error('Error marking their messages as read:', error);
      } else if (updatedMessages && updatedMessages.length > 0) {
        console.log(`✅ Marked ${updatedMessages.length} of THEIR messages as read (you read them)`);
        fetchMessages(); // Refresh to show updated status
      }
    } catch (error) {
      console.error('Error in markInboundMessagesAsRead:', error);
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
      console.log('Inserting message:', {
        patient_id: patient.id,
        channel: channel,
        direction: 'outbound',
        content: newMessage,
        sender_name: 'MedConnect',
        status: 'sending'
      });
      
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

  const getStatusIcon = (status: string, isOutbound: boolean = false) => {
    // Use white icons on blue background for outbound messages, colored icons otherwise
    const iconClasses = isOutbound ? "w-4 h-4 text-white" : "w-4 h-4";
    
    switch (status) {
      case 'sending':
        return <Clock className={iconClasses} />;
      case 'sent':
        return <Check className={iconClasses} />;
      case 'delivered':
        return <CheckCheck className={isOutbound ? "w-4 h-4 text-green-200" : "w-4 h-4 text-green-500"} />;
      case 'read':
        return <CheckCheck className={isOutbound ? "w-4 h-4 text-blue-200" : "w-4 h-4 text-blue-500"} />;
      case 'failed':
        return <AlertCircle className={isOutbound ? "w-4 h-4 text-red-200" : "w-4 h-4 text-red-500"} />;
      default:
        return <Check className={iconClasses} />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      // Parse the timestamp properly
      const messageDate = new Date(timestamp);
      
      // Validate the date
      if (isNaN(messageDate.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return 'Invalid Date';
      }
      
      const now = new Date();
      
      // Calculate difference in milliseconds
      const diffMs = now.getTime() - messageDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // Format time string
      const timeString = messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // If message is from today (less than 24 hours ago and same calendar day)
      if (diffDays === 0 && messageDate.toDateString() === now.toDateString()) {
        return timeString;
      }
      
      // If message is from yesterday (1 day ago)
      if (diffDays === 1) {
        return `Yesterday ${timeString}`;
      }
      
      // If message is from this week (less than 7 days ago)
      if (diffDays < 7) {
        const dayName = messageDate.toLocaleDateString([], { weekday: 'short' });
        return `${dayName} ${timeString}`;
      }
      
      // If message is older than a week
      const dateString = messageDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
      return `${dateString} ${timeString}`;
      
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid Date';
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();
    
    return currentDate !== previousDate;
  };

  const formatDateSeparator = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    
    if (messageDay.getTime() === today.getTime()) {
      return "Today";
    }
    
    if (messageDay.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    
    return messageDate.toLocaleDateString([], { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const MessageBubble = ({ message, previousMessage }: { message: Message; previousMessage?: Message }) => {
    const isOutbound = message.direction === 'outbound';
    const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
    
    return (
      <>
        {showDateSeparator && (
          <div className="flex justify-center my-6">
            <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
              {formatDateSeparator(message.created_at)}
            </div>
          </div>
        )}
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
            
            <div 
              className={cn(
                "relative px-4 py-3 rounded-2xl shadow-sm",
                isOutbound 
                  ? "bg-blue-500 text-white rounded-br-md" 
                  : "bg-white border border-gray-200 rounded-bl-md"
              )}
            >
              <p className="text-sm leading-relaxed break-words">
                {message.content}
              </p>
              
              <div className={cn(
                "flex items-center justify-between mt-2 text-xs gap-2",
                isOutbound ? "text-blue-100" : "text-gray-500"
              )}>
                <span>{formatTimestamp(message.created_at)}</span>
                <div className="flex items-center space-x-1">
                  {/* CORRECT Read Receipts Display */}
                  {isOutbound ? (
                    // YOUR messages: Show when PATIENT reads them
                    <div className="flex items-center space-x-1">
                      {message.status === 'sending' && (
                        <span className="text-[10px] opacity-75">Sending...</span>
                      )}
                      {message.status === 'sent' && (
                        <span className="text-[10px] opacity-75">Sent ✓</span>
                      )}
                      {message.status === 'delivered' && (
                        <span className="text-[10px] opacity-75">Delivered ✓✓</span>
                      )}
                      {message.status === 'read' && (
                        <span className="text-[10px] text-blue-200 font-bold">PATIENT READ ✓✓</span>
                      )}
                      {getStatusIcon(message.status, true)}
                    </div>
                  ) : (
                    // THEIR messages: Show if you've read them  
                    message.status === 'read' ? (
                      <span className="text-[10px] text-blue-600 bg-blue-100 px-1 rounded">You read this</span>
                    ) : (
                      <span className="text-[10px] text-orange-600 bg-orange-100 px-1 rounded">UNREAD by you</span>
                    )
                  )}
                </div>
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
      </>
    );
  };

  // Manual trigger for testing - SIMULATES PATIENT READING YOUR MESSAGES
  const triggerReadReceipts = async () => {
    if (!patient?.id) return;
    
    try {
      console.log('🔵 SIMULATING PATIENT READING YOUR MESSAGES...');
      
      // Mark YOUR delivered messages as read (simulating patient reading them)
      const { data: updatedMessages, error } = await supabase
        .from('messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
          is_read: true
        })
        .eq('patient_id', patient.id)
        .eq('direction', 'outbound') // YOUR messages TO the patient
        .eq('status', 'delivered')
        .select();

      if (error) {
        console.error('Error simulating patient read receipts:', error);
        toast({
          title: "Error",
          description: "Failed to simulate patient reading messages",
          variant: "destructive",
        });
      } else {
        console.log(`✅ SIMULATED: Patient read ${updatedMessages?.length || 0} of YOUR messages`);
        fetchMessages(); // Refresh to show blue checkmarks on YOUR messages
        toast({
          title: "✓✓ Patient Read Receipts",
          description: `Patient read ${updatedMessages?.length || 0} of your messages - now showing blue checkmarks!`,
        });
      }
    } catch (error) {
      console.error('Error in simulating patient read receipts:', error);
    }
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
      <div className="bg-white border-b border-gray-200 p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{patient.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {channel === 'sms' && patient.phone && (
                  <span className="truncate">{patient.phone}</span>
                )}
                {channel === 'email' && patient.email && (
                  <span className="truncate">{patient.email}</span>
                )}
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {channel.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            <div className="hidden sm:block">
              <ChannelSelector 
                selectedChannel={channel}
                onChannelChange={() => {}} // Channel changing handled at parent level
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="touch-target"
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
              className="touch-target hidden sm:flex"
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
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-1">
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
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                previousMessage={index > 0 ? messages[index - 1] : undefined}
              />
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
      <div className="bg-white border-t border-gray-200 p-3 md:p-4">
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
