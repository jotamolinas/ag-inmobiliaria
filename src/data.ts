/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SEOMetadata, CopyBlock, FinancingPlan } from './types';

// Interruptor para mostrar u ocultar la sección de "Catálogo Disponible".
// Cambia este valor a true para mostrarlo o false para ocultarlo mientras cargas los inmuebles.
export const SHOW_CATALOG = false;

export const EXPERIENCE_ACARAY_SEO: SEOMetadata = {
  title: "Terrenos en Ciudad del Este | Lotes en Venta Experience Acaray Paraguay",
  description: "¡Últimos terrenos en CDE! Lotes a 100m del Río Acaray (Km 12). Cuotas corridas de Gs. 1.300.000, sin entrega inicial y posesión inmediata. Ideal para casa quinta o inversión Airbnb.",
  focusKeywords: [
    "terrenos en CDE",
    "lotes en Ciudad del Este",
    "inmobiliaria Paraguay",
    "inversión inmobiliaria Paraguay"
  ],
  semanticKeywords: [
    "casas quinta Paraguay",
    "inversión en tierras",
    "Km 12 Acaray",
    "loteamiento Alto Paraná",
    "financiación a sola firma",
    "terrenos en cuotas Paraguay"
  ],
  recommendedSlug: "terrenos-en-cuotas-ciudad-del-este-experience-acaray",
  schemaMarkup: `{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "Loteamiento Experience Acaray Km 12",
  "description": "Lotes y terrenos residenciales en venta en Ciudad del Este, Paraguay, a metros del Río Acaray.",
  "url": "https://tudominio.com.py/terrenos-en-cuotas-ciudad-del-este-experience-acaray",
  "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "PYG",
    "lowPrice": "1300000",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "1300000",
      "priceCurrency": "PYG",
      "unitText": "MONTH",
      "referenceQuantity": {
        "@type": "QuantitativeValue",
        "value": "1",
        "unitCode": "MON"
      }
    }
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Ciudad del Este",
    "addressRegion": "Alto Paraná",
    "addressCountry": "PY",
    "streetAddress": "Km 12 Acaray, a 4.500 metros de la Ruta PY02"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "-25.4745",
    "longitude": "-54.6912"
  }
}`
};

