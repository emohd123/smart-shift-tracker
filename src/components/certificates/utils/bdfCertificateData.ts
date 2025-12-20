import type { CompanyWorkEntry, MultiCompanyCertificate } from "@/components/certificates/types/certificate";

export type BdfCertificateData = {
  brand: {
    name: string;
    initials: string;
    tagline: string;
    footerLeft: string;
    logoDataUri?: string;
  };
  certificate: {
    issueDate: string;
    id: string;
    ref: string;
    verified: boolean;
    verifyUrl?: string;
    verifyDisplay?: string;
    qrDataUri?: string;
    signatureDataUri?: string;
  };
  partTimer: {
    fullName: string;
    initials: string;
    roleLabel: string;
    nationality?: string;
    age?: number | null;
    phone?: string | null;
    email?: string | null;
    photoDataUri?: string;
  };
  summary: {
    totalHours: number;
  };
  // Back-compat single employer format (used when employers array not provided)
  employer?: {
    name: string;
    initials: string;
    registration?: string | null;
    phone?: string | null;
    email?: string | null;
    logoDataUri?: string;
  };
  assignments?: Array<{ event: string; date: string; location: string; hours: string | number }>;
  // New multi-employer format
  employers?: Array<{
    employer: {
      name: string;
      initials: string;
      registration?: string | null;
      phone?: string | null;
      email?: string | null;
      logoDataUri?: string;
    };
    totalHours: number;
    assignments: Array<{ event: string; date: string; location: string; hours: string | number }>;
  }>;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "S";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "S";
  return (first + second).toUpperCase();
}

function formatIssueDate(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  // Example: 19 Dec 2025 (matches sample)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatShiftDate(dateIso: string): string {
  const d = new Date(dateIso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toAssignments(company: CompanyWorkEntry) {
  return company.shifts.map((s) => ({
    event: s.title,
    date: formatShiftDate(s.dateFrom),
    location: s.location || "On-site",
    hours: Math.round(s.totalHours),
  }));
}

/**
 * Build a BDF-compatible certificateData JSON from the app's MultiCompanyCertificate model.
 * This lets you generate the exact same certificate in the BDF tool (Handlebars+Puppeteer)
 * and store the payload on the certificate record for consistency/auditing.
 */
export function buildBdfCertificateDataFromMultiCompany(
  cert: MultiCompanyCertificate,
  opts?: {
    brandName?: string;
    brandTagline?: string;
    brandFooterLeft?: string;
    brandLogoDataUri?: string;
    roleLabel?: string;
  }
): BdfCertificateData {
  const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(cert.referenceNumber)}`;
  const verifyDisplay = `/verify-certificate/${cert.referenceNumber}`;

  const brandName = opts?.brandName ?? "SmartShift";
  const brandTagline = opts?.brandTagline ?? "Track Time · Get Certified · Get Paid";
  const footerLeft = opts?.brandFooterLeft ?? "SmartShift — Workforce Management Platform";
  const roleLabel = opts?.roleLabel ?? "Part-timer";

  const promoter = cert.promoter;
  const promoterName = cert.promoterName;
  const promoterInitials = initialsFromName(promoterName);

  const base: BdfCertificateData = {
    brand: {
      name: brandName,
      initials: initialsFromName(brandName),
      tagline: brandTagline,
      footerLeft,
      logoDataUri: opts?.brandLogoDataUri ?? "",
    },
    certificate: {
      issueDate: formatIssueDate(cert.issueDate),
      id: promoter?.unique_code || `PT-${cert.referenceNumber.slice(-6)}`,
      ref: cert.referenceNumber,
      verified: true,
      verifyUrl,
      verifyDisplay,
      signatureDataUri: cert.signature || "",
      qrDataUri: "", // optional; can be filled by external generator if desired
    },
    partTimer: {
      fullName: promoterName,
      initials: promoterInitials,
      roleLabel,
      nationality: promoter?.nationality || undefined,
      age: promoter?.age ?? undefined,
      phone: promoter?.phone_number || undefined,
      email: promoter?.email || undefined,
      photoDataUri: "", // optional; BDF expects data URI; app only has URLs
    },
    summary: {
      totalHours: Math.round(cert.grandTotalHours),
    },
  };

  // If there's exactly one company, also provide single-employer back-compat fields.
  if (cert.companies.length === 1) {
    const c = cert.companies[0];
    base.employer = {
      name: c.company.name,
      initials: initialsFromName(c.company.name),
      registration: c.company.registration_number ?? null,
      phone: c.company.phone_number ?? null,
      email: c.company.email ?? null,
      logoDataUri: "",
    };
    base.assignments = toAssignments(c);
  } else {
    base.employers = cert.companies.map((c) => ({
      employer: {
        name: c.company.name,
        initials: initialsFromName(c.company.name),
        registration: c.company.registration_number ?? null,
        phone: c.company.phone_number ?? null,
        email: c.company.email ?? null,
        logoDataUri: "",
      },
      totalHours: Math.round(c.totalHours),
      assignments: toAssignments(c),
    }));
  }

  return base;
}


