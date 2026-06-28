# 🌾 AgriTwin: AgriFin Digital Twin & Graph-Enabled Farming Assistant

**AgriTwin** is an interactive digital farm twin platform and voice-enabled farming assistant designed to empower African farmers—from smallholders to large-scale commercial operators—with data-driven agronomic insights while providing financial institutions (AgriFin) with verifiable creditworthiness indicators.

---

## 📌 1. The Problem: Inefficiencies and Farming in the Dark
Across Africa, millions of farmers—from smallholders to large-scale commercial operators—face critical inefficiencies. Smallholders often operate in the dark, relying on traditional guesswork rather than localized agronomic intelligence, leading to preventable crop failures and soil degradation. Meanwhile, large-scale farmers struggle with managing vast, complex operations without unified, real-time telemetry and data.

But the challenges extend beyond the farm gate. **Financial institutions (AgriFin lenders)** view smallholders as "high risk" because there is no visibility into their operations or market connections, locking them out of credit and insurance systems. For large-scale farms, securing transparent supply chains and optimizing market contracts remains a logistical nightmare. When harvest time comes, farmers of all scales often struggle to find reliable, verified buyers, leading to post-harvest losses and exploitation by middlemen.

## 💡 2. Our Solution: Illuminating Agriculture with AI & Graphs
**AgriTwin** bridges the gap between traditional farming and modern data science by creating a verifiable, interconnected ecosystem:

* **3D Digital Farm Twin**: We pull farmers out of the dark by giving them a visual, interactive 3D replica of their farm (built with React Three Fiber) that maps real-time soil moisture, crop health, and environmental telemetry.
* **Graph-Powered AI Advisor**: Our AI doesn't just guess; it reasons. By leveraging **Neo4j**, we've built a **Crop Knowledge Graph** that maps the relationships between specific crops, their vulnerabilities (diseases/pests), and targeted treatments. Powered by the **Featherless API** for high-performance open-source LLMs, the AI uses this graph to deliver hyper-contextual, verified agronomic advice. Additionally, our intelligent backend auto-generates knowledge graph data on the fly for any unknown crops, ensuring continuous learning and comprehensive coverage for every farmer.
* **Multilingual Inclusivity**: Using Azure AI (Speech, Translator) alongside powerful Vision models from **Featherless**, farmers interact with the app via voice and images in their native languages (e.g., Swahili), removing literacy barriers.
* **De-Risking via Market Matching & Supply Chain Graphs**: This is where agricultural finance changes entirely. We use **Neo4j** to build a **Supply Chain Graph** that mathematically maps farmers directly to distributors and verified buyers based on their crop type, scale, and volume. By securing off-take agreements and **market matching** before the crop is even harvested, we provide financial institutions with a verifiable "guaranteed revenue" metric. Lenders no longer need traditional collateral—the transparent farm audit trail combined with graph-matched buyer contracts serves as the ultimate de-risking tool, unlocking micro-loans and insurance.

## 🛠️ 3. Technology Stack & Architecture
* **Frontend**: **Next.js 16 (TypeScript)** + **Tailwind CSS**.
* **3D Visualization**: **React Three Fiber (Three.js)** for dynamic spatial representation of farm assets.
* **Relational Database**: **PostgreSQL** (via Prisma) for transactional user data and telemetry logs.
* **Graph Database (Neo4j)**: Powers the **Crop Knowledge Graph** (Crop -> Disease -> Treatment mapping) and the **Supply Chain Graph** (Market matching between Farmers -> Distributors -> Buyers).
* **AI & NLP**: **Featherless API** (Open-source LLMs & VLMs), **Ollama** (Local Inference), and **Azure Cognitive Services** (Translation, Speech).
* **Python Backend**: **FastAPI** layer for specialized processing and AI orchestrations.

---

## 🌟 4. Core Features Explained

