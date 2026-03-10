import { GoogleGenAI, Type } from "@google/genai";
import { Message, Evaluation, PatientCase } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getPatientResponse(caseData: PatientCase, history: Message[]): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const response = await genAI.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: caseData.systemInstruction + "\n\nDATOS OCULTOS QUE SOLO REVELARÁS SI TE PREGUNTAN:\n" + JSON.stringify(caseData.hiddenData),
      temperature: 0.7,
    },
  });

  return response.text || "No tengo respuesta para eso...";
}

export async function evaluateInterview(caseData: PatientCase, transcript: Message[]): Promise<Evaluation> {
  const model = "gemini-3.1-pro-preview";
  
  const transcriptText = transcript.map(m => `${m.role === 'user' ? 'Estudiante' : 'Paciente'}: ${m.text}`).join('\n');
  
  const prompt = `
    Actúa como un docente experto en medicina clínica y evaluación por competencias.
    Evalúa la siguiente entrevista clínica realizada por un estudiante de medicina a un paciente virtual.
    
    CASO CLÍNICO:
    Nombre: ${caseData.name}
    Motivo: ${caseData.chiefComplaint}
    Datos Clave a identificar: ${JSON.stringify(caseData.hiddenData)}
    
    TRANSCRIPCIÓN DE LA ENTREVISTA:
    ${transcriptText}
    
    Proporciona una evaluación detallada en formato JSON siguiendo este esquema:
    {
      "score": número del 0 al 100,
      "metrics": {
        "empathy": número del 0 al 10,
        "logic": número del 0 al 10 (secuencia lógica),
        "clarity": número del 0 al 10 (lenguaje adecuado),
        "completeness": número del 0 al 10 (¿obtuvo los datos clave?)
      },
      "feedback": "comentario general formativo",
      "strengths": ["fortaleza 1", "fortaleza 2"],
      "weaknesses": ["debilidad 1", "debilidad 2"],
      "suggestedQuestions": ["pregunta que debió hacer 1", "pregunta que debió hacer 2"]
    }
  `;

  const response = await genAI.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          metrics: {
            type: Type.OBJECT,
            properties: {
              empathy: { type: Type.NUMBER },
              logic: { type: Type.NUMBER },
              clarity: { type: Type.NUMBER },
              completeness: { type: Type.NUMBER }
            }
          },
          feedback: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}") as Evaluation;
}
