import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, ChevronRight, ArrowRight, Shield, Users, Building2, Clock, DollarSign, Award, CheckCircle2, AlertCircle, UserCheck, Briefcase, FileCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HelpGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HelpGuide({ open, onOpenChange }: HelpGuideProps) {
  const { user } = useAuth();
  const role = user?.role || "user";

  const isPromoter = role === "promoter" || role === "part_timer";
  const isCompany = role === "company";
  const isAdmin = role === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-6 w-6 text-primary" />
            SmartShift — How It Works
          </DialogTitle>
        </DialogHeader>

        <div className="bg-primary/5 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Platform Overview
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            SmartShift Tracker connects <strong>Companies</strong> (brands & event organizers) with <strong>Promoters</strong> (part-timers & freelancers).
            Companies post shift opportunities. Promoters apply, work, and get paid. Admins oversee everything and issue verified work certificates.
          </p>
        </div>

        <div className="space-y-4">
          {/* PROMOTER FLOW */}
          {(isPromoter || isAdmin) && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-blue-50 px-4 py-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Promoter — Full Flow</h3>
              </div>
              <div className="p-4 space-y-3">
                <Step icon={<UserCheck className="h-4 w-4" />} color="bg-green-100 text-green-600" title="1. Sign Up & Get Approved" desc="Create your promoter account with personal details, bank info, and ID. Wait for admin approval. You will receive a unique PROMO-XXXXXX code." />
                <Arrow />
                <Step icon={<Building2 className="h-4 w-4" />} color="bg-blue-100 text-blue-600" title="2. Browse & Accept Shifts" desc="View available shifts in your dashboard. Each shift shows: event name, company, location, time, and pay rate. Click to view details and accept the shift." />
                <Arrow />
                <Step icon={<Clock className="h-4 w-4" />} color="bg-orange-100 text-orange-600" title="3. Check In (Day of Shift)" desc="Arrive at the location. Open the shift in your dashboard. Click 'Check In' to record your start time and GPS location. Shift status changes to 'Ongoing'." />
                <Arrow />
                <Step icon={<Briefcase className="h-4 w-4" />} color="bg-purple-100 text-purple-600" title="4. Work the Shift" desc="Perform your duties as assigned. The system tracks your work session. You can check your session history anytime in the shift details." />
                <Arrow />
                <Step icon={<CheckCircle2 className="h-4 w-4" />} color="bg-teal-100 text-teal-600" title="5. Check Out (Shift Complete)" desc="When finished, click 'Check Out' to record your end time. Hours are calculated automatically: End Time - Start Time = Total Hours Worked." />
                <Arrow />
                <Step icon={<DollarSign className="h-4 w-4" />} color="bg-emerald-100 text-emerald-600" title="6. Get Paid" desc="Payment is calculated: Hours Worked x Pay Rate = Total Payable. The company processes payment according to the payment schedule in the contract." />
                <Arrow />
                <Step icon={<Award className="h-4 w-4" />} color="bg-yellow-100 text-yellow-600" title="7. Request Certificate" desc="After completing shifts, request a Work Experience Certificate from the admin. It includes: your details, company info, events worked, total hours, and a QR code for verification." />

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Important:</strong> Always check in and out properly. If you check in and out at the same time, your hours will show as 0. Make sure to check out AFTER your shift ends.</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* COMPANY FLOW */}
          {(isCompany || isAdmin) && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-emerald-50 px-4 py-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-900">Company — Full Flow</h3>
              </div>
              <div className="p-4 space-y-3">
                <Step icon={<FileCheck className="h-4 w-4" />} color="bg-green-100 text-green-600" title="1. Register & Get Verified" desc="Sign up as a company with your business details, CR/Registration number, and industry. Wait for admin approval before creating shifts." />
                <Arrow />
                <Step icon={<Briefcase className="h-4 w-4" />} color="bg-blue-100 text-blue-600" title="2. Create a Shift" desc="Go to Shifts → Create Shift. Fill the 5-step wizard: shift details, payment schedule, contract preview, assign promoters, review & send. Set clear title, location, date/time, and pay rate." />
                <Arrow />
                <Step icon={<Users className="h-4 w-4" />} color="bg-purple-100 text-purple-600" title="3. Assign Promoters" desc="Select from approved promoters in the system. You can assign multiple promoters per shift. They will see the shift in their dashboard and can accept or decline." />
                <Arrow />
                <Step icon={<Clock className="h-4 w-4" />} color="bg-orange-100 text-orange-600" title="4. Monitor Shift Progress" desc="Track shift status in real-time: Upcoming → Ongoing → Completed. View promoter check-in/check-out times, hours worked, and any notes in the shift detail page." />
                <Arrow />
                <Step icon={<DollarSign className="h-4 w-4" />} color="bg-emerald-100 text-emerald-600" title="5. Process Payment" desc="After shift completion, review hours worked and total payable. The system auto-calculates: Hours x Rate = Total. Process payment as per your contract schedule." />
                <Arrow />
                <Step icon={<Award className="h-4 w-4" />} color="bg-yellow-100 text-yellow-600" title="6. Issue Certificates" desc="Request admin to generate work experience certificates for promoters who completed their shifts. Certificates include your company branding and are verifiable online." />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Tip:</strong> Be clear about pay rates. If you pay per day, write 'BHD X per day' in the description so promoters understand the full earning, not per hour.</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN FLOW */}
          {isAdmin && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-red-50 px-4 py-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Admin — Full Flow</h3>
              </div>
              <div className="p-4 space-y-3">
                <Step icon={<UserCheck className="h-4 w-4" />} color="bg-green-100 text-green-600" title="1. Approve Users" desc="Review and approve new promoter and company registrations. Check their documents, bank details, and CR numbers before approval. Reject incomplete or suspicious applications." />
                <Arrow />
                <Step icon={<Users className="h-4 w-4" />} color="bg-blue-100 text-blue-600" title="2. Monitor All Shifts" desc="View all shifts across all companies. Filter by status: All, Current, Completed, Upcoming. Oversee assignments, hours, and payments." />
                <Arrow />
                <Step icon={<DollarSign className="h-4 w-4" />} color="bg-emerald-100 text-emerald-600" title="3. Track Revenue" desc="Monitor platform revenue from certificate sales. View reports on promoter activity, company spend, and total hours worked. Default reports show all-time data." />
                <Arrow />
                <Step icon={<Award className="h-4 w-4" />} color="bg-yellow-100 text-yellow-600" title="4. Generate Certificates" desc="Go to Certificates → select a promoter → choose their completed shifts → preview → generate PDF. Certificates include promoter details, company info, event history, total hours, QR code, and official seal." />
                <Arrow />
                <Step icon={<FileCheck className="h-4 w-4" />} color="bg-purple-100 text-purple-600" title="5. Manage Data" desc="Export data, manage users, resolve disputes, and configure platform settings. Full oversight of the entire workforce ecosystem." />
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Common Questions & Fixes</h3>
            </div>
            <div className="p-4 space-y-3">
              <Faq q="Why do my hours show 0.0?" a="You must check in when you start and check out when you finish. If you check in and out at the same minute, the system records 0 hours. Make sure to check out AFTER your shift ends." />
              <Faq q="Why is my shift status wrong?" a="Shift statuses auto-update based on date and time. 'Upcoming' = future, 'Ongoing' = currently happening, 'Completed' = past. Past shifts should automatically show 'Completed'." />
              <Faq q="How do I get paid?" a="Payments are processed by the company after shift completion. The system calculates: Hours Worked x Pay Rate = Total Payable. Contact the company directly for payment status." />
              <Faq q="How do I get a certificate?" a="Complete at least one shift first. Then go to Certificates (or ask admin). Select your completed shifts and click 'Generate Certificate'. The PDF will download with your work history." />
              <Faq q="Why does my page show 404 when I refresh?" a="This was a routing issue that has been fixed. If you still see it, clear your browser cache and try again. Or navigate using the sidebar menu instead of browser refresh." />
              <Faq q="Can I work for multiple companies?" a="Yes! As a promoter, you can accept shifts from any approved company. Your certificate will show all companies you worked for with their details." />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Need more help? Contact admin at <strong>smartshift@onestoneads.com</strong>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Step({ icon, color, title, desc }: { icon: React.ReactNode; color: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center pl-4">
      <div className="w-6 h-[2px] bg-border" />
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <p className="font-semibold text-sm mb-1 flex items-center gap-2">
        <ArrowRight className="h-3 w-3 text-primary" />
        {q}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">{a}</p>
    </div>
  );
}