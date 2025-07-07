const express = require('express');
const student = express.Router();
const controller = require('../controller/controller')
const multer  = require('multer')




const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/') 
    // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    
    cb(null, Date.now() + '-' + file.originalname)
     // Use original name or modify as needed

  }
 //exports filename to controller.js
})

const upload = multer({ storage: storage })


const {authenticateToken} = require('../middleware/loginmiddleware')

const {authenticateTokenStudent} = require('../middleware/loginmiddleware')
const admincontrol = require('../controller/admincontroller')



student.get('/admin/login',admincontrol.adminlogin)
student.post('/admin/login',admincontrol.adminloginpost)
student.get('/teacher/login',admincontrol.teacherlogin)
student.post('/teacher/logins',admincontrol.teacherloginpost)
student.get('/',authenticateTokenStudent,controller.homePage)
student.get('/student/login/home',admincontrol.studentlogin)
student.post('/student/login/home',admincontrol.studentloginpost)

student.get('/admin/term/:terminal',authenticateToken,admincontrol.admin)


student.get('/admin/subject/:subId?',authenticateToken,admincontrol.showSubject)

student.post('/admin/subjectadd/:subId?',authenticateToken,upload.single('questionPaperOfClass'),admincontrol.addSubject)
student.get('/admin/get_subject_data',authenticateToken,admincontrol.subjectData)

student.get('/admin/class/:classId?',authenticateToken,admincontrol.showClass)
student.post('/admin/class/:classId?',authenticateToken,admincontrol.addClass)
student.get('/admin/terminal',authenticateToken,admincontrol.addTerminal)
student.post('/admin/terminal/:terminalId?',authenticateToken,admincontrol.addTerminalpost)
student.get('/admin/terminal/:terminalId/:editing?',authenticateToken,admincontrol.editTerminal)
student.get('/delete/terminal/:terminalId',authenticateToken,admincontrol.deleteTerminal)
student.get('/admin/new/subject',authenticateToken,admincontrol.addNewSubject)
student.post('/admin/new/subject/:subjectId?',authenticateToken,admincontrol.addNewSubjectPost)
student.get('/admin/new/subject/:subjectId/:editing?',authenticateToken,admincontrol.editNewSubject)
student.get('/delete/new/subject/:subjectId',authenticateToken,admincontrol.deleteNewSubject)

student.get('/delete/subject/:subjectId/:subjectname?',authenticateToken,admincontrol.deleteSubject)
student.get('/delete/class/:classId',authenticateToken,admincontrol.deleteStudentClass)
student.get('/admin/editsub/:subId/:editing?',authenticateToken,admincontrol.editSub)
student.get('/admin/editclass/:classId/:editing?',authenticateToken,admincontrol.editClass)
// Route for editing a student
student.get('/edit-student/:studentId/:subjectinput?/:studentClass?/:section?/:terminal?',authenticateTokenStudent, controller.editStudent);

// Route for updating a student
student.post('/update-student/:studentId/:subjectinput/:studentClass/:section/:terminal', authenticateTokenStudent,controller.updateStudent);

// Route for deleting a student
student.get('/delete-student/:studentId/:subjectinput?/:studentClass?/:section?/:terminal?',authenticateTokenStudent, controller.deleteStudent);
student.get('/crossheet',authenticateToken,admincontrol.cross_sheet)
student.get('/teacher/:controller?',authenticateTokenStudent,controller.teacherPage)
student.get('/teacher/:subject/:controller',authenticateTokenStudent,controller.studentclass)

student.get('/findData/:subjectinput/:studentClass/:section/:terminal',authenticateTokenStudent,controller.findData)
student.get('/findData/:subjectinput/:studentClass/:section/:termwise/:status',authenticateTokenStudent,controller.termwisestatus)
student.get('/findData/:subjectinput/:studentClass/:section/:termwise/:termwisereport/:status',authenticateTokenStudent,controller.termwisedata)
student.get('/findData/:subjectinput/:studentClass/:section/:termwise/:termwisereport/:status/:qno/:terminal',authenticateTokenStudent,controller.termdetail)

student.get('/student_data/:subjectinput/:studentClass/:section/:terminal', authenticateTokenStudent, controller.studentrecord)
student.post('/search/:subject/:studentClass/:section/:terminal',authenticateTokenStudent,controller.search)
student.get('/:controller/:subject',authenticateTokenStudent,controller.studentclass)
student.get('/:controller/:subject/:studentClass/:section',authenticateTokenStudent,controller.terminal)
student.get('/forms/:subjectinput/:studentClass/:section/:terminal?',authenticateTokenStudent,controller.showForm)
student.post('/forms/:subjectinput/:studentClass?/:section?/:terminal?',authenticateTokenStudent,controller.saveForm)

// Temporary debug route
student.get('/debug/:subjectinput/:studentClass/:section/:terminal', (req, res) => {
  const { subjectinput, studentClass, section, terminal } = req.params;
  
  // Get subject data similar to the showForm controller
  const Model = require('../model/schema');
  Model.find({ subject: subjectinput })
    .then(subjects => {
      if (!subjects) {
        return res.status(404).render('404');
      }
      res.render('debug', {
        subjects,
        subjectname: subjectinput,
        studentClass,
        section,
        terminal,
        totalEntries: 0
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server Error');
    });
});

student.get('/studentData/:subjectinput/:studentClass/:section/:qno/:status/:terminal',authenticateTokenStudent,controller.studentData)
student.get('/totalStudent/:subjectinput/:studentClass/:section/:terminal',authenticateTokenStudent,controller.totalStudent)

// Debug route to check available subjects
student.get('/debug/subjects', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { subjectSchema } = require('../model/adminschema');
    const subjectlist = mongoose.model("subjectlist", subjectSchema, "subjectlist");
    
    // Get all subjects
    const subjects = await subjectlist.find({}).lean();
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    res.json({
      totalSubjects: subjects.length,
      subjects: subjects.map(s => ({
        name: s.subject,
        max: s.max,
        existsAsCollection: collectionNames.includes(s.subject)
      })),
      availableCollections: collectionNames
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});
student.get('/studentrecord',upload.single('studentRecords'),authenticateToken,admincontrol.studentrecord)
student.post('/studentrecord',upload.single('studentRecords'),authenticateToken,admincontrol.studentrecordpost)

// Route to view/display uploaded files in browser
student.get('/view-file/:filename', authenticateToken, admincontrol.viewFile)

// Enhanced file viewer routes for better VM compatibility
student.get('/file-viewer/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const path = require('path');
  const fs = require('fs');
  const rootDir = require('../utils/path').rootDir;
  const filePath = path.join(rootDir, 'uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).render('404', { message: 'File not found' });
  }
  
  res.render('file-viewer', { filename: filename });
});

student.get('/view-pdf/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const path = require('path');
  const fs = require('fs');
  const rootDir = require('../utils/path').rootDir;
  const filePath = path.join(rootDir, 'uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  
  // Serve PDF with explicit headers for VM compatibility
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Send the file
  res.sendFile(filePath);
});

// Diagnostic route for VM deployment issues
student.get('/admin/diagnostics', authenticateToken, admincontrol.diagnostics)

module.exports = student;
