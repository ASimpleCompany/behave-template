// Import the dependencies for testing
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require( '../server');
const expect = chai.expect;
const assert = chai.assert;
// Configure chai
chai.use(chaiHttp);
chai.should();


describe("Users", () => {
    // Called once before each of the tests in this block.
    beforeEach(function() {
        date = new Date();
    });

    // Called after all of the tests in this block complete.
    after(function() {
        console.log("------------------------------------------ Done");
    });

    // Called once after each of the tests in this block.
    /*afterEach(function() {
        console.log("The date for that one was", date);
    });*/

    var access="";
    var testUserId=0;
    describe("LOGIN", () => {
        it("it should get access token", (done) => {
             chai.request(app)
                 .post('/api/v1/auth/login')
                 .send({
                    "username":"joshua",
                    "password":"12345678"})
                 .end((err, res) => {
                     res.should.have.status(200);
                     res.body.should.be.a('object');
                     access=res.body.access;
                     
                     done();
                  });
         });
    });

    describe("Users Functions /", () => {
        // Test to get all students record as array
        it("should get all users record", (done) => {
             chai.request(app)
                 .get('/api/v1/user')
                 .set('Authorization', 'Bearer ' + access)
                 .end((err, res) => {
                     
                     res.should.have.status(200);
                     res.body.should.be.a('array');
                     res.body.forEach(element => {
                         if(element.nombre_usuario==="testuser"){
                            testUserId=element.id;
                         }
                     });
                     assert.isAbove(testUserId, 0, 'Test User not found or does not exist');
                     done();
                  });
        });

        // detele Test User
        it("should delete test user", (done) => {
            chai.request(app)
                .delete('/api/v1/user/'+testUserId)
                .set('Authorization', 'Bearer ' + access)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                 });
        });


        // Create Test User
        it("should create test user", (done) => {
            chai.request(app)
                .post('/api/v1/user')
                .set('Authorization', 'Bearer ' + access)
                .send({
                    "nombre":"testuser",
                    "apellido":"testuser",
                    "nombre_usuario":"testuser",
                    "estado":1,
                    "contrasena":"12345678",
                    "rol":1
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                 });
        });
        
    });
});
