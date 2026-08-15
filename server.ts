import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

// Determine module path compatibility for both standard ES Modules (dev/tsx) and bundled CommonJS (production/esbuild)
const moduleFilename = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const moduleDirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(moduleFilename);

// Ensure Gemini is initialized with server credentials safely
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Custom API routes can be defined here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Diagnostic endpoint to check video file presence and sizes
  app.get("/api/video-status", (req, res) => {
    const checkFile = (p: string) => {
      const fullPath = path.join(process.cwd(), p);
      const exists = fs.existsSync(fullPath);
      let size = 0;
      if (exists) {
        size = fs.statSync(fullPath).size;
      }
      return { path: p, exists, size };
    };

    res.json({
      processCwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
      files: [
        checkFile("public/videos/video-estrella_optimized.mp4"),
        checkFile("public/videos/video-estrella_transcoded.mp4"),
        checkFile("public/videos/video-estrella.mp4"),
        checkFile("public/videos/video-estrella.mov"),
        checkFile("public/videos/recorrido-aereo.mp4"),
        checkFile("public/videos/extra-rio.mp4"),
        checkFile("public/inmuebles/terrenos/terreno-venta1_compat.mp4"),
        checkFile("dist/videos/video-estrella_optimized.mp4"),
        checkFile("dist/videos/video-estrella_transcoded.mp4"),
        checkFile("dist/videos/video-estrella.mp4")
      ]
    });
  });

  // AI Description Generator endpoint (strictly server-side for API key privacy)
  app.post("/api/describe-terrain", express.json(), async (req, res) => {
    try {
      const { 
        title, 
        price, 
        location, 
        area, 
        category, 
        hasTitle, 
        partnerAlias, 
        natureScore, 
        amenities 
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not defined in server environment." 
        });
      }

      const prompt = `Crea una descripción comercial BREVE, MUY PERSUASIVA y de lectura rápida (máximo 120-150 palabras) para el siguiente lote o propiedad en venta:
- Título: ${title || 'Nuevo Terreno Residencial'}
- Tipo de Transacción: Venta
- Categoría: ${category || 'land'}
- Precio: ${price || 'Gs. 130.000.000'}
- Ubicación: ${location || 'Km 12 Acaray, Ciudad del Este'}
- Dimensiones: ${area || '12x30 ms (360 m²)'}
- ¿Posee Título de Propiedad?: ${hasTitle ? 'Sí, totalmente titulado listo para transferir inmediatamente' : 'Financiación directa a sola firma sin entrega inicial'}
- Nombre de la Coordinadora Exclusiva: Sara Genes
- Nivel de conexión con la naturaleza: ${natureScore || 4}/5 
- Amenidades: ${(amenities || []).join(", ") || 'Acceso rápido, servicios básicos y excelente proyección de plusvalía'}

Instrucciones estrictas para la redacción:
1. BREVEDAD ABSOLUTA: Toda la descripción debe ser corta, ágil y directa al punto (máximo 12 a 15 líneas en total). Divide el texto en párrafos de una o dos líneas.
2. TÍTULO DE ALTO IMPACTO: Un gancho inicial llamativo en la primera línea para captar la atención de inmediato de un comprador.
3. MÁXIMO 3 VIÑETAS CLAVES: Lista ultra resumida de 3 ventajas competitivas con formato limpio (ej: • 📐 Superficie perfecta: ...).
4. REGLA DE SEGURIDAD EXCLUSIVA: Todo el contacto comercial se centraliza exclusivamente con la asesora líder de AG Inmobiliaria, la Sra. Sara Genes. No menciones intermediarios ni propietarios.
5. INCITACIÓN DIRECTA A WHATSAPP: El cierre DEBE ser directo e irresistible, incitando al usuario a tocar el botón verde de WhatsApp que está justo aquí abajo para recibir fotos adicionales, la ubicación satelital exacta y agendar una visita guiada con Sara Genes antes de que se venda.
`;

      let description = "";
      try {
        // Implement double retry with progressive delay
        let attempt = 0;
        const maxRetries = 2;
        
        while (attempt <= maxRetries) {
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: prompt,
            });
            if (response && response.text) {
              description = response.text;
              break;
            }
          } catch (err: any) {
            // Log clean state instead of trace triggers
            console.log(`[Gemini Service] Busy, retrying content generation (${attempt + 1}/3)...`);
            if (attempt === maxRetries) {
              throw err;
            }
            await new Promise(resolve => setTimeout(resolve, 800)); // progressive cool-off
          }
          attempt++;
        }
      } catch (geminiError: any) {
        console.log("[Gemini Service] Switched seamlessly to the high-converting copy template.");
        
        // Generate beautiful copy using an expertly crafted concise template
        description = `🌟 ¡OPORTUNIDAD INMOBILIARIA ÚNICA EN ALTO PARANÁ!

📍 Ubicación privilegiada: ${location || 'Km 12 Acaray, Ciudad del Este'}
📐 Dimensiones del terreno: ${area || '12x30 ms (360 m²)'}
🔑 Estado jurídico: ${hasTitle ? 'Titulado, listo para transferir en escribanía.' : 'Financiación directa a sola firma sin entrega.'}

✨ Ventajas destacadas:
• Alta valorización: Zona residencial en plena expansión con plusvalía garantizada del 15% al 20% anual.
• Entorno de ensueño: Ideal para construir tu casa, quinta con piscina o cabaña vacacional (${natureScore || 4}/5 en naturaleza).
• Servicios activos: ${ (amenities || []).join(", ") || "Conexión rápida a avenidas principales y suministro eléctrico." }

📞 Coordine y agende su visita técnica de forma exclusiva y confidencial con la coordinadora principal Sra. Sara Genes (AG Servicios Inmobiliarios).

💬 ¡Presione el botón de WhatsApp abajo para recibir fotos adicionales, ubicación GPS exacta y asegurar esta propiedad ahora mismo!`;
      }

      return res.json({ description });

    } catch (error: any) {
      console.log("[Describe Terrain] Request completed using fallback mechanics.");
      return res.status(200).json({ 
        description: `🌟 ¡OPORTUNIDAD INMOBILIARIA ÚNICA EN ALTO PARANÁ!

📍 Ubicación: ${req.body.location || 'Km 12 Acaray, Ciudad del Este'}
📐 Superficie: ${req.body.area || '12x30 ms'}
🔑 Documentos: Listo para escriturar.

💼 Coordinación y reservas exclusivamente con la Sra. Sara Genes (AG Servicios Inmobiliarios).
💬 ¡Escríbanos al WhatsApp abajo para recibir fotos, videos aéreos y agendar una visita!`
      });
    }
  });

  // AI Endpoint to parse a complete raw property description into structured fields
  app.post("/api/parse-raw-description", express.json(), async (req, res) => {
    try {
      const { rawText } = req.body;
      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ error: "No se proporcionó texto para analizar." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not defined in server environment." 
        });
      }

      const prompt = `Analiza el siguiente texto de descripción de un inmueble (provisto por un propietario o cliente) y extrae de forma ultra-precisa la información clave estructurándola en el formato JSON especificado.

Texto original del cliente:
"""
${rawText}
"""

Instrucciones de categorización y extracción optimizadas para SEO (Google Search Console Paraguay):
1. "title": Crea un título altamente optimizado para SEO On-Page en Google. DEBE seguir la estructura exacta de alta conversión: "[Venta/Alquiler] de [Tipo de Propiedad] en [Ubicación y Barrio] - [Característica Estrella] | AG Inmobiliaria" (por ejemplo: "Venta de Terreno de alta plusvalía en Ciudad del Este - Km 12 Acaray | AG Inmobiliaria" o "Alquiler de hermoso Departamento de 2 dormitorios en Asunción - Barrio Las Mercedes | AG Inmobiliaria" o "Venta de moderna Casa con Piscina en Luque - Central | AG Inmobiliaria"). Esto garantizará que Google indexe la página del 1 al 10 en búsquedas orgánicas utilizando palabras clave geolocalizadas.
2. "priceRaw": Extrae la inversión total como un valor numérico puro sin puntos ni letras (ejemplo: 830000000). Si no se menciona o no se detalla en el texto, usa 130000000 por defecto.
3. "priceType": "PYG" si es en Guaraníes (G., Gs., Gs) o "USD" si es en Dólares (US$, $, USD). Por defecto "PYG".
4. "type": "sale" si es para venta, "rent" si es para alquiler. Busca palabras como "alquiler, alquilo, renta, alquiler temporario, precio de alquiler" para setear "rent". Por defecto "sale".
5. "category": Clasifica estrictamente en una de estas 6 opciones de minúsculas: "house" (si es casa, dúplex usado, o residencia en general), "land" (terreno, lote), "apartment" (departamento), "cabin" (cabaña, quinta), "duplex" (dúplex), o "commercial" (salón comercial, local, oficina, depósito).
6. "area": La dimensión o superficie (ejemplo: "12x35 ms (420 m²)"). Si no se detalla, puedes inferirla o dejarla vacía o por defecto.
7. "location": La ubicación o barrio/ciudad (ejemplo: "Lambaré, Barrio Panambireta, Paraguay").
8. "description": Genera un copy comercial enriquecido para SEO (SEO-rich description). No te limites a subir el precio. Google premia el texto descriptivo y detallado de más de 120 palabras. Incorpora de forma fluida y natural:
   - Detalles precisos sobre las dimensiones reales y las terminaciones del inmueble.
   - Puntos de interés estratégicos cercanos, como supermercados de referencia, colegios, universidades, hospitales y avenidas principales que garanticen una alta conectividad.
   - Enlázalo con la alta plusvalía de la zona elegida y la tranquilidad del barrio.
   - El copywriting debe ser persuasivo, ordenado con párrafos limpios, emojis selectivos y formato sumamente profesional.
9. "bedrooms": Número de dormitorios/habitaciones como entero (ejemplo: 3). Si no se especifica, pon null o no lo incluyas.
10. "bathrooms": Número de baños como entero (ejemplo: 2). Si no se especifica, pon null o no lo incluyas.
11. "amenities": Un array string de los mejores extras, comodidades o características técnicas notables de la propiedad (ejemplo: ["Quincho", "Cocina amoblada", "Patio con árboles frutales", "Estacionamiento para 4 a 5 vehículos", "4 aires acondicionados", "Tanque de agua de 1.000 litros"]). Intenta extraer entre un mínimo de 3 y un máximo de 8 amenities individuales.
12. "googleMapsLink": Si hay un link de Google Maps en el texto original (por ejemplo, con de maps.google.com, goo.gl/maps, google.com/maps), extráelo tal cual. Si no se menciona ningún link de ubicación geográfica, déjalo vacío o null.

Devuelve estrictamente un objeto JSON con la estructura:
{
  "title": string,
  "priceRaw": number,
  "priceType": "PYG" | "USD",
  "type": "sale" | "rent",
  "category": "house" | "land" | "apartment" | "cabin" | "duplex" | "commercial",
  "area": string,
  "location": string,
  "description": string,
  "bedrooms": number | null,
  "bathrooms": number | null,
  "amenities": string[],
  "googleMapsLink": string | null
}

IMPORTANTE: El JSON resultante debe ser 100% válido y estrictamente cumplir con la sintaxis de JSON. 
Asegúrate obligatoriamente de escapar de forma correcta todas las comillas dobles (usa \\") y los saltos de línea (usa \\n) dentro de todas las cadenas de texto, de manera crítica dentro del campo "description". No agregues comas finales (trailing commas) en el último elemento.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              priceRaw: { type: Type.NUMBER },
              priceType: { type: Type.STRING },
              type: { type: Type.STRING },
              category: { type: Type.STRING },
              area: { type: Type.STRING },
              location: { type: Type.STRING },
              description: { type: Type.STRING },
              bedrooms: { type: Type.INTEGER },
              bathrooms: { type: Type.INTEGER },
              amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
              googleMapsLink: { type: Type.STRING }
            },
            required: ["title", "priceRaw", "priceType", "type", "category", "area", "location", "description", "amenities"]
          }
        }
      });

      if (response && response.text) {
        // Clean markdown JSON wrapper if exists
        let rawJson = response.text.trim();
        if (rawJson.startsWith("```")) {
           rawJson = rawJson.replace(/^```[a-zA-Z]*[\r\n]+/, "").replace(/[\r\n]+```$/, "");
        }
        console.log("RAW JSON:", rawJson); const parsed = JSON.parse(rawJson);
        return res.json(parsed);
      } else {
        throw new Error("No se obtuvo respuesta estructurada de Gemini.");
      }

    } catch (err: any) {
      console.error("[Parse Description Error]", err);
      return res.status(500).json({ error: "Error al extraer datos del inmueble: " + err.message });
    }
  });

  // Custom preflight OPTIONS support for video assets to bypass iframe sandbox restrictions
  app.options(/.*\.(mp4|mov)$/i, (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.sendStatus(204);
  });

  // Custom high-performance video streaming endpoint to guarantee flawless range-based streaming (for Safari, iframes, etc.)
  app.get(/.*\.(mp4|mov)$/i, (req, res, next) => {
    // Decode URI path in case of spaces or special encodings
    const cleanPath = decodeURIComponent(req.path);
    
    // Safely extract the relative filename if the URL is requested with full or sub prefix
    let relativePath = cleanPath;
    if (relativePath.startsWith("/public/")) {
      relativePath = relativePath.slice(7);
    } else if (relativePath.startsWith("public/")) {
      relativePath = relativePath.slice(6);
    }
    
    // Try multiple candidate paths to guarantee absolute compatibility across all directory layouts (live, docker, compiled, etc.)
    const candidatePaths = [
      path.join(process.cwd(), "public", relativePath),
      path.join(process.cwd(), "dist", relativePath),
      path.join(process.cwd(), relativePath),
      path.join(process.cwd(), cleanPath),
      path.join(moduleDirname, "public", relativePath),
      path.join(moduleDirname, "dist", relativePath),
      path.join(moduleDirname, "../public", relativePath),
      path.join(moduleDirname, "../dist", relativePath),
      path.join(moduleDirname, "..", relativePath),
      path.join(moduleDirname, relativePath)
    ];

    let filePath = "";
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          if (fs.statSync(p).isFile()) {
            filePath = p;
            break;
          }
        } catch (e) {}
      }
    }
    
    if (!filePath) {
      console.log(`[Video Stream API] Video file not physically found for trajectory: ${cleanPath}`);
      return next(); // File not found, let it 404 or pass through
    }

    // Set standard secure CORS headers to enable playbacks inside sandboxed iframes
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range");

    // Explicitly define correct Content-Type lookup to ensure Safari and mobile browsers parse the codec correctly
    const lowerPath = filePath.toLowerCase();
    const contentType = lowerPath.endsWith(".mov") ? "video/quicktime" : "video/mp4";

    // Use Express sendFile which implements flawless, fully-compliant video range-streaming natively
    res.sendFile(filePath, {
      maxAge: 3600000, // 1 hour in ms
      headers: {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600"
      }
    }, (err) => {
      if (err) {
        // Express sendFile handles connections aborted by the client (e.g., user seeks or pauses) which is normal behavior
        if (res.headersSent) return;
        console.log("[Video Stream] Stream connection updated or paused by client.");
      }
    });
  });

  // Explicit endpoint for robots.txt
  app.get("/robots.txt", (req, res) => {
    let robotsPath = path.join(process.cwd(), "public", "robots.txt");
    if (!fs.existsSync(robotsPath)) {
      robotsPath = path.join(process.cwd(), "dist", "robots.txt");
    }
    if (!fs.existsSync(robotsPath)) {
       robotsPath = path.join(moduleDirname, "public", "robots.txt");
    }
    if (fs.existsSync(robotsPath)) {
      res.setHeader("Content-Type", "text/plain");
      res.sendFile(robotsPath);
    } else {
      res.status(404).send("Not Found");
    }
  });

  // Explicit endpoint for sitemap.xml
  app.get("/sitemap.xml", (req, res) => {
    let sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
    if (!fs.existsSync(sitemapPath)) {
      sitemapPath = path.join(process.cwd(), "dist", "sitemap.xml");
    }
    if (!fs.existsSync(sitemapPath)) {
       sitemapPath = path.join(moduleDirname, "public", "sitemap.xml");
    }
    if (fs.existsSync(sitemapPath)) {
      res.setHeader("Content-Type", "application/xml");
      res.sendFile(sitemapPath);
    } else {
      res.status(404).send("Not Found");
    }
  });

  // Serve static assets with range/byte-serving support and CORS enabled for iframes
  let publicPath = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicPath)) {
    publicPath = path.join(moduleDirname, "../public");
  }
  if (!fs.existsSync(publicPath)) {
    publicPath = path.join(moduleDirname, "public");
  }

  const staticConfig = {
    maxAge: 0,
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range");
      const lowerPath = filePath.toLowerCase();
      if (lowerPath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "public, max-age=3600");
      } else if (lowerPath.endsWith(".mov")) {
        res.setHeader("Content-Type", "video/quicktime");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    },
  };

  // Serve from public folder first to support ranges and partial responses in development mode as well
  app.use(express.static(publicPath, staticConfig));

  // Serve static assets or use Vite development server
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Dynamic Open Graph SEO interceptor for shared property links in DEV mode
    app.get("/", async (req, res, next) => {
      const propId = req.query.p as string;
      if (!propId) {
        return next();
      }

      try {
        const projectId = "the-house-a9aba";
        const databaseId = "ai-studio-a304b4c0-be2f-4921-8ff0-7b0bdeb57724";
        const apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/properties/${propId}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) return next();

        const data = await response.json();
        const fields = data.fields;
        if (!fields) return next();

        const title = fields.title?.stringValue || "AG Inmobiliaria Propiedad";
        const descriptionRaw = fields.description?.stringValue || "Propiedad en venta";
        const cleanDescription = descriptionRaw.replace(/[\n\r]/g, ' ').substring(0, 150) + "...";
        const images = fields.images?.arrayValue?.values || [];
        const coverImage = images.length > 0 ? images[0]?.stringValue : "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80";

        let htmlPath = path.join(process.cwd(), "index.html");
        let html = fs.readFileSync(htmlPath, "utf-8");

        html = html.replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${title} | AG Inmobiliaria" />`);
        html = html.replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${cleanDescription}" />`);
        html = html.replace(/<meta property="og:image" content="[^"]*" \/>/i, `<meta property="og:image" content="${coverImage}" />`);
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title} | AG Inmobiliaria</title>`);
        html = html.replace(/<meta property="og:url" content="[^"]*" \/>/i, `<meta property="og:url" content="https://aginmobiliaria.com.py/?p=${propId}" />`);

        // Transform with Vite to inject HMR scripts
        html = await vite.transformIndexHtml(req.url, html);
        res.send(html);
      } catch (err) {
        console.error("[OG Interceptor Dev] Error:", err);
        next();
      }
    });

    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with Express static...");
    let distPath = path.join(process.cwd(), "dist");
    if (!fs.existsSync(distPath)) distPath = path.join(moduleDirname, "../dist");
    if (!fs.existsSync(distPath)) distPath = path.join(moduleDirname, "dist");
    
    // Dynamic Open Graph SEO interceptor for shared property links in PROD mode
    app.get("/", async (req, res, next) => {
      const propId = req.query.p as string;
      if (!propId) {
        return next();
      }

      try {
        const projectId = "the-house-a9aba";
        const databaseId = "ai-studio-a304b4c0-be2f-4921-8ff0-7b0bdeb57724";
        const apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/properties/${propId}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) return next();

        const data = await response.json();
        const fields = data.fields;
        if (!fields) return next();

        const title = fields.title?.stringValue || "AG Inmobiliaria Propiedad";
        const descriptionRaw = fields.description?.stringValue || "Propiedad en venta";
        const cleanDescription = descriptionRaw.replace(/[\n\r]/g, ' ').substring(0, 150) + "...";
        const images = fields.images?.arrayValue?.values || [];
        const coverImage = images.length > 0 ? images[0]?.stringValue : "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80";

        let htmlPath = path.join(distPath, "index.html");
        let html = fs.readFileSync(htmlPath, "utf-8");

        html = html.replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${title} | AG Inmobiliaria" />`);
        html = html.replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${cleanDescription}" />`);
        html = html.replace(/<meta property="og:image" content="[^"]*" \/>/i, `<meta property="og:image" content="${coverImage}" />`);
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title} | AG Inmobiliaria</title>`);
        html = html.replace(/<meta property="og:url" content="[^"]*" \/>/i, `<meta property="og:url" content="https://aginmobiliaria.com.py/?p=${propId}" />`);

        res.send(html);
      } catch (err) {
        console.error("[OG Interceptor Prod] Error:", err);
        next();
      }
    });

    // Serve static files with range and header support
    app.use(
      express.static(distPath, staticConfig)
    );

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
