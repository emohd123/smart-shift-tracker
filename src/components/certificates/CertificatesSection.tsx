
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkCertificateGenerator from "./WorkCertificateGenerator";
import MyCertificates from "./MyCertificates";

export default function CertificatesSection() {
  const [activeTab, setActiveTab] = useState<string>("generator");
  
  return (
    <Card className="w-full border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Work Certificates
        </CardTitle>
        <CardDescription>
          Generate and manage professional work certificates for your completed shifts
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="generator">Generate Certificate</TabsTrigger>
            <TabsTrigger value="certificates">My Certificates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="mt-0">
            <WorkCertificateGenerator />
          </TabsContent>
          
          <TabsContent value="certificates" className="mt-0">
            <MyCertificates />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
