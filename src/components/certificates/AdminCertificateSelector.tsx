
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminCertificateSelectorProps {
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  promoters: Array<{ id: string; full_name: string }>;
  loadingPromoters: boolean;
}

export default function AdminCertificateSelector({
  selectedUserId,
  setSelectedUserId,
  promoters,
  loadingPromoters
}: AdminCertificateSelectorProps) {
  const { user } = useAuth();

  return (
    <div className="space-y-2">
      <Label htmlFor="userId">Generate Certificate For</Label>
      <RadioGroup 
        defaultValue="self" 
        onValueChange={(value) => {
          if (value === "self") {
            setSelectedUserId(user?.id || "");
          } else {
            setSelectedUserId("");
          }
        }}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="self" id="self" />
          <Label htmlFor="self">Yourself</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="promoter" id="promoter" />
          <Label htmlFor="promoter">Promoter</Label>
        </div>
      </RadioGroup>
      
      {selectedUserId === "" && (
        <div className="pt-2">
          <Label htmlFor="promoterSelect">Select Promoter</Label>
          <Select 
            disabled={loadingPromoters}
            onValueChange={setSelectedUserId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a promoter" />
            </SelectTrigger>
            <SelectContent>
              {loadingPromoters ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                promoters.map(promoter => (
                  <SelectItem key={promoter.id} value={promoter.id}>
                    {promoter.full_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
