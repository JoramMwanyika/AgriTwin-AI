import os
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

if __name__ == "__main__":
    # Example usage
    sample_text = "Maize is highly susceptible to Fall Armyworm. A common treatment is applying a Neem-based organic pesticide."
    print("Extracting relationships from sample text...")
    extracted_data = extract_knowledge(sample_text)
    print(json.dumps(extracted_data, indent=2))
