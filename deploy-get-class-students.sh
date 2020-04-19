cd get-class-students
gcloud functions deploy nutrition-get-class-students --entry-point getClassStudents --runtime nodejs8 --trigger-http --allow-unauthenticated