export const COPY_BLOCKS: CopyBlock[] = [
  {
    id: "hero-h1",
    tag: "h1",
    label: "Título Principal (H1)",
    content: "Terrenos en Ciudad del Este: Asegurá tu lote en Experience Acaray con cuotas corridas de Gs. 1.300.000 y Posesión Inmediata",
    seoReasoning: "Contiene la palabra clave de alto volumen 'terrenos en Ciudad del Este', el nombre del proyecto 'Experience Acaray' y la oferta irresistible del precio, combinando SEO directo con intención de compra.",
    persuasionPrinciple: "Promesa audaz y eliminación de riesgos (cuotas accesibles y posesión el mismo día)."
  },
  {
    id: "hero-sub",
    tag: "p",
    label: "Subtítulo de Soporte",
    content: "Tu inversión inmobiliaria inteligente en Paraguay: Lotes premium a solo 100 metros del Río Acaray (Km 12). Sin entrega inicial para construir de inmediato tu casa quinta, cabaña para Airbnb o proyecto de eventos con alta plusvalía.",
    seoReasoning: "Introduce palabras clave semánticas: 'inversión inmobiliaria inteligente en Paraguay', 'casa quinta' e 'inversión'.",
    persuasionPrinciple: "Especificidad y relevancia situacional (dice exactamente dónde queda y para qué sirve)."
  },
  {
    id: "dolor-h2",
    tag: "h2",
    label: "Sección de Dolor (H2)",
    content: "¿Buscás una inversión rentable y segura en CDE pero las barreras de entrada te parecen imposibles?",
    seoReasoning: "Combina el deseo latente de 'inversión rentable' con la geolocalización de CDE.",
    persuasionPrinciple: "Agitación del problema: Enfrenta al cliente con la inflación y los estrictos requisitos de los bancos."
  },
  {
    id: "dolor-body",
    tag: "p",
    label: "Cuerpo del Dolor",
    content: "La inflación en Paraguay no da tregua y dejar el capital quieto en el banco es sinónimo de perder dinero. Sin embargo, cuando buscás lotes en venta en Ciudad del Este, te encontrás con precios inflados, papeleo interminable y exigencias de entregas iniciales de decenas de millones de guaraníes. Además, el calor sofocante y el caos urbano del centro hacen urgente contar con un refugio natural para la familia, pero los terrenos aptos para casas quinta suelen estar desconectados o fuera de presupuesto.",
    seoReasoning: "Aumenta la densidad semántica con: 'lotes en venta en Ciudad del Este', 'casas quinta', 'Paraguay'.",
    persuasionPrinciple: "Empatía y dolor financiero. Conecta con el deseo familiar de escapar del concreto de forma accesible."
  },
  {
    id: "solucion-h2",
    tag: "h2",
    label: "Presentación de la Solución (H2)",
    content: "Loteamiento 'Experience Acaray': Tierra fértil para edificar tu felicidad y multiplicar tus ahorros",
    seoReasoning: "Refuerza el nombre del desarrollo en un encabezado H2, lo cual es vital para el SEO on-page.",
    persuasionPrinciple: "Placer futuro. Presenta el loteamiento como el vehículo perfecto para resolver todos los dolores antes planteados."
  },
  {
    id: "solucion-body",
    tag: "p",
    label: "Cuerpo del Mensaje de la Solución",
    content: "Experience Acaray es la respuesta directa a quienes buscan invertir en tierras sin descapitalizarse. Ubicado estratégicamente en el próspero Km 12 Acaray, a tan solo 4.500 metros de la Ruta Internacional PY02, este loteamiento te ubica a escasos 100 metros del imponente Río Acaray. Es el lienzo en blanco que estabas buscando para edificar esa casa quinta de fin de semana con la que siempre soñaste, establecer un hospedaje digital temporario para rentas turísticas tipo Airbnb, o crear un espacio campestre de eventos en la zona de mayor crecimiento inmobiliario de Ciudad del Este.",
    seoReasoning: "Palabras clave esenciales como: 'invertir en tierras', 'Ruta Internacional PY02', 'Km 12 Acaray', 'crecimiento inmobiliario de Ciudad del Este', y 'Airbnb'.",
    persuasionPrinciple: "Establecimiento de autoridad, ubicación exacta y múltiples vías de monetización (activo productivo)."
  },
  {
    id: "zona-h2",
    tag: "h2",
    label: "Por Qué Invertir en Km 12 Acaray (H2)",
    content: "SEO Semántico: El imparable boom inmobiliario en el eje este del Paraguay",
    seoReasoning: "Apunta al SEO semántico centrándose en el término 'boom inmobiliario en el Paraguay' e 'inversión inmobiliaria'.",
    persuasionPrinciple: "Prueba lógica y de mercado. Usa motivos racionales para respaldar el deseo emocional de comprar tierra."
  },
  {
    id: "zona-body",
    tag: "p",
    label: "Cuerpo de Análisis de Zona",
    content: "En el mundo de los negocios inmobiliarios, la regla de oro es 'comprar donde se está invirtiendo en infraestructura'. El Km 12 Acaray ya no es una promesa; es el polo residencial de mayor expansión de Ciudad del Este. Con la pavimentación de nuevos tramos de interconexión terrestre y la cercanía al Río Acaray, la plusvalía de la zona se sitúa con un alza promedio de entre 15% y 20% anual. Comprar tierra hoy te garantiza ganar dinero desde el día uno por simple valorización natural de suelo de Alto Paraná.",
    seoReasoning: "Contenido semánticamente rico con 'negocios inmobiliarios', 'infraestructura', 'plusvalía', 'suelo de Alto Paraná' para optimizar la indexación de Google.",
    persuasionPrinciple: "Afecto de arrastre y FOMO racional (Fear of Missing Out, miedo a perderse la oportunidad de comprar antes del encarecimiento)."
  },
  {
    id: "urgencia-h2",
    tag: "h2",
    label: "Sección de Urgencia y Seguridad (H2)",
    content: "Últimos Lotes Disponibles: Adquirí tierra real con tranquilidad jurídica absoluta",
    seoReasoning: "Segmentación local con 'adquirir tierra' y 'CDE' subliminal.",
    persuasionPrinciple: "Escasez y Confianza. Asegura la disponibilidad limitada combinada con la tranquilidad legal (posesión inmediata y financiación segura)."
  }
];

