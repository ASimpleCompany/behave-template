const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


// Swagger set up
const options = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "Ica Planilla",
        version: "1.0.0",
        description:
          "Backend para proyecto de planilla",
        license: {
          name: "MIT",
          url: "https://choosealicense.com/licenses/mit/"
        }
      },
      servers: [
        {url: "http://localhost:5000"}
      ]
    },
    apis: ['./routes/*.js',
    './controllers/*.js',
    ]
  };
  
  const specs = swaggerJsdoc(options);
  module.exports = (app)=>{
    app.use("/api/v1/apidocs",swaggerUi.serve, swaggerUi.setup(specs));
  };