import React, { useState, useEffect, useRef } from 'react';
import { Compass, Map as MapIcon, Search, Navigation, Clock, Star, Heart, Bookmark, Camera, MapPin, ChevronLeft, Send, MessageSquare, Sun, Edit3, Download, Plus, Award, X, Sparkles, Users, UserCircle, ThumbsUp, Share2, Save, MapPinned, ArrowRight, CheckCircle2, Mail, AlertTriangle, RefreshCw, Anchor, WifiOff, ShoppingBag, Lock } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'motion/react';

// --- TIPOS ---

declare global {
  interface Window {
    gm_authFailure: () => void;
  }
}

interface Review {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  photos: string[];
  date: string;
  helpful: number;
  verified: boolean;
}

interface Stop {
  id: number;
  time: string;
  title: string;
  description: string;
}

interface Day {
  id: number;
  dayNumber: number;
  stops: Stop[];
}

interface Itinerary {
  id: number;
  name: string;
  destination: string;
  days: Day[];
  isCustom: boolean;
  theme?: string;
}

interface FavoriteList {
  id: number;
  name: string;
  items: number[]; // IDs de locais
}

// --- CONFIGURAÇÃO E DADOS ---

const COLORS = {
  bg: '#f3ecdb',      // Fundo papel creme
  primary: '#b45a35', // Laranja/Ferrugem escuro
  text: '#4a3320',    // Marrom escuro para textos
  accent1: '#64a4ad', // Azul/Verde vintage
  accent2: '#e8c678', // Amarelo mostarda
  border: '#5a3c28',  // Bordas escuras
};

// Dados completos e dinâmicos (Mundo vs Brasil)
const DADOS_MODO = {
  mundo: {
    tituloHeader: "O Globo",
    roteiro: {
      data: '27 Fev 2026',
      cidade: 'Explorando o Mundo',
      clima: '--°C',
      paradaAtual: { id: 0, hora: '--:--', titulo: 'Início da Jornada', categoria: 'Aventura', descricao: 'Abra o mapa para definir seu próximo destino.', icon: Compass, status: 'atual' },
    },
    locaisExplorar: [
      { id: 1, cidade: 'Paris', nome: 'Shakespeare & Co', categoria: 'Livraria', rating: 4.9, img: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=400&h=400', saved: true, location: 'Paris, França', title: 'Shakespeare & Co', description: 'Livraria histórica em Paris.' },
      { id: 2, cidade: 'Paris', nome: 'Sainte-Chapelle', categoria: 'Monumento', rating: 4.8, img: 'https://images.unsplash.com/photo-1543339174-8db91b9201a0?auto=format&fit=crop&q=80&w=400&h=400', saved: false, location: 'Paris, França', title: 'Sainte-Chapelle', description: 'Capela gótica famosa pelos vitrais.' },
      { id: 3, cidade: 'Roma', nome: 'Coliseu', categoria: 'Monumento', rating: 5.0, img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=400&h=400', saved: true, location: 'Roma, Itália', title: 'Coliseu', description: 'O maior anfiteatro já construído.' },
    ],
    chatInicial: [
      { id: 1, type: 'bot', text: 'Saudações, navegante! Sou o seu Capitão. Para onde os ventos da curiosidade nos levarão hoje? 🧭', time: 'Agora' },
    ],
    postsComunidade: [
      { id: 1, user: 'Marina Silva', avatar: 'https://i.pravatar.cc/100?img=1', local: 'Montmartre, Paris', tempo: '2h atrás', texto: 'Finalmente encontrei a Maison Rose! A luz da tarde aqui é surreal. Dica: cheguem antes das 16h.', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600&h=400', likes: 42, comments: 5 },
      { id: 2, user: 'João Pedro', avatar: 'https://i.pravatar.cc/100?img=11', local: 'Trastevere, Roma', tempo: '5h atrás', texto: 'A melhor pasta carbonara da minha vida. Me perdi de propósito nestas ruas e valeu a pena.', img: 'https://images.unsplash.com/photo-1516483638261-f40af5baacce?auto=format&fit=crop&q=80&w=600&h=400', likes: 128, comments: 12 }
    ]
  },
  brasil: {
    tituloHeader: "Terra Brasilis",
    roteiro: {
      data: '27 Fev 2026',
      cidade: 'Explorando o Brasil',
      clima: '--°C',
      paradaAtual: { id: 0, hora: '--:--', titulo: 'Início da Jornada', categoria: 'Aventura', descricao: 'Abra o mapa para descobrir tesouros nacionais.', icon: Compass, status: 'atual' },
    },
    locaisExplorar: [
      { id: 4, cidade: 'Rio de Janeiro', nome: 'Cristo Redentor', categoria: 'Monumento', rating: 5.0, img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=400&h=400', saved: true, location: 'Rio de Janeiro, Brasil', title: 'Cristo Redentor', description: 'Estátua icônica no topo do Corcovado.' },
      { id: 5, cidade: 'Paraty', nome: 'Centro Histórico', categoria: 'Cultura', rating: 4.8, img: 'https://images.unsplash.com/photo-1628045620958-39659b9e6f1f?auto=format&fit=crop&q=80&w=400&h=400', saved: false, location: 'Paraty, Rio de Janeiro', title: 'Centro Histórico de Paraty', description: 'Arquitetura colonial preservada.' },
      { id: 6, cidade: 'Salvador', nome: 'Pelourinho', categoria: 'Cultura', rating: 4.9, img: 'https://images.unsplash.com/photo-1510300643725-b4bc2f1262d5?auto=format&fit=crop&q=80&w=400&h=400', saved: true, location: 'Salvador, Bahia', title: 'Pelourinho', description: 'Centro histórico vibrante de Salvador.' },
    ],
    chatInicial: [
      { id: 1, type: 'bot', text: 'Olá, navegante! Sou o seu Capitão. Pronto para desbravar as terras brasileiras? 🧭', time: 'Agora' },
    ],
    postsComunidade: [
      { id: 3, user: 'Tiago Mendes', avatar: 'https://i.pravatar.cc/100?img=33', local: 'Pelourinho, Salvador', tempo: '1h atrás', texto: 'O acarajé da Dinha é realmente tudo o que dizem. Que energia incrível tem esta praça!', img: 'https://images.unsplash.com/photo-1510300643725-b4bc2f1262d5?auto=format&fit=crop&q=80&w=600&h=400', likes: 89, comments: 8 },
      { id: 4, user: 'Ana Costa', avatar: 'https://i.pravatar.cc/100?img=5', local: 'Paraty, Rio', tempo: '4h atrás', texto: 'Passeio de escuna pelas ilhas. A água estava perfeita e o clima também. Não deixem de provar a Gabriela!', img: 'https://images.unsplash.com/photo-1628045620958-39659b9e6f1f?auto=format&fit=crop&q=80&w=600&h=400', likes: 210, comments: 24 }
    ]
  }
};

const LOCAIS = [...DADOS_MODO.mundo.locaisExplorar, ...DADOS_MODO.brasil.locaisExplorar];

const CATEGORIAS = ['Tudo', 'Cafés', 'Restaurantes', 'Museus', 'Atrações', 'Hotéis'];

// --- COMPONENTES VISUAIS PREMIUM (SVGs Customizados) ---

const RetroCompass = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" className="animate-[spin_15s_linear_infinite]">
    <circle cx="50" cy="50" r="45" fill="#e8c678" stroke={COLORS.border} strokeWidth="4" />
    <circle cx="50" cy="50" r="38" fill={COLORS.bg} stroke={COLORS.border} strokeWidth="2" strokeDasharray="4 4" />
    <polygon points="50,15 60,50 50,85 40,50" fill="#b45a35" stroke={COLORS.border} strokeWidth="2" />
    <polygon points="50,15 50,85 40,50" fill="#8a3c1f" />
    <circle cx="50" cy="50" r="6" fill={COLORS.border} />
    <text x="50" y="12" fontSize="10" fill={COLORS.text} textAnchor="middle" fontWeight="bold">N</text>
  </svg>
);

const VintageStamp = ({ text, color = COLORS.primary, rotate = '-5deg' }: any) => (
  <div className="absolute pointer-events-none opacity-90 z-10" style={{ transform: `rotate(${rotate})`, border: `2px dashed ${color}`, padding: '2px 6px', borderRadius: '4px', color: color, fontFamily: "'VT323', monospace", fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
    {text}
  </div>
);

const BrazilMapIcon = ({ size = 14, color = "#2c5e40" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4h4l3 2 2 4-1 5-3 4-3 2-3-1-3-3-1-5 1-4 2-3z" />
  </svg>
);

const CustomGlobeIcon = ({ size = 14, color = "#8a3c1f" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
);

const ModoSwitch = ({ modoAtual, toggleModo }: any) => (
  <div className="absolute top-4 right-4 z-50 flex flex-col items-center gap-1 cursor-pointer group" onClick={toggleModo}>
    <div className={`w-14 h-8 rounded-full border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] p-1 flex relative transition-colors duration-300 ${modoAtual === 'brasil' ? 'bg-[#1e452f]' : 'bg-[#8a3c1f]'}`}>
      <div className={`w-6 h-6 bg-[#f3ecdb] rounded-full border-2 border-[#5a3c28] flex items-center justify-center transform transition-transform duration-300 shadow-sm ${modoAtual === 'brasil' ? 'translate-x-0' : 'translate-x-6'}`}>
        {modoAtual === 'mundo' ? (
           <CustomGlobeIcon size={14} color="#8a3c1f" />
        ) : (
           <BrazilMapIcon size={14} color="#2c5e40" />
        )}
      </div>
      <div className="absolute top-1 left-[5px] w-6 h-6 flex items-center justify-center pointer-events-none opacity-50">
        <BrazilMapIcon size={12} color="#f3ecdb" />
      </div>
      <div className="absolute top-1 right-[5px] w-6 h-6 flex items-center justify-center pointer-events-none opacity-50">
        <CustomGlobeIcon size={12} color="#f3ecdb" />
      </div>
    </div>
    <span className="font-retro-pixel text-[9px] text-[#e8c678] uppercase font-bold tracking-widest drop-shadow-md transition-colors duration-300">
      {modoAtual === 'mundo' ? 'Mundo' : 'Brasil'}
    </span>
  </div>
);

const AnimatedPin = ({ delay = '0s', label, onClick }: any) => (
  <div className="relative group cursor-pointer flex flex-col items-center" style={{ animation: `bounce 2s infinite ${delay}` }} onClick={onClick}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill={COLORS.primary} stroke={COLORS.border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg group-hover:scale-110 transition-transform"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" fill="#f3ecdb" /></svg>
    <div className="mt-1 bg-[#f3ecdb] px-2 py-0.5 rounded border-2 border-[#5a3c28] text-[10px] font-bold text-center shadow-[2px_2px_0px_#5a3c28] whitespace-nowrap group-hover:bg-[#e8c678] font-retro-pixel transition-colors">{label}</div>
    <div className="absolute -bottom-2 w-4 h-1 bg-black/20 rounded-[100%] blur-sm group-hover:scale-75 transition-transform"></div>
  </div>
);

const formatMessage = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\n)/g);
  return parts.map((part, index) => {
    if (part === '\n') return <br key={index} />;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="text-[#b45a35] font-bold">{part.slice(2, -2)}</strong>;
    return part;
  });
};

// --- APLICAÇÃO PRINCIPAL ---

// --- CONSTANTES E ESTILOS ---

const MAP_STYLES = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f3ecdb" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#5a3c28" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f3ecdb" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#5a3c28" }, { "weight": 1.2 }]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#e8e0cc" }]
  },
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#dccfb1" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#5a3c28" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#64a4ad" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#f3ecdb" }]
  }
];

