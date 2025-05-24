
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, Phone, Mail, MessageSquare, Users, Plus, Settings } from "lucide-react";
import { PatientList } from "@/components/PatientList";
import { MessageArea } from "@/components/MessageArea";
import { ChannelSelector } from "@/components/ChannelSelector";
import { PatientProfile } from "@/components/PatientProfile";

const Index = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState("sms");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PharmaCare Messaging</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Avatar>
              <AvatarFallback>DR</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Patient List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
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
        <div className="flex-1 flex flex-col">
          {selectedPatient ? (
            <>
              {/* Patient Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedPatient.name}</h3>
                      <p className="text-sm text-gray-500">Patient ID: {selectedPatient.id}</p>
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
                <div className="w-80 border-l border-gray-200">
                  <PatientProfile patient={selectedPatient} />
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to PharmaCare Messaging
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Select a patient from the sidebar to start a conversation or add a new patient to begin messaging.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Patient
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
