/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  arrayUnion
} from 'firebase/firestore';
import { usePlatform } from '../context/PlatformContext';
import { LiveStream, ChatMessage } from '../types';
import {
  Heart,
  Eye,
  MessageSquare,
  Lock,
  Coins,
  Send,
  X,
  User,
  Shield,
  Clock,
  Video,
  Radio,
  Trash2,
  VolumeX,
  Volume2,
  Sparkles,
  Share2,
  Gift,
  Settings,
  Plus,
  Check
} from 'lucide-react';

interface LivePlayerProps {
  live: LiveStream;
  onClose: () => void;
  onSelectHost: (hostId: string) => void;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({ live: initialLive, onClose, onSelectHost }) => {
  const {
    lives,
    currentUser,
    users,
    chatMessages,
    sendChatMessage,
    deleteChatMessage,
    kickOrBlockUser,
    payPrivateLiveEntry,
    sendGiftToHost,
    likeLiveStream,
    stopActiveStream,
    forceEndLive,
    addCoinsToUser,
    removeCoinsFromUser,
    followToggle
  } = usePlatform();

  const [activeLive, setActiveLive] = useState<LiveStream>(initialLive);

  // Keep state in sync with external live selection updates
  useEffect(() => {
    setActiveLive(initialLive);
  }, [initialLive]);

  // Alias activeLive as live so all sub-components and logic continue to function flawlessly
  const live = activeLive;

  // TikTok-Style Swipe Up/Down and Keyboard Arrow Navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is writing in chat or administrative inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      const activeLives = lives.filter(l => l.isLive);
      if (activeLives.length <= 1) return;
      
      const currentIndex = activeLives.findIndex(l => l.id === activeLive.id);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % activeLives.length;
        setActiveLive(activeLives[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        const prevIndex = (currentIndex - 1 + activeLives.length) % activeLives.length;
        setActiveLive(activeLives[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lives, activeLive.id]);

  const handleSwipeStart = (y: number) => {
    setTouchStart(y);
  };

  const handleSwipeEnd = (y: number) => {
    if (touchStart === null) return;
    const diff = touchStart - y;
    const activeLives = lives.filter(l => l.isLive);
    if (activeLives.length <= 1) {
      setTouchStart(null);
      return;
    }

    const currentIndex = activeLives.findIndex(l => l.id === activeLive.id);
    if (currentIndex === -1) {
      setTouchStart(null);
      return;
    }

    if (diff > 50) {
      // Swipe Up: transition to next active streaming host
      const nextIndex = (currentIndex + 1) % activeLives.length;
      setActiveLive(activeLives[nextIndex]);
    } else if (diff < -50) {
      // Swipe Down: transition to previous active streaming host
      const prevIndex = (currentIndex - 1 + activeLives.length) % activeLives.length;
      setActiveLive(activeLives[prevIndex]);
    }
    setTouchStart(null);
  };

  // TikTok Double Tap Likers trigger
  const lastTapRef = useRef<number>(0);
  const handleViewportTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_GAP_MS = 300;
    
    // Check if the click target is a button or input to avoid intercepting functional taps
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' || 
      target.tagName === 'INPUT' || 
      target.closest('button') || 
      target.closest('input') || 
      target.closest('form')
    ) {
      return;
    }

    if (now - lastTapRef.current < DOUBLE_TAP_GAP_MS) {
      // Trigger a beautiful hearts stream!
      handleHeartClick();
    }
    lastTapRef.current = now;
  };

  const [hasPaid, setHasPaid] = useState(false);
  const [inputText, setInputText] = useState('');
  const [likesFloating, setLikesFloating] = useState<{ id: number; emoji: string; x: number; y: number; size: number }[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isGiftMenuOpen, setIsGiftMenuOpen] = useState(false);
  const [activeGiftBanner, setActiveGiftBanner] = useState<{ sender: string; name: string; emoji: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [streamSource, setStreamSource] = useState<'WEBCAM' | 'SIMULATION'>('WEBCAM');
  const [confirmStopLive, setConfirmStopLive] = useState(false);
  const [confirmForceEndLive, setConfirmForceEndLive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'none' | 'beauty' | 'warm' | 'cyberpunk' | 'mono'>('beauty');
  const [simBitrate, setSimBitrate] = useState(3840);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [showBroadcasterTip, setShowBroadcasterTip] = useState(true);

  // Bitrate fluctuation simulator
  useEffect(() => {
    const intv = setInterval(() => {
      setSimBitrate(Math.floor(3500 + Math.random() * 1100));
    }, 2000);
    return () => clearInterval(intv);
  }, []);

  const getFilterCSS = (customFilterName?: string) => {
    const filter = customFilterName || activeFilter;
    switch (filter) {
      case 'beauty':
        return 'contrast(1.02) brightness(1.06) saturate(1.05) blur(0.2px)';
      case 'warm':
        return 'sepia(0.18) saturate(1.22) contrast(1.02) hue-rotate(-8deg)';
      case 'cyberpunk':
        return 'hue-rotate(150deg) saturate(1.75) contrast(1.05)';
      case 'mono':
        return 'grayscale(1) contrast(1.2) brightness(0.95)';
      default:
        return 'none';
    }
  };

  const getFilterLabel = () => {
    switch (activeFilter) {
      case 'beauty': return 'Filtro Beleza 🌸';
      case 'warm': return 'Filtro Quente 🍷';
      case 'cyberpunk': return 'Cyberpunk 🌆';
      case 'mono': return 'Preto & Branco 🎬';
      default: return 'Sem Filtro';
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC & real-time message states
  const [isWebRTCStreamActive, setIsWebRTCStreamActive] = useState(false);
  const [firestoreChats, setFirestoreChats] = useState<ChatMessage[]>([]);

  // Host WebRTC multi-peer trackers
  const activeStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [viewerId: string]: RTCPeerConnection }>({});
  const addedViewerCandidatesRef = useRef<{ [viewerId: string]: Set<string> }>({});

  // Viewer WebRTC connection references
  const viewerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const admittedHostCandidatesRef = useRef<Set<string>>(new Set());

  const currentLiveId = live.id;
  const isHostCurrentUser = live.hostId === currentUser.id;
  const isAdminOrSuper = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Find host follow state
  const targetHost = users.find(u => u.id === live.hostId);
  const isFollowing = currentUser.followingIds.includes(live.hostId);

  // Check if live is private and if current user has paid OR is the host/admin
  useEffect(() => {
    if (!live.isPrivate) {
      setHasPaid(true);
      return;
    }
    if (isHostCurrentUser || isAdminOrSuper) {
      setHasPaid(true);
      return;
    }
    setHasPaid(false);
  }, [live, isHostCurrentUser, isAdminOrSuper]);

  // Hook up chat auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle webcam stream initialization for host
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number;
    
    if (isHostCurrentUser && streamSource === 'WEBCAM') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          activeStream = stream;
          activeStreamRef.current = stream; // Keep structured available stream reference for peer attachments
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // Microphone audio tracking using Web Audio API
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              audioContext = new AudioContextClass();
              analyser = audioContext.createAnalyser();
              analyser.fftSize = 128;
              source = audioContext.createMediaStreamSource(stream);
              source.connect(analyser);

              const bufferLength = analyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);

              const updateVolume = () => {
                if (!analyser) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                  sum += dataArray[i];
                }
                const average = sum / bufferLength;
                // Scale average volume level and update state
                setMicLevel(Math.min(100, Math.round((average / 110) * 100)));
                animationFrameId = requestAnimationFrame(updateVolume);
              };

              updateVolume();
            } catch (err) {
              console.warn('Could not establish live mic level visualizer:', err);
            }
          }
        })
        .catch(err => {
          console.warn('Webcam permission denied, falling back to simulation:', err);
          setStreamSource('SIMULATION');
        });
    }

    return () => {
      activeStreamRef.current = null;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (source) {
        source.disconnect();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [isHostCurrentUser, streamSource]);

  // Keep live stream document in Firestore in sync with host's camera settings (Webcam vs Simulation)
  useEffect(() => {
    if (!isHostCurrentUser) return;
    const docRef = doc(db, 'lives', live.id);
    updateDoc(docRef, { streamSource, activeFilter }).catch(err => {
      console.warn('Could not update live stream configurations in Firestore:', err);
    });
  }, [streamSource, activeFilter, isHostCurrentUser, live.id]);

  // HOST MULTI-PEER WebRTC SIGNALING ENGINE (Listens for viewer candidates and issues offers)
  useEffect(() => {
    if (!isHostCurrentUser || streamSource !== 'WEBCAM') return;

    const viewersCollectionRef = collection(db, 'lives', live.id, 'viewers');
    
    const unsubscribe = onSnapshot(viewersCollectionRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const docData = change.doc.data();
        const viewerId = docData.viewerId;

        if (change.type === 'added' || change.type === 'modified') {
          // If PeerConnection not already created, create it
          if (!peerConnectionsRef.current[viewerId] && docData.createdAt) {
            console.log(`Setting up host WebRTC peer connection for viewer: ${viewerId}`);
            
            let pc: RTCPeerConnection;
            try {
              pc = new RTCPeerConnection({
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:stun1.l.google.com:19302' }
                ]
              });
              peerConnectionsRef.current[viewerId] = pc;
            } catch (err) {
              console.error('Failed to construct host RTCPeerConnection:', err);
              return;
            }

            // Bind tracks
            if (activeStreamRef.current) {
              activeStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, activeStreamRef.current!);
              });
            }

            // Local Ice Candidate Listener
            pc.onicecandidate = (event) => {
              if (event.candidate) {
                const viewerDocRef = doc(db, 'lives', live.id, 'viewers', viewerId);
                updateDoc(viewerDocRef, {
                  hostCandidates: arrayUnion(event.candidate.toJSON())
                }).catch(err => {});
              }
            };

            // Create Offer
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              const viewerDocRef = doc(db, 'lives', live.id, 'viewers', viewerId);
              await updateDoc(viewerDocRef, {
                offer: { sdp: offer.sdp, type: offer.type }
              });
            } catch (err) {
              console.error('Error creating local offer:', err);
            }
          }

          // Handle incoming answers and candidates for already created peer connections
          const pc = peerConnectionsRef.current[viewerId];
          if (pc) {
            // If answer arrived
            if (docData.answer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(docData.answer)).catch(err => {
                console.warn('Set remote description from answer response failed:', err);
              });
            }

            // If viewer ICE candidates arrived
            if (docData.viewerCandidates && Array.isArray(docData.viewerCandidates)) {
              const addedViewerCands = addedViewerCandidatesRef.current[viewerId] || new Set();
              docData.viewerCandidates.forEach((cand: any) => {
                const candStr = JSON.stringify(cand);
                if (!addedViewerCands.has(candStr)) {
                  addedViewerCands.add(candStr);
                  pc.addIceCandidate(new RTCIceCandidate(cand)).catch(err => {});
                }
              });
              addedViewerCandidatesRef.current[viewerId] = addedViewerCands;
            }
          }
        } else if (change.type === 'removed') {
          // If viewer disconnected/left, close connection and clean up!
          const pc = peerConnectionsRef.current[viewerId];
          if (pc) {
            try {
              pc.close();
            } catch (err) {}
            delete peerConnectionsRef.current[viewerId];
            delete addedViewerCandidatesRef.current[viewerId];
          }
        }
      });
    }, (error) => {
      console.warn('Host WebRTC signaling listeners failed:', error);
    });

    return () => {
      unsubscribe();
      // Close all connections
      Object.keys(peerConnectionsRef.current).forEach(viewerId => {
        try {
          peerConnectionsRef.current[viewerId].close();
        } catch (err) {}
      });
      peerConnectionsRef.current = {};
      addedViewerCandidatesRef.current = {};
    };
  }, [isHostCurrentUser, streamSource, live.id]);

  // SPECTATOR/VIEWER WebRTC SIGNALING ENGINE (Handshakes with the broadcaster)
  useEffect(() => {
    if (isHostCurrentUser || live.streamSource !== 'WEBCAM' || !hasPaid || !currentUser) {
      setIsWebRTCStreamActive(false);
      return;
    }

    console.log(`Setting up viewer connection for live stream of host: ${live.hostId}`);

    let pc: RTCPeerConnection;
    try {
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      viewerConnectionRef.current = pc;
    } catch (err) {
      console.error('Failed to construct RTCPeerConnection:', err);
      setIsWebRTCStreamActive(false);
      return;
    }

    // Track stream additions
    pc.ontrack = (event) => {
      console.log('Fitted WebRTC tracks on spectator player video.');
      if (viewerVideoRef.current && event.streams[0]) {
        viewerVideoRef.current.srcObject = event.streams[0];
        setIsWebRTCStreamActive(true);
        
        // Muted-agnostic autoplay handler
        viewerVideoRef.current.play().catch(playErr => {
          console.warn('Autoplay blocked. Muting stream to force play:', playErr);
          setIsMuted(true);
          // Retry playing once muted
          if (viewerVideoRef.current) {
            viewerVideoRef.current.muted = true;
            viewerVideoRef.current.play().catch(e => console.error('Secondary play attempt failed:', e));
          }
        });
      }
    };

    // Candidates reporter
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const viewerDocRef = doc(db, 'lives', live.id, 'viewers', currentUser.id);
        updateDoc(viewerDocRef, {
          viewerCandidates: arrayUnion(event.candidate.toJSON())
        }).catch(err => {});
      }
    };

    // Create viewer entry in Firestore
    const viewerDocRef = doc(db, 'lives', live.id, 'viewers', currentUser.id);
    setDoc(viewerDocRef, {
      viewerId: currentUser.id,
      viewerUsername: currentUser.username,
      createdAt: new Date().toISOString(),
      viewerCandidates: [],
      hostCandidates: [],
      offer: null,
      answer: null
    }).catch(err => {
      console.warn('Could not launch signaling document inside Firestore:', err);
    });

    // Subscribing to matching broadcaster answers/offers
    const unsubSignaling = onSnapshot(viewerDocRef, (snap) => {
      const data = snap.data();
      if (!data) return;

      // Set offer remote and respond back
      if (data.offer && !pc.currentRemoteDescription) {
        pc.setRemoteDescription(new RTCSessionDescription(data.offer))
          .then(() => pc.createAnswer())
          .then(ans => pc.setLocalDescription(ans))
          .then(() => {
            updateDoc(viewerDocRef, {
              answer: { sdp: pc.localDescription!.sdp, type: pc.localDescription!.type }
            });
          })
          .catch(err => {
            console.warn('Viewer SDP translation failed:', err);
          });
      }

      // Add Host Candidates
      if (data.hostCandidates && Array.isArray(data.hostCandidates)) {
        data.hostCandidates.forEach(cand => {
          const candStr = JSON.stringify(cand);
          if (!admittedHostCandidatesRef.current.has(candStr)) {
            admittedHostCandidatesRef.current.add(candStr);
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(err => {});
          }
        });
      }
    });

    return () => {
      unsubSignaling();
      try {
        pc.close();
      } catch (e) {}
      viewerConnectionRef.current = null;
      setIsWebRTCStreamActive(false);
      deleteDoc(viewerDocRef).catch(() => {});
    };
  }, [live.id, live.streamSource, isHostCurrentUser, hasPaid, currentUser?.id]);

  // Real-time Chat Sync with specific Live Stream subcollection
  useEffect(() => {
    if (!live?.id) return;

    // Retrieve chats in chronological order
    const chatsCollectionRef = collection(db, 'lives', live.id, 'chats');
    const qr = query(chatsCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(qr, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((dt) => {
        messages.push(dt.data() as ChatMessage);
      });
      setFirestoreChats(messages);
    }, (error) => {
      console.warn('Failed to subscribe to chat synchronization subcollection:', error);
    });

    return () => unsubscribe();
  }, [live.id]);

  const handlePayEntry = () => {
    const success = payPrivateLiveEntry(live.id);
    if (success) {
      setHasPaid(true);
    } else {
      alert(`Saldo insuficiente! Você precisa de pelo menos 🪙 ${live.entryPrice} moedas para desbloquear e entrar nesta live privada.`);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(live.id, inputText);
    setInputText('');
  };

  const handleHeartClick = () => {
    likeLiveStream(live.id);
    // Colorful dynamic floating heart emojis
    const heartEmojis = ['❤️', '💖', '🔥', '🫶', '✨', '🌹', '🥰'];
    const randomEmoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    const newHeart = {
      id: Date.now() + Math.random(),
      emoji: randomEmoji,
      x: Math.floor(Math.random() * 40) - 20, // offset near floating button
      y: Math.floor(Math.random() * 20),
      size: Math.floor(Math.random() * 12) + 16 // between 16px and 28px
    };
    setLikesFloating(prev => [...prev, newHeart]);
    setTimeout(() => {
      setLikesFloating(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2500);
  };

  const handleSendGift = (giftName: string, price: number, emoji: string) => {
    if (isHostCurrentUser) {
      alert('Você não pode enviar presentes para você mesmo!');
      return;
    }
    if (currentUser.coinsBalance < price) {
      alert(`Moedas insuficientes! Você precisa de pelo menos 🪙 ${price} moedas para enviar este presente.`);
      return;
    }

    // Process gift transaction with platform fee split and finance logging
    const success = sendGiftToHost(live.hostId, giftName, price);
    if (!success) {
      alert('Não foi possível realizar o envio do presente.');
      return;
    }

    // Send visual message in the chat feed
    sendChatMessage(live.id, `enviou um presente: ${giftName} ${emoji}! 🎁`);

    // Raise custom screen animation banner
    setActiveGiftBanner({
      sender: currentUser.username,
      name: giftName,
      emoji: emoji
    });

    setIsGiftMenuOpen(false);
  };

  useEffect(() => {
    if (activeGiftBanner) {
      const timer = setTimeout(() => {
        setActiveGiftBanner(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeGiftBanner]);

  const currentLiveChats = firestoreChats.length > 0
    ? firestoreChats
    : chatMessages.filter(m => m.liveId === live.id);

  const formatElapsedTime = () => {
    const start = new Date(live.streamStartedAt).getTime();
    const elapsed = Date.now() - start;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const [timeStr, setTimeStr] = useState('0m 00s');
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(formatElapsedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [live]);

  const triggerShareLink = () => {
    alert(`Link de compartilhamento copiado! Envie para seus amigos: https://streamvip.com/live/${live.id}`);
  };

  const giftsList = [
    { name: 'Rosa', price: 10, emoji: '🌹' },
    { name: 'Doce', price: 25, emoji: '🍬' },
    { name: 'Vinho', price: 50, emoji: '🍷' },
    { name: 'Coroa', price: 150, emoji: '👑' },
    { name: 'Foguete', price: 300, emoji: '🚀' }
  ];

  // Dynamic style injection for beautiful, seamless floating hearts sways
  const inlineStyles = (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes floatUpSway {
        0% {
          transform: translateY(0) scale(0.6) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        25% {
          transform: translateY(-80px) scale(1) rotate(-15deg);
        }
        50% {
          transform: translateY(-200px) scale(1.1) rotate(15deg);
        }
        75% {
          transform: translateY(-320px) scale(0.95) rotate(-10deg);
          opacity: 0.8;
        }
        100% {
          transform: translateY(-440px) scale(0.8) rotate(5deg);
          opacity: 0;
        }
      }
      .floating-heart {
        animation: floatUpSway 2.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}} />
  );

  return (
    <div 
      onTouchStart={(e) => handleSwipeStart(e.targetTouches[0].clientY)}
      onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0].clientY)}
      className="bg-gray-950 text-gray-100 h-screen relative flex items-center justify-center overflow-hidden font-sans select-none w-full"
    >
      {inlineStyles}

      {/* 1. CINEMATIC BLURRED PORTRAIT BACKDROP */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-105 pointer-events-none"
        style={{ backgroundImage: `url(${live.hostAvatar})` }}
      />
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      {/* 2. CHOSEN SMARTPHONE-SIZED TIKTOK VIEWPORT CARD */}
      <div 
        onClick={handleViewportTap}
        className="relative w-full h-screen sm:h-[92vh] sm:max-h-[850px] sm:w-[440px] sm:aspect-[9/16] bg-black sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all border border-gray-900 z-10"
      >
        
        {/* VIEW SCREEN CHANNELS */}
        {!hasPaid ? (
          /* Locked State overlay inside portrait viewport */
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl border border-dashed border-yellow-500/40 flex items-center justify-center text-yellow-500 mb-4 animate-bounce">
              <Lock size={28} />
            </div>
            <h2 className="text-md sm:text-lg font-display font-black tracking-tight text-white mb-2">Transmissão Privada VIP</h2>
            <p className="text-[11px] text-gray-400 max-w-[260px] leading-relaxed">
              A Host <strong className="text-pink-400">@{live.hostName}</strong> definiu esta transmissão como restrita e exclusiva para apoiadores VIP.
            </p>
            <div className="mt-5 bg-white/[0.03] border border-white/5 p-3 rounded-xl flex items-center justify-between w-full max-w-[260px] mb-5">
              <span className="text-[10px] text-gray-300 font-medium">Preço de entrada:</span>
              <span className="text-sm font-mono font-black text-amber-400 flex items-center gap-1">
                🪙 {live.entryPrice} <span className="text-[10px] text-gray-400">moedas</span>
              </span>
            </div>
            
            <div className="flex flex-col gap-2 w-full max-w-[260px]">
              <button
                onClick={handlePayEntry}
                className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-black text-xs py-3 rounded-full transition-transform hover:scale-102 cursor-pointer shadow-lg shadow-pink-600/20 uppercase tracking-wider flex items-center justify-center gap-1.5"
                type="button"
              >
                <Coins size={14} />
                Confirmar Entrada ({live.entryPrice} Moedas)
              </button>
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/15 text-gray-300 text-3xs py-2.5 rounded-full cursor-pointer transition-colors"
                type="button"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        ) : (
          /* Paid / Free Active Channel Stream screen */
          <>
            <div className="absolute inset-0 z-0">
              {isHostCurrentUser && streamSource === 'WEBCAM' ? (
                /* Webcam Input mode with full Broadcaster HUD details & CSS Filters */
                <div className="absolute inset-0 w-full h-full bg-black z-0">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1] transition-all duration-300"
                    style={{ filter: getFilterCSS() }}
                  />

                  {/* Digital HUD guide grids overlay for camera focus */}
                  <div className="absolute inset-x-6 top-1/5 bottom-1/5 border border-white/[0.04] rounded-3xl pointer-events-none select-none flex items-center justify-center z-10">
                    <div className="absolute inset-x-0 border-t border-dashed border-white/[0.06] top-1/2" />
                    <div className="absolute inset-y-0 border-l border-dashed border-white/[0.06] left-1/2" />
                  </div>

                  {/* Blinking camera recording light overlay */}
                  <div className="absolute top-20 right-4 flex items-center gap-1.5 px-2.5 py-0.5 bg-red-650/90 rounded-full border border-red-500/20 pointer-events-none select-none z-10 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[8px] text-white font-mono font-black tracking-widest uppercase">GRAVANDO</span>
                  </div>

                  {/* Simulated telemetry Signal overlay */}
                  <div className="absolute top-20 left-4 flex flex-col gap-0.5 pointer-events-none select-none z-10">
                    <div className="text-[8px] text-white/70 font-mono tracking-wider font-bold animate-pulse">1080p60 @ 60 FPS</div>
                    <div className="text-[7px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/15 px-1.5 py-0.5 rounded max-w-max flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                      <span>{simBitrate} kbps • EXCELENTE</span>
                    </div>
                  </div>

                  {/* Active Filter Label Watermark */}
                  {activeFilter !== 'none' && (
                    <div className="absolute top-36 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/15 text-[8px] font-mono text-pink-400 font-bold z-10 pointer-events-none select-none flex items-center gap-1">
                      <Sparkles size={8} /> {getFilterLabel()}
                    </div>
                  )}

                  {/* Quick tips alert for testing */}
                  {showBroadcasterTip && (
                    <div className="absolute top-44 inset-x-4 bg-indigo-950/95 backdrop-blur-lg border border-indigo-500/35 p-3 rounded-xl z-20 text-[9.5px] leading-relaxed shadow-xl text-indigo-200">
                      <div className="flex items-start gap-2">
                        <Radio size={14} className="text-pink-400 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="font-bold text-white mb-0.5">Modo de Transmissão Direta</p>
                          <p>Seu navegador está transmitindo sua <strong>Webcam</strong> e <strong>Microfone</strong> em tempo real! Não precisa de OBS Studio.</p>
                          <p className="mt-1">💡 Mude para outros <strong>Filtros de Beleza</strong> ou feche a câmera clicando no ícone de engrenagem ⚙️ no topo direito.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowBroadcasterTip(false)}
                        className="mt-2.5 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1 rounded font-bold transition-colors cursor-pointer text-center block"
                        type="button"
                      >
                        Entendi, fechar aviso!
                      </button>
                    </div>
                  )}

                  {/* Real-time jumping vertical VU level meter bar */}
                  <div className="absolute right-4 bottom-28 flex flex-col items-center gap-1 bg-black/55 backdrop-blur-md p-2 rounded-xl border border-white/10 z-10 select-none">
                    <span className="text-[7px] font-mono text-gray-400 font-black uppercase tracking-wider">MIC</span>
                    <div className="w-1.5 h-20 bg-gray-950 rounded-full overflow-hidden flex flex-col justify-end">
                      <div 
                        className={`w-full transition-all duration-75 rounded-full ${
                          micLevel > 65 ? 'bg-gradient-to-t from-yellow-500 to-red-500' : 'bg-gradient-to-t from-emerald-500 to-yellow-500'
                        }`}
                        style={{ height: `${Math.max(5, micLevel)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : isWebRTCStreamActive ? (
                /* Real incoming WebRTC direct stream transmission with host matched beauty filters */
                <div className="absolute inset-0 w-full h-full bg-black z-0">
                  <video
                    ref={viewerVideoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover transition-all duration-300"
                    style={{ filter: getFilterCSS(live.activeFilter || 'beauty') }}
                  />

                  {/* Guide grids HUD overlay overlay */}
                  <div className="absolute inset-x-6 top-1/5 bottom-1/5 border border-white/[0.04] rounded-3xl pointer-events-none select-none flex items-center justify-center z-10">
                    <div className="absolute inset-x-0 border-t border-dashed border-white/[0.06] top-1/2" />
                    <div className="absolute inset-y-0 border-l border-dashed border-white/[0.06] left-1/2" />
                  </div>

                  {/* Realtime HD live broadcast indicator */}
                  <div className="absolute top-20 right-4 flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-600 rounded-full border border-rose-500/20 pointer-events-none select-none z-10 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[8px] text-white font-mono font-black tracking-wider uppercase">FOTO/MICRO AO VIVO</span>
                  </div>

                  <div className="absolute top-20 left-4 text-[8px] text-white/50 font-mono tracking-widest pointer-events-none select-none z-10">
                    CONEXÃO ULTRA BD • WebRTC
                  </div>
                </div>
              ) : (
                /* Simulated immersive background loops */
                <div className="absolute inset-0 flex flex-col justify-between bg-cover bg-center" style={{ backgroundImage: `url(${live.hostAvatar})` }}>
                  {/* Colored glass filter */}
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
                  
                  {/* Digital HUD guide grids overlay */}
                  <div className="absolute inset-x-6 top-1/5 bottom-1/5 border border-white/[0.04] rounded-3xl pointer-events-none select-none flex items-center justify-center">
                    <div className="absolute inset-0 border-t border-dashed border-white/[0.08] top-1/3" />
                    <div className="absolute inset-0 border-t border-dashed border-white/[0.08] top-2/3" />
                    <div className="absolute inset-0 border-l border-dashed border-white/[0.08] left-1/3" />
                    <div className="absolute inset-0 border-l border-dashed border-white/[0.08] left-2/3" />
                  </div>

                  {/* Blinking camera recording light overlay */}
                  <div className="absolute top-20 right-4 flex items-center gap-1.5 px-2.5 py-0.5 bg-black/60 rounded-full border border-white/10 pointer-events-none select-none z-10">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-red-500 absolute" />
                    <span className="text-[8px] text-white font-mono font-bold tracking-widest uppercase">HD REC</span>
                  </div>

                  {/* Simulated Signal overlay */}
                  <div className="absolute top-20 left-4 text-[8px] text-white/50 font-mono tracking-widest pointer-events-none select-none z-10">
                    1080p60 • H.264
                  </div>

                  {/* Realtime dynamic simulated audio bars */}
                  <div className="absolute bottom-24 right-4 flex items-end gap-[2px] h-[30px] z-10 pointer-events-none select-none">
                    {[1, 2, 3, 4, 5, 6].map((bar) => {
                      const randomDurations = ['0.5s', '0.7s', '0.4s', '0.6s', '0.8s', '0.3s'];
                      const randomHeights = ['h-3', 'h-5', 'h-2', 'h-6', 'h-4', 'h-5'];
                      return (
                        <span
                          key={bar}
                          className={`w-[3px] bg-pink-500 rounded-full ${randomHeights[bar - 1]} animate-pulse`}
                          style={{ animationDuration: randomDurations[bar - 1], animationIterationCount: 'infinite' }}
                        />
                      );
                    })}
                  </div>

                  {/* Centered Profile Avatar card inside live */}
                  <div className="relative flex-1 flex flex-col items-center justify-center p-4">
                    <div className="w-24 h-24 rounded-full border-4 border-pink-500 bg-gray-900 overflow-hidden shadow-2xl relative mb-4 animate-pulse duration-1000">
                      <img src={live.hostAvatar} alt={live.hostName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-0 inset-x-0 bg-pink-600 text-white font-mono font-bold text-[7px] py-0.5 uppercase tracking-wide">ONLINE</span>
                    </div>
                    
                    <h3 className="text-xs sm:text-sm font-display font-black text-white flex items-center justify-center gap-1">
                      @{live.hostName} <Sparkles size={11} className="text-pink-400 fill-pink-500/20" />
                    </h3>
                    
                    <p className="text-[10px] text-gray-300 font-bold bg-pink-900/20 px-4 py-1.5 rounded-full border border-pink-500/30 mt-3 max-w-[280px] text-center shadow-lg shadow-pink-600/10">
                      "{live.title}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 3. FLOATING TOP BAR OVERLAY */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-40">
          
          {/* Host user details pill */}
          <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md p-1 pr-3 rounded-full border border-white/5 shadow-sm">
            <img
              src={live.hostAvatar}
              alt={live.hostName}
              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 border border-white/10"
              onClick={() => onSelectHost(live.hostId)}
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-white leading-none truncate">@{live.hostName}</p>
              <p className="text-[8px] text-gray-300 font-mono font-bold leading-none mt-1 flex items-center gap-1">
                <span className="text-pink-500">🔴 NO AR</span> • <span>⌛ {timeStr}</span>
              </p>
            </div>

            {/* Quick Follow button inside top bar */}
            {!isFollowing && !isHostCurrentUser && (
              <button
                onClick={() => followToggle(live.hostId)}
                className="bg-pink-600 hover:bg-pink-700 text-white rounded-full px-2 py-1 leading-none text-[8px] font-black cursor-pointer shadow hover:scale-105 transition-transform ml-2"
                type="button"
              >
                <Plus size={8} className="inline mr-0.5" /> Seguir
              </button>
            )}
          </div>

          {/* Viewer counter + Exit button */}
          <div className="flex items-center gap-1.5">
            <span className="bg-black/45 backdrop-blur-md border border-white/5 text-white font-mono text-[9px] px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-sm font-bold">
              <Eye size={10} className="text-pink-400" /> {live.viewersCount}
            </span>

            <button
              onClick={onClose}
              className="p-2 bg-black/45 backdrop-blur rounded-full text-white/90 hover:text-white border border-white/5 cursor-pointer shadow-sm flex items-center justify-center transition-colors hover:bg-red-600"
              type="button"
            >
              <X size={12} />
            </button>
          </div>

        </div>

        {/* 4. ACTIVE FLOATING GIFT CELEBRATION SLIDE-IN */}
        {activeGiftBanner && (
          <div className="absolute top-16 left-3 z-35 bg-gradient-to-r from-pink-600/95 to-amber-500/90 backdrop-blur-lg px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg animate-bounce select-none">
            <img src={currentUser.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full object-cover border border-white/20" referrerPolicy="no-referrer" />
            <span className="font-display font-black text-[9px] text-white">
              @{activeGiftBanner.sender} enviou <strong className="text-yellow-300 font-mono font-extrabold uppercase">{activeGiftBanner.name} {activeGiftBanner.emoji}</strong>!
            </span>
          </div>
        )}

        {/* 5. SPECIFIC MODERATOR/HOST OPTIONS DOCK (Tucked Away Cog) */}
        {hasPaid && (isHostCurrentUser || isAdminOrSuper) && (
          <div className="absolute top-16 right-3 z-45">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1.5 bg-black/45 backdrop-blur rounded-full text-white/80 hover:text-white border border-white/5 cursor-pointer shadow flex items-center justify-center transition-colors hover:bg-black/70"
              title="Ajustes de Stream"
              type="button"
            >
              <Settings size={12} className={isSettingsOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-1 bg-black/95 backdrop-blur-lg border border-white/10 rounded-xl p-2.5 w-[160px] shadow-2xl space-y-1.5 text-[9px]">
                <p className="font-mono text-gray-400 uppercase tracking-widest text-[8px] border-b border-white/10 pb-1 mb-1 font-bold">
                  Gerenciar Stream
                </p>

                {isHostCurrentUser && (
                  <>
                    <div className="space-y-1">
                      <p className="text-gray-400 font-semibold">Fonte de Sinal:</p>
                      <button
                        onClick={() => { setStreamSource('SIMULATION'); }}
                        className={`w-full text-left p-1 rounded font-mono font-black cursor-pointer ${streamSource === 'SIMULATION' ? 'bg-pink-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                        type="button"
                      >
                        Padrão Loop
                      </button>
                      <button
                        onClick={() => { setStreamSource('WEBCAM'); }}
                        className={`w-full text-left p-1 rounded font-mono font-black cursor-pointer ${streamSource === 'WEBCAM' ? 'bg-emerald-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                        type="button"
                      >
                        🎥 Webcam Real
                      </button>
                    </div>

                    {streamSource === 'WEBCAM' && (
                      <div className="space-y-1 pt-1.5 border-t border-white/10">
                        <p className="text-gray-400 font-semibold mb-1">Filtro de Imagem:</p>
                        <div className="grid grid-cols-2 gap-1">
                          {(['none', 'beauty', 'warm', 'cyberpunk', 'mono'] as const).map((filt) => (
                            <button
                              key={filt}
                              onClick={() => {
                                setActiveFilter(filt);
                              }}
                              className={`p-1 rounded font-mono text-[7px] font-black uppercase text-center cursor-pointer ${
                                activeFilter === filt ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                              type="button"
                            >
                              {filt === 'none' ? 'Normal' : filt === 'beauty' ? 'Beleza' : filt === 'warm' ? 'Quente' : filt === 'cyberpunk' ? 'Cyber' : 'P&B'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {confirmStopLive ? (
                      <div className="bg-red-950/50 p-2 rounded-lg border border-red-900/30 mt-2 text-center animate-fade-in shadow-xl">
                        <p className="text-[9px] text-red-200 font-bold mb-1.5 uppercase">Quer mesmo encerrar?</p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              stopActiveStream(live.id);
                              onClose();
                            }}
                            className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold py-1 rounded text-[8px] uppercase tracking-wider cursor-pointer"
                            type="button"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmStopLive(false)}
                            className="flex-1 bg-gray-850 hover:bg-gray-800 text-gray-300 font-bold py-1 rounded text-[8px] uppercase tracking-wider cursor-pointer"
                            type="button"
                          >
                            Não
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmStopLive(true)}
                        className="w-full bg-red-650 hover:bg-red-700 text-white font-extrabold py-1.5 rounded text-center transition-colors mt-2 uppercase tracking-wide text-[8px] cursor-pointer"
                        type="button"
                      >
                        Encerrar Live
                      </button>
                    )}
                  </>
                )}

                {isAdminOrSuper && !isHostCurrentUser && (
                  <>
                    {confirmForceEndLive ? (
                      <div className="bg-red-950/50 p-2 rounded-lg border border-red-900/30 mt-2 text-center animate-fade-in shadow-xl">
                        <p className="text-[9px] text-red-200 font-bold mb-1.5 uppercase">Derrubar transmissão?</p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              forceEndLive(live.id);
                              onClose();
                            }}
                            className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold py-1 rounded text-[8px] uppercase tracking-wider cursor-pointer font-sans"
                            type="button"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmForceEndLive(false)}
                            className="flex-1 bg-gray-850 hover:bg-gray-800 text-gray-300 font-bold py-1 rounded text-[8px] uppercase tracking-wider cursor-pointer font-sans"
                            type="button"
                          >
                            Não
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmForceEndLive(true)}
                        className="w-full bg-red-900 border border-red-600 text-red-100 hover:bg-red-800 font-bold py-1.5 rounded text-center transition-colors uppercase tracking-wide text-[8px] cursor-pointer mt-2"
                        type="button"
                      >
                        Derrubar Live (Admin)
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. REALTIME TRANSPARENT TIKTOK CHAT OVERLAY */}
        {hasPaid && (
          <div 
            className="absolute bottom-[66px] left-3 right-12 max-h-[170px] overflow-y-auto space-y-1.5 flex flex-col justify-end z-30 pointer-events-auto no-scrollbar mask-gradient"
            style={{ 
              scrollbarWidth: 'none',
              maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, black 80%, transparent 100%)'
            }}
          >
            {currentLiveChats.length === 0 ? (
              <div className="bg-black/30 backdrop-blur-[1px] px-2.5 py-1.5 rounded-lg max-w-max border border-white/5 text-[9px] text-white/55 italic font-mono">
                Seja o primeiro a enviar olá no chat! 🌹
              </div>
            ) : (
              currentLiveChats.map(msg => {
                const senderIsHost = msg.userRole === 'HOST';
                const senderIsAdmin = msg.userRole === 'ADMIN' || msg.userRole === 'SUPER_ADMIN';
                const canModerateThisMessage = (isHostCurrentUser || isAdminOrSuper) && msg.userId !== currentUser.id;

                return (
                  <div key={msg.id} className="group/msg text-[10.5px] leading-snug flex items-start gap-1 p-1.5 bg-black/40 backdrop-blur-[1px] rounded-xl max-w-[85%] border border-white/[0.03] text-white select-text relative transition-transform">
                    <div className="shrink-0 mt-0.5">
                      {senderIsHost ? (
                        <Radio size={9} className="text-pink-400 animate-pulse shrink-0" />
                      ) : senderIsAdmin ? (
                        <Shield size={9} className="text-red-400 shrink-0" />
                      ) : (
                        <User size={9} className="text-blue-400 shrink-0" />
                      )}
                    </div>
                    <div className="min-w-0 pr-6">
                      <span 
                        className={`font-black mr-1 cursor-pointer hover:underline ${senderIsHost ? 'text-pink-400' : senderIsAdmin ? 'text-red-400 font-extrabold' : 'text-blue-400'}`} 
                        onClick={() => onSelectHost(msg.userId)}
                      >
                        @{msg.userName}
                      </span>
                      {senderIsHost && <span className="mr-1 bg-pink-500/20 text-pink-400 text-[7px] px-1 py-0.2 rounded font-black font-mono">HOST</span>}
                      <span className="text-gray-100 font-medium whitespace-normal break-words ml-1">{msg.text}</span>
                    </div>

                    {/* Compact moderation triggers */}
                    {canModerateThisMessage && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/msg:flex items-center gap-1 bg-black/90 p-0.5 rounded border border-white/10">
                        <button
                          onClick={() => deleteChatMessage(msg.id)}
                          title="Excluir"
                          className="text-red-400 hover:text-red-500 p-0.5 cursor-pointer shrink-0"
                        >
                          <Trash2 size={9} />
                        </button>
                        <button
                          onClick={() => kickOrBlockUser(msg.userId, live.id)}
                          title="Silenciar"
                          className="text-orange-400 hover:text-orange-500 p-0.5 cursor-pointer shrink-0"
                        >
                          <VolumeX size={9} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* 7. QUICK GIFTS SHEET SELECTION MODAL */}
        {isGiftMenuOpen && (
          <div className="absolute bottom-16 right-3 bg-black/95 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 w-[220px] z-50 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <span className="font-display font-black text-[9px] text-white/90 uppercase tracking-widest flex items-center gap-1">
                <Gift size={10} className="text-pink-500" /> Presentear Host
              </span>
              <button 
                onClick={() => setIsGiftMenuOpen(false)} 
                className="text-gray-400 hover:text-white font-mono text-[9px] cursor-pointer"
                type="button"
              >
                fechar
              </button>
            </div>
            
            <div className="space-y-1">
              {giftsList.map((g) => (
                <button
                  key={g.name}
                  onClick={() => handleSendGift(g.name, g.price, g.emoji)}
                  className="w-full bg-white/[0.03] hover:bg-pink-600/25 border border-white/[0.06] hover:border-pink-500/30 rounded-lg p-1.5 flex items-center justify-between gap-2.5 text-left cursor-pointer hover:scale-101 transition-transform"
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{g.emoji}</span>
                    <div>
                      <p className="font-bold text-[10px] text-gray-200">{g.name}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] font-bold text-amber-400 shrink-0">
                    🪙 {g.price}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-[8px] text-gray-500 text-center mt-2 font-mono">
              Saldo disponível: <strong>🪙 {currentUser.coinsBalance} moedas</strong>
            </p>
          </div>
        )}

        {/* 8. FLOATING SWAYING HEARTS GRAPHICS */}
        <div className="absolute right-3 bottom-14 w-12 h-[350px] pointer-events-none overflow-hidden z-25 select-none">
          {likesFloating.map(h => (
            <div
              key={h.id}
              style={{
                left: `${h.x + 10}px`,
                bottom: `${h.y}px`,
                fontSize: `${h.size}px`
              }}
              className="absolute floating-heart select-none pointer-events-none"
            >
              {h.emoji}
            </div>
          ))}
        </div>

        {/* 9. BOTTOM ACTION COMPACT BAR (Comments + Interactive circles) */}
        {hasPaid && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 z-40">
            
            {/* Input message form overlay */}
            <form onSubmit={handleSendText} className="flex-1 flex items-center bg-black/55 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 text-xs shadow">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Adicionar comentário..."
                maxLength={200}
                className="flex-1 bg-transparent text-white placeholder-white/45 focus:outline-none text-[10px]"
              />
              {inputText.trim() && (
                <button type="submit" className="text-pink-500 hover:text-pink-400 p-0.5 cursor-pointer shrink-0">
                  <Send size={11} />
                </button>
              )}
            </form>

            {/* Quick gift toggle action button */}
            {!isHostCurrentUser && (
              <button
                onClick={() => setIsGiftMenuOpen(!isGiftMenuOpen)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white cursor-pointer transition-all hover:scale-105 shrink-0 ${
                  isGiftMenuOpen ? 'bg-pink-600 shadow-md shadow-pink-600/35 border border-pink-500' : 'bg-black/55 backdrop-blur border border-white/10 hover:bg-black/75'
                }`}
                title="Mandar Presente"
                type="button"
              >
                <Gift size={12} className="text-pink-400 animate-bounce" />
              </button>
            )}

            {/* Share action trigger */}
            <button
              onClick={triggerShareLink}
              className="w-7 h-7 rounded-full bg-black/55 backdrop-blur border border-white/10 hover:bg-black/75 flex items-center justify-center text-white cursor-pointer transition-all hover:scale-105 shrink-0"
              title="Compartilhar"
              type="button"
            >
              <Share2 size={11} />
            </button>

            {/* Volume mute toggler */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-7 h-7 rounded-full bg-black/55 backdrop-blur border border-white/10 hover:bg-black/75 flex items-center justify-center text-white cursor-pointer transition-all hover:scale-105 shrink-0"
              title={isMuted ? 'Ativar Som' : 'Desativar Som'}
              type="button"
            >
              {isMuted ? <VolumeX size={11} className="text-red-400" /> : <Volume2 size={11} />}
            </button>

            {/* Dynamic heart reaction trigger */}
            <button
              onClick={handleHeartClick}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg shadow-pink-600/25 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
              title="Curtir"
              type="button"
            >
              <Heart size={13} className="fill-white text-white animate-pulse" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
