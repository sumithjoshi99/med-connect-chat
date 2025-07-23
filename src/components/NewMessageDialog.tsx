import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Phone, Mail, MessageSquare, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Patient = Database['public']['Tables']['patients']['Row'];

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientSelected: (patient: Patient) => void;
  onPatientAdded: (patient: Patient) => void;
}

export const NewMessageDialog = ({ 
  open, 
  onOpenChange, 
  onPatientSelected,
  onPatientAdded 
}: NewMessageDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const { toast } = useToast();

  // New patient form
  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    email: "",
    preferred_channel: "sms",
    location: "mount_vernon"
  });

  useEffect(() => {
    if (open) {
      loadPatients();
      setSearchQuery("");
      setActiveTab("search");
    }
  }, [open]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('name');

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

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleSelectPatient = (patient: Patient) => {
    onPatientSelected(patient);
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleAddNewPatient = async () => {
    if (!newPatient.name || (!newPatient.phone && !newPatient.email)) {
      toast({
        title: "Error",
        description: "Name and at least one contact method are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedPhone = newPatient.phone ? formatPhoneNumber(newPatient.phone.trim()) : null;
      
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: newPatient.name,
          phone: formattedPhone,
          email: newPatient.email || null,
          preferred_channel: newPatient.preferred_channel,
          status: 'active',
          location: newPatient.location,
        }])
        .select()
        .single();

      if (error) throw error;

      onPatientAdded(data);
      onPatientSelected(data);
      onOpenChange(false);
      
      // Reset form
      setNewPatient({
        name: "",
        phone: "",
        email: "",
        preferred_channel: "sms",
        location: "mount_vernon"
      });

      toast({
        title: "Success",
        description: "Contact added and conversation started",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Start New Conversation</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Select Contact</TabsTrigger>
            <TabsTrigger value="add">Add New Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search contacts by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Contact List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading contacts...</span>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {searchQuery ? "No contacts found" : "No contacts available"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchQuery ? "Try a different search term" : "Add your first contact to get started"}
                  </p>
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                        {getInitials(patient.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{patient.name}</h3>
                        <div className="flex gap-1">
                          <Badge className={getStatusColor(patient.status)}>
                            {patient.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {patient.location?.replace('_', ' ') || 'Not set'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {patient.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 mr-2" />
                            {patient.phone}
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-3 h-3 mr-2" />
                            {patient.email}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Prefers {patient.preferred_channel.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                  placeholder="Enter patient's full name"
                />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="channel">Preferred Communication Channel</Label>
                  <Select 
                    value={newPatient.preferred_channel} 
                    onValueChange={(value) => setNewPatient({...newPatient, preferred_channel: value})}
                  >
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
                  <Label htmlFor="location">Location</Label>
                  <Select 
                    value={newPatient.location} 
                    onValueChange={(value) => setNewPatient({...newPatient, location: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mount_vernon">Mount Vernon</SelectItem>
                      <SelectItem value="new_rochelle">New Rochelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNewPatient}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add & Start Conversation
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 