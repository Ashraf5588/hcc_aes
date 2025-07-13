const path = require("path");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
var docxConverter = require('docx-pdf');
const bs = require("bikram-sambat-js")

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { rootDir } = require("../utils/path");
const { classSchema, subjectSchema, terminalSchema,newsubjectSchema } = require("../model/adminschema");
const { adminSchema,superadminSchema} = require("../model/admin");
const { studentSchema } = require("../model/schema");
const student = require("../routers/mainpage");
const terminal = mongoose.model("terminal", terminalSchema, "terminal");
const newsubject = mongoose.model("newsubject", newsubjectSchema, "newsubject");
app.set("view engine", "ejs");
app.set("view", path.join(rootDir, "views"));


const multer = require('multer')
const fs = require('fs')

// Configure storage with better file naming

// Helper function to fetch sidenav data
const getSidenavData = async () => {
  try {
    const subjects = await subject.find({}).lean();
    const studentClassdata = await studentClass.find({}).lean();
    const terminals = await terminal.find({}).lean();
    
    return {
      subjects,
      studentClassdata,
      terminals
    };
  } catch (error) {
    console.error('Error fetching sidenav data:', error);
    return {
      subjects: [],
      studentClassdata: [],
      terminals: []
    };
  }
};

// Create mongoose models
const subject = mongoose.model("subject", subjectSchema, "subjectlist");
const studentClass = mongoose.model("studentClass", classSchema, "classlist");
const studentTerminal = mongoose.model("studentTerminal", classSchema, "terminal");
const admin = mongoose.model("admin", adminSchema, "admin");
const superadmin = mongoose.model("superadmin", superadminSchema, "superadmin");
let entryArray = [];

/**
 * Transform entry array data into a pivoted format for better data visualization
 * 
 * This function takes the MongoDB aggregation results and creates a pivot table structure:
 * - Rows represent unique subjects (math, science, etc.)
 * - Columns represent unique class-section combinations (4-janak, 2-chanakya, etc.)
 * - Each cell contains the totalentry value for that subject and class-section
 * - Empty cells are represented as 0
 * 
 * The returned object has three properties:
 * - subjects: Array of unique subject names sorted alphabetically
 * - headers: Array of class-section combinations sorted by class number then section name
 * - pivotTable: Nested object where pivotTable[subject][classSection] gives the entry count
 * 
 * Example output:
 * {
 *   subjects: ["English", "Math", "Science"],
 *   headers: ["1-A", "1-B", "2-A"],
 *   pivotTable: {
 *     "English": { "1-A": 20, "1-B": 15, "2-A": 18 },
 *     "Math": { "1-A": 22, "1-B": 17, "2-A": 19 },
 *     "Science": { "1-A": 21, "1-B": 16, "2-A": 17 }
 *   }
 * }
 * 
 * @param {Array} entries - The original entry array data from MongoDB aggregation
 * @returns {Object} Object containing subjects, headers and pivoted table data
 */
function transformToPivotedFormat(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { subjects: [], headers: [], pivotTable: {} };
  }

  try {
    // Extract unique subjects and class-section combinations
    const subjects = [...new Set(entries.map(entry => entry.subject))].sort();
    
    // Create headers by combining class and section (e.g., "4-janak")
    const classSections = [...new Set(entries.map(entry => `${entry.studentClass}-${entry.section}`))];
    
    // Sort headers by class number first, then section
    const headers = classSections.sort((a, b) => {
      try {
        const classA = parseInt(a.split('-')[0]);
        const classB = parseInt(b.split('-')[0]);
        
        // If classes are different, sort by class number
        if (classA !== classB) {
          return classA - classB;
        }
        
        // If classes are the same, sort
        const sectionA = a.split('-')[1];
        const sectionB = b.split('-')[1];
        return sectionA.localeCompare(sectionB);
      } catch (error) {
        console.error("Error sorting headers:", error);
        return 0;
      }
    });
    
    // Create a pivot table as an object
    const pivotTable = {};
    
    // Initialize the pivot table with zeros for all combinations
    subjects.forEach(subject => {
      pivotTable[subject] = {};
      headers.forEach(header => {
        pivotTable[subject][header] = 0;
      });
    });
    
    // Fill in the pivot table with actual values
    entries.forEach(entry => {
      try {
        const subject = entry.subject;
        const header = `${entry.studentClass}-${entry.section}`;
        pivotTable[subject][header] = entry.totalentry;
      } catch (error) {
        console.error("Error setting pivot table value:", error);
      }
    });
    
    return {
      subjects,
      headers,
      pivotTable
    };
  } catch (error) {
    console.error("Error in transformToPivotedFormat:", error);
    return { subjects: [], headers: [], pivotTable: {} };
  }
}

