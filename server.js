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
  {id: 'phoneNumber', title: 'PhoneNumber'},
  {id: 'address', title: 'Address'},
  {id: 'extracurriculars', title: 'Extracurriculars'},
  {id: 'scheduleConsistency', title: 'ScheduleConsistency'},
  {id: 'leaveForSchoolTime', title: 'LeaveForSchoolTime'},
  {id: 'finishExtracurriculars', title: 'FinishExtracurriculars'},
  {id: 'role', title: 'Role'},
  {id: 'drivingDuration', title: 'DrivingDuration'},
  {id: 'accidents', title: 'Accidents'},
  {id: 'insured', title: 'Insured'},
  {id: 'responsible', title: 'Responsible'},
  {id: 'parentContactInfo', title: 'ParentContactInfo'},
  {id: 'paymentMethod', title: 'PaymentMethod'}
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
  // Always migrate: pad all rows and ensure proper escaping
  console.log('Migrating users.csv to new field order and proper CSV escaping...');
  
  const escapeCsvField = (field) => {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
      return '"' + stringField.replace(/"/g, '""') + '"';
    }
    return stringField;
  };
  
  const migratedRows = dataRows.map(row => {
    // Parse the row properly (handle quoted fields)
    const cols = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < row.length) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        cols.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    cols.push(current); // Add the last field
    
    // Pad with empty fields if needed
    while (cols.length < expectedCols) cols.push('');
    return cols.slice(0, expectedCols).map(field => escapeCsvField(field)).join(',');
  });
  
  // Write with a single newline between each row, and a trailing newline
  fs.writeFileSync('users.csv', migratedRows.join('\n') + (migratedRows.length ? '\n' : ''));
  console.log('Migration complete. users.csv now has proper field order and CSV escaping.');
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
  
  // Properly escape CSV fields to handle commas, quotes, and newlines
  const escapeCsvField = (field) => {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
      return '"' + stringField.replace(/"/g, '""') + '"';
    }
    return stringField;
  };
  
  const row = csvHeader.map(h => escapeCsvField(record[h.id] ?? '')).join(',');
  fs.appendFileSync('users.csv', (needsNewline ? '\n' : '') + row + '\n');
}

