
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Phone, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  preferred_channel: string;
  status: string;
  created_at: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface PatientListProps {
  searchQuery: string;
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
}

export const PatientList = ({ searchQuery, selectedPatient, onSelectPatient }: PatientListProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get message counts and last messages for each patient
      const patientsWithMessages = await Promise.all(
        (data || []).map(async (patient) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('patient_id', patient.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMessage = messages?.[0];
          
          return {
            ...patient,
            lastMessage: lastMessage?.content || "No messages yet",
            lastMessageTime: lastMessage ? new Date(lastMessage.created_at).toLocaleString() : "",
            unreadCount: 0 // This would need more complex logic based on read status
          };
        })
      );

      setPatients(patientsWithMessages);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <MessageSquare className="h-3 w-3" />;
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'phone':
        return <Phone className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {filteredPatients.map((patient) => (
        <Card
          key={patient.id}
          className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedPatient?.id === patient.id ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onClick={() => onSelectPatient(patient)}
        >
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {patient.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {patient.name}
                </h4>
                {patient.unreadCount && patient.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] text-xs">
                    {patient.unreadCount}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">{patient.id.slice(0, 8)}</p>
              <p className="text-sm text-gray-600 truncate mb-2">
                {patient.lastMessage}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{patient.lastMessageTime}</span>
                <div className="flex items-center space-x-1">
                  {getChannelIcon(patient.preferred_channel)}
                  <Badge 
                    variant={patient.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {patient.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
      {filteredPatients.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          <p>No patients found.</p>
        </div>
      )}
    </div>
  );
};
