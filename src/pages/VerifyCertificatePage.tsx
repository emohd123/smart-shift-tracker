
import VerifyCertificate from "@/components/certificates/VerifyCertificate";

export default function VerifyCertificatePage() {
  return (
    <div className="container max-w-4xl mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">SmartShift</h1>
        <p className="text-muted-foreground">Certificate Verification System</p>
      </div>
      
      <VerifyCertificate />
      
      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>This certificate verification system confirms the authenticity of work certificates issued by SmartShift.</p>
        <p className="mt-2">© {new Date().getFullYear()} SmartShift. All rights reserved.</p>
      </div>
    </div>
  );
}
