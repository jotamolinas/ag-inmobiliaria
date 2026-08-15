/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  MapPin, 
  Maximize2, 
  Check, 
  X, 
  Save, 
  Lock, 
  LogOut, 
  User, 
  HelpCircle, 
  DollarSign, 
  Smartphone,
  Tag, 
  ShieldCheck,
  AlertCircle,
  Eye,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Instagram,
  Facebook,
  Share,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  storage
} from '../firebase';
import { PROPERTIES } from '../data';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDocs, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

interface FirebaseProperty {
  id: string;
  title: string;
  price: string;
  priceRaw: number;
  location: string;
  type: 'sale' | 'rent';
  category: 'house' | 'land' | 'apartment' | 'cabin' | 'duplex' | 'commercial';
  area: string;
  description: string;
  images: string[];
  video?: string;
  featured: boolean;
  highlightFeature?: string;
  natureScore: number;
  amenities: string[];
  hasTitle: boolean;
  partnerAlias: string;
  partnerPhone: string;
  commissionPercent: number;
  status: 'pending' | 'published';
  createdAt?: any;
  driveLink?: string;
  googleMapsLink?: string;
  bedrooms?: number;
  bathrooms?: number;
  createdBy?: string;
}

export const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case 'land': return 'Lote / Terreno';
    case 'house': return 'Casa / Residencia';
    case 'cabin': return 'Cabaña Quinta';
    case 'apartment': return 'Departamento';
    case 'duplex': return 'Dúplex';
    case 'commercial': return 'Comercial';
    default: return cat;
  }
};

// 8 Pillars Hardened Firestore Error Interceptor according to Guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Operation Intercepted Fail: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Pre-defined high-quality real estate land templates to prevent ugly listings
const PRESET_LAND_IMAGES = [
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=800&auto=format&fit=crop"
];

const PRESET_AMENITIES = [
  "Acceso Directo al Río",
  "Financiación de Sola Firma",
  "Titulado Listo para Transferir",
  "Suelo Nivelado y Amojonado",
  "Sombra de Lapachos Nativos",
  "Energía Eléctrica ANDE",
  "Pozo de Agua Artesiana",
  "Ideal para Cabaña Airbnb",
  "A metros de Ruta Principal",
  "Zona Residencial de Alta Plusvalía"
];

const translateError = (msg: string) => {
  if (!msg) return "Error desconocido";
  if (msg.includes("Missing or insufficient permissions")) return "Permisos insuficientes. No tienes autorización para realizar esta acción en la base de datos.";
  if (msg.includes("Unsupported field value: undefined")) return "Error de formato de datos: Se detectó un valor 'undefined'.";
  if (msg.includes("Popup closed by user")) return "Ventana de autenticación cerrada por el usuario.";
  if (msg.includes("network error")) return "Error de red. Verifica tu conexión a internet.";
  if (msg.includes("Failed to fetch")) return "No se pudo conectar con el servidor.";
  return msg;
};

