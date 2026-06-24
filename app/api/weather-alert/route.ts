import { type NextRequest, NextResponse } from "next/server";
import OpenAI from 'openai';

const featherless = new OpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: process.env.FEATHERLESS_API_KEY || "dummy_key_for_build", 
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weatherData, farmContext } = body;

    const completion = await featherless.chat.completions.create({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        { role: "system", content: "You turn raw weather data into a short 2-sentence actionable farming alert based on the farm context. Return only the message text." },
        { role: "user", content: `Weather: ${JSON.stringify(weatherData)}\nFarm Context: ${farmContext}` }
      ]
    });
    
    return NextResponse.json({ alert: completion.choices[0]?.message?.content || "No alert generated." });
  } catch (error) {
    console.error("Weather Alert Error:", error);
    return NextResponse.json({ error: "Failed to generate weather alert" }, { status: 500 });
  }
}
