const express = require("express");
const session = require("express-session");
const { google } = require("googleapis");
const path = require("path");
const crypto = require("crypto");
const cors = require("cors");
const { Client, Databases } = require("node-appwrite");
require("dotenv").config();

const app = express();
const secretKey = crypto.randomBytes(32).toString("hex");

// Serve static files (like style.css)
app.use(express.static(path.join(__dirname)));

// Appwrite Setup [cite: 4, 22]
const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.PROJECT_ID || "698560cb003bcdb1c88e")
  .setKey(process.env.API_KEY);
const database = new Databases(client);

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.sleep.read",
  "https://www.googleapis.com/auth/userinfo.profile"
]; [cite: 5, 25]

app.use(cors());
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" }
})); [cite: 6, 26]

// Route: Serve index.html as the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route: Start Auth [cite: 8, 28]
app.get("/auth/google", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent"
  });
  res.redirect(authUrl);
});

// Route: OAuth Callback [cite: 9, 29]
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    req.session.tokens = tokens;
    res.redirect("/"); // Redirect back to home to see the dashboard
  } catch (error) {
    res.status(500).send("Authentication Error");
  }
});

// Route: Fetch Data for Frontend [cite: 10, 30]
app.get("/fetch-data", async (req, res) => {
  try {
    const fitness = google.fitness({ version: "v1", auth: oAuth2Client });
    const endTimeMillis = Date.now();
    const startTimeMillis = endTimeMillis - (14 * 24 * 60 * 60 * 1000);

    const response = await fitness.users.dataset.aggregate({
      userId: "me",
      requestBody: {
        aggregateBy: [
          { dataTypeName: "com.google.step_count.delta" },
          { dataTypeName: "com.google.heart_rate.bpm" }
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis,
        endTimeMillis,
      },
    });

    const formattedData = response.data.bucket.map(bucket => {
      let steps = 0;
      let heartRate = 0;
      bucket.dataset.forEach(ds => {
        if (ds.point.length > 0) {
          const val = ds.point[0].value[0];
          if (ds.dataSourceId.includes("step_count")) steps = val.intVal || 0;
          if (ds.dataSourceId.includes("heart_rate")) heartRate = val.fpVal || 0;
        }
      });
      return {
        date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(),
        step_count: steps,
        heart_rate: heartRate.toFixed(1)
      };
    }); [cite: 11, 31, 34]

    res.json({ status: "success", data: formattedData });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`)); [cite: 13, 14, 38, 39]
