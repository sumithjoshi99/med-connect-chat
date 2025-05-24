
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

interface PatientProfileProps {
  patient: any;
}

export const PatientProfile = ({ patient }: PatientProfileProps) => {
  // Mock patient details
  const patientDetails = {
    ...patient,
    dateOfBirth: "March 15, 1985",
    address: "123 Main St, Springfield, IL 62701",
    emergencyContact: "John Johnson (Husband) - (555) 987-6543",
    allergies: ["Penicillin", "Shellfish"],
    medications: [
      { name: "Lisinopril 10mg", prescribedDate: "2024-01-15", refillsLeft: 3 },
      { name: "Metformin 500mg", prescribedDate: "2024-01-10", refillsLeft: 2 },
    ],
    lastVisit: "January 20, 2024",
    nextAppointment: "February 15, 2024",
    insuranceProvider: "Blue Cross Blue Shield",
    preferredContactTime: "Mornings (9 AM - 12 PM)"
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4">
        {/* Patient Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Patient Information</CardTitle>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{patientDetails.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Born {patientDetails.dateOfBirth}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{patientDetails.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{patientDetails.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{patientDetails.address}</span>
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
                {patientDetails.preferredChannel?.toUpperCase() || 'SMS'}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Best Contact Time:</span>
              <p className="text-sm text-gray-600">{patientDetails.preferredContactTime}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Emergency Contact:</span>
              <p className="text-sm text-gray-600">{patientDetails.emergencyContact}</p>
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
              {patientDetails.allergies.map((allergy, index) => (
                <Badge key={index} variant="destructive" className="mr-2">
                  {allergy}
                </Badge>
              ))}
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
              {patientDetails.medications.map((medication, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{medication.name}</h4>
                    <Badge variant="outline">
                      {medication.refillsLeft} refills left
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Prescribed: {medication.prescribedDate}
                  </p>
                </div>
              ))}
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
              <p className="text-sm text-gray-600">{patientDetails.insuranceProvider}</p>
            </div>
            <Separator />
            <div>
              <span className="text-sm font-medium">Last Visit:</span>
              <p className="text-sm text-gray-600">{patientDetails.lastVisit}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Next Appointment:</span>
              <p className="text-sm text-gray-600">{patientDetails.nextAppointment}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
