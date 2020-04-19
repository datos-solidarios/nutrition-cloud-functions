const cors = require('cors')({origin:true})
const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery();
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

exports.getClassStudents = async (req, res) => {
  let userOwnedProjects = await getUserProjects(req)
  const options = {
      query: "SELECT * FROM `malnutrition.dev.students` WHERE class = @class AND project_id IN UNNEST(@projects) LIMIT 1000",
      params: {
        "class": req.body.class,
        "projects": userOwnedProjects
      }
    };
    const [job] = await bigquery.createQueryJob(options);
    const [rows] = await job.getQueryResults();
  res.status(200).send(rows);
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
