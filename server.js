// server.js
console.log("server.js is starting...");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory data (for demo only; use a real DB in production)
let users = [];            // { email, passwordHash }
let driverProfiles = [];   // Extended driver info
let passengerProfiles = [];// Extended passenger info

const csvHeader = [
  {id: 'email', title: 'Email'},
  {id: 'passwordHash', title: 'PasswordHash'},
  {id: 'fullName', title: 'FullName'},
  {id: 'address', title: 'Address'},
  {id: 'extracurriculars', title: 'Extracurriculars'},
  {id: 'leaveForMC', title: 'LeaveForMC'},
  {id: 'leaveFromMC', title: 'LeaveFromMC'},
  {id: 'role', title: 'Role'},
  {id: 'payment', title: 'Payment'},
  {id: 'drivingDuration', title: 'DrivingDuration'},
  {id: 'accidents', title: 'Accidents'},
  {id: 'insured', title: 'Insured'},
  {id: 'responsible', title: 'Responsible'}
];

const csvWriter = createCsvWriter({
  path: 'users.csv',
  header: csvHeader,
  append: true
});

// --- MIGRATION: Ensure users.csv has all columns ---
if (fs.existsSync('users.csv')) {
  const lines = fs.readFileSync('users.csv', 'utf8').split(/\r?\n/).filter(Boolean);
  const expectedCols = csvHeader.length;
  // Remove any header row (if present)
  let dataRows = lines;
  if (lines.length > 0 && lines[0].toLowerCase().includes('email') && lines[0].toLowerCase().includes('passwordhash')) {
    dataRows = lines.slice(1);
  }
  // Always migrate: pad all rows
  console.log('Forcing migration of users.csv to remove header and add driver fields...');
  const migratedRows = dataRows.map(row => {
    const cols = row.split(',');
    while (cols.length < expectedCols) cols.push('');
    return cols.slice(0, expectedCols).join(',');
  });
  // Write with a single newline between each row, and a trailing newline
  fs.writeFileSync('users.csv', migratedRows.join('\n') + (migratedRows.length ? '\n' : ''));
  console.log('Migration complete. users.csv now has all columns and NO header.');
}

// Patch csvWriter to always add a newline before appending if needed
function appendCsvRecord(record) {
  let needsNewline = false;
  if (fs.existsSync('users.csv')) {
    const stat = fs.statSync('users.csv');
    if (stat.size > 0) {
      const fd = fs.openSync('users.csv', 'r');
      const buffer = Buffer.alloc(1);
      fs.readSync(fd, buffer, 0, 1, stat.size - 1);
      fs.closeSync(fd);
      if (buffer.toString() !== '\n') needsNewline = true;
    }
  }
  const row = csvHeader.map(h => record[h.id] ?? '').join(',');
  fs.appendFileSync('users.csv', (needsNewline ? '\n' : '') + row + '\n');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from "public" folder
app.use(express.static("public"));

// Test route to verify the server is running
app.get("/test", (req, res) => {
  res.send("Hello World from CarPal (test route)!");
});

/**
 * POST /api/signup
 * Creates a user account, validating the @mchs.org domain
 */
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, fullName, address, extracurriculars, leaveForMC, leaveFromMC, role, payment, drivingDuration, accidents, insured, responsible } = req.body;

    // Validate email domain
    if (!email || !email.endsWith("@mchs.org")) {
      return res
        .status(400)
        .json({ message: "Email must end with @mchs.org. Must be a Mount Carmel Highschool email." });
    }

    // Check if user already exists (in memory and in CSV)
    let exists = users.find((user) => user.email === email);
    if (!exists && fs.existsSync('users.csv')) {
      const csvUsers = [];
      await new Promise((resolve) => {
        fs.createReadStream('users.csv')
          .pipe(csv())
          .on('data', (row) => csvUsers.push(row))
          .on('end', resolve);
      });
      exists = csvUsers.find(u => u.email === email);
    }
    if (exists) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Store user in memory
    users.push({ email, passwordHash, fullName, address, extracurriculars, leaveForMC, leaveFromMC, role, payment, drivingDuration, accidents, insured, responsible });

    // Debug log for CSV writing
    console.log('Attempting to write to users.csv:', { email, passwordHash, fullName, address, extracurriculars, leaveForMC, leaveFromMC, role, payment, drivingDuration, accidents, insured, responsible });
    console.log('Driver fields check:', { role, drivingDuration, accidents, insured, responsible });

    // Save to CSV
    appendCsvRecord({ email, passwordHash, fullName, address, extracurriculars, leaveForMC, leaveFromMC, role, payment, drivingDuration, accidents, insured, responsible });
    console.log('Successfully wrote to users.csv');
    console.log("New user signed up:", email);

    return res.json({ message: "Account created successfully!" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error during signup." });
  }
});