const MAP_OPTIONS = {
  styles: MAP_STYLES,
  disableDefaultUI: true,
  zoomControl: false,
  gestureHandling: 'greedy',
  clickableIcons: false, // Desativa cliques em ícones padrão do Google
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

const LOCATIONS = {
  mundo: [
    { id: 'paris', name: 'Paris', lat: 48.8566, lng: 2.3522, description: 'A cidade luz e seus cafés históricos.' },
    { id: 'roma', name: 'Roma', lat: 41.9028, lng: 12.4964, description: 'Onde cada pedra conta uma história milenar.' },
    { id: 'kyoto', name: 'Kyoto', lat: 35.0116, lng: 135.7681, description: 'Templos serenos e jardins de contemplação.' }
  ],
  brasil: [
    { id: 'salvador', name: 'Salvador', lat: -12.9714, lng: -38.5014, description: 'Cores, sabores e o axé da primeira capital.' },
    { id: 'rio', name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, description: 'Entre o mar e a montanha, a cidade maravilhosa.' },
    { id: 'paraty', name: 'Paraty', lat: -23.2178, lng: -44.7131, description: 'Casarões coloniais e águas cristalinas.' }
  ]
};

const LIBRARIES: ("places" | "geometry" | "drawing" | "marker")[] = ["places", "marker"];

export default function App() {
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Captura erros de autenticação do Google Maps (chave inválida, billing, etc)
    window.gm_authFailure = () => {
      setAuthError("Falha na Autenticação: Verifique sua Chave de API e o Faturamento no Google Cloud Console.");
      console.error("Google Maps Auth Failure");
    };
  }, []);

  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const onLoad = React.useCallback(function callback(m: google.maps.Map) {
    setMap(m);
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES as any,
  });

  // Nota: Se você estiver usando App Check, a inicialização do Firebase 
  // deve ocorrer aqui ou em um useEffect separado.
  
  const [activeTab, setActiveTab] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(null);
  const [isGreeting, setIsGreeting] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  
  const [modoAtivo, setModoAtivo] = useState<'mundo' | 'brasil'>('brasil');
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [animatingLikes, setAnimatingLikes] = useState<number[]>([]);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<Record<number, any[]>>({});
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [dashboardSuggestions, setDashboardSuggestions] = useState<any[]>([]);
  const [isDashboardIaLoading, setIsDashboardIaLoading] = useState(false);
  const [showingAllIaSuggestions, setShowingAllIaSuggestions] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await fetch("/api/profile");
        const profile = await profileRes.json();
        
        if (profile && !profile.error) {
          setProfileData({
            ...profile,
            favorites: Array.isArray(profile.favorites) ? profile.favorites.map((f: any) => f.localId) : [],
            seals: Array.isArray(profile.seals) ? profile.seals : [],
            itineraries: Array.isArray(profile.itineraries) ? profile.itineraries : [],
            reviews: [] // Reviews not implemented in API yet
          });
        }

        const postsRes = await fetch("/api/posts");
        const postsData = await postsRes.json();
        if (Array.isArray(postsData)) {
          setPosts(postsData);
        } else {
          console.error("Posts data is not an array:", postsData);
          setPosts([]);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const onboarded = localStorage.getItem('navegantes_onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  const stampPassport = async (name: string, icon: string = "📍", color: string = "#b45a35") => {
    const hasStamp = profileData.seals.some(s => s.name === name);
    if (!hasStamp) {
      try {
        const res = await fetch("/api/seals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, icon, color })
        });
        const newSeal = await res.json();
        setProfileData(prev => ({
          ...prev,
          seals: [...prev.seals, newSeal]
        }));
        showToast(`Novo carimbo: ${name}! ⚓`);
      } catch (error) {
        console.error("Erro ao salvar selo:", error);
      }
    }
  };

  const handleLike = async (postId: number) => {
    const isLiked = likedPosts.includes(postId);
    if (!isLiked) {
      try {
        await fetch(`/api/posts/${postId}/like`, { method: "POST" });
        setLikedPosts(prev => [...prev, postId]);
        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        ));
        
        // Trigger animation for 3 seconds
        setAnimatingLikes(prev => [...prev, postId]);
        setTimeout(() => {
          setAnimatingLikes(prev => prev.filter(id => id !== postId));
        }, 3000);
      } catch (error) {
        console.error("Erro ao curtir:", error);
      }
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem('navegantes_onboarded', 'true');
    setShowOnboarding(false);
  };

  const handleComment = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPostForDetail(post);
    }
  };

  const handleAddComment = async (postId: number, text: string) => {
    if (!text.trim()) return;
    // Note: API for comments not fully detailed in server.ts but we can add it or mock for now
    // For now, let's just update local state to keep it snappy
    const newComment = {
      id: Date.now(),
      user: profileData.name,
      text: text,
      time: 'Agora'
    };
    setPostComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post
    ));
  };

  const dados = DADOS_MODO[modoAtivo];

  const currentLocations = modoAtivo === 'mundo' ? LOCATIONS.mundo : LOCATIONS.brasil;
  const defaultCenter = modoAtivo === 'mundo' ? { lat: 40, lng: 10 } : { lat: -15, lng: -50 };
  const center = userCoords && modoAtivo === 'brasil' ? userCoords : defaultCenter;
  const zoom = userCoords && modoAtivo === 'brasil' ? 12 : (modoAtivo === 'mundo' ? 3 : 4);

  const [messages, setMessages] = useState(dados.chatInicial);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estado para o modal de criar memória
  const [showCreateMemory, setShowCreateMemory] = useState(false);
  const [memoryImage, setMemoryImage] = useState<string | null>(null);
  const [memoryText, setMemoryText] = useState('');
  const [memoryLocation, setMemoryLocation] = useState('Buscando localização...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para o Perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Viajante Anônimo',
    bio: 'Explorando o mundo, um pixel de cada vez.',
    avatar: 'https://i.pravatar.cc/150?img=12',
    isPremium: false,
    credits: 0,
    activeTripUntil: null as string | null,
    seals: [] as any[],
    reviews: [] as Review[],
    favorites: [] as number[], // IDs de locais
    itineraries: [] as Itinerary[]
  });

  const isTripActive = profileData.activeTripUntil && new Date(profileData.activeTripUntil) > new Date();

  const [editName, setEditName] = useState(profileData.name);
  const [editBio, setEditBio] = useState(profileData.bio);

  useEffect(() => {
    setEditName(profileData.name);
    setEditBio(profileData.bio);
  }, [profileData]);

  // Estados para as novas funcionalidades
  const [selectedLocal, setSelectedLocal] = useState<any>(null);
  const [showAddReview, setShowAddReview] = useState(false);
  const [showIAAssistant, setShowIAAssistant] = useState(false);
  const [iaSuggestions, setIaSuggestions] = useState<any[]>([]);
  const [isIaLoading, setIsIaLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  
  const [showItineraries, setShowItineraries] = useState(false);
  const [showCreateItinerary, setShowCreateItinerary] = useState(false);
  const [newItineraryName, setNewItineraryName] = useState('');
  const [newItineraryDest, setNewItineraryDest] = useState('');
  const [itineraryStep, setItineraryStep] = useState<'initial' | 'source' | 'suggestions'>('initial');
  const [itinerarySource, setItinerarySource] = useState<'ai' | 'community' | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [selectedStops, setSelectedStops] = useState<any[]>([]);
  
  const [favoriteLists, setFavoriteLists] = useState<FavoriteList[]>([
    { id: 1, name: 'Para Voltar', items: [] },
    { id: 2, name: 'Praias Imperdíveis', items: [] }
  ]);
  const [showSaveToFavorite, setShowSaveToFavorite] = useState(false);
  const [syncedItinerary, setSyncedItinerary] = useState<Itinerary | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [followMe, setFollowMe] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<number[]>([]);

  // Dados mockados de reviews para locais existentes
  const [allReviews, setAllReviews] = useState<Record<number, Review[]>>({});

  const [suggestedItineraries, setSuggestedItineraries] = useState<Itinerary[]>([
    { 
      id: 1, name: 'Roteiro de Final de Semana', destination: 'Sua Localização', isCustom: false, theme: 'Descoberta',
      days: [
        { id: 1, dayNumber: 1, stops: [
          { id: 1, time: '10:00', title: 'Ponto de Interesse Local', description: 'Explore o que há de melhor ao seu redor.' },
          { id: 2, time: '13:00', title: 'Gastronomia Regional', description: 'Descubra sabores autênticos da região.' }
        ]}
      ]
    }
  ]);

  const handleAddReview = () => {
    if (!selectedLocal) return;
    const newReview: Review = {
      id: Date.now(),
      userId: 0, // Current user
      userName: profileData.name,
      userAvatar: profileData.avatar,
      rating: reviewRating,
      comment: reviewComment,
      photos: reviewPhotos,
      date: new Date().toLocaleDateString('pt-BR'),
      helpful: 0,
      verified: true // Simulated
    };
    
    setAllReviews(prev => ({
      ...prev,
      [selectedLocal.id]: [newReview, ...(prev[selectedLocal.id] || [])]
    }));
    
    setProfileData(prev => ({
      ...prev,
      reviews: [newReview, ...prev.reviews]
    }));
    
    setShowAddReview(false);
    setReviewComment('');
    setReviewRating(5);
    setReviewPhotos([]);
  };


  const toggleFavorite = async (localId: number) => {
    const isFav = profileData.favorites.includes(localId);
    try {
      if (isFav) {
        await fetch(`/api/favorites/${localId}`, { method: "DELETE" });
        setProfileData(prev => ({
          ...prev,
          favorites: prev.favorites.filter(id => id !== localId)
        }));
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ localId })
        });
        setProfileData(prev => ({
          ...prev,
          favorites: [...prev.favorites, localId]
        }));
        const local = LOCAIS.find(l => l.id === localId);
        if (local) {
          stampPassport(local.cidade, "⭐", "#e8c678");
        }
      }
    } catch (error) {
      console.error("Erro ao favoritar:", error);
    }
  };

  const handleSearchCity = async () => {
    if (!newItineraryDest) return;

    if (itinerarySource === 'community') {
      // Busca no banco de dados local do app (LOCAIS)
      const localMatches = LOCAIS.filter(l => 
        l.location.toLowerCase().includes(newItineraryDest.toLowerCase()) ||
        l.title.toLowerCase().includes(newItineraryDest.toLowerCase())
      ).map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        time: "Horário Livre"
      }));

      if (localMatches.length > 0) {
        setCitySuggestions(localMatches);
        setItineraryStep('suggestions');
      } else {
        alert(`Ainda não temos dicas da comunidade para ${newItineraryDest}. Que tal usar nossa Inteligência Artificial?`);
        setItinerarySource('ai');
        // Continua para a busca por IA
      }
      if (itinerarySource === 'community' && localMatches.length > 0) return;
    }

    setIsSearchingCity(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sugira 5 pontos turísticos imperdíveis em ${newItineraryDest}. Retorne apenas um JSON no formato: [{"id": 1, "title": "Nome", "description": "Breve descrição", "time": "09:00"}, ...]`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                time: { type: Type.STRING }
              },
              required: ["id", "title", "description", "time"]
            }
          }
        }
      });
      
      const suggestions = JSON.parse(response.text || '[]');
      setCitySuggestions(suggestions);
      setItineraryStep('suggestions');
    } catch (error) {
      console.error("Erro ao buscar cidade:", error);
      alert("Não foi possível encontrar sugestões para esta cidade.");
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleGetIASuggestions = async () => {
    setIsIaLoading(true);
    setShowIAAssistant(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Estou em ${dados.roteiro.cidade}. Baseado no clima de ${dados.roteiro.clima}, sugira 3 atividades rápidas ou locais próximos para visitar agora. Retorne apenas um JSON no formato: [{"id": 1, "title": "Nome", "description": "Por que ir agora", "icon": "emoji"}]`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING }
              },
              required: ["id", "title", "description", "icon"]
            }
          }
        }
      });
      
      const suggestions = JSON.parse(response.text || '[]');
      setIaSuggestions(suggestions);
    } catch (error) {
      console.error("Erro no Assistente IA:", error);
      setIaSuggestions([{ id: 1, title: "Erro na conexão", description: "Não consegui falar com o guia agora. Tente novamente em breve.", icon: "⚠️" }]);
    } finally {
      setIsIaLoading(false);
    }
  };

  const fetchDashboardSuggestions = async (city: string) => {
    setIsDashboardIaLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Estou em ${city}. Sugira os 10 melhores locais para visitar agora (restaurantes, parques ou pontos turísticos). Retorne apenas um JSON no formato: [{"id": "ia1", "title": "Nome", "description": "Por que ir", "icon": "emoji", "rating": 4.9, "img": "https://images.unsplash.com/..."}]`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING },
                rating: { type: Type.NUMBER },
                img: { type: Type.STRING }
              },
              required: ["id", "title", "description", "icon", "rating", "img"]
            }
          }
        }
      });
      
      const suggestions = JSON.parse(response.text || '[]');
      setDashboardSuggestions(suggestions);
    } catch (error) {
      console.error("Erro ao buscar sugestões do dashboard:", error);
    } finally {
      setIsDashboardIaLoading(false);
    }
  };

  const handleCreateItinerary = () => {
    const newItin: Itinerary = {
      id: Date.now(),
      name: newItineraryName,
      destination: newItineraryDest,
      isCustom: true,
      days: [{ id: 1, dayNumber: 1, stops: selectedStops }]
    };
    setProfileData(prev => ({
      ...prev,
      itineraries: [newItin, ...prev.itineraries],
      credits: (prev.isPremium || isTripActive) ? prev.credits : Math.max(0, prev.credits - 1)
    }));
    setShowCreateItinerary(false);
    setNewItineraryName('');
    setNewItineraryDest('');
    setItineraryStep('initial');
    setCitySuggestions([]);
    setSelectedStops([]);
  };

  const syncItineraryToHome = (itin: Itinerary) => {
    setSyncedItinerary(itin);
    setShowItineraries(false);
  };

  useEffect(() => {
    if (followMe && userCoords && map) {
      map.panTo(userCoords);
      if (map.getZoom()! < 15) map.setZoom(15);
    }
  }, [userCoords, followMe, map]);

  const calculateRoute = async (destination: { lat: number, lng: number }) => {
    if (!userCoords || !isLoaded) return;
    
    setIsCalculatingRoute(true);
    const directionsService = new google.maps.DirectionsService();
    
    try {
      const result = await directionsService.route({
        origin: userCoords,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(result);
      setActiveTab('map'); // Switch to map to show the route
    } catch (error) {
      console.error("Erro ao calcular rota:", error);
      alert("Não foi possível traçar a rota para este local.");
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const openInWaze = (lat: number, lng: number) => {
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
  };

  useEffect(() => {
    if (userCity) {
      fetchDashboardSuggestions(userCity);
    }
  }, [userCity]);

  const handleStartNavigation = () => {
    if (!syncedItinerary) return;
    const firstStop = syncedItinerary.days[0].stops[0];
    
    // Tenta encontrar coordenadas pelo título nos locais conhecidos
    const allLocs = [...LOCATIONS.mundo, ...LOCATIONS.brasil];
    const foundLoc = allLocs.find(l => l.name.toLowerCase().includes(firstStop.title.toLowerCase()) || firstStop.title.toLowerCase().includes(l.name.toLowerCase()));
    
    if (foundLoc) {
      calculateRoute({ lat: foundLoc.lat, lng: foundLoc.lng });
    } else {
      // Se não encontrar, tenta usar a cidade do roteiro como destino genérico
      const cityLoc = allLocs.find(l => l.name.toLowerCase() === syncedItinerary.destination.toLowerCase());
      if (cityLoc) {
        calculateRoute({ lat: cityLoc.lat, lng: cityLoc.lng });
      } else {
        alert("Não consegui localizar as coordenadas exatas deste destino nos meus mapas antigos. Tente selecionar um local diretamente no mapa!");
      }
    }
  };

  const handleHelpful = (localId: number, reviewId: number) => {
    setAllReviews(prev => {
      const reviews = prev[localId] || [];
      return {
        ...prev,
        [localId]: reviews.map(r => r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r)
      };
    });
  };
  const profileAvatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=VT323&family=Outfit:wght@400;600;800&family=Caveat:wght@600&display=swap');
      
      .font-retro-title { font-family: 'Pacifico', cursive; }
      .font-retro-pixel { font-family: 'VT323', monospace; letter-spacing: 0.5px; }
      .font-retro-body { font-family: 'Outfit', sans-serif; }
      .font-handwriting { font-family: 'Caveat', cursive; }
      
      .retro-box { border: 3px solid ${COLORS.border}; box-shadow: 4px 4px 0px ${COLORS.border}; border-radius: 12px; transition: all 0.2s ease; background-color: #ffffff; }
      .retro-box:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px ${COLORS.border}; }

      .polaroid-card { background-color: #ffffff; padding: 8px 8px 24px 8px; border: 3px solid ${COLORS.border}; box-shadow: 4px 4px 0px ${COLORS.border}; transition: transform 0.2s ease, box-shadow 0.2s ease; }
      
      .notebook-bg { background-color: #fcf9f2; background-image: linear-gradient(#64a4ad40 1px, transparent 1px); background-size: 100% 28px; background-position: 0 4px; }
      .map-bg { background-color: #dfcdab; background-image: radial-gradient(#c2a878 1px, transparent 1px); background-size: 20px 20px; }

      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => { setMessages(DADOS_MODO[modoAtivo].chatInicial); }, [modoAtivo]);

  const changeTab = (tab: string) => {
    if (tab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
      if(tab === 'home' || tab === 'map') setCidadeSelecionada(null);
    }, 200);
  };

  const toggleModo = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setModoAtivo(prev => prev === 'mundo' ? 'brasil' : 'mundo');
      setCidadeSelecionada(null); 
      setIsTransitioning(false);
    }, 200);
  };

  // Efeito para suavizar o movimento do mapa
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  const handlePinClick = (cidade: string) => {
    setCidadeSelecionada(cidade);
    // Se estivermos no mapa, apenas centralizamos
    if (activeTab === 'map' && map) {
      const loc = currentLocations.find(l => l.name === cidade);
      if (loc) map.panTo({ lat: loc.lat, lng: loc.lng });
    } else {
      changeTab('explorar');
    }
  };

  // Efeito para geolocalização ao iniciar o app
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        try {
          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "" });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `O usuário está nas coordenadas Latitude: ${latitude}, Longitude: ${longitude}. Identifique a cidade e o estado/país aproximado. Responda APENAS o nome da cidade e estado/país, ex: "São Paulo, Brasil".`,
          });
          const locationText = response.text?.trim() || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setUserCity(locationText);
        } catch (error) {
          console.error("Erro ao identificar cidade:", error);
          setUserCity(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        }
      }, (error) => {
        console.warn("Erro de geolocalização:", error);
      });
    }
  }, []);

  // Efeito para geolocalização ao abrir o chat
  useEffect(() => {
    if (activeTab === 'ia' && !isGreeting) {
      const getGreeting = async () => {
        setIsGreeting(true);
        
        // Mensagem temporária de sintonização
        const tuningId = Date.now();
        setMessages(prev => [...prev, { 
          id: tuningId, 
          type: 'bot', 
          text: '🧭 *Sintonizando rádio e GPS... Buscando sua posição nos mapas antigos.*', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);

        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "" });
              const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `O usuário abriu o guia. Ele está em ${userCity || 'coordenadas Latitude: ' + latitude + ', Longitude: ' + longitude}. 
                Dê as boas-vindas como "O Capitão", mencione que você o localizou pelo GPS e comente algo breve e nostálgico sobre estar nessa região ou sobre a jornada de explorador. 
                Seja breve (máximo 2 parágrafos).`,
                config: {
                  systemInstruction: `Você é um guia de viagem vintage e experiente chamado "O Capitão". 
                  Seu tom é nostálgico, encorajador e cheio de curiosidades históricas. 
                  Mantenha as respostas curtas. Use emojis retrô como 🧭, ⚓, 📜, 🗺️.`,
                }
              });

              const botText = response.text || `Ahoy! Vejo que você está em ${userCity || 'coordenadas interessantes'}. Pronto para a aventura?`;
              setMessages(prev => prev.map(msg => msg.id === tuningId ? { ...msg, text: botText } : msg));
            } catch (error) {
              console.error("Erro na saudação IA:", error);
              setMessages(prev => prev.map(msg => msg.id === tuningId ? { ...msg, text: "Ahoy, explorador! Meu GPS está um pouco instável, mas estou pronto para guiar seus passos. Para onde vamos hoje? 🧭" } : msg));
            }
          }, (error) => {
            console.warn("Erro de geolocalização:", error);
            setMessages(prev => prev.map(msg => msg.id === tuningId ? { ...msg, text: "Ahoy! Não consegui captar seu sinal de GPS (talvez você esteja em um túnel ou floresta densa?), mas não importa! Onde quer que você esteja, estou pronto para ser seu guia. 🧭" } : msg));
          });
        } else {
          setMessages(prev => prev.map(msg => msg.id === tuningId ? { ...msg, text: "Ahoy! Seu equipamento não parece ter suporte a GPS, mas um bom navegador sempre encontra o caminho. Como posso ajudar hoje? 📜" } : msg));
        }
      };

      getGreeting();
    }
  }, [activeTab, userCity]);

  const handleNewSession = () => {
    setMessages([]);
    setIsGreeting(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Check for credits/premium
    if (!profileData.isPremium && profileData.credits <= 0) {
      showToast("Você precisa de um Bilhete de Viagem para falar com o Capitão! 🎫", "error");
      changeTab('perfil');
      return;
    }

    const userText = inputValue;
    const newUserMsg = { id: Date.now(), type: 'user', text: userText, time: 'Agora' };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    
    // Adiciona mensagem de "digitando"
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, type: 'bot', text: '...', time: 'Agora' }]);

    try {
      // Consume credit if not premium
      if (!profileData.isPremium) {
        setProfileData(prev => ({ ...prev, credits: Math.max(0, prev.credits - 1) }));
      }

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userText,
        config: {
          systemInstruction: `Você é um guia de viagem vintage e experiente chamado "O Capitão". 
          Seu tom é nostálgico, encorajador e cheio de curiosidades históricas. 
          Você está ajudando o usuário a explorar ${modoAtivo === 'brasil' ? 'o Brasil' : 'o Mundo'}.
          Mantenha as respostas curtas (máximo 3 parágrafos). 
          Use emojis retrô como 🧭, ⚓, 📜, 🗺️.
          Se o usuário perguntar sobre um lugar específico, dê uma dica "escondida" ou pouco conhecida.`,
        }
      });

      const botText = response.text || "Desculpe, meu rádio está com interferência. Pode repetir?";
      setMessages(prev => prev.map(msg => msg.id === typingId ? { ...msg, text: botText } : msg));
    } catch (error) {
      console.error("Erro na IA:", error);
      setMessages(prev => prev.map(msg => msg.id === typingId ? { ...msg, text: "O sinal está fraco aqui nas montanhas. Tente novamente!" } : msg));
    }
  };

  const handleOpenCreateMemory = () => {
    setShowCreateMemory(true);
    setMemoryLocation(userCity || 'Buscando localização...');
  };

  const handleCloseCreateMemory = () => {
    setShowCreateMemory(false);
    setMemoryImage(null);
    setMemoryText('');
    setMemoryLocation('Buscando localização...');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMemoryImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishMemory = async () => {
    if (!memoryImage || !memoryText.trim()) return;
    
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local: memoryLocation, texto: memoryText, img: memoryImage })
      });
      const newPost = await res.json();
      if (newPost && !newPost.error) {
        setPosts(prev => [newPost, ...prev]);
        stampPassport(memoryLocation.split(',')[0], "📸", "#64a4ad");
        handleCloseCreateMemory();
        changeTab('comunidade');
      } else {
        console.error("Erro ao publicar post:", newPost);
        showToast("Erro ao publicar memória. Tente novamente.", "error");
      }
    } catch (error) {
      console.error("Erro ao publicar:", error);
    }
  };

  const handleEditPost = (post: any) => {
    if (post.user !== profileData.name) return;
    setEditedText(post.texto);
    setIsEditingPost(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPostForDetail) return;
    
    setPosts(prev => prev.map(p => 
      p.id === selectedPostForDetail.id ? { ...p, texto: editedText } : p
    ));
    setSelectedPostForDetail(prev => prev ? { ...prev, texto: editedText } : null);
    setIsEditingPost(false);
  };

  const handleDeletePost = (postId: number) => {
    // Em um app real, usaríamos um modal de confirmação customizado.
    // Para manter a fluidez, vamos filtrar diretamente.
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPostForDetail(null);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSharePost = (post: any) => {
    // Simulação de compartilhamento
    const shareText = `Confira esta memória de ${post.user} em ${post.local}: ${post.texto}`;
    if (navigator.share) {
      navigator.share({
        title: 'Antigravity Memory',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      // Fallback: copiar para área de transferência
      navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
      showToast("Link copiado para a área de transferência!");
    }
  };

  const handleProfileAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpgrade = async (type: 'trip' | 'lifetime', days?: number) => {
    try {
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, days })
      });
      const updatedUser = await res.json();
      if (updatedUser && !updatedUser.error) {
        setProfileData(prev => ({ ...prev, ...updatedUser }));
        showToast(type === 'trip' ? `Viagem de ${days} dias ativada! 🎫` : 'Bem-vindo ao Capitão Pro! ⚓✨');
      } else {
        console.error("Erro no upgrade:", updatedUser);
        showToast("Erro ao realizar upgrade.", "error");
      }
    } catch (error) {
      console.error("Erro no upgrade:", error);
    }
  };

  const saveProfile = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, bio: editBio })
      });
      const updatedUser = await res.json();
      if (updatedUser && !updatedUser.error) {
        setProfileData(prev => ({ ...prev, ...updatedUser }));
        setIsEditingProfile(false);
        showToast('Perfil atualizado! ⚓');
      } else {
        console.error("Erro ao salvar perfil:", updatedUser);
        showToast("Erro ao salvar perfil.", "error");
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    }
  };

  const addSeal = () => {
    const newSeals = [
      { id: 3, name: 'Amante de Café', icon: '☕', color: '#b45a35' },
      { id: 4, name: 'Trilheiro', icon: '⛰️', color: '#2c5e40' },
      { id: 5, name: 'Fotógrafo', icon: '📸', color: '#5a3c28' }
    ];
    const randomSeal = newSeals[Math.floor(Math.random() * newSeals.length)];
    
    // Evita duplicatas (simplificado)
    if (!profileData.seals.find(s => s.name === randomSeal.name)) {
      setProfileData(prev => ({ ...prev, seals: [...prev.seals, randomSeal] }));
    } else {
      alert("Você já tem este selo!");
    }
  };

  const renderHome = () => {
    const safePosts = Array.isArray(posts) ? posts : [];
    const nearMePosts = userCity 
      ? safePosts.filter(p => p.local && p.local.toLowerCase().includes(userCity.toLowerCase()))
      : safePosts;
    
    // Sort by likes descending and take top 3
    const top3Posts = [...nearMePosts]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3);

    const showIaSuggestions = top3Posts.length === 0 && userCity;

    return (
      <div className="p-4 space-y-5 animate-fade-in h-full overflow-y-auto">
      <div className="flex justify-between items-center border-b-2 border-[#5a3c28]/20 pb-3">
        <div>
          <h2 className="font-retro-title text-2xl text-[#4a3320] leading-none mb-1">Bom dia!</h2>
          <div className="flex items-center gap-1 opacity-80 text-[#4a3320]"><MapPin size={12} className="text-[#b45a35]"/><p className="font-retro-body text-xs font-bold">{userCity || dados.roteiro.cidade}</p></div>
        </div>
        <div className="bg-[#e8c678] border-2 border-[#5a3c28] px-2 py-1 rounded-lg shadow-[2px_2px_0px_#5a3c28] transform rotate-2 flex items-center gap-1.5">
          <Sun size={16} className="text-[#b45a35] fill-[#b45a35]"/><p className="font-retro-pixel text-lg text-[#4a3320] font-bold">{userCity ? '24°C' : '--°C'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowItineraries(true)} className="bg-[#b45a35] text-[#f3ecdb] p-3 rounded-xl border-2 border-[#5a3c28] shadow-[3px_3px_0px_#5a3c28] flex flex-col items-center justify-center gap-1 hover:bg-[#8a3c1f] active:translate-y-0.5 active:shadow-[1px_1px_0px_#5a3c28] transition-all group">
          <Compass size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-retro-pixel text-[10px] font-bold uppercase">Nova Viagem</span>
        </button>
        <button onClick={() => { changeTab('perfil'); }} className="bg-[#f3ecdb] p-3 rounded-xl border-2 border-[#5a3c28] shadow-[3px_3px_0px_#5a3c28] flex flex-col items-center justify-center gap-1 hover:bg-white active:translate-y-0.5 active:shadow-[1px_1px_0px_#5a3c28] transition-all">
          <Bookmark size={20} className="text-[#b45a35]" fill="#b45a35" />
          <span className="font-retro-pixel text-[10px] font-bold uppercase">Favoritos</span>
        </button>
      </div>

      <div>
         <h3 className="font-retro-body font-bold text-base text-[#4a3320] mb-2.5 flex items-center gap-2"><Navigation size={16} className="text-[#b45a35]" fill="#b45a35"/> {syncedItinerary ? `Roteiro: ${syncedItinerary.name}` : 'No Roteiro Agora'}</h3>
         <div className="retro-box p-3.5 relative overflow-hidden bg-[#f3ecdb] border-2 border-[#b45a35] shadow-[3px_3px_0px_#5a3c28]">
            <VintageStamp text={syncedItinerary ? "ATIVO" : "PRÓXIMO"} color="#b45a35" rotate="-5deg" />
            <div className="absolute right-[-15px] top-[-15px] opacity-10 text-[#b45a35]"><Camera size={80} /></div>
            <div className="relative z-10 mt-5">
               <div className="flex justify-between items-start mb-1">
                  <h4 className="font-retro-title text-xl text-[#4a3320] leading-tight">{syncedItinerary?.days[0]?.stops[0]?.title || dados.roteiro.paradaAtual.titulo}</h4>
                  <span className="bg-[#e8c678] border-2 border-[#5a3c28] font-retro-pixel px-1.5 py-0.5 rounded text-[11px] shadow-sm font-bold text-[#4a3320]">{syncedItinerary?.days[0]?.stops[0]?.time || dados.roteiro.paradaAtual.hora}</span>
               </div>
               <p className="font-retro-body text-xs text-[#4a3320] opacity-90 mb-3.5 border-l-2 border-[#b45a35] pl-2 mt-1.5">{syncedItinerary?.days[0]?.stops[0]?.description || dados.roteiro.paradaAtual.description}</p>
               <button 
                 onClick={handleStartNavigation}
                 className="w-full bg-[#b45a35] text-[#f3ecdb] font-retro-body font-bold py-2 rounded-md border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] flex items-center justify-center gap-2 hover:bg-[#8a3c1f] transition-colors text-sm"
               >
                 <Navigation size={14} /> {syncedItinerary ? 'Seguir Roteiro' : 'Iniciar GPS'}
               </button>
            </div>
         </div>
      </div>

      <div>
         <div className="flex justify-between items-end mb-2.5">
            <h3 className="font-retro-body font-bold text-base text-[#4a3320] flex items-center gap-2">
              <MessageSquare size={16} className="text-[#64a4ad]" fill="#64a4ad"/> Perto de você
            </h3>
            <button 
              onClick={() => {
                if (showIaSuggestions) {
                  setShowingAllIaSuggestions(true);
                } else {
                  changeTab('comunidade');
                }
              }} 
              className="text-[#b45a35] font-retro-pixel text-[10px] font-bold uppercase underline"
            >
              Ver tudo
            </button>
         </div>
         
         {isDashboardIaLoading ? (
           <div className="py-4 flex flex-col items-center justify-center space-y-2">
             <div className="w-6 h-6 border-3 border-[#64a4ad] border-t-transparent rounded-full animate-spin"></div>
             <p className="font-retro-pixel text-[10px] text-[#5a3c28]">Buscando locais próximos...</p>
           </div>
         ) : (
           <div className="flex overflow-x-auto hide-scrollbar gap-3.5 pb-3">
             {showIaSuggestions ? (
               dashboardSuggestions.map((item, idx) => (
                 <div key={item.id} className="w-[180px] max-w-[180px] polaroid-card relative flex-shrink-0 cursor-pointer p-2 group" style={{ transform: `rotate(${idx % 2 === 0 ? '-2deg' : '2deg'})` }}>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-2.5 bg-[#e8c678]/80 backdrop-blur-sm transform rotate-1 z-10 opacity-70"></div>
                    <div className="relative overflow-hidden mb-1.5">
                      <img src={item.img} alt={item.title} className="w-full h-20 object-cover border-2 border-[#5a3c28] group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-1 right-1 bg-[#e8c678] border border-[#5a3c28] px-1 rounded flex items-center gap-0.5">
                        <Star size={8} fill="#b45a35" className="text-[#b45a35]" />
                        <span className="font-retro-pixel text-[8px] font-bold">{item.rating}</span>
                      </div>
                    </div>
                    <div className="px-0.5">
                       <p className="font-handwriting text-[#4a3320] text-sm leading-tight line-clamp-1 mb-0.5">{item.title}</p>
                       <p className="font-retro-pixel text-[8px] text-[#5a3c28]/70 line-clamp-2 leading-none">{item.description}</p>
                       <div className="flex items-center gap-1 border-t border-[#5a3c28]/20 pt-1 mt-1.5">
                          <span className="font-retro-pixel text-[8px] text-[#64a4ad] font-bold uppercase">Sugerido por IA</span>
                          <span className="ml-auto text-xs">{item.icon}</span>
                       </div>
                    </div>
                 </div>
               ))
             ) : (
               top3Posts.map((post, idx) => (
                  <div key={post.id} className="w-[180px] max-w-[180px] polaroid-card relative flex-shrink-0 cursor-pointer p-2 group" onClick={() => setSelectedPostForDetail(post)} style={{ transform: `rotate(${idx % 2 === 0 ? '-2deg' : '2deg'})` }}>
                     <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-2.5 bg-[#e8c678]/80 backdrop-blur-sm transform rotate-1 z-10 opacity-70"></div>
                     <div className="relative overflow-hidden mb-1.5" onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}>
                       <img src={post.img} alt={post.local} className="w-full h-20 object-cover border-2 border-[#5a3c28] group-hover:scale-105 transition-transform duration-500" />
                       <AnimatePresence>
                         {animatingLikes.includes(post.id) && (
                           <motion.div 
                             initial={{ scale: 0, opacity: 0 }}
                             animate={{ scale: 1, opacity: 1 }}
                             exit={{ scale: 0, opacity: 0 }}
                             className="absolute inset-0 flex items-center justify-center pointer-events-none"
                           >
                             <Heart size={30} fill="#b45a35" className="text-[#b45a35] drop-shadow-md" />
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                     <div className="px-0.5">
                        <p className="font-handwriting text-[#4a3320] text-base leading-tight line-clamp-2 mb-1 break-words whitespace-pre-wrap">{post.texto}</p>
                        <div className="flex items-center gap-1 border-t border-[#5a3c28]/20 pt-1 mt-0.5">
                           <img src={post.avatar} className="w-3.5 h-3.5 rounded-full border border-[#5a3c28] object-cover" alt="user"/>
                           <span className="font-retro-pixel text-[9px] text-[#5a3c28] font-bold truncate">{post.user}</span>
                           <div className="ml-auto flex items-center gap-0.5">
                             <Heart size={8} fill={likedPosts.includes(post.id) ? "#b45a35" : "transparent"} className={likedPosts.includes(post.id) ? "text-[#b45a35]" : "text-[#5a3c28]"} />
                             <span className="font-retro-pixel text-[7px] font-bold">{post.likes}</span>
                           </div>
                        </div>
                     </div>
                  </div>
               ))
             )}
             
             {top3Posts.length > 0 && nearMePosts.length > 3 && (
               <div 
                 onClick={() => changeTab('comunidade')}
                 className="w-[100px] flex-shrink-0 flex flex-col items-center justify-center gap-2 bg-[#e8c678]/20 border-2 border-dashed border-[#5a3c28]/30 rounded-xl cursor-pointer hover:bg-[#e8c678]/40 transition-colors"
               >
                 <div className="w-8 h-8 rounded-full bg-[#b45a35] flex items-center justify-center text-white">
                   <Plus size={16} />
                 </div>
                 <span className="font-retro-pixel text-[8px] font-bold text-[#5a3c28] uppercase">Ver Mais</span>
               </div>
             )}
          </div>
         )}
      </div>
    </div>
    );
  };

  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  const renderMap = () => {
    return (
      <div className="relative h-full flex flex-col">
        <div className="p-3 z-10 shadow-md border-b-4 border-[#5a3c28] transition-colors duration-500" style={{ backgroundColor: modoAtivo === 'brasil' ? '#2c5e40' : '#b45a35' }}>
          <div className="relative">
            <input type="text" placeholder="Buscar local no mapa..." className="w-full bg-[#f3ecdb] border-2 border-[#5a3c28] rounded-full py-2 pl-9 pr-4 font-retro-body font-bold text-[#4a3320] shadow-[2px_2px_0px_#5a3c28] text-sm"/>
            <Search className="absolute left-3 top-2.5 text-[#5a3c28]" size={16} />
          </div>
        </div>
        
        <div className="flex-grow relative overflow-hidden bg-[#f3ecdb]">
          {(loadError || authError) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#f3ecdb] z-50">
              <div className="text-red-500 mb-4">
                <AlertTriangle size={48} className="mx-auto mb-2 opacity-50" />
                <h3 className="font-retro-title text-lg">Problema de Configuração</h3>
              </div>
              <p className="font-retro-body text-xs text-[#5a3c28] max-w-xs mb-4">
                {authError || "Não foi possível conectar aos servidores de cartografia."}
              </p>
              <div className="space-y-2 w-full max-w-xs">
                <div className="p-3 bg-white/80 border-2 border-[#5a3c28] rounded-lg text-[10px] text-left font-retro-body">
                  <p className="font-bold text-[#b45a35] mb-1">Checklist de Solução:</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Ativar "Maps JavaScript API" no Cloud Console</li>
                    <li>Vincular Conta de Faturamento (Billing)</li>
                    <li>Remover restrições de IP/Referrer da chave para teste</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : !isLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-[#f3ecdb]">
              <div className="w-12 h-12 border-4 border-[#b45a35] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-retro-pixel text-[#5a3c28] animate-pulse">Desenhando pergaminhos...</p>
              {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                <p className="text-[10px] text-red-500 font-bold uppercase mt-4 px-8 text-center">Aviso: Chave de API do Google Maps não configurada nos Secrets.</p>
              )}
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={center}
              zoom={zoom}
              options={MAP_OPTIONS}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              {/* Marcador da Posição do Usuário */}
              {userCoords && (
                <Marker
                  position={userCoords}
                  icon={{
                    path: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#ffffff",
                    scale: 1.5,
                    anchor: new google.maps.Point(12, 12),
                    rotation: 0 // Poderia ser dinâmico se tivéssemos o heading
                  }}
                  title="Você está aqui"
                />
              )}

              {directionsResponse && (
                <DirectionsRenderer 
                  directions={directionsResponse}
                  options={{
                    polylineOptions: {
                      strokeColor: "#b45a35",
                      strokeWeight: 5,
                      strokeOpacity: 0.8
                    },
                    suppressMarkers: false
                  }}
                />
              )}

              {currentLocations.map((loc) => (
                <Marker
                  key={loc.id}
                  position={{ lat: loc.lat, lng: loc.lng }}
                  onClick={() => setSelectedMarker(loc)}
                  icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    fillColor: "#b45a35",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#5a3c28",
                    scale: 1.5,
                  }}
                />
              ))}

              {selectedMarker && (
                <InfoWindow
                  position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-2 max-w-[200px] bg-[#f3ecdb] font-retro-body">
                    <h3 className="font-bold text-[#b45a35] text-sm mb-1">{selectedMarker.name}</h3>
                    <p className="text-[11px] text-[#5a3c28] leading-tight">{selectedMarker.description}</p>
                    <button 
                      onClick={() => handlePinClick(selectedMarker.name)}
                      className="mt-2 w-full bg-[#b45a35] text-white text-[10px] py-1 rounded border border-[#5a3c28] font-bold uppercase"
                    >
                      Ver Detalhes
                    </button>
                    <button 
                      onClick={() => calculateRoute({ lat: selectedMarker.lat, lng: selectedMarker.lng })}
                      disabled={isCalculatingRoute}
                      className="mt-1 w-full bg-[#64a4ad] text-white text-[10px] py-1 rounded border border-[#5a3c28] font-bold uppercase flex items-center justify-center gap-1"
                    >
                      {isCalculatingRoute ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : (
                        <Navigation size={10} />
                      )}
                      Traçar Rota
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
          
          {/* Overlay de Textura de Papel */}
          <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/paper-fibers.png)' }}></div>
          
          {/* Botões de Controle do Mapa */}
          <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
            <button 
              onClick={() => setFollowMe(!followMe)}
              className={`p-3 rounded-full border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] transition-all ${followMe ? 'bg-[#b45a35] text-white' : 'bg-[#f3ecdb] text-[#5a3c28]'}`}
              title={followMe ? "Desativar Acompanhamento" : "Ativar Acompanhamento"}
            >
              <Navigation size={20} className={followMe ? "fill-white" : ""} />
            </button>
            <button 
              onClick={() => {
                if (userCoords) map?.panTo(userCoords);
              }}
              className="p-3 bg-[#f3ecdb] text-[#5a3c28] rounded-full border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] hover:bg-white transition-all"
              title="Centralizar em mim"
            >
              <MapPin size={20} />
            </button>
          </div>

          {/* Painel de Rota Ativa */}
          <AnimatePresence>
            {directionsResponse && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-4 left-4 right-4 bg-[#f3ecdb] border-2 border-[#5a3c28] rounded-xl shadow-[4px_4px_0px_#5a3c28] p-4 z-20"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-retro-title text-lg text-[#4a3320] leading-none">Rota Traçada</h4>
                    <p className="font-retro-pixel text-[10px] text-[#b45a35] uppercase font-bold mt-1">
                      {directionsResponse.routes[0].legs[0].distance?.text} • {directionsResponse.routes[0].legs[0].duration?.text}
                    </p>
                  </div>
                  <button 
                    onClick={() => setDirectionsResponse(null)}
                    className="p-1 bg-[#5a3c28]/10 rounded-full text-[#5a3c28] hover:bg-[#5a3c28]/20"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      const dest = directionsResponse.routes[0].legs[0].end_location;
                      openInWaze(dest.lat(), dest.lng());
                    }}
                    className="flex items-center justify-center gap-2 bg-[#33ccff] text-white font-retro-pixel text-xs font-bold py-2 rounded-lg border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] hover:translate-y-0.5 hover:shadow-none transition-all"
                  >
                    <Navigation size={14} /> Abrir no Waze
                  </button>
                  <button 
                    onClick={() => {
                      const dest = directionsResponse.routes[0].legs[0].end_location;
                      openInGoogleMaps(dest.lat(), dest.lng());
                    }}
                    className="flex items-center justify-center gap-2 bg-[#4285F4] text-white font-retro-pixel text-xs font-bold py-2 rounded-lg border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] hover:translate-y-0.5 hover:shadow-none transition-all"
                  >
                    <MapIcon size={14} /> Google Maps
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bússola Decorativa */}
          <div className="absolute bottom-6 right-6 w-16 h-16 opacity-40 pointer-events-none transform rotate-12">
            <Compass size={64} className="text-[#5a3c28]" />
          </div>
        </div>
      </div>
    );
  };

  const renderExplorar = () => {
    const locaisExibidos = cidadeSelecionada ? dados.locaisExplorar.filter(l => l.cidade === cidadeSelecionada) : dados.locaisExplorar;
    
    if (selectedLocal) return renderLocalDetalhe();

    return (
      <div className="p-4 space-y-5 animate-fade-in h-full overflow-y-auto bg-[#f3ecdb]">
        <div className="flex items-center gap-2 mb-1">
          {cidadeSelecionada && <button onClick={() => setCidadeSelecionada(null)} className="p-1.5 bg-white retro-box text-[#4a3320] hover:bg-[#e8c678]"><ChevronLeft size={18} /></button>}
          <div className="relative flex-grow">
            <input type="text" placeholder="Buscar lugares..." className="w-full bg-[#ffffff] border-2 border-[#5a3c28] rounded-full py-2 pl-9 pr-4 font-retro-body font-bold text-[#4a3320] shadow-[2px_2px_0px_#5a3c28] text-sm"/>
            <Search className="absolute left-3 top-2.5 text-[#5a3c28]" size={16} />
          </div>
        </div>
        <h3 className="font-retro-title text-2xl text-[#4a3320] border-b-2 border-[#5a3c28]/10 pb-1.5">
          {cidadeSelecionada ? `Explorar ${cidadeSelecionada}` : 'Top da Semana'}
        </h3>
        <div className="grid grid-cols-2 gap-3.5">
          {locaisExibidos.map((local, idx) => (
            <div key={local.id} onClick={() => setSelectedLocal(local)} className="polaroid-card relative cursor-pointer p-2" style={{ transform: `rotate(${idx % 2 === 0 ? '-3deg' : '3deg'})` }}>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-[#e8c678]/80 backdrop-blur-sm transform -rotate-2 z-10 opacity-70"></div>
              <img src={local.img} alt={local.nome} className="w-full aspect-square object-cover mb-1.5 border-2 border-[#5a3c28]" />
              <div className="px-0.5 text-center">
                <h4 className="font-retro-title text-base text-[#4a3320] leading-tight mb-1 truncate">{local.nome}</h4>
                <div className="flex items-center justify-center gap-1 text-[#b45a35]">
                  <Star size={10} fill="#b45a35" />
                  <span className="font-retro-pixel text-[10px] font-bold">{local.rating}</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(local.id); }}
                className="absolute top-3 right-3 bg-white/90 p-1 rounded-full border border-[#5a3c28] shadow-sm"
              >
                <Bookmark size={12} fill={profileData.favorites.includes(local.id) ? "#b45a35" : "transparent"} color="#5a3c28" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLocalDetalhe = () => {
    const reviews = allReviews[selectedLocal.id] || [];
    const isFav = profileData.favorites.includes(selectedLocal.id);

    return (
      <div className="flex flex-col h-full animate-fade-in bg-[#f3ecdb]">
        <div className="relative h-48 flex-shrink-0">
          <img src={selectedLocal.img} alt={selectedLocal.nome} className="w-full h-full object-cover border-b-4 border-[#5a3c28]" />
          <button onClick={() => setSelectedLocal(null)} className="absolute top-4 left-4 bg-white/90 p-2 rounded-full border-2 border-[#5a3c28] shadow-md">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => toggleFavorite(selectedLocal.id)} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full border-2 border-[#5a3c28] shadow-md">
            <Bookmark size={20} fill={isFav ? "#b45a35" : "transparent"} />
          </button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-retro-title text-3xl text-[#4a3320] leading-tight">{selectedLocal.nome}</h2>
              <p className="font-retro-pixel text-xs text-[#64a4ad] font-bold uppercase tracking-widest">{selectedLocal.categoria} • {selectedLocal.cidade}</p>
            </div>
            <div className="bg-[#e8c678] border-2 border-[#5a3c28] px-2 py-1 rounded-lg shadow-[2px_2px_0px_#5a3c28] flex items-center gap-1">
              <Star size={16} fill="#b45a35" color="#b45a35" />
              <span className="font-retro-pixel text-lg font-bold">{selectedLocal.rating}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-grow bg-[#64a4ad] text-white font-retro-body font-bold py-2 rounded-lg border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] flex items-center justify-center gap-2">
              <MapPin size={16} /> Como Chegar
            </button>
            <button onClick={() => setShowAddReview(true)} className="flex-grow bg-[#b45a35] text-white font-retro-body font-bold py-2 rounded-lg border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] flex items-center justify-center gap-2">
              <Star size={16} /> Avaliar
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="font-retro-body font-bold text-lg text-[#4a3320] border-b-2 border-[#5a3c28]/10 pb-1">Avaliações da Comunidade</h3>
            {reviews.length === 0 ? (
              <p className="font-retro-pixel text-sm text-[#5a3c28]/60 italic text-center py-4">Nenhuma avaliação ainda. Seja o primeiro!</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="retro-box p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img src={review.userAvatar} className="w-6 h-6 rounded-full border border-[#5a3c28]" alt="avatar" />
                      <span className="font-retro-body font-bold text-xs">{review.userName}</span>
                      {review.verified && <div className="bg-green-100 text-green-700 text-[8px] px-1 rounded border border-green-200 font-bold uppercase">Visitado</div>}
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < review.rating ? "#b45a35" : "transparent"} color="#b45a35" />
                      ))}
                    </div>
                  </div>
                  <p className="font-handwriting text-lg leading-tight text-[#4a3320]">{review.comment}</p>
                  <div className="flex justify-between items-center pt-1 border-t border-[#5a3c28]/10">
                    <span className="font-retro-pixel text-[9px] text-[#5a3c28]/60">{review.date}</span>
                    <button 
                      onClick={() => handleHelpful(selectedLocal.id, review.id)}
                      className="flex items-center gap-1 text-[#64a4ad] font-retro-pixel text-[10px] font-bold hover:scale-105"
                    >
                      <ThumbsUp size={10} /> Útil ({review.helpful})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Adicionar Review */}
        {showAddReview && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-[300px] bg-[#f3ecdb] rounded-2xl border-4 border-[#5a3c28] shadow-[6px_6px_0px_#5a3c28] p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-retro-title text-xl">Sua Avaliação</h3>
                <button onClick={() => setShowAddReview(false)}><X size={20} /></button>
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setReviewRating(star)}>
                    <Star size={24} fill={star <= reviewRating ? "#b45a35" : "transparent"} color="#b45a35" />
                  </button>
                ))}
              </div>
              <textarea 
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Conte como foi sua experiência..."
                className="w-full bg-white border-2 border-[#5a3c28] rounded-lg p-2 font-handwriting text-lg h-24 resize-none"
              />
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setReviewPhotos(prev => [...prev, reader.result as string]);
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="bg-white border-2 border-[#5a3c28] p-2 rounded-lg text-[#5a3c28]"
                >
                  <Camera size={20} />
                </button>
                <div className="flex gap-1 overflow-x-auto">
                  {reviewPhotos.map((p, i) => <img key={i} src={p} className="w-10 h-10 rounded border border-[#5a3c28] object-cover" alt="rev" />)}
                </div>
              </div>
              <button 
                onClick={handleAddReview}
                className="w-full bg-[#b45a35] text-white font-retro-body font-bold py-2 rounded-lg border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28]"
              >
                Publicar Review
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPerfil = () => (
    <div className="p-4 space-y-5 animate-fade-in h-full overflow-y-auto bg-[#f3ecdb]">
      {/* Cabeçalho do Perfil */}
      <div className="flex flex-col items-center text-center pt-4">
        <div className="relative group mb-2.5">
          <div className="w-24 h-24 rounded-full border-4 border-[#5a3c28] shadow-[4px_4px_0px_#5a3c28] overflow-hidden bg-white">
            <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          {isEditingProfile && (
            <button 
              onClick={() => profileAvatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-[#e8c678] p-1.5 rounded-full border-2 border-[#5a3c28] shadow-sm hover:bg-[#d4b264]"
            >
              <Camera size={16} className="text-[#5a3c28]" />
            </button>
          )}
          <input type="file" accept="image/*" className="hidden" ref={profileAvatarInputRef} onChange={handleProfileAvatarUpload} />
        </div>
        
        {isEditingProfile ? (
          <div className="w-full max-w-[280px] space-y-2.5">
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-white border-2 border-[#5a3c28] rounded-lg px-3 py-2 font-retro-body font-bold text-[#4a3320] text-center text-sm"
              placeholder="Seu Nome"
            />
            <textarea 
              value={editBio} 
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full bg-white border-2 border-[#5a3c28] rounded-lg px-3 py-2 font-handwriting text-xl text-[#4a3320] text-center resize-none h-20"
              placeholder="Sua Bio"
            />
          </div>
        ) : (
          <>
            <h2 className="font-retro-title text-3xl text-[#4a3320] leading-tight">{profileData.name}</h2>
            <p className="font-handwriting text-xl text-[#5a3c28] mt-1 px-4">{profileData.bio}</p>
          </>
        )}
      </div>

      {/* Botão de Ação do Perfil */}
      <div className="px-2 space-y-4">
        {/* Status de Navegação (Monetização) */}
        <div className="bg-[#5a3c28] text-[#f3ecdb] p-4 rounded-2xl border-2 border-[#5a3c28] shadow-[4px_4px_0px_#b45a35] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20">
            <Anchor size={64} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-retro-title text-xl leading-none">Status de Navegação</h4>
                <p className="font-retro-pixel text-[10px] uppercase tracking-widest mt-1 opacity-80">
                  {profileData.isPremium ? '⚓ Capitão Pro (Vitalício)' : isTripActive ? `⛵ Viagem Ativa` : '⛵ Navegante Padrão'}
                </p>
              </div>
              {isTripActive && !profileData.isPremium && (
                <div className="bg-[#e8c678] text-[#4a3320] px-2 py-1 rounded border border-white/20 flex items-center gap-1">
                  <Clock size={14} />
                  <span className="font-retro-pixel text-xs font-bold">
                    {Math.ceil((new Date(profileData.activeTripUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d Restantes
                  </span>
                </div>
              )}
            </div>

            {!profileData.isPremium && (
              <div className="space-y-3 mt-4">
                <p className="font-retro-pixel text-[9px] uppercase font-bold opacity-70">Ativar Passaporte por Tempo:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleUpgrade('trip', 3)}
                    className="bg-[#f3ecdb] text-[#4a3320] font-retro-pixel text-[9px] font-bold py-2 rounded border-2 border-[#b45a35] hover:bg-white transition-colors flex flex-col items-center"
                  >
                    <span>Final de Semana (3d)</span>
                    <span className="text-[#b45a35] mt-1">R$ 9,90</span>
                  </button>
                  <button 
                    onClick={() => handleUpgrade('trip', 7)}
                    className="bg-[#f3ecdb] text-[#4a3320] font-retro-pixel text-[9px] font-bold py-2 rounded border-2 border-[#b45a35] hover:bg-white transition-colors flex flex-col items-center"
                  >
                    <span>Férias (7d)</span>
                    <span className="text-[#b45a35] mt-1">R$ 19,90</span>
                  </button>
                  <button 
                    onClick={() => handleUpgrade('trip', 30)}
                    className="bg-[#f3ecdb] text-[#4a3320] font-retro-pixel text-[9px] font-bold py-2 rounded border-2 border-[#5a3c28] hover:bg-white transition-colors flex flex-col items-center"
                  >
                    <span>Mochilão (30d)</span>
                    <span className="text-[#b45a35] mt-1">R$ 39,90</span>
                  </button>
                  <button 
                    onClick={() => handleUpgrade('lifetime')}
                    className="bg-[#e8c678] text-[#4a3320] font-retro-pixel text-[9px] font-bold py-2 rounded border-2 border-white hover:bg-[#f3ecdb] transition-colors flex flex-col items-center"
                  >
                    <span>Vitalício</span>
                    <span className="text-[#b45a35] mt-1">R$ 127,00</span>
                  </button>
                </div>
              </div>
            )}
            
            {profileData.isPremium && (
              <p className="font-retro-body text-xs italic opacity-90 mt-2">
                "Você tem acesso total a todos os mapas e tesouros do mundo!"
              </p>
            )}
          </div>
        </div>

        {isEditingProfile ? (
          <button 
            onClick={saveProfile}
            className="w-full bg-[#64a4ad] text-[#f3ecdb] font-retro-body font-bold py-3 rounded-xl border-2 border-[#5a3c28] shadow-[3px_3px_0px_#5a3c28] flex items-center justify-center gap-2 hover:bg-[#4f8a92] active:translate-y-0.5 active:shadow-[1px_1px_0px_#5a3c28] transition-all text-sm"
          >
            Salvar Passaporte
          </button>
        ) : (
          <div className="space-y-3">
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="w-full bg-[#e8c678] text-[#4a3320] font-retro-body font-bold py-3 rounded-xl border-2 border-[#5a3c28] shadow-[3px_3px_0px_#5a3c28] flex items-center justify-center gap-2 hover:bg-[#d4b264] active:translate-y-0.5 active:shadow-[1px_1px_0px_#5a3c28] transition-all text-sm"
            >
              <Edit3 size={18} /> Editar Passaporte
            </button>
            
            <button 
              onClick={isInstallable ? handleInstallClick : () => setShowInstallGuide(true)}
              className="w-full bg-[#b45a35] text-[#f3ecdb] font-retro-body font-bold py-3 rounded-xl border-2 border-[#5a3c28] shadow-[3px_3px_0px_#5a3c28] flex items-center justify-center gap-2 hover:bg-[#8a3c1f] active:translate-y-0.5 active:shadow-[1px_1px_0px_#5a3c28] transition-all text-sm"
            >
              <Download size={18} /> {isInstallable ? 'Instalar Aplicativo' : 'Como Instalar'}
            </button>
          </div>
        )}
      </div>

      {/* Configurações Rápidas */}
      <div className="px-2">
        <div className="bg-white border-2 border-[#5a3c28] rounded-2xl p-3 shadow-[2px_2px_0px_#5a3c28] space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${profileData.isPremium ? 'bg-[#64a4ad]/20 text-[#64a4ad]' : 'bg-gray-200 text-gray-400'}`}>
                <WifiOff size={16} />
              </div>
              <div>
                <p className="font-retro-body font-bold text-xs">Modo Offline</p>
                <p className="font-retro-pixel text-[8px] text-[#5a3c28]/60 uppercase">Mapas e Roteiros em Cache</p>
              </div>
            </div>
            {profileData.isPremium ? (
              <div className="w-10 h-5 bg-[#64a4ad] rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            ) : (
              <Lock size={14} className="text-[#b45a35]" />
            )}
          </div>
        </div>
      </div>

      {/* Selos/Conquistas */}
      <div className="px-2">
        <div className="flex justify-between items-center mb-3 border-b-2 border-[#5a3c28]/10 pb-1">
          <h3 className="font-retro-body font-bold text-lg text-[#4a3320] flex items-center gap-2">
            <Award size={18} className="text-[#b45a35]" /> Meu Passaporte
          </h3>
          <div className="flex items-center gap-1 bg-[#64a4ad]/10 px-2 py-0.5 rounded-full border border-[#64a4ad]/20">
            <Sparkles size={10} className="text-[#64a4ad]" />
            <span className="font-retro-pixel text-[8px] font-bold text-[#64a4ad] uppercase">Nível {Math.floor(profileData.seals.length / 3) + 1}</span>
          </div>
        </div>
        
        <div className="bg-[#f3ecdb] border-2 border-[#5a3c28] rounded-2xl p-4 shadow-[inset_2px_2px_8px_rgba(0,0,0,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#5a3c28 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="grid grid-cols-3 gap-4 relative z-10">
            {profileData.seals.length === 0 ? (
              <div className="col-span-3 py-6 flex flex-col items-center justify-center opacity-40 grayscale">
                <MapPinned size={40} className="mb-2" />
                <p className="font-retro-pixel text-[10px] text-center">Nenhum carimbo ainda. Explore o mapa para ganhar selos!</p>
              </div>
            ) : (
              profileData.seals.map(seal => (
                <motion.div 
                  key={seal.id} 
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#5a3c28]/40 flex items-center justify-center relative">
                    <div className="absolute inset-1 rounded-full border-2 border-[#5a3c28] flex items-center justify-center bg-white shadow-sm overflow-hidden">
                       <div className="absolute inset-0 opacity-10" style={{ backgroundColor: seal.color }}></div>
                       <span className="text-3xl relative z-10 filter drop-shadow-sm">{seal.icon}</span>
                    </div>
                    {/* Efeito de carimbo vintage */}
                    <div className="absolute -top-1 -right-1 bg-[#b45a35] text-white text-[7px] font-retro-pixel px-1 rounded-sm border border-[#5a3c28] rotate-12 shadow-sm">OK</div>
                  </div>
                  <span className="font-retro-pixel text-[8px] font-bold text-[#5a3c28] uppercase text-center leading-tight">
                    {seal.name}
                  </span>
                </motion.div>
              ))
            )}
            
            {/* Espaços vazios para incentivar exploração */}
            {[...Array(Math.max(0, 6 - profileData.seals.length))].map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1.5 opacity-20">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#5a3c28]/40 flex items-center justify-center">
                  <Plus size={20} className="text-[#5a3c28]" />
                </div>
                <div className="w-10 h-2 bg-[#5a3c28]/20 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-3 flex justify-center">
          <p className="font-retro-pixel text-[9px] text-[#5a3c28]/60 italic">
            "Cada carimbo é uma história contada ao vento."
          </p>
        </div>
      </div>

      {/* Favoritos e Reviews */}
      <div className="space-y-6 px-2">
        <div>
          <div className="flex justify-between items-center border-b-2 border-[#5a3c28]/10 pb-1 mb-3">
            <h3 className="font-retro-body font-bold text-lg text-[#4a3320] flex items-center gap-2">
              <Bookmark size={18} className="text-[#b45a35]" fill="#b45a35" /> Favoritos
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {profileData.favorites.length === 0 ? (
              <p className="col-span-2 text-center font-retro-pixel text-[11px] text-[#5a3c28]/60 italic py-4">Nenhum favorito salvo.</p>
            ) : (
              profileData.favorites.map(favId => {
                const local = [...DADOS_MODO.mundo.locaisExplorar, ...DADOS_MODO.brasil.locaisExplorar].find(l => l.id === favId);
                if (!local) return null;
                return (
                  <div key={favId} onClick={() => { setSelectedLocal(local); changeTab('explorar'); }} className="bg-white border-2 border-[#5a3c28] p-2 rounded-xl flex items-center gap-2.5 cursor-pointer hover:bg-[#f3ecdb] shadow-[2px_2px_0px_#5a3c28] active:translate-y-0.5 active:shadow-none transition-all">
                    <img src={local.img} className="w-10 h-10 rounded-lg object-cover border border-[#5a3c28]" alt="fav" />
                    <span className="font-retro-pixel text-[10px] font-bold truncate">{local.nome}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center border-b-2 border-[#5a3c28]/10 pb-1 mb-3">
            <h3 className="font-retro-body font-bold text-lg text-[#4a3320] flex items-center gap-2">
              <Star size={18} className="text-[#e8c678]" fill="#e8c678" /> Minhas Avaliações
            </h3>
          </div>
          <div className="space-y-3">
            {profileData.reviews.length === 0 ? (
              <p className="text-center font-retro-pixel text-[11px] text-[#5a3c28]/60 italic py-4">Você ainda não avaliou locais.</p>
            ) : (
              profileData.reviews.map(rev => (
                <div key={rev.id} className="bg-white border-2 border-[#5a3c28] p-3 rounded-xl shadow-[2px_2px_0px_#5a3c28]">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < rev.rating ? "#b45a35" : "transparent"} color="#b45a35" />)}
                    </div>
                    <span className="font-retro-pixel text-[9px] text-[#5a3c28]/60">{rev.date}</span>
                  </div>
                  <p className="font-handwriting text-lg leading-tight line-clamp-2">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderIA = () => {
    const isLocked = !profileData.isPremium && !isTripActive;

    return (
      <div className="flex flex-col h-full animate-fade-in relative">
        {isLocked && (
          <div className="absolute inset-0 z-50 bg-[#f3ecdb]/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-[#5a3c28] rounded-full flex items-center justify-center shadow-lg mb-4">
              <Lock size={40} className="text-[#e8c678]" />
            </div>
            <h3 className="font-retro-title text-2xl text-[#4a3320] mb-2">Rádio Silencioso</h3>
            <p className="font-retro-body text-sm text-[#5a3c28] mb-6">
              O Capitão precisa de um <b>Bilhete de Viagem</b> para sintonizar a frequência e te guiar.
            </p>
            <button 
              onClick={() => changeTab('perfil')}
              className="bg-[#b45a35] text-[#f3ecdb] font-retro-body font-bold py-3 px-8 rounded-xl border-2 border-[#5a3c28] shadow-[4px_4px_0px_#5a3c28] active:translate-y-0.5 active:shadow-none transition-all"
            >
              Obter Bilhetes 🎫
            </button>
          </div>
        )}
        <div className="bg-[#f3ecdb] p-3 border-b-2 border-[#5a3c28] shadow-sm z-10 flex items-center justify-between">
         <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#64a4ad] rounded-full border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] flex items-center justify-center overflow-hidden">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f3ecdb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path><path d="M12 12c-4 0-6 2-6 6v2h12v-2c0-4-2-6-6-6z"></path><circle cx="12" cy="16" r="1"></circle></svg>
            </div>
            <div>
              <h2 className="font-retro-title text-xl text-[#4a3320] leading-none">Guia Local</h2>
              <div className="flex items-center gap-1 mt-0.5 text-[#b45a35]"><MapPin size={8} strokeWidth={3} /><p className="font-retro-pixel text-[9px] uppercase font-bold tracking-widest">GPS: {userCity || 'Sintonizando...'}</p></div>
            </div>
         </div>
         <button 
           onClick={handleNewSession}
           className="flex items-center gap-1 px-2 py-1 bg-[#e8c678]/40 hover:bg-[#e8c678]/60 text-[#5a3c28] rounded-md border border-[#5a3c28]/30 transition-colors"
           title="Iniciar nova sessão"
         >
           <RefreshCw size={12} className={!isGreeting ? "animate-spin" : ""} />
           <span className="font-retro-pixel text-[8px] font-bold uppercase">Nova Sessão</span>
         </button>
      </div>
      <div className="flex-grow notebook-bg overflow-y-auto p-4 pt-5 space-y-5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="font-retro-pixel text-[9px] text-[#5a3c28]/60 mb-1 px-2">{msg.time}</span>
            <div className={`max-w-[85%] p-2.5 border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] text-sm leading-relaxed ${msg.type === 'user' ? 'bg-[#e8c678] text-[#4a3320] rounded-l-xl rounded-tr-xl font-handwriting text-lg' : 'bg-[#ffffff] text-[#4a3320] rounded-r-xl rounded-tl-xl font-retro-body'}`}>
              {msg.type === 'user' ? msg.text : formatMessage(msg.text)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="w-full p-3 bg-[#f3ecdb] border-t-2 border-[#5a3c28]/10 z-20">
        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Pergunte ao Guia..." className="flex-grow bg-[#ffffff] border-2 border-[#5a3c28] rounded-xl py-2.5 px-4 font-retro-body font-bold text-[#4a3320] shadow-[2px_2px_0px_#5a3c28] text-sm"/>
          <button type="submit" disabled={!inputValue.trim()} className="w-10 flex items-center justify-center bg-[#b45a35] text-[#f3ecdb] rounded-xl border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] disabled:opacity-50"><Send size={16} className="ml-0.5" /></button>
        </form>
      </div>
    </div>
    );
  };

  const renderComunidade = () => (
    <div className="p-4 space-y-6 animate-fade-in h-full overflow-y-auto bg-[#e8c678]/20">
      {/* Marketplace de Experiências */}
      <div className="space-y-3">
        <h3 className="font-retro-title text-lg text-[#4a3320] flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#b45a35]" /> Mercado de Aventuras
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 1, name: "Tour Histórico", partner: "GetYourGuide", price: "R$ 85", icon: "🏛️" },
            { id: 2, name: "Trilha Secreta", partner: "Viator", price: "R$ 120", icon: "🥾" },
            { id: 3, name: "Jantar à Luz de Velas", partner: "Booking", price: "R$ 250", icon: "🕯️" }
          ].map(exp => (
            <div key={exp.id} className="flex-shrink-0 w-40 bg-white border-2 border-[#5a3c28] p-3 rounded-xl shadow-[3px_3px_0px_#5a3c28] flex flex-col gap-1">
              <div className="text-2xl mb-1">{exp.icon}</div>
              <p className="font-retro-body font-bold text-xs text-[#4a3320] leading-tight">{exp.name}</p>
              <p className="font-retro-pixel text-[8px] text-[#64a4ad] uppercase font-bold">{exp.partner}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-retro-pixel text-[10px] font-bold text-[#b45a35]">{exp.price}</span>
                <button 
                  onClick={() => showToast(`Redirecionando para ${exp.partner}... ✈️`, "success")}
                  className="bg-[#b45a35] text-white p-1 rounded border border-[#5a3c28]"
                >
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
         <h2 className="font-retro-title text-2xl text-[#4a3320] leading-none">Diários Abertos</h2>
         <button 
           onClick={handleOpenCreateMemory} 
           className="bg-[#b45a35] text-[#f3ecdb] px-4 py-2 rounded-xl border-2 border-[#5a3c28] shadow-[3px_3px_0px_#5a3c28] hover:bg-[#8a3c1f] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
         >
           <Mail size={16} />
           <span className="font-retro-pixel text-[10px] font-bold uppercase">Novo Postal</span>
         </button>
      </div>
      <div className="space-y-5">
        {posts.map(post => (
          <div key={post.id} className="retro-box bg-white overflow-hidden p-2.5 pb-3.5 relative group">
            <div 
              className="flex items-center gap-2.5 mb-2.5 border-b-2 border-[#5a3c28]/10 pb-2 cursor-pointer"
              onClick={() => setSelectedPostForDetail(post)}
            >
              <img src={post.avatar} alt={post.user} className="w-8 h-8 rounded-full border-2 border-[#5a3c28] object-cover" />
              <div>
                <h4 className="font-retro-body font-bold text-[#4a3320] leading-tight text-sm">{post.user}</h4>
                <div className="flex items-center gap-1 text-[#64a4ad]"><MapPin size={8} strokeWidth={2.5} /><span className="font-retro-pixel text-[10px] font-bold">{post.local}</span></div>
              </div>
            </div>
            <div 
              className="relative mb-2.5 cursor-pointer overflow-hidden rounded-sm"
              onClick={() => handleLike(post.id)}
            >
              <img src={post.img} alt="Post" className="w-full h-40 object-cover border-2 border-[#5a3c28] transition-transform duration-500 group-hover:scale-105" />
              <AnimatePresence>
                {animatingLikes.includes(post.id) && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Heart size={60} fill="#b45a35" className="text-[#b45a35] drop-shadow-lg" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p 
              className={`font-handwriting text-[#4a3320] text-lg leading-tight mb-3 px-1 break-words whitespace-pre-wrap cursor-pointer`}
              onClick={() => setSelectedPostForDetail(post)}
            >
              {post.texto}
            </p>
            <div className="flex gap-3 px-1">
              <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 font-retro-pixel font-bold hover:scale-110 transition-transform text-[10px] ${likedPosts.includes(post.id) ? 'text-[#b45a35]' : 'text-[#5a3c28]'}`}>
                <Heart size={14} strokeWidth={2.5} fill={likedPosts.includes(post.id) ? "#b45a35" : "transparent"} /> {post.likes}
              </button>
              <button onClick={() => handleComment(post.id)} className="flex items-center gap-1 text-[#64a4ad] font-retro-pixel font-bold hover:scale-110 transition-transform text-[10px]">
                <MessageSquare size={14} strokeWidth={2.5} /> {post.comments}
              </button>
              <button className="ml-auto text-[#5a3c28] hover:scale-110 transition-transform"><Bookmark size={14} strokeWidth={2.5} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPostDetail = () => {
    if (!selectedPostForDetail) return null;
    const comments = postComments[selectedPostForDetail.id] || [];
    const isOwner = selectedPostForDetail.user === profileData.name;
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={() => {
          if (!isEditingPost) setSelectedPostForDetail(null);
        }}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#f3ecdb] w-full max-w-[340px] max-h-[90vh] rounded-3xl border-4 border-[#5a3c28] shadow-[8px_8px_0px_#5a3c28] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-3 border-b-2 border-[#5a3c28]/20 flex justify-between items-center bg-[#e8c678]">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedPostForDetail(null)}
                className="text-[#5a3c28] hover:scale-110 transition-transform mr-1"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <img src={selectedPostForDetail.avatar} className="w-6 h-6 rounded-full border border-[#5a3c28]" alt="user" />
              <div className="flex flex-col">
                <span className="font-retro-body font-bold text-xs leading-none">{selectedPostForDetail.user}</span>
                {!isOwner && (
                  <button className="text-[#b45a35] font-retro-pixel text-[8px] font-bold hover:underline text-left">Seguir</button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && !isEditingPost && (
                <button 
                  onClick={() => handleEditPost(selectedPostForDetail)}
                  className="text-[#b45a35] hover:scale-110 transition-transform"
                  title="Editar legenda"
                >
                  <Edit3 size={18} strokeWidth={2.5} />
                </button>
              )}
              {isOwner && (
                <button 
                  onClick={() => handleDeletePost(selectedPostForDetail.id)}
                  className="text-red-700 hover:scale-110 transition-transform"
                  title="Apagar postagem"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              )}
              {!isOwner && (
                <button 
                  className="text-[#5a3c28]/40 hover:text-red-600 transition-colors"
                  title="Denunciar"
                  onClick={() => showToast("Denúncia enviada para análise.")}
                >
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </button>
              )}
              {!isOwner && (
                <button onClick={() => setSelectedPostForDetail(null)} className="text-[#5a3c28] hover:scale-110 transition-transform">
                  <X size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-grow p-4 space-y-4 custom-scrollbar">
            <div className="retro-box bg-white p-2">
              <div className="relative group cursor-pointer" onClick={() => handleLike(selectedPostForDetail.id)}>
                <img src={selectedPostForDetail.img} className="w-full h-48 object-cover border-2 border-[#5a3c28] rounded-sm mb-3" alt="post" />
                <AnimatePresence>
                  {animatingLikes.includes(selectedPostForDetail.id) && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <Heart size={60} fill="#b45a35" className="text-[#b45a35] drop-shadow-lg" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isEditingPost ? (
                <div className="mb-3 space-y-2">
                  <textarea 
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full bg-[#f3ecdb]/30 border-2 border-[#5a3c28] rounded-lg p-2 font-handwriting text-lg focus:outline-none focus:ring-1 focus:ring-[#b45a35] h-24"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-grow bg-[#2c5e40] text-white font-retro-pixel text-[10px] py-1.5 rounded border-2 border-[#5a3c28] shadow-[2px_2px_0px_#000] font-bold"
                    >
                      Salvar Alterações
                    </button>
                    <button 
                      onClick={() => setIsEditingPost(false)}
                      className="px-3 bg-white text-[#5a3c28] font-retro-pixel text-[10px] py-1.5 rounded border-2 border-[#5a3c28] shadow-[2px_2px_0px_#000] font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="font-handwriting text-[#4a3320] text-xl leading-tight mb-2">{selectedPostForDetail.texto}</p>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-[#64a4ad]">
                  <MapPin size={10} strokeWidth={2.5} />
                  <span className="font-retro-pixel text-[10px] font-bold">{selectedPostForDetail.local}</span>
                </div>
                <span className="font-retro-pixel text-[8px] text-[#5a3c28]/40 uppercase font-bold">{selectedPostForDetail.tempo}</span>
              </div>

              <div className="flex gap-4 pt-2 border-t border-[#5a3c28]/10">
                <button 
                  onClick={() => handleLike(selectedPostForDetail.id)} 
                  className={`flex items-center gap-1.5 font-retro-pixel font-bold hover:scale-110 transition-transform text-xs ${likedPosts.includes(selectedPostForDetail.id) ? 'text-[#b45a35]' : 'text-[#5a3c28]'}`}
                >
                  <Heart size={16} strokeWidth={2.5} fill={likedPosts.includes(selectedPostForDetail.id) ? "#b45a35" : "transparent"} /> {selectedPostForDetail.likes}
                </button>
                <div className="flex items-center gap-1.5 text-[#64a4ad] font-retro-pixel font-bold text-xs">
                  <MessageSquare size={16} strokeWidth={2.5} /> {selectedPostForDetail.comments}
                </div>
                <button 
                  onClick={() => handleSharePost(selectedPostForDetail)}
                  className="text-[#5a3c28] hover:scale-110 transition-transform" 
                  title="Compartilhar"
                >
                  <Share2 size={16} strokeWidth={2.5} />
                </button>
                <button className="ml-auto text-[#5a3c28] hover:scale-110 transition-transform" title="Salvar">
                  <Bookmark size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-retro-pixel text-[10px] font-bold uppercase text-[#b45a35] border-b border-[#b45a35]/20 pb-1">Comentários ({selectedPostForDetail.comments})</h4>
              {comments.length === 0 ? (
                <p className="font-retro-body text-[11px] text-[#5a3c28]/60 italic text-center py-4">Seja o primeiro a comentar!</p>
              ) : (
                <div className="space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className="bg-white/40 p-2 rounded-lg border border-[#5a3c28]/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-retro-body font-bold text-[11px] text-[#b45a35]">{c.user}</span>
                        <span className="font-retro-pixel text-[8px] text-[#5a3c28]/40">{c.time}</span>
                      </div>
                      <p className="font-retro-body text-xs text-[#4a3320]">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#e8c678]/30 border-t-2 border-[#5a3c28]/20">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Escreva um comentário..." 
                className="flex-grow bg-white border-2 border-[#5a3c28] rounded-xl px-3 py-2 text-xs font-retro-body shadow-[2px_2px_0px_#5a3c28] focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment(selectedPostForDetail.id, newCommentText);
                    setNewCommentText('');
                  }
                }}
              />
              <button 
                onClick={() => {
                  handleAddComment(selectedPostForDetail.id, newCommentText);
                  setNewCommentText('');
                }}
                className="bg-[#b45a35] text-[#f3ecdb] p-2 rounded-xl border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-2 sm:p-4 font-retro-body text-[#4a3320]">
      <div className="w-full max-w-[360px] h-[740px] max-h-[95vh] bg-[#f3ecdb] rounded-[2.5rem] border-6 border-neutral-300 shadow-2xl relative overflow-hidden flex flex-col ring-4 ring-neutral-900">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-300 rounded-b-xl z-50"></div>

        <header className="pt-10 pb-3 px-4 relative border-b-4 border-[#5a3c28] shadow-md z-40 flex-shrink-0 transition-colors duration-500 ease-in-out" style={{ backgroundColor: modoAtivo === 'brasil' ? '#2c5e40' : '#b45a35', color: '#f3ecdb' }}>
          <ModoSwitch modoAtual={modoAtivo} toggleModo={toggleModo} />
          <div className="flex items-center gap-2.5 mt-2">
            <RetroCompass />
            <div className="flex flex-col">
              <h1 className="font-retro-title text-2xl leading-none tracking-wide" style={{ textShadow: '2px 2px 0px #5a3c28' }}>Navegantes</h1>
              <p className="font-retro-pixel text-[9px] opacity-90 tracking-widest uppercase mt-0.5 text-[#e8c678]">{activeTab === 'perfil' ? 'Seu Passaporte' : activeTab === 'ia' ? 'Assistente Local' : activeTab === 'comunidade' ? 'Feed Social' : dados.tituloHeader}</p>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full w-full"
            >
              {activeTab === 'home' && renderHome()}
              {activeTab === 'map' && renderMap()}
              {activeTab === 'explorar' && renderExplorar()}
              {activeTab === 'ia' && renderIA()}
              {activeTab === 'comunidade' && renderComunidade()}
              {activeTab === 'perfil' && renderPerfil()}
            </motion.div>
          </AnimatePresence>
          
          <AnimatePresence>
            {selectedPostForDetail && renderPostDetail()}
          </AnimatePresence>

          {/* Modal de Todas as Sugestões IA */}
          <AnimatePresence>
            {showingAllIaSuggestions && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                onClick={() => setShowingAllIaSuggestions(false)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-[#f3ecdb] w-full max-w-md max-h-[80vh] overflow-hidden border-4 border-[#5a3c28] rounded-2xl shadow-[8px_8px_0px_#5a3c28] flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-4 border-b-4 border-[#5a3c28] bg-[#64a4ad]/20 flex justify-between items-center">
                    <h3 className="font-retro-title text-xl text-[#4a3320]">Todas as Sugestões</h3>
                    <button onClick={() => setShowingAllIaSuggestions(false)} className="text-[#5a3c28] hover:scale-110 transition-transform">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto space-y-4 notebook-bg">
                    {dashboardSuggestions.map((item, idx) => (
                      <div key={item.id} className="bg-white border-2 border-[#5a3c28] p-3 rounded-xl shadow-[3px_3px_0px_#5a3c28] flex gap-3">
                        <img src={item.img} alt={item.title} className="w-20 h-20 object-cover border-2 border-[#5a3c28] rounded-lg" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-retro-body font-bold text-[#4a3320] leading-tight">{item.title}</h4>
                            <span className="text-lg">{item.icon}</span>
                          </div>
                          <div className="flex items-center gap-1 my-1">
                            <Star size={10} fill="#b45a35" className="text-[#b45a35]" />
                            <span className="font-retro-pixel text-[9px] font-bold">{item.rating}</span>
                          </div>
                          <p className="font-retro-pixel text-[9px] text-[#5a3c28]/80 leading-tight">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t-4 border-[#5a3c28] bg-[#f3ecdb] text-center">
                    <p className="font-retro-pixel text-[8px] text-[#5a3c28]/60 uppercase font-bold italic">Sugestões geradas por inteligência artificial baseadas na sua localização</p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Modal de Criar Memória */}
        {showCreateMemory && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-[320px] bg-[#f3ecdb] rounded-2xl border-4 border-[#5a3c28] shadow-[6px_6px_0px_#5a3c28] overflow-hidden flex flex-col max-h-[90%]">
              <div className="p-2.5 border-b-2 border-[#5a3c28]/20 flex justify-between items-center bg-[#e8c678]">
                <h3 className="font-retro-title text-xl text-[#4a3320]">Novo Postal</h3>
                <button onClick={handleCloseCreateMemory} className="text-[#4a3320] hover:scale-110 transition-transform">
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
              
              <div className="p-3.5 overflow-y-auto flex-grow space-y-3.5">
                {/* Upload de Imagem (Estilo Polaroid) */}
                <div className="polaroid-card relative cursor-pointer group p-2" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  {memoryImage ? (
                    <img src={memoryImage} alt="Preview" className="w-full aspect-square object-cover border-2 border-[#5a3c28]" />
                  ) : (
                    <div className="w-full aspect-square bg-black/5 border-2 border-dashed border-[#5a3c28]/40 flex flex-col items-center justify-center gap-1.5 group-hover:bg-black/10 transition-colors">
                      <Camera size={32} className="text-[#5a3c28]/50" />
                      <span className="font-retro-body font-bold text-[#5a3c28]/70 text-xs">Adicionar Foto</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-[#64a4ad] justify-center">
                    <MapPin size={12} strokeWidth={2.5} />
                    <span className="font-retro-pixel text-[10px] font-bold truncate max-w-[180px]">{memoryLocation}</span>
                  </div>
                </div>

                {/* Área de Texto */}
                <div>
                  <label className="block font-retro-body font-bold text-[#4a3320] mb-1 text-sm">Diário de Bordo</label>
                  <textarea 
                    value={memoryText}
                    onChange={(e) => setMemoryText(e.target.value)}
                    placeholder="Que dia incrível! Hoje eu..."
                    className="w-full bg-white border-2 border-[#5a3c28] rounded-xl p-2.5 font-handwriting text-lg text-[#4a3320] shadow-[2px_2px_0px_#5a3c28] resize-none h-20 focus:outline-none focus:ring-1 focus:ring-[#b45a35]"
                  />
                </div>
              </div>

              <div className="p-3.5 border-t-2 border-[#5a3c28]/20 bg-[#f3ecdb]">
                <button 
                  onClick={handlePublishMemory}
                  disabled={!memoryImage || !memoryText.trim()}
                  className="w-full bg-[#b45a35] text-[#f3ecdb] font-retro-body font-bold py-2.5 rounded-xl border-2 border-[#5a3c28] shadow-[3px_3px_0px_#5a3c28] flex items-center justify-center gap-2 hover:bg-[#8a3c1f] active:translate-y-0.5 active:shadow-[1px_1px_0px_#5a3c28] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Send size={16} /> Publicar na Comunidade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Roteiros */}
        {showItineraries && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-[320px] bg-[#f3ecdb] rounded-2xl border-4 border-[#5a3c28] shadow-[6px_6px_0px_#5a3c28] overflow-hidden flex flex-col max-h-[90%]">
              <div className="p-2.5 border-b-2 border-[#5a3c28]/20 flex justify-between items-center bg-[#e8c678]">
                <h3 className="font-retro-title text-xl text-[#4a3320]">Roteiros Inteligentes</h3>
                <button onClick={() => setShowItineraries(false)}><X size={20} /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-5">
                <button 
                  onClick={() => {
                    if (!profileData.isPremium && !isTripActive && profileData.credits <= 0) {
                      showToast("Você precisa de um Bilhete de Viagem para criar novos roteiros! 🎫", "error");
                      setShowItineraries(false);
                      changeTab('perfil');
                      return;
                    }
                    setShowCreateItinerary(true);
                  }} 
                  className="w-full bg-[#64a4ad] text-white font-retro-body font-bold py-2 rounded-lg border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28] flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Criar Novo Roteiro
                </button>
                
                <div className="space-y-3">
                  <h4 className="font-retro-body font-bold text-sm text-[#4a3320] border-b border-[#5a3c28]/10 pb-1">Sugeridos para Você</h4>
                  {suggestedItineraries.map(itin => (
                    <div key={itin.id} className="retro-box p-3 bg-white flex justify-between items-center">
                      <div className="flex-grow">
                        <p className="font-retro-body font-bold text-sm">{itin.name}</p>
                        <p className="font-retro-pixel text-[9px] text-[#64a4ad] uppercase font-bold">{itin.destination} • {itin.theme}</p>
                        <div className="mt-1 flex gap-1">
                          {itin.days.map(d => (
                            <div key={d.id} className="bg-[#f3ecdb] px-1 rounded text-[8px] font-retro-pixel border border-[#5a3c28]/20">Dia {d.dayNumber}</div>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => syncItineraryToHome(itin)} className="p-1.5 bg-[#e8c678] rounded border border-[#5a3c28] hover:bg-[#d4b264]"><Save size={14} /></button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-retro-body font-bold text-sm text-[#4a3320] border-b border-[#5a3c28]/10 pb-1">Meus Roteiros</h4>
                  {profileData.itineraries.length === 0 ? (
                    <p className="text-center font-retro-pixel text-[10px] text-[#5a3c28]/60 italic">Nenhum roteiro personalizado.</p>
                  ) : (
                    profileData.itineraries.map(itin => (
                      <div key={itin.id} className="retro-box p-3 bg-white flex justify-between items-center">
                        <div className="flex-grow">
                          <p className="font-retro-body font-bold text-sm">{itin.name}</p>
                          <p className="font-retro-pixel text-[9px] text-[#b45a35] uppercase font-bold">{itin.destination}</p>
                          <button 
                            onClick={() => {
                              const stopTitle = prompt('Nome da parada:');
                              const stopTime = prompt('Horário (ex: 10:00):');
                              if (stopTitle && stopTime) {
                                setProfileData(prev => ({
                                  ...prev,
                                  itineraries: prev.itineraries.map(i => i.id === itin.id ? {
                                    ...i,
                                    days: i.days.map(d => d.dayNumber === 1 ? {
                                      ...d,
                                      stops: [...d.stops, { id: Date.now(), title: stopTitle, time: stopTime, description: '' }]
                                    } : d)
                                  } : i)
                                }));
                              }
                            }}
                            className="mt-1 text-[8px] font-retro-pixel text-[#64a4ad] underline font-bold"
                          >
                            + Adicionar Parada
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 bg-[#f3ecdb] rounded border border-[#5a3c28]"><Share2 size={14} /></button>
                          <button onClick={() => syncItineraryToHome(itin)} className="p-1.5 bg-[#e8c678] rounded border border-[#5a3c28]"><Save size={14} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Criar Roteiro */}
        {showCreateItinerary && (
          <div className="absolute inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-[320px] bg-[#f3ecdb] rounded-2xl border-4 border-[#5a3c28] shadow-[6px_6px_0px_#5a3c28] p-4 space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="font-retro-title text-xl">Novo Roteiro</h3>
                <button onClick={() => {
                  setShowCreateItinerary(false);
                  setItineraryStep('initial');
                  setItinerarySource(null);
                  setCitySuggestions([]);
                  setSelectedStops([]);
                }}><X size={20} /></button>
              </div>

              {itineraryStep === 'initial' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="font-retro-pixel text-[10px] text-[#5a3c28] font-bold uppercase mb-1 block">Nome da Viagem</label>
                      <input 
                        type="text" 
                        value={newItineraryName}
                        onChange={(e) => setNewItineraryName(e.target.value)}
                        placeholder="Ex: Férias de Verão" 
                        className="w-full bg-white border-2 border-[#5a3c28] rounded-lg p-2 font-retro-body text-sm"
                      />
                    </div>
                    <div>
                      <label className="font-retro-pixel text-[10px] text-[#5a3c28] font-bold uppercase mb-1 block">Cidade de Destino</label>
                      <input 
                        type="text" 
                        value={newItineraryDest}
                        onChange={(e) => setNewItineraryDest(e.target.value)}
                        placeholder="Ex: Salvador, BA" 
                        className="w-full bg-white border-2 border-[#5a3c28] rounded-lg p-2 font-retro-body text-sm"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setItineraryStep('source')} 
                    disabled={!newItineraryName || !newItineraryDest}
                    className="w-full bg-[#64a4ad] text-white border-2 border-[#5a3c28] py-2.5 rounded-lg font-retro-body font-bold text-sm shadow-[2px_2px_0px_#5a3c28] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Próximo <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {itineraryStep === 'source' && (
                <div className="space-y-4">
                  <p className="font-retro-body text-sm text-[#5a3c28] text-center font-bold">Como deseja montar seu roteiro?</p>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => {
                        setItinerarySource('ai');
                        handleSearchCity();
                      }}
                      className="p-4 bg-white border-2 border-[#5a3c28] rounded-xl hover:bg-[#e8c678]/20 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-[#64a4ad]/20 rounded-lg text-[#64a4ad]">
                          <Sparkles size={20} />
                        </div>
                        <h4 className="font-retro-body font-bold text-sm">Inteligência Artificial</h4>
                      </div>
                      <p className="font-retro-pixel text-[8px] text-[#5a3c28]/70">Sugestões personalizadas em qualquer lugar do mundo.</p>
                    </button>

                    <button 
                      onClick={() => {
                        setItinerarySource('community');
                        handleSearchCity();
                      }}
                      className="p-4 bg-white border-2 border-[#5a3c28] rounded-xl hover:bg-[#e8c678]/20 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-[#b45a35]/20 rounded-lg text-[#b45a35]">
                          <Users size={20} />
                        </div>
                        <h4 className="font-retro-body font-bold text-sm">Comunidade Navegantes</h4>
                      </div>
                      <p className="font-retro-pixel text-[8px] text-[#5a3c28]/70">Dicas reais de outros viajantes e locais cadastrados.</p>
                    </button>
                  </div>
                  <button 
                    onClick={() => setItineraryStep('initial')} 
                    className="w-full bg-white border-2 border-[#5a3c28] py-2 rounded-lg font-retro-body font-bold text-sm"
                  >
                    Voltar
                  </button>
                </div>
              )}

              {itineraryStep === 'suggestions' && (
                <div className="space-y-4 flex-grow flex flex-col overflow-hidden">
                  <div className="bg-white/50 p-2 rounded-lg border border-[#5a3c28]/20">
                    <p className="font-retro-pixel text-[10px] text-[#b45a35] font-bold uppercase">
                      {itinerarySource === 'ai' ? '✨ IA' : '👥 Comunidade'}: {newItineraryDest}
                    </p>
                    <p className="font-retro-body text-xs text-[#5a3c28] font-bold">Selecione pontos para seu roteiro:</p>
                  </div>
                  
                  <div className="space-y-2 overflow-y-auto pr-1 flex-grow">
                    {citySuggestions.map(stop => {
                      const isSelected = selectedStops.some(s => s.title === stop.title);
                      return (
                        <div key={stop.id} className={`p-2 rounded-lg border-2 transition-all ${isSelected ? 'bg-[#e8c678]/30 border-[#b45a35]' : 'bg-white border-[#5a3c28]'}`}>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-retro-body font-bold text-xs">{stop.title}</h4>
                              <p className="font-retro-pixel text-[8px] text-[#5a3c28]/70 leading-tight mt-0.5">{stop.description}</p>
                            </div>
                            <button 
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedStops(prev => prev.filter(s => s.title !== stop.title));
                                } else {
                                  setSelectedStops(prev => [...prev, stop]);
                                }
                              }}
                              className={`p-1 rounded border border-[#5a3c28] transition-colors ${isSelected ? 'bg-[#b45a35] text-white' : 'bg-[#f3ecdb] text-[#5a3c28]'}`}
                            >
                              {isSelected ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t-2 border-[#5a3c28]/10 flex gap-2">
                    <button 
                      onClick={() => setItineraryStep('source')} 
                      className="flex-grow bg-white border-2 border-[#5a3c28] py-2 rounded-lg font-retro-body font-bold text-sm"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={handleCreateItinerary} 
                      className="flex-grow bg-[#b45a35] text-white border-2 border-[#5a3c28] py-2 rounded-lg font-retro-body font-bold text-sm shadow-[2px_2px_0px_#5a3c28]"
                    >
                      Criar ({selectedStops.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="w-full border-t-4 border-[#5a3c28] px-1 py-2 flex justify-around items-center z-40 transition-colors duration-500 ease-in-out flex-shrink-0" style={{ backgroundColor: modoAtivo === 'brasil' ? '#2c5e40' : '#b45a35' }}>
          <button onClick={() => changeTab('home')} className={`flex flex-col items-center justify-center w-[60px] h-14 rounded-xl transition-all duration-300 ${activeTab === 'home' ? 'bg-[#f3ecdb] -translate-y-1.5 border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28]' : 'hover:bg-black/10'}`}>
            <Compass size={20} color={activeTab === 'home' ? '#b45a35' : '#f3ecdb'} />
            <span className={`text-[9px] font-bold mt-1 font-retro-body uppercase tracking-wide ${activeTab === 'home' ? 'text-[#5a3c28]' : 'text-[#f3ecdb]'}`}>Painel</span>
          </button>
          
          <button onClick={() => changeTab('map')} className={`flex flex-col items-center justify-center w-[60px] h-14 rounded-xl transition-all duration-300 ${activeTab === 'map' ? 'bg-[#f3ecdb] -translate-y-1.5 border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28]' : 'hover:bg-black/10'}`}>
            <MapIcon size={20} color={activeTab === 'map' ? '#64a4ad' : '#f3ecdb'} />
            <span className={`text-[9px] font-bold mt-1 font-retro-body uppercase tracking-wide ${activeTab === 'map' ? 'text-[#5a3c28]' : 'text-[#f3ecdb]'}`}>Mapa</span>
          </button>

          <button 
            onClick={() => changeTab('ia')} 
            className={`flex flex-col items-center justify-center w-[68px] h-[68px] rounded-full transition-all duration-300 relative -top-4 border-4 border-[#5a3c28] shadow-[4px_4px_0px_#000] z-50 ${activeTab === 'ia' ? 'bg-[#f3ecdb]' : 'bg-[#e8c678]'}`}
          >
            <Sparkles size={28} className={activeTab === 'ia' ? 'text-[#b45a35]' : 'text-[#5a3c28]'} fill={activeTab === 'ia' ? '#b45a35' : 'transparent'} />
            <span className={`text-[8px] font-bold mt-0.5 font-retro-pixel uppercase tracking-tighter ${activeTab === 'ia' ? 'text-[#b45a35]' : 'text-[#5a3c28]'}`}>Guia IA</span>
          </button>

          <button onClick={() => changeTab('comunidade')} className={`flex flex-col items-center justify-center w-[60px] h-14 rounded-xl transition-all duration-300 ${activeTab === 'comunidade' ? 'bg-[#f3ecdb] -translate-y-1.5 border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28]' : 'hover:bg-black/10'}`}>
            <Users size={20} color={activeTab === 'comunidade' ? '#b45a35' : '#f3ecdb'} />
            <span className={`text-[9px] font-bold mt-1 font-retro-body uppercase tracking-wide ${activeTab === 'comunidade' ? 'text-[#5a3c28]' : 'text-[#f3ecdb]'}`}>Comunidade</span>
          </button>
          
          <button onClick={() => changeTab('perfil')} className={`flex flex-col items-center justify-center w-[60px] h-14 rounded-xl transition-all duration-300 ${activeTab === 'perfil' ? 'bg-[#f3ecdb] -translate-y-1.5 border-2 border-[#5a3c28] shadow-[2px_2px_0px_#5a3c28]' : 'hover:bg-black/10'}`}>
            <UserCircle size={20} color={activeTab === 'perfil' ? '#b45a35' : '#f3ecdb'} />
            <span className={`text-[9px] font-bold mt-1 font-retro-body uppercase tracking-wide ${activeTab === 'perfil' ? 'text-[#5a3c28]' : 'text-[#f3ecdb]'}`}>Perfil</span>
          </button>
        </nav>
        {/* Modal de Guia de Instalação */}
        <AnimatePresence>
          {showInstallGuide && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowInstallGuide(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#f3ecdb] w-full max-w-[320px] rounded-2xl border-4 border-[#5a3c28] shadow-[6px_6px_0px_#5a3c28] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="bg-[#b45a35] p-4 border-b-4 border-[#5a3c28] flex justify-between items-center">
                  <h2 className="font-retro-title text-xl text-[#f3ecdb]">Guia de Instalação</h2>
                  <button onClick={() => setShowInstallGuide(false)} className="text-[#f3ecdb] hover:scale-110 transition-transform">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-5 space-y-5">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e8c678] border-2 border-[#5a3c28] flex items-center justify-center font-retro-title text-[#4a3320] shrink-0 text-sm">1</div>
                      <div>
                        <h4 className="font-retro-body font-bold text-xs text-[#4a3320]">No iPhone (Safari)</h4>
                        <p className="font-retro-body text-[11px] text-[#5a3c28] mt-0.5">Toque no ícone de <span className="font-bold">Compartilhar</span> e selecione <span className="font-bold">"Adicionar à Tela de Início"</span>.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e8c678] border-2 border-[#5a3c28] flex items-center justify-center font-retro-title text-[#4a3320] shrink-0 text-sm">2</div>
                      <div>
                        <h4 className="font-retro-body font-bold text-xs text-[#4a3320]">No Android (Chrome)</h4>
                        <p className="font-retro-body text-[11px] text-[#5a3c28] mt-0.5">Toque nos <span className="font-bold">três pontinhos</span> e selecione <span className="font-bold">"Instalar aplicativo"</span>.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e8c678] border-2 border-[#5a3c28] flex items-center justify-center font-retro-title text-[#4a3320] shrink-0 text-sm">3</div>
                      <div>
                        <h4 className="font-retro-body font-bold text-xs text-[#4a3320]">No Computador</h4>
                        <p className="font-retro-body text-[11px] text-[#5a3c28] mt-0.5">Clique no ícone de <span className="font-bold">instalação</span> no lado direito da barra de endereços.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#e8c678]/30 p-3 rounded-xl border-2 border-dashed border-[#5a3c28]/40">
                    <p className="font-handwriting text-base text-[#5a3c28] text-center italic">
                      "Tenha o seu diário de bordo sempre à mão!"
                    </p>
                  </div>

                  <button 
                    onClick={() => setShowInstallGuide(false)}
                    className="w-full bg-[#64a4ad] text-[#f3ecdb] font-retro-body font-bold py-2.5 rounded-lg border-2 border-[#5a3c28] shadow-[3px_3px_0px_#5a3c28] hover:bg-[#4f8a92] active:translate-y-0.5 active:shadow-[1px_1px_0px_#5a3c28] transition-all text-sm"
                  >
                    Entendi, Capitão!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Assistente IA (GPS) */}
        {showIAAssistant && (
          <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-[320px] bg-[#f3ecdb] rounded-2xl border-4 border-[#5a3c28] shadow-[6px_6px_0px_#5a3c28] p-5 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles size={24} className="text-[#64a4ad]" fill="#64a4ad" />
                  <h3 className="font-retro-title text-xl">Guia Local IA</h3>
                </div>
                <button onClick={() => setShowIAAssistant(false)}><X size={20} /></button>
              </div>

              <div className="bg-white/50 p-3 rounded-lg border-2 border-[#5a3c28]/20 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e8c678] rounded-full border-2 border-[#5a3c28] flex items-center justify-center animate-pulse">
                  <MapPin size={20} className="text-[#5a3c28]" />
                </div>
                <div>
                  <p className="font-retro-pixel text-[10px] text-[#b45a35] font-bold uppercase">Localização Atual</p>
                  <p className="font-retro-body text-xs font-bold text-[#5a3c28]">{dados.roteiro.cidade}</p>
                </div>
              </div>

              <div className="space-y-3">
                {isIaLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-4 border-[#64a4ad] border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-retro-pixel text-sm text-[#5a3c28]">Consultando as estrelas...</p>
                  </div>
                ) : (
                  iaSuggestions.map((item) => (
                    <div key={item.id} className="bg-white border-2 border-[#5a3c28] p-3 rounded-xl shadow-[2px_2px_0px_#5a3c28] flex gap-3 items-start">
                      <div className="text-2xl">{item.icon}</div>
                      <div>
                        <h4 className="font-retro-body font-bold text-sm text-[#5a3c28]">{item.title}</h4>
                        <p className="font-retro-body text-[11px] text-[#5a3c28]/80 leading-tight mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="font-retro-pixel text-[9px] text-center text-[#5a3c28]/60 uppercase">Dicas baseadas no seu GPS e clima atual</p>
              
              <button 
                onClick={() => setShowIAAssistant(false)}
                className="w-full bg-[#5a3c28] text-[#f3ecdb] py-2.5 rounded-lg font-retro-body font-bold text-sm shadow-[2px_2px_0px_#000]"
              >
                Entendido!
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showOnboarding && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-[#f3ecdb] flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}></div>
              
              <div className="relative z-10 max-w-sm w-full space-y-8">
                <div className="flex justify-center">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                  >
                    <RetroCompass />
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  {onboardingStep === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <h1 className="font-retro-title text-4xl text-[#b45a35] leading-tight">Bem-vindo, Navegante!</h1>
                      <p className="font-handwriting text-2xl text-[#4a3320]">
                        "Sou o seu Capitão. Este não é um mapa comum, é o seu novo Diário de Bordo."
                      </p>
                    </motion.div>
                  )}

                  {onboardingStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-center gap-4">
                        <div className="p-3 bg-white border-2 border-[#5a3c28] rounded-xl shadow-[3px_3px_0px_#5a3c28]">
                          <Sparkles size={32} className="text-[#64a4ad]" />
                        </div>
                        <div className="p-3 bg-white border-2 border-[#5a3c28] rounded-xl shadow-[3px_3px_0px_#5a3c28]">
                          <MapPinned size={32} className="text-[#b45a35]" />
                        </div>
                      </div>
                      <h2 className="font-retro-body font-bold text-xl text-[#4a3320]">Explore com Inteligência</h2>
                      <p className="font-retro-body text-sm text-[#5a3c28]">
                        Use nossa IA para descobrir tesouros escondidos e planejar roteiros que combinam com sua alma aventureira.
                      </p>
                    </motion.div>
                  )}

                  {onboardingStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-[#b45a35] flex items-center justify-center text-4xl bg-white shadow-lg">
                          ⚓
                        </div>
                      </div>
                      <h2 className="font-retro-body font-bold text-xl text-[#4a3320]">Carimbe seu Passaporte</h2>
                      <p className="font-retro-body text-sm text-[#5a3c28]">
                        Cada lugar visitado, cada memória compartilhada, um novo selo para sua coleção. Pronto para içar velas?
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-8 space-y-3">
                  <button
                    onClick={() => {
                      if (onboardingStep < 2) {
                        setOnboardingStep(prev => prev + 1);
                      } else {
                        finishOnboarding();
                      }
                    }}
                    className="w-full bg-[#b45a35] text-[#f3ecdb] font-retro-body font-bold py-4 rounded-xl border-2 border-[#5a3c28] shadow-[4px_4px_0px_#000] hover:bg-[#8a3c1f] transition-all active:translate-y-1 active:shadow-none text-lg"
                  >
                    {onboardingStep === 2 ? "Içar Velas!" : "Próximo Passo"}
                  </button>
                  
                  {onboardingStep < 2 && (
                    <button
                      onClick={finishOnboarding}
                      className="font-retro-pixel text-[10px] text-[#5a3c28]/60 uppercase font-bold hover:underline"
                    >
                      Pular Introdução
                    </button>
                  )}
                </div>

                <div className="flex justify-center gap-2 pt-4">
                  {[0, 1, 2].map(i => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full border border-[#5a3c28] transition-colors ${onboardingStep === i ? 'bg-[#b45a35]' : 'bg-white'}`}
                    ></div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
