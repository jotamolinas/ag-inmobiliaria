/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  MapPin, 
  Waves, 
  DollarSign, 
  Sparkles,
  Phone,
  ArrowRight,
  Info,
  Calendar,
  Building,
  ExternalLink
} from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyPayment: number;
  downPayment: number;
  whatsappNumber: string;
  agentName: string;
  onSimulateLead: (ctaType: string, message: string) => void;
}

export default function MediaModal({
  isOpen,
  onClose,
  monthlyPayment,
  downPayment,
  whatsappNumber,
  agentName,
  onSimulateLead
}: MediaModalProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Lock background scroll
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format currency helper (PYG)
  const formatGs = (num: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0
    }).format(num).replace('PYG', 'Gs.');
  };

  // WhatsApp helper
  const getWaLink = (message: string) => {
    const cleanNum = whatsappNumber.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
  };

  const slides = [
    {
      id: 1,
      title: "Vista del Arroyo y Entorno Natural",
      subtitle: "Km 12 Acaray - Entorno Verde",
      description: "Disfrutá del aire puro, bajadas de lanchas y un microclima sombreado y fresco en tu lote, ideal para despejar la mente de la ciudad.",
      image: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 2,
      title: "Plano General del Loteamiento",
      subtitle: "Distribución de Manzanas y Vías de Acceso",
      description: "Lotes amojonados y elevados sobre calle consolidada, a metros del empalme que conecta directamente con la Ruta Internacional PY02.",
      image: "https://images.unsplash.com/photo-1506974210756-8e1b8985d348?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 3,
      title: "Tu Futura Casa Quinta",
      subtitle: "Render de Referencia de Casa Quinta",
      description: "Lotes amplios con dimensiones excelentes para construir tu quincho, piscina profunda, jardín de frutales de estación y asador.",
      image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 4,
      title: "Atardeceres Únicos en el Río",
      subtitle: "A 100 metros del Río Acaray",
      description: "Viví a pasos de la hermosa ribera. Realizá paseos fluviales, recreación campestre o simplemente contemplá puestas de sol memorables.",
      image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 5,
      title: "Inversión Inteligente para Airbnb",
      subtitle: "Alquileres Temporales de Alta Demanda",
      description: "Construí una cabaña rústica de madera o ladrillo visto y rentala los fines de semana. Las propiedades junto al río lideran en rentabilidad.",
      image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
    }
  ];

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const msgSimulado = `Hola ${agentName}, vi el carrusel de fotos y planos de Experience Acaray. Me interesa el plan de cuotas de ${formatGs(monthlyPayment)} sin entrega inicial. Quiero más detalles técnicos.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      {/* Backdrop animation */}
      <div 
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-stone-50 text-stone-900 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden border border-emerald-900/10 flex flex-col md:max-h-[92vh] z-10 animate-fade-in">
        
        {/* Header con estilo natural, verde y armonioso */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-4 flex items-center justify-between shadow-md relative">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-amber-400 text-stone-950 rounded-lg flex items-center justify-center font-bold shadow-inner">
              <Sparkles size={18} className="fill-stone-950" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base tracking-tight text-white uppercase sm:normal-case">
                Dossier Completo: Planes, Costos e Imágenes de Loteamiento
              </h3>
              <p className="text-[11px] text-emerald-200">
                Experience Acaray • Km 12 Ciudad del Este • Financiación Directa
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-200 focus:outline-none"
            aria-label="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Scroll Area */}
        <div className="overflow-y-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-radial from-stone-50 via-stone-50 to-emerald-50/20">

          {/* Left Column: Stateful Natural Carousel (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="relative bg-stone-900 rounded-2xl overflow-hidden h-64 sm:h-80 md:h-[380px] shadow-lg group border border-stone-200">
              
              {/* Active Image */}
              <img 
                src={slides[activeSlide].image} 
                alt={slides[activeSlide].title} 
                className="w-full h-full object-cover select-none animate-fade-in"
                referrerPolicy="no-referrer"
              />
              
              {/* Carousel overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-sm font-extrabold tracking-widest uppercase w-max mb-1">
                  {slides[activeSlide].subtitle}
                </span>
                <h4 className="font-display font-semibold text-lg md:text-xl text-white tracking-tight">
                  {slides[activeSlide].title}
                </h4>
                <p className="text-xs text-stone-300 font-light mt-1 max-w-xl leading-relaxed">
                  {slides[activeSlide].description}
                </p>
              </div>

              {/* Side controls */}
              <button 
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/25 hover:bg-white/40 backdrop-blur-xs text-white p-2 rounded-full transition group-hover:scale-105 active:scale-95"
                title="Foto Anterior"
              >
                <ChevronLeft size={20} />
              </button>

              <button 
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/25 hover:bg-white/40 backdrop-blur-xs text-white p-2 rounded-full transition group-hover:scale-105 active:scale-95"
                title="Siguiente Foto"
              >
                <ChevronRight size={20} />
              </button>

              {/* Counter overlay */}
              <div className="absolute top-3 right-3 bg-stone-950/70 backdrop-blur-sm text-[11px] font-mono text-stone-300 px-2.5 py-1 rounded-full">
                {activeSlide + 1} / {slides.length}
              </div>
            </div>

            {/* Carousel Thumbnails */}
            <div className="grid grid-cols-5 gap-2.5">
              {slides.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSlide(index)}
                  className={`relative rounded-xl overflow-hidden h-14 md:h-16 transition-all duration-300 border-2 ${
                    activeSlide === index 
                      ? 'border-emerald-600 scale-[1.02] ring-3 ring-emerald-600/20' 
                      : 'border-transparent opacity-65 hover:opacity-100 hover:scale-[1.01]'
                  }`}
                >
                  <img src={s.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-emerald-900/10" />
                </button>
              ))}
            </div>

            {/* Quick trust highlights within visual column */}
            <div className="p-4 bg-emerald-800/5 rounded-2xl border border-emerald-800/20 flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center">
                <Waves size={20} className="stroke-2 text-emerald-700" />
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                Todas las fotos corresponden a locaciones reales del <b>Km 12 Acaray (CDE)</b> y propuestas de edificación proyectadas por nuestro estudio de urbanismo.
              </p>
            </div>
          </div>

          {/* Right Column: Key plans, costs, and project information (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            
            {/* Planes & Costos Summary Box */}
            <div className="bg-emerald-950 text-white p-6 rounded-2xl shadow-md space-y-4 border border-emerald-900 relative">
              <div className="absolute top-4 right-4 bg-amber-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-sm">
                PLAN ESTRELLA
              </div>
              
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                Financiación Directa de Manzana
              </span>

              <div className="space-y-1">
                <span className="text-[10px] text-emerald-300 block font-semibold">Valor de Lote Cuota Corrida:</span>
                <span className="text-3xl md:text-4xl font-display font-medium text-amber-300 font-mono tracking-tight block">
                  {formatGs(monthlyPayment)}
                </span>
                <span className="text-xs text-emerald-200 block">
                  Cuotas fijas y corridas sin reajustes de interés anual.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-900 text-xs">
                <div>
                  <span className="block text-emerald-300 text-[10px]">Entrega Inicial:</span>
                  <span className="block font-bold text-white text-sm">GS. 0 (Sola Firma)</span>
                </div>
                <div>
                  <span className="block text-emerald-300 text-[10px]">Posesión de Lote:</span>
                  <span className="block font-bold text-white text-sm">Instantánea en Mes 1</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-900/50 rounded-xl border border-emerald-800/40 text-[11px] leading-relaxed text-emerald-50">
                <b>💡 Sin Intervención Bancaria:</b> Aprobamos tu solicitud de loteamiento presentándote con tu Cédula de Identidad, sin necesidad de demostrar solvencia extrema.
              </div>
            </div>

            {/* Toda la información técnica */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
              <h4 className="font-display font-semibold text-stone-900 text-sm flex items-center gap-1.5 border-b border-stone-100 pb-2">
                <Info size={16} className="text-emerald-700" />
                Ficha Técnica Complementaria:
              </h4>

              <div className="space-y-3 text-xs text-stone-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900">Ubicación Estratégica:</span>
                    <p className="text-stone-500 mt-0.5">Km 12 Acaray, a exactamente 4.500 metros desde el asfalto principal de la Ruta Internacional PY02.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900">Distancia al Río Acaray:</span>
                    <p className="text-stone-500 mt-0.5">A 100 metros del cauce del río. Perfectamente resguardado de inundaciones por la cota de elevación del terreno.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900">Servicios e Infraestructura:</span>
                    <p className="text-stone-500 mt-0.5">Red de energía de la ANDE instalada enfrente. Factibilidad de perforación de agua comunitaria potable inmediata.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900">Facilidades de Escrituración:</span>
                    <p className="text-stone-500 mt-0.5">Loteamiento inscripto de forma catastral individualizada. Transferencia directa mediante Escribana Autorizada al saldar.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Final */}
            <div className="space-y-2.5">
              <a 
                href={getWaLink(msgSimulado)}
                target="_blank"
                rel="noreferrer"
                onClick={() => onSimulateLead("Modal WhatsApp Reserva", msgSimulado)}
                className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-98"
              >
                <Phone size={16} className="fill-white" />
                <span>Hablar con {agentName} por WhatsApp</span>
                <ArrowRight size={14} />
              </a>
              
              <button
                onClick={onClose}
                className="w-full text-center hover:bg-stone-200 border border-stone-300 text-stone-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                Cerrar Dossier Informativo
              </button>
            </div>

          </div>

        </div>

        {/* Modal footer extra bar */}
        <div className="bg-stone-100 px-6 py-3 border-t border-stone-200 text-[10px] text-stone-500 text-center uppercase tracking-wide font-mono">
          © 2026 Experience Acaray Loteamientos S.A. • Km 12 Acaray (Paraguay)
        </div>

      </div>
    </div>
  );
}
