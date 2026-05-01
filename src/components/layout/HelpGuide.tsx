import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  UserCheck,
  Clock,
  MapPin,
  DollarSign,
  Award,
  Building2,
  Users,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Shield,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HelpGuide() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const role = user?.role || "user";

  const isPromoter = role === "promoter" || role === "part_timer";
  const isCompany = role === "company";
  const isAdmin = role === "admin";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start px-2 h-9">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span className="text-sm">Help & Guide</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-6 w-6 text-primary" />
            SmartShift — How It Works
          </DialogTitle>
        </DialogHeader>

        {/* Platform Overview */}
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

        <Accordion type="single" collapsible defaultValue="promoter-flow" className="w-full">

          {/* PROMOTER FLOW */}
          {(isPromoter || isAdmin) && (
            <AccordionItem value="promoter-flow">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-semibold">Promoter — Full Flow</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pl-2">
                  <StepItem
                    icon={<UserCheck className="h-4 w-4" />}
                    color="bg-green-100 text-green-600"
                    title="1. Sign Up & Get Approved"
                    desc="Create your promoter account with personal details, bank info, and ID. Wait for admin approval. You will receive a unique PROMO-XXXXXX code."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Building2 className="h-4 w-4" />}
                    color="bg-blue-100 text-blue-600"
                    title="2. Browse & Accept Shifts"
                    desc="View available shifts in your dashboard. Each shift shows: event name, company, location, time, and pay rate. Click to view details and accept the shift."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Clock className="h-4 w-4" />}
                    color="bg-orange-100 text-orange-600"
                    title="3. Check In (Day of Shift)"
                    desc="Arrive at the location. Open the shift in your dashboard. Click 'Check In' to record your start time and GPS location. Shift status changes to 'Ongoing'."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Briefcase className="h-4 w-4" />}
                    color="bg-purple-100 text-purple-600"
                    title="4. Work the Shift"
                    desc="Perform your duties as assigned. The system tracks your work session. You can check your session history anytime in the shift details."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    color="bg-teal-100 text-teal-600"
                    title="5. Check Out (Shift Complete)"
                    desc="When finished, click 'Check Out' to record your end time. Hours are calculated automatically: End Time − Start Time = Total Hours Worked."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<DollarSign className="h-4 w-4" />}
                    color="bg-emerald-100 text-emerald-600"
                    title="6. Get Paid"
                    desc="Payment is calculated: Hours Worked × Pay Rate = Total Payable. The company processes payment according to the payment schedule in the contract."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Award className="h-4 w-4" />}
                    color="bg-yellow-100 text-yellow-600"
                    title="7. Request Certificate"
                    desc="After completing shifts, request a Work Experience Certificate from the admin. It includes: your details, company info, events worked, total hours, and a QR code for verification."
                  />

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-yellow-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Important:</strong> Always check in and out properly. If you check in and out at the same time, your hours will show as 0. Make sure to check out AFTER your shift ends.</span>
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* COMPANY FLOW */}
          {(isCompany || isAdmin) && (
            <AccordionItem value="company-flow">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="font-semibold">Company — Full Flow</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pl-2">
                  <StepItem
                    icon={<FileCheck className="h-4 w-4" />}
                    color="bg-green-100 text-green-600"
                    title="1. Register & Get Verified"
                    desc="Sign up as a company with your business details, CR/Registration number, and industry. Wait for admin approval before creating shifts."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Briefcase className="h-4 w-4" />}
                    color="bg-blue-100 text-blue-600"
                    title="2. Create a Shift"
                    desc="Go to Shifts → Create Shift. Fill the 5-step wizard: shift details, payment schedule, contract preview, assign promoters, review & send. Set clear title, location, date/time, and pay rate."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Users className="h-4 w-4" />}
                    color="bg-purple-100 text-purple-600"
                    title="3. Assign Promoters"
                    desc="Select from approved promoters in the system. You can assign multiple promoters per shift. They will see the shift in their dashboard and can accept or decline."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Clock className="h-4 w-4" />}
                    color="bg-orange-100 text-orange-600"
                    title="4. Monitor Shift Progress"
                    desc="Track shift status in real-time: Upcoming → Ongoing → Completed. View promoter check-in/check-out times, hours worked, and any notes in the shift detail page."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<DollarSign className="h-4 w-4" />}
                    color="bg-emerald-100 text-emerald-600"
                    title="5. Process Payment"
                    desc="After shift completion, review hours worked and total payable. The system auto-calculates: Hours × Rate = Total. Process payment as per your contract schedule."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Award className="h-4 w-4" />}
                    color="bg-yellow-100 text-yellow-600"
                    title="6. Issue Certificates"
                    desc="Request admin to generate work experience certificates for promoters who completed their shifts. Certificates include your company branding and are verifiable online."
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-blue-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Tip:</strong> Be clear about pay rates. If you pay per day, write 'BHD X per day' in the description so promoters understand the full earning, not per hour.</span>
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ADMIN FLOW */}
          {isAdmin && (
            <AccordionItem value="admin-flow">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="font-semibold">Admin — Full Flow</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pl-2">
                  <StepItem
                    icon={<UserCheck className="h-4 w-4" />}
                    color="bg-green-100 text-green-600"
                    title="1. Approve Users"
                    desc="Review and approve new promoter and company registrations. Check their documents, bank details, and CR numbers before approval. Reject incomplete or suspicious applications."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Users className="h-4 w-4" />}
                    color="bg-blue-100 text-blue-600"
                    title="2. Monitor All Shifts"
                    desc="View all shifts across all companies. Filter by status: All, Current, Completed, Upcoming. Oversee assignments, hours, and payments."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<DollarSign className="h-4 w-4" />}
                    color="bg-emerald-100 text-emerald-600"
                    title="3. Track Revenue"
                    desc="Monitor platform revenue from certificate sales. View reports on promoter activity, company spend, and total hours worked. Default reports show all-time data."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<Award className="h-4 w-4" />}
                    color="bg-yellow-100 text-yellow-600"
                    title="4. Generate Certificates"
                    desc="Go to Certificates → select a promoter → choose their completed shifts → preview → generate PDF. Certificates include promoter details, company info, event history, total hours, QR code, and official seal."
                  />
                  <ArrowLine />
                  <StepItem
                    icon={<FileCheck className="h-4 w-4" />}
                    color="bg-purple-100 text-purple-600"
                    title="5. Manage Data"
                    desc="Export data, manage users, resolve disputes, and configure platform settings. Full oversight of the entire workforce ecosystem."
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* FAQ / TROUBLESHOOTING */}
          <AccordionItem value="faq">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                </div>
                <span className="font-semibold">Common Questions & Fixes</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pl-2">
                <FaqItem
                  q="Why do my hours show 0.0?"
                  a="You must check in when you start and check out when you finish. If you check in and out at the same minute, the system records 0 hours. Make sure to check out AFTER your shift ends."
                />
                <FaqItem
                  q="Why is my shift status wrong?"
                  a="Shift statuses auto-update based on date and time. 'Upcoming' = future, 'Ongoing' = currently happening, 'Completed' = past. Past shifts should automatically show 'Completed'."
                />
                <FaqItem
                  q="How do I get paid?"
                  a="Payments are processed by the company after shift completion. The system calculates: Hours Worked × Pay Rate = Total Payable. Contact the company directly for payment status."
                />
                <FaqItem
                  q="How do I get a certificate?"
                  a="Complete at least one shift first. Then go to Certificates (or ask admin). Select your completed shifts and click 'Generate Certificate'. The PDF will download with your work history."
                />
                <FaqItem
                  q="Why does my page show 404 when I refresh?"
                  a="This was a routing issue that has been fixed. If you still see it, clear your browser cache and try again. Or navigate using the sidebar menu instead of browser refresh."
                />
                <FaqItem
                  q="Can I work for multiple companies?"
                  a="Yes! As a promoter, you can accept shifts from any approved company. Your certificate will show all companies you worked for with their details."
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Need more help? Contact admin at <strong>smartshift@onestoneads.com</strong>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepItem({ icon, color, title, desc }: { icon: React.ReactNode; color: string; title: string; desc: string }) {
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

function ArrowLine() {
  return (
    <div className="flex items-center pl-4">
      <div className="w-8 h-[2px] bg-border" />
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
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
