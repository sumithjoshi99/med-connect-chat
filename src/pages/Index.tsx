import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings, 
  Bell,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  Shield,
  Zap,
  Send,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Star,
  Heart,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2
} from "lucide-react";
import { PatientList } from "@/components/PatientList";
import { MessageArea } from "@/components/MessageArea";
import { PatientProfile } from "@/components/PatientProfile";
import { SMSManager } from "@/components/SMSManager";
import { SMSAnalyticsDashboard } from "@/components/SMSAnalyticsDashboard";
import { TeamSidebar } from "@/components/TeamSidebar";
import { BulkSMSManager } from "@/components/BulkSMSManager";
import { ContactsManager } from "@/components/ContactsManager";
import { SMSAutomation } from "@/components/SMSAutomation";
import { NewMessageDialog } from "@/components/NewMessageDialog";
import { OmnichannelMessaging } from "@/components/OmnichannelMessaging";
import { AdminDashboard } from "@/components/AdminDashboard";
import { LoginPage } from "@/components/LoginPage";
import { supabase } from "@/integrations/supabase/client";
import { AddPhoneNumber } from "../components/AddPhoneNumber";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

import { Database } from "@/integrations/supabase/types";

type Patient = Database['public']['Tables']['patients']['Row'];

interface ConversationData {
  patient: Patient;
  lastMessage?: {
    content: string;
    created_at: string;
    direction: 'inbound' | 'outbound';
    sender_name: string | null;
  };
  unreadCount: number;
  lastActivity: string;
}

interface PhoneNumberGroup {
  phoneNumber: string;
  displayName: string;
  conversations: ConversationData[];
  totalUnreadCount: number;
  lastActivity: string;
}

interface PhoneNumberConfig {
  id: string;
  phone_number: string;
  display_name: string;
  is_active: boolean;
  is_primary: boolean;
  department: string;
}

