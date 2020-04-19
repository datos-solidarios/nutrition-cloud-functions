const moment = require('moment')
const nutritionCalculator = new (require('infant-nutrition-calculator'))('ES')
const cors = require('cors')({origin:true})
const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery();
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

exports.postStudent = (req, res) => {
  let userOwnedProjects = await getUserProjects(req)
  let projectId = req.body.projectId
  if(userOwnedProjects.includes(projectId)) {
    const options = {
      query: "INSERT INTO `malnutrition.dev.measurements` VALUES (FARM_FINGERPRINT(CONCAT(CAST(@project_id AS STRING), CAST(@name AS STRING))),@project_id,@name,@birthdate,@gender,@class)",
      location: 'US',
      params: {
        "project_id": projectId,
        "name": req.body.name,
        "birthdate": req.body.birthdate,
        "gender": req.body.gender,
        "class": req.body.class
      }
    };
      const [job] = await bigquery.createQueryJob(options);
      const [rows] = await job.getQueryResults();
    res.status(200).send(results);
  } else {
    res.status(403).send("Unauthorized")
  }

  let months = moment(moment(req.body.dateOfWeight, "MM-DD-YYYY"), 'months').diff(moment(req.body.dateOfBirth, "MM-DD-YYYY"), 'months');
  let weight = req.body.weight
  let height = req.body.height
  let gender = req.body.gender
  let message = nutritionCalculator.calculateNutrition(months, gender, weight, height)
  res.status(200).send(message);
};

///////////FIREBASE GET USER PROJECTS//////////////////
async function getUserProjects(req){
  let authToken = validateHeader(req)
  if(!authToken){
    res.status(403).send("Unauthorized")
  }
  let decodedToken = await decodeAuthToken(authToken)
  let userEmail = decodedToken.firebase.identities.email
  const options = {
      query: "SELECT * FROM `malnutrition.dev.users` WHERE email ='" + userEmail + "' LIMIT 1000"
    };
  const [job] = await bigquery.createQueryJob(options);
  const [rows] = await job.getQueryResults();
  return rows[0] ? rows[0].projects : null
}

function validateHeader(req){
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split('Bearer ')[1]
  }
}

function decodeAuthToken(authToken){
  return admin.auth().verifyIdToken(authToken).then(decodedToken => {
    return decodedToken
  })
}
