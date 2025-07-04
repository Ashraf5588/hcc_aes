const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
"subject":{ type: String,required: false},
"forClass":{ type: String,required: false},
"max":{ type: String,required: false},
"questionPaperOfClass":{ type: String,required: false},

    '1': { type: [String], required: false },
  '2': { type: [String], required: false },
  '3': { type: [String], required: false },
  '4': { type: [String], required: false },
  '5': { type: [String], required: false },
  '6': { type: [String], required: false },
  '7': { type: [String], required: false },
  '8': { type: [String], required: false },
  '9': { type: [String], required: false },
  '10': { type: [String], required: false },
  '11': { type: [String], required: false },
  '12':{type:[String],required: false},
  '13':{type:[String],required: false},
  '14':{type:[String],required: false},
  '15':{type:[String],required: false},
  '16':{type:[String],required: false},
  '17':{type:[String],required: false},
  '18':{type:[String],required: false},
  '19':{type:[String],required: false},
  '20':{type:[String],required: false},
  '21':{type:[String],required: false},
  '22':{type:[String],required: false},
  '23':{type:[String],required: false},
  '24':{type:[String],required: false},
  '25':{type:[String],required: false},

},{strict:false})
const classSchema = new mongoose.Schema({

  
"studentClass":{ type: String,required: false},
  "section":{ type: String,required: false},

})
const terminalSchema = new mongoose.Schema({

  "terminal":{ type: String,required: false},

})

const studentrecordschema = new mongoose.Schema({
  "name":{ type: String,required: false},
  "studentClass":{ type: String,required: false},
  "section":{ type: String,required: false},
  "roll":{ type: Number,required: false},
})
const newsubjectSchema = new mongoose.Schema({
  "subject":{ type: String,required: false},

},{strict:false})
module.exports = {subjectSchema,classSchema,terminalSchema,studentrecordschema,newsubjectSchema};
