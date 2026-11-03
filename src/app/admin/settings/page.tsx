import { getSettings } from "@/lib/catalog";
import { SettingsForm } from "@/components/admin/SmallActions";
import { razorpayConfig } from "@/lib/razorpay";

export default async function AdminSettings() {
  const s = await getSettings();
  const rzp = razorpayConfig();
  return (
    <div>
      <h1 className="text-3xl">Settings</h1>
      <div className="card mt-6 max-w-2xl p-6 text-sm">
        <p className="font-medium">Integrations (set via environment variables)</p>
        <ul className="mt-2 space-y-1 text-ink-soft">
          <li>Razorpay: {rzp ? (rzp.testMode ? "connected (TEST mode)" : "connected (LIVE)") : "not configured: customers see manual payment instructions"}</li>
          <li>Razorpay webhook: {process.env.RAZORPAY_WEBHOOK_SECRET ? "secret set" : "not configured"}</li>
          <li>Email (Resend): {process.env.RESEND_API_KEY ? "configured" : "not configured: emails are logged, in-app notifications still work"}</li>
          <li>File storage: {process.env.STORAGE_DRIVER === "s3" ? `S3-compatible bucket "${process.env.S3_BUCKET}"` : "local disk (private)"}</li>
        </ul>
      </div>
      <div className="mt-6">
        <SettingsForm
          initial={{
            shippingFee: String(s.shippingFeePaise / 100),
            freeAbove: s.freeShippingAbovePaise == null ? "" : String(s.freeShippingAbovePaise / 100),
            contactEmail: s.contactEmail,
            contactWhatsapp: s.contactWhatsapp,
            manualPaymentInstructions: s.manualPaymentInstructions,
          }}
        />
      </div>
    </div>
  );
}
