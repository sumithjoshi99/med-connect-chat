import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { supabase } from '../integrations/supabase/client';

export const AddPhoneNumber = () => {
  const [loading, setLoading] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const { toast } = useToast();

  const addNewRochelleNumber = async () => {
    setLoading(true);
    try {
      // First, update the existing Mount Vernon number
      const { error: updateError } = await supabase
        .from('twilio_phone_numbers')
        .update({
          display_name: 'Mount Vernon Location',
          department: 'mount_vernon',
          updated_at: new Date().toISOString()
        })
        .eq('phone_number', '+19142221900');

      if (updateError) {
        console.error('Error updating Mount Vernon location:', updateError);
        throw updateError;
      }

      // Add the New Rochelle location number
      const { error: insertError } = await supabase
        .from('twilio_phone_numbers')
        .insert([{
          phone_number: '+19143657099',
          display_name: 'New Rochelle Location',
          twilio_account_sid: 'AC956237533bdb4805ba26c3191c69a858',
          twilio_auth_token: '467735fdc396abfca88f9992aae30dc5',
          is_active: true,
          is_primary: false,
          department: 'new_rochelle',
          webhook_url: 'https://wfhslrzkjgyrxwxlyjyx.supabase.co/functions/v1/sms-webhook',
          status_callback_url: 'https://wfhslrzkjgyrxwxlyjyx.supabase.co/functions/v1/sms-delivery-webhook'
        }]);

      if (insertError) {
        console.error('Error adding New Rochelle phone number:', insertError);
        throw insertError;
      }

      toast({
        title: "Success!",
        description: "New Rochelle phone number added successfully",
      });

      // Refresh the phone numbers list
      await fetchPhoneNumbers();
    } catch (error) {
      console.error('Error adding phone number:', error);
      toast({
        title: "Error",
        description: "Failed to add phone number: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('twilio_phone_numbers')
        .select('phone_number, display_name, department, is_active, is_primary')
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    }
  };

  React.useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Rochelle Phone Number</CardTitle>
          <CardDescription>
            Add your second Twilio phone number for the New Rochelle location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone Number</Label>
              <Input value="+1 (914) 365-7099" disabled />
            </div>
            <div>
              <Label>Display Name</Label>
              <Input value="New Rochelle Location" disabled />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <Input value="new_rochelle" disabled />
            </div>
            <div>
              <Label>Status</Label>
              <Input value="Active (Non-Primary)" disabled />
            </div>
          </div>
          <Button 
            onClick={addNewRochelleNumber} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Adding...' : 'Add New Rochelle Phone Number'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Phone Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {phoneNumbers.map((number, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{number.phone_number}</div>
                  <div className="text-sm text-gray-500">{number.display_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{number.department}</div>
                  <div className="text-xs text-gray-500">
                    {number.is_primary ? 'Primary' : 'Secondary'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 