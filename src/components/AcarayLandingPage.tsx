/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Phone, 
  MapPin, 
  Droplets, 
  Sparkles,
  CheckCircle, 
  ArrowRight,
  ShieldCheck,
  Building,
  ChevronLeft,
  ChevronRight,
  Search,
  Home,
  Compass,
  FileText,
  User,
  Heart,
  Undo2,
  TreePine,
  Layers,
  Check,
  Languages,
  DollarSign,
  Maximize2,
  Gauge,
  X,
  Play,
  Pause,
  Share2,
  Volume2,
  VolumeX,
  Instagram,
  Facebook, Twitter, Link, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROPERTIES, SHOW_CATALOG as INITIAL_SHOW_CATALOG } from '../data';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, doc } from 'firebase/firestore';

interface PropertyMediaCarouselProps {
  images: string[];
  video?: string;
  title: string;
  onZoom: (url: string) => void;
}

interface SafeVideoPlayerProps {
  src: string;
  className?: string;
  onZoom?: () => void;
  showZoomButton?: boolean;
  poster?: string;
}

// Helper to resolve Google Drive file view links into direct streaming links and bypass local demux issues
const resolveGoogleDriveUrl = (url: string): string => {
  if (!url) return url;
  
  // Handlers for Google Drive urls to transform them to direct media stream URLs
  if (url.includes("drive.google.com/file/d/")) {
    const parts = url.split("/file/d/");
    if (parts.length > 1) {
      const id = parts[1].split("/")[0].split(/[?#]/)[0];
      return `https://docs.google.com/uc?export=download&id=${id}`;
    }
  }
  
  if (url.includes("drive.google.com/open?id=")) {
    const parts = url.split("id=");
    if (parts.length > 1) {
      const id = parts[1].split(/[&?#]/)[0];
      return `https://docs.google.com/uc?export=download&id=${id}`;
    }
  }

  // Intercept any local virtual paths to point directly to the correct Firebase Storage video URL
  if (
    url.includes("terreno-venta") ||
    url.startsWith("/inmuebles/terrenos/")
  ) {
    return "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2Fdeb104ae-4835-4089-ad42-c4afa5a30b58.MP4?alt=media&token=a419511d-4f11-4817-a839-7ced8b8c660e";
  }

  if (
    url.includes("video-estrella") ||
    url.includes("recorrido-aereo") ||
    url.includes("extra-rio") ||
    url.startsWith("/videos/")
  ) {
    return "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356";
  }

  return url;
};

const getCategoryLabel = (cat: string) => {
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

// Global deterministic video fallback directory to guarantee only valid files are loaded
const VIDEO_FALLBACKS: Record<string, string[]> = {
  "/videos/video-estrella_optimized.mp4": [
    "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356"
  ],
  "/videos/video-estrella_transcoded.mp4": [
    "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356"
  ],
  "/videos/video-estrella.mp4": [
    "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356"
  ],
  "/videos/video-estrella.mov": [
    "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356"
  ],
  "/videos/recorrido-aereo.mp4": [
    "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356"
  ],
  "/videos/extra-rio.mp4": [
    "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356"
  ],
  "/inmuebles/terrenos/terreno-venta1_compat.mp4": [
    "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2Fdeb104ae-4835-4089-ad42-c4afa5a30b58.MP4?alt=media&token=a419511d-4f11-4817-a839-7ced8b8c660e"
  ],
  "/inmuebles/terrenos/terreno-venta1.MP4": [
    "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2Fdeb104ae-4835-4089-ad42-c4afa5a30b58.MP4?alt=media&token=a419511d-4f11-4817-a839-7ced8b8c660e"
  ],
  "/inmuebles/terrenos/terreno-venta1_original.MP4": [
    "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2Fdeb104ae-4835-4089-ad42-c4afa5a30b58.MP4?alt=media&token=a419511d-4f11-4817-a839-7ced8b8c660e"
  ]
};

const getSourcesList = (url: string) => {
  const resolved = resolveGoogleDriveUrl(url);
  const cleanUrl = resolved.split("?")[0];
  if (VIDEO_FALLBACKS[cleanUrl]) {
    return VIDEO_FALLBACKS[cleanUrl];
  }
  
  // Adaptive extension switcher as a fallback for custom/runtime paths
  const list = [resolved];
  let alternative = "";
  if (resolved.toLowerCase().endsWith(".mp4")) {
    alternative = resolved.replace(/\.mp4$/i, ".mov");
  } else if (resolved.toLowerCase().endsWith(".mov")) {
    alternative = resolved.replace(/\.mov$/i, ".mp4");
  }
  if (alternative && alternative !== resolved) {
    list.push(alternative);
  }
  return list;
};

function SafeVideoPlayer({ src, className = "", onZoom, showZoomButton = true, poster }: SafeVideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  // Deterministic fallbacks catalog derived from src
  const fallbacks = React.useMemo(() => getSourcesList(src), [src]);
  
  // Track fallback sequence purely with an index to guarantee zero race conditions on initial render
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const currentSrc = fallbacks[fallbackIndex] || src;

  // Cache-busting parameter to prevent iframe or browser caching of previous dummy/corrupted streams
  const cacheBustedSrc = React.useMemo(() => {
    const separator = currentSrc.includes('?') ? '&' : '?';
    return `${currentSrc}${separator}v=20260605-v15`;
  }, [currentSrc]);

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackErrorMsg, setPlaybackErrorMsg] = useState<string>("");
  const [showNativeControls, setShowNativeControls] = useState(false);

  // When source changes from parent, reset tracking indices securely and enable autoplay state
  React.useEffect(() => {
    setFallbackIndex(0);
    setPlaybackErrorMsg("");
    setShowNativeControls(false);
    setIsPaused(false);
  }, [src]);

  // Handle immediate muted autoplay on mount & source changes for bulletproof page load playback
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Hard-enforce muted properties and playsInline to pass browser sandboxing safety checks
    video.muted = true;
    setIsMuted(true);
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    // Force reloading the video tag on source/cacheBusting shift
    video.load();

    let active = true;

    // Global gesture listener fallback to play the video as soon as the user touches/clicks anywhere
    const handleGlobalGesture = () => {
      if (!active || !video) return;
      video.play()
        .then(() => {
          if (active) {
            setIsPaused(false);
            setPlaybackErrorMsg("");
            cleanupListeners();
          }
        })
        .catch((err) => {
          console.log("[SafeVideoPlayer Gesture] Playback play attempt deferred on user gesture:", err?.message || err);
        });
    };

    const cleanupListeners = () => {
      document.removeEventListener("click", handleGlobalGesture, { capture: true });
      document.removeEventListener("touchstart", handleGlobalGesture, { capture: true });
    };

    const runAutoplay = () => {
      video.play()
        .then(() => {
          if (active) {
            setIsPaused(false);
            setPlaybackErrorMsg("");
            cleanupListeners(); // Autoplay worked immediately, so we can clean up gesture listeners
          }
        })
        .catch((err) => {
          console.log("[SafeVideoPlayer Autoplay] Muted playback attempt deferred: ", err?.message || err);
          if (active) {
            // If even muted autoplay is strictly disallowed/unfocused, show friendly tap instruction
            setIsPaused(true);
            setPlaybackErrorMsg("Toca para reproducir");
            
            // Add listeners for any user gesture anywhere on screen to trigger playback instantly
            document.addEventListener("click", handleGlobalGesture, { capture: true, once: true });
            document.addEventListener("touchstart", handleGlobalGesture, { capture: true, once: true });
          }
        });
    };

    // A deliberate, tiny timeout lets browser parse the media buffers inside the sandboxed iframe first
    const timer = setTimeout(() => {
      if (active && video) {
        runAutoplay();
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
      cleanupListeners();
    };
  }, [cacheBustedSrc]);

  // Synchronize dynamic attributes during play cleanly without blocking browser native workflows
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.defaultMuted = isMuted;
    video.playsInline = true;
    if (isMuted) {
      video.setAttribute("muted", "");
    } else {
      video.removeAttribute("muted");
    }
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
  }, [isMuted]);

  // Handle play/pause toggles cleanly with single trusted interaction
  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (showNativeControls) return;
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || isPaused) {
      video.muted = isMuted;
      video.play()
        .then(() => {
          setIsPaused(false);
          setPlaybackErrorMsg("");
        })
        .catch(err => {
          console.log("Unmuted play blocked by user agent security. Recovering in silent mode...", err);
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => {
              setIsPaused(false);
              setPlaybackErrorMsg("");
            })
            .catch(errMuted => {
              console.warn("Both unmuted and muted play attempts rejected completely.", errMuted);
              setIsPaused(true);
              setPlaybackErrorMsg("Toca para reproducir");
            });
        });
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onZoom) {
      onZoom();
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (e.target !== e.currentTarget) return;

    const video = videoRef.current;
    const error = video?.error;
    
    // Ignore non-fatal events (code 1 = MEDIA_ERR_ABORTED, which happens on any tab change/carousel swap)
    if (!error || error.code === 1) {
      console.log(`[SafeVideoPlayer] Non-fatal or aborted event ignored securely. Error details:`, error);
      return;
    }
    
    console.warn(`Video playback issue for source: ${currentSrc}`, error ? `(Code: ${error.code}, Message: ${error.message})` : "General Error");

    const code = error.code;
    let userFriendlyMsg = "";
    if (code === 3) {
      userFriendlyMsg = "Toca Play para sincronizar video";
    } else if (code === 2) {
      userFriendlyMsg = "Optimizando carga de red";
    } else if (code === 4) {
      // Keep it silent as video is compatible but browser restricts autoplay
      userFriendlyMsg = "";
    }

    // Attempt self-healing by switching to subsequent formats on ANY error code
    if (fallbackIndex < fallbacks.length - 1) {
      const nextIndex = fallbackIndex + 1;
      console.log(`Self-healing Action: Switching source index from ${fallbackIndex} to ${nextIndex} (${fallbacks[nextIndex]})`);
      setPlaybackErrorMsg(`Cargando formato alternativo...`);
      setFallbackIndex(nextIndex);
    } else {
      // Provide a friendly, reassuring, fully-actionable Paraguayan-adapted note encouraging tap-to-player
      if (userFriendlyMsg) {
        setPlaybackErrorMsg(`${userFriendlyMsg}. ¡Toca el botón verde Play para iniciar el recorrido de video!`);
      } else {
        setPlaybackErrorMsg("");
      }
    }
  };

  const enableNativeControlsManually = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowNativeControls(true);
    setPlaybackErrorMsg("Controles nativos cargados");
  };

  return (
    <div 
      id="premium-safe-video-player-container"
      className={`relative group/video select-none overflow-hidden ${className} ${showNativeControls ? "" : "cursor-pointer"} text-[#FAFBF9] bg-stone-950 bg-cover bg-center`}
      style={poster ? { backgroundImage: `url(${poster})` } : undefined}
      onClick={showNativeControls ? undefined : handleTogglePlay}
    >
      <video
        id="premium-loteamiento-video"
        ref={videoRef}
        src={cacheBustedSrc}
        poster={poster}
        className="w-full h-full object-cover scale-100 transition-opacity duration-300"
        style={{ opacity: 1 }}
        muted={true}
        autoPlay={true}
        loop={true}
        playsInline={true}
        preload="auto"
        controls={showNativeControls}
        onPlay={() => {
          setIsPaused(false);
          setPlaybackErrorMsg("");
        }}
        onPause={() => setIsPaused(true)}
        onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
        onLoadedData={() => setPlaybackErrorMsg("")}
        onCanPlay={() => setPlaybackErrorMsg("")}
        onError={handleVideoError}
      >
        Tu navegador no soporta el reproductor de video.
      </video>
      
      {/* Custom play button overlay - Only shown if native controls are NOT active */}
      {!showNativeControls && (
        <div
          id="premium-video-overlay"
          onClick={handleTogglePlay}
          className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-[#FAFBF9] z-10 w-full h-full border-0 transition-all duration-300 ${
            isPaused 
              ? 'opacity-100 scale-100 pointer-events-auto cursor-pointer' 
              : 'opacity-0 scale-105 pointer-events-none'
          }`}
        >
          <div 
            id="premium-video-play-btn"
            className="bg-[#82B515] hover:bg-[#82B515]/90 text-white rounded-full p-6 shadow-xl flex items-center justify-center border border-white/20 transition-transform active:scale-95 duration-200 min-h-[56px] min-w-[56px]"
          >
            <Play size={24} fill="currentColor" className="ml-0.5" />
          </div>
          
          {playbackErrorMsg && (
            <div id="premium-video-error-badge" className="mt-3 px-3 py-1 bg-black/85 rounded text-[10px] text-yellow-400 font-sans tracking-wide">
              ⚠️ {playbackErrorMsg}
            </div>
          )}
          
          <button
            id="premium-native-controls-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              enableNativeControlsManually(e);
            }}
            className="mt-3 min-h-[44px] px-4 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-[11px] text-[#FAFBF9]/95 rounded border border-white/20 transition-all cursor-pointer pointer-events-auto font-sans tracking-wide"
          >
            ¿No reproduce? Toca para controles nativos
          </button>
        </div>
      )}

      {/* Interactive HUD overlay when video is actively playing - Only shown if native controls are NOT active */}
      {!showNativeControls && (
        <div 
          id="premium-video-hud-overlay"
          className={`absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none select-none z-10 transition-all duration-300 ${
            !isPaused ? 'opacity-100 translate-y-0 scale-100 animate-fade-in' : 'opacity-0 translate-y-1 scale-95 pointer-events-none'
          }`}
        >
          <button
            id="premium-video-pause-btn"
            type="button"
            onClick={handleTogglePlay}
            className="min-h-[44px] px-3.5 py-1.5 bg-black/65 hover:bg-stone-900 text-[11px] text-white rounded-md flex items-center gap-1.5 backdrop-blur-md border border-white/10 cursor-pointer active:scale-95 transition-all shadow-md pointer-events-auto font-sans"
          >
            <span className="flex gap-0.5">
              <span className="h-2.5 w-0.5 bg-white inline-block animate-pulse" />
              <span className="h-2.5 w-0.5 bg-white inline-block animate-pulse delay-75" />
            </span>
            <span className="font-semibold">Pausar Vídeo</span>
          </button>

          <button
            id="premium-video-mute-btn"
            type="button"
            onClick={handleToggleMute}
            className="min-h-[44px] min-w-[44px] bg-black/65 hover:bg-stone-900 text-white rounded-md flex items-center justify-center backdrop-blur-md border border-white/10 cursor-pointer active:scale-95 transition-all shadow-md pointer-events-auto"
            title={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      )}

      {/* Fullscreen Zoom button - Only shown if native controls are NOT active */}
      {!showNativeControls && showZoomButton && onZoom && (
        <button
          id="premium-video-zoom-btn"
          type="button"
          onClick={handleZoom}
          className="absolute top-3.5 right-3.5 min-h-[44px] min-w-[44px] bg-black/50 text-[#FAFBF9] rounded-full hover:bg-stone-900 hover:scale-105 active:scale-95 transition-all backdrop-blur-md border border-white/10 opacity-100 z-10 cursor-pointer shadow-md flex items-center justify-center pointer-events-auto"
          title="Ver en pantalla completa"
        >
          <Maximize2 size={16} />
        </button>
      )}
    </div>
  );
}

interface ZoomVideoPlayerProps {
  src: string;
  className?: string;
  currentZoomValue: string;
  setZoomVideoSrc: (src: string) => void;
}

function ZoomVideoPlayer({ src, className = "", currentZoomValue, setZoomVideoSrc }: ZoomVideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const cacheBustedSrc = React.useMemo(() => {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}v=20260605-v15`;
  }, [src]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Hard-enforce iOS requirements
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    // Force reloading the video tag on source/cacheBusting shift
    video.load();
  }, [cacheBustedSrc]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = videoRef.current;
    const error = video?.error;
    
    if (error) {
      if (error.code === 1 || error.code === 2) {
        console.log(`Ignored zoom video non-fatal loading event (code ${error.code}) for src: ${src}`);
        return;
      }
    } else {
      return;
    }
    
    console.warn(`Zoom video failed loading at current source: ${src}`, error);
    if (currentZoomValue) {
      const fallbacks = getSourcesList(currentZoomValue);
      const currentIndex = fallbacks.indexOf(src);
      if (currentIndex !== -1 && currentIndex < fallbacks.length - 1) {
        const nextSrc = fallbacks[currentIndex + 1];
        console.log(`Zoom video swapping to fallback: ${nextSrc}`);
        setZoomVideoSrc(nextSrc);
      }
    }
  };

  return (
    <video
      id="premium-zoom-video-player"
      ref={videoRef}
      src={cacheBustedSrc}
      className={className}
      controls={true}
      autoPlay={true}
      loop={true}
      muted={true}
      playsInline={true}
      preload="auto"
      onError={handleVideoError}
    >
      Tu navegador no soporta el reproductor de video.
    </video>
  );
}

