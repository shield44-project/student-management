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
    attendance: 94,
    cgpa: 9.25,
    feeStatus: "Paid",
    phone: "+91 98765 43210",
    status: "Active",
    courses: ["Distributed Systems", "Cloud Computing", "Deep Learning", "Compiler Design", "Cybersecurity"],
    notes: "Core member of Coding Club; placed at Google as SWE intern."
  },
  {
    name: "Ananya Iyer",
    usn: "1RV21CS014",
    email: "ananya.cs21@rvce.edu.in",
    department: "CSE",
    semester: 7,
    attendance: 88,
    cgpa: 9.10,
    feeStatus: "Paid",
    phone: "+91 98451 23456",
    status: "Active",
    courses: ["Distributed Systems", "Cloud Computing", "Deep Learning", "Information Security"],
    notes: "Class representative; lead organizer for HackRV 2026."
  },
  {
    name: "Rohan Kulkarni",
    usn: "1RV22AI005",
    email: "rohan.ai22@rvce.edu.in",
    department: "AIML",
    semester: 5,
    attendance: 72,
    cgpa: 8.45,
    feeStatus: "Pending",
    phone: "+91 97312 34567",
    status: "Active",
    courses: ["Computer Vision", "Natural Language Processing", "Reinforcement Learning", "Neural Networks"],
    notes: "Attendance shortage alert issued. Research paper in CVPR under review."
  },
  {
    name: "Pooja Hegde",
    usn: "1RV22AI022",
    email: "pooja.ai22@rvce.edu.in",
    department: "AIML",
    semester: 5,
    attendance: 91,
    cgpa: 8.95,
    feeStatus: "Paid",
    phone: "+91 94480 12345",
    status: "Active",
    courses: ["Computer Vision", "Natural Language Processing", "Robotics & Kinematics", "Big Data Analytics"],
    notes: "Top performer in Autonomous Robotics Lab."
  },
  {
    name: "Aditya Verma",
    usn: "1RV22IS009",
    email: "aditya.is22@rvce.edu.in",
    department: "ISE",
    semester: 5,
    attendance: 85,
    cgpa: 8.30,
    feeStatus: "Paid",
    phone: "+91 98860 98765",
    status: "Active",
    courses: ["Software Engineering", "Full Stack Web Dev", "Database Management", "Computer Networks"],
    notes: "Full-stack developer intern at a Bangalore fintech startup."
  },
  {
    name: "Sneha Patil",
    usn: "1RV22IS031",
    email: "sneha.is22@rvce.edu.in",
    department: "ISE",
    semester: 5,
    attendance: 64,
    cgpa: 7.80,
    feeStatus: "Partial",
    phone: "+91 99001 56789",
    status: "On Leave",
    courses: ["Software Engineering", "Enterprise Systems", "Database Management"],
    notes: "Medical leave approved for autumn semester. Attendance exemption filed."
  },
  {
    name: "Vikram Rao",
    usn: "1RV23EC018",
    email: "vikram.ec23@rvce.edu.in",
    department: "ECE",
    semester: 3,
    attendance: 89,
    cgpa: 8.75,
    feeStatus: "Paid",
    phone: "+91 91234 56780",
    status: "Active",
    courses: ["Digital Electronics", "Signals & Systems", "Microcontrollers & Embedded C", "Network Analysis"],
    notes: "Robotics club sensor subsystem lead."
  },
  {
    name: "Diya Nair",
    usn: "1RV23EC042",
    email: "diya.ec23@rvce.edu.in",
    department: "ECE",
    semester: 3,
    attendance: 96,
    cgpa: 9.40,
    feeStatus: "Paid",
    phone: "+91 92345 67891",
    status: "Active",
    courses: ["Digital Electronics", "Signals & Systems", "VLSI Design", "Linear ICs"],
    notes: "Department rank 1 in 2nd semester examinations."
  },
  {
    name: "Karthik Gowda",
    usn: "1RV23EE007",
    email: "karthik.ee23@rvce.edu.in",
    department: "EEE",
    semester: 3,
    attendance: 78,
    cgpa: 7.90,
    feeStatus: "Pending",
    phone: "+91 93456 78902",
    status: "Active",
    courses: ["Electric Circuit Theory", "Power Electronics", "Electromagnetic Fields", "Control Systems"],
    notes: "EV Battery Management System project member."
  },
  {
    name: "Meera Menon",
    usn: "1RV23EE025",
    email: "meera.ee23@rvce.edu.in",
    department: "EEE",
    semester: 3,
    attendance: 92,
    cgpa: 8.65,
    feeStatus: "Paid",
    phone: "+91 94567 89013",
    status: "Active",
    courses: ["Power Electronics", "Renewable Energy Systems", "Control Systems", "Transformers & Induction"],
    notes: "Solar microgrid lab researcher."
  },
  {
    name: "Rahul Deshmukh",
    usn: "1RV24ME012",
    email: "rahul.me24@rvce.edu.in",
    department: "ME",
    semester: 1,
    attendance: 87,
    cgpa: 8.20,
    feeStatus: "Paid",
    phone: "+91 95678 90124",
    status: "Active",
    courses: ["Engineering Mechanics", "Thermodynamics", "Materials Science", "CAD & 3D Drafting"],
    notes: "Formula Student chassis design subgroup recruit."
  },
  {
    name: "Tanvi Joshi",
    usn: "1RV24ME033",
    email: "tanvi.me24@rvce.edu.in",
    department: "ME",
    semester: 1,
    attendance: 90,
    cgpa: 8.50,
    feeStatus: "Paid",
    phone: "+91 96789 01235",
    status: "Active",
    courses: ["Engineering Mechanics", "Thermodynamics", "Workshop Practice", "Engineering Math I"],
    notes: "Completed SolidWorks CSWA certification."
  },
  {
    name: "Pranav Bhat",
    usn: "1RV24CV004",
    email: "pranav.cv24@rvce.edu.in",
    department: "CIV",
    semester: 1,
    attendance: 69,
    cgpa: 7.45,
    feeStatus: "Partial",
    phone: "+91 97890 12346",
    status: "Active",
    courses: ["Surveying & Geomatics", "Structural Mechanics", "Building Materials", "Engineering Geology"],
    notes: "Attendance below 75% requirement. Parent-teacher meeting scheduled."
  },
  {
    name: "Isha Sundaram",
    usn: "1RV22DS011",
    email: "isha.ds22@rvce.edu.in",
    department: "DS",
    semester: 5,
    attendance: 95,
    cgpa: 9.35,
    feeStatus: "Paid",
    phone: "+91 98901 23457",
    status: "Active",
    courses: ["Applied Statistics", "Machine Learning Systems", "Data Warehousing & Mining", "Data Visualization"],
    notes: "Kaggle Master; author of open-source data analytics library."
  },
  {
    name: "Varun Reddy",
    usn: "1RV20CS088",
    email: "varun.cs20@rvce.edu.in",
    department: "CSE",
    semester: 8,
    attendance: 93,
    cgpa: 9.42,
    feeStatus: "Paid",
    phone: "+91 99012 34568",
    status: "Graduated",
    courses: ["Advanced Algorithms", "Distributed Ledgers", "Capstone Thesis"],
    notes: "Alumni mentor; graduated with Distinction. Employed at Microsoft."
  },
  {
    name: "Priyanka Shenoy",
    usn: "1RV20IS045",
    email: "priyanka.is20@rvce.edu.in",
    department: "ISE",
    semester: 8,
    attendance: 97,
    cgpa: 9.58,
    feeStatus: "Paid",
    phone: "+91 90123 45679",
    status: "Graduated",
    courses: ["Distributed Computing", "Information Retrieval", "Capstone Project"],
    notes: "Pursuing MS in Computer Science at Carnegie Mellon University."
  },
  {
    name: "Abhishek Pandey",
    usn: "1RV23AI019",
    email: "abhishek.ai23@rvce.edu.in",
    department: "AIML",
    semester: 3,
    attendance: 83,
    cgpa: 8.10,
    feeStatus: "Paid",
    phone: "+91 91230 45678",
    status: "Active",
    courses: ["Data Structures & Algorithms", "Mathematics for Machine Learning", "Python for AI", "Digital Logic"],
    notes: "Working on generative AI conversational agents."
  },
  {
    name: "Kavya Murthy",
    usn: "1RV24OT003",
    email: "kavya.ot24@rvce.edu.in",
    department: "OTHER",
    semester: 1,
    attendance: 88,
    cgpa: 8.60,
    feeStatus: "Paid",
    phone: "+91 92341 56789",
    status: "Active",
    courses: ["Biochemistry", "Molecular Biology", "Bioprocess Engineering", "Applied Biostatistics"],
    notes: "Interdisciplinary Biotechnology program scholarship recipient."
  }
];

(async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for student seeding...");

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
    console.log(`Successfully updated/seeded ${seededCount} students with Attendance, CGPA, Fees, and Courses! Total: ${totalStudents}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
})();