// Function to display data collection statistics
async function displayDataStats() {
  try {
    if (!fs.existsSync('users.csv')) {
      console.log('📊 No user data found yet.');
      return;
    }

    const csvUsers = [];
    await new Promise((resolve) => {
      fs.createReadStream('users.csv')
        .pipe(csv())
        .on('data', (row) => csvUsers.push(row))
        .on('end', resolve);
    });

    const passengerCount = csvUsers.filter(u => u.Role === 'passenger').length;
    const driverCount = csvUsers.filter(u => u.Role === 'driver').length;
    const totalUsers = csvUsers.length;

    console.log('\n📊 CARPAL DATA COLLECTION STATISTICS');
    console.log('='.repeat(50));
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`🚶 Passengers: ${passengerCount}`);
    console.log(`🚗 Drivers: ${driverCount}`);
    console.log(`📈 Data Collection Rate: ${totalUsers > 0 ? '100%' : '0%'}`);
    console.log(`📅 Last Updated: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));

    // Show recent users
    if (csvUsers.length > 0) {
      console.log('\n🆕 Recent Users:');
      const recentUsers = csvUsers.slice(-3).reverse();
      recentUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.FullName || 'Unknown'} (${user.Email}) - ${user.Role || 'Unknown'}`);
      });
    }
  } catch (error) {
    console.error('Error displaying data stats:', error);
  }
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
    const { 
      email, 
      password, 
      fullName, 
      phoneNumber,
      address, 
      extracurriculars, 
      leaveForSchoolTime, 
      finishExtracurriculars, 
      scheduleConsistency,
      parentContactInfo,
      paymentMethod,
      role,
      drivingDuration, 
      accidents, 
      insured, 
      responsible 
    } = req.body;

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

    // Create user object with all fields
    const userData = {
      email,
      passwordHash,
      fullName,
      phoneNumber: phoneNumber || '',
      address,
      extracurriculars,
      scheduleConsistency: scheduleConsistency || '',
      leaveForSchoolTime: leaveForSchoolTime || '',
      finishExtracurriculars: finishExtracurriculars || '',
      role,
      drivingDuration: drivingDuration || '',
      accidents: accidents || '',
      insured: insured || '',
      responsible: responsible || '',
      parentContactInfo: parentContactInfo || '',
      paymentMethod: paymentMethod || ''
    };

    // Store user in memory
    users.push(userData);

    // Debug log for CSV writing
    console.log('Attempting to write to users.csv:', userData);
    console.log('Role and driver fields check:', { role, drivingDuration, accidents, insured, responsible });

    // Save to CSV
    appendCsvRecord(userData);
    console.log('Successfully wrote to users.csv');
    
    // Enhanced user signup logging
    console.log('\n🎉 NEW USER SIGNUP DETECTED!');
    console.log('='.repeat(60));
    console.log(`👤 User: ${fullName} (${email})`);
    console.log(`📱 Phone: ${phoneNumber || 'Not provided'}`);
    console.log(`📍 Address: ${address}`);
    console.log(`🎭 Role: ${role.toUpperCase()}`);
    console.log(`📅 Schedule: ${leaveForSchoolTime || 'Not set'} → ${finishExtracurriculars || 'Not set'}`);
    console.log(`🏃 Extracurriculars: ${extracurriculars || 'None listed'}`);
    console.log(`📋 Schedule Consistency: ${scheduleConsistency || 'Not specified'}`);
    console.log(`👨‍👩‍👧‍👦 Parent Contact: ${parentContactInfo || 'Not provided'}`);
    console.log(`💳 Payment Method: ${paymentMethod || 'Not selected'}`);
    
    if (role === 'driver') {
      console.log(`🚗 Driver Info:`);
      console.log(`   • License Duration: ${drivingDuration || 'Not specified'} months`);
      console.log(`   • Accidents: ${accidents || 'Not specified'}`);
      console.log(`   • Insured: ${insured || 'Not specified'}`);
      console.log(`   • Safety Agreement: ${responsible || 'Not specified'}`);
    }
    
    console.log(`📊 Total Users in System: ${users.length + 1}`);
    console.log(`⏰ Timestamp: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
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
          leaveForSchoolTime: csvUser.LeaveForSchoolTime,
          finishExtracurriculars: csvUser.FinishExtracurriculars,
          role: csvUser.Role,
          paymentMethod: csvUser.PaymentMethod,
          scheduleConsistency: csvUser.ScheduleConsistency
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

    // Enhanced user login logging
    console.log('\n🔐 USER LOGIN DETECTED!');
    console.log('='.repeat(50));
    console.log(`👤 User: ${user.fullName || 'Unknown'} (${email})`);
    console.log(`🎭 Role: ${user.role || 'Unknown'}`);
    console.log(`📍 Address: ${user.address || 'Not provided'}`);
    console.log(`📅 Schedule: ${user.leaveForSchoolTime || 'Not set'} → ${user.finishExtracurriculars || 'Not set'}`);
    console.log(`🏃 Extracurriculars: ${user.extracurriculars || 'None listed'}`);
    console.log(`📋 Schedule Consistency: ${user.scheduleConsistency || 'Not specified'}`);
    console.log(`⏰ Login Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
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
    const escapeCsvField = (field) => {
      if (field === null || field === undefined) return '';
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
        return '"' + stringField.replace(/"/g, '""') + '"';
      }
      return stringField;
    };
    
    const rows = usersArr.map(user => csvHeader.map(h => escapeCsvField(user[h.id] ?? '')).join(','));
    fs.writeFileSync('users.csv', rows.join('\n') + (rows.length ? '\n' : ''));
    console.log('Successfully updated users.csv');
    return res.json({ message: "Settings updated and saved!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error during settings update." });
  }
});

/**
 * GET /api/stats
 * Displays data collection statistics
 */
app.get("/api/stats", async (req, res) => {
  try {
    await displayDataStats();
    res.json({ message: "Statistics displayed in terminal" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error displaying statistics" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`🌐 Access your CarPal platform at: http://localhost:${PORT}`);
  
  // Display data collection statistics on startup
  setTimeout(() => {
    displayDataStats();
  }, 1000);
}); 