from fastapi import FastAPI, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import os
from dotenv import load_dotenv

# Load environment variables from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

import tempfile
import uvicorn
import asyncio
import random
import json
import base64
from openai import OpenAI

app = FastAPI()

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=os.environ.get("FEATHERLESS_API_KEY")
)

# Allow Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSockets for Market Data ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        # We need to iterate over a copy of the list to handle disconnections gracefully
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

market_data = [
    {"id": 1, "crop": "Maize (90kg)", "price": 4500, "change": 120, "location": "Nairobi", "trend": "up"},
    {"id": 2, "crop": "Beans (90kg)", "price": 8200, "change": -50, "location": "Mombasa", "trend": "down"},
    {"id": 3, "crop": "Potatoes (50kg)", "price": 3500, "change": 200, "location": "Nakuru", "trend": "up"},
    {"id": 4, "crop": "Tomatoes (crate)", "price": 6000, "change": 500, "location": "Eldoret", "trend": "up"},
    {"id": 5, "crop": "Onions (net)", "price": 1200, "change": -100, "location": "Kisumu", "trend": "down"},
    {"id": 6, "crop": "Avocado (kg)", "price": 80, "change": 5, "location": "Meru", "trend": "up"},
]

async def simulate_market_updates():
    """Background task to simulate scraping and market price updates"""
    while True:
        await asyncio.sleep(5)  # Update every 5 seconds
        if not manager.active_connections:
            continue
            
        # Randomly adjust 1 to 3 items
        num_updates = random.randint(1, 3)
        indices_to_update = random.sample(range(len(market_data)), num_updates)
        
        for idx in indices_to_update:
            item = market_data[idx]
            # Fluctuate price by up to 5%
            fluctuation_percent = random.uniform(-0.05, 0.05)
            change_amount = int(item["price"] * fluctuation_percent)
            
            # Make sure it's not a 0 change if we selected it
            if change_amount == 0:
                change_amount = 1 if random.choice([True, False]) else -1
                
            item["price"] = max(1, item["price"] + change_amount)
            item["change"] = change_amount
            item["trend"] = "up" if change_amount > 0 else "down"
            
        await manager.broadcast(json.dumps(market_data))

@app.on_event("startup")
async def startup_event():
    # Start the background task when the application starts
    asyncio.create_task(simulate_market_updates())

@app.websocket("/ws/market")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial data immediately
        await websocket.send_text(json.dumps(market_data))
        while True:
            # We just need to keep the connection open to receive disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- Whisper AI Transcription ---

print("Loading Whisper model...")
# Using "base" for faster execution, but "small" is more accurate.
# Can use device="cuda" if Nvidia GPU is available.
model = WhisperModel("base", device="cpu", compute_type="int8")
print("Whisper model loaded!")

# Whisper expects standard 2-letter language codes for most languages
def map_language_code(frontend_code: str) -> str:
    # Handle specific overrides where frontend code doesn't match whisper exactly
    mapping = {
        "kik": "sw",  # Kikuyu: closest Whisper support via Swahili
        "ki": "sw",
        "luo": "sw",  # Luo: closest via Swahili
        "rw": "sn",   # Kinyarwanda -> Shona (closest native code)
    }
    if frontend_code in mapping:
        return mapping[frontend_code]
    
    # Whisper usually uses 2-letter ISO codes
    return frontend_code[:2]

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = Form("en")):
    print(f"Received audio for transcription. Requested language: {language}")
    
    # Save uploaded file to temp file
    suffix = ".webm"
    if audio.filename and "." in audio.filename:
        suffix = "." + audio.filename.rsplit(".", 1)[-1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
        content = await audio.read()
        if not content:
            return {"text": ""}
        temp_audio.write(content)
        temp_audio_path = temp_audio.name
    
    try:
        lang_code = map_language_code(language)
        
        try:
            print(f"Transcribing using language: {lang_code}")
            segments, info = model.transcribe(temp_audio_path, language=lang_code)
        except ValueError:
            print(f"Language {lang_code} not explicitly supported by Whisper. Falling back to auto-detect.")
            segments, info = model.transcribe(temp_audio_path)
            
        transcribed_text = " ".join([segment.text for segment in segments])
        print(f"Transcription complete: {transcribed_text}")
        
        return {"text": transcribed_text.strip()}
    finally:
        os.remove(temp_audio_path)

@app.post("/api/scan")
async def scan_crop(file: UploadFile = File(...)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    
    try:
        response = client.chat.completions.create(
            model="Qwen/Qwen-VL-Chat", 
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Identify any diseases on this crop leaf and recommend treatments."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ]
        )
        return {"diagnosis": response.choices[0].message.content}
    except Exception as e:
        print(f"Featherless VLM Error: {e}")
        return {"error": "Failed to analyze image", "details": str(e)}

from extract_knowledge import generate_crop_knowledge
from pydantic import BaseModel

class CropRequest(BaseModel):
    crop_name: str

@app.post("/api/extract-crop-knowledge")
async def extract_crop_knowledge_endpoint(request: CropRequest):
    data = generate_crop_knowledge(request.crop_name)
    if data:
        return data
    else:
        return {"error": "Failed to generate crop knowledge"}

if __name__ == "__main__":

    uvicorn.run(app, host="0.0.0.0", port=8000)