function PropertyMediaCarousel({ images, video, title, onZoom }: PropertyMediaCarouselProps) {
  const mediaItems = useMemo(() => {
    const items: { type: 'image' | 'video'; url: string; imageFallback?: string }[] = [];
    if (images && images.length > 0) {
      images.forEach(img => {
        items.push({ type: 'image', url: img });
      });
    }
    if (video) {
      items.push({
        type: 'video',
        url: video,
        imageFallback: images && images.length > 0 ? images[0] : undefined
      });
    }
    return items;
  }, [images, video]);

  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      setActiveIndex((prev) => (prev + 1) % mediaItems.length);
    } else if (diff < -50) {
      setActiveIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (mediaItems.length === 0) {
    return (
      <div className="w-full h-full bg-stone-100 flex items-center justify-center text-xs text-stone-400">
        Sin imagen disponible
      </div>
    );
  }

  const currentItem = mediaItems[activeIndex];

  return (
    <div 
      className="relative w-full h-full group/carousel overflow-hidden bg-[#FAFBF9] select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Media item rendering */}
      <div className="w-full h-full">
        {currentItem.type === 'video' ? (
          <SafeVideoPlayer
            src={currentItem.url}
            className="w-full h-full"
            poster={currentItem.imageFallback}
            onZoom={() => onZoom(currentItem.url)}
          />
        ) : (
          <img
            src={currentItem.url}
            alt={`${title} - Vista ${activeIndex + 1}`}
            className="w-full h-full object-cover transform hover:scale-[1.02] transition-transform duration-500 cursor-zoom-in"
            onClick={() => onZoom(currentItem.url)}
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Navigation Arrows if more than 1 item */}
      {mediaItems.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-[#82B515] text-white p-1.5 rounded-full backdrop-blur-xs transition-all hover:scale-105 border border-white/10 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 touch:opacity-100 cursor-pointer z-10"
            aria-label="Anterior"
          >
            <ChevronLeft size={12} strokeWidth={2.5} />
          </button>
          
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-[#82B515] text-white p-1.5 rounded-full backdrop-blur-xs transition-all hover:scale-105 border border-white/10 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 touch:opacity-100 cursor-pointer z-10"
            aria-label="Siguiente"
          >
            <ChevronRight size={12} strokeWidth={2.5} />
          </button>

          {/* Elegant Slide indicator */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md font-mono tracking-wider font-bold z-10">
            {activeIndex + 1} / {mediaItems.length}
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {mediaItems.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === activeIndex 
                    ? 'bg-[#82B515] w-3' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Ir a diapositiva ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface AcarayLandingPageProps {
  monthlyPayment: number;
  downPayment: number;
  whatsappNumber: string;
  agentName: string;
  customBlocks: any[];
  theme: 'forest' | 'midnight' | 'minimalist';
  onSimulateLead: (ctaType: string, message: string) => void;
}

export default function AcarayLandingPage({
  monthlyPayment: initialMonthlyPayment,
  downPayment: initialDownPayment,
  whatsappNumber: initialWhatsappNumber,
  agentName: initialAgentName,
  customBlocks,
  theme,
  onSimulateLead
}: AcarayLandingPageProps) {
  
  // Real-time parameters bound directly to prop specifications
  const agentName = initialAgentName;
  const whatsappNumber = initialWhatsappNumber;
  const featuredPrice = 1250000000;
  const [currentSelectedProperty, setCurrentSelectedProperty] = useState<any>(null);

  // Dynamic land listings fetched in real-time from Firebase Firestore
  const [firestoreProperties, setFirestoreProperties] = useState<any[]>([]);

  React.useEffect(() => {
    const q = query(
      collection(db, "properties"), 
      where("status", "==", "published")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setFirestoreProperties(list);
    }, (err) => {
      console.warn("Firestore listener warning (falling back to local listings):", err);
    });
    return unsubscribe;
  }, []);

  const allPropertiesCombined = useMemo(() => {
    const processed = firestoreProperties.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      priceRaw: p.priceRaw || 0,
      location: p.location,
      type: p.type || 'sale',
      category: p.category || 'land',
      area: p.area || "12x30 ms",
      bedrooms: p.bedrooms || undefined,
      bathrooms: p.bathrooms || undefined,
      amenities: p.amenities || [],
      specs: {
        area: p.area || "12x30 ms",
        rooms: p.category === 'land' ? undefined : (p.bedrooms ? `${p.bedrooms} Dormitorios` : (p.specs?.rooms || "Disponibilidad inmediata")),
        bathrooms: p.category === 'land' ? undefined : (p.bathrooms ? `${p.bathrooms} Baños` : (p.specs?.bathrooms || "Listo para transferir")),
        time: p.category === 'land' ? undefined : (p.specs?.time || "A sola firma"),
        tags: p.amenities || ["Financiación directa", "Sola firma"]
      },
      image: p.images?.[0] || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80",
      images: p.images || [],
      video: p.video || undefined,
      description: p.description || "",
      featured: p.featured || false,
      highlightFeature: p.highlightFeature || "Aliado Comercial",
      natureScore: p.natureScore || 4,
      partnerAlias: p.partnerAlias,
      partnerPhone: p.partnerPhone,
      driveLink: p.driveLink,
      googleMapsLink: p.googleMapsLink || ''
    }));
    return processed;
  }, [firestoreProperties]);

  // Interactive investment profile selection state
  const [selectedProfile, setSelectedProfile] = useState<'capitalization' | 'airbnb' | 'family'>('capitalization');
  const [showInversionModal, setShowInversionModal] = useState(false);

  // States for Oferta Relámpago Popup & Countdown Timer
  const [showOfertaRelampago, setShowOfertaRelampago] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    // Persistent initial time within session so it persists smoothly on reload
    try {
      const saved = sessionStorage.getItem("oferta_countdown");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.hours || parsed.minutes || parsed.seconds) return parsed;
      }
    } catch (_) {}
    return { hours: 11, minutes: 47, seconds: 24 };
  });



  // Save the countdown timer state and decrement it every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let h = prev.hours;
        let m = prev.minutes;
        let s = prev.seconds;
        if (s > 0) {
          s--;
        } else if (m > 0) {
          m--;
          s = 59;
        } else if (h > 0) {
          h--;
          m = 59;
          s = 59;
        } else {
          // Reset to create infinite urgency loop
          h = 11;
          m = 59;
          s = 59;
        }
        const updated = { hours: h, minutes: m, seconds: s };
        try {
          sessionStorage.setItem("oferta_countdown", JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // General States
  const [starActiveSlide, setStarActiveSlide] = useState(0);
  const [selectedPlanoView, setSelectedPlanoView] = useState<'satelital' | 'tecnico'>('satelital');
  const [architectureActiveSlide, setArchitectureActiveSlide] = useState(0);
  const [operationFilter, setOperationFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('land');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'nature'>('default');
  const [visibleCount, setVisibleCount] = useState(6);

  // Regla de Negocio Permanente y Definitiva: 
  // Siempre que inicie el componente o recargue la página, el filtro de operación
  // vuelve a "Todos" y el límite visible se clava estrictamente en 6 propiedades.
  React.useEffect(() => {
    setOperationFilter('all');
    setCategoryFilter('land');
    setVisibleCount(6);
  }, []);
  
  // Regla de Negocio: Cualquier cambio dinámico de filtros resetea el paginador a 6
  React.useEffect(() => {
    setVisibleCount(6);
  }, [operationFilter, categoryFilter, searchQuery]);
  
  // Interactive testing state to show/hide dynamic land/lot catalog
  const [showCatalog, setShowCatalog] = useState(true);

  // Swipe mechanics states for mobile touch carousel
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      // Swiped Left -> go next
      setStarActiveSlide(prev => (prev + 1) % starSlides.length);
    } else if (diff < -50) {
      // Swiped Right -> go prev
      setStarActiveSlide(prev => (prev - 1 + starSlides.length) % starSlides.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Image Modal state (Full screen view for properties)
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  // Zoom video state and fallback self-healing mechanisms
  const [zoomVideoSrc, setZoomVideoSrc] = useState<string>("");
  const [triedZoomFallback, setTriedZoomFallback] = useState(false);

  React.useEffect(() => {
    if (activeZoomImage) {
      const list = getSourcesList(activeZoomImage);
      setZoomVideoSrc(list[0] || activeZoomImage);
      setTriedZoomFallback(false);
    } else {
      setZoomVideoSrc("");
    }
  }, [activeZoomImage]);

  // Property Details popup state
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);
  const [activeDetailsProperty, setActiveDetailsProperty] = useState<any | null>(null);

  // Load shared property from URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const propId = urlParams.get('p');
    if (propId && allPropertiesCombined.length > 0 && !activeDetailsProperty) {
      const prop = allPropertiesCombined.find(p => p.id === propId);
      if (prop) {
        setActiveDetailsProperty(prop);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
    }
  }, [allPropertiesCombined, activeDetailsProperty]);

  // Slugify helper for SEO-friendly URLs
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') // remove accents
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .trim()
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // collapse hyphens
  };

  // URL listener for Search Engine Optimization and On-Page deep indexing
  React.useEffect(() => {
    if (allPropertiesCombined.length === 0) return;

    const checkUrlForProperty = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '/admin' || path === '/admin/') {
        return;
      }
      
      // Parse paths like /venta/hermosa-casa or /alquiler/departamento-central
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const typeArg = parts[0]; // e.g. "venta" or "alquiler"
        const slugArg = parts[1]; // e.g. "hermosa-casa-en-venta-tercer-barrio"
        
        // Find matching property using its slugified title
        const match = allPropertiesCombined.find(p => {
          const pSlug = slugify(p.title);
          return pSlug === slugArg || pSlug.includes(slugArg) || slugArg.includes(pSlug) || p.id === slugArg;
        });

        if (match) {
          setActiveDetailsProperty(match);
        }
      }
    };

    // Run on mount or when properties load
    checkUrlForProperty();

    // Listen to popstate event (browser back/forward buttons)
    window.addEventListener('popstate', checkUrlForProperty);
    return () => {
      window.removeEventListener('popstate', checkUrlForProperty);
    };
  }, [allPropertiesCombined]);

  // Sync state changes of activeDetailsProperty back to the URL to create smooth dynamic stateful URLs
  React.useEffect(() => {
    if (activeDetailsProperty) {
      const pSlug = slugify(activeDetailsProperty.title);
      const categoryPath = activeDetailsProperty.type === 'rent' ? 'alquiler' : 'venta';
      const newPath = `/${categoryPath}/${pSlug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ propertyId: activeDetailsProperty.id }, '', newPath);
        
        // Also update document title dynamics for ultra-high-converting CTR on SEO previews
        document.title = `${activeDetailsProperty.title} | AG Inmobiliaria`;
      }
    } else {
      if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/admin')) {
        window.history.pushState(null, '', '/');
        document.title = `AG Servicios Inmobiliarios | Terrenos, Casas y Departamentos en Venta en Paraguay`;
      }
    }
  }, [activeDetailsProperty]);

  // Format currency helpers for Paraguay (Gs.)
  const formatGs = (num: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0
    }).format(num).replace('PYG', 'Gs.');
  };

  // WhatsApp link generator
  const getWaLink = (message: string) => {
    const cleanNum = whatsappNumber.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp link generator for custom dynamically loaded properties (exclusively routes to Sara Genes)
  const getWaLinkForProperty = (p: any, message: string) => {
    const cleanNum = whatsappNumber.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
  };

  // Star Property Slides (Curated high-end ecological footage and nature photos of loteamiento)
  const [homePageSettings, setHomePageSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homePage"), (docSnap) => {
      if (docSnap.exists()) {
        setHomePageSettings(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  const starSlides = useMemo(() => [
    {
      title: homePageSettings?.heroVideoTitle || "Video Recorrido Loteamiento Km 12 Acaray (Vídeo Principal Estrella)",
      description: homePageSettings?.heroVideoDescription || "¡Existen muchos loteamientos, pero ninguno como este! Terrenos hermosos, llenos de árboles, ambas calles con acceso al Río Acaray.",
      image: "/loteamiento/vista-principal.jpg",
      url: homePageSettings?.heroVideoUrl || "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356",
      sources: [
        homePageSettings?.heroVideoUrl || "https://firebasestorage.googleapis.com/v0/b/the-house-a9aba.firebasestorage.app/o/videos%2FV%C3%ADdeo%20estrella.MOV?alt=media&token=d5299296-0942-41c5-badd-f959d5c91356"
      ],
      type: "video"
    },
    {
      title: "Plano Oficial de Manzanas y Distribución de Lotes",
      description: "Fraccionamiento de alta precisión aprobado por la municipalidad. Examine las dimensiones de cada manzana, lote y el acceso directo público garantizado al Río Acaray en alta resolución.",
      image: "/loteamiento/plano-satelital.svg",
      type: "plano"
    }
  ], [homePageSettings]);

  // Prototipos de Casas, Cabañas y Casas Quintas de nuestro Servicio de Arquitectura
  const architectureSlides = useMemo(() => [
    {
      title: "Residencia 'Bosque & Hormigón Brutal'",
      subtitle: "Estudio de Coexistencia Orgánica",
      description: "Espectacular diseño que integra volúmenes flotantes de hormigón visto y cálidos listones verticales de madera, articulados en torno a un árbol central imponente. El boceto técnico detalla cortes estructurales, cotas de cimentación y un muro de piedra natural que ancla la vivienda al suelo paraguayo bajo un concepto atemporal.",
      image: "/arquitectura/diseno6.jpg (Residencia Techo Inclinado).PNG",
      fallbackImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      positionClass: "object-center",
      bgColor: "#FAFBF9",
      scaleClass: "scale-[1.0]",
      translateClass: "translate-y-0",
      objectFitClass: "object-contain",
      specs: {
        area: "185 m²",
        rooms: "3 Dormitorios",
        bathrooms: "3 Baños Premium",
        time: "140 días de obra",
        tags: ["Árbol Integrado", "Hormigón de Tabla", "Boceto de Ingeniería"]
      }
    },
    {
      title: "Cabaña Alpina 'A-Frame' Premium",
      subtitle: "La Icónica Silueta en Doble Altura",
      description: "Nuestra cabaña triangular optimizada con un impresionante frente vidriado de piso a techo que baña de luz ámbar cada rincón. El plano detalla la modulación de las vigas anguladas de madera curada y la distribución de un loft abierto flotante, ideal para contemplar el paisaje arbolado de Alto Paraná.",
      image: "/arquitectura/diseno5.jpg (Bungalow Brutalismo Tropical).PNG",
      fallbackImage: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80",
      positionClass: "object-center",
      bgColor: "#FAFBF9",
      scaleClass: "scale-[1.0]",
      translateClass: "translate-y-0",
      objectFitClass: "object-contain",
      specs: {
        area: "65 m²",
        rooms: "1 Loft Suite",
        bathrooms: "1 Baño de autor",
        time: "90 días de obra",
        tags: ["Geometría Triangular", "Loft Integrado", "Estructura Vista"]
      }
    },
    {
      title: "Refugio Minimalista 'Retiro Alpino'",
      subtitle: "Calidez de Madera sobre Altura",
      description: "Un refugio compacto de líneas depuradas y techo a dos aguas de gran pendiente, asentado sobre una plataforma elevada. La planimetría resalta la optimización del espacio interior con calefacción integrada y ventanales orientados a las siluetas de pináceas, logrando un ambiente cálido e íntimo de desconexión.",
      image: "/arquitectura/diseno4.jpg (Pabellón Modular Cristal & Acero).PNG",
      fallbackImage: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
      positionClass: "object-center",
      bgColor: "#FAFBF9",
      scaleClass: "scale-[1.0]",
      translateClass: "translate-y-0",
      objectFitClass: "object-contain",
      specs: {
        area: "48 m²",
        rooms: "1 Dormitorio",
        bathrooms: "1 Baño de Diseño",
        time: "75 días de obra",
        tags: ["Plataforma Volada", "Aislamiento Térmico", "Boceto de Paisaje"]
      }
    },
    {
      title: "Pabellón Modular 'Cristal & Acero'",
      subtitle: "Vivienda Contemporánea de Perfiles Industriales",
      description: "Estructuras modulares con marcos de acero negro y frentes acristalados continuos de máxima translucidez. El dibujo técnico de la elevación ilustra el juego de volúmenes, la losa de base plana de hormigón pulido y la terraza perimetral, ideal para parcelas donde el exterior es el verdadero protagonista.",
      image: "/arquitectura/diseno3.jpg (Refugio Retiro Alpino).PNG",
      fallbackImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      positionClass: "object-center",
      bgColor: "#FAFBF9",
      scaleClass: "scale-[1.0]",
      translateClass: "translate-y-0",
      objectFitClass: "object-contain",
      specs: {
        area: "120 m²",
        rooms: "2 Dormitorios",
        bathrooms: "2 Baños minimalistas",
        time: "110 días de obra",
        tags: ["Estructura Metálica", "Muros de Vidrio", "Plano de Elevaciones"]
      }
    },
    {
      title: "Bungalow 'Brutalismo Tropical Eco'",
      subtitle: "Fusión Sostenible de Bambú y Tierra",
      description: "Una obra de arte sustentable que fusiona paredes curvas de tierra apisonada y hormigón rústico con una majestuosa cubierta inclinada de bambú. Los planos muestran el encastre de las uniones de bambú sismo-resistentes y la ventilación natural inducida por convección térmica, rodeado en su totalidad de vegetación autóctona.",
      image: "/arquitectura/diseno2.jpg (Cabaña Alpina A-Frame).PNG",
      fallbackImage: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
      positionClass: "object-center",
      bgColor: "#FAFBF9",
      scaleClass: "scale-[1.0]",
      translateClass: "translate-y-0",
      objectFitClass: "object-contain",
      specs: {
        area: "155 m²",
        rooms: "2 Suites",
        bathrooms: "2 Baños Orgánicos",
        time: "130 días de obra",
        tags: ["Techo Inclinado de Bambú", "Hormigón de Curva", "Fusión Verde"]
      }
    },
    {
      title: "Residencia de Diseño 'Techo Inclinado'",
      subtitle: "Vanguardia de un Solo Pendiente",
      description: "Vivienda unifamiliar con un imponente techo de madera de una sola vertiente que genera una espacialidad interior espectacular de doble altura. Las elevaciones técnicas proyectan la entrada de luz indirecta superior, marcos de aluminio minimalista y una integración fluida hacia un porche techado con asador.",
      image: "/arquitectura/diseno1.jpg (Bosque & Hormigón Brutal).PNG",
      fallbackImage: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      positionClass: "object-center",
      bgColor: "#FAFBF9",
      scaleClass: "scale-[1.0]",
      translateClass: "translate-y-0",
      objectFitClass: "object-contain",
      specs: {
        area: "225 m²",
        rooms: "3 Dormitorios Suites",
        bathrooms: "4 Baños",
        time: "170 días de obra",
        tags: ["Doble Altura Real", "Monocubierta Inclinada", "Detalles Técnicos"]
      }
    }
  ], []);

  // Filter and Sort properties
  const filteredProperties = useMemo(() => {
    let result = allPropertiesCombined.filter(p => {
      // Operation filter
      if (operationFilter !== 'all' && p.type !== operationFilter) return false;
      
      // Category filter (flex logic para terrernos)
      if (categoryFilter !== 'all') {
        const pCat = String(p.category || '').toLowerCase();
        if (categoryFilter === 'land') {
          if (!(pCat === 'land' || pCat.includes('terreno') || pCat.includes('lote'))) {
            return false;
          }
        } else if (p.category !== categoryFilter) {
          return false;
        }
      }

      // Search Location/Title
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(query) || p.location.toLowerCase().includes(query);
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceRaw - b.priceRaw;
      if (sortBy === 'price-desc') return b.priceRaw - a.priceRaw;
      if (sortBy === 'nature') return b.natureScore - a.natureScore;
      return 0; // Default unordered
    });

    // Regla de Negocio: Completar la grilla inicial de 6 tarjetas si los filtros 
    // dejan muy pocas propiedades, tomando del array general para que la pantalla no se vea vacía.
    // Además, sumamos todas las restantes para que el botón "Ver Más" siga operativo.
    if (result.length < 6 && allPropertiesCombined.length > result.length) {
      const missing = allPropertiesCombined.filter(p => !result.some(r => r.id === p.id));
      result = [...result, ...missing];
    }

    return result;
  }, [allPropertiesCombined, operationFilter, categoryFilter, searchQuery, sortBy]);

  const getEditableCopy = (id: string, fallback: string) => {
    const item = customBlocks.find(b => b.id === id);
    return item ? item.content : fallback;
  };

  return (
    <div id="ag-inmobiliaria-container" className="w-full bg-white text-[#2C2E2B] min-h-screen font-sans selection:bg-[#82B515] selection:text-white antialiased">
      
      {/* 🌿 TOP ECOLOGICAL STRIP */}
      <div className="bg-[#2E312D] text-[#E0E5DF] text-[11px] py-2 px-4 shadow-sm border-b border-[#3D423C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#82B515] animate-pulse" />
            <span className="font-medium tracking-wide">Experiencia Acaray: Últimos terrenos costeros con financiación directa</span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="opacity-80">Atención: Lunes a Sábados (07:30 - 17:30)</span>
            <span className="bg-[#82B515]/30 text-[#A6E22C] px-1.5 py-0.5 rounded text-[9px] font-bold">SOLA FIRMA</span>
          </div>
        </div>
      </div>

      {/* 💻 NAVIGATION HEADER WITH LOGO RECREATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7EAE5] shadow-[0_2px_15px_-4px_rgba(130,181,21,0.05)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Original Logo changed dynamically based on user request */}
          <a href="#production-landing-root" className="flex items-center gap-3 md:gap-3.5 group">
            <div className="relative w-14 h-12 overflow-hidden shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/d/1uiRtD0hcOAqS4zHDJJ_x7Th5UOFndIaR" 
                alt="AG LOGO" 
                className="absolute top-0 left-0 w-full h-[132.55%] object-cover object-top transform group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex flex-col">
              <span className="font-sans font-bold text-lg md:text-xl text-[#3D403E] tracking-tight leading-none">
                AG
              </span>
              <span className="text-[10px] md:text-[11px] font-semibold text-[#82B515] uppercase tracking-widest leading-none mt-1">
                Servicios Inmobiliarios
              </span>
              <span className="text-[7.5px] uppercase tracking-[0.22em] text-[#758B9C] leading-none mt-0.5">
                INMOBILIΛRIOS • CDE
              </span>
            </div>
          </a>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-[#5B6358]">
            <a href="#estrella" className="hover:text-[#82B515] transition-colors">🌟 Inmueble Estrella</a>
            {showCatalog && (
              <a href="#catalogo" className="hover:text-[#82B515] transition-colors">🏡 Propiedades</a>
            )}
            <a href="#inversion" className="hover:text-[#82B515] transition-colors">📈 Análisis de Zona</a>
            <a href="#naturaleza" className="hover:text-[#82B515] transition-colors">🌿 Ecosistema AG</a>
            <a href="#contacto" className="hover:text-[#82B515] transition-colors">📞 Contacto</a>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 mr-1 text-[#2C2E2B]">
              <a 
                href="https://www.instagram.com/aginmobiliariapy/" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-[#82B515] transition-colors"
                title="Instagram"
              >
                <Instagram size={22} strokeWidth={1.75} />
              </a>
              <a 
                href="https://www.facebook.com/aginmopy" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-[#82B515] transition-colors"
                title="Facebook"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
            <a 
              href={getWaLink("Hola! Deseo recibir el catálogo completo de propiedades con financiación de AG Servicios Inmobiliarios.")}
              target="_blank"
              rel="noreferrer"
              onClick={() => onSimulateLead("Header Catálogo CTA", "Clic en WhatsApp del cabezal para pedir catálogo.")}
              className="flex items-center gap-1.5 bg-[#82B515] hover:bg-[#72A012] text-white px-4 py-2 rounded-full text-xs font-bold transition-all hover:shadow-[0_4px_12px_rgba(130,181,21,0.25)]"
            >
              <Phone size={13} className="fill-current" />
              <span className="hidden sm:inline">Invertir Ahora</span>
            </a>
          </div>

        </div>
      </header>

      {/* 🌟 HERO SECTION - HIGHLIGHTING THE STAR PROPERTY PROPERTY IN CAROUSEL */}
      <section id="estrella" className="relative pt-6 pb-16 md:py-16 px-4 max-w-7xl mx-auto">
        <div className="absolute inset-0 bg-[radial-gradient(#82B515_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.25] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-12 w-full items-start justify-center">
          
          {/* MEDIA CONTENT (LEFT ON DESKTOP) */}
          <div className="flex flex-col items-center justify-center w-full md:w-[45%] lg:w-[400px] shrink-0 order-last md:order-first">
            {/* Main Large Sliding Image Container */}
            <div className="flex flex-col gap-4 w-full">
              <div 
                className={`relative bg-stone-950 rounded-3xl overflow-hidden shadow-xl w-full aspect-[9/16]`}
                onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              
              {/* Map slides */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={starActiveSlide}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  {starSlides[starActiveSlide].type === 'video' ? (
                    <SafeVideoPlayer
                      src={starSlides[starActiveSlide].url}
                      className="w-full h-full rounded-3xl"
                      poster={starSlides[starActiveSlide].image}
                      onZoom={() => {
                        const slide = starSlides[starActiveSlide];
                        setActiveZoomImage(slide.url || slide.image);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full relative rounded-3xl overflow-hidden bg-stone-900 select-none">
                      {/* Active image path selection */}
                      {selectedPlanoView === 'satelital' ? (
                        <div 
                          className="w-full h-full cursor-zoom-in relative bg-stone-950 flex items-center justify-center p-1 md:p-2"
                          onClick={() => setActiveZoomImage('/loteamiento/plano-satelital.svg')}
                        >
                          <img 
                            src="/loteamiento/plano-satelital.svg" 
                            alt="Plano Satelital Lotes" 
                            className="w-full h-full object-contain scale-100 transition duration-500 rounded-3xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-full h-full cursor-zoom-in relative bg-[#FAFBF9] flex items-center justify-center p-2 md:p-4"
                          onClick={() => setActiveZoomImage('/loteamiento/plano-tecnico.svg')}
                        >
                          <img 
                            src="/loteamiento/plano-tecnico.svg" 
                            alt="Plano Técnico CAD" 
                            className="w-full h-full object-contain scale-100 transition duration-500 rounded-3xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Beautiful Dual Toggle Switch Overlay */}
                      <div className="absolute top-4 left-4 z-20 bg-stone-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-1 shadow-lg max-w-[90%]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanoView('satelital');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                            selectedPlanoView === 'satelital'
                              ? 'bg-[#82B515] text-white shadow'
                              : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          🗺️ Satelital
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanoView('tecnico');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                            selectedPlanoView === 'tecnico'
                              ? 'bg-[#82B515] text-white shadow shadow-black/20'
                              : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          📐 Técnico CAD
                        </button>
                      </div>

                      {/* Floating helpful badge */}
                      <div className="absolute bottom-4 right-4 z-10 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-bold text-white tracking-widest uppercase flex items-center gap-1">
                        🔍 Clic para Ampliar
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Slider Controls Inside - Clean and Floating */}
              <button 
                type="button"
                onClick={() => setStarActiveSlide(prev => (prev - 1 + starSlides.length) % starSlides.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 hover:p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-md border border-white/10 active:scale-95 z-20 cursor-pointer shadow-lg"
                aria-label="Imagen Anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <button 
                type="button"
                onClick={() => setStarActiveSlide(prev => (prev + 1) % starSlides.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 hover:p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-md border border-white/10 active:scale-95 z-20 cursor-pointer shadow-lg"
                aria-label="Siguiente Imagen"
              >
                <ChevronRight size={18} />
              </button>

            </div>

          </div>
          </div>

          {/* TEXT INFO CONTENT (RIGHT ON DESKTOP) */}
          <div className="flex flex-col justify-start gap-4 md:py-2 w-full flex-1 max-w-lg mx-auto md:mx-0">
            <div className="flex flex-col gap-4 relative z-10 w-full">
              
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#82B515] bg-[#82B515]/10 px-2.5 py-1 rounded-full w-max inline-flex items-center gap-1">
                  <Sparkles size={11} className="fill-current" /> {homePageSettings?.heroBadge || "Inversión Inmobiliaria Segura"}
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold text-[#3D403E] tracking-tight leading-tight">
                  {homePageSettings?.heroTitle || getEditableCopy("hero-h1", "Lotes en Venta en Ciudad del Este - Experience Acaray Km 12")}
                </h2>
                <p className="text-xs md:text-sm text-[#5B6358] max-w-xl leading-relaxed">
                  {homePageSettings?.heroDescription || "Terrenos hermosos con financiación directa en Paraguay, llenos de árboles, y doble acceso directo al Río Acaray. Tu sueño de casa quinta en Minga Guazú o inversión inmobiliaria segura empieza hoy con posesión inmediata."}
                </p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#E7EAE5] flex flex-row items-center justify-between gap-4 text-xs shadow-sm w-full">
                <div className="text-left">
                  <span className="text-[9px] text-[#758B9C] font-semibold uppercase block leading-none mb-1.5">Cuota Mensual Desde</span>
                  <span className="text-lg md:text-xl font-black text-[#82B515] block tracking-tight text-nowrap">{homePageSettings?.heroMonthlyFee || "Gs. 1.300.000"}</span>
                </div>
                <div className="w-px h-8 bg-[#E7EAE5]" />
                <div className="text-left">
                  <span className="text-[9px] text-[#758B9C] font-semibold uppercase block leading-none mb-1.5">Financiación en Paraguay</span>
                  <span className="text-sm font-bold text-[#3D403E] block">{homePageSettings?.heroFinancing || "Terrenos a Sola Firma"}</span>
                </div>
              </div>

            </div>
            {/* Premium Information Card - Cleanly Separated Below the Video with spacious padding so letters don't hug the border */}
            <div className="bg-[#FAFBF9] border border-[#E7EAE5] rounded-3xl p-4 sm:p-5 space-y-3 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-[#82B515]/10 text-[#82B515] text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 border border-[#82B515]/20">
                    <span className="h-1 w-1 rounded-full bg-[#82B515] animate-pulse" /> Km 12 Acaray
                  </span>
                  <span className="bg-[#6D97CE]/10 text-[#6D97CE] text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#6D97CE]/20">
                    🌊 COSTA DE RÍO
                  </span>
                  {starSlides[starActiveSlide].type === 'video' ? (
                    <span className="bg-amber-500/10 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest flex items-center gap-1 border border-amber-500/20">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      REPRODUCIENDO VÍDEO
                    </span>
                  ) : (
                    <span className="bg-[#82B515]/10 text-[#82B515] text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 border border-[#82B515]/20">
                      📐 IMAGEN DE PLANO
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-[9px] font-mono text-[#5B6358]">
                  <span className="hidden sm:inline text-stone-400">👈 Desliza para explorar 👉</span>
                  <span className="bg-[#3D403E] text-white px-2 py-0.5 rounded font-bold">
                    {starActiveSlide + 1} de {starSlides.length}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#82B515] tracking-widest uppercase block">
                  {starSlides[starActiveSlide].type === 'video' 
                    ? '🛸 Toma Aérea Cinematográfica' 
                    : '📐 Distribución de Lotes y Manzanas'}
                </span>
                <h3 className="text-sm md:text-base font-bold text-[#3D403E] tracking-tight">
                  {starSlides[starActiveSlide].title}
                </h3>
                <p className="text-[11px] md:text-xs text-[#5B6358] leading-relaxed max-w-full">
                  {starSlides[starActiveSlide].description}
                </p>
              </div>

              {/* Direct Instant Action Container */}
              <div className="space-y-2 pt-2.5 border-t border-[#E7EAE5]">
                <a 
                  href={getWaLink(`Hola ${agentName}, vi el video y plano del 'Loteamiento Experience Acaray Km 12'. Quiero agendar una visita presencial para conocer los terrenos.`)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onSimulateLead("Carrusel Estrella WhatsApp", `Consulta por el video/plano del loteamiento`)}
                  className="w-full text-center bg-[#82B515] hover:bg-[#72A012] text-white font-bold py-2 px-4 rounded-xl block transition shadow-sm hover:shadow-[0_4px_12px_rgba(130,181,21,0.25)] text-[11px] md:text-xs"
                >
                  📲 Coordinar Visita Presencial
                </a>
              </div>
            </div>

            {/* Thumbnail selector strips */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {starSlides.map((slide, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStarActiveSlide(idx)}
                  className={`relative rounded-xl overflow-hidden h-14 transition-all duration-300 border-2 ${
                    starActiveSlide === idx 
                      ? 'border-[#82B515] scale-[1.02] ring-4 ring-[#82B515]/10 shadow-sm' 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-[1.01]'
                  } cursor-pointer`}
                >
                  <img 
                    src={slide.image} 
                    alt={slide.title} 
                    className="w-full h-full object-cover select-none" 
                    referrerPolicy="no-referrer" 
                  />
                  
                  {slide.type === 'video' ? (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-[#82B515]">
                      <svg className="w-4 h-4 fill-current drop-shadow-md animate-pulse" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center text-white">
                      <span className="text-[9px] font-extrabold tracking-widest bg-[#82B515]/90 px-2 py-0.5 rounded text-white uppercase shadow-sm">
                        Plano
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1 text-[7px] text-white font-mono scale-90">
                    {slide.type === 'video' ? 'VÍDEO' : 'PLANO'}
                  </div>
                </button>
              ))}
            </div>
            
          </div>

        </div>

      </section>

      {/* 🌿 NATURE CONNECT STATEMENT & BIOPHILIC MANIFESTO */}
      <section id="naturaleza" className="py-16 bg-[#2E312D] text-[#E0E5DF] relative overflow-hidden px-4">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          {/* Abstract leaf shape decorator */}
          <svg className="w-96 h-96 fill-[#82B515]" viewBox="0 0 100 100">
            <path d="M10 80 Q 50 10, 90 80 T 10 80 Z" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="h-10 w-10 bg-[#82B515]/20 text-[#82B515] rounded-full flex items-center justify-center mx-auto mb-2 border border-[#82B515]/30">
            🌿
          </div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#82B515] font-black block">
            NUESTRA FILOSOFÍA DE INTEGRACIÓN RESIDENCIAL
          </span>
          <h2 className="text-2xl md:text-3.5xl font-sans font-bold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            {getEditableCopy("solucion-h2", "Viviendas y Casas Quinta en Minga Guazú que respiran en sintonía con el agua")}
          </h2>
          <div className="h-1 w-16 bg-[#82B515] mx-auto rounded-full" />
          
          <p className="text-sm md:text-base text-[#B0BCAE] leading-relaxed max-w-2xl mx-auto font-light">
            En AG Servicios Inmobiliarios no vendemos selva arrasada. Curamos lotes en venta en Ciudad del Este y terrenos con financiación directa en Paraguay con un sello ecológico nativo. Preservamos las especies arbóreas originales, asegurando tu inversión inmobiliaria segura.
          </p>

          {/* Mini features strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 max-w-3xl mx-auto text-xs">
            <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
              <span className="font-bold text-white block">🌱 Árboles Protegidos</span>
              <p className="text-[#B0BCAE]">Garantizamos terrenos con flora madura para sombra y microclima fresco inmediato.</p>
            </div>
            <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
              <span className="font-bold text-white block">💧 Gestión Fluvial</span>
              <p className="text-[#B0BCAE]">Construcciones que respetan las cuotas de inundación y protegen la costa natural.</p>
            </div>
            <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
              <span className="font-bold text-white block">☀️ Arquitectura Bioclimática</span>
              <p className="text-[#B0BCAE]">Sugerimos diseños pasivos de solárium y ventilación cruzada en Alto Paraná.</p>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              id="nature-inversion-cta"
              type="button"
              onClick={() => setShowInversionModal(true)}
              className="bg-[#82B515] hover:bg-[#72A012] text-white font-extrabold py-3.5 px-8 rounded-xl transition duration-200 active:scale-95 shadow-lg hover:shadow-[0_4px_16px_rgba(130,181,21,0.35)] text-xs md:text-sm cursor-pointer flex items-center gap-2 group"
            >
              <span>📊 Sepa por Qué Invertir en el Km 12</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 🏡 PROPERTIES CATALOG CATALOG WITH AVANZADOS FILTROS (ALQUILER & VENTA) */}
      {showCatalog && (
        <section id="catalogo" className="py-20 px-4 max-w-7xl mx-auto">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#82B515] bg-[#82B515]/10 px-2.5 py-1 rounded-full w-max mx-auto block">
            Catálogo Disponible
          </span>
          <h2 className="text-2xl md:text-3xl font-sans font-bold text-[#3D403E] tracking-tight">
            Explora Lotes en Venta en Ciudad del Este y Más
          </h2>
          <p className="text-xs md:text-sm text-[#5B6358]">
            Descubre casas quinta en Minga Guazú y terrenos con financiación directa en Paraguay. Tu próxima inversión inmobiliaria segura con posesión inmediata te espera.
          </p>
        </div>

        {/* 🎛️ FILTROS DE OPERACIÓN & CATEGORÍA (ALQUILER / VENTA) */}
        <div className="bg-[#FAFBF9] border border-[#E7EAE5] rounded-3xl p-5 md:p-6 mb-8 space-y-5 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.01)]">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Operation Selector Tabs */}
            <div className="space-y-1.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-[#758B9C] tracking-wider block">Tipo de Operación:</span>
              <div className="bg-[#FAFBF9] border border-[#E7EAE5] p-1 rounded-xl flex gap-1 w-max">
                <button
                  type="button"
                  onClick={() => setOperationFilter('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    operationFilter === 'all' 
                      ? 'bg-[#82B515] text-white shadow-xs' 
                      : 'text-[#5B6358] hover:bg-[#E7EAE5]/50'
                  }`}
                >
                  Todos ({allPropertiesCombined.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOperationFilter('sale')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    operationFilter === 'sale' 
                      ? 'bg-[#82B515] text-white shadow-xs' 
                      : 'text-[#5B6358] hover:bg-[#E7EAE5]/50'
                  }`}
                >
                  En Venta ({allPropertiesCombined.filter(p=>p.type==='sale').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOperationFilter('rent')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    operationFilter === 'rent' 
                      ? 'bg-[#82B515] text-white shadow-xs' 
                      : 'text-[#5B6358] hover:bg-[#E7EAE5]/50'
                  }`}
                >
                  En Alquiler ({allPropertiesCombined.filter(p=>p.type==='rent').length})
                </button>
              </div>
            </div>

            {/* Live Search Input */}
            <div className="space-y-1.5 flex-1 max-w-md">
              <span className="text-[10px] uppercase font-bold text-[#758B9C] tracking-wider block">Buscá por término geográfico:</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#758B9C]">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej. Km 12 Acaray, Hernandarias, Paraná Country..."
                  className="w-full bg-[#FAFBF9] border border-[#E7EAE5] rounded-xl pl-9 pr-4 py-2 text-xs text-[#3D403E] placeholder-[#5B6358]/55 focus:outline-none focus:border-[#82B515] focus:ring-1 focus:ring-[#82B515]/30"
                />
                {searchQuery && (
                   <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold block">✕</button>
                )}
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-1.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-[#758B9C] tracking-wider block">Ordenar Catálogo:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-[#FAFBF9] border border-[#E7EAE5] p-2.5 rounded-xl text-xs font-medium text-[#5B6358] focus:outline-none focus:border-[#82B515]"
              >
                <option value="default">Relevancia por Defecto</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="nature">Sintonía con la Naturaleza</option>
              </select>
            </div>

          </div>

          {/* Curated Category Microchips */}
          <div className="pt-2 border-t border-[#E7EAE5] flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] text-[#758B9C] font-semibold uppercase mr-2 tracking-wider">Filtrar Categoría:</span>
            
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                categoryFilter === 'all' 
                  ? 'bg-[#2E312D] text-white border-transparent' 
                  : 'bg-white text-[#5B6358] border-[#E7EAE5] hover:bg-[#E7EAE5]/30'
              }`}
            >
              Cualquiera ({allPropertiesCombined.length})
            </button>
            <button
              onClick={() => setCategoryFilter('house')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                categoryFilter === 'house' 
                  ? 'bg-[#2E312D] text-white border-transparent' 
                  : 'bg-white text-[#5B6358] border-[#E7EAE5] hover:bg-[#E7EAE5]/30'
              }`}
            >
              Casas ({allPropertiesCombined.filter(p=>p.category==='house').length})
            </button>
            <button
              onClick={() => setCategoryFilter('cabin')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                categoryFilter === 'cabin' 
                  ? 'bg-[#2E312D] text-white border-transparent' 
                  : 'bg-white text-[#5B6358] border-[#E7EAE5] hover:bg-[#E7EAE5]/30'
              }`}
            >
              Cabañas Quinta ({allPropertiesCombined.filter(p=>p.category==='cabin').length})
            </button>
            <button
              onClick={() => setCategoryFilter('apartment')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                categoryFilter === 'apartment' 
                  ? 'bg-[#2E312D] text-white border-transparent' 
                  : 'bg-white text-[#5B6358] border-[#E7EAE5] hover:bg-[#E7EAE5]/30'
              }`}
            >
              Departamentos ({allPropertiesCombined.filter(p=>p.category==='apartment').length})
            </button>
            <button
              onClick={() => setCategoryFilter('land')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                categoryFilter === 'land' 
                  ? 'bg-[#2E312D] text-white border-transparent' 
                  : 'bg-white text-[#5B6358] border-[#E7EAE5] hover:bg-[#E7EAE5]/30'
              }`}
            >
              Lotes / Terrenos ({allPropertiesCombined.filter(p=>p.category==='land').length})
            </button>
            <button
              onClick={() => setCategoryFilter('duplex')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                categoryFilter === 'duplex' 
                  ? 'bg-[#2E312D] text-white border-transparent' 
                  : 'bg-white text-[#5B6358] border-[#E7EAE5] hover:bg-[#E7EAE5]/30'
              }`}
            >
              Dúplex ({allPropertiesCombined.filter(p=>p.category==='duplex').length})
            </button>
            <button
              onClick={() => setCategoryFilter('commercial')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                categoryFilter === 'commercial' 
                  ? 'bg-[#2E312D] text-white border-transparent' 
                  : 'bg-white text-[#5B6358] border-[#E7EAE5] hover:bg-[#E7EAE5]/30'
              }`}
            >
              Comerciales / Oficinas ({allPropertiesCombined.filter(p=>p.category==='commercial').length})
            </button>

            {/* Regla Definitiva: Limpiar la búsqueda resetea estricto a operación=TODOS y visible=6 */}
            {(operationFilter !== 'all' || categoryFilter !== 'land' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setOperationFilter('all');
                  setCategoryFilter('land');
                  setSearchQuery('');
                  setVisibleCount(6);
                }}
                className="ml-auto px-4 py-1.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase text-white bg-red-500/90 hover:bg-red-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-500/20"
              >
                <span>Limpiar Búsqueda</span>
                <X size={12} strokeWidth={3} />
              </button>
            )}

          </div>

        </div>

        {/* 📦 GRID DE PROPIEDADES REALES */}
        <AnimatePresence mode="popLayout">
          {filteredProperties.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center border-2 border-dashed border-[#E7EAE5] rounded-3xl"
            >
              <div className="text-4xl">🍃</div>
              <p className="mt-2 text-[#5B6358] text-sm font-semibold">No encontramos propiedades con los filtros seleccionados.</p>
              <button 
                onClick={() => { setOperationFilter('all'); setCategoryFilter('land'); setSearchQuery(''); setVisibleCount(6); }}
                className="mt-3.5 text-xs font-bold text-[#82B515] underline decoration-2 cursor-pointer"
              >
                Restablecer todos los filtros
              </button>
            </motion.div>
          ) : (
            <div className="space-y-12">
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
              >
                {filteredProperties.slice(0, visibleCount).map((p) => {
                  const isSale = p.type === 'sale';
                  return (
                    <motion.article
                      key={p.id}
                      layoutId={p.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35 }}
                      className="bg-[#FAFBF9] border border-[#E7EAE5] rounded-3xl overflow-hidden group hover:shadow-[0_8px_25px_-4px_rgba(46,49,45,0.06)] hover:border-[#82B515]/30 transition-all flex flex-col justify-between"
                    >
                      
                      {/* Media Container */}
                      <div className="relative overflow-hidden aspect-[4/3] w-full shrink-0 bg-stone-100">
                        
                        {/* Interactive zoom image or video carousel */}
                        <PropertyMediaCarousel
                          images={p.images}
                          video={p.video}
                          title={p.title}
                          onZoom={(url) => setActiveZoomImage(url)}
                        />

                        {/* Floating Indicator Operation type */}
                        <span className={`absolute top-3.5 left-3.5 text-[9px] uppercase font-black tracking-widest text-[#FAFBF9] px-2.5 py-1 rounded-md shadow-xs ${
                          isSale ? 'bg-[#82B515]' : 'bg-[#6D97CE]'
                        }`}>
                          {isSale ? 'Compra (Venta)' : 'Alquiler Directo'}
                        </span>

                        {/* Special Highlight Badges */}
                        {p.highlightFeature && (
                          <span className="absolute bottom-3.5 left-3.5 bg-[#2E312D]/85 backdrop-blur-md text-[#FAFBF9] text-[9.5px] font-bold px-2.5 py-1 rounded-md border border-white/15">
                            ✨ {p.highlightFeature}
                          </span>
                        )}

                        {/* Small leaf nature score gauge */}
                        <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-0.5" title="Sintonía biológica">
                          <span>🌿</span>
                          <span className="font-bold">{p.natureScore}/5</span>
                        </div>

                      </div>

                      {/* Property Meta Body */}
                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          
                          {/* Geographic address */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-[#758B9C] font-semibold flex items-center gap-1">
                              <MapPin size={11} className="text-[#82B515]" /> {p.location}
                            </span>
                            {p.googleMapsLink && (
                              <a
                                href={p.googleMapsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[9px] bg-emerald-50/65 hover:bg-emerald-100 text-[#82B515] hover:text-[#5d820f] font-bold px-1.5 py-0.5 rounded transition flex items-center gap-0.5 border border-emerald-100/50"
                              >
                                🗺️ Ver Mapa
                              </a>
                            )}
                          </div>

                          <h3 className="font-sans font-bold text-base text-[#3D403E] tracking-tight group-hover:text-[#82B515] transition-colors leading-snug">
                            {p.title}
                          </h3>

                          <div className="space-y-1.5 pb-1">
                            <p className="text-xs text-[#5B6358] line-clamp-3 leading-relaxed font-light">
                              {p.description}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDetailsProperty(p);
                              }}
                              className="text-[11px] font-bold text-[#82B515] hover:text-[#2E312D] transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Seguir leyendo todo</span>
                              <ArrowRight size={10} strokeWidth={2.5} />
                            </button>
                          </div>

                        </div>

                        {/* Specs indicator line */}
                        <div className="pt-3 border-t border-[#E7EAE5] grid grid-cols-3 gap-2 text-center text-[11px] text-[#5B6358] shrink-0">
                          {p.bedrooms ? (
                            <div>
                              <span className="block text-[8px] text-[#758B9C] uppercase font-bold leading-none">Dorm.</span>
                              <span className="font-bold block mt-1">{p.bedrooms} habs.</span>
                            </div>
                          ) : (
                            <div>
                              <span className="block text-[8px] text-[#758B9C] uppercase font-bold leading-none">Categoría</span>
                              <span className="font-bold block mt-1 text-[10px] truncate capitalize">{getCategoryLabel(p.category)}</span>
                            </div>
                          )}
                          <div>
                            <span className="block text-[8px] text-[#758B9C] uppercase font-bold leading-none">Baño</span>
                            <span className="font-bold block mt-1">{p.bathrooms || "N/A"}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-[#758B9C] uppercase font-bold leading-none">Superficie</span>
                            <span className="font-bold block mt-1 text-[10px] leading-tight whitespace-pre-line">{p.area}</span>
                          </div>
                        </div>

                      </div>

                      {/* Pricing section and WhatsApp triggers footer */}
                      <div className="p-5 pt-0 shrink-0">
                        <div className="bg-[#FAFBF9] border border-[#E7EAE5] rounded-2xl p-3 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[8px] uppercase tracking-wider text-[#758B9C] block leading-none">Inversor</span>
                              <span className="font-bold text-[#82B515] text-sm md:text-base block mt-1 tracking-tight">{p.price}</span>
                            </div>
                            
                            <a 
                              href={getWaLinkForProperty(p, `¡Hola Sara Genes! Vi la ficha del lote "${p.title}" (${p.price}) en el catálogo de Ciudad del Este. Deseo más información y coordinar una visita.`)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSimulateLead(`Inquiry Card: ${p.title}`, `Inquire for property ${p.id} price: ${p.price}`);
                              }}
                              className="bg-[#2E312D] hover:bg-[#82B515] text-[#E0E5DF] hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>Consultar</span>
                              <ArrowRight size={12} />
                            </a>
                          </div>


                          <div className="border-t border-[#E7EAE5] pt-3 mt-1 relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareMenuOpen(shareMenuOpen === p.id ? null : p.id);
                              }}
                              className={`w-full group flex items-center justify-center gap-2 text-[11px] md:text-xs font-extrabold uppercase tracking-widest transition-all duration-300 py-3 mt-1 rounded-xl border ${shareMenuOpen === p.id ? 'bg-[#82B515] text-white border-[#82B515] shadow-lg shadow-[#82B515]/30 scale-[0.98]' : 'bg-gradient-to-r from-stone-50 to-stone-100 text-[#506371] border-stone-200 hover:border-[#82B515] hover:text-[#82B515] shadow-sm hover:shadow-md active:scale-[0.98]'}`}
                            >
                              <Share2 size={14} className={`transition-transform duration-500 ${shareMenuOpen === p.id ? '-rotate-12 scale-110' : 'group-hover:rotate-12 group-hover:scale-110'}`} /> 
                              <span>{shareMenuOpen === p.id ? 'Ocultar' : 'Compartir'}</span>
                            </button>
                            
                            {shareMenuOpen === p.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShareMenuOpen(null); }}></div>
                              <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-xl shadow-xl border border-stone-100 py-1 z-50">
                                <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-stone-500 uppercase">Compartir en...</span>
                                  <button onClick={(e) => { e.stopPropagation(); setShareMenuOpen(null); }} className="text-stone-400 hover:text-stone-600">
                                    <X size={12} />
                                  </button>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setShareMenuOpen(null);
                                    const shareUrl = window.location.href.split('#')[0].split('?')[0] + `?p=${p.id}#catalogo`;
                                    const text = `Mira esta excelente propiedad en AG Inmobiliaria: ${p.title} por ${p.price}`;
                                    if (navigator.share) {
                                      try { await navigator.share({ title: 'AG Inmobiliaria', text, url: shareUrl }); return; } catch (err) {}
                                    }
                                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' \n\n' + shareUrl)}`, '_blank');
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-stone-50 transition-colors text-stone-700 cursor-pointer"
                                >
                                  <span className="bg-[#25D366]/10 text-[#25D366] p-1.5 rounded-md"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></span>
                                  WhatsApp
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShareMenuOpen(null);
                                    const shareUrl = window.location.href.split('#')[0].split('?')[0] + `?p=${p.id}#catalogo`;
                                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-stone-50 transition-colors text-stone-700 cursor-pointer"
                                >
                                  <span className="bg-[#1877F2]/10 text-[#1877F2] p-1.5 rounded-md"><Facebook size={14} /></span>
                                  Facebook
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShareMenuOpen(null);
                                    const shareUrl = window.location.href.split('#')[0].split('?')[0] + `?p=${p.id}#catalogo`;
                                    const text = `Mira esta excelente propiedad en AG Inmobiliaria: ${p.title} por ${p.price}`;
                                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-stone-50 transition-colors text-stone-700 cursor-pointer"
                                >
                                  <span className="bg-[#1DA1F2]/10 text-[#1DA1F2] p-1.5 rounded-md"><Twitter size={14} /></span>
                                  X (Twitter)
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShareMenuOpen(null);
                                    const shareUrl = window.location.href.split('#')[0].split('?')[0] + `?p=${p.id}#catalogo`;
                                    navigator.clipboard.writeText(shareUrl);
                                    alert('¡Enlace copiado al portapapeles!');
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-stone-50 transition-colors text-stone-700 cursor-pointer"
                                >
                                  <span className="bg-stone-100 text-stone-600 p-1.5 rounded-md"><Link size={14} /></span>
                                  Copiar enlace
                                </button>
                              </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                    </motion.article>
                  );
                })}
              </motion.div>

              {/* Centered Premium Load More button if there are more properties */}
              {filteredProperties.length > visibleCount && (
                <div className="flex justify-center pt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount(prev => prev + 6)}
                    className="bg-[#2E312D] hover:bg-[#82B515] text-[#FAFBF9] hover:text-white px-8 py-3.5 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer shadow-lg shadow-stone-100 hover:shadow-xl hover:shadow-[#82B515]/10 flex items-center gap-2 border border-stone-200"
                  >
                    <span>Ver Más Propiedades</span>
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>

      </section>
      )}



      {/* 📞 DIGNIFIED CONTACTO SECTION */}
      <section id="contacto" className="py-20 px-4 max-w-7xl mx-auto">
        <div className="bg-[#2E312D] text-[#FAFBF9] rounded-3xl overflow-hidden p-8 md:p-12 shadow-xl relative">
          
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
            <Compass size={180} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <span className="text-[#82B515] text-[11px] font-black uppercase tracking-widest block">
                ATENCIÓN AL CLIENTE INMEDIATA
              </span>
              <h2 className="text-2xl md:text-3.5xl font-sans font-bold tracking-tight text-white leading-tight">
                Asegura tu Inversión Inmobiliaria Segura: Coordinemos una Visita Guiada
              </h2>
              <p className="text-sm text-[#B0BCAE] leading-relaxed max-w-xl font-light">
                Brindamos combustible y camioneta para recorrer el loteamiento sin cargo los días Miércoles y Sábados. Conversá con nuestro experto asignado, resolvemos trámites catastrales ante escribano paraguayo en el mismo día.
              </p>

              {/* Verified Trust badge */}
              <div className="flex gap-4 items-center pt-3 border-t border-white/5 text-xs text-[#E0E5DF]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#82B515]">✔</span> 79 Terrenos Vendidos en 2025
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#82B515]">✔</span> 100% Títulos Registrados
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#82B515]">✔</span> +100 Familias Satisfechas
                </div>
              </div>
            </div>

            {/* Visual card of Assesor */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5 text-center sm:text-left relative">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[#82B515]/20 border-2 border-[#82B515] text-[#82B515] flex items-center justify-center font-extrabold text-2xl relative shrink-0">
                  <span>{agentName.split(' ')[0][0]}</span>
                  <div className="absolute bottom-0 right-0 h-4.5 w-4.5 bg-[#82B515] rounded-full border-2 border-[#FAFBF9] flex items-center justify-center text-[8px] text-white" title="Asesor Certificado AG">✓</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#82B515] block">Asesora Senior Autorizada</span>
                  <h4 className="font-bold text-lg text-white block mt-0.5">{agentName}</h4>
                  <span className="text-xs text-[#B0BCAE] block mt-0.5">Especialista en Loteamiento Experience Acaray y Casas Quinta</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <a
                  href={getWaLink(`Hola ${agentName}, deseo agendar una visita al Km 12 Acaray para ver los lotes de terrenos libres este fin de semana.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center bg-[#82B515] hover:bg-[#72A012] text-white font-extrabold py-3.5 px-6 rounded-xl block transition shadow-sm text-sm"
                >
                  📲 Agendar Visita Gratuita
                </a>
                
                <a
                  href={`tel:${whatsappNumber}`}
                  className="w-full text-center hover:bg-white/5 border border-white/10 text-stone-200 font-semibold py-2 rounded-xl block text-xs transition"
                >
                  📞 Llamada Directa Direct Response
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ⚙️ PANEL DE PRUEBAS DE DESARROLLO (ABAJO DEL DIV) - OCULTO EN PRODUCCIÓN */}
        {false && (
          <div id="qa-test-panel" className="mt-8 bg-[#1F211F] border border-[#3D423C] rounded-2xl p-6 text-left space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3D423C] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">ENTORNO DE SIMULACIÓN Y QA</span>
                </div>
                <h3 className="text-[#FAFBF9] text-base font-bold font-sans">
                  Panel de Pruebas: Simulador de Inmuebles & Lotes Ocultos
                </h3>
                <p className="text-[#B0BCAE] text-xs font-light">
                  Habilitá o deshabilitá dinámicamente el catálogo extendido para verificar el comportamiento de los filtros y la optimización SEO en tiempo real.
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-3 bg-[#2E312D] border border-[#3D423C] px-4 py-2.5 rounded-xl select-none">
                <span className="text-xs font-bold text-[#E0E5DF]">
                  {showCatalog ? "🟢 Catálogo Habilitado" : "🔴 Catálogo Oculto"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCatalog(!showCatalog)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showCatalog ? 'bg-[#82B515]' : 'bg-[#5B6358]'
                  }`}
                  title="Alternar visibilidad del catálogo"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      showCatalog ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-2">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#FAFBF9]">
                  Propiedades que estás habilitando para la prueba de QA:
                </h4>
                <ul className="space-y-2 text-xs text-[#B0BCAE] font-light">
                  <li className="flex items-center gap-2">
                    <span className="text-[#82B515]">✔</span> 
                    <span><strong>Lotes Costa de Río:</strong> Terrenos premium nivelados listos para construir a sola firma.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#82B515]">✔</span> 
                    <span><strong>Cabañas de Alquiler:</strong> Cabaña Escandinava y departamento Loft Bio-Habitable.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#82B515]">✔</span> 
                    <span><strong>Casas Quinta:</strong> Eco-Villas modernas con piscinas fluviales y alta plusvalía.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#2E312D] rounded-xl p-4 border border-[#3D423C] space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-amber-500 uppercase font-black block tracking-wider">Métrica de Prueba</span>
                  <div className="text-xl font-bold text-white mt-1">7 Inmuebles de CDE</div>
                  <p className="text-[11px] text-[#B0BCAE] font-light mt-0.5">
                    Alterná los filtros de Alquiler / Venta y Categoría en la barra de navegación o sección "Propiedades" tras habilitarlo.
                  </p>
                </div>
                
                <div className="flex gap-2.5 pt-2">
                  {showCatalog && (
                    <a
                      href="#catalogo"
                      className="flex-1 text-center bg-[#FAFBF9] hover:bg-[#E0E5DF] text-[#2E312D] font-extrabold text-[11px] py-2 px-3 rounded-lg transition-all"
                    >
                      🚀 Ir al Catálogo en Vivo
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onSimulateLead("Simulador de Prueba de QA", "Lead de test generado de forma interactiva en la sección del Km 12 Acaray.");
                      alert("¡Simulación completada con éxito! El lead fue reportado al SEO Control Panel de forma instantánea.");
                    }}
                    className="flex-1 text-center bg-[#82B515]/20 hover:bg-[#82B515]/30 text-[#82B515] border border-[#82B515]/30 font-bold text-[11px] py-2 px-3 rounded-lg transition-all"
                  >
                    ⚡ Testear Lead Inbound
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 📐 SERVICIO DE ARQUITECTURA AG - PORTFOLIO INTERACTIVO */}
      <section id="arquitectura" className="py-20 bg-white border-y border-[#E7EAE5] px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#82B515] bg-[#82B515]/10 px-3 py-1 rounded-full w-max mx-auto block">
              SERVICIOS EXCLUSIVOS DE CONSTRUCCIÓN
            </span>
            <h2 className="text-2xl md:text-3xl font-sans font-bold text-[#3D403E] tracking-tight">
              Diseño y Construcción de Casas Quinta en Minga Guazú
            </h2>
            <p className="text-xs md:text-sm text-[#5B6358] max-w-lg mx-auto">
              No solo vendemos lotes en venta en Ciudad del Este; te ayudamos a construir el proyecto perfecto. Desde cabañas glamping altamente rentables en Airbnb hasta residencias y quintas modernas en todo Paraguay.
            </p>
          </div>



          {/* Core Interactive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Gallery Slide Representation (Col 7) */}
            <div className="lg:col-span-7 space-y-4">
              <div 
                className="relative rounded-3xl overflow-hidden border border-[#E7EAE5] shadow-sm group aspect-square transition-colors duration-300"
                style={{ backgroundColor: architectureSlides[architectureActiveSlide].bgColor || '#FAFBF9' }}
              >
                
                {/* Images Container */}
                <div className="relative w-full h-full overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={architectureActiveSlide}
                      src={architectureSlides[architectureActiveSlide].image}
                      alt={architectureSlides[architectureActiveSlide].title}
                      referrerPolicy="no-referrer"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.4}
                      onDragEnd={(event, info) => {
                        const swipeOffset = info.offset.x;
                        const swipeVelocity = info.velocity.x;
                        if (swipeOffset < -50 || (swipeOffset < -20 && swipeVelocity < -100)) {
                          setArchitectureActiveSlide(prev => (prev + 1) % architectureSlides.length);
                        } else if (swipeOffset > 50 || (swipeOffset > 20 && swipeVelocity > 100)) {
                          setArchitectureActiveSlide(prev => (prev - 1 + architectureSlides.length) % architectureSlides.length);
                        }
                      }}
                      className={`absolute inset-0 w-full h-full ${architectureSlides[architectureActiveSlide].objectFitClass || 'object-contain'} ${architectureSlides[architectureActiveSlide].scaleClass || 'scale-[1.0]'} ${architectureSlides[architectureActiveSlide].translateClass || 'translate-y-0'} select-none touch-pan-y cursor-grab active:cursor-grabbing ${architectureSlides[architectureActiveSlide].positionClass || 'object-center'}`}
                      onError={(e) => {
                        const fb = architectureSlides[architectureActiveSlide].fallbackImage;
                        if (fb && e.currentTarget.src !== fb) {
                          e.currentTarget.src = fb;
                        }
                      }}
                    />
                  </AnimatePresence>
                  
                  {/* Left / Right Carousel Buttons */}
                  <button
                    id="arch-prev"
                    onClick={() => setArchitectureActiveSlide(prev => (prev - 1 + architectureSlides.length) % architectureSlides.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-white/90 hover:bg-white backdrop-blur-xs text-[#2E312D] rounded-full shadow-sm hover:shadow-md transition duration-200 active:scale-95 cursor-pointer z-10"
                    aria-label="Anterior prototipo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    id="arch-next"
                    onClick={() => setArchitectureActiveSlide(prev => (prev + 1) % architectureSlides.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-white/90 hover:bg-white backdrop-blur-xs text-[#2E312D] rounded-full shadow-sm hover:shadow-md transition duration-200 active:scale-95 cursor-pointer z-10"
                    aria-label="Siguiente prototipo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center gap-1.5">
                {architectureSlides.map((_, idx) => (
                  <button
                    key={idx}
                    id={`arch-dot-${idx}`}
                    onClick={() => setArchitectureActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      architectureActiveSlide === idx ? 'w-6 bg-[#82B515]' : 'w-2 bg-[#E7EAE5]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Description & Technical Specs Content (Col 5) */}
            <div className="lg:col-span-5 space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <p className="text-xs md:text-sm text-[#5B6358] leading-relaxed">
                  {architectureSlides[architectureActiveSlide].description}
                </p>
              </div>

              {/* Technical key features spec block */}
              <div className="bg-[#FAFBF9] border border-[#E7EAE5] rounded-2xl p-4 space-y-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-[#758B9C] font-semibold uppercase block leading-none">Área Total</span>
                    <span className="text-sm font-bold text-[#3D403E] mt-1 block">{architectureSlides[architectureActiveSlide].specs.area}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#758B9C] font-semibold uppercase block leading-none">Tiempo de Entrega</span>
                    <span className="text-sm font-bold text-[#3D403E] mt-1 block">{architectureSlides[architectureActiveSlide].specs.time}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#758B9C] font-semibold uppercase block leading-none">Dormitorios</span>
                    <span className="text-sm font-bold text-[#3D403E] mt-1 block">{architectureSlides[architectureActiveSlide].specs.rooms}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#758B9C] font-semibold uppercase block leading-none">Baños</span>
                    <span className="text-sm font-bold text-[#3D403E] mt-1 block">{architectureSlides[architectureActiveSlide].specs.bathrooms}</span>
                  </div>
                </div>

                <div className="h-px bg-[#E7EAE5]" />

                {/* Tags lists */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[#758B9C] font-bold uppercase tracking-wider block">Atributos Clave</span>
                  <div className="flex flex-wrap gap-1">
                    {architectureSlides[architectureActiveSlide].specs.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="bg-[#82B515]/8 text-[#82B515] font-semibold text-[10px] px-2 py-0.5 rounded-md border border-[#82B515]/15">
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action WhatsApp Button for direct leads */}
              <div className="pt-2">
                <a
                  id="arch-whatsapp-cta"
                  href={`https://wa.me/595986151185?text=${encodeURIComponent(`Hola Arturo Villagra, me interesa el servicio de arquitectura. Estuve viendo el prototipo: ${architectureSlides[architectureActiveSlide].title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center bg-[#82B515] hover:bg-[#72A012] text-white font-bold py-3 px-4 rounded-xl block transition shadow-sm hover:shadow-[0_4px_12px_rgba(130,181,21,0.25)] text-xs md:text-sm cursor-pointer"
                >
                  💬 Consultar con Arturo Villagra via WhatsApp
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>



      {/* 📊 VENTANA EMERGENTE - ANÁLISIS COMPLETO & SIMULADOR ROI */}
      <AnimatePresence>
        {showInversionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#2E312D]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowInversionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#FAFBF9] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-[#E7EAE5] my-4 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside popup with close button */}
              <div className="bg-[#FAFBF9] border-b border-[#E7EAE5] p-5 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#82B515] bg-[#82B515]/10 px-2.5 py-0.5 rounded-full">
                    Análisis de Capitalización
                  </span>
                  <span className="text-xs text-[#758B9C] font-mono font-bold">Km 12 Acaray (CDE)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInversionModal(false)}
                  className="p-1.5 bg-[#E7EAE5]/65 hover:bg-rose-500 text-[#3D403E] hover:text-white rounded-full transition-all cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable details view */}
              <div className="overflow-y-auto p-6 sm:p-8 space-y-8 flex-1">
                
                {/* Header intro inside dialog */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <h3 className="text-xl md:text-2xl font-bold text-[#3D403E]">
                    Análisis de Viabilidad Financiera y Plusvalía
                  </h3>
                  <p className="text-xs md:text-sm text-[#5B6358] font-light leading-relaxed">
                    Evaluación macroeconómica del Km 12 Acaray como polo de desarrollo urbano sostenible, turismo rural y consolidación patrimonial sin intermediación bancaria.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  
                  {/* Columna Izquierda: Los Pilares del Crecimiento */}
                  <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                    
                    <div className="space-y-6">
                      <span className="text-xs font-black uppercase tracking-widest text-[#2E312D] border-b-2 border-[#82B515] pb-1 inline-block">
                        ⚡ Factores Clave de Plusvalía Terrenos Paraguay
                      </span>

                      {/* Pilar 1 */}
                      <div className="flex gap-4 text-left">
                        <div className="h-10 w-10 rounded-full bg-[#82B515]/10 border border-[#82B515]/20 flex items-center justify-center shrink-0 text-[#82B515]">
                          <MapPin size={18} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-[#3D403E]">
                            1. Conectividad Vial y Corredor Turístico PY02
                          </h4>
                          <p className="text-xs text-[#5B6358] leading-relaxed font-light">
                            El loteamiento <strong>Experience Acaray</strong> se sitúa en una posición logística privilegiada del Km 12, a solo 4.500 metros de la Ruta Internacional PY02. El pavimentado asfáltico del circuito interurbano garantiza un flujo vehicular ágil y una conexión inmediata con el polo corporativo e industrial de Ciudad del Este y Hernandarias.
                          </p>
                        </div>
                      </div>

                      {/* Pilar 2 */}
                      <div className="flex gap-4 text-left">
                        <div className="h-10 w-10 rounded-full bg-[#82B515]/10 border border-[#82B515]/20 flex items-center justify-center shrink-0 text-[#82B515]">
                          <Compass size={18} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-[#3D403E]">
                            2. Plusvalía Acelerada del Suelo en Alto Paraná
                          </h4>
                          <p className="text-xs text-[#5B6358] leading-relaxed font-light">
                            La escasez estructural de tierra fértil arbolada con doble acceso público garantizado al Río Acaray empuja el valor del suelo con fuerza. Se proyecta una valorización acumulativa récord de entre <strong>15% y 20% anual</strong>, posicionándolo como una de las mejores <strong>oportunidades de inversión Ciudad del Este</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Pilar 3 */}
                      <div className="flex gap-4 text-left">
                        <div className="h-10 w-10 rounded-full bg-[#82B515]/10 border border-[#82B515]/20 flex items-center justify-center shrink-0 text-[#82B515]">
                          <TreePine size={18} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-[#3D403E]">
                            3. Alta Demanda para Turismo Rústico y Airbnb
                          </h4>
                          <p className="text-xs text-[#5B6358] leading-relaxed font-light">
                            Los turistas de fin de semana, corporativos y extranjeros de la triple frontera buscan activamente experiencias en la naturaleza, huyendo del bullicio urbano. Crear una cabaña alpina o quinta residencial en este enclave permite una renta turística anualizada de hasta 14% en dólares, convirtiéndose en un activo de renta pasiva óptimo.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Caso de Éxito / Precedente de Proyecto Exitoso Interconectado */}
                    <div className="bg-[#FAFBF9] border border-[#E7EAE5] rounded-2xl p-5 space-y-3.5 relative shadow-[0_1px_5px_rgba(0,0,0,0.01)] text-left">
                      <div className="absolute top-3 right-4 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black px-2 py-0.5 rounded-sm">
                        ✓ HECHO DEMOSTRABLE
                      </div>
                      <h5 className="font-extrabold text-[#3D403E] text-xs flex items-center gap-1">
                        🔍 Precedente de Éxito Histórico: Fraccionamiento Km 11.5 Acaray
                      </h5>
                      <p className="text-xs text-[#5B6358] leading-relaxed font-light">
                        Los lotes originarios sobre planos de lanzamiento en la fracción vecina se comercializaron en 2024 por un valor estándar de <strong>Gs. 90.000.000</strong>. Hoy, al iniciar 2026, con la pavimentación concluida y los tendidos de la ANDE habilitados, han sido tasados oficialmente en <strong>Gs. 135.000.000</strong>. Esto representa un <strong>retorno real de plusvalía del 50% neto en 24 meses</strong> para los inversores de primera ola.
                      </p>
                    </div>

                  </div>

                  {/* Columna Derecha: El Simulador ROI Interactivo */}
                  <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-[#E7EAE5] rounded-3xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] text-left">
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#82B515] font-black uppercase tracking-widest block">
                          Simulador Interactivo de Capitalización
                        </span>
                        <h4 className="font-bold text-sm md:text-base text-[#3D403E]">
                          Elegí tu Perfil de Inversor en Paraguay
                        </h4>
                      </div>

                      {/* Botonera de Perfil */}
                      <div className="grid grid-cols-3 gap-1 bg-[#FAFBF9] border border-[#E7EAE5] p-1 rounded-xl">
                        <button
                          onClick={() => setSelectedProfile('capitalization')}
                          type="button"
                          className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                            selectedProfile === 'capitalization'
                              ? 'bg-[#82B515] text-white shadow-xs'
                              : 'text-[#5B6358] hover:bg-[#E7EAE5]/40'
                          }`}
                        >
                          Plusvalía Pura
                        </button>
                        <button
                          onClick={() => setSelectedProfile('airbnb')}
                          type="button"
                          className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                            selectedProfile === 'airbnb'
                              ? 'bg-[#82B515] text-white shadow-xs'
                              : 'text-[#5B6358] hover:bg-[#E7EAE5]/40'
                          }`}
                        >
                          Renta Airbnb
                        </button>
                        <button
                          onClick={() => setSelectedProfile('family')}
                          type="button"
                          className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                            selectedProfile === 'family'
                              ? 'bg-[#82B515] text-white shadow-xs'
                              : 'text-[#5B6358] hover:bg-[#E7EAE5]/40'
                          }`}
                        >
                          Quinta Familiar
                        </button>
                      </div>

                      {/* Resultados Dinámicos del Simulador */}
                      <div className="space-y-4 pt-2">
                        
                        {selectedProfile === 'capitalization' && (
                          <div className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-3 text-center">
                              <div className="bg-[#FAFBF9] border border-[#E7EAE5] p-3 rounded-xl">
                                <span className="text-[8px] uppercase tracking-wider text-[#758B9C] block">Plusvalía Proyectada (3 años)</span>
                                <span className="font-extrabold text-base md:text-lg text-[#82B515] block mt-1">~55% - 72%</span>
                              </div>
                              <div className="bg-[#FAFBF9] border border-[#E7EAE5] p-3 rounded-xl">
                                <span className="text-[8px] uppercase tracking-wider text-[#758B9C] block">Tasa de Crecimiento Anual</span>
                                <span className="font-extrabold text-base md:text-lg text-[#3D403E] block mt-1">18.5% prom.</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-[#5B6358]">
                              <div className="flex justify-between font-semibold">
                                <span>Índice de Resguardo Patrimonial:</span>
                                <span className="text-[#82B515]">Máximo (AAA)</span>
                              </div>
                              <div className="w-full bg-[#E7EAE5] h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#82B515] h-full w-[95%]" />
                              </div>
                            </div>

                            <div className="bg-[#E7EAE5]/10 border border-[#E7EAE5]/35 rounded-xl p-3.5 text-[11px] text-[#5B6358] leading-relaxed relative italic">
                              <span className="text-xl text-[#82B515] font-serif leading-none absolute -top-1 left-2">“</span>
                              <p className="pl-3">
                                "La compra de lotes a sola firma sin entrega inicial en el Km 12 Acaray es la opción de menor riesgo en Alto Paraná. Adquirís tierra a valor de lanzamiento y ganás dinero por simple valorización urbana y tendido trifásico a corto plazo."
                              </p>
                              <span className="block font-bold mt-2 text-[#3D403E] text-[10px] pl-3">— Marta Molinas, Analista de Alto Paraná</span>
                            </div>
                          </div>
                        )}

                        {selectedProfile === 'airbnb' && (
                          <div className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-3 text-center">
                              <div className="bg-[#FAFBF9] border border-[#E7EAE5] p-3 rounded-xl">
                                <span className="text-[8px] uppercase tracking-wider text-[#758B9C] block">Retorno Anual de Renta</span>
                                <span className="font-extrabold text-base md:text-lg text-[#82B515] block mt-1">12.4% - 15.2%</span>
                              </div>
                              <div className="bg-[#FAFBF9] border border-[#E7EAE5] p-3 rounded-xl">
                                <span className="text-[8px] uppercase tracking-wider text-[#758B9C] block">Plazo de Recuperación</span>
                                <span className="font-extrabold text-base md:text-lg text-[#3D403E] block mt-1">6.5 a 8 años</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-[#5B6358]">
                              <div className="flex justify-between font-semibold">
                                <span>Ocupación de Fin de Semana Estimada:</span>
                                <span className="text-blue-500">62% Fijo</span>
                              </div>
                              <div className="w-full bg-[#E7EAE5] h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#6D97CE] h-full w-[80%]" />
                              </div>
                            </div>

                            <div className="bg-[#E7EAE5]/10 border border-[#E7EAE5]/35 rounded-xl p-3.5 text-[11px] text-[#5B6358] leading-relaxed relative italic">
                              <span className="text-xl text-[#82B515] font-serif leading-none absolute -top-1 left-2">“</span>
                              <p className="pl-3">
                                "El turismo interno de cabañas de Airbnb está explotando en Paraguay. Al consolidar tu lote con nuestros servicios integrales de arquitectura y llave en mano A-Frame, el activo se autopaga con alquileres temporarios por fin de semana de Gs. 450.000 la noche."
                              </p>
                              <span className="block font-bold mt-2 text-[#3D403E] text-[10px] pl-3">— Vicente Molinas, Constructor Autorizado</span>
                            </div>
                          </div>
                        )}

                        {selectedProfile === 'family' && (
                          <div className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-3 text-center">
                              <div className="bg-[#FAFBF9] border border-[#E7EAE5] p-3 rounded-xl">
                                <span className="text-[8px] uppercase tracking-wider text-[#758B9C] block">Bienestar y Clima</span>
                                <span className="font-extrabold text-base md:text-lg text-[#82B515] block mt-1">100% Retorno</span>
                              </div>
                              <div className="bg-[#FAFBF9] border border-[#E7EAE5] p-3 rounded-xl">
                                <span className="text-[8px] uppercase tracking-wider text-[#758B9C] block">Distancia al Microcentro</span>
                                <span className="font-extrabold text-base md:text-lg text-[#3D403E] block mt-1">15 Minutos</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-[#5B6358]">
                              <div className="flex justify-between font-semibold">
                                <span>Sintonía Bioclimática y Aire Puro:</span>
                                <span className="text-emerald-600">Cinco Estrellas</span>
                              </div>
                              <div className="w-full bg-[#E7EAE5] h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full w-[100%]" />
                              </div>
                            </div>

                            <div className="bg-[#E7EAE5]/10 border border-[#E7EAE5]/35 rounded-xl p-3.5 text-[11px] text-[#5B6358] leading-relaxed relative italic">
                              <span className="text-xl text-[#82B515] font-serif leading-none absolute -top-1 left-2">“</span>
                              <p className="pl-3">
                                "La calidad de vida familiar es la mayor riqueza. Nuestros terrenos costeros respetan la arboleda nativa de tajy y cedro, ofreciendo aire limpio y sombra espectacular, manteniendo la conectividad laboral con CDE sin burocracia bancaria."
                              </p>
                              <span className="block font-bold mt-2 text-[#3D403E] text-[10px] pl-3">— Marta Molinas, Asesora Senior</span>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>

                    {/* Bloque de Testimonio Real Exclusivo de Creador de Confianza */}
                    <div className="mt-6 pt-5 border-t border-[#E7EAE5] flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0 font-bold text-xs text-stone-600 border border-stone-200">
                        AB
                      </div>
                      <div className="text-[10px] text-[#5B6358]">
                        <p className="italic">
                          "La <strong>plusvalía de terrenos en Paraguay</strong> es inmejorable. Adquirí dos terrenos en el Km 12 a sola firma con AG Servicios Inmobiliarios; hoy disfruto de una capitalización de más del 35%."
                        </p>
                        <span className="block font-bold text-[#3D403E] mt-1">— Andrés Benítez, Inversionista CDE</span>
                      </div>
                    </div>

                    {/* Botón CTA Direct Response con Urgencia */}
                    <div className="pt-5">
                      <a
                        href={getWaLink(`Hola ${agentName}, vi el análisis macroeconómico de plusvalía y el simulador de inversión para el Km 12 Acaray. Deseo agendar asesoría sobre la viabilidad de mi perfil.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center bg-[#2E312D] hover:bg-[#82B515] text-[#FAFBF9] hover:text-white font-extrabold py-3.5 px-4 rounded-xl block transition-all shadow-xs text-xs md:text-sm cursor-pointer"
                      >
                        💬 Obtener Dossier de Inversión Gratis
                      </a>
                    </div>

                  </div>

                </div>

              </div>

              {/* Bottom Quick Action bar inside popup with close button */}
              <div className="bg-[#FAFBF9] border-t border-[#E7EAE5] p-5 shrink-0 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInversionModal(false)}
                  className="w-full sm:w-auto text-center border border-[#E7EAE5] hover:bg-stone-100 text-[#2E312D] text-xs font-bold py-3 px-6 rounded-xl transition-all cursor-pointer"
                >
                  Cerrar Ventana
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌿 FOOTER GRAPHIC REPLICA */}
      <footer className="bg-[#2E312D] text-[#FAFBF9] border-t border-[#3D423C] py-12 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="space-y-3.5 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="relative w-11 h-10 overflow-hidden shrink-0">
                <img 
                  src="https://lh3.googleusercontent.com/d/1uiRtD0hcOAqS4zHDJJ_x7Th5UOFndIaR" 
                  alt="AG Logo" 
                  className="absolute top-0 left-0 w-full h-[132.55%] object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-sans font-bold text-base text-white tracking-tight leading-none">
                  AG
                </span>
                <span className="text-[9px] font-semibold text-[#82B515] uppercase tracking-widest leading-none mt-1">
                  Servicios Inmobiliarios
                </span>
                <span className="text-[7.5px] uppercase tracking-[0.22em] text-[#B0BCAE] leading-none mt-0.5">
                  INMOBILIΛRIOS • CDE
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#B0BCAE] max-w-md font-light">
              Loteamientos, casas quinta y departamentos ecológicos minimalistas en Alto Paraná, Paraguay. Crecimiento patrimonial seguro y legal a sola firma.
            </p>
          </div>

          <div className="flex justify-center items-center gap-4 sm:gap-6 text-xs text-[#B0BCAE] font-medium uppercase tracking-wider whitespace-nowrap overflow-x-auto">
            <a href="#estrella" className="hover:text-white transition-colors duration-200">Estrella</a>
            <a href="#catalogo" className="hover:text-white transition-colors duration-200">Inmuebles</a>
            <a href="#naturaleza" className="hover:text-white transition-colors duration-200">Filosofía</a>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-5 text-[#B0BCAE]">
            <a 
              href="https://www.instagram.com/aginmobiliariapy/" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white transition-colors duration-200"
              title="Instagram"
            >
              <Instagram size={24} strokeWidth={1.5} />
            </a>
            <a 
              href="https://www.facebook.com/aginmopy" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white transition-colors duration-200"
              title="Facebook"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left text-[10px] text-[#758B9C] font-mono uppercase tracking-widest max-w-7xl mx-auto">
          <div>
            © 2026 AG SERVICIOS INMOBILIARIOS S.A. • REGISTRO MUNICIPAL CDE PARAGUAY • TODOS LOS DERECHOS RESERVADOS
          </div>
          <div className="flex flex-col items-center md:items-end text-right font-sans tracking-normal normal-case text-xs text-[#B0BCAE] gap-1 shrink-0">
            <span className="font-light">
              Desarrollado por <span className="text-[#FAFBF9] font-medium">Juan A. Molinas Ihara</span>
            </span>
            <a 
              href="https://monkeybizia-tu-growth-partner-digital-788586066471.asia-east1.run.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[9px] tracking-widest uppercase text-[#82B515] hover:text-[#FAFBF9] font-bold font-mono transition-colors duration-250 cursor-pointer"
            >
              Monkey Business
            </a>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 🏡 DETECTOR DE INFORMACIÓN DE PROPIEDAD - VENTANA EMERGENTE */}
      <AnimatePresence>
        {activeDetailsProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#2E312D]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveDetailsProperty(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#FAFBF9] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-[#E7EAE5] my-8 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside popup */}
              <div className="bg-[#FAFBF9] border-b border-[#E7EAE5] p-5 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#82B515] bg-[#82B515]/10 px-2.5 py-0.5 rounded-full">
                    Ficha Técnica
                  </span>
                  <span className="text-xs text-[#758B9C] font-mono font-bold">ID: {activeDetailsProperty.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDetailsProperty(null)}
                  className="p-1.5 bg-[#E7EAE5]/65 hover:bg-[#82B515] text-[#3D403E] hover:text-white rounded-full transition-all cursor-pointer"
                  title="Cerrar detalles"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable details view */}
              <div className="overflow-y-auto p-6 space-y-6 flex-1">
                {/* Media frame inside popup */}
                <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-[#FAFBF9] relative border border-[#E7EAE9]">
                  <PropertyMediaCarousel
                    images={activeDetailsProperty.images}
                    video={activeDetailsProperty.video}
                    title={activeDetailsProperty.title}
                    onZoom={(url) => {
                      // Click on carousel items inside modal expands them to wide view
                      setActiveZoomImage(url);
                    }}
                  />
                  {activeDetailsProperty.highlightFeature && (
                    <span className="absolute bottom-3.5 left-3.5 bg-[#2E312D]/90 backdrop-blur-md text-[#FAFBF9] text-[9.5px] font-bold px-2.5 py-1 rounded-md border border-white/10 z-10">
                      ✨ {activeDetailsProperty.highlightFeature}
                    </span>
                  )}
                  <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-0.5 z-10" title="Sintonía biológica">
                    <span>🌿</span>
                    <span className="font-bold">{activeDetailsProperty.natureScore}/5</span>
                  </div>
                </div>

                {/* Info block */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-[#758B9C] font-semibold flex items-center gap-1">
                        <MapPin size={12} className="text-[#82B515]" /> {activeDetailsProperty.location}
                      </span>
                      {activeDetailsProperty.googleMapsLink && (
                        <a
                          href={activeDetailsProperty.googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#82B515] border border-emerald-200 px-2 py-0.5 rounded-full font-bold transition flex items-center gap-1 shadow-xs"
                        >
                          🗺️ Ver en Google Maps
                        </a>
                      )}
                    </div>
                    <h3 className="font-sans font-bold text-xl md:text-2xl text-[#3D403E] tracking-tight leading-snug">
                      {activeDetailsProperty.title}
                    </h3>
                  </div>

                  {/* Pricing and core details box */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#FAFBF9] border border-[#E7EAE5] rounded-2xl">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] text-[#758B9C] uppercase font-bold leading-none">Inversión</span>
                      <span className="font-sans font-extrabold text-[#82B515] text-base md:text-lg block tracking-tight">
                        {activeDetailsProperty.price}
                      </span>
                    </div>
                    <div className="space-y-0.5 border-l border-[#E7EAE5] pl-4">
                      <span className="block text-[9px] text-[#758B9C] uppercase font-bold leading-none">Superficie</span>
                      <span className="font-sans font-bold text-[#3D403E] text-xs md:text-sm block whitespace-pre-line leading-tight">
                        {activeDetailsProperty.area}
                      </span>
                    </div>
                    <div className="space-y-0.5 border-l border-[#E7EAE5] pl-4">
                      <span className="block text-[9px] text-[#758B9C] uppercase font-bold leading-none">Baño</span>
                      <span className="font-sans font-bold text-[#3D403E] text-sm block">
                        {activeDetailsProperty.bathrooms || "N/A"}
                      </span>
                    </div>
                    <div className="space-y-0.5 border-l border-[#E7EAE5] pl-4">
                      <span className="block text-[9px] text-[#758B9C] uppercase font-bold leading-none">
                        {activeDetailsProperty.bedrooms ? "Dormitorios" : "Categoría"}
                      </span>
                      <span className="font-sans font-bold text-[#3D403E] text-sm block truncate capitalize">
                        {activeDetailsProperty.bedrooms ? `${activeDetailsProperty.bedrooms} habs.` : getCategoryLabel(activeDetailsProperty.category)}
                      </span>
                    </div>
                  </div>

                  {/* Fully displayed Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-[#3D403E]">Descripción Completa</h4>
                    <p className="text-xs md:text-sm text-[#5B6358] leading-relaxed font-light whitespace-pre-line bg-white p-4 rounded-xl border border-[#E7EAE5]/60">
                      {activeDetailsProperty.description}
                    </p>
                  </div>

                  {/* Google Drive Link (Folder of high-res files & plans) */}
                  {activeDetailsProperty.driveLink && (
                    <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">📁</span>
                        <div className="text-left">
                          <p className="font-bold text-blue-900 text-xs sm:text-sm">Carpeta Google Drive Asociada</p>
                          <p className="text-[#5B6358] text-[10px] leading-tight text-left">Accede a fotos en HD, planos del loteamiento, copias de títulos y documentos técnicos.</p>
                        </div>
                      </div>
                      <a 
                        href={activeDetailsProperty.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all text-xs"
                      >
                        Ver Carpeta ↗
                      </a>
                    </div>
                  )}

                  {/* Amenities */}
                  {activeDetailsProperty.amenities && activeDetailsProperty.amenities.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs uppercase tracking-widest font-bold text-[#3D403E]">Detalles Adicionales</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {activeDetailsProperty.amenities.map((amenity: string, index: number) => (
                          <div
                            key={index}
                            className="bg-white hover:bg-[#82B515]/5 border border-[#E7EAE5] text-[#5B6358] hover:text-[#3D403E] text-[11px] font-medium py-2 px-3 rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            <span className="text-[#82B515] text-xs">✓</span>
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Action bar inside popup */}
              <div className="bg-[#FAFBF9] border-t border-[#E7EAE5] p-5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] text-[#758B9C] font-semibold block uppercase">Precio Comercial</span>
                  <span className="text-lg font-black text-[#2E312D] tracking-tight">{activeDetailsProperty.price}</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveDetailsProperty(null)}
                    className="w-full sm:w-auto text-center border border-[#E7EAE5] hover:bg-[#E7EAE5]/40 text-[#2E312D] text-xs font-bold py-3 px-5 rounded-xl transition-all cursor-pointer"
                  >
                    Cerrar Ficha
                  </button>
                  <a
                    href={getWaLinkForProperty(activeDetailsProperty, `¡Hola Sara Genes! Vi la ficha técnica detallada del inmueble "${activeDetailsProperty.title}" (${activeDetailsProperty.price}). Deseo agendar una visita y solicitar detalles técnicos.`)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      onSimulateLead(`Inquiry Popup: ${activeDetailsProperty.title}`, `Inquire for property ${activeDetailsProperty.id}`);
                      setActiveDetailsProperty(null);
                    }}
                    className="w-full sm:w-auto bg-[#82B515] hover:bg-[#2E312D] text-white text-xs font-extrabold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <span>💬 Consultar Asesor de Ventas</span>
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 🖼️ INTERACTIVE LIGHTBOX ZOOM FOR THE WHOLE CATALOG */}
      <AnimatePresence>
        {activeZoomImage && (
          (() => {
            const currentZoomValue = activeZoomImage; // Prevents race conditions during the transition unmounting phase
            const lowerSrc = currentZoomValue ? currentZoomValue.toLowerCase() : "";
            const isVideoFormat = lowerSrc.endsWith(".mp4") || lowerSrc.endsWith(".mov") || lowerSrc.includes("video");
            
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-[#2E312D]/95 backdrop-blur-md flex items-center justify-center p-4"
              >
                <button 
                  type="button" 
                  onClick={() => setActiveZoomImage(null)} 
                  className="absolute top-4 right-4 p-3 bg-black/45 text-white rounded-full hover:bg-black/60 cursor-pointer"
                  title="Cerrar Imagen"
                >
                  <X size={20} />
                </button>
                
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl relative border border-white/10"
                >
                  {isVideoFormat ? (
                    <ZoomVideoPlayer
                      src={zoomVideoSrc || ""}
                      className="max-w-full max-h-[80vh] object-contain mx-auto"
                      currentZoomValue={currentZoomValue}
                      setZoomVideoSrc={setZoomVideoSrc}
                    />
                  ) : (
                    <img 
                      src={currentZoomValue || ""} 
                      alt="Visión en resolución expandida" 
                      className="max-w-full max-h-[80vh] object-contain mx-auto" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                  <div className="bg-black/75 p-3 text-center text-[11px] text-[#FAFBF9]">
                    Página Oficial AG Servicios Inmobiliarios • Vista Curada Integrada con la Naturaleza
                  </div>
                </motion.div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 🚀 VENTANA EMERGENTE (POPUP) - OFERTA RELÁMPAGO DE SÚPER CONVERSIÓN */}
      <AnimatePresence>
        {showOfertaRelampago && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#2E312D]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowOfertaRelampago(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#2E312D] text-[#FAFBF9] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 my-auto flex flex-col p-6 sm:p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button top-right */}
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem("oferta_relampago_closed", "true");
                  setShowOfertaRelampago(false);
                }}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-rose-500 hover:text-white rounded-full transition-all cursor-pointer text-zinc-300"
                title="Cerrar Oferta"
              >
                <X size={18} />
              </button>

              {/* Fire Sparkles / Animated Header */}
              <div className="flex flex-col items-center text-center mt-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500 text-black shadow-lg animate-pulse mb-3">
                  <Sparkles size={11} className="fill-black" />
                  ¡Últimos Lotes en Promoción Especial!
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight leading-none">
                  ⚡ OFERTA RELÁMPAGO ⚡
                </h3>
                <p className="text-zinc-400 text-xs mt-1 font-medium">
                  Fracciones exclusivas del Km 12 Acaray (CDE)
                </p>
              </div>

              {/* Price / Offer Details Card */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-6 text-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#82B515] text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  Sola Firma
                </div>
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                  Cuotas fijas sin reajustes de solo
                </p>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#FAFBF9] my-1 flex justify-center items-baseline gap-1">
                  <span className="text-amber-400 text-xl font-bold">Gs.</span>
                  <span className="tracking-tight text-amber-300">1.000.000</span>
                  <span className="text-zinc-400 text-xs font-normal">/ mes</span>
                </div>
                <div className="inline-block bg-[#82B515]/20 text-[#FAFBF9] border border-[#82B515]/30 px-3 py-0.5 rounded-full text-xs font-bold mt-2">
                  ✓ Posesión Inmediata Garantizada
                </div>
              </div>

              {/* ⏳ Countdown Timer Box */}
              <div className="bg-black/25 rounded-2xl p-4 border border-white/5 text-center mb-6">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold mb-2.5">
                  La oferta expira en cualquier momento
                </p>
                <div className="flex justify-center items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-mono font-black text-xl min-w-[50px] shadow-inner text-center">
                      {timeLeft.hours.toString().padStart(2, '0')}
                    </div>
                    <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mt-1">Horas</span>
                  </div>
                  <span className="text-zinc-600 font-bold font-mono text-xl mb-5">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-mono font-black text-xl min-w-[50px] shadow-inner text-center">
                      {timeLeft.minutes.toString().padStart(2, '0')}
                    </div>
                    <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mt-1">Minutos</span>
                  </div>
                  <span className="text-zinc-600 font-bold font-mono text-xl mb-5">:</span>
                  <div className="flex flex-col items-center">
                    <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-mono font-black text-xl min-w-[50px] shadow-inner text-center">
                      {timeLeft.seconds.toString().padStart(2, '0')}
                    </div>
                    <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mt-1">Segundos</span>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2.5 mb-6 text-xs sm:text-sm text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#82B515] text-lg font-black shrink-0">✓</span>
                  <span><strong>Posesión Inmediata:</strong> Pagás tu primera cuota, firmás contrato y ya podés cercar, limpiar o construir.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#82B515] text-lg font-black shrink-0">✓</span>
                  <span><strong>Acceso Exclusivo al Río:</strong> Propiedad privilegiada dentro del loteamiento con calles directo al Río Acaray.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#82B515] text-lg font-black shrink-0">✓</span>
                  <span><strong>Financiación Directa sin Requisitos:</strong> A sola firma con Cédula de Identidad, sin bancos ni burocracia de por medio.</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2">
                <a
                  href={`https://wa.me/595973821270?text=${encodeURIComponent("¡Hola Sara Genes! Vimos la Oferta Relámpago de terrenos estrella en la página web con cuota de Gs. 1.000.000 y posesión inmediata. Estábamos interesados en reservar un lote o agendar una visita lo antes posible.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    onSimulateLead("Oferta Relampago WhatsApp Click", "Clicked WhatsApp button in lightning proposal popup");
                    setShowOfertaRelampago(false);
                  }}
                  className="w-full text-center bg-[#82B515] hover:bg-[#72A012] text-white font-extrabold py-3.5 px-6 rounded-xl block transition-all shadow-md active:scale-95 text-xs md:text-sm cursor-pointer"
                >
                  💬 RECLAMAR OFERTA POR WHATSAPP
                </a>

                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("oferta_relampago_closed", "true");
                    setShowOfertaRelampago(false);
                  }}
                  className="w-full text-center text-zinc-400 hover:text-[#FAFBF9] text-xs font-semibold py-2 transition-all block underline bg-transparent border-0 cursor-pointer"
                >
                  Seguir viendo el loteamiento
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⚡ BOTÓN FLOTANTE PERMANENTE DE OFERTA RELÁMPAGO */}
      <div className="fixed bottom-24 left-6 md:bottom-6 md:left-6 z-40">
        <button
          type="button"
          onClick={() => setShowOfertaRelampago(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#2E312D] font-extrabold text-xs py-2.5 px-4 rounded-full shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_24px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 group border border-amber-300 cursor-pointer"
          title="Ver Oferta Relámpago"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E312D] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E312D]"></span>
          </span>
          <span className="text-sm">⚡</span>
          <span className="font-extrabold tracking-tight">Oferta Gs. 1.000.000</span>
        </button>
      </div>

    </div>
  );
}
