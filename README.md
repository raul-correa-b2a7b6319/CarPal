# CarPal

CarPal is a peer‑to‑peer rideshare platform built specifically for high school students. Drivers can earn money by giving fellow students a ride to school, and passengers can easily find and book safe, vetted rides. CarPal uses a lightweight Node.js/Express backend with CSV storage and a responsive Tailwind CSS front end.

---

## 🎥 Demo Video

Watch the full 13‑minute demo walkthrough:
[CarPal Demo Video](https://www.loom.com/share/7a1a0a99010740caa7439e5378e91f10?sid=8459fc65-dcd6-4be2-a691-c0d9f9a3d43f)

---

## 📋 Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Requirements](#requirements)
* [Installation](#installation)
* [Usage](#usage)
* [API Endpoints](#api-endpoints)
* [Data Storage & Statistics](#data-storage--statistics)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

---

## 🚀 Features

* **Role‑based Signup:** Separate flows for drivers and passengers, with Mount Carmel student email enforcement (`@mchs.org`).
* **Secure Authentication:** Passwords hashed with bcrypt before storage.
* **CSV Persistence:** All user data stored in `users.csv`, with automatic migration logic for schema changes.
* **Responsive UI:** Tailwind CSS–powered front end, mobile‑friendly components, animated feedback.
* **Real‑time Stats:** On server start, console logs driver and passenger counts for quick metrics.
* **Validation & Error Handling:** Front‑end form checks, server‑side validation, and user‑friendly error messages.

---

## 🛠 Tech Stack

* **Backend:** Node.js, Express.js
* **Authentication:** bcrypt
* **CSV Handling:** csv-writer, csv-parser, fs
* **Frontend:** HTML, JavaScript, Tailwind CSS
* **Utilities:** npm scripts

---

## ⚙️ Requirements

* **Node.js** v14 or higher
* **npm** v6 or higher

---

## 📥 Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/raul-correa-b2a7b6319/CarPal.git
   cd CarPal
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Start the server**

   ```bash
   npm start
   ```
4. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏃‍♂️ Usage

1. Choose **Driver** or **Passenger** from the landing page.
2. Fill out the signup form; drivers must meet the requirements (4+ months license, insured vehicle, guardian approval).
3. On submission, data is POSTed to `/api/signup`; successful signups redirect to a confirmation page.
4. Log in via `/api/login` to simulate returning users.
5. Check the terminal for up‑to‑date driver/passenger counts.

---

## 🔌 API Endpoints

### POST `/api/signup`

* **Description:** Registers a new user (driver or passenger).
* **Request Body:** JSON with fields: `email`, `password`, `fullName`, `phoneNumber`, `address`, plus driver‑ or passenger‑specific fields.
* **Responses:**

  * `200 OK` with `{ message: "Account created successfully!" }`
  * `400 Bad Request` for validation errors
  * `500 Internal Server Error` on failure

### POST `/api/login`

* **Description:** Authenticates a user.
* **Request Body:** `{ email, password }`
* **Responses:**

  * `200 OK` with `{ success: true, message: "Login successful!" }`
  * `401 Unauthorized` for wrong credentials
  * `500 Internal Server Error` on failure

---

## 📊 Data Storage & Statistics

* **`users.csv`** holds all user records. Startup logic ensures backward‑compatible migrations when new columns are added.
* **`displayDataStats()`** runs on server start, reads `users.csv` via `csv-parser`, and logs:

  * Total **Drivers**
  * Total **Passengers**

```js
console.log(`🚗 Drivers: ${driverCount}`);
console.log(`🎟 Passengers: ${passengerCount}`);
```

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/YourFeature`.
3. Commit your changes: `git commit -m "Add some feature"`.
4. Push to the branch: `git push origin feature/YourFeature`.
5. Open a Pull Request.

Please adhere to the existing code style and include tests where applicable.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 📬 Contact

**Raul Correa** – [rcorrea2024@gmail.com](mailto:rcorrea2024@gmail.com)

Feel free to reach out with questions or feedback!