exports.adminlogin = async (req, res, next) => {
  try {
    res.render("admin/login");
  } catch (err) {
    console.log(err);
  }
};
exports.adminloginpost = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await admin.findOne({
      username: `${username}`,
      password: `${password}`,
    });
    if (!user) {
      res.render("admin/invalid");
    } else {
      const token = jwt.sign(
        { user: user.username, role: user.role },
        "mynameisashraf!23_9&",
        { expiresIn: "1440h" }
      );
      console.log("Generated Token:", token); // Log the generated token

      res.cookie("token", token, { httpOnly: true, secure: false });
      res.redirect("/admin/term/FIRST");
    }
  } catch (err) {
    console.log(err);
  }
};


exports.teacherlogin = async (req, res, next) => {
  try {
    res.render("admin/teacherlogin");
  } catch (err) {
    console.log(err);
  }
};
exports.teacherloginpost = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await admin.findOne({
      username: `${username}`,
      password: `${password}`,
    });
    if (!user) {
      res.render("admin/invalid");
    } else {
      const teachertoken = jwt.sign(
        { user: user.username, role: user.role },
        "mynameisashrafteacher!23_9&",
        { expiresIn: "1440h" }
      );
      // Log the generated token

      res.cookie("teachertoken", teachertoken, { httpOnly: true, secure: false });
      res.redirect("/teacher/findData");
    }
  } catch (err) {
    console.log(err);
  }
};
exports.studentlogin = async (req, res, next) => {
  try {
    res.render("admin/studentlogin");
  } catch (err) {
    console.log(err);
  }
};
exports.studentloginpost = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await admin.findOne({
      username: `${username}`,
      password: `${password}`,
    });
    if (!user) {
      res.render("admin/invalid");
    } else {
      const studenttoken = jwt.sign(
        { user: user.username, role: user.role },
        "mynameisashrafstudent!23_9&",
        { expiresIn: "1440h" }
      );
      console.log("Generated Token:", studenttoken); // Log the generated token

      res.cookie("studenttoken", studenttoken, { httpOnly: true, secure: false });
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
};


exports.admin = async (req, res, next) => {
  try {
    // Initialize array
    entryArray = [];
    const subjects = await subject.find({});
    const studentClasslist = await studentClass.find({});
    const terminal = req.params.terminal; // Get terminal from params
    
    console.log(`🔍 Processing admin data for terminal: ${terminal}`);
    console.log(`📚 Found ${subjects.length} subjects`);
    console.log(`🏫 Found ${studentClasslist.length} class-sections`);

    // Create subject mappings
    const subjectMappings = await subject.find({});
    const allowedSubjectsMap = {};
subjectMappings.forEach(sub => {
  if (!allowedSubjectsMap[sub.subject]) {
    allowedSubjectsMap[sub.subject] = [];
  }
  allowedSubjectsMap[sub.subject].push(String(sub.forClass));
});



    console.log(`🗺️ Subject mappings:`, allowedSubjectsMap);

    // Populate entryArray with improved error handling
    for (const sub of subjects) {
      console.log(`\n📖 Processing subject: ${sub.subject}`);
      
      for (const stuclass of studentClasslist) {
        const section = stuclass.section;
        const studentClass = stuclass.studentClass;

        console.log(`  🔍 Checking class ${studentClass}, section ${section}`);

        // Check if this subject is allowed for this class
        if (!allowedSubjectsMap[sub.subject]?.includes(studentClass.toString())) {
          console.log(`  ⏭️  Skipping ${sub.subject} for class ${studentClass} (not in allowed classes)`);
          continue;
        }

        const modelName = `${sub.subject}_${studentClass}_${section}_${terminal}`;
        console.log(`  📊 Model name: ${modelName}`);

        try {
          // Check if collection exists first
          const db = mongoose.connection.db;
          const collections = await db.listCollections({ name: modelName }).toArray();
          
          if (collections.length === 0) {
            console.log(`  ⚠️  Collection ${modelName} doesn't exist, setting count to 0`);
            entryArray.push({
              studentClass: studentClass,
              section: section,
              subject: sub.subject,
              terminal: terminal,
              totalentry: 0,
            });
            continue;
          }

          // Create or get existing model
          const model = mongoose.models[modelName] ||
                        mongoose.model(modelName, studentSchema, modelName);

          // Query the collection with better error handling
          const totalstudentthirdterminal = await model.aggregate([
            { 
              $match: { 
                section: section,
                terminal: terminal,
                studentClass: studentClass
              } 
            },
            { $count: "count" },
          ]);

          const totalentry = totalstudentthirdterminal[0]?.count || 0;
          console.log(`  ✅ Found ${totalentry} students`);

          entryArray.push({
            studentClass: studentClass,
            section: section,
            subject: sub.subject,
            terminal: terminal,
            totalentry: totalentry,
          });

        } catch (modelError) {
          console.error(`  ❌ Error querying ${modelName}:`, modelError.message);
          // Add entry with 0 count if there's an error
          entryArray.push({
            studentClass: studentClass,
            section: section,
            subject: sub.subject,
            terminal: terminal,
            totalentry: 0,
          });
        }
      }
    }

    console.log(`\n📋 Total entries processed: ${entryArray.length}`);
    console.log(`📊 Entry array sample:`, entryArray.slice(0, 3));

    // Transform entryArray into pivoted format with fixed variable names
    let pivotedData;
    try {
      if (typeof transformToPivotedFormat === 'function') {
        pivotedData = transformToPivotedFormat(entryArray);
        console.log("✅ Pivoted data generated successfully using function");
      } else {
        console.log("⚠️  transformToPivotedFormat function not available, creating manually");
        
        // Create pivot table manually with DIFFERENT variable names to avoid conflict
        const uniqueSubjects = [...new Set(entryArray.map(e => e.subject))].sort();
        const uniqueHeaders = [...new Set(entryArray.map(e => `${e.studentClass}-${e.section}`))].sort();
        
        console.log(`📚 Unique subjects: ${uniqueSubjects.length}`, uniqueSubjects);
        console.log(`🏫 Unique headers: ${uniqueHeaders.length}`, uniqueHeaders);
        
        // Create pivot table
        const pivotTable = {};
        uniqueSubjects.forEach(subjectName => {
          pivotTable[subjectName] = {};
          uniqueHeaders.forEach(header => {
            pivotTable[subjectName][header] = 0;
          });
        });
        
        // Fill in values
        entryArray.forEach(entry => {
          const header = `${entry.studentClass}-${entry.section}`;
          if (pivotTable[entry.subject]) {
            pivotTable[entry.subject][header] = entry.totalentry;
          }
        });
        
        pivotedData = { 
          subjects: uniqueSubjects, 
          headers: uniqueHeaders, 
          pivotTable: pivotTable 
        };
        
        console.log("✅ Manual pivot table created");
      }
    } catch (error) {
      console.error("❌ Error transforming data:", error);
      pivotedData = { subjects: [], headers: [], pivotTable: {} };
    }

    // Get student class data separately to avoid variable conflicts
    const studentClassdata = await studentClass.find({});
    
    // Get sidenav data
    const sidenavData = await getSidenavData();
    
    console.log(`\n🎯 Final data summary:`);
    console.log(`  - Subjects: ${subjects.length}`);
    console.log(`  - Class list: ${studentClasslist.length}`);
    console.log(`  - Entry array: ${entryArray.length}`);
    console.log(`  - Pivot subjects: ${pivotedData.subjects.length}`);
    console.log(`  - Pivot headers: ${pivotedData.headers.length}`);
    
    // Render with entryArray and pivotedData
    res.render("admin/adminpannel", {
      editing: false,
      subjects,
      studentClasslist,
      entryArray,
      pivotedData,
      terminal, 
      studentClassdata,
      ...sidenavData
    });
    
  } catch (err) {
    console.error("❌ Error in admin function:", err);
    console.error("Stack trace:", err.stack);
    next(err);
  }
};

