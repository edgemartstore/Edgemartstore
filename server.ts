import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";

// ES module environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic utility middlewares
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // Initialize Cloudinary if environment credentials are provided
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // REST API: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // REST API: Base64 image uploader to Cloudinary
  app.post("/api/upload-cloudinary", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 key in body" });
      }

      if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn("[Cloudinary] Cloudinary credentials not configured in environment variables.");
        return res.status(503).json({ error: "Media storage is not configured in environment variables." });
      }

      // Upload base64 data to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "edge_mart",
        resource_type: "auto",
      });

      return res.status(200).json({
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
      });
    } catch (err: any) {
      console.error("Image upload failed:", err);
      return res.status(500).json({ error: err.message || "Failed to process image upload" });
    }
  });

  // REST API: Resend email dispatch
  app.post("/api/send-receipt", async (req, res) => {
    try {
      const { customerName, customerEmail, orderId, items, totalAmount, categoryBreakdown, timestamp, originUrl } = req.body;

      if (!customerEmail || !orderId ) {
        return res.status(400).json({ error: "Missing required billing details" });
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn("[Email Notification] RESEND_API_KEY is not configured in environment. Skipping email dispatch.");
        return res.status(200).json({ success: true, message: "Order processed. Notification email skipped (RESEND_API_KEY not configured)." });
      }
      const originHost = originUrl || "http://localhost:3000";
      const paymentLink = `${originHost}/payment/${orderId}`;

      // Render highly professional, bulk grocery theme HTML email
      const itemsListHtml = items.map((item: any) => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 12px 8px; font-family: sans-serif; font-size: 14px; color: #111;">${item.name}</td>
          <td style="padding: 12px 8px; font-family: sans-serif; font-size: 14px; color: #555; text-align: center;">${item.category}</td>
          <td style="padding: 12px 8px; font-family: sans-serif; font-size: 14px; color: #555; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 8px; font-family: sans-serif; font-size: 14px; color: #111; text-align: right; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join("");

      const breakdownHtml = Object.entries(categoryBreakdown || {}).map(([cat, amt]: any) => `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #eee; font-family: sans-serif; font-size: 13px; color: #555;">
          <span style="font-weight: 500;">${cat}</span>
          <span style="font-weight: bold; color: #E11D2E;">$${parseFloat(amt).toFixed(2)}</span>
        </div>
      `).join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Invoice #${orderId}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin-top: 30px; margin-bottom: 30px; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <!-- Header -->
            <tr>
              <td align="center" bgcolor="#E11D2E" style="padding: 40px 0; color: #ffffff;">
                <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif; font-weight: 900;">EDGE MART</h1>
                <p style="margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px; font-family: sans-serif;">BULK PROCUREMENT & BUDGET MANAGER</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px 24px;">
                <h2 style="margin-top: 0; font-family: sans-serif; font-size: 18px; color: #111; border-bottom: 2px solid #111; padding-bottom: 8px;">INVOICE DETAILS</h2>
                <table width="100%" style="margin-bottom: 20px;">
                  <tr>
                    <td style="font-family: sans-serif; font-size: 14px; color: #555; padding: 4px 0;"><strong>Customer name:</strong> ${customerName || "Customer"}</td>
                    <td style="font-family: sans-serif; font-size: 14px; color: #555; padding: 4px 0; text-align: right;"><strong>Date:</strong> ${new Date(timestamp || Date.now()).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="font-family: sans-serif; font-size: 14px; color: #555; padding: 4px 0;"><strong>Order ID:</strong> ${orderId}</td>
                    <td style="font-family: sans-serif; font-size: 14px; color: #555; padding: 4px 0; text-align: right; color: #E11D2E;"><strong>Status:</strong> Pending Audit Review</td>
                  </tr>
                </table>

                <!-- Large Red CTA COMPLETE PAYMENT Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <p style="font-family: sans-serif; font-size: 13px; color: #555; margin-bottom: 12px;">Your budget allowances has been reserved. Please proceed to input payment clearing settlement proof:</p>
                  <a href="${paymentLink}" style="background-color: #E11D2E; color: #ffffff; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block; font-family: sans-serif; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 10px rgba(225,29,46,0.25);">COMPLETE PAYMENT</a>
                </div>

                <h3 style="font-family: sans-serif; font-size: 15px; color: #111; margin-bottom: 8px; margin-top: 25px;">ORDER SUMMARY</h3>
                <table width="100%" style="border-collapse: collapse; margin-bottom: 25px;">
                  <thead>
                    <tr bgcolor="#f9f9f9" style="border-bottom: 2px solid #ddd;">
                      <th style="padding: 10px 8px; text-align: left; font-family: sans-serif; font-size: 12px; text-transform: uppercase; color: #555;">Product</th>
                      <th style="padding: 10px 8px; text-align: center; font-family: sans-serif; font-size: 12px; text-transform: uppercase; color: #555;">Category</th>
                      <th style="padding: 10px 8px; text-align: center; font-family: sans-serif; font-size: 12px; text-transform: uppercase; color: #555;">Qty</th>
                      <th style="padding: 10px 8px; text-align: right; font-family: sans-serif; font-size: 12px; text-transform: uppercase; color: #555;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsListHtml}
                  </tbody>
                </table>

                <!-- Category Spends breakdown -->
                <div style="background-color: #fafafa; border: 1px solid #eee; padding: 16px; border-radius: 4px; margin-bottom: 25px;">
                  <h4 style="margin: 0 0 10px 0; font-family: sans-serif; font-size: 13px; text-transform: uppercase; color: #111; letter-spacing: 0.5px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Budget Category Breakdown</h4>
                  ${breakdownHtml}
                </div>

                <!-- Total Row -->
                <table width="100%">
                  <tr>
                    <td></td>
                    <td width="250" style="text-align: right; font-family: sans-serif; padding: 10px 0;">
                      <span style="font-size: 14px; color: #777; font-weight: 500; display: inline-block; margin-bottom: 5px;">TOTAL DEBITED DUE</span><br/>
                      <span style="font-size: 24px; color: #E11D2E; font-weight: 950; letter-spacing: -0.5px;">$${parseFloat(totalAmount).toFixed(2)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" bgcolor="#111111" style="padding: 30px; font-family: sans-serif; font-size: 11px; color: #999;">
                <p style="margin: 0 0 10px 0;">This email was automatically generated for your Edge Mart bulk purchase.</p>
                <p style="margin: 0;">© 2026 Edge Mart Ltd. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Email dispatch request to Resend API
      const mailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Edge Mart Receipts <onboarding@resend.dev>",
          to: [customerEmail],
          subject: `Invoice - Edge Mart Purchase (Order #${orderId.slice(-6).toUpperCase()})`,
          html: htmlContent,
        }),
      });

      if (!mailResponse.ok) {
        const errorText = await mailResponse.text();
        console.error("Resend endpoint rejected:", errorText);
        return res.status(502).json({ error: `Resend rejection: ${errorText}` });
      }

      const resendData = await mailResponse.json();
      return res.status(200).json({ success: true, ref: resendData.id });
    } catch (err: any) {
      console.error("Email API failed:", err);
      return res.status(500).json({ error: err.message || "Failed to send receipt email via Resend" });
    }
  });

  // API 2: Send Approval Email via Resend
  app.post("/api/send-approval-email", async (req, res) => {
    try {
      const { customerEmail, orderId, approvedDate, deliveryInfo } = req.body;

      if (!customerEmail || !orderId) {
        return res.status(400).json({ error: "Missing required approval details" });
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn("[Email Notification] RESEND_API_KEY is not configured in environment. Skipping approval email dispatch.");
        return res.status(200).json({ success: true, message: "Approval status updated. Notification email skipped (RESEND_API_KEY not configured)." });
      }
      const orderShort = orderId.slice(-6).toUpperCase();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order Approved</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f4f4; font-family:sans-serif;">
          <table align="center" width="600" style="margin-top:40px; margin-bottom:40px; background-color:#ffffff; border:1px solid #ddd; border-top:6px solid #10b981; border-collapse:collapse;">
            <tr>
              <td style="padding:30px; text-align:center;">
                <h1 style="color:#10b981; font-size:24px; margin:0 0 10px 0; font-family:sans-serif; text-transform:uppercase;">Order Approved Successfully</h1>
                <p style="color:#555; font-size:14px; margin:0;">Invoice <strong>#${orderShort}</strong> has cleared audit guidelines.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px; background-color:#fafafa; border-top:1px solid #eee; border-b:1px solid #eee;">
                <table width="100%">
                  <tr>
                    <td style="font-size:13px; color:#555;"><strong>Order Number:</strong></td>
                    <td style="font-size:13px; color:#111; text-align:right;">#${orderShort}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px; color:#555;"><strong>Cleared Timestamp:</strong></td>
                    <td style="font-size:13px; color:#111; text-align:right;">${approvedDate || new Date().toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px; color:#555;"><strong>Logistics Clearance:</strong></td>
                    <td style="font-size:13px; color:#10b981; text-align:right; font-weight:bold;">Active / Cleared Depot</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px; font-size:14px; color:#333; line-height:1.6;">
                <p style="margin-top:0;"><strong>Logistics Comments:</strong></p>
                <blockquote style="font-style:italic; border-left:3px solid #10b981; padding-left:14px; margin:10px 0; color:#555;">
                  ${deliveryInfo || "Your commercial shipment has cleared accounting verification and is allocated for temperature-controlled transport."}
                </blockquote>
                <p style="margin-bottom:0;">Goods will reach your specified freight terminal according to standard commercial schedules.</p>
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="#111111" style="padding:20px; font-size:11px; color:#888;">
                <p style="margin:0;">Edge Mart Logistics Desk. Authorized procurement tracking and balance control.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const mailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Edge Mart Logistics <onboarding@resend.dev>",
          to: [customerEmail],
          subject: `Order Approved - Edge Mart Invoice #${orderShort}`,
          html: htmlContent,
        }),
      });

      if (!mailResponse.ok) {
        throw new Error(await mailResponse.text());
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("Resend approval dispatch failed:", err);
      return res.status(500).json({ error: err.message || "Failed to dispatch approval dispatch" });
    }
  });

  // API 3: Send Rejection Email via Resend
  app.post("/api/send-rejection-email", async (req, res) => {
    try {
      const { customerEmail, orderId, rejectionReason } = req.body;

      if (!customerEmail || !orderId ) {
        return res.status(400).json({ error: "Missing required rejection details" });
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn("[Email Notification] RESEND_API_KEY is not configured in environment. Skipping rejection email dispatch.");
        return res.status(200).json({ success: true, message: "Audit status updated. Notification email skipped (RESEND_API_KEY not configured)." });
      }
      const orderShort = orderId.slice(-6).toUpperCase();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order Audit Rejected</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f4f4; font-family:sans-serif;">
          <table align="center" width="600" style="margin-top:40px; margin-bottom:40px; background-color:#ffffff; border:1px solid #ddd; border-top:6px solid #E11D2E; border-collapse:collapse;">
            <tr>
              <td style="padding:30px; text-align:center;">
                <h1 style="color:#E11D2E; font-size:24px; margin:0 0 10px 0; text-transform:uppercase;">Transaction Audit Overruled</h1>
                <p style="color:#555; font-size:14px; margin:0;">Compliance check failed for Invoice <strong>#${orderShort}</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px; background-color:#fafafa; border-top:1px solid #eee; border-b:1px solid #eee;">
                <table width="100%">
                  <tr>
                    <td style="font-size:13px; color:#555;"><strong>Order Number:</strong></td>
                    <td style="font-size:13px; color:#111; text-align:right;">#${orderShort}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px; color:#555;"><strong>Review Stance:</strong></td>
                    <td style="font-size:13px; color:#E11D2E; text-align:right; font-weight:bold;">Declined / Awaiting Settlement</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px; font-size:14px; color:#333; line-height:1.6;">
                <p style="margin-top:0; color:#E11D2E;"><strong>Reason for Audit Failure:</strong></p>
                <div style="background-color:#fff5f5; border-left:3px solid #E11D2E; padding:14px; margin:10px 0; color:#c53030; font-family:sans-serif; text-transform:uppercase; font-size:12px; letter-spacing:0.5px;">
                  ${rejectionReason || "The uploaded bank transfer summary screenshot was illegible or the total sum did not clear edge check reserves."}
                </div>
                <p>Please log in to your Edge Mart Dashboard to attach valid credentials, upload alternative transactional proof sheets under '/payment/${orderId}', or contact our corporate logistics terminal.</p>
                <p style="margin-top:15px; margin-bottom:0;">Contact Support: <strong>support@edgemartwholesale.com</strong></p>
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="#111111" style="padding:20px; font-size:11px; color:#888;">
                <p style="margin:0;">Edge Mart Clearing Agent. Private proprietary system.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const mailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Edge Mart Auditor <onboarding@resend.dev>",
          to: [customerEmail],
          subject: `Order Audit Declined - Edge Mart Invoice #${orderShort}`,
          html: htmlContent,
        }),
      });

      if (!mailResponse.ok) {
        throw new Error(await mailResponse.text());
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("Resend rejection dispatch failed:", err);
      return res.status(500).json({ error: err.message || "Failed to dispatch rejection dispatch" });
    }
  });

  // Client Routing Static or Dev Proxy setup
  if (process.env.NODE_ENV !== "production") {
    // Vite Middlewares in development mode to seamlessly run react server on standard port 3000
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve client static assets in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Edge Mart Server] Full-Stack Server active on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to boot Edge Mart Server:", err);
});
