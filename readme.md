# 🚦 SmartTraffic — Real-Time Traffic & Incident Reporting System

SmartTraffic is a full-stack web application I built to help citizens report road incidents (accidents, waterlogging, hazards, traffic jams) in real-time and alert traffic authorities instantly on an interactive live map.

---

 # Idea behind the project ?

Whenever an accident or road blockage happens, reporting it to authorities usually takes phone calls or waiting for someone else to report it. I wanted to build a simple, direct tool where:
1. A citizen can click on a map or use their phone's GPS to pinpoint the location.
2. Upload a quick photo of the scene.
3. Use Google Gemini AI to inspect the photo and estimate severity (to avoid fake/spam reports).
4. Alert authorities instantly via WebSockets without needing to refresh the page.

---

#  Main Features of the project

- **Interactive Map:** Built using Leaflet and OpenStreetMap. Users can click anywhere on the map to drop a pin and report an incident.
- **AI Verification:** Uses Google Gemini 2.5 Flash to analyze uploaded images, detect severity (Low, Medium, High, Critical), and give a quick summary.
- **Live Updates:** Uses Socket.io so new reports and status updates (Pending → Resolved) show up instantly on the map and sidebar.
- **Nearby Search:** MongoDB `2dsphere` geospatial indexing to query incidents near a specific location.
- **Authority Dashboard:** A sidebar list with one-click status updates to mark incidents as resolved.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Leaflet, React-Leaflet, Axios, Lucide Icons
- **Backend:** Node.js, Express.js, Socket.io, Multer
- **AI:** Google Gemini API (`@google/genai`)
- **Database:** MongoDB (Mongoose, GeoJSON)

---

## 🚀 How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/SanjeevPrasad10/SmartTraffic.git
cd SmartTraffic
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` folder:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_traffic
JWT_SECRET=mysecretkey123
GEMINI_API_KEY=your_gemini_api_key_here
```

Seed initial sample incidents and start the server:
```bash
node seed.js
npm run dev
```
Backend runs at `http://localhost:5000`.

### 3. Frontend Setup
Open a new terminal:
```bash
cd client
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 📁 Project Structure

```text
SmartTraffic/
├── client/              
│   ├── src/
│   │   ├── components/  
│   │   └── App.jsx      
├── server/              
│   ├── Controller/      
│   ├── Models/          
│   ├── services/        
│   └── server.js        
└── readme.md
```

---

## 📡 API Endpoints

- `GET /api/incidents` — Get all incidents (with status/severity filter)
- `GET /api/incidents/nearby?lat=...&lng=...` — Geospatial query for nearby incidents
- `POST /api/incidents` — Report an incident (multipart form data with photo)
- `PATCH /api/incidents/:id/status` — Update incident status (e.g. resolve)

---

## 👤 Author
**Sanjeev Prasad**
- GitHub: [@SanjeevPrasad10](https://github.com/SanjeevPrasad10)
