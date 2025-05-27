
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, Settings, Menu } from "lucide-react";
import { PatientList } from "@/components/PatientList";
import { MessageArea } from "@/components/MessageArea";
import { ChannelSelector } from "@/components/ChannelSelector";
import { PatientProfile } from "@/components/PatientProfile";
import { AddPatientDialog } from "@/components/AddPatientDialog";

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  preferred_channel: string;
  status: string;
}

const Index = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedChannel, setSelectedChannel] = useState("sms");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProfile, setShowProfile] = useState(true);

  const handlePatientAdded = () => {
    // Trigger refresh of patient list
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900">
                <span className="hidden sm:inline">PharmaCare Messaging</span>
                <span className="sm:hidden">PharmaCare</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="sm:hidden">
              <Settings className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>DR</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Patient List */}
        <div className={`w-full sm:w-80 bg-white border-r border-gray-200 flex flex-col ${
          showSidebar ? 'block' : 'hidden'
        } ${selectedPatient ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
              <AddPatientDialog onPatientAdded={handlePatientAdded} />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PatientList 
              searchQuery={searchQuery}
              selectedPatient={selectedPatient}
              onSelectPatient={setSelectedPatient}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col ${
          !selectedPatient && showSidebar ? 'hidden lg:flex' : 'flex'
        }`}>
          {selectedPatient ? (
            <>
              {/* Patient Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setSelectedPatient(null)}
                    >
                      ← Back
                    </Button>
                    <Avatar className="h-10 w-10 lg:h-12 lg:w-12">
                      <AvatarFallback>
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900">{selectedPatient.name}</h3>
                      <p className="text-xs lg:text-sm text-gray-500">ID: {selectedPatient.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={selectedPatient.status === 'active' ? 'default' : 'secondary'}>
                      {selectedPatient.status}
                    </Badge>
                    <ChannelSelector 
                      selectedChannel={selectedChannel}
                      onChannelChange={setSelectedChannel}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="xl:hidden"
                      onClick={() => setShowProfile(!showProfile)}
                    >
                      Profile
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 flex">
                <div className="flex-1">
                  <MessageArea 
                    patient={selectedPatient}
                    channel={selectedChannel}
                  />
                </div>
                <div className={`w-80 border-l border-gray-200 ${
                  showProfile ? 'hidden xl:block' : 'hidden'
                }`}>
                  <PatientProfile patient={selectedPatient} />
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
              <div className="text-center max-w-md">
                <MessageSquare className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                  Welcome to PharmaCare Messaging
                </h3>
                <p className="text-sm lg:text-base text-gray-500 mb-6">
                  Select a patient from the sidebar to start a conversation or add a new patient to begin messaging.
                </p>
                <AddPatientDialog onPatientAdded={handlePatientAdded} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
