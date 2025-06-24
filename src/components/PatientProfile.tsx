
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  FileText, 
  AlertCircle,
  Edit
} from "lucide-react";

type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientProfileProps {
  patient: Patient;
}

export const PatientProfile = ({ patient }: PatientProfileProps) => {
  const { toast } = useToast();
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return 'Not scheduled';
    return new Date(dateTimeString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4">
        {/* Patient Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Patient Information</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Edit Patient",
                    description: "Patient editing functionality will be available soon",
                  });
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{patient.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Born {formatDate(patient.date_of_birth)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{patient.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{patient.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{patient.address || 'Not provided'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Communication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium">Preferred Channel:</span>
              <Badge className="ml-2" variant="secondary">
                {patient.preferred_channel?.toUpperCase()}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Status:</span>
              <Badge className="ml-2" variant={patient.status === 'active' ? 'default' : 'secondary'}>
                {patient.status?.toUpperCase()}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Emergency Contact:</span>
              <p className="text-sm text-gray-600">{patient.emergency_contact || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Allergies & Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Allergies & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patient.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="mr-2">
                    {allergy}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">No known allergies</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patient.medications && patient.medications.length > 0 ? (
                patient.medications.map((medication, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm">{medication}</h4>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No current medications</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Insurance & Visits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Healthcare Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium">Insurance:</span>
              <p className="text-sm text-gray-600">{patient.insurance_provider || 'Not provided'}</p>
            </div>
            <Separator />
            <div>
              <span className="text-sm font-medium">Last Visit:</span>
              <p className="text-sm text-gray-600">{formatDate(patient.last_visit)}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Next Appointment:</span>
              <p className="text-sm text-gray-600">{formatDateTime(patient.next_appointment)}</p>
            </div>
            {patient.medical_conditions && patient.medical_conditions.length > 0 && (
              <>
                <Separator />
                <div>
                  <span className="text-sm font-medium">Medical Conditions:</span>
                  <div className="mt-2 space-y-1">
                    {patient.medical_conditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            {patient.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-sm font-medium">Notes:</span>
                  <p className="text-sm text-gray-600 mt-1">{patient.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