exports.showSubject = async (req, res, next) => {
  const subjects = await subject.find({}).lean();
  const studentClassdata = await studentClass.find({});
    const className = req.query.className;
    const newsubjectList = await newsubject.find({}).lean();
  
  // Get sidenav data
  const sidenavData = await getSidenavData();
  
  res.render("admin/subjectlist", { 
    subjects, 
    editing: false,
    currentPage: 'adminSubject',
    studentClassdata,
    className,
    newsubjectList, 
    ...sidenavData
  });
};
exports.addSubject = async (req, res, next) => {  try {

    const { subId} = req.params;
    const className = req.query.className;
    
    
    console.log("=== ADDSUBJECT FUNCTION START ===");
    console.log("Subject ID (editing):", subId);
    console.log("File uploaded:", req.file);
    console.log("Form data:", req.body);
    console.log("Form has currentQuestionPaper:", req.body.currentQuestionPaper);
    console.log("=====================================");

    // Process the form data
    const formData = req.body;
    if (formData.subject) {
  formData.subject = formData.subject.trim();
}
    
    // Create a clean object with ONLY the fields we want
    const processedData = {
      // Basic fields
      subject: formData.subject,
      forClass: formData.forClass,
      max: formData.max
    };



    // Handle file upload logic
    // default.pdf serves as a shared placeholder file for subjects without specific question papers
    if (req.file) {
      // New file uploaded - process and save it
      const {rootDir} = require("../utils/path");
  
      console.log("Processing uploaded file:", req.file);
      
      // Check if the file is a DOCX file that needs conversion
      if (req.file.filename.endsWith('.docx')) {
        try {
          console.log(`🔄 Starting DOCX to PDF conversion for: ${req.file.filename}`);
          
          // Use Promise wrapper for better error handling
          await new Promise((resolve, reject) => {
            const inputPath = `${rootDir}/uploads/${req.file.filename}`;
            const outputPath = `${rootDir}/uploads/${req.file.filename.replace('.docx', '.pdf')}`;
            
            console.log(`📂 Input path: ${inputPath}`);
            console.log(`📂 Output path: ${outputPath}`);
            
            // Check if input file exists
            if (!fs.existsSync(inputPath)) {
              const error = new Error(`Input DOCX file not found: ${inputPath}`);
              console.error("❌ Input file check failed:", error.message);
              reject(error);
              return;
            }
            
            console.log(`✅ Input file exists, size: ${fs.statSync(inputPath).size} bytes`);
            console.log(`🔄 Converting DOCX to PDF: ${inputPath} -> ${outputPath}`);
            
            docxConverter(inputPath, outputPath, function(err, result) {
              if (err) {
                console.error("❌ DOCX conversion error:", err);
                reject(err);
              } else {
                console.log("✅ DOCX conversion successful:", result);
                
                // Verify the PDF was created
                if (fs.existsSync(outputPath)) {
                  const pdfSize = fs.statSync(outputPath).size;
                  console.log(`✅ PDF created successfully, size: ${pdfSize} bytes`);
                  
                  // Delete the temporary DOCX file after successful conversion
                  fs.unlink(inputPath, (unlinkErr) => {
                    if (unlinkErr) {
                      console.error(`⚠️ Error deleting temporary docx file: ${unlinkErr.message}`);
                    } else {
                      console.log(`🗑️ Temporary docx file deleted successfully: ${req.file.filename}`);
                    }
                  });
                  
                  resolve(result);
                } else {
                  const error = new Error("PDF file was not created despite successful conversion");
                  console.error("❌ PDF verification failed:", error.message);
                  reject(error);
                }
              }
            });
          });
          
          // Convert filename to PDF
          const finalFileName = req.file.filename.replace('.docx', '.pdf');
          processedData.questionPaperOfClass = finalFileName;
          console.log(`✅ CONVERSION COMPLETE - NEW FILE SET: ${finalFileName}`);
          
        } catch (conversionError) {
          console.error("❌ DOCX conversion failed:", conversionError.message);
          console.error("❌ Stack trace:", conversionError.stack);
          
          // If conversion fails, keep the original DOCX file but warn about it
          processedData.questionPaperOfClass = req.file.filename;
          console.log(`⚠️ CONVERSION FAILED - KEEPING ORIGINAL DOCX FILE: ${req.file.filename}`);
          console.log(`⚠️ Note: This file will force download instead of inline display`);
        }
      } else {
        // For non-DOCX files (PDF, etc.), use as-is
        processedData.questionPaperOfClass = req.file.filename;
        console.log(`NON-DOCX FILE - USING AS-IS: ${req.file.filename}`);
      }
      
      console.log("processedData.questionPaperOfClass =", processedData.questionPaperOfClass);
    } else if (formData.currentQuestionPaper) {
      // Editing mode: Keep existing file (could be default.pdf or a specific file)
      processedData.questionPaperOfClass = formData.currentQuestionPaper;
      console.log(`KEEPING EXISTING FILE: ${formData.currentQuestionPaper}`);
    } else {
      // Creating new subject with no file: Use default.pdf as placeholder
      // default.pdf is shared across multiple subjects and should never be deleted
      processedData.questionPaperOfClass = "default.pdf";
      console.log("NO FILE PROVIDED - USING DEFAULT: default.pdf");
    }

  // We don't need to delete or filter anything since we're building a new object

  // Process questions with their marks
  const numericKeys = Object.keys(formData)
    .filter(key => /^\d+$/.test(key))
      .map(key => parseInt(key))
      .sort((a, b) => a - b);
    
    console.log("Question numbers found:", numericKeys);

    // Process all questions that have mark inputs
    for (const qNum of numericKeys) {
      // Get the marks array which now includes the count as first element
      if (Array.isArray(formData[qNum])) {
        // Convert all values to numbers
        processedData[qNum] = formData[qNum].map(val => 
          !isNaN(parseFloat(val)) ? parseFloat(val) : val
        );
        console.log(`Question ${qNum} values (array):`, processedData[qNum]);
      } else {
        // If it's a single value, convert to a one-element array
        const value = !isNaN(parseFloat(formData[qNum])) ? 
          parseFloat(formData[qNum]) : formData[qNum];        processedData[qNum] = [value];
        console.log(`Question ${qNum} value (single):`, processedData[qNum]);
      }
    }

    console.log("=== FINAL PROCESSED DATA ===");
    console.log("Complete processedData object:", JSON.stringify(processedData, null, 2));
    console.log("questionPaperOfClass specifically:", processedData.questionPaperOfClass);
    console.log("============================");

    if (subId) {
      // Edit mode
      console.log("Edit mode - updating subject");
      const oldSubject = await subject.findById(subId);
      if (!oldSubject) {
        return res.status(404).send("Subject not found");
      }
      
      // File cleanup logic when editing a subject
      // When a new file is uploaded, delete the old file BUT protect default.pdf
      // default.pdf is a shared placeholder used by multiple subjects - never delete it
      if (req.file && oldSubject.questionPaperOfClass && 
          oldSubject.questionPaperOfClass !== processedData.questionPaperOfClass) {
        
        console.log(`Old file: ${oldSubject.questionPaperOfClass}`);
        console.log(`New file: ${processedData.questionPaperOfClass}`);
        
        // Only delete the old file if it's NOT default.pdf
        if (oldSubject.questionPaperOfClass !== "default.pdf") {
          try {
            const {rootDir} = require("../utils/path");
            const oldFilePath = `${rootDir}/uploads/${oldSubject.questionPaperOfClass}`;
            
            // Check if file exists before trying to delete it
            fs.access(oldFilePath, fs.constants.F_OK, (accessErr) => {
              if (accessErr) {
                console.log(`Old file not found (already deleted or moved): ${oldSubject.questionPaperOfClass}`);
              } else {
                // File exists, proceed with deletion
                fs.unlink(oldFilePath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error(`Error deleting old file: ${unlinkErr.message}`);
                  } else {
                    console.log(`✅ Old file deleted successfully: ${oldSubject.questionPaperOfClass}`);
                  }
                });
              }
            });
          } catch (error) {
            console.error("Error handling old file deletion:", error);
          }
        } else {
          console.log("🛡️ Protected: default.pdf is a shared system file - NOT deleting from uploads folder");
        }
      } else if (oldSubject.questionPaperOfClass === "default.pdf" && req.file) {
        console.log("📝 Replacing default.pdf placeholder with new uploaded file:", processedData.questionPaperOfClass);
        console.log("🛡️ default.pdf remains in uploads folder for other subjects to use");
      }
      
      // Update the subject in database
      console.log("BEFORE DATABASE UPDATE:");
      console.log("Subject ID:", subId);
      console.log("Processed Data:", processedData);
      console.log("Old questionPaperOfClass:", oldSubject.questionPaperOfClass);
      console.log("New questionPaperOfClass:", processedData.questionPaperOfClass);
      
      const updatedSubject = await subject.findByIdAndUpdate(
        subId,
        processedData,
        { new: true, runValidators: true }
      );
      
      console.log("AFTER DATABASE UPDATE:");
      console.log("Updated subject questionPaperOfClass:", updatedSubject.questionPaperOfClass);
      
      if (updatedSubject.questionPaperOfClass === processedData.questionPaperOfClass) {
        console.log("✅ Database update successful - file path updated correctly");
      } else {
        console.log("❌ Database update failed - file path not updated");
      }

      // Handle collection rename if subject name changed
      if (oldSubject.subject !== processedData.subject) {
        try {
          const db = mongoose.connection.db;
          await db.collection(oldSubject.subject).rename(processedData.subject);
          console.log(`Renamed collection from ${oldSubject.subject} to ${processedData.subject}`);
        } catch (err) {
          console.error(`Error renaming collection: ${err.message}`);
          // Continue anyway as the document is updated
        }
      }

      res.redirect("/admin/subject");
    } else {
      // Create mode
      console.log("Create mode - adding new subject with data:", processedData);

     
     await subject.create(processedData);
      res.redirect("/admin/subject");
    }
  } catch (err) {
   console.log(err)
  }
};


