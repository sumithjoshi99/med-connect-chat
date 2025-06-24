import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  Check,
  AlertCircle,
  Loader2,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientAdded: () => void;
}

export const AddPatientDialog = ({ open, onOpenChange, onPatientAdded }: AddPatientDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    preferred_channel: "sms"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testingConnection, setTestingConnection] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      preferred_channel: "sms"
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Patient name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Validate phone if provided
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // At least one contact method required
    if (!formData.phone && !formData.email) {
      newErrors.contact = "Please provide at least a phone number or email address";
    }

    // Validate preferred channel makes sense
    if (formData.preferred_channel === 'sms' && !formData.phone) {
      newErrors.preferred_channel = "SMS requires a phone number";
    }
    if (formData.preferred_channel === 'email' && !formData.email) {
      newErrors.preferred_channel = "Email channel requires an email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const testConnection = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before testing connection",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    try {
      console.log('Testing connection to Supabase...');
      
      const { data, error } = await supabase
        .from('patients')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Connection test failed:', error);
        throw error;
      }

      console.log('Connection test successful');
      toast({
        title: "Connection Test Successful",
        description: "Database connection is working properly",
      });
    } catch (error) {
      console.error('Connection test error:', error);
      toast({
        title: "Connection Test Failed",
        description: error.message || "Failed to connect to database",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return null;
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    const formattedPhone = formatPhoneNumber(formData.phone.trim());
    console.log('Adding patient with data:', { ...formData, phone: formattedPhone });

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: formData.name.trim(),
          phone: formattedPhone,
          email: formData.email.trim() || null,
          preferred_channel: formData.preferred_channel,
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Patient added successfully:', data);

      toast({
        title: "Patient added successfully",
        description: `${formData.name} has been added to your patient list`,
      });

      resetForm();
      onPatientAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding patient:', error);
      let errorMessage = "Failed to add patient";
      
      if (error?.code === '23505') {
        errorMessage = "A patient with this information already exists";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    // Clear contact error if they provide a contact method
    if ((field === 'phone' || field === 'email') && value && errors.contact) {
      setErrors(prev => ({ ...prev, contact: "" }));
    }
  };

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

  const getChannelRequirement = (channel: string) => {
    switch (channel) {
      case 'sms':
        return "Requires phone number";
      case 'email':
        return "Requires email address";
      case 'whatsapp':
        return "Requires phone number";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <span>Add New Patient</span>
          </DialogTitle>
          <DialogDescription>
            Add a new patient to start managing their care communications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Patient Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter patient's full name"
              className={cn(
                "transition-all duration-200",
                errors.name 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                  : "focus:border-blue-500 focus:ring-blue-500"
              )}
              disabled={loading}
            />
            {errors.name && (
              <div className="flex items-center space-x-1 text-sm text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900">Contact Information</h3>
              <Badge variant="secondary" className="text-xs">
                At least one required
              </Badge>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center space-x-2">
                <Phone className="w-3 h-3" />
                <span>Phone Number</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={cn(
                  "transition-all duration-200",
                  errors.phone 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                    : "focus:border-blue-500 focus:ring-blue-500"
                )}
                disabled={loading}
              />
              {errors.phone && (
                <div className="flex items-center space-x-1 text-sm text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center space-x-2">
                <Mail className="w-3 h-3" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="patient@example.com"
                className={cn(
                  "transition-all duration-200",
                  errors.email 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                    : "focus:border-blue-500 focus:ring-blue-500"
                )}
                disabled={loading}
              />
              {errors.email && (
                <div className="flex items-center space-x-1 text-sm text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {errors.contact && (
              <div className="flex items-center space-x-1 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.contact}</span>
              </div>
            )}
          </div>

          {/* Preferred Channel */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Preferred Communication Channel</Label>
            <Select 
              value={formData.preferred_channel} 
              onValueChange={(value) => handleInputChange('preferred_channel', value)}
              disabled={loading}
            >
              <SelectTrigger className={cn(
                "transition-all duration-200",
                errors.preferred_channel 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                  : "focus:border-blue-500 focus:ring-blue-500"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>SMS Text Messages</span>
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {formData.preferred_channel && (
              <div className="flex items-center space-x-2 text-xs text-gray-600 bg-blue-50 p-2 rounded-md">
                <Info className="w-3 h-3" />
                <span>{getChannelRequirement(formData.preferred_channel)}</span>
              </div>
            )}
            
            {errors.preferred_channel && (
              <div className="flex items-center space-x-1 text-sm text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.preferred_channel}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={loading || testingConnection}
                className="flex-1"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              
              <Button
                type="submit"
                disabled={loading || testingConnection}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Patient
                  </>
                )}
              </Button>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
