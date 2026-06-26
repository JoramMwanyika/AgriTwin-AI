import os
from dotenv import load_dotenv

# Load environment variables from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

import json
from openai import OpenAI

# Initialize the OpenAI client for Featherless API
client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=os.environ.get("FEATHERLESS_API_KEY", "")
)

def extract_knowledge(text_chunk: str):
    """
    Extracts agricultural relationships from a given text chunk using Featherless.
    Returns the data in structured JSON format suitable for Neo4j ingestion.
    """
    system_prompt = """
    Extract agricultural relationships from the text. 
    Output ONLY valid JSON in this exact format:
    {"relationships": [{"crop": "name", "disease": "name", "treatment": "name"}]}
    """
    
    try:
        response = client.chat.completions.create(
            model="Qwen/Qwen2.5-7B-Instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text_chunk}
            ],
            response_format={"type": "json_object"}
        )
        
        response_content = response.choices[0].message.content
        data = json.loads(response_content)
        return data
    except Exception as e:
        print(f"Error extracting knowledge: {e}")
        return None

def generate_crop_knowledge(crop_name: str):
    """
    Generates known diseases and treatments for a given crop using Featherless.
    Returns structured JSON for Neo4j.
    """
    system_prompt = f"""
    You are an expert agronomist. Generate exactly 2 common diseases or pests for the crop '{crop_name}' and their standard treatments.
    Output ONLY valid JSON in this exact format:
    {{
      "crop": "{crop_name}",
      "relationships": [
        {{
          "disease_name": "name of disease/pest",
          "disease_type": "type of disease (e.g. Pest, Virus, Fungus)",
          "treatment_name": "name of treatment",
          "treatment_method": "method (e.g. Chemical Spray, Cultural, Biological)"
        }}
      ]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="Qwen/Qwen2.5-7B-Instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate diseases and treatments for {crop_name}."}
            ],
            response_format={"type": "json_object"}
        )
        
        response_content = response.choices[0].message.content
        data = json.loads(response_content)
        return data
    except Exception as e:
        print(f"Error generating crop knowledge: {e}")
        return None

if __name__ == "__main__":
    # Example usage
    sample_text = "Maize is highly susceptible to Fall Armyworm. A common treatment is applying a Neem-based organic pesticide."
    print("Extracting relationships from sample text...")
    extracted_data = extract_knowledge(sample_text)
    print(json.dumps(extracted_data, indent=2))
    
    print("\nGenerating knowledge for missing crop: Dragonfruit...")
    generated_data = generate_crop_knowledge("Dragonfruit")
    print(json.dumps(generated_data, indent=2))
