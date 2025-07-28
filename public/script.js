// script.js

// Toggle profile menu dropdown when the profile icon is clicked
document.addEventListener("DOMContentLoaded", function() {
  const profileMenu = document.getElementById("profileMenu");
  const dropdownContent = document.getElementById("dropdownContent");

  if (profileMenu && dropdownContent) {
    profileMenu.addEventListener("click", function(e) {
      e.stopPropagation();
      dropdownContent.style.display = (dropdownContent.style.display === "block") ? "none" : "block";
    });
    // Close dropdown when clicking outside
    document.addEventListener("click", function(e) {
      if (!profileMenu.contains(e.target)) {
        dropdownContent.style.display = "none";
      }
    });
    // Keyboard accessibility
    profileMenu.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") {
        dropdownContent.style.display = (dropdownContent.style.display === "block") ? "none" : "block";
      }
      if (e.key === "Escape") {
        dropdownContent.style.display = "none";
      }
    });
  }
});

// Helper function to send JSON data via Fetch
async function postData(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

/* --------------------------
   SIGN UP
--------------------------- */
async function handleSignup(event) {
  event.preventDefault();
  
  const fullName = document.getElementById("fullName")?.value.trim();
  const phoneNumber = document.getElementById("phoneNumber")?.value.trim();
  const address = document.getElementById("address")?.value.trim();
  const extracurriculars = document.getElementById("extracurriculars")?.value.trim();
  const parentContact = document.getElementById("parentContact")?.value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const warning = document.getElementById("warning");

  try {
    const result = await postData("/api/signup", { fullName, phoneNumber, address, extracurriculars, parentContact, email, password });
    if (result.message.toLowerCase().includes("successfully")) {
      warning.style.color = "green";
      warning.textContent = result.message;
      // Optionally redirect after success
      // window.location.href = "login.html";
    } else {
      warning.style.color = "red";
      warning.textContent = result.message;
    }
  } catch (error) {
    warning.style.color = "red";
    warning.textContent = "Error: " + error.message;
  }
}

/* --------------------------
   LOGIN
--------------------------- */
async function handleLogin(event) {
  event.preventDefault();

  const loginEmail = document.getElementById("loginEmail").value.trim();
  const loginPassword = document.getElementById("loginPassword").value.trim();
  const loginWarning = document.getElementById("loginWarning");

  try {
    const result = await postData("/api/login", { email: loginEmail, password: loginPassword });
    if (result.success) {
      loginWarning.style.color = "green";
      loginWarning.textContent = result.message;
      // Optionally redirect
      // window.location.href = "index.html";
    } else {
      loginWarning.style.color = "red";
      loginWarning.textContent = result.message;
    }
  } catch (error) {
    loginWarning.style.color = "red";
    loginWarning.textContent = "Error: " + error.message;
  }
}

/* --------------------------
   DRIVER SIGNUP
--------------------------- */
async function handleDriverSignup(event) {
  event.preventDefault();
  
  const driverData = {
    fullName: document.getElementById("fullName")?.value,
    phoneNumber: document.getElementById("phoneNumber")?.value,
    licensePhoto: document.getElementById("licensePhoto").value,
    accidents: document.getElementById("accidents").value,
    licenseDate: document.getElementById("licenseDate").value,
    age: document.getElementById("age").value,
    insurance: document.getElementById("insurance").value,
    location: document.getElementById("location").value,
    gradYear: document.getElementById("gradYear").value,
    wakeUpTime: document.getElementById("wakeUpTime").value,
    leaveSchoolTime: document.getElementById("leaveSchoolTime").value,
    timeConsistency: document.getElementById("timeConsistency").value,
    extracurriculars: document.getElementById("extracurriculars").value,
    contactInfo: document.getElementById("contactInfo").value,
    parentContactInfo: document.getElementById("parentContactInfo").value
  };

  try {
    const result = await postData("/api/driverSignup", driverData);
    alert(result.message);
    event.target.reset();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

/* --------------------------
   PASSENGER SIGNUP
--------------------------- */
async function handlePassengerSignup(event) {
  event.preventDefault();
  
  const passengerData = {
    fullName: document.getElementById("fullName")?.value,
    phoneNumber: document.getElementById("phoneNumber")?.value,
    leaveForSchoolTime: document.getElementById("leaveForSchoolTime").value,
    finishExtracurriculars: document.getElementById("finishExtracurriculars").value,
    timeConsistency: document.getElementById("timeConsistency").value,
    passengerContactInfo: document.getElementById("passengerContactInfo").value,
    parentContactInfo: document.getElementById("parentContactInfo").value,
    passengerLocation: document.getElementById("passengerLocation").value,
    passengerExtracurriculars: document.getElementById("passengerExtracurriculars").value
  };

  try {
    const result = await postData("/api/passengerSignup", passengerData);
    alert(result.message);
    event.target.reset();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

/* --------------------------
   SETTINGS (including Change Password)
--------------------------- */
document.addEventListener("DOMContentLoaded", function() {
  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", function(e) {
      e.preventDefault();
      // Demo: Validate new password match if provided
      const currentPassword = document.getElementById("currentPassword")?.value;
      const newPassword = document.getElementById("newPassword")?.value;
      const confirmNewPassword = document.getElementById("confirmNewPassword")?.value;
      
      if (newPassword !== confirmNewPassword) {
        alert("New passwords do not match.");
        return;
      }
      
      // Proceed with saving settings (demo)
      alert("Settings updated (demo).");
    });
  }
});

/* --------------------------
   DRIVER SIGNUP and PASSENGER SIGNUP handlers remain unchanged
--------------------------- */
// write the rest of the signup/login functions
