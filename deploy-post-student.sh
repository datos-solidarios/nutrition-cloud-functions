cd post-student
gcloud functions deploy post-student --entry-point postStudent --runtime nodejs8 --trigger-http --allow-unauthenticated
