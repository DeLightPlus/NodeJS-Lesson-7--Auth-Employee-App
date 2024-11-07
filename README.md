# NodeJS-Lesson-7-Auth-Employee-App

Activity 7 - Practice Set
Trainees are required to add a security layer to their already existing project created in the previous lesson. This will enhance the application they already have for the employee application.
Continuing on the ReactJS  Employee App and the above NodeJS functionality, integrate the following:
Features:
Re: Server side running on Node.js
Re: Client side running on React.js
A page for the super-admin to login using email and password
A page for the super-admin to add general-admins
Allow super-admin to have access to the main dashboard of all employees, including privileges of CRUD.
A page for the super-admin to remove admin rights from the general-admins
General-admin must require authorisation from the super-admin to delete and to update employee data.
A page for the logged in admin to view their profile details
Name and surname
Age
ID number
Photo
Role in company (by default main admin is sysadmin)
Persistence:
The firebase admin SDK should be used to persist data in between sessions and from different devices.
Firestore for data
Storage for files
Auth for manage user sessions
Testing:
Test the application thoroughly to ensure that all features work as expected