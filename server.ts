import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
  });

  // Smart Ticket Triage & Classification
  app.post("/api/ai/triage", async (req, res) => {
    try {
      const { title, description, department, assetInfo } = req.body;
      const ai = getAI();

      if (!ai) {
        // Intelligent rule-based fallback
        const lower = `${title} ${description}`.toLowerCase();
        let cat = "Other";
        let prio = "Medium";
        let estMin = 60;
        let hint = "Please restart your application or device to see if the issue persists.";

        if (lower.includes("keyboard") || lower.includes("mouse") || lower.includes("trackpad") || lower.includes("cursor")) {
          cat = "Keyboard or mouse not working";
          prio = "Medium";
          estMin = 30;
          hint = "Try disconnecting and reconnecting the USB receiver/cable or turning the mouse power switch off and on.";
        } else if (lower.includes("charging") || lower.includes("power") || lower.includes("turning on") || lower.includes("battery") || lower.includes("charger") || lower.includes("won't turn on")) {
          cat = "Laptop not charging or turning on";
          prio = "High";
          estMin = 45;
          hint = "Try a hard reset by holding down the laptop power button for 20 seconds while plugged into the wall charger.";
        } else if (lower.includes("password") || lower.includes("email password") || lower.includes("reset password") || lower.includes("locked out") || lower.includes("login")) {
          cat = "Email Password";
          prio = "High";
          estMin = 15;
          hint = "You can self-service reset your password via the identity portal if your MFA mobile device is enrolled.";
        } else if (lower.includes("word") || lower.includes("excel") || lower.includes("powerpoint") || lower.includes("office") || lower.includes("outlook") || lower.includes("microsoft 365") || lower.includes("m365")) {
          cat = "Microsoft Office( Word, Powerpoint & Excel)";
          prio = "Medium";
          estMin = 45;
          hint = "Try closing all Office applications and signing out and back in with your corporate Microsoft 365 credentials.";
        } else if (lower.includes("wifi") || lower.includes("network") || lower.includes("vpn") || lower.includes("internet") || lower.includes("connectivity") || lower.includes("dns")) {
          cat = "Network Connectivity";
          prio = "High";
          estMin = 30;
          hint = "Check your WiFi connection, toggle airplane mode off and on, or verify your VPN status.";
        } else if (lower.includes("license") || lower.includes("activation") || lower.includes("app error") || lower.includes("crash") || lower.includes("install") || lower.includes("software")) {
          cat = "Software (App errors, Activation Keys)";
          prio = "Medium";
          estMin = 60;
          hint = "Check if pending software updates are available in the corporate software portal.";
        } else if (lower.includes("request") || lower.includes("new laptop") || lower.includes("monitor") || lower.includes("headset") || lower.includes("equipment")) {
          cat = "Equipment Request";
          prio = "Low";
          estMin = 120;
          hint = "Your equipment request will be reviewed and routed to the IT procurement and inventory team.";
        }

        return res.json({
          detectedCategory: cat,
          recommendedPriority: prio,
          urgencyReasoning: "Evaluated based on enterprise operational impact rules.",
          estimatedMinutes: estMin,
          suggestedTags: [cat.toLowerCase().replace(/[^a-z0-9]/g, "-"), prio.toLowerCase(), "automated-triage"],
          autoDeflectionHint: hint,
          rootCauseHypothesis: `Issue appears related to ${cat} category. Initial inspection recommended.`,
          isAiGenerated: false
        });
      }

      const prompt = `You are an expert IT Service Desk Operations AI Agent.
Analyze the following IT support ticket request and output a strictly valid JSON object.

Ticket Title: "${title || ""}"
Ticket Description: "${description || ""}"
Reporter Department: "${department || "General"}"

Output JSON with these exact fields:
{
  "detectedCategory": "Keyboard or mouse not working" | "Laptop not charging or turning on" | "Email Password" | "Microsoft Office( Word, Powerpoint & Excel)" | "Software (App errors, Activation Keys)" | "Network Connectivity" | "Equipment Request" | "Other",
  "recommendedPriority": "Low" | "Medium" | "High" | "Critical",
  "urgencyReasoning": "Brief 1-sentence reasoning for this priority classification",
  "estimatedMinutes": integer estimated resolution time in minutes,
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "autoDeflectionHint": "A clear, polite 1-2 sentence self-service check or quick workaround the user can try right now before an agent responds",
  "rootCauseHypothesis": "Concise technical hypothesis for the IT technician"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ ...parsed, isAiGenerated: true });
    } catch (err: any) {
      console.error("AI Triage error:", err);
      return res.status(500).json({ error: err.message || "Failed to triage ticket" });
    }
  });

  // AI Diagnostic Copilot & Remediation Generator
  app.post("/api/ai/diagnose", async (req, res) => {
    try {
      const { ticket, comments, agentPrompt } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.json({
          diagnosticSteps: [
            "1. Verify network connectivity and ping default gateway.",
            "2. Inspect Event Viewer / Console.log for corresponding error codes.",
            "3. Clear local application cache and restart corresponding system service.",
            "4. Verify user permissions and token validity in IAM directory."
          ],
          cliScript: "# Powershell Quick Check\nTest-NetConnection -ComputerName internal.corp.net -Port 443\nGet-Service -Name *Corp* | Restart-Service -Force",
          suggestedReply: `Hello ${ticket?.reporterName || "there"},\n\nThank you for reaching out to IT Support. We have received your request regarding "${ticket?.title || "your issue"}".\n\nCould you please confirm if this behavior persists after restarting the application? If you receive an error code, please share a screenshot.\n\nBest regards,\nIT Support Team`,
          internalNotes: "Standard triage applied. Awaiting user feedback on diagnostic steps.",
          isAiGenerated: false
        });
      }

      const prompt = `You are a Senior IT Systems Administrator & Helpdesk Copilot.
Analyze this IT Support ticket and provide step-by-step diagnostic procedures, CLI troubleshooting scripts, a friendly customer reply, and internal technician notes.

Ticket Details:
- Title: ${ticket.title}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Status: ${ticket.status}
- Reporter: ${ticket.reporterName} (${ticket.reporterEmail || "unknown"}, Dept: ${ticket.reporterDepartment || "General"})
- Device/Asset: ${ticket.assetId || "Standard Laptop"} (OS: ${ticket.operatingSystem || "Windows 11 / macOS"})
- Description: ${ticket.description}
- Previous Comments: ${JSON.stringify(comments || [])}
- Agent Special Query/Instruction: "${agentPrompt || "Provide full diagnosis and resolution plan"}"

Output ONLY a JSON object with this structure:
{
  "diagnosticSteps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "cliScript": "Executable PowerShell / Bash / Terminal commands with comments for technician",
  "suggestedReply": "Polite, empathetic, and crystal clear message to the end-user explaining next steps or resolution",
  "internalNotes": "Technical summary for the IT team with root cause theory and escalation path",
  "recommendedAction": "e.g. Request Logs, Escalate to Tier 2, Execute PowerShell Script, or Mark as Resolved"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ ...parsed, isAiGenerated: true });
    } catch (err: any) {
      console.error("AI Diagnose error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate diagnosis" });
    }
  });

  // AI Thread Summarizer
  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { ticket, comments } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.json({
          summary: `Ticket #${ticket.id} (${ticket.title}) reported by ${ticket.reporterName}. Status is currently ${ticket.status} with priority ${ticket.priority}. Total ${comments?.length || 0} updates logged.`,
          keyTakeaways: ["Initial issue logged", "Awaiting diagnostic verification", "SLA monitored"],
          isAiGenerated: false
        });
      }

      const prompt = `Summarize this IT support ticket conversation concisely for handover or SLA review.
Ticket: ${ticket.title} (${ticket.category}, ${ticket.priority})
Description: ${ticket.description}
Comments Timeline:
${(comments || []).map((c: any) => `[${c.authorRole} - ${c.authorName} (${c.type})]: ${c.content}`).join("\n")}

Return JSON:
{
  "summary": "2-3 sentence overview of issue, actions taken, and current roadblock/status",
  "keyTakeaways": ["point 1", "point 2", "point 3"],
  "nextBestAction": "Single immediate next step required"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ ...parsed, isAiGenerated: true });
    } catch (err: any) {
      console.error("AI Summarize error:", err);
      return res.status(500).json({ error: err.message || "Failed to summarize" });
    }
  });

  // AI Knowledge Base Article Generator
  app.post("/api/ai/generate-kb", async (req, res) => {
    try {
      const { ticket, resolutionNotes } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.json({
          title: `Troubleshooting Guide: ${ticket.title}`,
          category: ticket.category || "General",
          summary: `Resolution guide for ${ticket.title} encountered by ${ticket.reporterDepartment || "users"}.`,
          symptoms: [ticket.description || "Reported unexpected behavior"],
          rootCause: "Software configuration mismatch or network timeout.",
          resolutionSteps: [
            "1. Identify affected endpoint and verify connectivity.",
            "2. Run application diagnostic utility or reinstall client package.",
            "3. Validate fix with end user and update inventory status."
          ],
          prevention: "Keep software clients updated via automatic patch management.",
          isAiGenerated: false
        });
      }

      const prompt = `Convert this resolved IT support ticket into a standardized IT Knowledge Base (KB) article for technicians and end-users.
Ticket Title: ${ticket.title}
Category: ${ticket.category}
Initial Problem: ${ticket.description}
Resolution Notes: ${resolutionNotes || "Issue resolved successfully."}

Output JSON:
{
  "title": "KB Article Title (e.g., How to Fix... / Troubleshooting...)",
  "category": "${ticket.category}",
  "summary": "Brief 1-2 sentence summary of what this article resolves",
  "symptoms": ["Symptom 1", "Symptom 2"],
  "rootCause": "Explanation of underlying root cause",
  "resolutionSteps": ["Step 1...", "Step 2...", "Step 3..."],
  "prevention": "Tips to prevent recurrence",
  "keywords": ["tag1", "tag2", "tag3"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ ...parsed, isAiGenerated: true });
    } catch (err: any) {
      console.error("AI KB Generator error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate KB article" });
    }
  });

  // Vite middleware for dev or static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IT Support Desk server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
