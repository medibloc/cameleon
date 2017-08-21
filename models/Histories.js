var mongoose = require('mongoose')

var HistorySchema = new mongoose.Schema({
  _owner : { type: String, ref: 'User' },
  index: Number,
  encKey : String
})

HistorySchema.index({_owner: 1, index: 1}, {unique: true})

mongoose.model('History', HistorySchema)
