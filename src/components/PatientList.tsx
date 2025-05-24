
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Phone, Mail, MessageSquare } from "lucide-react";

// Mock patient data
const mockPatients = [
  {
    id: "P001",
    name: "Sarah Johnson",
    phone: "+1 (555) 123-4567",
    email: "sarah.johnson@email.com",
    lastMessage: "Thank you for the prescription reminder",
    lastMessageTime: "2 hours ago",
    status: "active",
    unreadCount: 2,
    preferredChannel: "sms"
  },
  {
    id: "P002",
    name: "Michael Chen",
    phone: "+1 (555) 234-5678",
    email: "m.chen@email.com",
    lastMessage: "When should I take the medication?",
    lastMessageTime: "5 hours ago",
    status: "active",
    unreadCount: 0,
    preferredChannel: "email"
  },
  {
    id: "P003",
    name: "Emily Rodriguez",
    phone: "+1 (555) 345-6789",
    email: "emily.r@email.com",
    lastMessage: "Prescription is ready for pickup",
    lastMessageTime: "1 day ago",
    status: "active",
    unreadCount: 1,
    preferredChannel: "sms"
  },
  {
    id: "P004",
    name: "David Thompson",
    phone: "+1 (555) 456-7890",
    email: "d.thompson@email.com",
    lastMessage: "Side effects question",
    lastMessageTime: "2 days ago",
    status: "inactive",
    unreadCount: 0,
    preferredChannel: "phone"
  }
];

interface PatientListProps {
  searchQuery: string;
  selectedPatient: any;
  onSelectPatient: (patient: any) => void;
}

export const PatientList = ({ searchQuery, selectedPatient, onSelectPatient }: PatientListProps) => {
  const filteredPatients = mockPatients.filter(patient =>
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
                {patient.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] text-xs">
                    {patient.unreadCount}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">{patient.id}</p>
              <p className="text-sm text-gray-600 truncate mb-2">
                {patient.lastMessage}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{patient.lastMessageTime}</span>
                <div className="flex items-center space-x-1">
                  {getChannelIcon(patient.preferredChannel)}
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
    </div>
  );
};
