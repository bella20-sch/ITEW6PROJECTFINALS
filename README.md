# Student Profiling LMS

A comprehensive student information and profiling system for the College of Computer Studies.

---

## How to Run the System (Easiest Way)

Follow these simple steps to get everything started quickly:

1.  **Extract/Open** the project folder in your terminal or command prompt.
2.  **Run the Setup**: Double-click **`setup.bat`**. This will install all necessary files for both the backend and frontend.
3.  **Start the Project**: Double-click **`start-dev.bat`**. This will automatically open two new windows and start the system for you.

Once started, just open your browser to:
- **[http://localhost:3000](http://localhost:3000)** (Frontend)
- **[http://localhost:5000](http://localhost:5000)** (Backend API)

---

## Manual Execution (Step-by-Step)

If you prefer to run the components manually, follow these instructions:

### 1. Run the Backend (Server)
1.  Open a new terminal window.
2.  Navigate to the `student-profiling-node` folder.
3.  Type `npm install` (only needed the first time).
4.  Type `node server.js` to start the server.
    *   *Backend will be active at http://localhost:5000*

### 2. Run the Frontend (User Interface)
1.  Open another new terminal window.
2.  Navigate to the `student-profiling-lms` folder.
3.  Type `npm install` (only needed the first time).
4.  Type `npm run dev` to start the interface.
    *   *Frontend will be active at http://localhost:3000*

---

## Sign-in (by role)

After login, **MIS administrators** land on **[http://localhost:3000/mis](http://localhost:3000/mis)** (MIS console: dashboard, account provisioning, directory). **Faculty** and **students** land on the main LMS at `/`.

### ACCOUNT FOR MIS / Administrator
- **Email**: `mis.admin@school.edu`
- **Password**: `admin123`

### ACCOUNT FOR Faculty (sample account in `database.json`)
- **Email**: `ana.reyes@school.edu`
- **Password**: `faculty123`

### ACCOUNT FOR Student (sample account in `database.json`)
- **Email**: `maria.santos@school.edu`
- **Password**: `student123`

### Other seed accounts (Node `database.json`)

Every seed **student** uses **`student123`**. Other students in the sample file include `james.rodriguez@school.edu`, `sofia.chen@school.edu`, `mendozamayensofia31@gmail.com`, `nikol@email.com`, and `mourine.bella.student@school.edu` (student login for the same person who also has a faculty account under `bellamourine20@gmail.com`).

Every seed **faculty** member without a custom password uses **`faculty123`**. `hyune.hwang@school.edu` keeps **`password123`**. Faculty `bellamourine20@gmail.com` uses **`faculty123`**.

New faculty and student accounts created from **MIS → Account provisioning** receive the email and password you set there; they sign in on the same login page.

The old path **`/admin`** redirects to **`/mis/provision`**.

---

