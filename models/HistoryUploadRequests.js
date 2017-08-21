var mongoose = require('mongoose')

var HistoryUploadRequestSchema = new mongoose.Schema({
  owner : String,
  disease: String,
  prescription: String,
  description: String,
  date: Date,
  author: String,
})

mongoose.model('HistoryUploadRequest', HistoryUploadRequestSchema)
