//jshint esversion:6//

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
//reuiring unique id generator package
const {v4: uuidv4} = require('uuid');
const d = new Date();

//connecting mongoose database to local server
mongoose.connect('mongodb://localhost:27017/report', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const app = express();
app.use(bodyParser.urlencoded({  extended: true }));
app.use(express.static("public"));


//Constructing Mongoose Schema//
const reportSchema = {

  userID: String,
  marketID: String,
  marketName: String,
  cmdtyID: String,
  marketType: String,
  cmdtyName: String,
  priceUnit: String,
  convFctr: Number,
  price: Number,
  reportID: String
}

//Construcitng Mongoose Model//
const Report = mongoose.model("Report", reportSchema);

//constructing mongoose schema for aggregate report
const aggregateReportSchema = {
  _id: String,
  cmdtyName: String,
  cmdtyID: String,
  marketID: String,
  marketName: String,
  users: Array,
  timestamp: Number,
  priceUnit: String,
  price: Number
}
//constructing mongoose model for aggregate report Schema
const AggregateReport = mongoose.model("AggregateReport", aggregateReportSchema);


//initialising chain routing
app.route("/reports")

  //posting report
  .post(function(req, res) {

    //initialising reportDetails document
    const reportDetails = new Report({

      userID: req.body.userID,
      marketID: req.body.marketID,
      marketName: req.body.marketName,
      cmdtyID: req.body.cmdtyID,
      marketType: req.body.marketType,
      cmdtyName: req.body.cmdtyName,
      priceUnit: req.body.priceUnit,
      convFctr: req.body.convFctr,
      price: req.body.price,
      reportID: ""
    });

    //assigning unique reportID to unique marketID-cmdtID pair
    Report.find({}, function(err, isEmpty) {
      if (!err) {
        //storing our first report and assgining reportID to it
        if (isEmpty.length === 0) {

          reportDetails.reportID = uuidv4();
          reportDetails.save(function(err) {
            if (!err) {
              res.send(" status : Success " + "\n reportID :" + reportDetails.reportID);
            } else
              res.send(err);
          });
        }
        //checking if marketID-cmdtID pair value already present then
        //there is no need to generate new unique id
        else {
          Report.find({
            marketID: req.body.marketID,
            cmdtyID: req.body.cmdtyID
          }, function(err, matchfound) {
            //if pair is unique ->> not present in reports database
            if (matchfound.length === 0) {
              reportDetails.reportID = uuidv4();

              reportDetails.save(function(err) {
                if (!err) {
                  res.send(" status : Success " + "\n reportID :" + reportDetails.reportID);
                } else
                  res.send(err);
              });
            } else {
              reportDetails.reportID = matchfound[0].reportID;
              reportDetails.save(function(err) {
                if (!err) {
                  res.send(" status : Success " + "\n reportID :" + reportDetails.reportID);
                } else
                  res.send(err);
              });
            }
          });
        }

      } else
        res.send(err);
    });
  })

  //getting aggregate report for given reportID
  .get(function(req, res) {

    Report.find({
      reportID: req.body.reportID
    }, function(err, foundReport) {

      if (!err) {
        //calculating the avergae price for aggregate report in Kg
        //for a particular reportID
        let usersArray = [];
        let sum = 0;
        for (let i = 0; i < foundReport.length; i++) {
          sum = sum + (foundReport[i].price / foundReport[i].convFctr);
          usersArray.push(foundReport[i].userID);
        }
        let aggregate_price = sum / foundReport.length;

        const aggReport = new AggregateReport({
          _id: foundReport[0].reportID,
          cmdtyName: foundReport[0].cmdtyName,
          cmdtyID: "VE-42",
          marketID: foundReport[0].marketID,
          marketName: foundReport[0].marketName,
          users: usersArray,
          timestamp: d.getTime(),
          priceUnit: "Kg",
          price: aggregate_price
        });

        aggReport.save(function(err) {
          if (!err) {
            res.send(aggReport);
          } else {
            res.send(err);
          }
        })
      } else
        res.send(err);

    });
  });


app.listen(3000, function() {
  console.log("Server is listeining at port 3000");
});
