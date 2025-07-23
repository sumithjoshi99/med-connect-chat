import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock,
  Users,
  Filter,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AddPatientDialog } from "./AddPatientDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientListProps {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
  onPatientAdded: () => void;
}

export const PatientList = ({ selectedPatient, onPatientSelect, onPatientAdded }: PatientListProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAdded = () => {
    fetchPatients();
    onPatientAdded();
    setShowAddDialog(false);
  };

  const deletePatient = async (patientId: string) => {
    try {
      // First delete all messages for this patient
      await supabase
        .from('messages')
        .delete()
        .eq('patient_id', patientId);

      // Then delete the patient
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;

      setPatients(prev => prev.filter(p => p.id !== patientId));
      
      // If the deleted patient was selected, clear selection
      if (selectedPatient?.id === patientId) {
        onPatientSelect(null as any);
      }

      toast({
        title: "Patient deleted",
        description: "Patient and all messages have been removed",
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (patient.phone && patient.phone.includes(searchTerm)) ||
                         (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    const matchesLocation = locationFilter === "all" || patient.location === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const PatientCard = ({ patient }: { patient: Patient }) => {
    const isSelected = selectedPatient?.id === patient.id;
    
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
          isSelected 
            ? "border-blue-500 bg-blue-50 shadow-md" 
            : "border-gray-200 hover:border-gray-300"
        )}
        onClick={() => onPatientSelect(patient)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {patient.name}
                  </h3>
                  <div className="flex gap-1">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getStatusColor(patient.status))}
                    >
                      {patient.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {patient.location?.replace('_', ' ') || 'Not set'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {patient.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span className="truncate">{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {getChannelIcon(patient.preferred_channel)}
                    <span>Preferred: {patient.preferred_channel.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(patient.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Patient
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => deletePatient(patient.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Patient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Patients</h2>
            <Badge variant="secondary" className="ml-2">
              {filteredPatients.length}
            </Badge>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>
        
        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-fit">
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter === "all" ? "All Status" : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                Pending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-fit">
                <MapPin className="w-4 h-4 mr-2" />
                {locationFilter === "all" ? "All Locations" : locationFilter.replace('_', ' ')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocationFilter("all")}>
                All Locations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocationFilter("mount_vernon")}>
                Mount Vernon
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocationFilter("new_rochelle")}>
                New Rochelle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No patients found' : 'No patients yet'}
            </h3>
            <p className="text-gray-500 max-w-sm mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Add your first patient to start managing conversations'
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Patient
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 group">
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </div>

      {/* Add Patient Dialog */}
      <AddPatientDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onPatientAdded={handlePatientAdded}
      />
    </div>
  );
};