exports.showClass = async (req, res, next) => {
  const studentClasslist = await studentClass.find({});
  
  // Get sidenav data
  const sidenavData = await getSidenavData();
  
  res.render("admin/classlist", {
    editing: false,
    studentClasslist,
    currentPage: 'adminClass',
    ...sidenavData
  });
};


exports.subjectData = async (req, res, next) => {
  try {
    // Get parameters from query string
    const className = req.query.className;
    const subjectName = req.query.subjectName;
    
    console.log("Fetching subject data for:", { className, subjectName });
    
    // Validate parameters
    if (!className || !subjectName) {
      return res.status(400).json({ 
        error: "Missing parameters", 
        message: "Both className and subjectName are required" 
      });
    }

    // Find the subject in the database
    const result = await subject.findOne({ subject: subjectName, forClass: className });
    
    if (!result) {
      console.log(`No subject found for ${subjectName} in Class ${className}`);
      return res.status(404).json({ 
        error: "Subject not found", 
        message: `Cannot find ${subjectName} for Class ${className}` 
      });
    }
    
    console.log("Found subject data:", result);
    res.json(result);
  } catch (err) {
    console.error("Error in subjectData controller:", err);
    res.status(500).json({ 
      error: "Server error", 
      message: err.message 
    });
  }
}

