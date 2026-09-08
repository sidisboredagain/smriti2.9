\# Smriti AI Backend API



Base URL:



`http://127.0.0.1:8000`



\## Health



\### GET `/`



Returns the backend welcome message.



\### GET `/health`



Returns backend health status.



\---



\## Patients



\### POST `/patients/`



Create a patient.



Example:



```json

{

&#x20; "full\_name": "Test Patient",

&#x20; "age": 72,

&#x20; "language": "Hindi",

&#x20; "caregiver\_name": "Test Caregiver"

}

