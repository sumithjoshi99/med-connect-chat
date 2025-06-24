import { useState, useEffect } from "react";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Download,
  Upload,
  MoreVertical,
  Eye,
  X,
  Save,
  Calendar,
  MapPin,
  AlertCircle,
  FileText,
  Heart,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientFormData {
  name: string;
  phone: string;
  email: string;
  preferred_channel: string;
  status: string;
  date_of_birth: string;
  address: string;
  emergency_contact: string;
  allergies: string;
  medications: string;
  medical_conditions: string;
  insurance_provider: string;
  last_visit: string;
  next_appointment: string;
  notes: string;
}

interface ContactsManagerProps {
  onPatientUpdated?: (updatedPatient: Patient) => void;
  onPatientDeleted?: (deletedPatientId: string) => void;
}

export const ContactsManager = ({ onPatientUpdated, onPatientDeleted }: ContactsManagerProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // New patient form state
  const [newPatient, setNewPatient] = useState<PatientFormData>({
    name: "",
    phone: "",
    email: "",
    preferred_channel: "sms",
    status: "active",
    date_of_birth: "",
    address: "",
    emergency_contact: "",
    allergies: "",
    medications: "",
    medical_conditions: "",
    insurance_provider: "",
    last_visit: "",
    next_appointment: "",
    notes: ""
  });

  // Edit patient form state
  const [editPatient, setEditPatient] = useState<PatientFormData>({
    name: "",
    phone: "",
    email: "",
    preferred_channel: "sms",
    status: "active",
    date_of_birth: "",
    address: "",
    emergency_contact: "",
    allergies: "",
    medications: "",
    medical_conditions: "",
    insurance_provider: "",
    last_visit: "",
    next_appointment: "",
    notes: ""
  });

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery, selectedFilter]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    if (searchQuery) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone?.includes(searchQuery) ||
        patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== "all") {
      filtered = filtered.filter(patient => patient.status === selectedFilter);
    }

    setFilteredPatients(filtered);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return null;
    
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

  const parseArrayField = (value: string): string[] => {
    return value ? value.split(',').map(item => item.trim()).filter(item => item) : [];
  };

  const formatArrayField = (array: string[] | null | undefined): string => {
    return array ? array.join(', ') : '';
  };

  const addPatient = async () => {
    if (!newPatient.name || (!newPatient.phone && !newPatient.email)) {
      toast({
        title: "Error",
        description: "Name and at least one contact method are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(newPatient.phone.trim());
      
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: newPatient.name,
          phone: formattedPhone,
          email: newPatient.email || null,
          preferred_channel: newPatient.preferred_channel,
          status: newPatient.status,
          date_of_birth: newPatient.date_of_birth || null,
          address: newPatient.address || null,
          emergency_contact: newPatient.emergency_contact || null,
          allergies: parseArrayField(newPatient.allergies),
          medications: parseArrayField(newPatient.medications),
          medical_conditions: parseArrayField(newPatient.medical_conditions),
          insurance_provider: newPatient.insurance_provider || null,
          last_visit: newPatient.last_visit || null,
          next_appointment: newPatient.next_appointment || null,
          notes: newPatient.notes || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setPatients([data, ...patients]);
      setNewPatient({
        name: "",
        phone: "",
        email: "",
        preferred_channel: "sms",
        status: "active",
        date_of_birth: "",
        address: "",
        emergency_contact: "",
        allergies: "",
        medications: "",
        medical_conditions: "",
        insurance_provider: "",
        last_visit: "",
        next_appointment: "",
        notes: ""
      });
      setShowAddDialog(false);

      toast({
        title: "Success",
        description: "Contact added successfully",
      });
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive",
      });
    }
  };

  const updatePatient = async () => {
    if (!selectedPatient || !editPatient.name || (!editPatient.phone && !editPatient.email)) {
      toast({
        title: "Error",
        description: "Name and at least one contact method are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(editPatient.phone.trim());
      
      const { data, error } = await supabase
        .from('patients')
        .update({
          name: editPatient.name,
          phone: formattedPhone,
          email: editPatient.email || null,
          preferred_channel: editPatient.preferred_channel,
          status: editPatient.status,
          date_of_birth: editPatient.date_of_birth || null,
          address: editPatient.address || null,
          emergency_contact: editPatient.emergency_contact || null,
          allergies: parseArrayField(editPatient.allergies),
          medications: parseArrayField(editPatient.medications),
          medical_conditions: parseArrayField(editPatient.medical_conditions),
          insurance_provider: editPatient.insurance_provider || null,
          last_visit: editPatient.last_visit || null,
          next_appointment: editPatient.next_appointment || null,
          notes: editPatient.notes || null,
        })
        .eq('id', selectedPatient.id)
        .select()
        .single();

      if (error) throw error;

      setPatients(patients.map(p => p.id === selectedPatient.id ? data : p));
      setSelectedPatient(data);
      setIsEditing(false);

      // Notify parent component about the update
      onPatientUpdated?.(data);

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  const deletePatient = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this contact and all their medical information?")) return;

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;

      setPatients(patients.filter(p => p.id !== patientId));
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null);
        setShowProfileDialog(false);
      }

      // Notify parent component about the deletion
      onPatientDeleted?.(patientId);

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const openPatientProfile = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditPatient({
      name: patient.name,
      phone: patient.phone || "",
      email: patient.email || "",
      preferred_channel: patient.preferred_channel,
      status: patient.status,
      date_of_birth: patient.date_of_birth || "",
      address: patient.address || "",
      emergency_contact: patient.emergency_contact || "",
      allergies: formatArrayField(patient.allergies),
      medications: formatArrayField(patient.medications),
      medical_conditions: formatArrayField(patient.medical_conditions),
      insurance_provider: patient.insurance_provider || "",
      last_visit: patient.last_visit || "",
      next_appointment: patient.next_appointment || "",
      notes: patient.notes || ""
    });
    setIsEditing(false);
    setShowProfileDialog(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    inactive: patients.filter(p => p.status === 'inactive').length,
    blocked: patients.filter(p => p.status === 'blocked').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
              <p className="text-gray-600">Manage your patient database</p>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Blocked</p>
                  <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search contacts by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contacts</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedFilter !== "all" ? "No contacts found" : "No contacts yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedFilter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Add your first contact to get started"
              }
            </p>
            {!searchQuery && selectedFilter === "all" && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Contact
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <Card 
                key={patient.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openPatientProfile(patient)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                          {getInitials(patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                        <Badge className={getStatusColor(patient.status)}>
                          {patient.status}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          openPatientProfile(patient);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View/Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePatient(patient.id);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    {patient.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {patient.phone}
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {patient.email}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Prefers {patient.preferred_channel.toUpperCase()}
                    </div>
                    {patient.allergies && patient.allergies.length > 0 && (
                      <div className="flex items-center text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {patient.allergies.length} {patient.allergies.length === 1 ? 'allergy' : 'allergies'}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Added {new Date(patient.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Patient Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="contact" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
              <TabsTrigger value="medical">Medical Info</TabsTrigger>
              <TabsTrigger value="other">Other Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={newPatient.date_of_birth}
                    onChange={(e) => setNewPatient({...newPatient, date_of_birth: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input
                  id="emergency"
                  value={newPatient.emergency_contact}
                  onChange={(e) => setNewPatient({...newPatient, emergency_contact: e.target.value})}
                  placeholder="Name and phone number"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="channel">Preferred Channel</Label>
                  <Select value={newPatient.preferred_channel} onValueChange={(value) => setNewPatient({...newPatient, preferred_channel: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={newPatient.status} onValueChange={(value) => setNewPatient({...newPatient, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="medical" className="space-y-4">
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={newPatient.allergies}
                  onChange={(e) => setNewPatient({...newPatient, allergies: e.target.value})}
                  placeholder="Enter allergies separated by commas (e.g., Penicillin, Shellfish, Latex)"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  value={newPatient.medications}
                  onChange={(e) => setNewPatient({...newPatient, medications: e.target.value})}
                  placeholder="Enter current medications separated by commas"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="conditions">Medical Conditions</Label>
                <Textarea
                  id="conditions"
                  value={newPatient.medical_conditions}
                  onChange={(e) => setNewPatient({...newPatient, medical_conditions: e.target.value})}
                  placeholder="Enter medical conditions separated by commas"
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="other" className="space-y-4">
              <div>
                <Label htmlFor="insurance">Insurance Provider</Label>
                <Input
                  id="insurance"
                  value={newPatient.insurance_provider}
                  onChange={(e) => setNewPatient({...newPatient, insurance_provider: e.target.value})}
                  placeholder="e.g., Blue Cross Blue Shield"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="last-visit">Last Visit</Label>
                  <Input
                    id="last-visit"
                    type="date"
                    value={newPatient.last_visit}
                    onChange={(e) => setNewPatient({...newPatient, last_visit: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="next-appointment">Next Appointment</Label>
                  <Input
                    id="next-appointment"
                    type="datetime-local"
                    value={newPatient.next_appointment}
                    onChange={(e) => setNewPatient({...newPatient, next_appointment: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newPatient.notes}
                  onChange={(e) => setNewPatient({...newPatient, notes: e.target.value})}
                  placeholder="Any additional notes about the patient..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addPatient}>
              Add Patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-medium text-lg">
                    {selectedPatient ? getInitials(selectedPatient.name) : ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedPatient?.name}</h2>
                  <Badge className={getStatusColor(selectedPatient?.status || '')}>
                    {selectedPatient?.status}
                  </Badge>
                </div>
              </DialogTitle>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Button onClick={updatePatient} size="sm">
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {selectedPatient && (
            <Tabs defaultValue="contact" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="visits">Visits</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="contact" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="edit-name"
                        value={editPatient.name}
                        onChange={(e) => setEditPatient({...editPatient, name: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.name}</p>
                    )}
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editPatient.date_of_birth}
                        onChange={(e) => setEditPatient({...editPatient, date_of_birth: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.date_of_birth || 'Not provided'}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number</Label>
                    {isEditing ? (
                      <Input
                        value={editPatient.phone}
                        onChange={(e) => setEditPatient({...editPatient, phone: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.phone || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editPatient.email}
                        onChange={(e) => setEditPatient({...editPatient, email: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.email || 'Not provided'}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>Address</Label>
                  {isEditing ? (
                    <Textarea
                      value={editPatient.address}
                      onChange={(e) => setEditPatient({...editPatient, address: e.target.value})}
                      rows={2}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.address || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <Label>Emergency Contact</Label>
                  {isEditing ? (
                    <Input
                      value={editPatient.emergency_contact}
                      onChange={(e) => setEditPatient({...editPatient, emergency_contact: e.target.value})}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.emergency_contact || 'Not provided'}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preferred Channel</Label>
                    {isEditing ? (
                      <Select value={editPatient.preferred_channel} onValueChange={(value) => setEditPatient({...editPatient, preferred_channel: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.preferred_channel.toUpperCase()}</p>
                    )}
                  </div>
                  <div>
                    <Label>Status</Label>
                    {isEditing ? (
                      <Select value={editPatient.status} onValueChange={(value) => setEditPatient({...editPatient, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(selectedPatient.status)}>
                        {selectedPatient.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="medical" className="space-y-6 mt-6">
                <div>
                  <Label className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>Allergies</span>
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={editPatient.allergies}
                      onChange={(e) => setEditPatient({...editPatient, allergies: e.target.value})}
                      placeholder="Enter allergies separated by commas"
                      rows={2}
                    />
                  ) : (
                    <div className="mt-2">
                      {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedPatient.allergies.map((allergy, index) => (
                            <Badge key={index} variant="destructive">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No known allergies</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Current Medications</span>
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={editPatient.medications}
                      onChange={(e) => setEditPatient({...editPatient, medications: e.target.value})}
                      placeholder="Enter medications separated by commas"
                      rows={3}
                    />
                  ) : (
                    <div className="mt-2">
                      {selectedPatient.medications && selectedPatient.medications.length > 0 ? (
                        <div className="space-y-1">
                          {selectedPatient.medications.map((medication, index) => (
                            <p key={index} className="text-sm text-gray-900">• {medication}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No current medications</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>Medical Conditions</span>
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={editPatient.medical_conditions}
                      onChange={(e) => setEditPatient({...editPatient, medical_conditions: e.target.value})}
                      placeholder="Enter medical conditions separated by commas"
                      rows={3}
                    />
                  ) : (
                    <div className="mt-2">
                      {selectedPatient.medical_conditions && selectedPatient.medical_conditions.length > 0 ? (
                        <div className="space-y-1">
                          {selectedPatient.medical_conditions.map((condition, index) => (
                            <p key={index} className="text-sm text-gray-900">• {condition}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No medical conditions recorded</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label>Insurance Provider</Label>
                  {isEditing ? (
                    <Input
                      value={editPatient.insurance_provider}
                      onChange={(e) => setEditPatient({...editPatient, insurance_provider: e.target.value})}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.insurance_provider || 'Not provided'}</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="visits" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Last Visit</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editPatient.last_visit}
                        onChange={(e) => setEditPatient({...editPatient, last_visit: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.last_visit || 'No visits recorded'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Next Appointment</Label>
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={editPatient.next_appointment}
                        onChange={(e) => setEditPatient({...editPatient, next_appointment: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.next_appointment || 'No appointment scheduled'}</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-6 mt-6">
                <div>
                  <Label>Clinical Notes</Label>
                  {isEditing ? (
                    <Textarea
                      value={editPatient.notes}
                      onChange={(e) => setEditPatient({...editPatient, notes: e.target.value})}
                      placeholder="Enter any additional notes about the patient..."
                      rows={6}
                    />
                  ) : (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md min-h-[120px]">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedPatient.notes || 'No notes recorded'}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 