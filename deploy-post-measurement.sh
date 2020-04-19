cd post-measurement
gcloud functions deploy nutrition-post-measurement --entry-point postMeasurement --runtime nodejs8 --trigger-http --allow-unauthenticated
