# Express Jobly

This is the Express backend for the job board, Jobly.  
Created with the framework Express.js in the Node.js runtime.  
An API that connects to the frontend: https://github.com/clchen-arcadia/react-jobly  

Live Demo: https://express-jobly-cdxn.onrender.com  
For example: query the companies at: https://express-jobly-cdxn.onrender.com/companies  
It can also serve HTTP requests from a program like Insomnia.

To run locally:
1. Clone the repo
2. Install from package-lock.json
3. Create and seed the database in psql with the included .sql script
4. Run the local server:
```
    node server.js
```
5. To run the tests:
```
    jest -i
```
