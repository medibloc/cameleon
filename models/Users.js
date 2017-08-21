var mongoose = require('mongoose')

var UserSchema = new mongoose.Schema({
  _id   : {type: String, unique: true},
  histories : [{ type: mongoose.Schema.Types.ObjectId, ref: 'History' }]
})

mongoose.model('User', UserSchema)
