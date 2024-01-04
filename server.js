const express = require('express');
const app = express();
const config = require('./config')
const cors = require('cors')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = config.URI;

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const db = client.db('timesheetApp');
const userColl = db.collection('users');
const timesheetColl = db.collection('timesheet');

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await db.command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (err) {
        console.log(err)
    }
}
run().catch(console.dir);

//login
app.post('/login', async (req, res) => {
    try {
        const { username, userpass } = req.body;
        if (username && userpass) {
            const result = await userColl.findOne({ "username": username, "userpass": userpass });
            if (!result) return res.status(200).json({ status: false, message: 'User not found, kindly check or register if new.' })
            res.status(200).json({ status: true, message: 'Authentication Successful', user: result });
            return
        } else {
            res.status(200).json({ status: false, message: 'Please fill all the fields' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

// register
app.post('/register', async (req, res) => {
    try {

        const { username, userpass, usertype, mid } = req.body;

        if (username && userpass && usertype >= 0 && mid) {
            const result = await userColl.findOne({ "username": username, "usertype": usertype });
            if (result) return res.status(200).json({ status: false, message: 'User with this username already exists' })
            const registerUser = await userColl.insertOne({ "username": username, "userpass": userpass, "usertype": parseInt(usertype), "mid": mid })
            res.status(200).json({ status: true, message: 'Registeration Successful' });
            return
        } else {
            res.status(200).json({ status: false, message: 'Please fill all the fields' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
})


//get single timesheet data 
app.get('/timesheet/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const objectId = new ObjectId(id)
        const timesheet = await timesheetColl.findOne({ "_id": objectId });
        res.status(200).json({ status: true, message: 'timesheet data', timesheet: timesheet });
        return
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
})


//get manager data 
app.get('/managers', async (req, res) => {
    try {
        const managersGroup = await userColl.find({ "usertype": 1 });
        const managers = await managersGroup.toArray()
        res.status(200).json({ status: true, message: 'Managers data here', managers: managers });
        return
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
})


//get timesheet data 
app.get('/timesheets/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const timesheetGroup = await timesheetColl.find({ "username": username });
        const timesheets = await timesheetGroup.toArray()
        res.status(200).json({ status: true, message: 'timesheets data', timesheets: timesheets });
        return
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
})

//get subordinates timesheet data 
app.get('/subtimesheets/:manager', async (req, res) => {
    try {
        const { manager } = req.params;
        const timesheetGroup = await timesheetColl.find({ "manager": manager });
        const timesheets = await timesheetGroup.toArray()
        res.status(200).json({ status: true, message: 'timesheets data', timesheets: timesheets });
        return
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
})


// add timesheet
app.post('/timesheet', async (req, res) => {
    try {
        console.log(req.body)
        const { username, manager, date, fromTime, toTime, description } = req.body;

        if (username && manager && fromTime && toTime && date && description) {
            const result = await timesheetColl.findOne({ "username": username, "date": date });
            if (result) return res.status(200).json({ status: false, message: 'Timesheet already exists' })
            const addTimesheet = await timesheetColl.insertOne({ "username": username, "manager": manager, "date": date, "fromTime": fromTime, "toTime": toTime, "rating": 0, "description": description })
            const timesheetGroup = await timesheetColl.find({ "username": username });
            const timesheets = await timesheetGroup.toArray()
            res.status(200).json({ status: true, message: 'Timesheet added', timesheet: timesheets });
            return
        } else {
            res.status(200).json({ status: false, message: 'Please fill all the fields' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
})

// rate timesheet
app.put('/timesheet', async (req, res) => {
    try {

        const { id, rating } = req.body;
        const objectId = new ObjectId(id)
        if (rating > 0) {
            const result = await timesheetColl.findOne({ "_id": objectId });
            if (!result) return res.status(200).json({ status: false, message: "Timesheet doesn't exist" })
            const rateSheet = await timesheetColl.updateOne({ "_id": objectId }, { $set: { "rating": rating } })
            res.status(200).json({ status: true, message: 'Timesheet rated successfully' });
            return
        } else {
            res.status(200).json({ status: false, message: 'Please fill all the fields' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
})



app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`))