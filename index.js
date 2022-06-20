const express = require("express");
const port = 3000;
const path = require("path");
const db = require("./data/utils/db.js");
const crypto = require("crypto");
const axios = require("axios").default;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.set("view engine","twig");
app.set("views", path.join(__dirname, "public" , "templates"))


app.listen(port, () => {
    console.log(`The server is running succesfully on the http://localhost:${port}. `);
});


// serving the static files
app.use(express.static(path.join(__dirname, "public")));


// serving the / route
app.get("/", (req, res) => {
    res.render("index",{
        err: true
    })
});
    

app.post("/api/login",(req,res)=>{
    //validation
    const userLogin=req.body;
    const dbUser=db.findUser(userLogin.email)
    if(dbUser===undefined){
        //send error to ui

    }
    else{
        const salt=dbUser.salt;
        const hash = crypto.pbkdf2Sync(userLogin.pass, salt, 1000, 64, `sha512`).toString(`hex`);
        if(hash===dbUser.hash){
            res.setHeader("user-id",dbUser.id)
            res.end()    
        }


    }
    
   
})

app.post("/api/signup",(req,res)=>{
    const person = req.body;
    if(person.pass === person.pass2){
        const user = db.findUser(person.email);
        if(user === undefined){
            // hashing process
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(person.pass, salt, 1000, 64, `sha512`).toString(`hex`);
            // inserting the user into user table
            db.insertUser(person.name,person.email,hash,salt);
            const user = db.findUser(person.email);
            console.log(user.id)
            res.setHeader("user-id",user.id)
            res.end()    
        }
        else{
            // err to ui about exists email
        }
    }
    else{
        // err to ui about not same
    }
    // validation
    

});
app.get("/workouts", (req, res) => {
    const userId = req.get("user-id");
    const allTrainings = db.selectTrainings().filter(training => training.userId !== userId);
    const users = db.selectUsers();
    const otherTrainings = [];
    
    res.render("pages/workouts",{
        users,
        allTrainings,
        otherTrainings
    })
});

app.get("/modify", (req, res) => {
    const userId = req.get("user-id");
    const userTrainings = db.selectUserTrainings(userId);

    res.render("pages/modify",{
        userTrainings
    })
});

app.post("/api/addtraining", (req, res) => {
    const userId = req.get("user-id");
    const training = req.body;
    db.insertTraining(userId,training.name,training.repeat,training.time,training.category);
    
    res.redirect("../modify")
});

app.put("/api/edittraining", (req, res) => {
    const training = req.body;
    const userTrainings = db.selectUserTrainings(training.id);

    res.redirect("../modify")
});

app.delete("/api/deletetraining", (req, res) => {
    const training = req.body;
    db.deleteTraining(training.id);

    res.redirect("../modify")
});

app.get("/api/trainings", (req, res) => {
    // let allTrainings = db.selectTrainings();
    // const users = db.selectUsers();
    // const usersName = users.map(user=> {user.id, user.name});
    // allTrainings = allTrainings.map(training=>{
    //     return training.userId = usersName.find(user=> user.id === training.userId).name
    // })
    let allTrainings = db.selectJoinedTables();
    res.json(allTrainings);

});


// serving not found urls
app.use((req, res) => {
    res.render("pages/notFound")
});
  