1. **Main Dashboard (`/dashboard`)**: A central command center providing an overview of overall farm health, critical active alerts, task summaries, and live market prices.
2. **AI Advisor (`/advisor`)**: A multilingual, AI-powered farming assistant driven by **Featherless API** (e.g., Llama-3 70B), providing agronomic advice tailored to the farmer's specific needs, accessible via text or voice.
3. **3D Farm Digital Twin (`/farm`)**: A highly interactive 3D map visualizing the farm layout, infrastructure, crop types, and live sensor data like soil moisture levels.
4. **Crop Disease Scanning (`/scan`)**: A visual diagnostic tool leveraging Vision-Language Models via the Featherless API to identify crop diseases and pests directly from user-uploaded images.
5. **Market Hub (`/market`)**: Provides real-time agricultural market prices, trends, and facilitates connections to buyers, ensuring farmers get the best value for their produce.
6. **Crop Calendar (`/calendar`)**: A visual timeline for agricultural planning, allowing farmers to schedule planting, maintenance, and harvesting across seasons.
7. **Task Management (`/tasks`)**: A specialized tracker to log, assign, and monitor daily farm activities and operational progress.
8. **Weather & Agronomic Alerts (`/alerts`)**: Context-aware notifications that warn farmers about upcoming extreme weather events or agronomic risks.
9. **Team & Worker Management (`/team`)**: Tools to manage farm workers, track roles, and oversee labor assignments across different farm blocks.
10. **User Profile & Settings (`/profile`)**: Manage personal settings, notification preferences, and application localization (multi-language support).
11. **Graph Network & Traceability (`/network`)**: Visualizes the Neo4j-powered Crop Knowledge Graph (with intelligent AI auto-generation for new crops) and maps end-to-end supply chain traceability from farm to retailer.
12. **Authentication & Onboarding (`/login`, `/register`, `/onboarding`)**: Secure user authentication and a tailored onboarding flow to set up the initial farm profile.

---

## 🚀 5. Setup Guidelines

### 5.1 Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL Database
- [Ollama](https://ollama.com/) (Optional, for local AI)

### 5.2 Environment Configuration
Duplicate the `.env.example` file and rename it to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration variables in `.env.local`:
- **Database**: Add your PostgreSQL `DATABASE_URL`.
- **Authentication**: Generate a random string for `AUTH_SECRET`.
- **Azure AI Services**: Add your keys/endpoints for Azure Speech and Translator.
- **Featherless API**: Add your `FEATHERLESS_API_KEY` to run powerful open-source models (like Llama-3 and Qwen-VL).
- **Local AI (Ollama)**: Ensure Ollama is running and specify the model (e.g., `qwen2.5:0.5b`).

### 5.3 3D Model Assets Setup
AgriTwin features a completely dynamic 3D rendering engine. To achieve photorealism, download free `.glb` models (e.g., from [Poly Pizza](https://poly.pizza/) or [Kenney.nl](https://kenney.nl/)) and place them into the `public/models` directory:

```text
public/models/
  ├── greenhouse.glb   # For greenhouses/nurseries
  ├── storage.glb      # For silos/warehouses
  ├── barn.glb         # For barns/sheds
  ├── house.glb        # For main buildings
  ├── irrigation.glb   # For water towers/pumps
  ├── maize.glb        # For corn fields
  ├── tree.glb         # For orchards/coffee
  └── crop.glb         # Fallback for generic veggies
```
*Note: If a model file is missing, the engine will gracefully fall back to generic 3D geometry without crashing!*

### 5.4 Running the Application

**1. Install Frontend Dependencies**
```bash
npm install
```

**2. Setup the Database Schema**
```bash
npx prisma db push
```

**3. Setup the Python Backend**
Navigate to the `python_backend` folder and install dependencies:
```bash
cd python_backend
pip install -r requirements.txt
# Run the FastAPI server
python app.py
```

**4. Start the Next.js Frontend Server**
Open a new terminal and run:
```bash
npm run dev
```

Navigate to `http://localhost:3000` to interact with your Digital Twin!


@agritwin