export default function Index() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedChannel, setSelectedChannel] = useState("sms");
  // Initialize activeTab from localStorage or default to "dashboard"
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('activeTab');
    return savedTab || "dashboard";
  });
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [phoneNumberGroups, setPhoneNumberGroups] = useState<PhoneNumberGroup[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberConfig[]>([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>("all");
  const [currentPhoneNumberId, setCurrentPhoneNumberId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeConversations: 0,
    messagesSentToday: 0,
    responseRate: 0
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const { toast } = useToast();

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔔 INITIAL LOAD - Fetching data...');
      fetchPatients();
      fetchStats();
      fetchPhoneNumbers();
      fetchAllConversations(); // Also fetch conversations on initial load
    }
  }, [isAuthenticated]);

  // Initialize with primary phone number when phone numbers are loaded
  useEffect(() => {
    if (phoneNumbers.length > 0 && !currentPhoneNumberId) {
      const primaryPhone = phoneNumbers.find(p => p.is_primary);
      if (primaryPhone) {
        setCurrentPhoneNumberId(primaryPhone.id);
      }
    }
  }, [phoneNumbers, currentPhoneNumberId]);

  const checkAuthentication = () => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        setIsAuthenticated(true);
        console.log('🔐 User authenticated from localStorage');
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('currentUser');
      }
    } else {
      // For testing, set authentication to true anyway
      console.log('🔐 No stored user, but setting authenticated to true for testing');
      setIsAuthenticated(true);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab("dashboard");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id');
      
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, direction');

      const totalPatients = patientsData?.length || 0;
      const totalMessages = messagesData?.length || 0;
      const sentMessages = messagesData?.filter(m => m.direction === 'outbound').length || 0;
      const receivedMessages = messagesData?.filter(m => m.direction === 'inbound').length || 0;
      
      console.log('📊 Stats updated:', { totalPatients, totalMessages, sentMessages, receivedMessages });
      
      setStats({
        totalPatients,
        messagesSentToday: sentMessages,
        activeConversations: 0, // No longer used - replaced with actual unread count
        responseRate: receivedMessages > 0 ? Math.round((receivedMessages / sentMessages) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedChannel(patient.preferred_channel);
    setActiveTab("messages");
    setShowPatientProfile(true); // Auto-show patient profile when selected

    // Note: Removed automatic phone number switching to preserve user's manual selection
    // The user's selected inbox/phone number should remain active when clicking on chats
  };

  const handlePatientAdded = () => {
    fetchPatients();
    fetchStats();
    toast({
      title: "Success",
      description: "Patient added successfully",
    });
  };

  const handlePatientUpdated = (updatedPatient: Patient) => {
    // Update the patients list with the updated patient data
    setPatients(prevPatients => 
      prevPatients.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    );
    
    // Update selectedPatient if it's the one that was updated
    if (selectedPatient?.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient);
    }
    
    toast({
      title: "Success",
      description: "Patient updated successfully",
    });
  };

  const handlePatientDeleted = (deletedPatientId: string) => {
    // Remove patient from the list
    setPatients(prevPatients => 
      prevPatients.filter(p => p.id !== deletedPatientId)
    );
    
    // Clear selectedPatient if it was the deleted one
    if (selectedPatient?.id === deletedPatientId) {
      setSelectedPatient(null);
      setShowPatientProfile(false);
    }
    
    fetchStats(); // Refresh stats
    toast({
      title: "Success",
      description: "Patient deleted successfully",
    });
  };

  const handleNewMessagePatientSelected = (patient: Patient) => {
    handlePatientSelect(patient);
    setShowNewMessageDialog(false);
  };

  const handleNewMessagePatientAdded = (patient: Patient) => {
    // Add the new patient to the list
    setPatients(prevPatients => [patient, ...prevPatients]);
    fetchStats(); // Refresh stats
  };

  const fetchPhoneNumbers = async () => {
    try {
      const { data: phoneNumbersData, error } = await supabase
        .from('twilio_phone_numbers')
        .select('id, phone_number, display_name, is_active, is_primary, department')
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setPhoneNumbers(phoneNumbersData || []);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast({
        title: "Error",
        description: "Failed to load phone numbers",
        variant: "destructive",
      });
    }
  };

  // Debug function to test unread count
  const debugUnreadCount = async () => {
    console.log('🔍 DEBUGGING UNREAD COUNT...');
    
    try {
      // Test basic message query
      const { data: allMessages, error: allError } = await supabase
        .from('messages')
        .select('*')
        .limit(5);
      
      console.log('🔍 All messages sample:', allMessages);
      console.log('🔍 All messages error:', allError);
      
      if (allMessages && allMessages.length > 0) {
        console.log('🔍 First message structure:', allMessages[0]);
        console.log('🔍 Message has is_read field?', 'is_read' in allMessages[0]);
      }
      
      // Test unread query
      const { data: unreadMessages, error: unreadError, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('direction', 'inbound')
        .or('is_read.is.null,is_read.eq.false');
      
      console.log('🔍 Unread messages:', unreadMessages);
      console.log('🔍 Unread count:', count);
      console.log('🔍 Unread error:', unreadError);
      
      toast({
        title: "Debug Results",
        description: `Found ${count} unread messages. Check console for details.`,
      });
      
    } catch (error) {
      console.error('🔍 Debug error:', error);
      toast({
        title: "Debug Error",
        description: "Check console for error details",
        variant: "destructive",
      });
    }
  };

  const fetchConversations = useCallback(async () => {
    try {
      // Get all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('name');

      if (patientsError) throw patientsError;

      const conversationsData: ConversationData[] = [];
      
      for (const patient of patientsData || []) {
        if (!currentPhoneNumberId || phoneNumbers.length === 0) {
          // If no phone number selected, show all conversations
          const { data: messagesData } = await supabase
            .from('messages')
            .select('content, created_at, direction, sender_name, twilio_number_from, twilio_number_to')
            .eq('patient_id', patient.id)
            .order('created_at', { ascending: false });

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patient.id)
            .eq('direction', 'inbound')
            .or('is_read.is.null,is_read.eq.false');

          const lastMessage = messagesData?.[0];
          
          if (lastMessage || messagesData?.length === 0) {
            const conversation: ConversationData = {
              patient,
              lastMessage: lastMessage ? {
                content: lastMessage.content,
                created_at: lastMessage.created_at,
                direction: lastMessage.direction,
                sender_name: lastMessage.sender_name
              } : undefined,
              unreadCount: unreadCount || 0,
              lastActivity: lastMessage?.created_at || patient.created_at
            };

            conversationsData.push(conversation);
          }
        } else {
          // Filter by specific phone number
          const currentPhoneNumber = phoneNumbers.find(p => p.id === currentPhoneNumberId);
          if (!currentPhoneNumber) continue;

          // Get messages for this phone number OR legacy messages (only for primary phone)
          const isPrimaryPhone = currentPhoneNumber.is_primary;
          
          let messagesQuery = supabase
            .from('messages')
            .select('content, created_at, direction, sender_name, twilio_number_from, twilio_number_to')
            .eq('patient_id', patient.id);

          if (isPrimaryPhone) {
            // Primary phone shows both its messages AND legacy messages
            messagesQuery = messagesQuery.or(`twilio_number_from.eq.${currentPhoneNumber.phone_number},twilio_number_to.eq.${currentPhoneNumber.phone_number},twilio_number_from.is.null,twilio_number_to.is.null`);
          } else {
            // Secondary phones only show their specific messages
            messagesQuery = messagesQuery.or(`twilio_number_from.eq.${currentPhoneNumber.phone_number},twilio_number_to.eq.${currentPhoneNumber.phone_number}`);
          }

          const { data: messagesData } = await messagesQuery.order('created_at', { ascending: false });

          // Skip this patient if they have no messages for this phone number
          if (!messagesData || messagesData.length === 0) {
            continue;
          }

          // Get unread count for this phone number
          let unreadQuery = supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patient.id)
            .eq('direction', 'inbound')
            .or('is_read.is.null,is_read.eq.false');

          if (isPrimaryPhone) {
            unreadQuery = unreadQuery.or(`twilio_number_to.eq.${currentPhoneNumber.phone_number},twilio_number_to.is.null`);
          } else {
            unreadQuery = unreadQuery.eq('twilio_number_to', currentPhoneNumber.phone_number);
          }

          const { count: unreadCount } = await unreadQuery;

          const lastMessage = messagesData[0];
          
          const conversation: ConversationData = {
            patient,
            lastMessage: {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              direction: lastMessage.direction,
              sender_name: lastMessage.sender_name
            },
            unreadCount: unreadCount || 0,
            lastActivity: lastMessage.created_at
          };

          conversationsData.push(conversation);
        }
      }

      // Sort conversations by last activity
      conversationsData.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    }
  }, [currentPhoneNumberId, phoneNumbers, toast]);

  // Fetch all conversations for dashboard (regardless of phone number selection)
  const fetchAllConversations = useCallback(async () => {
    try {
      // Get all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('name');

      if (patientsError) throw patientsError;

      const allConversationsData: ConversationData[] = [];
      
      for (const patient of patientsData || []) {
        // Get all messages for this patient (from all phone numbers)
        const { data: messagesData } = await supabase
          .from('messages')
          .select('content, created_at, direction, sender_name, twilio_number_from, twilio_number_to')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false });

        // Get total unread count for this patient (from all phone numbers)
        const unreadQuery = supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patient.id)
          .eq('direction', 'inbound')
          .or('is_read.is.null,is_read.eq.false');
        
        const { count: unreadCount, error: unreadError } = await unreadQuery;
        
        console.log('🔔 UNREAD QUERY for', patient.name, ':', {
          patientId: patient.id,
          unreadCount,
          unreadError
        });
        
        // Debug: Get all messages for this patient to see their is_read values
        const { data: debugMessages } = await supabase
          .from('messages')
          .select('id, content, direction, is_read, created_at')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        console.log('🔔 DEBUG MESSAGES for', patient.name, ':', debugMessages);

        // Only include patients with messages
        if (messagesData && messagesData.length > 0) {
          const lastMessage = messagesData[0];
          
          const conversation: ConversationData = {
            patient,
            lastMessage: {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              direction: lastMessage.direction,
              sender_name: lastMessage.sender_name
            },
            unreadCount: unreadCount || 0,
            lastActivity: lastMessage.created_at
          };

          allConversationsData.push(conversation);
        }
      }

      // Sort conversations by last activity
      allConversationsData.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

      // Update both filtered and all conversations
      console.log('🔔 SETTING CONVERSATIONS:', allConversationsData.length, 'conversations');
      console.log('🔔 UNREAD BREAKDOWN:', allConversationsData.map(c => ({
        name: c.patient.name,
        unread: c.unreadCount
      })));
      setConversations(allConversationsData);
    } catch (error) {
      console.error('Error fetching all conversations:', error);
    }
  }, [phoneNumbers, patients]);

  // Refetch conversations when phone number changes or initially when phone numbers load
  useEffect(() => {
    if (activeTab === "messages") {
      fetchConversations();
    } else if (activeTab === "dashboard") {
      fetchAllConversations();
    }
  }, [activeTab, currentPhoneNumberId, phoneNumbers]);

  const formatLastMessageTime = (timestamp: string) => {
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
      
      // If message is from today (less than 24 hours ago and same calendar day)
      if (diffDays === 0 && messageDate.toDateString() === now.toDateString()) {
        const result = messageDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        return result;
      }
      
      // If message is from yesterday (1 day ago)
      if (diffDays === 1) {
        return "Yesterday";
      }
      
      // If message is from this week (less than 7 days ago)
      if (diffDays < 7) {
        const result = messageDate.toLocaleDateString([], { weekday: 'short' });
        return result;
      }
      
      // If message is older than a week
      const result = messageDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
      return result;
      
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid Date';
    }
  };

  const getLastMessagePreview = (conversation: ConversationData) => {
    if (!conversation.lastMessage) {
      return "No messages yet";
    }
    
    const { content, direction, sender_name } = conversation.lastMessage;
    const isOutbound = direction === 'outbound';
    const prefix = isOutbound ? "You: " : "";
    
    return `${prefix}${content}`.length > 50 
      ? `${prefix}${content.substring(0, 50)}...` 
      : `${prefix}${content}`;
  };

  const filteredPhoneNumberGroups = phoneNumberGroups.filter(group => {
    // Filter by selected phone number
    if (selectedPhoneNumber !== "all" && group.phoneNumber !== selectedPhoneNumber) {
      return false;
    }
    
    // Filter conversations within the group by search query
    const searchLower = searchQuery.toLowerCase();
    group.conversations = group.conversations.filter(conv => {
      return (
        conv.patient.name.toLowerCase().includes(searchLower) ||
        (conv.patient.phone && conv.patient.phone.includes(searchLower)) ||
        (conv.patient.email && conv.patient.email.toLowerCase().includes(searchLower)) ||
        (conv.lastMessage && conv.lastMessage.content.toLowerCase().includes(searchLower))
      );
    });
    
    // Only include groups that have conversations after filtering
    return group.conversations.length > 0;
  });

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.patient.name.toLowerCase().includes(searchLower) ||
      (conv.patient.phone && conv.patient.phone.includes(searchLower)) ||
      (conv.patient.email && conv.patient.email.toLowerCase().includes(searchLower)) ||
      (conv.lastMessage && conv.lastMessage.content.toLowerCase().includes(searchLower))
    );
  });

  // Add callback to refresh conversations when messages are sent
  const handleMessageSent = () => {
    // Refresh conversations to show updated order and last message
    fetchConversations();
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setMobileMenuOpen(false); // Close mobile menu when tab changes
  };

  const getCurrentPhoneNumber = () => {
    return phoneNumbers.find(p => p.id === currentPhoneNumberId);
  };

  const handlePhoneNumberSwitch = (phoneNumberId: string) => {
    setCurrentPhoneNumberId(phoneNumberId);
    setSelectedPatient(null); // Clear selected patient when switching
    setShowPatientProfile(false);
  };

  // Notification Functions
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const showNotification = (title: string, body: string, patientName: string, patientId?: string, phoneNumberId?: string) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/narayan-favicon.svg',
        tag: 'new-message',
        requireInteraction: true
      });

      notification.onclick = async () => {
        window.focus();
        
        // Switch to correct phone number context if provided
        if (phoneNumberId && phoneNumberId !== currentPhoneNumberId) {
          setCurrentPhoneNumberId(phoneNumberId);
        }
        
        // Switch to messages tab
        setActiveTab('messages');
        
        // Select the patient if patient ID is provided
        if (patientId) {
          const patient = patients.find(p => p.id === patientId);
          if (patient) {
            await handlePatientSelect(patient);
          }
        }
        
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  };

  const playNotificationSound = () => {
    // Create a simple notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  // Real-time message subscription
  useEffect(() => {
    console.log('🔔 Setting up real-time subscription...', { 
      isAuthenticated, 
      patientsCount: patients.length, 
      phoneNumbersCount: phoneNumbers.length,
      currentTab: activeTab
    });
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, skipping subscription');
      return;
    }

    // Create a unique channel name to avoid conflicts
    const channelName = `messages-${Date.now()}`;
    console.log('🔔 Creating channel:', channelName);

    const messageSubscription = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        async (payload) => {
          console.log('🔔 NEW MESSAGE RECEIVED:', payload);
          console.log('🔔 Raw payload:', JSON.stringify(payload, null, 2));
          
          // Get patient info for notification
          const messageData = payload.new;
          
          // Only process inbound messages
          if (messageData.direction !== 'inbound') {
            console.log('🔔 Ignoring outbound message');
            return;
          }
          
          console.log('🔔 Processing inbound message:', messageData);
          
          // Find patient name from current patients list
          const patient = patients.find(p => p.id === messageData.patient_id);
          const patientName = patient?.name || 'Unknown Patient';
          
          // Find the correct phone number context for this message
          const messagePhoneNumber = phoneNumbers.find(p => 
            p.phone_number === messageData.twilio_number_to || 
            p.phone_number === messageData.twilio_number_from
          );
          
          const locationContext = messagePhoneNumber ? `(${messagePhoneNumber.display_name})` : '';
          
          console.log('🔔 Triggering notifications for:', patientName, locationContext);
          
          // Show notification for new inbound message with location context (disabled per user request)
          // showNotification(
          //   `New message from ${patientName} ${locationContext}`,
          //   messageData.content,
          //   patientName,
          //   messageData.patient_id,
          //   messagePhoneNumber?.id
          // );
          
          // Play notification sound
          try {
            playNotificationSound();
          } catch (error) {
            console.error('Sound error:', error);
          }
          
          // Show toast notification with location context
          toast({
            title: `New message from ${patientName} ${locationContext}`,
            description: messageData.content,
            duration: 5000,
          });
          
          // Refresh conversations to show new message
          console.log('🔄 Refreshing conversations after new message...');
          
          // Always fetch all conversations for badges and dashboard
          await fetchAllConversations();
          
          // If we're on the messages tab, also fetch the filtered conversations
          if (activeTab === "messages") {
            await fetchConversations();
          }
          
          console.log('✅ Conversations refreshed');
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription is ACTIVE!');
          // Test the subscription is working
          console.log('🔔 Testing if subscription works...');
          setTimeout(() => {
            console.log('🔔 Subscription should be ready now');
          }, 2000);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription ERROR!');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Real-time subscription TIMED OUT!');
        } else if (status === 'CLOSED') {
          console.log('🔒 Real-time subscription CLOSED');
        }
      });

    return () => {
      console.log('🔔 Cleaning up subscription...');
      supabase.removeChannel(messageSubscription);
    };
  }, [isAuthenticated, patients, phoneNumbers, toast, activeTab, fetchConversations, fetchAllConversations]);

  // Alternative simplified subscription for testing
  useEffect(() => {
    console.log('🧪 Setting up simplified test subscription...');
    
    const testSubscription = supabase
      .channel('test-messages-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload) => {
          console.log('🧪 TEST SUBSCRIPTION RECEIVED:', payload);
          console.log('🧪 Event type:', payload.eventType);
          console.log('🧪 Table:', payload.table);
          console.log('🧪 Schema:', payload.schema);
          
          if (payload.eventType === 'INSERT') {
            console.log('🧪 NEW MESSAGE INSERTED!');
            // alert('TEST: New message detected!'); // Disabled per user request
          }
        }
      )
      .subscribe((status) => {
        console.log('🧪 Test subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('🧪 Test subscription is active!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('🧪 Test subscription error!');
        }
      });

    return () => {
      console.log('🧪 Cleaning up test subscription...');
      supabase.removeChannel(testSubscription);
    };
  }, []);

  // Standalone realtime test that doesn't depend on authentication
  useEffect(() => {
    console.log('🔥 Setting up STANDALONE realtime test...');
    
    const standaloneSub = supabase
      .channel('standalone-test')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload) => {
          console.log('🔥 STANDALONE SUBSCRIPTION TRIGGERED!');
          console.log('🔥 Payload:', payload);
          
          // Test alert disabled per user request
          // if (payload.new) {
          //   alert(`STANDALONE: New message! ${payload.new.content}`);
          // }
        }
      )
      .subscribe((status) => {
        console.log('🔥 Standalone status:', status);
      });

    return () => {
      supabase.removeChannel(standaloneSub);
    };
  }, []);

  // Request notification permission on component mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Test function to verify realtime is working
  const testRealtime = async () => {
    console.log('🧪 Testing realtime subscription...');
    
    try {
      // First, check the publication status
      const { data: pubData, error: pubError } = await supabase
        .from('pg_publication_tables')
        .select('*')
        .eq('pubname', 'supabase_realtime');
      
      console.log('🧪 Publication tables:', pubData);
      
      if (pubError) {
        console.error('❌ Could not check publication:', pubError);
      }
      
      // Get first patient for testing
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .limit(1);
      
      if (patients && patients.length > 0) {
        const patientId = patients[0].id;
        
        console.log('🧪 Inserting test message for patient:', patientId);
        
        // Insert a test message
        const { data, error } = await supabase
          .from('messages')
          .insert({
            patient_id: patientId,
            direction: 'inbound',
            content: `Test message for realtime verification ${new Date().toISOString()}`,
            channel: 'sms',
            sender_name: 'Test Patient'
          })
          .select();
        
        if (error) {
          console.error('❌ Test message failed:', error);
        } else {
          console.log('✅ Test message sent:', data);
          console.log('🔔 Now watch for realtime subscription callback...');
          
          // Wait and check if subscription triggered
          setTimeout(() => {
            console.log('🔔 If you see this but no subscription callback, realtime is not working');
          }, 3000);
        }
      } else {
        console.error('❌ No patients found for testing');
      }
    } catch (error) {
      console.error('❌ Realtime test failed:', error);
    }
  };

  // Add test button in development
  const isDevMode = process.env.NODE_ENV === 'development';

  // Reusable Sidebar Content
  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">MedConnect</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={requestNotificationPermission}>
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-gray-600">Healthcare Communication Platform</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Button
            variant={activeTab === "dashboard" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("dashboard")}
          >
            <BarChart3 className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          
          <Button
            variant={activeTab === "messages" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("messages")}
          >
            <MessageSquare className="w-4 h-4 mr-3" />
            Messages
            {(() => {
              // Context-aware badge calculation
              let totalUnread = 0;
              let badgeLabel = "";
              
              if (activeTab === "messages") {
                // When on messages tab, only count unread for current phone number
                totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
                const currentPhone = getCurrentPhoneNumber();
                badgeLabel = currentPhone ? ` (${currentPhone.display_name})` : "";
                console.log('🔔 BADGE DEBUG - Messages tab - Total unread for current inbox:', totalUnread, 'Phone:', currentPhone?.display_name);
              } else {
                // When on dashboard tab, show all unread messages
                totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
                badgeLabel = " (All)";
                console.log('🔔 BADGE DEBUG - Dashboard tab - Total unread across all inboxes:', totalUnread);
              }
              
              console.log('🔔 BADGE DEBUG - Badge calculation:', {
                activeTab,
                totalUnread,
                conversationsCount: conversations.length,
                currentPhoneNumber: getCurrentPhoneNumber()?.display_name,
                conversations: conversations.map(c => ({
                  patient: c.patient.name,
                  unreadCount: c.unreadCount
                }))
              });
              
              return (
                <Badge 
                  variant={totalUnread > 0 ? "destructive" : "secondary"} 
                  className={`ml-auto ${totalUnread > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700'}`}
                  title={`${totalUnread} unread messages${badgeLabel}`}
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Badge>
              );
            })()}
          </Button>
          
          <Button
            variant={activeTab === "contacts" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("contacts")}
          >
            <Users className="w-4 h-4 mr-3" />
            Contacts
            <Badge variant="secondary" className="ml-auto">
              {stats.totalPatients}
            </Badge>
          </Button>
          
          <Button
            variant={activeTab === "sms" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("sms")}
          >
            <Send className="w-4 h-4 mr-3" />
            SMS Manager
          </Button>
          
          <Button
            variant={activeTab === "phone-numbers" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("phone-numbers")}
          >
            <Phone className="w-4 h-4 mr-3" />
            Phone Numbers
          </Button>
          
          <Button
            variant={activeTab === "analytics" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("analytics")}
          >
            <TrendingUp className="w-4 h-4 mr-3" />
            Analytics
          </Button>
          
          <Button
            variant={activeTab === "team" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("team")}
          >
            <Users className="w-4 h-4 mr-3" />
            Team
          </Button>
          
          <Button
            variant={activeTab === "automation" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("automation")}
          >
            <Zap className="w-4 h-4 mr-3" />
            Automation
          </Button>
          
          <Button
            variant={activeTab === "omnichannel" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("omnichannel")}
          >
            <MessageSquare className="w-4 h-4 mr-3" />
            Omnichannel
          </Button>
          
          {currentUser?.role === 'admin' && (
            <Button
              variant={activeTab === "admin" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleTabChange("admin")}
            >
              <Shield className="w-4 h-4 mr-3" />
              Admin
            </Button>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback className="bg-blue-600 text-white">
              {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0] || currentUser?.first_name?.[1]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser?.first_name} {currentUser?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {currentUser?.role?.replace('_', ' ')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Main Dashboard
  const Dashboard = () => (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Healthcare Communication Hub</h1>
          <p className="text-gray-600">Manage patient communications across all channels</p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Add Patient</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesSentToday}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConversations}</div>
            <p className="text-xs text-muted-foreground">
              24 started today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <Button className="w-full justify-start touch-target" variant="outline" onClick={() => handleTabChange("messages")}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Start New Conversation
            </Button>
            <Button className="w-full justify-start touch-target" variant="outline" onClick={() => handleTabChange("sms")}>
              <Send className="w-4 h-4 mr-2" />
              Send Bulk SMS
            </Button>
            <Button className="w-full justify-start touch-target" variant="outline" onClick={() => handleTabChange("contacts")}>
              <Users className="w-4 h-4 mr-2" />
              Manage Contacts
            </Button>
            <Button className="w-full justify-start touch-target" variant="outline" onClick={() => handleTabChange("analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            {isDevMode && (
              <Button className="w-full justify-start touch-target" variant="outline" onClick={testRealtime}>
                <Activity className="w-4 h-4 mr-2" />
                Test Realtime
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Messages</span>
              {(() => {
                const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
                return totalUnread > 0 ? (
                  <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                    {totalUnread > 99 ? '99+' : totalUnread} new
                  </Badge>
                ) : null;
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              conversations
                .sort((a, b) => b.unreadCount - a.unreadCount || new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
                .slice(0, 5)
                .map((conversation) => (
                  <div
                    key={conversation.patient.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      conversation.unreadCount > 0 
                        ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      handlePatientSelect(conversation.patient);
                      handleTabChange("messages");
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs">
                            {conversation.patient.name.split(' ').map(n => n[0]?.toUpperCase()).filter(Boolean).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium text-sm truncate ${
                            conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {conversation.patient.name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessage ? formatLastMessageTime(conversation.lastActivity) : "New"}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${
                          conversation.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                        }`}>
                          {conversation.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
            {conversations.length > 5 && (
              <Button 
                variant="outline" 
                className="w-full touch-target" 
                onClick={() => handleTabChange("messages")}
              >
                View All Messages
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Message sent to John Doe</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New patient added: Jane Smith</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Bulk SMS campaign completed</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 md:p-6 text-center">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-blue-600 mx-auto mb-3 md:mb-4" />
            <h3 className="font-semibold text-blue-900 mb-2">HIPAA Compliant</h3>
            <p className="text-sm text-blue-700">End-to-end encryption and secure messaging</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 md:p-6 text-center">
            <Zap className="w-10 h-10 md:w-12 md:h-12 text-green-600 mx-auto mb-3 md:mb-4" />
            <h3 className="font-semibold text-green-900 mb-2">Multi-Channel</h3>
            <p className="text-sm text-green-700">SMS, Email, and WhatsApp integration</p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 md:p-6 text-center">
            <Activity className="w-10 h-10 md:w-12 md:h-12 text-purple-600 mx-auto mb-3 md:mb-4" />
            <h3 className="font-semibold text-purple-900 mb-2">Real-time Analytics</h3>
            <p className="text-sm text-purple-700">Track engagement and response rates</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar - Hidden on Mobile */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          {/* This trigger is not visible but needed for Sheet functionality */}
          <button style={{ display: 'none' }} />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-full bg-white flex flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden flex-shrink-0"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <h1 className="text-lg md:text-xl font-semibold text-gray-900 capitalize truncate">
                {activeTab === "dashboard" ? "Dashboard" : 
                 activeTab === "messages" ? "Messages" :
                 activeTab === "contacts" ? "Patient Contacts" :
                 activeTab === "sms" ? "SMS Manager" :
                 activeTab === "phone-numbers" ? "Phone Numbers" :
                 activeTab === "analytics" ? "Analytics & Reports" :
                 activeTab === "team" ? "Team Management" :
                 activeTab === "automation" ? "SMS Automation" :
                 activeTab === "omnichannel" ? "Omnichannel Messaging" :
                 activeTab === "admin" ? "Admin Dashboard" : activeTab}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              {/* Search - Hidden on small mobile, visible on tablet+ */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search..." className="pl-10 w-32 md:w-64" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    title={
                      notificationPermission === 'granted' 
                        ? 'Notifications enabled' 
                        : 'Click to enable notifications'
                    }
                    className={`${
                      notificationPermission === 'granted' 
                        ? 'text-green-600 border-green-200 bg-green-50' 
                        : 'text-gray-600'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    {notificationPermission === 'granted' && (
                      <span className="ml-1 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Notification Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <div className="flex items-center w-full">
                      <Bell className="w-4 h-4 mr-2" />
                      <span className="flex-1">Status:</span>
                      <span className={`text-xs font-medium ${
                        notificationPermission === 'granted' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  {notificationPermission !== 'granted' && (
                    <DropdownMenuItem onClick={requestNotificationPermission}>
                      <Shield className="w-4 h-4 mr-2" />
                      Enable Notifications
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Activity className="w-4 h-4 mr-2" />
                    Sound: {notificationPermission === 'granted' ? 'On' : 'Off'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="w-4 h-4 mr-2" />
                    Desktop: {notificationPermission === 'granted' ? 'On' : 'Off'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Activity className="w-4 h-4 mr-2" />
                    Realtime: {isAuthenticated ? 'Connected' : 'Disconnected'}
                  </DropdownMenuItem>
                  {isDevMode && (
                    <DropdownMenuItem onClick={testRealtime}>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Test Realtime
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {activeTab === "dashboard" && (
            <div className="h-full overflow-y-auto">
              <Dashboard />
            </div>
          )}
          
          {activeTab === "messages" && (
            <div className="h-full flex overflow-hidden">
              {/* Conversations Panel - Fixed Width */}
              <div className="bg-white border-r border-gray-200 w-80 flex-shrink-0 flex">
                <div className="w-full flex flex-col h-full">
                  {/* Messages Header */}
                  <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                          {(() => {
                            const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
                            const currentPhone = getCurrentPhoneNumber();
                            
                            console.log('🔔 Messages Header - Total unread for current inbox:', totalUnread, 'Phone:', currentPhone?.display_name);
                            console.log('🔔 Messages Header - Conversation unread details:', conversations.map(c => ({
                              patient: c.patient.name,
                              unreadCount: c.unreadCount,
                              lastMessage: c.lastMessage?.content?.substring(0, 30) + '...'
                            })));
                            
                            return totalUnread > 0 ? (
                              <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                                {totalUnread > 99 ? '99+' : totalUnread}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">{conversations.length}</Badge>
                            );
                          })()}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => setShowNewMessageDialog(true)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            New
                          </Button>
                        </div>
                      </div>
                      
                      {/* Phone Number Switcher - ALWAYS VISIBLE */}
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location ({phoneNumbers.length} available)</label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              <div className="flex items-center space-x-2">
                                <Building2 className="w-4 h-4" />
                                <span>{getCurrentPhoneNumber()?.display_name || `No location selected (${phoneNumbers.length} available)`}</span>
                              </div>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {phoneNumbers.length > 0 ? phoneNumbers.map((phone) => (
                              <DropdownMenuItem
                                key={phone.id}
                                onClick={() => handlePhoneNumberSwitch(phone.id)}
                                className={`cursor-pointer ${
                                  currentPhoneNumberId === phone.id ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <div>
                                    <div className="font-medium">{phone.display_name}</div>
                                    <div className="text-xs text-gray-500">{phone.phone_number}</div>
                                  </div>
                                  {currentPhoneNumberId === phone.id && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                              </DropdownMenuItem>
                            )) : (
                              <DropdownMenuItem disabled>
                                <div className="text-gray-500">No phone numbers configured</div>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search conversations..."
                          className="pl-10" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">
                          {searchQuery ? "No conversations found" : "No conversations yet"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {searchQuery ? "Try adjusting your search" : "Start messaging your patients"}
                        </p>
                        {!searchQuery && (
                          <Button 
                            onClick={() => setShowNewMessageDialog(true)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Start First Conversation</span>
                            <span className="sm:hidden">Start Chat</span>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conversation) => {
                          const isSelected = selectedPatient?.id === conversation.patient.id;
                          const hasUnread = conversation.unreadCount > 0;
                          
                          return (
                            <div
                              key={conversation.patient.id}
                                                              onClick={() => {
                                  handlePatientSelect(conversation.patient);
                                }}
                                className={`p-3 md:p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                                  isSelected 
                                    ? "bg-blue-50 border-l-blue-600 shadow-sm" 
                                    : hasUnread 
                                      ? "bg-red-50 border-l-red-500 hover:bg-red-100 shadow-sm ring-1 ring-red-100" 
                                      : "border-l-transparent hover:bg-gray-50 hover:border-l-gray-300"
                                }`}
                            >
                                    <div className="flex items-start space-x-3">
                                                                      <div className="relative">
                                  <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                                      {conversation.patient.name.split(' ').map(n => n[0]?.toUpperCase()).filter(Boolean).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {conversation.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg ring-2 ring-white animate-pulse">
                                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                    </div>
                                  )}
                                </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                          <h3 className={`truncate flex-1 ${
                                            conversation.unreadCount > 0 
                                              ? 'text-gray-900 font-bold text-base' 
                                              : 'text-gray-900 font-medium'
                                          }`}>
                                            {conversation.patient.name}
                                            {conversation.unreadCount > 0 && (
                                              <span className="inline-block w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                                            )}
                                          </h3>
                                          <span className={`text-xs ml-2 flex-shrink-0 ${
                                            conversation.unreadCount > 0 ? 'text-red-600 font-medium' : 'text-gray-500'
                                          }`}>
                                            {conversation.lastMessage 
                                              ? formatLastMessageTime(conversation.lastActivity)
                                              : "New"
                                            }
                                          </span>
                                        </div>
                                        
                                        <p className={`text-sm truncate mb-2 ${
                                          conversation.unreadCount > 0 
                                            ? 'text-gray-900 font-semibold' 
                                            : 'text-gray-500'
                                        }`}>
                                          {getLastMessagePreview(conversation)}
                                        </p>
                                        
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-1 flex-1 min-w-0">
                                            <Badge 
                                              variant="secondary" 
                                              className="text-xs flex-shrink-0"
                                            >
                                              {conversation.patient.preferred_channel.toUpperCase()}
                                            </Badge>
                                            <div className="flex items-center space-x-1 text-gray-400">
                                              {conversation.patient.phone && (
                                                <Phone className="w-3 h-3 flex-shrink-0" />
                                              )}
                                              {conversation.patient.email && (
                                                <Mail className="w-3 h-3 flex-shrink-0" />
                                              )}
                                            </div>
                                          </div>
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
              {/* Chat Area - Takes remaining space, no responsive hiding */}
              <div className="flex-1 min-w-0 bg-gray-50">
                {selectedPatient ? (
                  <div className="h-full flex flex-col">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
                      <div className="flex items-center space-x-3 min-w-0">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                            {selectedPatient.name.split(' ').map(n => n[0]?.toUpperCase()).filter(Boolean).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{selectedPatient.name}</h3>
                          <p className="text-sm text-gray-500 truncate">
                            {selectedPatient.phone || selectedPatient.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Toggle patient profile"
                          onClick={() => setShowPatientProfile(!showPatientProfile)}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Call patient">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Message Area - Takes remaining space */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <MessageArea 
                        patient={selectedPatient} 
                        channel={selectedChannel}
                        currentPhoneNumberId={currentPhoneNumberId}
                        onMessageSent={handleMessageSent}
                        onMessagesRead={fetchConversations}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a patient to start messaging</h3>
                      <p className="text-gray-500">Choose from your patient list to begin a conversation</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Patient Profile Panel - Hidden on smaller screens */}
              {selectedPatient && showPatientProfile && (
                <div className="hidden lg:block bg-white border-l border-gray-200 w-80 flex-shrink-0">
                  <PatientProfile 
                    patient={selectedPatient} 
                    onPatientUpdated={handlePatientUpdated}
                    onPatientDeleted={handlePatientDeleted}
                  />
                </div>
              )}
            </div>
          )}
          
          {activeTab === "contacts" && (
            <div className="h-full overflow-y-auto">
              <ContactsManager onPatientUpdated={handlePatientUpdated} onPatientDeleted={handlePatientDeleted} />
            </div>
          )}
          {activeTab === "sms" && (
            <div className="h-full overflow-y-auto">
              <BulkSMSManager />
            </div>
          )}
          {activeTab === "phone-numbers" && (
            <div className="h-full overflow-y-auto">
              <AddPhoneNumber />
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="h-full overflow-y-auto">
              <SMSAnalyticsDashboard />
            </div>
          )}
          {activeTab === "team" && (
            <div className="h-full overflow-y-auto">
              <TeamSidebar selectedInbox={null} onSelectInbox={() => {}} />
            </div>
          )}
          {activeTab === "automation" && (
            <div className="h-full overflow-y-auto">
              <SMSAutomation />
            </div>
          )}
          {activeTab === "omnichannel" && (
            <div className="h-full overflow-y-auto">
              <OmnichannelMessaging />
            </div>
          )}
          {activeTab === "admin" && (
            <div className="h-full overflow-y-auto">
              <AdminDashboard />
            </div>
          )}
        </div>
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}
        onPatientSelected={handleNewMessagePatientSelected}
        onPatientAdded={handleNewMessagePatientAdded}
      />
    </div>
  );
}
