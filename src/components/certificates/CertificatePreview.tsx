import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CertificateData } from "./types/certificate";
import { motion } from "framer-motion";
import { Award, Calendar, Briefcase, Trophy, User, CheckCircle, MapPin, Clock, Shield, Building2, Globe, Mail, FileCheck } from "lucide-react";
import QRCode from "react-qr-code";

interface CertificatePreviewProps {
  certificateData?: CertificateData;
}

export default function CertificatePreview({ certificateData }: CertificatePreviewProps) {
  const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(certificateData?.referenceNumber || '')}`;
  if (!certificateData) return null;

  // Group shifts by company for multi-company display
  const shiftsByCompany = certificateData.shifts?.reduce((acc, shift) => {
    const companyName = shift.companyName || "Unknown Company";
    if (!acc[companyName]) {
      acc[companyName] = {
        company: shift.companyName,
        industry: shift.companyIndustry || "",
        website: shift.companyWebsite || "",
        email: shift.companyEmail || "",
        registration: shift.companyRegistration || "",
        shifts: []
      };
    }
    acc[companyName].shifts.push(shift);
    return acc;
  }, {} as Record<string, any>);

  const companies = Object.values(shiftsByCompany || {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-lg print:shadow-none overflow-hidden bg-[#faf9f6]">
        <CardContent className="p-0">
          {/* Outer Frame */}
          <div className="m-4 border-4 border-[#0d2137] relative">
            {/* Inner Gold Frame */}
            <div className="m-1 border-2 border-[#b8860b] p-6 relative">
              {/* Watermark */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, #0d2137 0, #0d2137 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, #b8860b 0, #b8860b 1px, transparent 1px, transparent 20px)'
                }}
              />

              {/* Header */}
              <div className="text-center mb-6 relative">
                <div className="text-3xl font-bold text-[#b8860b] tracking-widest uppercase mb-1">
                  Certificate
                </div>
                <div className="text-lg text-[#0d2137] tracking-wider font-semibold">
                  of Employment
                </div>
                <div className="w-32 h-[1px] bg-[#b8860b] mx-auto my-3" />
                <div className="text-[#b8860b] text-sm">&#9670; &#9670; &#9670;</div>
              </div>

              {/* Main Body - Two Columns */}
              <div className="flex gap-6 mb-6">
                {/* Left Column - Promoter Info */}
                <div className="w-[200px] text-center flex-shrink-0">
                  {/* Photo */}
                  <div className="w-28 h-28 rounded-full border-4 border-[#b8860b] mx-auto mb-3 bg-[#f5f0e8] flex items-center justify-center overflow-hidden">
                    {certificateData.promoterPhoto ? (
                      <img src={certificateData.promoterPhoto} alt="Promoter" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xl font-bold text-[#0d2137]">
                        {certificateData.promoterName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="text-lg font-bold text-[#0d2137] mb-1">
                    {certificateData.promoterName}
                  </div>
                  <div className="text-xs text-[#b8860b] font-semibold uppercase tracking-widest mb-3">
                    {certificateData.positionTitle}
                  </div>

                  <div className="bg-[#f5f0e8] p-3 rounded text-left text-xs text-[#0d2137] space-y-1">
                    <div><span className="text-[#b8860b] font-semibold">Nationality:</span> {certificateData.nationality || "Bahraini"}</div>
                    <div><span className="text-[#b8860b] font-semibold">Code:</span> {certificateData.promoCode || "N/A"}</div>
                    <div><span className="text-[#b8860b] font-semibold">Phone:</span> {certificateData.promoterPhone || "N/A"}</div>
                    <div><span className="text-[#b8860b] font-semibold">Email:</span> {certificateData.promoterEmail || "N/A"}</div>
                    <div><span className="text-[#b8860b] font-semibold">Issued:</span> {certificateData.issueDate}</div>
                  </div>
                </div>

                {/* Right Column - Companies & Work */}
                <div className="flex-1">
                  {companies.length > 0 ? (
                    companies.map((company: any, idx: number) => (
                      <div key={idx} className="mb-4">
                        {/* Company Card */}
                        <div className="bg-[#f5f0e8] p-4 rounded border-l-4 border-[#b8860b] mb-3">
                          <div className="text-base font-bold text-[#0d2137] mb-1">{company.company}</div>
                          <div className="text-xs text-[#b8860b] uppercase tracking-widest mb-2">{company.industry}</div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            {company.website && <div className="flex items-center gap-1"><Globe className="h-3 w-3" /> {company.website}</div>}
                            {company.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {company.email}</div>}
                            {company.registration && <div className="flex items-center gap-1"><FileCheck className="h-3 w-3" /> CR/Reg: {company.registration}</div>}
                          </div>
                          <div className="inline-flex items-center gap-1 bg-[#0d5c2f] text-white px-2 py-1 rounded text-xs font-semibold mt-2">
                            <CheckCircle className="h-3 w-3" /> VERIFIED EMPLOYER
                          </div>
                        </div>

                        {/* Work Table */}
                        <div className="mb-3">
                          <div className="text-sm font-bold text-[#0d2137] mb-2 pb-1 border-b border-[#b8860b]">
                            Work Assignments
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-[#0d2137] text-white">
                                <th className="px-2 py-1.5 text-left">Event</th>
                                <th className="px-2 py-1.5 text-left">Date</th>
                                <th className="px-2 py-1.5 text-left">Location</th>
                                <th className="px-2 py-1.5 text-right">Hours</th>
                              </tr>
                            </thead>
                            <tbody>
                              {company.shifts.map((shift: any, sidx: number) => (
                                <tr key={sidx} className="border-b border-[#e0d5c5]">
                                  <td className="px-2 py-1.5">{shift.title}</td>
                                  <td className="px-2 py-1.5">{shift.date}</td>
                                  <td className="px-2 py-1.5">{shift.location || "N/A"}</td>
                                  <td className="px-2 py-1.5 text-right font-bold text-[#0d2137]">{shift.hours}h</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Fallback for single company
                    <div>
                      <div className="bg-[#f5f0e8] p-4 rounded border-l-4 border-[#b8860b] mb-3">
                        <div className="text-base font-bold text-[#0d2137] mb-1">{certificateData.employerName}</div>
                        <div className="text-xs text-[#b8860b] uppercase tracking-widest mb-2">{certificateData.employerIndustry}</div>
                        <div className="inline-flex items-center gap-1 bg-[#0d5c2f] text-white px-2 py-1 rounded text-xs font-semibold mt-2">
                          <CheckCircle className="h-3 w-3" /> VERIFIED EMPLOYER
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-sm font-bold text-[#0d2137] mb-2 pb-1 border-b border-[#b8860b]">
                          Work Assignments
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[#0d2137] text-white">
                              <th className="px-2 py-1.5 text-left">Event</th>
                              <th className="px-2 py-1.5 text-left">Date</th>
                              <th className="px-2 py-1.5 text-left">Location</th>
                              <th className="px-2 py-1.5 text-right">Hours</th>
                            </tr>
                          </thead>
                          <tbody>
                            {certificateData.shifts?.map((shift, sidx) => (
                              <tr key={sidx} className="border-b border-[#e0d5c5]">
                                <td className="px-2 py-1.5">{shift.title}</td>
                                <td className="px-2 py-1.5">{shift.date}</td>
                                <td className="px-2 py-1.5">{shift.location || "N/A"}</td>
                                <td className="px-2 py-1.5 text-right font-bold text-[#0d2137]">{shift.hours}h</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Total Hours Box */}
                  <div className="bg-[#f5f0e8] p-3 rounded text-center border border-[#b8860b]">
                    <div className="text-xs text-gray-600 uppercase tracking-widest">Total Verified Work Experience</div>
                    <div className="text-2xl font-bold text-[#0d2137] my-1">
                      {certificateData.totalHours} {certificateData.totalHours === 1 ? 'Hour' : 'Hours'}
                    </div>
                    <div className="text-xs text-gray-600">
                      Across {companies.length || 1} organization{companies.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="flex justify-between items-end gap-4 pt-4 border-t border-[#e0d5c5]">
                {/* QR Code */}
                <div className="text-center">
                  <div className="border border-[#e0d5c5] p-2 bg-white inline-block">
                    <QRCode size={80} value={verifyUrl} level="H" />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Scan to Verify</div>
                </div>

                {/* Seal & Signature */}
                <div className="text-center flex-1">
                  <div className="w-20 h-20 rounded-full border-4 border-[#b8860b] mx-auto mb-2 bg-[#faf9f6] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-[#b8860b] flex items-center justify-center">
                      <div className="text-xs text-[#b8860b] font-bold uppercase text-center leading-tight">
                        Official<br/>Seal
                      </div>
                    </div>
                  </div>
                  <div className="w-32 h-[1px] bg-[#0d2137] mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Authorized Signature</div>
                </div>

                {/* Date & Ref */}
                <div className="text-right">
                  <div className="text-xs text-gray-600 mb-1">Date of Issue</div>
                  <div className="text-sm font-bold text-[#0d2137]">{certificateData.issueDate}</div>
                  <div className="text-xs text-[#b8860b] font-mono mt-2">{certificateData.referenceNumber}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600 pt-2 pb-1 border-t border-[#e0d5c5] mx-4">
            <span className="font-bold text-[#0d2137]">SmartShift Tracker</span> &mdash; This certificate was generated digitally and is verifiable via QR code or online at smart.onestoneads.com
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}