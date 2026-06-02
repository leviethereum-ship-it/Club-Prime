import express from "express";
import path from "path";

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  status: "Sent" | "Failed";
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory logs for simulated e-mail notifications
const emailLogs: EmailLog[] = [
  {
    id: "mail-init",
    to: "leviethereum@gmail.com",
    subject: "Bem-vindo ao MyClubPrime Hospitality Network",
    body: "<h1>Sua conta VIP MyClubPrime foi ativada.</h1><p>Experimente as vilas premium de Jericoacoara, Cumbuco e Fortaleza com segurança jurídica e proteção financeira.</p>",
    timestamp: new Date().toISOString(),
    status: "Sent"
  }
];

// API: Health status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: List of sent email notifications for the simulated mailbox UI
app.get("/api/notifications/logs", (req, res) => {
  res.json({ logs: emailLogs });
});

// API: Send email (Simulation trigger)
app.post("/api/notifications/send", (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Missing required fields (to, subject, body)" });
  }

  const logEntry: EmailLog = {
    id: `mail-${Math.floor(1000 + Math.random() * 9000)}`,
    to,
    subject,
    body,
    timestamp: new Date().toISOString(),
    status: "Sent"
  };

  emailLogs.unshift(logEntry);
  console.log(`[Email Sent System Out] To: ${to} | Subject: ${subject}`);
  res.json({ success: true, log: logEntry });
});

// API: Mercado Pago PIX creation
app.post("/api/mp/pix", (req, res) => {
  const { amount, bookingId, guestEmail } = req.body;
  if (!amount || !bookingId) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Generates randomized mock webhook authentication hash and Mercado Pago static payload
  const pixCode = `00020126580014br.gov.bcb.pix0136myclubprime-escrow-mp-92383-pix-co5204000053039865407${Number(amount).toFixed(2)}5802BR5915MYCLUBPRIMECOST6009CEARA62070503${bookingId}6304`;

  res.json({
    id: `mp-transaction-${Math.floor(100000 + Math.random() * 900000)}`,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}`,
    copyPasteCode: pixCode,
    status: "pending",
    amount,
    bookingId
  });
});

async function run() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MyClubPrime Server] Living on http://localhost:${PORT}`);
  });
}

run().catch(err => {
  console.error("Failed to start fullstack server:", err);
});
