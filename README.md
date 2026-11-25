# Grace Harbor Church — Full-Stack Web Project (Decode Labs Internship)

A responsive, contemporary single-page church website built with semantic **HTML5**, **CSS3**, vanilla **JavaScript**, **Node.js / Express**, and **MongoDB Atlas** (via Mongoose).

## Project Structure

```text
decode labs/
├── index.html                 # Main church website
├── admin.html                 # Church Office Dashboard (GET, PATCH, DELETE records)
├── server.js                  # Express server + static file host + API entry point
├── package.json               # Project metadata & npm scripts
├── .env.example               # Environment variable template
├── config/
│   └── db.js                  # MongoDB Atlas connection builder
├── middleware/
│   └── errorHandler.js        # ObjectId validator & Express error handler
├── models/
│   ├── Visit.js               # Mongoose schema for Sunday visit plans
│   ├── Message.js             # Mongoose schema for prayer requests & questions
│   └── EventRsvp.js           # Mongoose schema for event RSVPs
├── routes/
│   ├── visits.js              # GET, POST, PATCH, DELETE /api/visits
│   ├── messages.js            # GET, POST, PATCH, DELETE /api/messages
│   └── events.js              # GET, POST, DELETE /api/events/rsvps
├── css/
│   └── styles.css             # Contemporary white, deep-teal, and warm-amber theme
├── js/
│   ├── main.js                # Frontend interactivity + fetch() API calls
│   └── admin.js               # Office dashboard CRUD client
└── assets/
    └── images/
        ├── hero-church.jpg
        ├── community-group.jpg
        └── sermon-stage.jpg
```

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
4. Open `http://localhost:5000` for the main church website, and `http://localhost:5000/admin.html` for the **Church Office Dashboard**.

## API Endpoints

| Resource | Endpoints |
| :--- | :--- |
| Health Check | `GET /api/health` |
| Planned Visits | `GET /api/visits`, `GET /api/visits/:id`, `POST /api/visits`, `PATCH /api/visits/:id`, `DELETE /api/visits/:id` |
| Prayer & Questions | `GET /api/messages`, `POST /api/messages`, `PATCH /api/messages/:id`, `DELETE /api/messages/:id` |
| Event RSVPs | `GET /api/events/rsvps`, `POST /api/events/rsvps`, `DELETE /api/events/rsvps/:id` |

the admin page does not have any restrictions to enable access to supervisors 
