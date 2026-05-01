import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  ChevronRight,
  ArrowRight,
  Shield,
  Users,
  Building2,
  Clock,
  DollarSign,
  Award,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Briefcase,
  FileCheck,
  Bell,
  RefreshCcw,
  CreditCard,
  Image,
  MessageSquare,
  Lock,
  MapPin,
  Mail,
  Phone,
  BadgeCheck,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HelpGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HelpGuide({ open, onOpenChange }: HelpGuideProps) {
  const { user } = useAuth();
  const role = user?.role || "user";
  const [activeTab, setActiveTab] = useState<string>("promoter");

  const isPromoter = role === "promoter" || role === "part_timer";
  const isCompany = role === "company";
  const isAdmin = role === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-6 w-6 text-primary" />
            Help Center
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="px-6 mb-4">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            {(isPromoter || isAdmin) && (
              <button
                onClick={() => setActiveTab("promoter")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "promoter"
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4 inline mr-1" />
                Promoter
              </button>
            )}
            {(isCompany || isAdmin) && (
              <button
                onClick={() => setActiveTab("company")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "company"
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-4 w-4 inline mr-1" />
                Company
              </button>
            )}
            <button
              onClick={() => setActiveTab("faq")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "faq"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertCircle className="h-4 w-4 inline mr-1" />
              FAQ
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* PROMOTER TAB */}
          {activeTab === "promoter" && (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-lg p-4 mb-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As a <strong>Promoter</strong>, you browse shifts posted by companies, accept the ones you want, work them, check in/out, and get paid. You can also earn verified work certificates.
                </p>
              </div>

              <FlowSection title="1. Sign Up & Get Approved" icon={<UserCheck className="h-5 w-5 text-green-600" />} color="border-green-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Go to Sign Up → Select "I'm a Part-Timer"</li>
                  <li>Fill all 4 steps: Account Info, Personal Details, Bank Account, Documents</li>
                  <li>Upload your ID and profile photo</li>
                  <li>Wait for admin approval (check the bell icon for notifications)</li>
                  <li>Once approved, you get a unique promoter code like <strong>PROMO-XXXXXX</strong></li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="2. Browse & Accept Shifts" icon={<Briefcase className="h-5 w-5 text-blue-600" />} color="border-blue-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Go to your Dashboard → view available shifts</li>
                  <li>Each shift shows: event name, company, location, date, time, pay rate</li>
                  <li>Click a shift card to view full details</li>
                  <li>Click <strong>"Accept Shift"</strong> to confirm your participation</li>
                  <li>You can decline if the shift doesn't suit you</li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="3. Check In (Start of Shift)" icon={<Clock className="h-5 w-5 text-orange-600" />} color="border-orange-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Arrive at the event location on time</li>
                  <li>Open the shift in your dashboard</li>
                  <li>Click <strong>"Check In"</strong> — this records your start time + GPS location</li>
                  <li>Shift status changes to <strong>"Ongoing"</strong></li>
                  <li>⚠️ <strong>Important:</strong> Only check in when you actually start working</li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="4. Work the Shift" icon={<MapPin className="h-5 w-5 text-purple-600" />} color="border-purple-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Perform your duties as described in the shift details</li>
                  <li>You can view session history anytime in the shift detail page</li>
                  <li>Your work is tracked automatically from check-in time</li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="5. Check Out (End of Shift)" icon={<CheckCircle2 className="h-5 w-5 text-teal-600" />} color="border-teal-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>When your shift ends, click <strong>"Check Out"</strong></li>
                  <li>This records your end time</li>
                  <li>Hours are calculated: <strong>End Time − Start Time = Total Hours</strong></li>
                  <li>⚠️ <strong>Critical:</strong> Check out AFTER your shift ends, not at the same minute as check-in. Same-time = 0 hours.</li>
                  <li>Shift status changes to <strong>"Completed"</strong></li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="6. Get Paid" icon={<DollarSign className="h-5 w-5 text-emerald-600" />} color="border-emerald-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Payment is calculated: <strong>Hours Worked × Pay Rate = Total Payable</strong></li>
                  <li>The company processes payment according to the contract schedule</li>
                  <li>Check your dashboard "Total Payable" stat for earnings summary</li>
                  <li>Contact the company directly if payment is delayed</li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="7. Request Work Certificate" icon={<Award className="h-5 w-5 text-yellow-600" />} color="border-yellow-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>After completing shifts, go to <strong>Certificates</strong></li>
                  <li>Select your completed shifts</li>
                  <li>Preview the certificate (shows your photo, name, company, hours)</li>
                  <li>Click <strong>"Generate Certificate"</strong> — PDF downloads instantly</li>
                  <li>Certificate includes QR code for online verification</li>
                  <li>Use this certificate as proof of work experience</li>
                </ul>
              </FlowSection>
            </div>
          )}

          {/* COMPANY TAB */}
          {activeTab === "company" && (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-lg p-4 mb-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As a <strong>Company</strong>, you create shifts, assign promoters, track progress, process payments, and issue work certificates.
                </p>
              </div>

              <FlowSection title="1. Register & Get Verified" icon={<FileCheck className="h-5 w-5 text-green-600" />} color="border-green-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Go to Sign Up → Select "I'm a Company"</li>
                  <li>Fill business details, CR/Registration number, industry, and size</li>
                  <li>Upload company documents</li>
                  <li>Wait for admin approval</li>
                  <li>Once approved, you can create shifts immediately</li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="2. Create a Shift" icon={<Briefcase className="h-5 w-5 text-blue-600" />} color="border-blue-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Go to <strong>Shifts → Create Shift</strong></li>
                  <li>Step 1: Details — Title, description, location, dates, time, pay rate</li>
                  <li>Step 2: Payment Schedule — When and how you will pay</li>
                  <li>Step 3: Contract Preview — Auto-generated legal document</li>
                  <li>Step 4: Assign Promoters — Select from approved promoters</li>
                  <li>Step 5: Review & Send — Confirm everything and publish</li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="3. Assign Promoters" icon={<Users className="h-5 w-5 text-purple-600" />} color="border-purple-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>In Step 4 of shift creation, select promoters from the list</li>
                  <li>You can assign multiple promoters to one shift</li>
                  <li>Promoters will see the shift in their dashboard and can accept</li>
                  <li>You'll get notified when they accept or decline</li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="4. Monitor Shift Progress" icon={<BarChart3 className="h-5 w-5 text-orange-600" />} color="border-orange-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Track status in real-time: <strong>Upcoming → Ongoing → Completed</strong></li>
                  <li>View check-in/check-out times per promoter</li>
                  <li>See total hours worked and session history</li>
                  <li>Access contract, schedule, and payment details in one view</li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="5. Process Payment" icon={<CreditCard className="h-5 w-5 text-emerald-600" />} color="border-emerald-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>After shift completion, review hours worked</li>
                  <li>System auto-calculates: <strong>Hours × Rate = Total Payable</strong></li>
                  <li>Process payment according to your contract schedule</li>
                  <li>Mark payment as complete in the system</li>
                </ul>
              </FlowSection>

              <FlowArrow />

              <FlowSection title="6. Issue Certificates" icon={<BadgeCheck className="h-5 w-5 text-yellow-600" />} color="border-yellow-200">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Request admin to generate certificates for completed shifts</li>
                  <li>Certificates include your company branding</li>
                  <li>Verifiable online with QR code</li>
                  <li>Builds trust with promoters and future hires</li>
                </ul>
              </FlowSection>
            </div>
          )}

          {/* FAQ TAB */}
          {activeTab === "faq" && (
            <div className="space-y-2">
              <div className="bg-primary/5 rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click any question below to see the answer. If you still need help, contact admin at <strong>smartshift@onestoneads.com</strong>
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-2">
                {/* PROMOTER FAQ */}
                {(isPromoter || isAdmin) && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">For Promoters</div>
                    
                    <AccordionItem value="p1" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          Why do my hours show 0.0?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        You must <strong>Check In</strong> when you start and <strong>Check Out</strong> when you finish. If you check in and out at the same minute, the system records 0 hours. Always check out <strong>AFTER</strong> your shift ends. Example: Check In at 10:00, Check Out at 18:00 = 8 hours.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="p2" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <RefreshCcw className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          Why is my shift status wrong?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        Shift statuses auto-update based on date and time: <strong>Upcoming</strong> (future), <strong>Ongoing</strong> (currently happening), <strong>Completed</strong> (past). If a past shift still shows "Upcoming", refresh the page or contact admin.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="p3" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          How and when do I get paid?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        Payments are processed by the <strong>company</strong> after shift completion. The system calculates: <strong>Hours Worked × Pay Rate = Total Payable</strong>. Check your dashboard "Total Payable" stat. Contact the company directly for payment status or delays.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="p4" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          How do I get a work certificate?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        First, complete at least one shift with proper check-in and check-out. Then go to <strong>Certificates</strong> → select your completed shifts → preview → click <strong>"Generate Certificate"</strong>. The PDF downloads instantly with your photo, name, company details, event history, total hours, and a QR code for verification.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="p5" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          Can I work for multiple companies?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        <strong>Yes!</strong> As a promoter, you can accept shifts from any approved company. Your certificate will show all companies you worked for, each with their own work history table. There is no limit to how many companies you can work with.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="p6" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-pink-500 flex-shrink-0" />
                          How do I know when a shift is assigned to me?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        Check the <strong>bell icon (🔔)</strong> in the top-right header. New shift assignments, approvals, messages, and certificate readiness all show as notifications there. Also check your dashboard regularly for new shifts.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="p7" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <Image className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                          How do I update my profile photo or bank details?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        Click your <strong>avatar</strong> (top right) → "Profile & Settings". Update your personal details, upload a new photo, edit your bank account (IBAN, account holder name, bank country), and upload your ID card. Save changes before exiting.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="p8" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-red-500 flex-shrink-0" />
                          What if I forget my password?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        On the login page, look for <strong>"Forgot Password"</strong> and follow the reset link sent to your registered email. If you don't receive it, check your spam folder or contact admin at smartshift@onestoneads.com.
                      </AccordionContent>
                    </AccordionItem>
                  </>
                )}

                {/* COMPANY FAQ */}
                {(isCompany || isAdmin) && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">For Companies</div>

                    <AccordionItem value="c1" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          Is the pay rate per hour or per day?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        Pay rate depends on how you set it in the shift details. If you pay <strong>per day</strong>, clearly write "BHD X per day" in the description so promoters understand the total earning. The system calculates based on the rate you enter and hours worked. Be transparent to avoid disputes.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="c2" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          How do I assign multiple promoters to one shift?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        In <strong>Step 4</strong> of the shift creation wizard, you can select multiple promoters from the approved list. Hold Ctrl/Cmd and click to select more than one. Each promoter will see the shift in their dashboard and can accept or decline independently.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="c3" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-teal-500 flex-shrink-0" />
                          How do I know when a promoter checked in?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        Open the shift detail page → go to the <strong>"Check In"</strong> tab. You'll see timestamps and GPS locations for each promoter's check-in and check-out. The "History" tab shows all work sessions. The "Status" badge updates from "Upcoming" → "Ongoing" → "Completed".
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="c4" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                          How do I message a promoter?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        Go to <strong>Messages</strong> in the sidebar. Select the promoter from your contact list. Type your message and click send. All messages are preserved in the chat history. Promoters receive notifications for new messages.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="c5" className="border rounded-lg px-4 bg-card">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          Can I edit a shift after creating it?
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        Currently, shifts cannot be edited after creation to maintain contract integrity. If you need changes, <strong>delete the shift</strong> and create a new one. Notify assigned promoters about the change via Messages.
                      </AccordionContent>
                    </AccordionItem>
                  </>
                )}

                {/* GENERAL FAQ */}
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">General</div>

                <AccordionItem value="g1" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
                      Why does my page show 404 when I refresh?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    This is a Single Page App (SPA) routing issue. If you refresh and see 404, <strong>navigate from the homepage</strong> instead of refreshing. Clear your browser cache (Ctrl+Shift+R) and try again. The admin has applied a fix — contact admin if the issue persists.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="g2" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
                      How do I contact support or admin?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    Email: <strong>smartshift@onestoneads.com</strong> or <strong>emohd123@gmail.com</strong>. For urgent issues, check the Messages section — you can directly message admin if you have an account. Response time is typically within 24 hours.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="g3" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      Do I get email or SMS notifications?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    Currently, notifications are shown in the app only (bell icon). Email and SMS notifications are <strong>coming soon</strong>. Check the bell icon regularly for shift assignments, approvals, and messages.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Helper: Flow Section Card */
function FlowSection({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className={`border-l-4 ${color} bg-card rounded-r-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/* Helper: Arrow between steps */
function FlowArrow() {
  return (
    <div className="flex items-center pl-6">
      <div className="w-8 h-[2px] bg-border" />
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}