exports.addClass = async (req, res, next) => {
  const { classId } = req.params;
  const updateClass = req.body.studentClass;
  const updateSection = req.body.section;
  console.log(updateClass)
  
  if (classId && !undefined) {
    await studentClass.findByIdAndUpdate(
      classId,
      { studentClass: `${updateClass}`, section: `${updateSection}` },
      { new: true, runValidators: true }
    );

    const studentclass = await studentClass.find({});
    res.redirect('/admin/class')
  } 
  else {
    console.log(req.body)
    await studentClass.create(req.body);
    console.log(req.body)
    res.redirect("/admin/class");
  }
};
exports.addNewSubject = async (req, res, next) => {
  const newsubjectList = await newsubject.find({}).lean();

  // Get sidenav data
  const sidenavData = await getSidenavData();

  res.render("admin/newsubject", {
    newsubjectList,
    editing: false,
    ...sidenavData
  });
}
exports.addNewSubjectPost = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const updatedNewSubject = req.body.newsubject.toUpperCase().trim();
    if (subjectId) {
      await newsubject.findByIdAndUpdate(
        subjectId,
        { newsubject: `${updatedNewSubject}` },
        { new: true, runValidators: true }
      );
    } else {
      await newsubject.create({ newsubject: updatedNewSubject });
    }
    res.redirect("/admin/new/subject");
  } catch (err) {
    console.error("Error in addNewSubjectPost:", err);
    res.status(500).send("Error adding new subject: " + err.message);
  }
}
exports.editNewSubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const newsubjectList = await newsubject.find({}).lean();
    const editing = req.query.editing === "true";
    const newsubjectData = await newsubject.findOne({ _id: subjectId });

    if (!newsubjectData) {
      return res.status(404).send("New subject not found");
    }
    res.render("admin/newsubject", {
      editing,
      subjectId,
      newsubjectData,
      newsubjectList,
      ...(await getSidenavData())
    });
  }
  catch (err) {
    console.error("Error in editNewSubject:", err);
    res.status(500).send("Error editing new subject: " + err.message);
  }
}
exports.deleteNewSubject = async (req, res, next) => {
  const { subjectId } = req.params;
  await newsubject.findByIdAndDelete(subjectId);
  res.redirect("/admin/new/subject");
}


