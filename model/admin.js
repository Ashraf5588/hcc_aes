const mongoose = require('mongoose');
const adminSchema = new mongoose.Schema({
 "username":String,
 "password":String,
 "role":String

  
});
const superadminSchema = new mongoose.Schema({
 "username":String,
 "password":String,
 "role":String

});

module.exports = {adminSchema, superadminSchema};