/**
 * POST /api/login
 * Logs in a user by checking email and password
 */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists (in memory and in CSV)
    let user = users.find(u => u.email === email);
    if (!user && fs.existsSync('users.csv')) {
      const csvUsers = [];
      await new Promise((resolve) => {
        fs.createReadStream('users.csv')
          .pipe(csv())
          .on('data', (row) => csvUsers.push(row))
          .on('end', resolve);
      });
      const csvUser = csvUsers.find(u => u.Email === email);
      if (csvUser) {
        user = {
          email: csvUser.Email,
          passwordHash: csvUser.PasswordHash,
          fullName: csvUser.FullName,
          address: csvUser.Address,
          extracurriculars: csvUser.Extracurriculars,
          leaveForMC: csvUser.LeaveForMC,
          leaveFromMC: csvUser.LeaveFromMC,
          role: csvUser.Role,
          payment: csvUser.Payment
        };
      }
    }
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials (wrong password)." });
    }

    console.log("User logged in:", email);
    return res.json({ success: true, message: "Login successful!" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error during login." });
  }
});

/**
 * POST /api/driverSignup
 * Submits driver application info
 */
app.post("/api/driverSignup", (req, res) => {
  try {
    const driverData = req.body;
    driverProfiles.push(driverData);

    console.log("New driver profile:", driverData);
    return res.json({ message: "Driver application submitted successfully!" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error during driver signup." });
  }
});

/**
 * POST /api/passengerSignup
 * Submits passenger application info
 */
app.post("/api/passengerSignup", (req, res) => {
  try {
    const passengerData = req.body;
    passengerProfiles.push(passengerData);

    console.log("New passenger profile:", passengerData);
    return res.json({ message: "Passenger application submitted successfully!" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error during passenger signup." });
  }
});

/**
 * POST /api/settings
 * Updates user settings and saves to CSV.
 */
app.post("/api/settings", async (req, res) => {
  try {
    const { email, fullName, address, extracurriculars, leaveForMC, leaveFromMC, role, payment, password, drivingDuration, accidents, insured, responsible } = req.body;
    let passwordHash = undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }
    // Read all users from CSV
    let usersArr = [];
    if (fs.existsSync('users.csv')) {
      await new Promise((resolve) => {
        fs.createReadStream('users.csv')
          .pipe(csv())
          .on('data', (row) => usersArr.push(row))
          .on('end', resolve);
      });
    }
    // Find user by email
    let userIdx = usersArr.findIndex(u => u.email === email);
    const updatedUser = {
      email: email,
      passwordHash: passwordHash || (usersArr[userIdx] ? usersArr[userIdx].passwordHash : ''),
      fullName: fullName,
      address: address,
      extracurriculars: extracurriculars,
      leaveForMC: leaveForMC,
      leaveFromMC: leaveFromMC,
      role: role,
      payment: payment,
      drivingDuration: drivingDuration,
      accidents: accidents,
      insured: insured,
      responsible: responsible
    };
    if (userIdx !== -1) {
      usersArr[userIdx] = updatedUser;
    } else {
      usersArr.push(updatedUser);
    }
    // Write all users back to CSV
    const rows = usersArr.map(user => csvHeader.map(h => user[h.id] ?? '').join(','));
    fs.writeFileSync('users.csv', rows.join('\n') + (rows.length ? '\n' : ''));
    console.log('Successfully updated users.csv');
    return res.json({ message: "Settings updated and saved!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error during settings update." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 