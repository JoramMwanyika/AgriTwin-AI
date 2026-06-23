# 🌾 AgriTwin: AgriFin Digital Twin & Graph-Enabled Farming Assistant

**AgriTwin** is an interactive digital farm twin platform and voice-enabled farming assistant designed to empower African smallholder farmers with data-driven agronomic insights while providing financial institutions (AgriFin) with verifiable creditworthiness indicators.

---

## 📌 1. Problem Understanding & Target User
* **Target User**: African smallholder farmers managing diversified plots, and AgriFin institutions looking to de-risk agricultural lending.
* **The Pain Points**:
  1. **Agronomic Guesswork**: Farmers manage their fields uniformly due to a lack of localized expertise, leading to soil degradation, inefficient irrigation, and crop failures.
  2. **Financial Exclusion**: Traditional banks and micro-lenders lack visibility into farm health, historical yield potential, and risk indicators. Without a digital audit trail, smallholders are locked out of credit and insurance systems.
* **Evidence & Relevance**: Regional agricultural data indicates over 80% of smallholder farming is un-digitized. AgriTwin addresses this by translating complex sensor readings into visual farm layouts and providing transparent data records to financial providers.

## 💡 2. Proposed Solution
AgriTwin resolves this with a dual-purpose digital system:
* **3D Digital Farm Twin**: A visual landscape built with **Three.js (React Three Fiber)** that maps real-time soil health, moisture levels, crop types, and growth progress.
* **Neo4j Knowledge Graph**: A graph database modeling botanical companion-planting rules, pest/disease vulnerabilities, and crop rotation schedules. This powers **GraphRAG (Retrieval-Augmented Generation)** to deliver highly contextual agronomic advice.
* **Voice-Enabled Assistant**: A FastAPI-based audio transcriber (Whisper & Azure AI) allowing farmers to query the advisor in local dialects (e.g., Swahili).
* **AgriFin Audit Trail**: Farm logs, recommendation compliance, and sensor history are compiled to generate a "farm health score" for micro-lenders.

## 🛠️ 3. Technology Stack & Data Architecture
* **Frontend/Core**: **Next.js 16 (TypeScript)** with **Tailwind CSS** for responsive design.
* **3D View**: **React Three Fiber (Three.js)** for dynamic, interactive spatial visualization.
* **Relational Database**: **Supabase (PostgreSQL)** for transactional data: User auth, payments (PayHero M-Pesa), and raw sensor telemetry.
* **Graph Database**: **Neo4j** for relationship modeling (e.g., companion crops, rotation logs, and GraphRAG knowledge base).
* **AI Backend**: **FastAPI (Python)** hosting Whisper transcription models, alongside Azure OpenAI / Ollama for advisory processing.

## 📅 4. Build Plan (Milestones & Timeline)
* **Milestone 1: Database Setup & Multi-DB Mapping** (Days 1–2)
  * Provision Supabase PostgreSQL and define schema tables using Prisma.
  * Launch Neo4j AuraDB instance and seed the agricultural knowledge graph (companion profiles, nutrient requirements, pest repellers).
* **Milestone 2: GraphRAG & Speech Processing API** (Days 3–4)
  * Set up FastAPI transcription endpoint (Whisper CPU/CUDA implementation).
  * Build the Next.js API query pipeline connecting user messages to Neo4j graph context and LLM response generators.
* **Milestone 3: Interactive 3D Farm Twin & Dashboard** (Days 5–6)
  * Integrate React Three Fiber Canvas with responsive floor grid.
  * Map PostgreSQL block coordinates to 3D meshes (Greenhouses, Silos, Crops).
  * Implement point-and-click events linking selected 3D plots to graph database queries.
* **Milestone 4: Credit Reporting & Validation** (Day 7)
  * Implement automatic credit audit logs summarizing recommendations followed and historical block performance.
  * Conduct end-to-end user path tests on local networks.

---

## 🚀 Integration Details

### Database Connection Configuration
Add credentials to your `.env.local` file:
```env
# Supabase (Postgres) URL
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# Neo4j Graph Database
NEO4J_URI="bolt+s://<your-neo4j-aura-db-uri>:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your-neo4j-password"
```

### Seeding the Graph (Cypher Example)
Initialize crop relationships in Neo4j to feed the advisor:
```cypher
CREATE (maize:Crop {name: "Maize", idealMoistureMin: 45, idealMoistureMax: 70})
CREATE (beans:Crop {name: "Beans", idealMoistureMin: 40, idealMoistureMax: 65})
CREATE (nitrogen:Nutrient {name: "Nitrogen"})

CREATE (beans)-[:COMPANION_OF]->(maize)
CREATE (beans)-[:FIXES]->(nitrogen)
```

### Next.js Client Setup (`lib/neo4j.ts`)
```typescript
import neo4j from 'neo4j-driver';

export const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(process.env.NEO4J_USERNAME || 'neo4j', process.env.NEO4J_PASSWORD || 'password')
);
```

---

## 🏃‍♂️ Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Setup Databases**:
   ```bash
   npx prisma db push
   ```
3. **Start the Application**:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` to view the 3D Digital Twin and consult the Voice Advisor.