exports.addTerminal = async (req, res, next) => {
  const terminalList = await terminal.find({},{ __v: 0 }).lean();
  
  // Get sidenav data
  const sidenavData = await getSidenavData();
  
  res.render("admin/terminal", { 
    terminalList, 
    editing: false,
    ...sidenavData
  });
}
exports.addTerminalpost = async (req, res, next) => {
  try {
    const { terminalId } = req.params;
    updatedterminal = req.body.terminal.toUpperCase().trim();
    if(terminalId)
    {
      
      await terminal.findByIdAndUpdate(
        terminalId,
        { terminal: `${updatedterminal}` },
        { new: true, runValidators: true }
       
      );
    
    }
    else
    {
      
    await terminal.create({ terminal: updatedterminal });
    }
     res.redirect("/admin/terminal");
  } catch (err) {
    console.error("Error in addTerminalpost:", err);
    res.status(500).send("Error adding terminal: " + err.message);
  }
}
exports.editTerminal = async (req, res, next) => {
  try {
    const { terminalId } = req.params;
      const terminalList = await terminal.find({},{ __v: 0 }).lean();
    const editing = req.query.editing === "true";
    const terminalData = await terminal.findOne({ _id: terminalId });

    if (!terminalData) {
      return res.status(404).send("Terminal not found");
    }
    res.render("admin/terminal", {
      editing,
      terminalData,
      terminalList,
      ...(await getSidenavData())
    });
  } catch (err) {
    console.error("Error in addTerminalpost:", err);
    res.status(500).send("Error adding terminal: " + err.message);
  }
}
exports.deleteTerminal = async (req, res, next) => {
  const {terminalId} = req.params;
  await terminal.findByIdAndDelete(terminalId);
  res.redirect("/admin/terminal");
}


