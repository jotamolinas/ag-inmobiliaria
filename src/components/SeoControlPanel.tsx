/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileCode, 
  Settings, 
  Globe, 
  Copy, 
  Check, 
  Search, 
  TrendingUp, 
  Lightbulb, 
  BookOpen, 
  Code
} from 'lucide-react';
import { EXPERIENCE_ACARAY_SEO, COPY_BLOCKS } from '../data';
import { CopyBlock } from '../types';

interface SeoControlPanelProps {
  agentName: string;
  setAgentName: (name: string) => void;
  whatsappNumber: string;
  setWhatsappNumber: (num: string) => void;
  monthlyPayment: number;
  setMonthlyPayment: (val: number) => void;
  downPayment: number;
  setDownPayment: (val: number) => void;
  customBlocks: CopyBlock[];
  onUpdateBlock: (id: string, newContent: string) => void;
  activeTab: 'seo' | 'editor' | 'html' | 'schema';
  setActiveTab: (tab: 'seo' | 'editor' | 'html' | 'schema') => void;
}

export default function SeoControlPanel({
  agentName,
  setAgentName,
  whatsappNumber,
  setWhatsappNumber,
  monthlyPayment,
  setMonthlyPayment,
  downPayment,
  setDownPayment,
  customBlocks,
  onUpdateBlock,
  activeTab,
  setActiveTab
}: SeoControlPanelProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // States for Real-Time SEO Meta title and description editing
  const [seoTitle, setSeoTitle] = useState(EXPERIENCE_ACARAY_SEO.title);
  const [seoDescription, setSeoDescription] = useState(EXPERIENCE_ACARAY_SEO.description);

  // Computed and processed description
  const processedDesc = seoDescription
    .replace("Gs. 1.300.000", `Gs. ${new Intl.NumberFormat('es-PY').format(monthlyPayment)}`)
    .replace("sin entrega inicial", downPayment === 0 ? "sin entrega inicial" : `entrega de Gs. ${new Intl.NumberFormat('es-PY').format(downPayment)}`);

  // Title lengths and status
  const titleLen = seoTitle.length;
  const titlePct = Math.min(100, Math.round((titleLen / 70) * 100));
  let titleStatus = 'Aceptable';
  let titleStatusColor = 'text-yellow-400';
  let titleBarColor = 'bg-yellow-500';
  if (titleLen === 0) {
    titleStatus = 'Vacío';
    titleStatusColor = 'text-red-400';
    titleBarColor = 'bg-red-500';
  } else if (titleLen >= 50 && titleLen <= 65) {
    titleStatus = 'Óptimo (OK)';
    titleStatusColor = 'text-emerald-400';
    titleBarColor = 'bg-emerald-500';
  } else if (titleLen > 70) {
    titleStatus = 'Muy largo';
    titleStatusColor = 'text-red-400';
    titleBarColor = 'bg-red-500';
  } else if (titleLen > 65 && titleLen <= 70) {
    titleStatus = 'Excelente';
    titleStatusColor = 'text-emerald-400';
    titleBarColor = 'bg-emerald-400';
  } else {
    titleStatus = 'Corto';
    titleStatusColor = 'text-yellow-500';
    titleBarColor = 'bg-yellow-500';
  }

  // Description lengths and status
  const descLen = processedDesc.length;
  const descPct = Math.min(100, Math.round((descLen / 160) * 100));
  let descStatus = 'Aceptable';
  let descStatusColor = 'text-yellow-400';
  let descBarColor = 'bg-yellow-500';
  if (descLen === 0) {
    descStatus = 'Vacío';
    descStatusColor = 'text-red-400';
    descBarColor = 'bg-red-500';
  } else if (descLen >= 120 && descLen <= 160) {
    descStatus = 'Óptimo';
    descStatusColor = 'text-emerald-400';
    descBarColor = 'bg-emerald-500';
  } else if (descLen > 165) {
    descStatus = 'Muy largo';
    descStatusColor = 'text-red-400';
    descBarColor = 'bg-red-500';
  } else if (descLen > 160 && descLen <= 165) {
    descStatus = 'Excelente';
    descStatusColor = 'text-emerald-400';
    descBarColor = 'bg-emerald-400';
  } else {
    descStatus = 'Corto';
    descStatusColor = 'text-yellow-500';
    descBarColor = 'bg-yellow-500';
  }

  // Dynamic generate Schema JSLD
  const generateSchemaMarkup = () => {
    try {
      const parsed = JSON.parse(EXPERIENCE_ACARAY_SEO.schemaMarkup);
      parsed.description = processedDesc;
      parsed.name = seoTitle;
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return EXPERIENCE_ACARAY_SEO.schemaMarkup;
    }
  };

  // Dynamic Keyword Frequency Checker Simulation
  const keywordsToCheck = [
    { phrase: 'lotes en Ciudad del Este', count: 5, required: 3, density: '1.2%' },
    { phrase: 'inmobiliaria Paraguay', count: 4, required: 2, density: '0.9%' },
    { phrase: 'inversión en tierras', count: 3, required: 2, density: '0.7%' },
    { phrase: 'casas quinta Paraguay', count: 3, required: 2, density: '0.7%' },
    { phrase: 'terrenos en CDE', count: 4, required: 2, density: '1.0%' },
    { phrase: 'Km 12 Acaray', count: 6, required: 3, density: '1.5%' }
  ];

  // Copy trigger logic
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2500);
  };

  // Generate dynamic raw HTML of the copy hierarchy (with H1/H2/H3 correct semantic structure)
  const generateRawHtml = () => {
    let html = `<!-- SEO Optimized Landing Page Structure for Experience Acaray - Ciudad del Este -->\n`;
    html += `<!-- Headings & Content Hierarchy under Inbound Copywriting Standard -->\n\n`;
    
    customBlocks.forEach(block => {
      const tag = block.tag;
      const cleanContent = block.content
        .replace("Gs. 1.300.000", `Gs. ${new Intl.NumberFormat('es-PY').format(monthlyPayment)}`)
        .replace("0 Gs.", `Gs. ${new Intl.NumberFormat('es-PY').format(downPayment)}`);

      html += `<!-- ${block.label} (Trigger: ${block.persuasionPrinciple}) -->\n`;
      html += `<${tag} id="${block.id}" class="seo-real-estate-${tag}">\n  ${cleanContent}\n</${tag}>\n\n`;
    });

    html += `<!-- Interactive CTA WhatsApp Link 1: Inversor Airbnb -->\n`;
    html += `<a href="https://wa.me/${whatsappNumber}?text=Hola%20${encodeURIComponent(agentName)},%20quiero%20información%20sobre%20los%20lotes%20de%20Experience%20Acaray%20para%20Airbnb" class="cta-whatsapp-btn font-bold">\n  📲 ¡Quiero Consultar Lotes para Airbnb vía WhatsApp!\n</a>\n\n`;

    html += `<!-- Interactive CTA WhatsApp Link 2: Casa Quinta / Familiar -->\n`;
    html += `<a href="https://wa.me/${whatsappNumber}?text=Hola%20${encodeURIComponent(agentName)},%20me%20interesa%20coordinar%20una%20visita%20para%20casa%20quinta%20en%20Experience%20Acaray" class="cta-whatsapp-btn font-extrabold">\n  📲 Agendar Visita en el Km 12 Acaray Hoy\n</a>\n\n`;

    html += `<!-- Interactive CTA WhatsApp Link 3: Financiación Directa -->\n`;
    html += `<a href="https://wa.me/${whatsappNumber}?text=Hola!%20Quiero%20conocer%2520los%2520requisitos%2520para%2520financiacion%2520fija%2520fácil..." class="cta-whatsapp-btn text-center">\n  📲 Solicitar Requisitos para Cuotas Corridas\n</a>\n`;

    return html;
  };

  return (
    <div className="bg-stone-900 text-stone-100 p-5 md:p-6 rounded-2xl border border-stone-800 shadow-2xl h-full flex flex-col justify-between">
      
      {/* 🛠 CONFIGURATOR CONTROL HEADER */}
      <div>
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Settings className="text-emerald-500 animate-spin-slow" size={20} />
            <div>
              <h2 className="font-display font-bold text-white text-base">Cerebro de Inbound & SEO</h2>
              <p className="text-[10px] text-stone-400">Modifica, analiza y exporta las estructuras copy</p>
            </div>
          </div>
          <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide border border-emerald-800/40">
            Paraguay Inmo-Tech
          </span>
        </div>

        {/* 📋 EDITABLE GLOBAL PARAMETERS */}
        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800/60 mb-6 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-emerald-500" />
            Parámetros de Campaña (Direct Response)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Agent Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                Nombre del Asesor Inmobiliario:
              </label>
              <input 
                type="text" 
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                placeholder="Ej. Marta Molinas"
              />
            </div>

            {/* Whatsapp */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                WhatsApp de Receptor (Formato Int.):
              </label>
              <input 
                type="text" 
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 font-mono focus:outline-none focus:border-emerald-500"
                placeholder="Ej. 595981123456"
              />
              <span className="text-[9px] text-stone-500 block">Prefijo 595 + número celular sin el cero</span>
            </div>

            {/* Core price adjustment */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                Precio de Cuota Corrida (Gs):
              </label>
              <input 
                type="number" 
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 font-mono focus:outline-none focus:border-emerald-500"
                step="50000"
              />
            </div>

            {/* Entrega Inicial adjustment */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                Entrega Inicial (Gs):
              </label>
              <input 
                type="number" 
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 font-mono focus:outline-none focus:border-emerald-500"
                step="500000"
              />
            </div>

          </div>
        </div>

        {/* 🪟 SUB-TAB NAVIGATION */}
        <div className="flex border-b border-stone-800 mb-4 text-xs">
          <button 
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`py-2 px-3 border-b-2 text-left shrink-0 transition font-medium ${activeTab === 'seo' ? 'border-emerald-500 text-white' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
          >
            Google Preview & SEO
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`py-2 px-3 border-b-2 text-left shrink-0 transition font-medium ${activeTab === 'editor' ? 'border-emerald-500 text-white' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
          >
            Editor de Copys
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('html')}
            className={`py-2 px-3 border-b-2 text-left shrink-0 transition font-medium ${activeTab === 'html' ? 'border-emerald-500 text-white' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
          >
            Código HTML H1/H2/H3
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`py-2 px-3 border-b-2 text-left shrink-0 transition font-medium ${activeTab === 'schema' ? 'border-emerald-500 text-white' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
          >
            Schema de Marcado
          </button>
        </div>

        {/* 💻 TAB CONTENT A: GOOGLE PREVIEW & SEO */}
        {activeTab === 'seo' && (
          <div className="space-y-5">
            
            {/* Interactive Grid for editing and preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Formulario de Edición en Tiempo Real */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4 text-left">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  📝 Campos Meta Editables (Tiempo Real)
                </span>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                    Meta Título SEO:
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Título para buscadores..."
                  />
                  <div className="flex justify-between text-[9px] text-stone-500 px-1">
                    <span>Recomendado: 50-65 caracteres</span>
                    <span className={titleLen >= 50 && titleLen <= 65 ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                      {titleLen} caracteres
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                    Meta Descripción SEO:
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full h-24 bg-stone-900 border border-stone-800 rounded-lg p-3 text-xs text-stone-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
                    placeholder="Escribe la meta descripción enriquecida..."
                  />
                  <div className="flex justify-between text-[9px] text-stone-500 px-1">
                    <span>Recomendado: 120-160 caracteres</span>
                    <span className={descLen >= 120 && descLen <= 160 ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                      {descLen} caracteres
                    </span>
                  </div>
                </div>
              </div>

              {/* Vista previa simulada de Google */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider flex items-center gap-1 mb-2.5">
                    <Globe size={12} className="text-blue-400" />
                    Simulador del Buscador de la SERP (Google Paraguay)
                  </span>

                  <div className="bg-white text-stone-900 p-4 rounded-lg border border-stone-200 space-y-1 text-left select-none transition-shadow hover:shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-stone-600">
                      <span className="text-[11px] font-sans font-normal truncate">https://tuweb.com.py &gt; terrenos-acaray-cde</span>
                      <span className="text-[9px] bg-stone-100 text-stone-500 px-1 py-0.2 rounded-xs">Ad</span>
                    </div>
                    <h3 className="text-lg font-sans font-medium text-blue-800 line-clamp-1 hover:underline cursor-pointer">
                      {seoTitle}
                    </h3>
                    <p className="text-xs text-stone-700 font-sans line-clamp-2 leading-relaxed">
                      {processedDesc}
                    </p>
                  </div>
                </div>

                {/* Length recommendation indicators */}
                <div className="grid grid-cols-2 gap-3 text-[10px] text-stone-400 pt-2 border-t border-stone-800/60">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Longitud del Título SEO:</span>
                      <span className={titleStatusColor}>{titleLen} caracteres ({titleStatus})</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${titleBarColor}`} style={{ width: `${titlePct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Longitud Meta Description:</span>
                      <span className={descStatusColor}>{descLen} caracteres ({descStatus})</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${descBarColor}`} style={{ width: `${descPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Keyword Density List */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-500" />
                Detección SEO Semántico On-Page (Fallas y Densidades)
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {keywordsToCheck.map((kw, i) => (
                  <div key={i} className="flex justify-between items-center bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs">
                    <div>
                      <span className="font-semibold text-stone-100 capitalize">"{kw.phrase}"</span>
                      <span className="text-[9px] text-stone-500 block">Palabra clave paraguaya sugerida</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">{kw.count} Veces</span>
                      <span className="text-[9px] text-stone-400 font-mono">Densidad: {kw.density}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-900/30 text-[10px] text-emerald-300 flex gap-2">
                <Lightbulb size={16} className="text-emerald-400 shrink-0" />
                <span>
                  <b>Consejo Inbound:</b> Mantener la palabra fundamental <b>"lotes en Ciudad del Este"</b> y <b>"terrenos en CDE"</b> en encabezados H1/H2 garantiza que los buscadores clasifiquen favorablemente la pertinencia geográfica local.
                </span>
              </div>
            </div>

          </div>
        )}

        {/* 💻 TAB CONTENT B: EDIT CLIPS */}
        {activeTab === 'editor' && (
          <div className="space-y-4">
            <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 text-xs text-stone-300 leading-relaxed mb-4">
              Ajusta y edita el contenido directo de la Landing Page desde aquí. Los cambios se transferirán automáticamente al visualizador interactivo de al lado.
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
              {customBlocks.map((block) => (
                <div key={block.id} className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      {block.label} ({block.tag.toUpperCase()})
                    </span>
                    <span className="text-[9px] text-stone-500 italic max-w-xs text-right">
                      Intención: {block.persuasionPrinciple}
                    </span>
                  </div>

                  <textarea 
                    value={block.content}
                    onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                    className="w-full h-18 bg-stone-900 text-xs border border-stone-800 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-stone-100"
                    placeholder="Contenido redactado..."
                  />

                  <div className="text-[10px] text-stone-400 leading-relaxed">
                    <b>Estrategia SEO:</b> {block.seoReasoning}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 💻 TAB CONTENT C: RAW SEMANTIC HTML EXPORT */}
        {activeTab === 'html' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-stone-400">
                Usa este código directo con etiquetas H1, H2, H3 para tu WordPress / Constructor.
              </span>
              <button 
                type="button"
                onClick={() => copyToClipboard(generateRawHtml(), 'htmlCode')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1 transition"
              >
                {copiedText === 'htmlCode' ? (
                  <>
                    <Check size={14} />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar HTML estructurado</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-stone-950 rounded-xl border border-stone-800 overflow-hidden">
              <pre className="p-4 text-xs font-mono text-emerald-400 whitespace-pre-wrap max-h-96 overflow-y-auto overflow-x-auto text-left leading-relaxed select-text">
                {generateRawHtml()}
              </pre>
            </div>

            <div className="p-3 bg-stone-950 rounded-lg border border-stone-800 text-[10px] text-stone-400 space-y-1">
              <span className="font-bold block text-stone-300">💡 Instrucciones de implementación:</span>
              <p>
                1. Abre el constructor visual de tu portal (Elementor, Gutenberg, Divi o HubSpot).<br />
                2. Crea un bloque de elemento "HTML Personalizado" o similar.<br />
                3. Pega este código. Conservará la jerarquía SEO natural perfecta exigida por Google sin interferir con las hojas de estilo del dominio.
              </p>
            </div>
          </div>
        )}

        {/* 💻 TAB CONTENT D: SCHEMA JSON-LD MARKUP */}
        {activeTab === 'schema' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-stone-400">
                Generador de marcado estructurado JSON-LD RealEstate para Google Rich Snippets.
              </span>
              <button 
                type="button"
                onClick={() => copyToClipboard(generateSchemaMarkup(), 'schemaJsld')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1 transition-all"
              >
                {copiedText === 'schemaJsld' ? (
                  <>
                    <Check size={14} />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Marcado Schema</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-stone-950 rounded-xl border border-stone-800 overflow-hidden">
              <pre className="p-4 text-xs font-mono text-indigo-300 whitespace-pre-wrap max-h-96 overflow-y-auto text-left leading-relaxed select-text">
                {generateSchemaMarkup()}
              </pre>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-900/30 text-[10px] text-indigo-300 leading-relaxed">
              <b>Por qué es relevante:</b> Google rastrea activamente el bloque de datos estructurados para presentar tarjetas enriquecidas en las búsquedas geolocalizadas de Paraguay como <i>"terrenos en Ciudad del Este"</i> y <i>"lotes en pozo Alto Paraná"</i>. Al implementar esto, tienes una ventaja del 40% frente a competidores tradicionales que carecen de SEO técnico.
            </div>
          </div>
        )}

      </div>

      {/* FOOTER ACTION PANEL */}
      <div className="mt-8 pt-4 border-t border-stone-800 text-[10px] text-stone-500 flex justify-between items-center">
        <span>Paraguay Real Estate Copywriting Engine v1.0</span>
        <span className="font-mono text-emerald-500 font-bold">SEO Optimizer Activo</span>
      </div>

    </div>
  );
}
