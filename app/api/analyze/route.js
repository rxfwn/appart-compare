import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { url, criteria } = await req.json();

    if (!url) {
      return Response.json({ error: "URL manquante" }, { status: 400 });
    }

    const apiKey = req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Clé API Gemini manquante. Renseignez-la dans les paramètres." }, { status: 400 });
    }

    // Fetch the page content
    let pageContent = "";
    try {
      const fetchRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(15000),
      });
      const html = await fetchRes.text();
      // Strip HTML tags for cleaner content
      pageContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);
    } catch (fetchErr) {
      pageContent = `Impossible de charger la page: ${fetchErr.message}. URL fournie: ${url}`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const criteriaList = criteria && criteria.length > 0 ? criteria : [
      "prix", "surface", "localisation", "nombre de pièces", "étage", "charges", "disponibilité", "points forts", "points faibles"
    ];

    const prompt = `Tu es un expert immobilier. Analyse cette annonce d'appartement et extrait les informations suivantes de manière précise.

URL de l'annonce: ${url}

Contenu de la page (peut être partiel ou incomplet):
${pageContent}

Critères à extraire: ${criteriaList.join(", ")}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de backticks) avec exactement cette structure:
{
  "title": "titre court de l'appartement (ex: T3 75m² Paris 11e)",
  "image": null,
  "criteria": {
    ${criteriaList.map(c => `"${c}": "valeur ou N/A si non trouvé"`).join(",\n    ")}
  },
  "score": 7,
  "summary": "résumé en 2 phrases maximum"
}

Le score est sur 10 basé sur le rapport qualité/prix et l'attractivité générale.
Si tu ne trouves pas une information, mets "N/A".
Réponds SEULEMENT avec le JSON, rien d'autre.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON response
    let parsed;
    try {
      // Remove potential markdown code blocks
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      return Response.json({ error: "Impossible de parser la réponse Gemini", raw: text }, { status: 500 });
    }

    return Response.json({ success: true, data: { ...parsed, url, id: Date.now() } });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
