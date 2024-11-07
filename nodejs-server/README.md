# Introduction To Node.js
### Express.js
Create a simple API  for a book Directory
#### Requirements:
* Book title
* Author,
* Publisher
* Published date
* ISBN(international standard book number)

* ##### Managing Endpoints:
    - Use the built-in http module to manage different HTTP methods (GET, POST, PUT/PATCH, DELETE).
* ##### Handling Data Exchange:
    - Handle JSON data exchange
    - Implement functionality to parse and respond with JSON data.
* ##### Basic Error Handling:
    - Make sure you have validation.
* ##### Objective:
    - The objective of this project is to test trainees' understanding of 
        Express, HTTP methods and endpoint creation, and how to handle data sent to  endpoints.

##### Express - Node.js web application framework
   * expressjs.com 



   ```bash
        curl -X PUT 
        -H "Content-Type: application/json" 
        -d '{"title": "Updated Book Title", "author": "Updated Author"}' 
        http://localhost:8000/books/1