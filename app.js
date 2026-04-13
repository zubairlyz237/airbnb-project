if(process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
console.log(process.env.SECRET);




const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session"); 
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const wrapAsync = require("./utils/wrapAsync.js");



const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");



const dbUrl = process.env.ATLASDB_URL;

// const dbUrl = mongo_URL;

main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    if (err) console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);    
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(methodOverride("_method")); 
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600, // time period in seconds
});

store.on("error", (e) => {
    console.log("SESSION STORE ERROR", e);
});


const sessionOptions = {
    store,   
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};


// app.get("/", (req, res) => {
//     res.send("hi server is working");
    
// });



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});


// app.get("/demouser", async (req, res) => {
//     try {
//         let fakeUser = new User({
//             email: "student@gmail.com",
//             username: "delta-student",
//         });

//         let registeredUser = await User.register(fakeUser, "helloworld");
//         res.send(registeredUser);
//     } catch (e) {
//         console.error('demouser error', e);
//         res.status(500).send(`Error: ${e.message}\n\n${e.stack}`);
//     }
// });


app.use("/listings/:id/reviews", reviewRouter);
app.use("/listings", listingRouter); 
app.use("/", userRouter);



app.use((req, res, next) => {
    next(new ExpressError(404, "page not found!"));
});

app.use((err, req, res, next) => {
    console.error("Error handler got error:", err);
    let { statusCode = 500, message = "something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { message });
    // res.status(statusCode).send(message);
});

const server = app.listen(8080, () => {
    console.log("server is listening to the port 8080");
});

process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION! Shutting down...");
    console.error(err);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! Shutting down...");
    console.error(err);
    process.exit(1);
});

process.on("SIGTERM", () => {
    console.log("SIGTERM RECEIVED. Shutting down gracefully");
    if (server) {
        server.close(() => {
            console.log("Process terminated!");
        });
    }
});