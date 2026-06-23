# 🌾 AgriTwin: AgriFin Digital Twin & Graph-Enabled Farming Assistant

**AgriTwin** is an interactive digital farm twin platform and voice-enabled farming assistant designed to empower African smallholder farmers with data-driven agronomic insights while providing financial institutions (AgriFin) with verifiable creditworthiness indicators.

---

## 📌 1. Problem Understanding & Target User
* **Target User**: African smallholder farmers managing diversified plots, and AgriFin institutions looking to de-risk agricultural lending.
* **The Pain Points**:
  1. **Agronomic Guesswork**: Farmers manage their fields uniformly due to a lack of localized expertise, leading to soil degradation, inefficient irrigation, and crop failures.
  2. **Financial Exclusion**: Traditional banks and micro-lenders lack visibility into farm health, historical yield potential, and risk indicators. Without a digital audit trail, smallholders are locked out of credit and insurance systems.

## 💡 2. Proposed Solution
AgriTwin resolves this with a dual-purpose digital system:
* **3D Digital Farm Twin**: A visual landscape built with **React Three Fiber** that maps real-time soil health, moisture levels, crop types, and automatically scales and loads photorealistic 3D `.glb` assets.
* **AI Advisor (GitHub Models / Ollama)**: Local or cloud-based LLM integration providing real-time, context-aware farming recommendations based on sensor telemetry.
* **Multilingual Audio/Visual Integration**: Leveraging **Azure AI** (Speech, Translator, Vision) to allow farmers to communicate in their native dialects (e.g., Swahili) and analyze crop health via image scanning.
* **AgriFin Audit Trail**: Farm logs, recommendation compliance, and sensor history are compiled to generate a "farm health score" for micro-lenders.

## 🛠️ 3. Technology Stack & Architecture
* **Frontend**: **Next.js 16 (TypeScript)** + **Tailwind CSS**.
* **3D View**: **React Three Fiber (Three.js)** for dynamic, interactive spatial visualization of crops and infrastructure.
* **Database**: **PostgreSQL** (via Prisma) for transactional data.
* **AI & NLP**: **GitHub Models** (GPT-4o), **Ollama** (Local Inference), and **Azure Cognitive Services** (Translation, Speech, Vision).
* **Python Backend**: **FastAPI** layer for specialized local processing.

---

## 🚀 4. Setup Guidelines

### 4.1 Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL Database
- [Ollama](https://ollama.com/) (Optional, for local AI)

### 4.2 Environment Configuration
Duplicate the `.env.example` file and rename it to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration variables in `.env.local`:
- **Database**: Add your PostgreSQL `DATABASE_URL`.
- **Authentication**: Generate a random string for `AUTH_SECRET`.
- **Azure AI Services**: Add your keys/endpoints for Azure Speech, Translator, and Vision.
- **GitHub Models**: Add your GitHub Personal Access Token (`GITHUB_TOKEN`) to use free inference models like `gpt-4o`.
- **Local AI (Ollama)**: Ensure Ollama is running and specify the model (e.g., `qwen2.5:0.5b`).

### 4.3 3D Model Assets Setup
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

### 4.4 Running the Application

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