exports.deleteSubject = async (req, res, next) => {
  const { subjectId, subjectname } = req.params;
  try {
    // Get the subject data before deletion to handle file cleanup
    const subjectData = await subject.findById(subjectId);
    
    // Clean up question paper file, but protect the shared default.pdf
    // default.pdf serves as a placeholder for multiple subjects and should never be deleted
    if (subjectData && subjectData.questionPaperOfClass && 
        subjectData.questionPaperOfClass !== "default.pdf") {
      try {
        const {rootDir} = require("../utils/path");
        const filePath = `${rootDir}/uploads/${subjectData.questionPaperOfClass}`;
        
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting question paper file: ${err.message}`);
          } else {
            console.log(`Question paper file deleted successfully: ${subjectData.questionPaperOfClass}`);
          }
        });
      } catch (error) {
        console.error("Error handling question paper file deletion:", error);
      }
    } else if (subjectData && subjectData.questionPaperOfClass === "default.pdf") {
      console.log("Protected: default.pdf is a shared placeholder file used by multiple subjects - not deleted");
    }

    // Drop the MongoDB collection for this subject
    
    
    // Delete the subject document from the database
    await subject.findByIdAndDelete(subjectId);
    
    res.redirect("/admin/subject");
  } catch (err) {
    console.error("Error deleting subject:", err);
    res.status(500).send("Error deleting subject: " + err.message);
  }
};

exports.deleteStudentClass = async (req, res, next) => {
  const { classId } = req.params;
  await studentClass.findByIdAndDelete(classId);
  res.redirect("/admin/class");
};

exports.editSub = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const editing = req.query.editing === "true";
    const subjects = await subject.find({}).lean();
    const subjectedit = await subject.findOne({ _id: `${subId}` });
     const studentClassdata = await studentClass.find({});
    const newsubjectList = await newsubject.find({}).lean();
    if (!subjectedit) {
      return res.status(404).send("Subject not found");
    }
    
    console.log("Editing subject:", subjectedit);
      const className = req.query.className;
    // Get student class data for form dropdown
    const sidenavData = await getSidenavData();
    
    res.render("admin/subjectlist", {
      editing,
      subId,
      subjectedit,
      subjects,
      studentClassdata,
      className,
      newsubjectList,
      ...sidenavData
    });
  } catch (err) {
    console.error("Error in editSub function:", err);
    res.status(500).send("Error loading subject edit form: " + err.message);
  }
};
exports.editClass = async (req, res, next) => {
  const { classId } = req.params;
  const editing = req.query.editing === "true";
  const classedit = await studentClass.findOne({ _id: `${classId}` });
  console.log(classedit)
  const studentClasslist = await studentClass.find({});
  
  // Get sidenav data
  const sidenavData = await getSidenavData();
  
   res.render("admin/classlist", {
      editing,
      classedit,
      classId,
      studentClasslist,
      currentPage: 'adminClass',
      ...sidenavData
    });
  }

exports.showTerminal = async (req, res, next) => {
  const terminalList = await studentTerminal.find({});
  res.render("admin/terminallist", {
    editing: false,
    terminalList,
  });
};

exports.addClass = async (req, res, next) => {
  const { classId } = req.params;
  const updateClass = req.body.studentClass;
  console.log(updateClass)
  if (classId && !undefined) {
    await studentClass.findByIdAndUpdate(
      classId,
      { studentClass: `${updateClass}`,section: `${req.body.section}` },
      { new: true, runValidators: true }
    );
   
    const studentclass = await studentClass.find({});
    res.redirect('/admin/class')
  } else {
    await studentClass.create(req.body);
    res.redirect("/admin/class");
  }
};
exports.cross_sheet = async (req, res, next) => {
  const subjectlist = await subject.find({}, { _id: 0, subject: 1, forClass: 1 });
  const classlist = await studentClass.find({}, { _id: 0, studentClass: 1, section: 1 });

  const sortedClassList = classlist.sort((a, b) => Number(a.studentClass) - Number(b.studentClass));
  const sortedsubjectlist = subjectlist.sort((a, b) => Number(a.forClass) - Number(b.forClass));

  const sidenavData = await getSidenavData();
  const terminalList = await terminal.find({}).lean();

  // 👇 Declare with default value (empty array)
  let sortedMarkslip = [];

  // ✅ Run this block only if full query is provided
  if (
    req.query.subject &&
    req.query.class &&
    req.query.section &&
    req.query.terminal
  ) {
    const modelName = `${req.query.subject}_${req.query.class}_${req.query.section}_${req.query.terminal}`;
    const subjectdata = mongoose.models[modelName] || mongoose.model(modelName, studentSchema, modelName);

    const slipclass = req.query.class;
    const subjectinput = req.query.subject;
    const section = req.query.section;

    const markslip = await subjectdata.find({ studentClass: slipclass, subject: subjectinput, section: section }, { _id: 0, __v: 0 });

    sortedMarkslip = markslip.sort((a, b) => {
      if (a.section === b.section) {
        return Number(a.roll) - Number(b.roll);
      }
      return a.section.localeCompare(b.section);
    });
  }


  res.render("admin/crosssheet", {
    editing: false,
    sortedMarkslip,
    currentPage: 'crossSheet',
    terminalList,
    sortedsubjectlist,
    sortedClassList,
    ...sidenavData
  });
};
exports.studentrecord = async (req, res, next) => {
  try {
    const year = new Date();
    const nepaliYear = bs.ADToBS(`${year}`);
    console.log(nepaliYear);

    // Get sidenav data
    const sidenavData = await getSidenavData();

    res.render("admin/schoolstudentrecord", {
      editing: false,
      nepaliYear,
      ...sidenavData
    });
  } catch (err) {
    console.error("Error in studentrecord:", err);
    res.status(500).send("Error loading student record page: " + err.message);
  }
};
exports.studentrecordpost = async (req, res, next) => {
try
{

  const { studentrecordschema } = require("../model/adminschema");
const modal = mongoose.model("studentrecord", studentrecordschema, "studentrecord");
//insert new record, delete old record from studentrecord collection when new file is uploaded csv,


  if (!req.file || req.file.mimetype !== 'text/csv') {
    return res.status(400).send("Please upload a valid CSV file");
  }
  
  // Read the CSV file
  const csvFilePath = req.file.path;
  const csv = require('csvtojson');
  
  // Convert CSV to JSON
  const jsonArray = await csv().fromFile(csvFilePath);
  
  // Insert JSON data into MongoDB
  await modal.deleteMany({});

  await modal.insertMany(jsonArray);
  
  // Delete the uploaded file after processing
  fs.unlinkSync(csvFilePath);
 console.log("File uploaded:", req.file);
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  } 
  else
  {
    res.redirect("/studentrecord");
  }
}catch(err)
{
  console.log(err);
  res.status(500).send("Error processing student records: " + err.message);
}
}

exports.viewFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const { rootDir } = require("../utils/path");
    const filePath = path.join(rootDir, 'uploads', filename);
    
    console.log(`🔍 ViewFile Request: ${filename}`);
    console.log(`📁 Root Directory: ${rootDir}`);
    console.log(`📄 Full File Path: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      
      // List all files in uploads directory for debugging
      try {
        const uploadsDir = path.join(rootDir, 'uploads');
        const files = fs.readdirSync(uploadsDir);
        console.log(`📂 Available files in uploads directory:`, files);
      } catch (dirError) {
        console.error(`❌ Error reading uploads directory:`, dirError);
      }
      
      return res.status(404).send('File not found');
    }
    
    // Get file stats for debugging
    const stats = fs.statSync(filePath);
    console.log(`📊 File stats:`, {
      size: stats.size,
      isFile: stats.isFile(),
      created: stats.birthtime,
      modified: stats.mtime
    });
    
    // Get file extension to determine content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    console.log(`🎯 File extension: ${ext}`);
    
    // Set appropriate content types for different file formats
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      default:
        contentType = 'application/octet-stream';
        break;
    }
    
    console.log(`📋 Content-Type: ${contentType}`);
    
    // CRITICAL FIX: Set headers to force inline display
    res.setHeader('Content-Type', contentType);
    
    // Only set Content-Disposition for Word docs (force download)
    // For PDFs and images, don't set Content-Disposition at all to allow inline viewing
    if (ext === '.doc' || ext === '.docx') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      console.log(`📥 Disposition: attachment (Word document)`);
    } else {
      // For PDFs, images, and other viewable files - NO Content-Disposition header
      console.log(`👁️ No disposition header - allowing inline display`);
    }
    
    res.setHeader('Content-Length', stats.size);
    
    // Add CORS headers for VM environments
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // For PDFs and images, set cache headers for better browser display
    if (ext === '.pdf' || ['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    // Additional PDF-specific headers to ensure inline display
    if (ext === '.pdf') {
      res.setHeader('Accept-Ranges', 'bytes');
      console.log(`📄 PDF-specific headers set for inline display`);
    }
    
    console.log(`🚀 Starting file stream for: ${filename}`);
    console.log(`🔧 Headers set:`, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Has-Disposition': (ext === '.doc' || ext === '.docx') ? 'Yes (attachment)' : 'No (inline)'
    });
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('open', () => {
      console.log(`✅ File stream opened successfully for: ${filename}`);
    });
    
    fileStream.on('error', (error) => {
      console.error(`❌ Error streaming file ${filename}:`, error);
      if (!res.headersSent) {
        res.status(500).send('Error displaying file');
      }
    });
    
    fileStream.on('end', () => {
      console.log(`✅ File stream completed for: ${filename}`);
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Error in viewFile:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).send('Error displaying file');
  }
};

// Diagnostic function for VM deployment issues
exports.diagnostics = async (req, res, next) => {
  try {
    const { rootDir } = require("../utils/path");
    const uploadsDir = path.join(rootDir, 'uploads');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        platform: process.platform,
        nodeVersion: process.version,
        cwd: process.cwd(),
        rootDir: rootDir
      },
      uploads: {
        directory: uploadsDir,
        exists: fs.existsSync(uploadsDir),
        permissions: null,
        files: []
      }
    };
    
    // Check uploads directory
    try {
      if (fs.existsSync(uploadsDir)) {
        const stats = fs.statSync(uploadsDir);
        diagnostics.uploads.permissions = {
          isDirectory: stats.isDirectory(),
          mode: stats.mode.toString(8),
          uid: stats.uid,
          gid: stats.gid
        };
        
        // List all files
        const files = fs.readdirSync(uploadsDir);
        diagnostics.uploads.files = files.map(file => {
          const filePath = path.join(uploadsDir, file);
          const fileStats = fs.statSync(filePath);
          return {
            name: file,
            size: fileStats.size,
            created: fileStats.birthtime,
            modified: fileStats.mtime,
            isFile: fileStats.isFile(),
            permissions: fileStats.mode.toString(8)
          };
        });
      }
    } catch (error) {
      diagnostics.uploads.error = error.message;
    }
    
    // Check if we're in a development or production environment
    diagnostics.environment.isDevelopment = process.env.NODE_ENV !== 'production';
    diagnostics.environment.port = process.env.PORT || 'not set';
    
    res.json(diagnostics);
    
  } catch (error) {
    console.error('Error in diagnostics:', error);
    res.status(500).json({
      error: 'Diagnostics failed',
      message: error.message,
      stack: error.stack
    });
  }
};