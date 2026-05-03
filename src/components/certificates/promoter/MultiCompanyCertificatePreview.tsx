import QRCode from "react-qr-code";
import { MultiCompanyCertificate, CompanyWorkEntry } from "../types/certificate";
import { format } from "date-fns";

// Re-export for backward compatibility
export type { CompanyWorkEntry };

const GOLD = "#C5A028";
const NAVY = "#1a2e4a";
const CREAM = "#FAF8F0";
const CREAM_DARK = "#F0EDE0";
const VERIFIED_BTN = "#1a3a2a";

const formatHours = (hours: number) => Math.round(hours);

interface MultiCompanyCertificatePreviewProps {
  data: MultiCompanyCertificate;
}

export default function MultiCompanyCertificatePreview({ data }: MultiCompanyCertificatePreviewProps) {
  const isPreview = data.referenceNumber === "PREVIEW";
  const verificationUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(data.referenceNumber)}`;

  const initials = data.promoterName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const issueDateFormatted = (() => {
    try {
      return format(new Date(data.issueDate), "MMM dd, yyyy");
    } catch {
      return data.issueDate;
    }
  })();

  return (
    <div
      id="certificate-content"
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        background: CREAM,
        padding: "6px",
        border: `3px solid ${NAVY}`,
        maxWidth: "860px",
        margin: "0 auto",
      }}
    >
      {/* Inner gold border */}
      <div style={{ border: `2px solid ${GOLD}`, padding: "40px 48px 32px" }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "38px",
              fontWeight: "bold",
              letterSpacing: "10px",
              color: GOLD,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            CERTIFICATE
          </h1>
          <p style={{ fontSize: "16px", color: NAVY, fontWeight: "600", margin: "6px 0 14px" }}>
            of Employment
          </p>
          <div style={{ borderBottom: `2px solid ${GOLD}`, width: "200px", margin: "0 auto 12px" }} />
          <span style={{ color: GOLD, fontSize: "20px", letterSpacing: "8px" }}>◆ ◆ ◆</span>
        </div>

        {/* ── BODY: two columns ── */}
        <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>

          {/* LEFT COLUMN */}
          <div style={{ width: "36%", flexShrink: 0, textAlign: "center" }}>
            {/* Avatar circle */}
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                border: `3px solid ${GOLD}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                background: CREAM,
              }}
            >
              {data.promoter?.profile_photo_url ? (
                <img
                  src={data.promoter.profile_photo_url}
                  alt={data.promoterName}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "34px", fontWeight: "bold", color: NAVY }}>{initials}</span>
              )}
            </div>

            {/* Name & role */}
            <p style={{ fontSize: "20px", fontWeight: "bold", color: NAVY, margin: "0 0 4px" }}>
              {data.promoterName}
            </p>
            <p style={{ fontSize: "11px", letterSpacing: "3px", color: GOLD, fontWeight: "700", margin: "0 0 20px" }}>
              PROMOTER
            </p>

            {/* Info card */}
            <div
              style={{
                background: CREAM_DARK,
                borderRadius: "4px",
                padding: "14px 16px",
                textAlign: "left",
                fontSize: "12.5px",
                lineHeight: "1.8",
              }}
            >
              <p style={{ margin: 0 }}>
                <span style={{ color: GOLD, fontWeight: "700" }}>Nationality:</span>{" "}
                {data.promoter?.nationality || "—"}
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: GOLD, fontWeight: "700" }}>Code:</span>{" "}
                {data.promoter?.unique_code || data.referenceNumber}
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: GOLD, fontWeight: "700" }}>Phone:</span>{" "}
                {data.promoter?.phone_number || "—"}
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: GOLD, fontWeight: "700" }}>Email:</span>{" "}
                {data.promoter?.email || "—"}
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: GOLD, fontWeight: "700" }}>Issued:</span>{" "}
                {issueDateFormatted}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ flex: 1 }}>
            {data.companies.map((entry, idx) => (
              <div key={idx} style={{ marginBottom: idx < data.companies.length - 1 ? "28px" : 0 }}>

                {/* Company card */}
                <div
                  style={{
                    background: CREAM_DARK,
                    borderRadius: "4px",
                    padding: "16px",
                    marginBottom: "18px",
                  }}
                >
                  {entry.company.logo_url && (
                    <img
                      src={entry.company.logo_url}
                      alt={entry.company.name}
                      style={{ height: "40px", objectFit: "contain", marginBottom: "8px" }}
                    />
                  )}
                  <p style={{ fontSize: "16px", fontWeight: "bold", color: NAVY, margin: "0 0 2px" }}>
                    {entry.company.name}
                  </p>
                  <p style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", margin: "0 0 10px" }}>
                    ADVERTISING AND PROMOTION
                  </p>
                  {entry.company.website && (
                    <p style={{ fontSize: "12px", margin: "0 0 2px" }}>
                      Website: {entry.company.website}
                    </p>
                  )}
                  {entry.company.email && (
                    <p style={{ fontSize: "12px", margin: "0 0 2px" }}>
                      Email: {entry.company.email}
                    </p>
                  )}
                  {((entry.company as any).cr_number || entry.company.registration_number) && (
                    <p style={{ fontSize: "12px", margin: "0 0 10px" }}>
                      CR/Reg. No: {(entry.company as any).cr_number || entry.company.registration_number}
                    </p>
                  )}
                  <div
                    style={{
                      display: "inline-block",
                      background: VERIFIED_BTN,
                      color: "white",
                      padding: "5px 14px",
                      fontSize: "10px",
                      letterSpacing: "1px",
                      fontWeight: "700",
                      borderRadius: "2px",
                    }}
                  >
                    VERIFIED EMPLOYER
                  </div>
                </div>

                {/* Work Assignments */}
                <p style={{ fontWeight: "700", fontSize: "14px", color: NAVY, margin: "0 0 8px" }}>
                  Work Assignments
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: NAVY, color: "white" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: "600" }}>
                        Event / Campaign
                      </th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: "600" }}>Date</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: "600" }}>Location</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: "600" }}>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.shifts.map((shift, si) => {
                      const dateStr = (() => {
                        try {
                          return format(new Date(shift.dateFrom), "MMM dd, yyyy");
                        } catch {
                          return shift.dateFrom;
                        }
                      })();
                      return (
                        <tr
                          key={si}
                          style={{ background: si % 2 === 0 ? CREAM : CREAM_DARK }}
                        >
                          <td style={{ padding: "7px 10px" }}>{shift.title}</td>
                          <td style={{ padding: "7px 10px" }}>{dateStr}</td>
                          <td style={{ padding: "7px 10px" }}>{shift.location || "On-site"}</td>
                          <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: "700" }}>
                            {formatHours(shift.totalHours)}h
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Total experience box (per company) */}
                <div
                  style={{
                    marginTop: "14px",
                    border: `1px solid #ddd`,
                    borderRadius: "4px",
                    padding: "16px",
                    textAlign: "center",
                    background: CREAM_DARK,
                  }}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      letterSpacing: "2px",
                      color: "#888",
                      margin: "0 0 4px",
                      textTransform: "uppercase",
                    }}
                  >
                    Total Verified Work Experience
                  </p>
                  <p style={{ fontSize: "30px", fontWeight: "bold", color: NAVY, margin: "0 0 2px" }}>
                    {formatHours(entry.totalHours)} Hour{formatHours(entry.totalHours) !== 1 ? "s" : ""}
                  </p>
                  <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                    Across 1 organization
                  </p>
                </div>
              </div>
            ))}

            {/* Grand total if multiple companies */}
            {data.companies.length > 1 && (
              <div
                style={{
                  marginTop: "16px",
                  border: `2px solid ${GOLD}`,
                  borderRadius: "4px",
                  padding: "16px",
                  textAlign: "center",
                  background: CREAM,
                }}
              >
                <p style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>
                  Grand Total Work Experience
                </p>
                <p style={{ fontSize: "30px", fontWeight: "bold", color: GOLD, margin: "0 0 2px" }}>
                  {formatHours(data.grandTotalHours)} Hours
                </p>
                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                  Across {data.companies.length} organizations
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "36px",
            paddingTop: "20px",
            borderTop: `1px solid #ddd`,
          }}
        >
          {/* QR Code */}
          <div style={{ textAlign: "center" }}>
            {!isPreview ? (
              <div style={{ background: "white", padding: "6px", display: "inline-block" }}>
                <QRCode value={verificationUrl} size={80} />
              </div>
            ) : (
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  border: "1px solid #ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "9px", color: "#aaa", textAlign: "center" }}>QR Code</span>
              </div>
            )}
            <p style={{ fontSize: "10px", color: "#888", margin: "6px 0 0" }}>Scan to Verify</p>
          </div>

          {/* Official Seal + Signature */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                border: `2px solid ${GOLD}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                background: CREAM,
              }}
            >
              <div>
                <p style={{ fontSize: "10px", color: GOLD, fontWeight: "700", margin: 0, textAlign: "center" }}>
                  OFFICIAL
                </p>
                <p style={{ fontSize: "10px", color: GOLD, fontWeight: "700", margin: 0, textAlign: "center" }}>
                  SEAL
                </p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #555", width: "160px", margin: "0 auto", paddingTop: "5px" }}>
              <p style={{ fontSize: "10px", color: "#888", margin: 0 }}>Authorized Signature</p>
            </div>
          </div>

          {/* Date of Issue + Cert ID */}
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "10px", color: "#888", margin: "0 0 2px" }}>Date of Issue</p>
            <p style={{ fontSize: "16px", fontWeight: "bold", color: NAVY, margin: "0 0 4px" }}>
              {issueDateFormatted}
            </p>
            <p style={{ fontSize: "10px", color: GOLD, letterSpacing: "1px", margin: 0 }}>
              {isPreview ? "PREVIEW-ONLY" : `CERT-${data.referenceNumber}`}
            </p>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: `1px solid #ddd`, marginTop: "20px", paddingTop: "12px", textAlign: "center" }}>
          <p style={{ fontSize: "10px", color: "#888", margin: 0 }}>
            <strong>SmartShift Tracker</strong> — This certificate was generated digitally and is verifiable via QR
            code or online at smart.onestoneads.com
          </p>
        </div>

      </div>
    </div>
  );
}