export const FINANCING_PLANS: FinancingPlan[] = [
  {
    name: "Plan Cuotas Corridas (Recomendado)",
    downPayment: 0,
    monthlyPayment: 1300000,
    totalPayments: 130, // 130 cuotas standard
    hasImmediatePossession: true,
    requiresBank: false
  },
  {
    name: "Financiación Bancaria AFD",
    downPayment: 10000000,
    monthlyPayment: 980000,
    totalPayments: 120,
    hasImmediatePossession: true,
    requiresBank: true
  },
  {
    name: "Pago al Contado (15% Descuento)",
    downPayment: 110000000,
    monthlyPayment: 0,
    totalPayments: 1,
    hasImmediatePossession: true,
    requiresBank: false
  }
];

const ALL_PROPERTIES: any[] = [
  {
    id: "sale-casa-km8-acaray",
    title: "Casa Nueva en Venta (KM 8 ACARAY)",
    price: "Gs. 400.000.000",
    priceRaw: 400000000,
    location: "Frente al Colegio Roberto L. Petit (a 600m de la Ruta PY02), Km 8 Acaray, Ciudad del Este",
    type: "sale",
    category: "house",
    bedrooms: 2,
    bathrooms: 1,
    area: "12x30 ms\n(Construcción 8x8 ms)",
    description: "Excelente oportunidad de inversión: Casa totalmente a estrenar con construcción nueva de 8x8 metros de área sobre un amplio terreno titulado de 12x30 metros (360 m² de superficie). Cuenta con baño equipado con revestimientos y artefactos de primera calidad, piso completo de porcelanato de alto brillo en todos los ambientes y pozo de agua totalmente nuevo. Se entrega lista en fase de terminación estética (solo le falta la pintura final a gusto de su nuevo dueño). Ubicación estratégica de alta demanda: Km 8 Acaray, Ciudad del Este, situado justo enfrente al Colegio Roberto L. Petit y a tan solo 600 metros de la Ruta PY02 con acceso inmediato y asfalto cercano.",
    images: [
      "https://lh3.googleusercontent.com/d/1dfnbhGuanAN8iYmDrWoIbL23QqNUY-_Z",
      "https://lh3.googleusercontent.com/d/1W3bCa_zysjCoYEcbC-5omsTwGhygRxai",
      "https://lh3.googleusercontent.com/d/14Ss1OVMVzVOLS-oGCJEj7tvcaSVy7JJR",
      "https://lh3.googleusercontent.com/d/1ue8F7RaGABA8xJpcyIEmd29yVUkMBNck",
      "https://lh3.googleusercontent.com/d/1KhEu8OVuOufwUAUeUOU1N_SUKbnKzY42",
      "https://lh3.googleusercontent.com/d/1tToU8RPIUaVmz4wpQrSa1fr5g-zfRCO7"
    ],
    featured: true,
    highlightFeature: "Terreno Titulado 12x30m",
    natureScore: 4,
    amenities: [
      "Titulado Listo para Transferir",
      "Piso de Porcelanato Completo",
      "Construcción Nueva de 8x8 m",
      "Frente al Colegio Roberto Petit",
      "A solo 600m de la Ruta PY02",
      "Pozo de Agua Nuevo",
      "Baño de Primera con Revestimientos",
      "Amplio Patio y Entrada de Coches"
    ]
  },
  {
    id: "sale-hectareas-minga",
    title: "Fracción de 2 Hectáreas en Km 14 Acaray",
    price: "US$ 160.000",
    priceRaw: 1120000000,
    location: "Km 14 Acaray, Minga Guasú (Entrada sobre Doble Avda.)",
    type: "sale",
    category: "land",
    bedrooms: 0,
    bathrooms: 0,
    area: "2 ha y 47 m²",
    description: "Espectacular fracción de terreno de 2 hectáreas con 47 metros cuadrados, ubicada en zona estratégica de Minga Guasú (Km 14 Acaray). Cuenta con una entrada privilegiada sobre la doble avenida entre Chipería Leticia y Super Max, con acceso rápido a tan solo 4.000 metros de la Ruta Internacional PY02, completamente sobre asfalto. Una verdadera belleza ideal para loteamientos, depósitos, fábricas o desarrollos inmobiliarios de alto impacto.",
    images: [
      "/inmuebles/terrenos/terreno-venta.JPG",
      "/inmuebles/terrenos/terrreno-venta2.JPG"
    ],
    video: "/inmuebles/terrenos/terreno-venta1_compat.mp4",
    featured: true,
    highlightFeature: "2 Hectáreas sobre Asfalto",
    natureScore: 5,
    amenities: [
      "Sobre Asfalto",
      "Ubicación Estratégica",
      "Entrada Avenida Doble",
      "Acceso Rápido PY02",
      "Ideal Loteamiento",
      "Sola Firma / Contado",
      "Apto Fábricas y Depósitos"
    ]
  },
  {
    id: "rent-monoambiente-shuenstatt",
    title: "Mono Ambiente en Alquiler (ÁREA 4)",
    price: "Gs. 1.200.000 / mes",
    priceRaw: 1200000,
    location: "A 2 cuadras del Santuario Schoenstatt, Área 4, Ciudad del Este",
    type: "rent",
    category: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    area: "40 m² de confort",
    description: "Alquiler de hermoso y flamante Monoambiente tipo estudio en condominio cerrado, distinguido por su clásica puerta verde de diseño. Ubicado en el corazón urbano más exclusivo y pacífico de Ciudad del Este: el Área 4, a escasas dos cuadras del Santuario de la Virgen de Schoenstatt. Cuenta con 1 habitación espaciosa integrada, baño privado elegante, área de lavandería independiente y 1 cochera incluida en el recinto privado. Servicios básicos incluidos de agua potable, electricidad de ANDE y recolección municipal de basura.",
    images: [
      "https://lh3.googleusercontent.com/d/1OK00pNbNaCAbHQ2H_wzb7TmJ3ak_WZNl",
      "https://lh3.googleusercontent.com/d/1m5-WJpEVDmKekfbCN4T287xb42xEYGUq",
      "https://lh3.googleusercontent.com/d/1CF6K3StpgFnbWNB2k2Ea7hVFebvAhNVJ",
      "https://lh3.googleusercontent.com/d/1HYhjqJml-l-cJrAMlPAgGxO0uVWBa6KH",
      "https://lh3.googleusercontent.com/d/1-u05Vy_18mOCgjY5WCnpIbg-Dv1cne0G"
    ],
    featured: true,
    highlightFeature: "Todos los Servicios Básicos Incluidos",
    natureScore: 4,
    amenities: [
      "Agua Potable Incluida",
      "Electricidad ANDE Incluida",
      "Recolección de Basura",
      "1 Cochera Incluida",
      "Lavandería Privada",
      "Seguridad y Silencio",
      "A 2 cuadras del Santuario",
      "Puerta Verde Exclusiva"
    ]
  },
  {
    id: "star-lote",
    title: "Lote Superior del Río (Lote Estrella)",
    price: "Gs. 1.250.000.000",
    priceRaw: 1250000000,
    location: "Km 12 Acaray (Exclusivo Borde de Río), Ciudad del Este",
    type: "sale",
    category: "lot",
    bedrooms: 0,
    bathrooms: 0,
    area: "2.500 m² de parque arbolado frente al Río Acaray",
    description: "Espectacular lote plano cubierto de árboles nativos gigantes y con acceso de doble calle directo a la hermosa costa del Río Acaray. Listo para edificar la casa quinta de tus sueños o cabañas de alta rentabilidad para alquiler temporal tipo Airbnb sin barreras.",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop"
    ],
    featured: true,
    highlightFeature: "2.500m² con Costa de Río",
    natureScore: 5,
    amenities: ["Costa de Río", "Árboles Nativos", "Doble Acceso Vial", "Paz Absoluta", "Energía Eléctrica", "Financiación Directa", "Tierra Fértil", "Camino Pavimentado"]
  },
  {
    id: "rent-nordic-cabin",
    title: "Cabaña Escandinava del Río",
    price: "Gs. 3.500.000 / mes",
    priceRaw: 3500000,
    location: "Km 11, Costanera del Acaray, Hernandarias",
    type: "rent",
    category: "cabin",
    bedrooms: 1,
    bathrooms: 1,
    area: "85 m² cubiertos / 600 m² jardín",
    description: "Perfecto refugio de fin de semana o vivienda compacta de ensueño. Ubicación boscosa a metros del Río Acaray con deck exterior de madera natural de tajy, fogón de piedra de cantera, asador integrado y grandes ventanales con aislamiento acústico y térmico doble. Respirar aire puro nunca fue tan accesible.",
    images: [
      "/inmuebles/cabana-lago-acaray/fachada.jpg",
      "/inmuebles/cabana-lago-acaray/sala-estar.jpg",
      "/inmuebles/cabana-lago-acaray/bano-principal.jpg",
      "/inmuebles/cabana-lago-acaray/muelle.jpg"
    ],
    featured: false,
    highlightFeature: "Deck Exterior & Fogón",
    natureScore: 5,
    amenities: ["Asador", "Calefactor a Leña", "Wi-Fi Fibra", "Bosque Privado", "Costa de Río"]
  },
  {
    id: "sale-quinta-rustica",
    title: "Quinta Moderna Paraná",
    price: "Gs. 720.000.000",
    priceRaw: 720000000,
    location: "Km 12 Acaray (Loteamiento Premium), CDE",
    type: "sale",
    category: "house",
    bedrooms: 2,
    bathrooms: 2,
    area: "180 m² cubiertos / 1.500 m² parque",
    description: "Hermosa casa quinta con terminaciones modernas sofisticadas en piedra natural de cantera y estructuras acristaladas. Rodeada por la imponente floresta de Alto Paraná, quincho moderno integrado, asador de última generación y una hermosa piscina vanguardista con iluminación subacuática.",
    images: [
      "/inmuebles/quinta-moderna-parana/exterior-piscina.jpg",
      "/inmuebles/quinta-moderna-parana/cocina-quincho.jpg",
      "/inmuebles/quinta-moderna-parana/habitacion-suite.jpg"
    ],
    featured: false,
    highlightFeature: "Piscina & Quincho",
    natureScore: 4,
    amenities: ["Piscina", "Huerta Orgánica", "Lapachos Gigantes", "Quincho Tradicional", "Pozo de Artesano"]
  },
  {
    id: "rent-reserve-loft",
    title: "Departamento Loft Bio-Habitable",
    price: "Gs. 4.200.000 / mes",
    priceRaw: 4200000,
    location: "Barrio Cerrado Paraná Country Club, Hernandarias",
    type: "rent",
    category: "apartment",
    bedrooms: 1,
    bathrooms: 2,
    area: "110 m² cubiertos",
    description: "Increíble loft de doble altura en edificio inteligente con certificación sustentable. Paredes de la sala revestidas en jardines verticales vivos con regadío automático por goteo, balcón terraza con asador empotrado y sublimes vistas panorámicas hacia la reserva fluvial protegida del Paraná.",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"
    ],
    featured: false,
    highlightFeature: "Jardín de Pared Vivo",
    natureScore: 4,
    amenities: ["Gimnasio Ecológico", "Seguridad 24hs", "Asador Revestido", "Generador", "Vista de Reserva"]
  },
  {
    id: "sale-river-land",
    title: "Lote Premium Costa de Río Acaray",
    price: "Gs. 180.000.000",
    priceRaw: 180000000,
    location: "Km 12 Acaray (Costa de Río), Ciudad del Este",
    type: "sale",
    category: "land",
    area: "600 m² (15m x 40m)",
    description: "Terreno completamente regular, nivelado y amojonado mecánicamente con bajada directa al Río Acaray. Espectacular arboleda nativa conservada que brinda abundante sombra templadora todo el día. Financiación ágil a sola firma, ideal para construir de inmediato tu refugio familiar campestre.",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop"
    ],
    featured: false,
    highlightFeature: "Playa de Bajada de Lanchas",
    natureScore: 5,
    amenities: ["Acceso al Río", "Energía ANDE", "Amojonado Duro", "Suelo Nivelado", "Sombra de Guatambú"]
  },
  {
    id: "sale-eco-colonial",
    title: "Eco-Villa Colonial Multifamiliar",
    price: "Gs. 980.000.000",
    priceRaw: 980000000,
    location: "Hermoso Entorno Natural Residencial, Ciudad del Este",
    type: "sale",
    category: "house",
    bedrooms: 4,
    bathrooms: 3,
    area: "320 m² cubiertos / 1.100 m² terreno",
    description: "Soberbia residencia familiar inspirada en la arquitectura colonial clásica española pero equipada para consumo energético consciente: calefacción solar de tuberías, purificador de agua propio de vertiente y recolección inteligente de lluvias para el regadío de su inmenso huerto de frutales de estación.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"
    ],
    featured: false,
    highlightFeature: "Termotanque Solar & Pozo",
    natureScore: 4,
    amenities: ["Termotanque Solar", "Piscina Fluvial", "Huerto de Frutales", "Regadío de Lluvia", "Alarma Perimetral"]
  },
  {
    id: "rent-solarium-studio",
    title: "Estudio Solarium en Altura Minimal",
    price: "Gs. 2.900.000 / mes",
    priceRaw: 2900000,
    location: "Centro de CDE (Avenida Perú - Eje Verde), Ciudad del Este",
    type: "rent",
    category: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    area: "65 m² cubiertos",
    description: "Departamento tipo estudio monoambiente amueblado con refinado gusto minimalista escandinavo, utilizando maderas claras de reforestación. Cuenta con solárium privado integrado y acristalado, ideal para home-office rodeado de vegetación interior filtradora de aire.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop"
    ],
    featured: false,
    highlightFeature: "Solárium Privado",
    natureScore: 3,
    amenities: ["Gimnasio", "Piscina Climatizada", "Cochera con Conexión EV", "Portería Smart"]
  }
];

// Ocultamos las propiedades de ejemplo y dejamos únicamente las reales disponibles en producción.
// A medida que tengas más propiedades, se pueden ir quitando del filtro o habilitando aquí de forma ágil.
export const PROPERTIES = ALL_PROPERTIES.filter(p => p.id === "sale-hectareas-minga" || p.id === "rent-monoambiente-shuenstatt" || p.id === "sale-casa-km8-acaray");