export default function AdminPanel({ onClose }: { onClose?: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [properties, setProperties] = useState<FirebaseProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [adminTab, setAdminTab] = useState<'propiedades' | 'portada'>('propiedades');

  const [heroSettings, setHeroSettings] = useState<any>({
    heroBadge: 'Inversión Inmobiliaria Segura',
    heroTitle: 'Lotes en Venta en Ciudad del Este - Experience Acaray Km 12',
    heroDescription: 'Terrenos hermosos con financiación directa en Paraguay, llenos de árboles, y doble acceso directo al Río Acaray. Tu sueño de casa quinta en Minga Guazú o inversión inmobiliaria segura empieza hoy con posesión inmediata.',
    heroMonthlyFee: 'Gs. 1.300.000',
    heroFinancing: 'Terrenos a Sola Firma',
    heroVideoUrl: 'https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356'
  });
  const [uploadingHeroVideo, setUploadingHeroVideo] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [priceRaw, setPriceRaw] = useState(130000000);
  const [priceType, setPriceType] = useState<'PYG' | 'USD'>('PYG');
  const [type, setType] = useState<'sale' | 'rent'>('sale');
  const [location, setLocation] = useState('San Bernardino, Cordillera');
  const [category, setCategory] = useState<'house' | 'land' | 'apartment' | 'cabin' | 'duplex' | 'commercial'>('land');
  const [area, setArea] = useState('12x30 ms (360 m²)');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_LAND_IMAGES[0]);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [video, setVideo] = useState('');
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const [videoFileError, setVideoFileError] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'link' | 'presets'>('upload');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [highlightFeature, setHighlightFeature] = useState('Sola Firma');
  const [natureScore, setNatureScore] = useState(5);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["Financiación de Sola Firma", "Suelo Nivelado y Amojonado"]);
  const [hasTitle, setHasTitle] = useState(false);
  const [partnerAlias, setPartnerAlias] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(5);
  const [status, setStatus] = useState<'pending' | 'published'>('published');

  // Visit scheduling states
  const [selectedPropForVisit, setSelectedPropForVisit] = useState<FirebaseProperty | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitClientName, setVisitClientName] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const handleOpenScheduler = (prop: FirebaseProperty) => {
    setSelectedPropForVisit(prop);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setVisitDate(tomorrow.toISOString().split('T')[0]);
    setVisitTime("10:00");
    setVisitClientName("");
    setVisitNotes("");
  };

  const handleSendVisitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForVisit) return;

    const partnerName = selectedPropForVisit.partnerAlias || "Socio";
    const partnerPhone = selectedPropForVisit.partnerPhone || "595973821270"; // Fallback to Sara's if none
    const cleanPhone = partnerPhone.replace(/[^0-9]/g, '');

    // Formatted date (DD/MM/YYYY)
    let formattedDate = visitDate;
    if (visitDate) {
      const parts = visitDate.split('-');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    const message = `¡Hola *${partnerName}*! Estuve conversando con un cliente interesado en tu inmueble de la inmobiliaria: *"${selectedPropForVisit.title}"*.

Agendé una visita para los siguientes detalles:
📅 *Día:* ${formattedDate}
⏰ *Hora:* ${visitTime} hs
👤 *Cliente:* ${visitClientName || 'Interesado'}
${visitNotes.trim() ? `📝 *Notas:* ${visitNotes}` : ''}

Por favor, confirmame tu disponibilidad para coordinar el encuentro con el cliente. ¡Muchas gracias!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setSelectedPropForVisit(null);
  };
  
  // States and Touch slide support for Live Preview Carousel
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [previewTouchStartX, setPreviewTouchStartX] = useState<number | null>(null);
  const [previewTouchEndX, setPreviewTouchEndX] = useState<number | null>(null);

  const handlePreviewTouchStart = (e: React.TouchEvent) => {
    setPreviewTouchStartX(e.targetTouches[0].clientX);
    setPreviewTouchEndX(e.targetTouches[0].clientX);
  };

  const handlePreviewTouchMove = (e: React.TouchEvent) => {
    setPreviewTouchEndX(e.targetTouches[0].clientX);
  };

  const handlePreviewTouchEnd = () => {
    if (previewTouchStartX === null || previewTouchEndX === null) return;
    const diff = previewTouchStartX - previewTouchEndX;
    const totalImages = imagesList.length > 0 ? imagesList.length : (imageUrl ? 1 : 0);
    if (totalImages <= 1) return;

    if (diff > 50) {
      setPreviewActiveIndex((prev) => (prev + 1) % totalImages);
    } else if (diff < -50) {
      setPreviewActiveIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
    setPreviewTouchStartX(null);
    setPreviewTouchEndX(null);
  };

  // Re-order images to set cover photo (portada)
  const handleSetAsCover = (idx: number) => {
    if (idx <= 0 || idx >= imagesList.length) return;
    const updated = [...imagesList];
    const target = updated[idx];
    updated.splice(idx, 1);
    updated.unshift(target);
    setImagesList(updated);
    setPreviewActiveIndex(0); // Reset preview index to reflect current cover change
  };

  // Keep preview index in bounds if images change
  useEffect(() => {
    const total = imagesList.length > 0 ? imagesList.length : (imageUrl ? 1 : 0);
    if (previewActiveIndex >= total) {
      setPreviewActiveIndex(0);
    }
  }, [imagesList, imageUrl, previewActiveIndex]);
  
  // Custom states for bedrooms, bathrooms & raw text AI parser
  const [bedrooms, setBedrooms] = useState<number | ''>('');
  const [bathrooms, setBathrooms] = useState<number | ''>('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showManualFields, setShowManualFields] = useState(false);
    const [parsingWithAi, setParsingWithAi] = useState(false);

  // Handle parsing of complete raw real estate description
  const handleParseRawText = async () => {
    if (!description.trim()) {
      setErrorMsg("Pega el texto original del cliente en el campo de descripción primero.");
      return;
    }
    setErrorMsg(null);
    setParsingWithAi(true);

    try {
      const response = await fetch("/api/parse-raw-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: description })
      });

      const data = await response.json();
      if (response.ok) {
        if (data.title) setTitle(data.title);
        if (data.priceRaw !== undefined) setPriceRaw(data.priceRaw);
        if (data.priceType) setPriceType(data.priceType);
        if (data.type) setType(data.type);
        if (data.category) setCategory(data.category);
        if (data.area) setArea(data.area);
        if (data.location) setLocation(data.location);
        if (data.googleMapsLink) setGoogleMapsLink(data.googleMapsLink);
        if (data.description) setDescription(data.description);
        
        if (data.bedrooms !== undefined && data.bedrooms !== null) {
          setBedrooms(Number(data.bedrooms));
        } else {
          setBedrooms('');
        }

        if (data.bathrooms !== undefined && data.bathrooms !== null) {
          setBathrooms(Number(data.bathrooms));
        } else {
          setBathrooms('');
        }

        if (data.amenities) {
          setSelectedAmenities(data.amenities);
        }

        setSuccessMsg("¡Ficha técnica auto-completada con éxito!");
                setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(data.error || "No se pudo interpretar el texto correctamente.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error del interpretador IA: " + err.message);
    } finally {
      setParsingWithAi(false);
    }
  };
  
  // Administrators delegation state
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'client'>('client');
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  
  // Gemini loader
  const [generatingDescription, setGeneratingDescription] = useState(false);

  // Authenticate & track state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch Hero Settings
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "settings", "homePage"), (docSnap) => {
      if (docSnap.exists()) {
        setHeroSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    });
    return () => unsub();
  }, [user]);

  // Fetch real properties in real-time from Firestore
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
    const path = "properties";

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const list: FirebaseProperty[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as FirebaseProperty);
        });
        setProperties(list);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (wrappedError: any) {
          setErrorMsg("Falta de permisos o cuota excedida: Solo administradores autorizados pueden gestionar el inventario.");
        }
      }
    );

    return unsubscribe;
  }, [user]);

  // Real-time synchronization of delegates administrators
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, "admins"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAdminsList(list);
    }, (err) => {
      console.warn("No administrative permission to read delegates list:", err.message);
    });
    return unsubscribe;
  }, [user]);

  const isSuperAdmin = user?.email === "jotamolinas@gmail.com" || user?.email === "everacosti@gmail.com" || user?.email === "everacost@gmail.com";
  
  const currentUserAdminDoc = adminsList.find(adm => adm.id?.toLowerCase() === user?.email?.toLowerCase());
  const isClientAdmin = currentUserAdminDoc && currentUserAdminDoc.role === 'client';
  const isFullAdmin = isSuperAdmin || (currentUserAdminDoc && (!currentUserAdminDoc.role || currentUserAdminDoc.role === 'admin'));
  
  const isAuthorizedAdmin = isFullAdmin || isClientAdmin;

  // Adds an administration delegate
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    const targetEmail = newAdminEmail.trim().toLowerCase();
    
    if (!targetEmail.includes('@')) {
      setErrorMsg("Por favor, ingresa una dirección de correo válida.");
      return;
    }

    setAdminActionLoading(true);
    setErrorMsg(null);
    try {
      await setDoc(doc(db, "admins", targetEmail), {
        email: targetEmail,
        name: newAdminName.trim() || "Administrador Invitado",
        role: newAdminRole,
        addedBy: user.email,
        createdAt: serverTimestamp()
      });
      setNewAdminEmail('');
      setNewAdminName('');
      setSuccessMsg(`¡Control delegado agregado (${newAdminRole === 'admin' ? 'Administrador' : 'Cliente'})!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error al guardar administrador. Solo los administradores autorizados pueden agregar a otros.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleUpdateAdminRole = async (emailId: string, newRole: 'admin' | 'client') => {
    setAdminActionLoading(true);
    setErrorMsg(null);
    try {
      await updateDoc(doc(db, "admins", emailId.toLowerCase()), {
        role: newRole
      });
      setSuccessMsg(`Rol actualizado correctamente a ${newRole === 'admin' ? 'Administrador' : 'Cliente'}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error al actualizar el rol.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Removes/revokes access to an administrator
  const handleRemoveAdmin = async (emailId: string) => {
    if (!window.confirm(`¿Estás seguro de revocar el acceso administrativo a ${emailId}?`)) return;

    setAdminActionLoading(true);
    setErrorMsg(null);
    try {
      await deleteDoc(doc(db, "admins", emailId.toLowerCase()));
      setSuccessMsg("Acceso administrativo revocado.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error al remover administrador. Solo los administradores autorizados tienen privilegios para revocar accesos.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Google Login Trigger
  const handleLogin = async () => {
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMsg("¡Sesión iniciada correctamente con Google!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Ocurrió un error en el inicio de sesión: " + err.message);
    }
  };

  // Logout Trigger
  const handleLogout = async () => {
    setErrorMsg(null);
    try {
      await signOut(auth);
      setSuccessMsg("Sesión cerrada.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Format Pyg currency live helper
  const formatPYG = (val: number) => {
    return `Gs. ${new Intl.NumberFormat('es-PY').format(val)}`;
  };

  // Toggle amenity selection
  const handleToggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(item => item !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  // Compress image before saving to stay under Firestore's 1MB limit per document
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_width = 800; // Optimal width for cards & slides
          let width = img.width;
          let height = img.height;

          if (width > max_width) {
            height = Math.round((height * max_width) / width);
            width = max_width;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.65 quality to guarantee ~40-80KB sizes
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    setErrorMsg(null);
    const currentList = [...imagesList];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (file.type.startsWith('video/')) {
          if (file.size > 50 * 1024 * 1024) {
             setErrorMsg("El video excede los 50MB permitidos.");
             continue;
          }
          setLocalVideoFile(file);
          const videoUrl = URL.createObjectURL(file);
          setVideo(videoUrl);
        } else if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file);
          currentList.push(compressed);
        }
      } catch (err: any) {
        console.error("Error al procesar archivo multimedia:", err);
        setErrorMsg("Error al procesar: " + err.message);
      }
    }

    setImagesList(currentList);
    setUploadingFile(false);
  };

  // Auto-generator Description via Gemini route
  const handleGenerateAiDescription = async () => {
    if (!title) {
      setErrorMsg("Por favor, ingresa un título al inicio para poder generar la descripción.");
      return;
    }
    setErrorMsg(null);
    setGeneratingDescription(true);

    try {
      const response = await fetch("/api/describe-terrain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: priceType === 'PYG' ? formatPYG(priceRaw) : `US$ ${new Intl.NumberFormat('en-US').format(priceRaw)}`,
          location,
          area,
          category,
          hasTitle,
          partnerAlias: partnerAlias || 'Asesor de Ventas',
          natureScore,
          amenities: selectedAmenities
        })
      });

      const data = await response.json();
      if (response.ok && data.description) {
        setDescription(data.description);
        setSuccessMsg("¡Descripción optimizada por Gemini integrada exitosamente!");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(data.error || "No se obtuvo respuesta del redactor de IA.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error del generador Gemini: " + err.message);
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Convert a data URL string into a Blob
  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Convert and highly compress data URLs to webp with HTML5 Canvas
  const compressAndConvertToWebP = (dataurl: string, options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = dataurl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = options.maxWidth || 1200;
        const maxHeight = options.maxHeight || 1200;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Failed to get canvas 2D context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to compress canvas to blob"));
            }
          },
          'image/webp',
          options.quality || 0.75
        );
      };
      img.onerror = (err) => reject(err);
    });
  };

  // Slugify a string into a clean web-safe folder name
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD') // Normalizar acentos
      .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .replace(/[^\w\-]+/g, '') // Quitar caracteres no válidos
      .replace(/\-\-+/g, '-') // Quitar guiones duplicados
      .replace(/^-+/, '') // Quitar guión al inicio
      .replace(/-+$/, ''); // Quitar guión al final
  };

  // Saves or updates a listing in Firestore
  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerPhone) {
      setSubmitAttempted(true);
      setErrorMsg("Por favor, especifica el número de celular/WhatsApp del Socio para los desvíos automáticos.");
      return;
    }
    setSubmitAttempted(false);

    if (localVideoFile && localVideoFile.size > 50 * 1024 * 1024) {
      setErrorMsg("El video supera los 50MB. Por favor, sube un video más corto o comprimido.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg("Subiendo imágenes optimizadas a Firebase Storage...");

    const folderSlug = slugify(title || "terreno-nuevo");
    const uploadedImages: string[] = [];
    const docId = editingId || "prop_" + Math.random().toString(36).substring(2, 11);
    const path = `properties/${docId}`;

    try {
      // Process imagesList and upload base64 strings dynamically
      for (let i = 0; i < imagesList.length; i++) {
        const item = imagesList[i];
        if (item.startsWith("data:image/")) {
          try {
            setSuccessMsg(`Comprimiendo y optimizando imagen #${i + 1} de ${imagesList.length} a WebP...`);
            const blob = await compressAndConvertToWebP(item, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 });
            const fileName = `foto_${Date.now()}_${i}.webp`;
            const storagePath = `fotos/${folderSlug}/${fileName}`;
            const storageRef = ref(storage, storagePath);
            
            // Upload the compressed WebP blob with meta
            const metadata = { contentType: 'image/webp' };
            await uploadBytes(storageRef, blob, metadata);
            
            // Get the public download URL
            const downloadUrl = await getDownloadURL(storageRef);
            uploadedImages.push(downloadUrl);
          } catch (uploadErr: any) {
            console.error("Error uploading image to storage:", uploadErr);
            throw new Error(`Error en subida de imagen #${i + 1} a Storage: ${uploadErr.message}`);
          }
        } else {
          // If already a URL, preserve it
          uploadedImages.push(item);
        }
      }

      let finalVideoUrl = video;
      if (localVideoFile) {
        setSuccessMsg(`Subiendo video (${(localVideoFile.size / (1024 * 1024)).toFixed(1)}MB) a Storage...`);
        try {
          const videoFolderSlug = slugify(title || "terreno-nuevo");
          const videoStoragePath = `videos_propiedades/${videoFolderSlug}/${localVideoFile.name}`;
          const videoStorageRef = ref(storage, videoStoragePath);
          const videoMetadata = { contentType: localVideoFile.type || 'video/mp4' };
          
          await uploadBytes(videoStorageRef, localVideoFile, videoMetadata);
          finalVideoUrl = await getDownloadURL(videoStorageRef);
        } catch (videoErr: any) {
          console.error("Error uploading video to storage:", videoErr);
          throw new Error(`Error en subida de video a Storage: ${videoErr.message}`);
        }
      }

      setSuccessMsg("Publicando lote en la base de datos de Firestore...");

      const formattedPrice = priceType === 'PYG' 
        ? formatPYG(priceRaw) 
        : `US$ ${new Intl.NumberFormat('en-US').format(priceRaw)}`;

      const propertyPayload: Partial<FirebaseProperty> & Record<string, any> = {
        id: docId,
        title,
        price: formattedPrice,
        priceRaw,
        location,
        type,
        category,
        area,
        description,
        images: uploadedImages.length > 0 ? uploadedImages : [imageUrl],
        video: finalVideoUrl || '',
        driveLink: driveLink || '',
        googleMapsLink: googleMapsLink || '',
        featured,
        highlightFeature: highlightFeature || "Lote Premium",
        natureScore,
        amenities: selectedAmenities,
        hasTitle,
        partnerAlias: partnerAlias || "Sara Genes",
        partnerPhone: partnerPhone.replace(/\D/g, ''), // Strip non-digits
        commissionPercent: Number(commissionPercent),
        status,
        createdAt: editingId 
          ? properties.find(p => p.id === editingId)?.createdAt || serverTimestamp()
          : serverTimestamp(),
        createdBy: editingId
          ? properties.find(p => p.id === editingId)?.createdBy || (user?.email || "unknown")
          : (user?.email || "unknown"),
      };

      if (category !== 'land' && bedrooms !== '') {
        propertyPayload.bedrooms = Number(bedrooms);
      }
      
      if (category !== 'land' && bathrooms !== '') {
        propertyPayload.bathrooms = Number(bathrooms);
      }
      
      // Ensure no undefined values are sent to Firestore
      Object.keys(propertyPayload).forEach(key => {
        if (propertyPayload[key] === undefined) {
          delete propertyPayload[key];
        }
      });

      await setDoc(doc(db, "properties", docId), propertyPayload);
      setSuccessMsg(editingId ? "¡Lote actualizado exitosamente!" : "¡Lote registrado y publicado con éxito!");
      setTimeout(() => setSuccessMsg(null), 4000);
      resetForm();
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (wrappedError: any) {
        setErrorMsg("Error de escritura: " + translateError(err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Deletes an entry
  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este terreno de forma permanente del inventario?")) return;
    
    setLoading(true);
    setErrorMsg(null);
    const path = `properties/${id}`;

    try {
      await deleteDoc(doc(db, "properties", id));
      setSuccessMsg("Propiedad eliminada del sistema.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch (wrappedError: any) {
        setErrorMsg("Error de seguridad: Acceso de eliminación denegado.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to export property to Instagram
  const handleExportToInstagram = async (prop: FirebaseProperty) => {
    try {
      setSuccessMsg("Preparando publicación para Instagram...");
      
      const imageUrl = prop.images[0];
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const textToShare = `${prop.title}\n\nSuperficie: ${prop.area}\nInversión: ${prop.price}\n\n${prop.description}\n\n📍 ${prop.location}\n\n📲 ¡Agenda una visita hoy mismo! Escríbenos al enlace en nuestro perfil. #AGInmobiliaria #TerrenosParaguay #InversionesInmobiliarias #BienesRaices`;
      
      const file = new File([blob], 'propiedad.jpg', { type: blob.type });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: prop.title,
          text: textToShare,
        });
        setSuccessMsg("¡Compartido con éxito!");
      } else {
        // Fallback for desktop: download image and copy text
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ag_inmobiliaria_${prop.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        await navigator.clipboard.writeText(textToShare);
        setSuccessMsg("¡Imagen descargada y texto copiado al portapapeles! Abriendo Instagram...");
        
        setTimeout(() => {
          window.open('https://instagram.com', '_blank');
        }, 2000);
      }
    } catch (err) {
      console.error("Error compartiendo a Instagram:", err);
      setErrorMsg("Error al preparar la publicación. Intenta de nuevo.");
    }
  };

  // Loads property details into inputs for editing
  const handleStartEdit = (prop: FirebaseProperty) => {
    setEditingId(prop.id);
    setTitle(prop.title);
    setPriceRaw(prop.priceRaw);
    setPriceType(prop.price.includes('US$') ? 'USD' : 'PYG');
    setLocation(prop.location);
    setCategory(prop.category);
    setType(prop.type || 'sale');
    setArea(prop.area);
    setDescription(prop.description);
    setImageUrl(prop.images[0] || PRESET_LAND_IMAGES[0]);
    setImagesList(prop.images || []);
    setVideo(prop.video || '');
    setLocalVideoFile(null);
    setVideoFileError(null);
    setDriveLink(prop.driveLink || '');
    setGoogleMapsLink(prop.googleMapsLink || '');
    setFeatured(prop.featured);
    setHighlightFeature(prop.highlightFeature || '');
    setNatureScore(prop.natureScore);
    setSelectedAmenities(prop.amenities || []);
    setHasTitle(prop.hasTitle || false);
    setPartnerAlias(prop.partnerAlias || '');
    setPartnerPhone(prop.partnerPhone || '');
    setCommissionPercent(prop.commissionPercent || 5);
    setStatus(prop.status || 'published');
    setBedrooms(prop.bedrooms !== undefined ? prop.bedrooms : '');
    setBathrooms(prop.bathrooms !== undefined ? prop.bathrooms : '');
    
    // Smooth scroll to form
    const container = document.getElementById("admin-editor-form-scroll");
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setPriceRaw(130000000);
    setLocation('San Bernardino, Cordillera');
    setCategory('land');
    setType('sale');
    setArea('12x30 ms (360 m²)');
    setDescription('');
    setImageUrl(PRESET_LAND_IMAGES[0]);
    setImagesList([]);
    setVideo('');
    setLocalVideoFile(null);
    setVideoFileError(null);
    setDriveLink('');
    setGoogleMapsLink('');
    setFeatured(false);
    setHighlightFeature('Sola Firma');
    setNatureScore(5);
    setSelectedAmenities(["Financiación de Sola Firma", "Suelo Nivelado y Amojonado"]);
    setHasTitle(false);
    setPartnerAlias('');
    setPartnerPhone('');
    setCommissionPercent(5);
    setStatus('published');
    setBedrooms('');
    setBathrooms('');
  };

  // Pre-fill fields helper for testing
  const handleAutoFillGeneric = () => {
    setTitle("Amplio Terreno con Hermosa Vista y Vía de Acceso");
    setPriceRaw(150000000);
    setPriceType('PYG');
    setLocation("San Bernardino, Cordillera, Paraguay");
    setCategory('land');
    setArea("15x40 ms (600 m²)");
    setVideo('/inmuebles/terrenos/terreno-venta1_compat.mp4');
    setHighlightFeature("Financiación Propia");
    setNatureScore(5);
    setHasTitle(true);
    setPartnerAlias("Socio Gestor Inmobiliario");
    setPartnerPhone("0981775533");
    setCommissionPercent(5);
    setSelectedAmenities([
      "Titulado Listo para Transferir",
      "Suelo Nivelado y Amojonado",
      "Servicios Básicos de ANDE y Agua Corriente",
      "Excelente Entorno Nacional"
    ]);
  };

  const handleHeroSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await setDoc(doc(db, "settings", "homePage"), heroSettings, { merge: true });
      setSuccessMsg("¡Portada actualizada exitosamente!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("El video de portada debe pesar menos de 50MB");
      return;
    }

    setUploadingHeroVideo(true);
    setErrorMsg(null);
    
    try {
      const storageRef = ref(storage, `videos_portada/${Date.now()}_${file.name}`);
      const uploadTask = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadTask.ref);
      
      const newSettings = { ...heroSettings, heroVideoUrl: downloadUrl };
      setHeroSettings(newSettings);
      
      await setDoc(doc(db, "settings", "homePage"), newSettings, { merge: true });
      setSuccessMsg("¡Video de portada subido exitosamente!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Error al subir video: " + err.message);
    } finally {
      setUploadingHeroVideo(false);
      if (e.target) e.target.value = '';
    }
  };

  const visibleProperties = properties.filter(p => isFullAdmin || p.createdBy === user?.email);

  return (
    <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl p-3 md:p-4 max-w-[1400px] w-full min-h-full lg:h-full mx-auto shadow-2xl relative select-text flex flex-col lg:overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-stone-800 pb-3 mb-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded text-white shrink-0">
            <Lock size={16} />
          </div>
          <div>
            <h1 className="text-base md:text-base font-bold tracking-tight text-white font-display leading-tight">
              Control Digital de Inventario & Terrenos
            </h1>
            <p className="text-stone-400 text-xs hidden md:block mt-0.5">
              Registra propiedades, desvía leads a socios y automatiza copys con Inteligencia Artificial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 hidden-scrollbar">
          <button
            type="button"
            onClick={() => setAdminTab('propiedades')}
            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${adminTab === 'propiedades' ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white'}`}
          >
            Propiedades
          </button>
          {isFullAdmin && (
            <button
              type="button"
              onClick={() => setAdminTab('portada')}
              className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${adminTab === 'portada' ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white'}`}
            >
              Editar Portada
            </button>
          )}

          {/* User Section top right */}
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-stone-800 text-xs">
              <div className="bg-stone-800 h-6 w-6 rounded-full overflow-hidden flex items-center justify-center border border-stone-700 shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  <User className="text-stone-400" size={12} />
                )}
              </div>
              <div className="hidden lg:flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium truncate max-w-[100px]">{user.displayName || "Admin"}</span>
                  {isSuperAdmin ? (
                    <span className="text-emerald-400 font-bold hidden xl:inline">| SuperAdmin</span>
                  ) : isAuthorizedAdmin ? (
                    <span className="text-emerald-400 font-bold hidden xl:inline">| Admin</span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-stone-400 hover:text-white transition flex items-center gap-1 cursor-pointer bg-stone-800 px-1.5 py-1 rounded ml-1"
                title="Cerrar Sesión"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-1.5 rounded-md transition-all ml-auto lg:ml-2 shrink-0"
              title="Cerrar Panel"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ERROR & SUCCESS TOASTS */}
      <div className="space-y-2 mb-3">
        {errorMsg && (
          <div className="bg-red-950/60 border border-red-800/40 text-red-300 p-4 rounded-xl flex items-start gap-2 text-sm">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 p-4 rounded-xl flex items-start gap-2 text-sm">
            <Check className="text-emerald-400 shrink-0" size={16} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* UNLOGGED SCREEN */}
      {authLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-stone-800 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <span className="text-stone-400 text-sm">Conectando con base de datos 'The House' de Firebase...</span>
        </div>
      ) : !user ? (
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
          <div className="bg-stone-950 p-6 rounded-full border border-stone-800 mb-6 flex justify-center items-center">
            <ShieldCheck className="text-emerald-500" size={40} />
          </div>
          
          <h2 className="text-white font-display font-semibold text-lg mb-2">Acceso restringido AG Servicios Inmobiliarios</h2>
          <p className="text-stone-400 text-sm leading-relaxed mb-6">
            Las operaciones de inventario en Firebase están resguardadas militarmente para evitar cambios públicos desautorizados. Es indispensable iniciar sesión con tu cuenta de administrador corporativo para continuar.
          </p>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30"
          >
            <Smartphone size={18} />
            Iniciar Sesión con Google
          </button>

          <div className="mt-8 pt-4 border-t border-stone-800/80 w-full text-sm text-stone-500 leading-normal">
            <p>Administradores de la Inmobiliaria.</p>
          </div>
        </div>
      ) : (
        /* LOGGED ACTIONS DASHBOARD */
        <div className="flex flex-col flex-1 lg:overflow-hidden">
          
          

          {adminTab === 'propiedades' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 lg:min-h-0 lg:overflow-hidden">

            {/* LEFT COLUMN: ACTIVE REGISTER / UPDATE FORM (5Cols) */}
            <div id="admin-editor-form-scroll" className="lg:col-span-5 bg-stone-950 p-3 md:p-4 rounded-xl border border-stone-800/80 space-y-3 lg:h-full lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex items-center justify-between border-b border-stone-900 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="text-emerald-500">
                    <Plus size={16} />
                  </div>
                  <h2 className="text-base font-bold text-white uppercase tracking-wider font-display">
                    {editingId ? "Actualizar Terreno" : "Registrar Terreno"}
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFillGeneric}
                    className="text-xs bg-stone-900 text-stone-400 hover:text-white px-2 py-0.8 rounded border border-stone-800 hover:border-stone-700 transition"
                  >
                    Simular Ejemplo
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs text-stone-400 hover:text-white flex items-center gap-0.5"
                    >
                      <X size={12} /> Cancelar
                    </button>
                  )}
                </div>
              </div>

              
<form onSubmit={handleSaveProperty} className={`space-y-3 text-sm ${submitAttempted ? 'group/form' : ''}`}>
  {/* PASO 1: MULTIMEDIA */}
  <div className="border-b border-stone-800 pb-2 mb-3 mt-4">
    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
      <span className="bg-emerald-950 text-emerald-400 w-5 h-5 flex items-center justify-center rounded-full border border-emerald-900/50">1</span> 
      Paso 1: Subir Imágenes y Video
    </h3>
  </div>
  <div className="space-y-4 bg-stone-900/65 p-4 rounded-xl border border-stone-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1">
                      🖼️ Gestión de Fotos y Video
                    </span>
                    <span className="text-xs text-stone-500">
                      {imagesList.length + (localVideoFile ? 1 : 0)} seleccionada(s)
                    </span>
                  </div>

                  {/* Tab list */}
                  <div className="grid grid-cols-3 gap-1 bg-stone-950 p-1 rounded-lg border border-stone-850/60">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`py-1.5 text-xs font-bold rounded-md transition ${imageTab === 'upload' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-white'}`}
                    >
                      📁 Subir Archivos
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('link')}
                      className={`py-1.5 text-xs font-bold rounded-md transition ${imageTab === 'link' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-white'}`}
                    >
                      🔗 Drive / Enlaces
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('presets')}
                      className={`py-1.5 text-xs font-bold rounded-md transition ${imageTab === 'presets' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-white'}`}
                    >
                      🌄 Biblioteca
                    </button>
                  </div>

                  {/* Tab Contents: Upload */}
                  {imageTab === 'upload' && (
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-stone-800 hover:border-emerald-500/50 rounded-xl p-5 text-center cursor-pointer transition-all duration-200 bg-stone-950/40 relative">
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleFileChange}
                          id="file-upload-input"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-1 select-none pointer-events-none">
                          <div className="text-stone-400 text-xl font-bold">📤</div>
                          <p className="text-sm text-stone-300 font-semibold">Seleccionar o arrastrar fotos y videos aquí</p>
                          <p className="text-xs text-stone-500 leading-normal">PNG, JPG o MP4 (hasta 50MB). Se optimizarán automáticamente.</p>
                        </div>
                      </div>

                      {uploadingFile && (
                        <div className="flex items-center justify-center gap-2 text-stone-400 text-xs py-1">
                          <div className="w-3.5 h-3.5 border-2 border-stone-700 border-t-emerald-500 rounded-full animate-spin" />
                          <span>Optimizando y cargando archivos...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Contents: Links/Drive */}
                  {imageTab === 'link' && (
                    <div className="space-y-3 bg-stone-950 p-3 rounded-lg border border-stone-850/60">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs text-stone-400 font-semibold block uppercase">
                            Carpeta de Google Drive (Recomendado):
                          </label>
                          <span className="text-xs text-[#A6C0FE] font-mono">Planos y HD</span>
                        </div>
                        <input
                          type="url"
                          value={driveLink}
                          onChange={(e) => setDriveLink(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                          placeholder="https://drive.google.com/drive/folders/..."
                        />
                        <p className="text-xs text-stone-500 leading-normal">
                          💡 Coloca un enlace compartido de Google Drive. Los clientes verán un botón dedicado para explorar planos oficiales, títulos, y materiales HD directamente.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-900 space-y-1.5">
                        <label className="text-xs text-stone-400 font-semibold block uppercase">
                          Agregar imagen por Enlace Directo (Opcional):
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            id="custom-url-input"
                            className="flex-1 bg-stone-900 border border-stone-800 rounded-lg p-2 text-stone-100 font-mono text-xs focus:outline-none"
                            placeholder="https://ejemplo.com/foto.jpg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('custom-url-input') as HTMLInputElement;
                              if (input && input.value) {
                                setImagesList([...imagesList, input.value]);
                                input.value = '';
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 rounded text-xs transition"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Contents: Presets */}
                  {imageTab === 'presets' && (
                    <div className="space-y-2">
                      <p className="text-xs text-stone-400 leading-tight">Toca imágenes del loteamiento de muestra para asignarlas rápidamente como fotos ilustrativas:</p>
                      <div className="grid grid-cols-5 gap-2">
                        {PRESET_LAND_IMAGES.map((img, idx) => {
                          const isAlreadyAdded = imagesList.includes(img);
                          return (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => {
                                if (isAlreadyAdded) {
                                  setImagesList(imagesList.filter(i => i !== img));
                                } else {
                                  setImagesList([...imagesList, img]);
                                }
                              }}
                              className={`h-11 rounded-md overflow-hidden border-2 transition relative ${isAlreadyAdded ? 'border-emerald-500 scale-95 opacity-100 shadow' : 'border-stone-800 opacity-60 hover:opacity-100'}`}
                            >
                              <img src={img} className="h-full w-full object-cover" />
                              {isAlreadyAdded && (
                                <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center text-white text-xs font-bold">
                                  ✓
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Active Uploads / Selection List */}
                  {(imagesList.length > 0 || localVideoFile || video) && (
                    <div className="space-y-1.5 pt-2 border-t border-stone-850">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-400 font-semibold uppercase">Archivos multimedia activos:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setImagesList([]);
                            setLocalVideoFile(null);
                            setVideo('');
                          }}
                          className="text-stone-500 hover:text-red-400 transition text-xs"
                        >
                          Limpiar todas
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                        {imagesList.map((url, index) => (
                          <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-stone-950 border border-stone-850">
                            <img src={url} className="h-full w-full object-cover animate-fade-in" />
                            
                            {/* Badges and controls for cover option */}
                            {index === 0 ? (
                              <span className="absolute top-1 left-1 bg-[#82B515] text-[7.5px] text-white font-bold px-1 py-0.5 rounded shadow z-10 flex items-center gap-0.5">
                                👑 Portada
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetAsCover(index)}
                                className="absolute top-1 left-1 bg-black/75 hover:bg-[#82B515] text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded transition z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center gap-0.5"
                                title="Establecer como Portada Principal"
                              >
                                ★ Portada
                              </button>
                            )}

                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                type="button"
                                onClick={() => setImagesList(imagesList.filter((_, idx) => idx !== index))}
                                className="bg-stone-950/80 hover:bg-red-600 hover:text-white text-stone-300 p-1 rounded-md text-[8px] transition"
                                title="Eliminar del Carrusel"
                              >
                                ✕
                              </button>
                            </div>
                            
                            <div className="absolute bottom-0 inset-x-0 bg-stone-950/65 py-0.5 text-[8px] text-stone-300 text-center truncate font-mono">
                              Foto {index + 1}
                            </div>
                          </div>
                        ))}

                        {/* VIDEO PREVIEW */}
                        {(localVideoFile || video) && (
                          <div className="relative group aspect-video rounded-lg overflow-hidden bg-stone-950 border border-emerald-900/40">
                             <div className="absolute inset-0 flex items-center justify-center bg-stone-900/60 z-0">
                               <span className="text-2xl opacity-50">📹</span>
                             </div>
                             {video && !video.startsWith("https://") && video !== "custom" && (
                                <video src={video} className="h-full w-full object-cover animate-fade-in z-0 relative" muted playsInline />
                             )}

                             <span className="absolute top-1 left-1 bg-emerald-700 text-[7.5px] text-white font-bold px-1 py-0.5 rounded shadow z-10 flex items-center gap-0.5">
                                🎬 Vídeo
                             </span>

                             <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                type="button"
                                onClick={() => { setLocalVideoFile(null); setVideo(''); }}
                                className="bg-stone-950/80 hover:bg-red-600 hover:text-white text-stone-300 p-1 rounded-md text-[8px] transition"
                                title="Quitar video"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-stone-950/80 py-0.5 text-[7px] text-emerald-400 text-center truncate font-mono px-1">
                              {localVideoFile ? localVideoFile.name : 'Archivo de video'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

  {/* PASO 2: REDACCION ASISTIDA (Auto-completar y Gemini) */}
  <div className="border-b border-stone-800 pb-2 mb-3 mt-8">
    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
      <span className="bg-emerald-950 text-emerald-400 w-5 h-5 flex items-center justify-center rounded-full border border-emerald-900/50">2</span> 
      Paso 2: Redacción Asistida y Lector Mágico
    </h3>
  </div>
  
      <div className="space-y-2 border-t border-stone-800 pt-4 mt-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
              <Sparkles size={11} className="animate-pulse" />
              Descripción o Mensaje Original del Cliente:
            </label>
          </div>
          <p className="text-xs text-stone-400 leading-normal">
            Pega el texto crudo aquí o redacta manualmente. Si usas Gemini, completará la ficha entera y redactará un copy persuasivo.
          </p>
        </div>

        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full h-36 bg-stone-900 text-stone-100 border border-stone-800 rounded-lg p-3 leading-relaxed focus:outline-none focus:border-emerald-500 text-sm ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
          placeholder="Ej: Casa en Venta en Lambaré. 830.000.000 Gs. Terreno de 12x35. 3 dormitorios..."
        />

        {selectedAmenities.length > 0 && (
          <div className="mt-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">
              Amenidades Detectadas:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {selectedAmenities.map((amenity, idx) => (
                <span key={idx} className="bg-stone-900 border border-stone-800 text-stone-300 text-xs px-2 py-1 rounded-md">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            disabled={parsingWithAi || !description.trim()}
            onClick={handleParseRawText}
            className="flex-1 bg-[#82B515] hover:bg-emerald-600 disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
          >
            {parsingWithAi ? (
              <>
                <span className="h-2 w-2 bg-white rounded-full animate-ping" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Sparkles size={11} />
                <span>✨ Auto-completar Ficha y Redactar</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={generatingDescription}
            onClick={handleGenerateAiDescription}
            className="bg-stone-800 hover:bg-stone-700 disabled:bg-stone-900 disabled:text-stone-600 text-stone-300 font-bold py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
            title="Generar Descripción usando solo los campos rellenados manualmente"
          >
            {generatingDescription ? '...' : 'Solo Redactar'}
          </button>
        </div>
      </div>


  {/* PASO 3: REVISAR O CARGAR MANUALMENTE */}
  <div className="border-b border-stone-800 pb-2 mb-3 mt-8">
    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:text-white transition" onClick={() => setShowManualFields(!showManualFields)}>
      <span className="bg-emerald-950 text-emerald-400 w-5 h-5 flex items-center justify-center rounded-full border border-emerald-900/50">{showManualFields ? '▼' : '3'}</span> 
      Paso 3: Revisar o Cargar Manualmente
    </h3>
  </div>
  
  {showManualFields && (
    <div className="space-y-3 mt-3 bg-stone-900/20 p-3 rounded-xl border border-stone-850/50">
      
      {/* 1. TITLE / NAME */}
      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
          Título Comercial del Terreno:
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:outline-none focus:border-emerald-500 ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
          placeholder="Ej. Terreno 360m2 en Esquina Minga Guazú"
        />
      </div>

      {/* 2. DIMENSIONS */}
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
            Área Total (m²):
          </label>
          <input
            type="number"
            required
            value={area}
            onChange={(e) => setArea(Number(e.target.value))}
            className={`w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:outline-none focus:border-emerald-500 ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
            placeholder="360"
          />
        </div>
      </div>

      <div id="price-display-format" className="text-xs text-emerald-500 font-medium font-mono -mt-1 select-none flex items-center gap-1">
        <span className="text-stone-500 font-sans">Previsualización:</span>
        {priceType === 'PYG' 
          ? `Gs. ${new Intl.NumberFormat('es-PY').format(priceRaw)}`
          : `US$ ${new Intl.NumberFormat('en-US').format(priceRaw)}`}
      </div>

      {/* 3. PRICE */}
      <div className="bg-stone-900/30 p-3.5 rounded-xl border border-stone-850/60 space-y-3 col-span-12">
        <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
          Precio y Moneda (Venta al Contado):
        </label>
        
        <div className="flex gap-2">
          <select
            value={priceType}
            onChange={(e) => setPriceType(e.target.value as 'PYG' | 'USD')}
            className="w-24 bg-stone-900 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-emerald-500 cursor-pointer font-bold text-center"
          >
            <option value="PYG">₲ PYG</option>
            <option value="USD">$ USD</option>
          </select>

          <input
            type="number"
            required
            value={priceRaw}
            onChange={(e) => setPriceRaw(Number(e.target.value))}
            className={`flex-1 bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:outline-none focus:border-emerald-500 font-mono text-base ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
            placeholder="Ej. 150000000"
          />
        </div>
        
        <p className="text-xs text-stone-500 leading-tight">
          Ingresa solo números. No uses puntos ni comas. El sistema lo formateará automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 bg-stone-900/30 p-3 rounded-xl border border-stone-850/60">
        <div className="space-y-1.5">
          <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
            Categoría:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="land">Terreno / Lote</option>
            <option value="house">Casa</option>
            <option value="apartment">Departamento</option>
            <option value="commercial">Comercial</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
            Tipo de Propiedad:
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="sale">Venta</option>
            <option value="rent">Alquiler</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
          Localidad y Enlace Google Maps:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center bg-stone-900 border border-stone-820 rounded-lg px-2 text-stone-400 focus-within:border-emerald-500 focus-within:text-emerald-500 transition-colors">
            <MapPin size={14} className="min-w-max mr-1" />
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full bg-transparent p-2 text-stone-100 focus:outline-none text-sm ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
              placeholder="Ej. Km 22, Minga Guazú"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={googleMapsLink}
              onChange={(e) => setGoogleMapsLink(e.target.value)}
              className="w-full bg-stone-900 border border-stone-820 rounded-lg p-2.5 text-stone-100 focus:outline-none focus:border-emerald-500 text-sm border-dashed focus:border-solid font-mono"
              placeholder="Ej. https://maps.app.goo.gl/..."
            />
          </div>
        </div>
      </div>

      {category !== 'land' && (
        <div className="grid grid-cols-2 gap-3 bg-stone-900/30 p-3 rounded-xl border border-stone-850/60">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-1.5">
              🛌 Dormitorios / Habs:
            </label>
            <input
              type="number"
              min="0"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:outline-none focus:border-emerald-500"
              placeholder="Ej. 3"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-1.5">
              🛁 Baños:
            </label>
            <input
              type="number"
              min="0"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:outline-none focus:border-emerald-500"
              placeholder="Ej. 2"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 bg-stone-900 p-2.5 rounded-lg border border-stone-800">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasTitle}
            onChange={(e) => setHasTitle(e.target.checked)}
            className="accent-emerald-600 h-4 w-4 rounded cursor-pointer"
          />
          <div>
            <span className="font-bold text-white text-sm block">¿Tiene Título?</span>
            <span className="text-xs text-stone-500">Documentación al día lista</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.value)}
            className="accent-emerald-600 h-4 w-4 rounded cursor-pointer"
          />
          <div>
            <span className="font-bold text-white text-sm block">¿Recomendado?</span>
            <span className="text-xs text-stone-500">Destacar en portada</span>
          </div>
        </label>
      </div>


      
      <div className="grid grid-cols-2 gap-3 bg-stone-900/40 p-3 rounded-xl border border-stone-850/60">
        <div className="space-y-1.5">
          <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
            Índice de Naturaleza / Plusvalía:
          </label>
          <div className="flex gap-1 bg-stone-950 p-2 rounded-lg border border-stone-800 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNatureScore(star)}
                className={`text-lg transition ${star <= natureScore ? "text-emerald-400 font-semibold scale-110" : "text-stone-600"}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
            Etiqueta Atractiva:
          </label>
          <input
            type="text"
            value={highlightFeature}
            onChange={(e) => setHighlightFeature(e.target.value)}
            className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:outline-none focus:border-emerald-500"
            placeholder="Ej. Sola Firma, Cuotas Corredor"
          />
        </div>
      </div>

      {/* Tambien lo dejamos aqui en la version manual, a pedido del cliente */}
      
      <div className="space-y-2 border-t border-stone-800 pt-4 mt-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
              <Sparkles size={11} className="animate-pulse" />
              Descripción o Mensaje Original del Cliente:
            </label>
          </div>
          <p className="text-xs text-stone-400 leading-normal">
            Pega el texto crudo aquí o redacta manualmente. Si usas Gemini, completará la ficha entera y redactará un copy persuasivo.
          </p>
        </div>

        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full h-36 bg-stone-900 text-stone-100 border border-stone-800 rounded-lg p-3 leading-relaxed focus:outline-none focus:border-emerald-500 text-sm ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
          placeholder="Ej: Casa en Venta en Lambaré. 830.000.000 Gs. Terreno de 12x35. 3 dormitorios..."
        />

        {selectedAmenities.length > 0 && (
          <div className="mt-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">
              Amenidades Detectadas:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {selectedAmenities.map((amenity, idx) => (
                <span key={idx} className="bg-stone-900 border border-stone-800 text-stone-300 text-xs px-2 py-1 rounded-md">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            disabled={parsingWithAi || !description.trim()}
            onClick={handleParseRawText}
            className="flex-1 bg-[#82B515] hover:bg-emerald-600 disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
          >
            {parsingWithAi ? (
              <>
                <span className="h-2 w-2 bg-white rounded-full animate-ping" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Sparkles size={11} />
                <span>✨ Auto-completar Ficha y Redactar</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={generatingDescription}
            onClick={handleGenerateAiDescription}
            className="bg-stone-800 hover:bg-stone-700 disabled:bg-stone-900 disabled:text-stone-600 text-stone-300 font-bold py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
            title="Generar Descripción usando solo los campos rellenados manualmente"
          >
            {generatingDescription ? '...' : 'Solo Redactar'}
          </button>
        </div>
      </div>

    </div>
  )}

  {/* PASO 4: GUARDAR Y PUBLICAR */}
  <div className="border-b border-stone-800 pb-2 mb-3 mt-8">
    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
      <span className="bg-emerald-950 text-emerald-400 w-5 h-5 flex items-center justify-center rounded-full border border-emerald-900/50">4</span> 
      Paso 4: Guardar y Publicar
    </h3>
  </div>
  <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
                      Estado de Publicación:
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-emerald-500 cursor-pointer text-sm"
                    >
                      <option value="published">Publicado (Activo en Catálogo)</option>
                      <option value="pending">Borrador (Ocultó)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      onClick={() => setSubmitAttempted(true)}
                      disabled={loading || !isAuthorizedAdmin}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] text-white font-extrabold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Save size={14} />
                      {editingId ? "Actualizar" : "Publicar"}
                    </button>
                  </div>
                </div>

                {!isAuthorizedAdmin && (
                  <p className="text-xs text-amber-500/80 text-center leading-tight pt-1 animate-pulse">
                    Solo puedes guardar cambios si tienes una cuenta de correo autorizada como administrador por AG Servicios Inmobiliarios.
                  </p>
                )}
  
  {!isAuthorizedAdmin && (
    <p className="text-xs text-amber-500/80 text-center leading-tight pt-1 animate-pulse">
      Solo puedes guardar cambios si tienes una cuenta de correo autorizada como administrador por AG Servicios Inmobiliarios.
    </p>
  )}
</form>

            </div>

            {/* RIGHT COLUMN: ACTIVE PROPERTIES DIRECTORY TABLE (7Cols) */}
            <div className="lg:col-span-7 space-y-3 lg:h-full lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                 {/* LIVE PREVIEW CONTAINER */}
                <div className="bg-stone-950 p-3 md:p-4 rounded-2xl border border-stone-800/80 space-y-3">
                  <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display border-b border-stone-900 pb-3">
                    <Eye size={15} className="text-emerald-500" />
                    Vista Previa en Vivo
       </h2>
                  
                  <div className="bg-stone-900/40 p-4 rounded-xl border border-stone-850/60">
                    <div className="bg-[#FAFBF9] border border-[#E7EAE5] rounded-2xl overflow-hidden text-[#2E312D] text-left max-w-sm mx-auto shadow-md">
                      
                      {/* Media container mock */}
                      <div 
                        className="relative aspect-[4/3] w-full bg-stone-200 select-none overflow-hidden group/prev-carousel"
                        onTouchStart={handlePreviewTouchStart}
                        onTouchMove={handlePreviewTouchMove}
                        onTouchEnd={handlePreviewTouchEnd}
                      >
                        {imagesList.length > 0 ? (
                          <img 
                            src={imagesList[previewActiveIndex] || imagesList[0]} 
                            alt={`Vista previa ${previewActiveIndex + 1}`} 
                            className="h-full w-full object-cover animate-fade-in" 
                          />
                        ) : imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt="Vista previa" 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[#9EA19C] text-sm font-mono bg-stone-900">
                            Falta foto
                          </div>
                        )}

                        {/* Arrows and slides info overlay */}
                        {imagesList.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const total = imagesList.length;
                                setPreviewActiveIndex((prev) => (prev - 1 + total) % total);
                              }}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-[#82B515] text-white p-1 rounded-full transition-all border border-white/15 z-10 opacity-0 group-hover/prev-carousel:opacity-100 flex items-center justify-center active:scale-95"
                              title="Anterior"
                            >
                              <ChevronLeft size={16} className="text-white" />
                            </button>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const total = imagesList.length;
                                setPreviewActiveIndex((prev) => (prev + 1) % total);
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-[#82B515] text-white p-1 rounded-full transition-all border border-white/15 z-10 opacity-0 group-hover/prev-carousel:opacity-100 flex items-center justify-center active:scale-95"
                              title="Siguiente"
                            >
                              <ChevronRight size={16} className="text-white" />
                            </button>

                            {/* Bullet/Indicator Counter overlay */}
                            <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-md text-white px-2 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider z-10 shadow-sm">
                              {previewActiveIndex + 1} / {imagesList.length}
                            </div>
                          </>
                        )}

                        {/* Badges mimicking catalog */}
                        <span className="absolute top-2.5 left-2.5 text-[8px] uppercase font-black tracking-widest text-[#FAFBF9] px-2 py-0.5 rounded bg-[#82B515] z-10">
                          Compra (Venta)
                        </span>

                        {highlightFeature && (
                          <span className="absolute bottom-2.5 left-2.5 bg-[#2E312D]/85 backdrop-blur-md text-[#FAFBF9] text-[8.5px] font-bold px-2 py-0.5 rounded border border-white/10 z-10">
                            ✨ {highlightFeature}
                          </span>
                        )}

                        <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
                          <span>🌿</span>
                          <span className="font-bold">{natureScore}/5</span>
                        </div>
                      </div>

                      {/* Info Body */}
                      <div className="p-4 space-y-3">
                        <div className="space-y-1">
                          <span className="text-xs text-[#758B9C] font-semibold flex items-center gap-1">
                            <MapPin size={10} className="text-[#82B515]" /> {location || 'Ejemplo: San Bernardino, Cordillera'}
                          </span>
                          
                          <h3 className="font-sans font-bold text-base text-[#3D403E] tracking-tight leading-tight">
                            {title || 'Título comercial en desarrollo'}
                          </h3>

                          <p className="text-sm text-[#5B6358] leading-relaxed font-light min-h-[44px] break-words line-clamp-3">
                            {description ? (
                              description
                            ) : (
                              <span className="text-stone-400 italic">Escribe una descripción persuasiva o genera una automática con Gemini...</span>
                            )}
                          </p>
                        </div>

                        {/* Spec footer */}
                        <div className="pt-2 border-t border-[#E7EAE5] grid grid-cols-3 gap-1.5 text-center text-xs text-[#5B6358] shrink-0 font-medium">
                          <div>
                            <span className="block text-[7px] text-[#758B9C] uppercase font-bold leading-none">Precio</span>
                            <span className="font-bold block mt-0.5 text-emerald-600 truncate">
                              {priceType === 'PYG' ? formatPYG(priceRaw) : `US$ ${new Intl.NumberFormat('en-US').format(priceRaw)}`}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[7px] text-[#758B9C] uppercase font-bold leading-none">Superficie</span>
                            <span className="font-bold block mt-0.5 truncate">{area || '12x30 ms'}</span>
                          </div>
                          <div>
                            <span className="block text-[7px] text-[#758B9C] uppercase font-bold leading-none">Categoría</span>
                            <span className="font-bold block mt-0.5 truncate">{getCategoryLabel(category)}</span>
                          </div>
                        </div>

                        {/* Associated Drive Link Mock inside card */}
                        {driveLink && (
                          <div className="mt-2 pt-2 border-t border-[#E7EAE5] flex items-center justify-between bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">📁</span>
                              <span className="text-xs font-bold text-blue-900">Planos & Documentos</span>
                            </div>
                            <span className="text-[8px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded-lg font-mono">
                              VINCULADO
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>

                
                 {/* ALIENACION DE SOCIO - MOVIDO FUERA DEL FORMULARIO MANUAL */}
                <div className="bg-stone-950 p-3 md:p-4 rounded-2xl border border-stone-800/80 space-y-3">
                  <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display border-b border-stone-900 pb-3">
                    <Briefcase size={15} className="text-emerald-500" />
                    Asignación de Aliado & Comisión de Venta (Obligatorio)
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
                        Socio / Aliado (Alias):
                      </label>
                      <input
                        type="text"
                        value={partnerAlias}
                        onChange={(e) => setPartnerAlias(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-850 rounded-lg p-2.5 text-stone-100 focus:outline-none focus:border-emerald-500"
                        placeholder="Ej. Inmobiliaria Quinta"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
                        Comisión Pactada (%):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={commissionPercent}
                          onChange={(e) => setCommissionPercent(Number(e.target.value))}
                          className="w-full bg-stone-950 border border-stone-850 rounded-lg p-2.5 pr-8 font-mono text-stone-100 focus:outline-none focus:border-emerald-500"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-3 top-2.5 text-stone-500 font-bold">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
                      WhatsApp/Celular del Socio (Para recibir visitas):
                    </label>
                    <input
                      type="text"
                      required
                      value={partnerPhone}
                      onChange={(e) => setPartnerPhone(e.target.value)}
                      className={`w-full bg-stone-950 border border-stone-850 rounded-lg p-2.5 font-mono text-stone-100 focus:outline-none focus:border-emerald-500 ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
                      placeholder="Ej. 595973821212"
                    />
                    <span className="text-xs text-stone-500 block leading-tight">
                      Prefijo internacional paraguayo (595) sin el cero inicial. Los interesados le escribirán directo.
                    </span>
                  </div>
                </div>

                {/* RIGHT COLUMN: ACTIVE PROPERTIES DIRECTORY TABLE */}
                 <div className="bg-stone-950 p-3 md:p-4 rounded-2xl border border-stone-800/80 space-y-3">
              <div className="flex justify-between items-center border-b border-stone-900 pb-3">
                <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <Eye size={15} className="text-emerald-500" />
                  Inventario de Terrenos ({visibleProperties.length})
                </h2>
                
                <span className="text-xs text-[#FAFBF9]/60">Sincronizado vía Firestore</span>
              </div>

              {loading && visibleProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-3 border-stone-800 border-t-emerald-500 rounded-full animate-spin mb-3" />
                  <span className="text-stone-400 text-sm">Sincronizando lotes en tiempo real...</span>
                </div>
              ) : visibleProperties.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-stone-800 rounded-2xl">
                  <span className="inline-block text-stone-500 text-3xl mb-2">🏡</span>
                  <h3 className="text-white text-sm font-bold mb-1">Sin terrenos personalizados cargados</h3>
                  <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed px-5">
                    No existen listados dinámicos guardados en tu base de datos de Firestore. ¡Gasta un minuto y publica tu primer lote usando el formulario de la izquierda!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[760px] overflow-y-auto pr-2">
                  {visibleProperties.map((prop) => {
                    const commissionAmount = prop.priceRaw * (prop.commissionPercent / 100);
                    
                    return (
                      <div 
                        key={prop.id} 
                        className={`bg-stone-900 border ${editingId === prop.id ? 'border-emerald-500/80' : 'border-stone-850'} rounded-xl p-4 transition-all hover:bg-stone-900/80 relative flex flex-col md:flex-row gap-4 justify-between`}
                      >
                        {/* Summary thumbnail wrapper */}
                        <div className="flex gap-3 text-sm flex-1">
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="h-16 w-16 md:h-20 md:w-20 rounded-lg overflow-hidden bg-stone-950 border border-stone-800">
                              <img src={prop.images[0]} className="h-full w-full object-cover" />
                            </div>
                            
                            {/* Social share actions */}
                            <div className="flex items-center gap-1.5 justify-center">
                              <button
                                type="button"
                                onClick={() => handleExportToInstagram(prop)}
                                className="bg-fuchsia-950/40 hover:bg-fuchsia-900 text-fuchsia-400 hover:text-fuchsia-100 p-1.5 rounded-md transition flex items-center justify-center"
                                title="Exportar para Instagram"
                              >
                                <Instagram size={12} />
                              </button>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  const shareUrl = window.location.origin + `/?p=${prop.id}#catalogo`;
                                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                                }}
                                className="bg-blue-950/40 hover:bg-blue-900 text-blue-400 hover:text-blue-100 p-1.5 rounded-md transition flex items-center justify-center"
                                title="Compartir en Facebook"
                              >
                                <Facebook size={12} />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  const shareUrl = window.location.origin + `/?p=${prop.id}#catalogo`;
                                  const text = `Mira esta excelente propiedad en AG Inmobiliaria: ${prop.title} por ${prop.price}`;
                                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' \n\n' + shareUrl)}`, '_blank');
                                }}
                                className="bg-green-950/40 hover:bg-green-900 text-green-400 hover:text-green-100 p-1.5 rounded-md transition flex items-center justify-center"
                                title="Compartir por WhatsApp"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-white text-sm truncate max-w-[220px]">
                                {prop.title}
                              </h3>
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded ${prop.status === 'published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' : 'bg-amber-950 text-amber-400 border border-amber-900/30'}`}>
                                {prop.status === 'published' ? 'Publicado' : 'Borrador'}
                              </span>
                              {prop.featured && (
                                <span className="bg-indigo-950 text-indigo-400 text-[8px] font-bold px-1.5 py-0.2 rounded border border-indigo-900/30">
                                  Destacado
                                </span>
                              )}
                            </div>

                            <p className="font-mono text-emerald-400 font-bold text-sm">{prop.price}</p>
                            
                            <p className="text-stone-400 text-xs leading-tight flex items-center gap-1 truncate">
                              <MapPin size={10} className="text-stone-500 shrink-0" />
                              {prop.location}
                            </p>

                            <p className="text-stone-500 text-xs font-mono select-none">
                              Superficie: {prop.area} | Categoría: {getCategoryLabel(prop.category)}
                            </p>

                            {/* Partner metrics */}
                            <div className="pt-1.5 mt-1.5 border-t border-stone-850 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
                              <span className="truncate">Socio: <b className="text-stone-300 font-semibold">{prop.partnerAlias || 'Directo'}</b></span>
                              <span>WhatsApp: <b className="text-stone-300 font-mono">{prop.partnerPhone}</b></span>
                              <span>Comisión: <b className="text-stone-300">{prop.commissionPercent}%</b> (~{priceType === 'PYG' ? formatPYG(commissionAmount) : `USD ${new Intl.NumberFormat('en-US').format(commissionAmount)}`})</span>
                            </div>
                          </div>
                        </div>

                        {/* Action triggers */}
                        <div className="flex md:flex-col justify-end items-center gap-2 border-t md:border-t-0 border-stone-850 md:pl-4 pt-3 md:pt-0 shrink-0 select-none">
                          <button
                            type="button"
                            onClick={() => handleOpenScheduler(prop)}
                            className="bg-emerald-950/40 hover:bg-emerald-900 text-emerald-400 hover:text-emerald-100 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-emerald-900/30 hover:border-emerald-800/40 transition flex items-center gap-1 cursor-pointer w-full md:w-auto justify-center"
                            title="Agendar visita y avisar al socio"
                          >
                            <Calendar size={11} />
                            Agendar Visita
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(prop)}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold border border-stone-750 transition flex items-center gap-1 cursor-pointer w-full md:w-auto justify-center"
                          >
                            <Edit2 size={11} />
                            Editar
                          </button>
                          
                          <button
                            type="button"
                            disabled={!isAuthorizedAdmin}
                            onClick={() => handleDeleteProperty(prop.id)}
                            className="bg-red-950/40 hover:bg-red-950 hover:text-red-300 text-red-400/85 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-900/20 hover:border-red-900/40 transition flex items-center gap-1 cursor-pointer w-full md:w-auto justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 size={11} />
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SUPERADMIN DELEGATION CONTROLS */}
            {isFullAdmin && (
              <div className="lg:col-span-7 bg-stone-950 p-4 md:p-6 rounded-2xl border border-stone-800/80 space-y-4">
                <div className="flex justify-between items-center border-b border-stone-900 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                    👥 Delegación de Control Co-Administrativo
                  </h2>
                  <span className="text-xs text-[#A6C0FE] font-mono">Consola Administrativa</span>
                </div>
                
                <p className="text-xs text-stone-400 leading-normal">
                  Ingresa las direcciones de Gmail de tus colaboradores de confianza. El sistema les permitirá autenticarse de forma segura para cargar fotos, editar lotes y asociar carpetas de Google Drive.
                </p>

                {/* Add Admin Form */}
                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-stone-900/60 p-3 rounded-xl border border-stone-850">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      required
                      placeholder="Nombre del editor"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className={`w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 placeholder-stone-500 text-xs focus:outline-none focus:border-emerald-500 ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="email"
                      required
                      placeholder="cuenta@gmail.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className={`w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 placeholder-stone-500 font-mono text-xs focus:outline-none focus:border-emerald-500 ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'client')}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 text-xs focus:outline-none focus:border-emerald-500 h-full"
                    >
                      <option value="client">Cliente (Solo sus lotes)</option>
                      <option value="admin">Administrador (Total)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={adminActionLoading}
                      className="w-full h-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-3 rounded-lg transition text-xs disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-md"
                    >
                      {adminActionLoading ? "..." : "Autorizar"}
                    </button>
                  </div>
                </form>

                {/* Admins List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {adminsList.length === 0 ? (
                    <p className="text-xs text-stone-500 italic text-center py-4 bg-stone-900/20 rounded-lg border border-stone-850/40">
                      No hay colaboradores autorizados. Registra sus cuentas de Gmail arriba para delegar el control.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="text-xs uppercase font-bold tracking-wider text-stone-500 pb-1">Editores Registrados ({adminsList.length}):</div>
                      {adminsList.map((adm) => (
                        <div key={adm.id} className="flex items-center justify-between bg-stone-900/45 p-2 px-3 rounded-lg border border-stone-850/50 hover:border-stone-800 transition">
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-stone-200 font-semibold">{adm.name}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${adm.role === 'client' ? 'bg-blue-900/40 text-blue-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                                {adm.role === 'client' ? 'Cliente' : 'Admin'}
                              </span>
                            </div>
                            <span className="text-stone-500 font-mono text-xs">{adm.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <select
                              value={adm.role || 'admin'}
                              onChange={(e) => handleUpdateAdminRole(adm.id, e.target.value as 'admin' | 'client')}
                              disabled={adminActionLoading || isSuperAdmin && adm.id === 'jotamolinas@gmail.com'}
                              className="bg-stone-950 border border-stone-800 rounded text-stone-300 text-xs py-1 px-2 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="admin">Admin</option>
                              <option value="client">Cliente</option>
                            </select>
                            
                            <button
                              type="button"
                              disabled={adminActionLoading}
                              onClick={() => handleRemoveAdmin(adm.id)}
                              className="text-xs text-red-400 bg-red-950/20 hover:bg-red-950 hover:text-red-300 px-2 py-1 rounded border border-red-900/20 transition cursor-pointer disabled:opacity-40 font-bold"
                            >
                              Revocar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
          </div>
          )}

          {adminTab === 'portada' && isFullAdmin && (
            <div className="bg-stone-950 p-4 md:p-6 rounded-2xl border border-stone-800/80 mt-8 space-y-6">
              <div className="flex items-center gap-2 border-b border-stone-900 pb-3 mb-6">
                <Lock size={16} className="text-emerald-500" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider font-display">
                  Editar Portada Principal (SEO & Conversión)
                </h2>
              </div>
              
              <form onSubmit={handleHeroSettingsSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-300 uppercase tracking-wider mb-2">
                        Título Principal (H1)
                      </label>
                      <input
                        type="text"
                        value={heroSettings.heroTitle || ''}
                        onChange={(e) => setHeroSettings({...heroSettings, heroTitle: e.target.value})}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-300 uppercase tracking-wider mb-2">
                        Etiqueta Superior (Badge)
                      </label>
                      <input
                        type="text"
                        value={heroSettings.heroBadge || ''}
                        onChange={(e) => setHeroSettings({...heroSettings, heroBadge: e.target.value})}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-300 uppercase tracking-wider mb-2">
                        Descripción (Subtítulo)
                      </label>
                      <textarea
                        rows={3}
                        value={heroSettings.heroDescription || ''}
                        onChange={(e) => setHeroSettings({...heroSettings, heroDescription: e.target.value})}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-base"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-300 uppercase tracking-wider mb-2">
                          Monto Cuota
                        </label>
                        <input
                          type="text"
                          value={heroSettings.heroMonthlyFee || ''}
                          onChange={(e) => setHeroSettings({...heroSettings, heroMonthlyFee: e.target.value})}
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-300 uppercase tracking-wider mb-2">
                          Financiación
                        </label>
                        <input
                          type="text"
                          value={heroSettings.heroFinancing || ''}
                          onChange={(e) => setHeroSettings({...heroSettings, heroFinancing: e.target.value})}
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-base"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      {loading ? 'Guardando...' : 'Guardar Textos de Portada'}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                      <label className="block text-sm font-bold text-stone-300 uppercase tracking-wider mb-2">
                        Video Principal de Portada
                      </label>
                      <p className="text-sm text-stone-500 mb-4">
                        Reemplaza el video estrella que se reproduce de fondo en la página de inicio.
                      </p>
                      
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-stone-800 relative mb-4">
                        {heroSettings.heroVideoUrl ? (
                          <video src={heroSettings.heroVideoUrl} controls className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-600 text-sm">Sin video</div>
                        )}
                      </div>
                      
                      <div className="relative w-full">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleHeroVideoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingHeroVideo}
                        />
                        <div className={`w-full py-2.5 px-3 rounded-lg border text-center transition flex items-center justify-center gap-2 text-base font-bold ${
                          uploadingHeroVideo 
                            ? 'bg-stone-800 border-stone-700 text-stone-500' 
                            : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-white'
                        }`}>
                          {uploadingHeroVideo ? (
                            <>
                              <span className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                              Subiendo video (puede tardar un minuto)...
                            </>
                          ) : (
                            <>Subir Nuevo Video (.mp4, .mov)</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* Dynamic Slide-up Visit Schedule Modal */}
      <AnimatePresence>
        {selectedPropForVisit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-850 flex justify-between items-center bg-stone-950/40">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                    <Calendar size={13} className="text-emerald-400" />
                    Agendar Visita de Lote
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Se enviará a: <b className="text-stone-300">{selectedPropForVisit.partnerAlias || 'Socio'}</b> ({selectedPropForVisit.partnerPhone})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPropForVisit(null)}
                  className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800/60 transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSendVisitSchedule} className="p-4 space-y-3">
                {/* Target Property Miniature */}
                <div className="bg-stone-950/40 border border-stone-850 p-2 rounded-xl flex gap-3 text-xs items-center">
                  <img src={selectedPropForVisit.images[0]} className="w-8 h-8 rounded-lg object-cover border border-stone-800 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-stone-200 truncate">{selectedPropForVisit.title}</p>
                    <p className="font-mono text-emerald-400 font-bold mt-0.5">{selectedPropForVisit.price}</p>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                      <Calendar size={9} className="text-stone-500" />
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className={`w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-stone-100 text-xs focus:outline-none focus:border-emerald-500 font-mono ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                      <Clock size={9} className="text-stone-500" />
                      Hora *
                    </label>
                    <input
                      type="time"
                      required
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className={`w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-stone-100 text-xs focus:outline-none focus:border-emerald-500 font-mono ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
                    />
                  </div>
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Interesado (Cliente) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo del interesado"
                    value={visitClientName}
                    onChange={(e) => setVisitClientName(e.target.value)}
                    className={`w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:border-emerald-500 ${submitAttempted ? 'invalid:border-rose-500 invalid:ring-1 invalid:ring-rose-500' : ''}`}
                  />
                </div>

                {/* Custom Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Comentarios / Indicaciones
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Se van a encontrar en la entrada principal..."
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:border-emerald-500 resize-none font-sans"
                  />
                </div>

                {/* Submit button footer */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPropForVisit(null)}
                    className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-1.5 rounded-lg text-xs transition border border-stone-750"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-1.5 rounded-lg text-xs transition flex items-center justify-center gap-1 shadow-md shadow-emerald-950"
                  >
                    📲 Enviar WhatsApp al Socio
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER METRICS */}
      <div className="mt-8 pt-4 border-t border-stone-800 text-xs text-stone-500 flex flex-col md:flex-row justify-between items-center gap-2 select-none">
        <span className="flex items-center gap-1">
          <ShieldCheck size={11} className="text-emerald-500" />
          Seguridad de Red: Google App Identity & ABAC activo.
        </span>
        <span className="font-mono">AG Servicios Inmobiliarios Control Panel v1.2</span>
      </div>

    </div>
  );
}
