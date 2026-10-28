require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Student = require("../src/models/Student");
const User = require("../src/models/User");
const bcrypt = require("bcryptjs");

const sampleStudents = [
  {
    name: "Aarav Sharma",
    usn: "1RV21CS001",
    email: "aarav.cs21@rvce.edu.in",
    department: "CSE",
    semester: 7,
    phone: "+91 98765 43210",
    status: "Active",
    notes: "Core member of Coding Club; working on distributed systems project."
  },
  {
    name: "Ananya Iyer",
    usn: "1RV21CS014",
    email: "ananya.cs21@rvce.edu.in",
    department: "CSE",
    semester: 7,
    phone: "+91 98451 23456",
    status: "Active",
    notes: "Placed at Google; class representative."
  },
  {
    name: "Rohan Kulkarni",
    usn: "1RV22AI005",
    email: "rohan.ai22@rvce.edu.in",
    department: "AIML",
    semester: 5,
    phone: "+91 97312 34567",
    status: "Active",
    notes: "Research paper on computer vision under review."
  },
  {
    name: "Pooja Hegde",
    usn: "1RV22AI022",
    email: "pooja.ai22@rvce.edu.in",
    department: "AIML",
    semester: 5,
    phone: "+91 94480 12345",
    status: "Active",
    notes: "Lead organizer for AI Hackathon 2026."
  },
  {
    name: "Aditya Verma",
    usn: "1RV22IS009",
    email: "aditya.is22@rvce.edu.in",
    department: "ISE",
    semester: 5,
    phone: "+91 98860 98765",
    status: "Active",
    notes: "Full-stack developer intern at fintech startup."
  },
  {
    name: "Sneha Patil",
    usn: "1RV22IS031",
    email: "sneha.is22@rvce.edu.in",
    department: "ISE",
    semester: 5,
    phone: "+91 99001 56789",
    status: "On Leave",
    notes: "Medical leave approved for autumn semester."
  },
  {
    name: "Vikram Rao",
    usn: "1RV23EC018",
    email: "vikram.ec23@rvce.edu.in",
    department: "ECE",
    semester: 3,
    phone: "+91 91234 56780",
    status: "Active",
    notes: "Robotics club sensor team lead."
  },
  {
    name: "Diya Nair",
    usn: "1RV23EC042",
    email: "diya.ec23@rvce.edu.in",
    department: "ECE",
    semester: 3,
    phone: "+91 92345 67891",
    status: "Active",
    notes: "VLSI design elective topper."
  },
  {
    name: "Karthik Gowda",
    usn: "1RV23EE007",
    email: "karthik.ee23@rvce.edu.in",
    department: "EEE",
    semester: 3,
    phone: "+91 93456 78902",
    status: "Active",
    notes: "Smart grid EV charging project."
  },
  {
    name: "Meera Menon",
    usn: "1RV23EE025",
    email: "meera.ee23@rvce.edu.in",
    department: "EEE",
    semester: 3,
    phone: "+91 94567 89013",
    status: "Active",
    notes: "Renewable energy lab volunteer."
  },
  {
    name: "Rahul Deshmukh",
    usn: "1RV24ME012",
    email: "rahul.me24@rvce.edu.in",
    department: "ME",
    semester: 1,
    phone: "+91 95678 90124",
    status: "Active",
    notes: "Formula Student chassis design subgroup."
  },
  {
    name: "Tanvi Joshi",
    usn: "1RV24ME033",
    email: "tanvi.me24@rvce.edu.in",
    department: "ME",
    semester: 1,
    phone: "+91 96789 01235",
    status: "Active",
    notes: "3D CAD modeling workshop completed."
  },
  {
    name: "Pranav Bhat",
    usn: "1RV24CV004",
    email: "pranav.cv24@rvce.edu.in",
    department: "CIV",
    semester: 1,
    phone: "+91 97890 12346",
    status: "Active",
    notes: "Surveying and GIS certification."
  },
  {
    name: "Isha Sundaram",
    usn: "1RV22DS011",
    email: "isha.ds22@rvce.edu.in",
    department: "DS",
    semester: 5,
    phone: "+91 98901 23457",
    status: "Active",
    notes: "Data science Kaggle Master; statistical modeling."
  },
  {
    name: "Varun Reddy",
    usn: "1RV20CS088",
    email: "varun.cs20@rvce.edu.in",
    department: "CSE",
    semester: 8,
    phone: "+91 99012 34568",
    status: "Graduated",
    notes: "Alumni mentor; graduated with 9.4 CGPA."
  },
  {
    name: "Priyanka Shenoy",
    usn: "1RV20IS045",
    email: "priyanka.is20@rvce.edu.in",
    department: "ISE",
    semester: 8,
    phone: "+91 90123 45679",
    status: "Graduated",
    notes: "Pursuing MS in Computer Science at CMU."
  },
  {
    name: "Abhishek Pandey",
    usn: "1RV23AI019",
    email: "abhishek.ai23@rvce.edu.in",
    department: "AIML",
    semester: 3,
    phone: "+91 91230 45678",
    status: "Active",
    notes: "NLP and LLM fine-tuning team."
  },
  {
    name: "Kavya Murthy",
    usn: "1RV24OT003",
    email: "kavya.ot24@rvce.edu.in",
    department: "OTHER",
    semester: 1,
    phone: "+91 92341 56789",
    status: "Active",
    notes: "Interdisciplinary Biotechnology program."
  }
];

(async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for student seeding...");

    // Find or create admin user to associate with createdBy
    const adminEmail = String(process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log(`Admin user not found. Creating default admin (${adminEmail})...`);
      const defaultPassword = process.env.ADMIN_PASSWORD || "ChangeThisAdminPassword123!";
      admin = await User.create({
        name: process.env.ADMIN_NAME || "Project Administrator",
        email: adminEmail,
        password: await bcrypt.hash(defaultPassword, 12),
        role: "admin",
        active: true
      });
      console.log(`Admin created: ${admin.email}`);
    }

    let seededCount = 0;
    for (const item of sampleStudents) {
      await Student.findOneAndUpdate(
        { usn: item.usn },
        { ...item, createdBy: admin._id },
        { upsert: true, new: true, runValidators: true }
      );
      seededCount++;
    }

    const totalStudents = await Student.countDocuments();
    console.log(`Successfully seeded ${seededCount} sample students! Total students in database: ${totalStudents}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
})();

