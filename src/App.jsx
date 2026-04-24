import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Loader2, Layout, RefreshCcw, Building2, Plus, Trash2, X, Save, 
  ChevronRight, ChevronLeft, FolderOpen, FolderPlus, Layers, PlusCircle, 
  Sparkles, LogOut, Camera, Edit2, Check, Settings as SettingsIcon, 
  AlertOctagon, ChevronUp, ChevronDown, Folder 
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import { initializeFirestore, collection, doc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

// --- 캔버스와 외부 배포(Vercel) 환경을 모두 지원하는 하이브리드 설정 ---
const getEnv = (key) => {
  try {
    if (key === 'GEMINI') return import.meta.env.VITE_GEMINI_API_KEY;
    if (key === 'FB_API') return import.meta.env.VITE_FIREBASE_API_KEY;
    if (key === 'FB_DOMAIN') return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    if (key === 'FB_PROJECT') return import.meta.env.VITE_FIREBASE_PROJECT_ID;
    if (key === 'FB_BUCKET') return import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
    if (key === 'FB_SENDER') return import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    if (key === 'FB_APP_ID') return import.meta.env.VITE_FIREBASE_APP_ID;
  } catch (e) {
    return undefined;
  }
};

const isCanvas = typeof __firebase_config !== 'undefined';

// Firebase Document Reference 제약(슬래시 금지)을 해결하기 위한 안전한 ID 파싱
const canvasAppId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '-') : 'default-app-id';

const apiKey = isCanvas ? "" : (getEnv('GEMINI') || "");

const firebaseConfig = isCanvas ? JSON.parse(__firebase_config) : {
  apiKey: getEnv('FB_API') || "dummy-key",
  authDomain: getEnv('FB_DOMAIN') || "dummy",
  projectId: getEnv('FB_PROJECT') || "dummy",
  storageBucket: getEnv('FB_BUCKET') || "dummy",
  messagingSenderId: getEnv('FB_SENDER') || "dummy",
  appId: getEnv('FB_APP_ID') || "dummy"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

// 캔버스는 복잡한 경로를, 외부 배포는 깔끔한 Root 경로를 자동으로 사용합니다.
const getPublicCollection = (colName) => 
  isCanvas ? collection(db, 'artifacts', canvasAppId, 'public', 'data', colName) : collection(db, colName);
const getPublicDoc = (colName, docId) => 
  isCanvas ? doc(db, 'artifacts', canvasAppId, 'public', 'data', colName, docId) : doc(db, colName, docId);

// --- Inject Custom CSS Keyframes (원본 디자인 및 시네마틱 효과 유지) ---
const styleSheet = `
@keyframes smoothScan {
  0% { transform: translateY(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(600px); opacity: 0; }
}
@keyframes heartbeatGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(0, 102, 255, 0.2); }
  50% { box-shadow: 0 0 25px rgba(0, 102, 255, 0.7); }
}
@keyframes projectEntry {
  0% { transform: scale(0.9); opacity: 0; filter: blur(10px); }
  100% { transform: scale(1); opacity: 1; filter: blur(0); }
}
@keyframes lineGrow {
  0% { width: 0; }
  100% { width: 100%; }
}
@keyframes screenDissolveToLeft {
  0% { transform: translateX(0) scale(1); filter: blur(0px) brightness(1); opacity: 1; }
  40% { transform: translateX(-4vw) scale(0.98); filter: blur(3px) brightness(1.5); opacity: 0.9; }
  100% { transform: translateX(-20vw) scale(0.92); filter: blur(25px) brightness(2.5); opacity: 0; }
}
@keyframes maskWipeLeft {
  0% { -webkit-mask-position: 100% 0; mask-position: 100% 0; }
  100% { -webkit-mask-position: 0% 0; mask-position: 0% 0; }
}
.anim-particle-exit {
  -webkit-mask-image: linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%);
  -webkit-mask-size: 300% 100%;
  -webkit-mask-position: 100% 0;
  mask-image: linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%);
  mask-size: 300% 100%;
  mask-position: 100% 0;
  animation:
    screenDissolveToLeft 1.2s cubic-bezier(0.3, 0, 0.2, 1) forwards,
    maskWipeLeft 1.2s cubic-bezier(0.3, 0, 0.2, 1) forwards;
}
@keyframes cinematicRevealLeft {
  0% { transform: translateX(15vw) scale(1.05); opacity: 0; filter: blur(20px) saturate(0); }
  100% { transform: translateX(0) scale(1); opacity: 1; filter: blur(0px) saturate(1); }
}
.anim-cinematic-enter {
  animation: cinematicRevealLeft 1.4s cubic-bezier(0.16, 1, 0.2, 1) forwards;
}
@keyframes cinematicHeartbeat {
  0%, 100% {
    box-shadow: 0 0 0 1px rgba(0, 102, 255, 0.4), 0 0 20px rgba(0, 102, 255, 0.3), inset 0 0 15px rgba(0, 102, 255, 0.1);
    border-color: rgba(0, 102, 255, 0.6);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(50, 150, 255, 1), 0 0 45px rgba(0, 102, 255, 0.9), inset 0 0 35px rgba(0, 102, 255, 0.5);
    border-color: rgba(100, 200, 255, 1);
  }
}
.hover-cinematic-card:hover {
  animation: cinematicHeartbeat 1.4s ease-in-out infinite;
  transform: translateY(-8px);
  z-index: 20;
}
@keyframes saveGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 102, 255, 0.4), inset 0 0 20px rgba(0, 102, 255, 0.2); border-color: rgba(0, 102, 255, 0.3); }
  50% { box-shadow: 0 0 60px rgba(0, 102, 255, 0.8), inset 0 0 40px rgba(0, 102, 255, 0.5); border-color: rgba(100, 200, 255, 0.8); }
}
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* 글로벌 스크롤바 완벽 숨김 처리 */
::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
* {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none !important;
}
.scrollbar-hide {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
`;

const App = () => {
  // --- Auth & Navigation States ---
  const [appState, setAppState] = useState('intro');
  const [prevAppState, setPrevAppState] = useState(null);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [introProgress, setIntroProgress] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);

  // --- Custom ID/PW Auth States ---
  const [authMode, setAuthMode] = useState('login');
  const [memberId, setMemberId] = useState('');
  const [memberPw, setMemberPw] = useState('');
  const [memberName, setMemberName] = useState('');

  // --- Profile Input State ---
  const [manualInfo, setManualInfo] = useState({ displayName: '', photoURL: '', memberId: null });

  // --- Collaborative Data States ---
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectData, setCurrentProjectData] = useState(null);
  const [history, setHistory] = useState([]);
  
  // --- Local UI States ---
  const fileInputRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const addTypeDropdownRef = useRef(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddTypeDropdownOpen, setIsAddTypeDropdownOpen] = useState(false);
  
  // --- Category Management States ---
  const [appCategories, setAppCategories] = useState(['미분류', '홈화면', '결제', '등록', '커뮤니티']);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // --- Component & TestCase Management States ---
  const [appComponents, setAppComponents] = useState([]);
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingCompType, setEditingCompType] = useState(null);
  const [newCompType, setNewCompType] = useState('');
  const [newTestCase, setNewTestCase] = useState('');
  const [expandedObjId, setExpandedObjId] = useState(null);

  const objectTypes = appComponents.length > 0 ? appComponents.map(c => c.type) : ['Button', 'Input', 'Select', 'Checkbox', 'Toggle', 'Tab', 'Text', 'Image', 'Icon', 'Container'];

  // --- Project Long Press Action States ---
  const [longPressedProject, setLongPressedProject] = useState(null);
  const [isEditProjectName, setIsEditProjectName] = useState(false);
  const [editProjectNameVal, setEditProjectNameVal] = useState('');
  const [showActionsProjId, setShowActionsProjId] = useState(null);
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [dragOverProjectId, setDragOverProjectId] = useState(null);
  const longPressTimerRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);

  // --- Meta Info Input States ---
  const [scanMetaForm, setScanMetaForm] = useState({ title: '', category: '미분류' });
  const [isMetaFocused, setIsMetaFocused] = useState(false);

  // --- Object Editing States ---
  const [editingObjId, setEditingObjId] = useState(null);
  const [editObjForm, setEditObjForm] = useState({ label: '', description: '', type: 'Button' });
  const [isAddingObj, setIsAddingObj] = useState(false);
  const [addObjForm, setAddObjForm] = useState({ label: '', description: '', type: 'Button' });

  // --- Object Test Case Editing States ---
  const [editingTestCaseId, setEditingTestCaseId] = useState(null);
  const [editingTestCaseLabel, setEditingTestCaseLabel] = useState('');
  const [newTestCaseLabelObjId, setNewTestCaseLabelObjId] = useState(null);
  const [newTestCaseLabel, setNewTestCaseLabel] = useState('');

  // --- History Interaction States ---
  const [showActionsHistoryId, setShowActionsHistoryId] = useState(null);
  const [draggedHistoryId, setDraggedHistoryId] = useState(null);
  const [dragOverHistoryId, setDragOverHistoryId] = useState(null);
  const historyLongPressTimerRef = useRef(null);
  const isHistoryLongPressTriggeredRef = useRef(false);

  // --- Group Interaction States ---
  const [showActionsGroupCat, setShowActionsGroupCat] = useState(null);
  const [draggedGroupCat, setDraggedGroupCat] = useState(null);
  const [dragOverGroupCat, setDragOverGroupCat] = useState(null);
  const groupLongPressTimerRef = useRef(null);
  const isGroupLongPressTriggeredRef = useRef(false);

  // --- Group Modal States ---
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editGroupOldName, setEditGroupOldName] = useState('');
  const [editGroupNewName, setEditGroupNewName] = useState('');
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState(null);

  // --- Modal States ---
  const [isCloseProjectModalOpen, setIsCloseProjectModalOpen] = useState(false);

  // --- Cinematic Transition States ---
  const [isLandingExiting, setIsLandingExiting] = useState(false);
  const [isAuthorizedEntering, setIsAuthorizedEntering] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);

  // --- Scroll to Top States ---
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainScrollRef = useRef(null);
  const consoleScrollRef = useRef(null);

  const handleScroll = () => {
    const mainTop = mainScrollRef.current?.scrollTop || 0;
    const consoleTop = consoleScrollRef.current?.scrollTop || 0;
    const winTop = window.scrollY || document.documentElement.scrollTop || 0;
    setShowScrollTop(mainTop > 10 || consoleTop > 10 || winTop > 10);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const scrollToTop = () => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    if (consoleScrollRef.current) consoleScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Auth Listener ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isCanvas && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Initial sign-in failed:", err);
      } finally {
        setIsAuthReady(true);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Click Outside for Custom Dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (addTypeDropdownRef.current && !addTypeDropdownRef.current.contains(event.target)) {
        setIsAddTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Presence & Active User Tracking ---
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const presenceRef = getPublicDoc('presence', user.uid);
    const updatePresence = async () => {
      try {
        await setDoc(presenceRef, { 
          lastSeen: Date.now(), 
          uid: user.uid, 
          email: manualInfo.memberId || "Guest Session",
          displayName: manualInfo.displayName || "GUEST",
          photoURL: manualInfo.photoURL || null,
          currentProjectId: appState === 'authorized' ? currentProjectId : null 
        });
      } catch (e) {}
    };

    if (appState !== 'intro' && appState !== 'login') {
      updatePresence();
      const interval = setInterval(updatePresence, 30000);
      const presenceCol = getPublicCollection('presence');
      const unsubPresence = onSnapshot(presenceCol, (snapshot) => {
        const usersList = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (Date.now() - data.lastSeen < 300000) usersList.push(data);
        });
        setActiveUsers(list => JSON.stringify(list) === JSON.stringify(usersList) ? list : usersList);
      });

      return () => {
        clearInterval(interval);
        unsubPresence();
        deleteDoc(presenceRef).catch(() => {});
      };
    }
  }, [isAuthReady, user, currentProjectId, appState, manualInfo]);

  // --- Global Settings Listeners (Categories & Components) ---
  useEffect(() => {
    if (!isAuthReady || !user) return;
    
    // Categories
    const catRef = getPublicDoc('settings', 'categories');
    const unsubCat = onSnapshot(catRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().list) {
        setAppCategories(docSnap.data().list);
      } else {
        setDoc(catRef, { list: ['미분류', '홈화면', '결제', '등록', '커뮤니티'] });
      }
    });

    // Components & Test Cases
    const compRef = getPublicDoc('settings', 'components');
    const unsubComp = onSnapshot(compRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().list) {
        setAppComponents(docSnap.data().list);
      } else {
        const defaultList = [
          { type: 'Button', cases: ['클릭 이벤트 정상 동작 확인', '비활성화 상태 스타일 확인'] },
          { type: 'Input', cases: ['키보드 입력 정상 확인', '포커스 아웃 시 데이터 유지 확인'] },
          { type: 'Image', cases: ['이미지 정상 노출 확인', '이미지 비율 찌그러짐 확인'] },
          { type: 'Icon', cases: ['아이콘 선명도 확인', '클릭 영역 적절성 확인'] },
          { type: 'Text', cases: ['텍스트 잘림 현상 확인', '오탈자 확인'] },
          { type: 'Select', cases: ['옵션 목록 노출 확인', '옵션 선택 동작 확인'] },
          { type: 'Checkbox', cases: ['체크/해제 상태 토글 확인'] },
          { type: 'Toggle', cases: ['ON/OFF 상태 변경 확인'] },
          { type: 'Tab', cases: ['탭 전환 시 콘텐츠 변경 확인'] },
          { type: 'Container', cases: ['내부 여백 및 스크롤 동작 확인'] }
        ];
        setDoc(compRef, { list: defaultList });
      }
    });

    return () => { unsubCat(); unsubComp(); };
  }, [isAuthReady, user]);

  // --- Firestore Real-time Listeners ---
  useEffect(() => {
    if (!isAuthReady || !user || appState === 'intro' || appState === 'login') return;
    
    const projectsRef = getPublicCollection('projects');
    const unsubProjects = onSnapshot(projectsRef, (snapshot) => {
      const projList = [];
      snapshot.forEach(doc => projList.push({ id: doc.id, ...doc.data() }));
      setProjects(projList.sort((a, b) => (b.order || b.createdAt) - (a.order || a.createdAt)));
    }, (err) => console.error(err));

    const historyRef = getPublicCollection('history');
    const unsubHistory = onSnapshot(historyRef, (snapshot) => {
      const histList = [];
      snapshot.forEach(doc => histList.push({ id: doc.id, ...doc.data() }));
      setHistory(histList.sort((a, b) => (b.order || b.createdAt) - (a.order || a.createdAt)));
    }, (err) => console.error(err));

    return () => { unsubProjects(); unsubHistory(); };
  }, [isAuthReady, user, appState]);

  useEffect(() => {
    if (!isAuthReady || !user || !currentProjectId) return;
    const projDocRef = getPublicDoc('projects', currentProjectId);
    const unsubProject = onSnapshot(projDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setCurrentProjectData(docSnap.data());
      } else {
        setCurrentProjectData(null);
        setAppState('projects');
      }
    });
    return () => unsubProject();
  }, [isAuthReady, user, currentProjectId]);

  // --- Sync ActiveScan Meta ---
  useEffect(() => {
    const activeScan = currentProjectData?.activeScan;
    if (!isMetaFocused && activeScan) {
      setScanMetaForm({ 
        title: activeScan.title || '', 
        category: activeScan.category || (appCategories[0] || '미분류') 
      });
    }
  }, [currentProjectData?.activeScan?.title, currentProjectData?.activeScan?.category, isMetaFocused, appCategories]);

  // --- Intro Animation ---
  useEffect(() => {
    if (appState === 'intro') {
      const interval = setInterval(() => {
        setIntroProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setAppState('login'), 800);
            return 100;
          }
          return prev + 2.5;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [appState]);

  // --- Handlers ---
  const handleCustomRegister = async () => {
    const safeId = memberId.trim();
    if (!safeId || !memberPw || !memberName) {
      setLoginErrorMsg("모든 필드를 입력해주세요."); return;
    }
    if (safeId.includes('/')) {
      setLoginErrorMsg("ID에 사용할 수 없는 문자(/)가 포함되어 있습니다."); return;
    }
    setIsLoggingIn(true); setLoginErrorMsg('');
    try {
      const memberRef = getPublicDoc('members', safeId);
      const snap = await getDoc(memberRef);
      if (snap.exists()) { setLoginErrorMsg("이미 사용 중인 접속 ID입니다."); setIsLoggingIn(false); return; }
      await setDoc(memberRef, { id: safeId, password: memberPw, displayName: memberName, photoURL: '', createdAt: Date.now() });
      setManualInfo({ displayName: memberName, photoURL: '', memberId: safeId });
      setPrevAppState('projects');
      setAppState('manualProfile');
    } catch (e) {
      setLoginErrorMsg("가입 처리 중 데이터베이스 오류가 발생했습니다.");
    } finally { setIsLoggingIn(false); }
  };

  const handleCustomLogin = async () => {
    const safeId = memberId.trim();
    if (!safeId || !memberPw) { setLoginErrorMsg("접속 ID와 비밀번호를 입력해주세요."); return; }
    setIsLoggingIn(true); setLoginErrorMsg('');
    try {
      const memberRef = getPublicDoc('members', safeId);
      const snap = await getDoc(memberRef);
      if (!snap.exists()) { setLoginErrorMsg("존재하지 않는 접속 ID입니다."); setIsLoggingIn(false); return; }
      const data = snap.data();
      if (data.password !== memberPw) { setLoginErrorMsg("비밀번호가 일치하지 않습니다."); setIsLoggingIn(false); return; }
      setManualInfo({ displayName: data.displayName, photoURL: data.photoURL, memberId: safeId });
      setAppState('projects');
    } catch (e) {
      setLoginErrorMsg("로그인 처리 중 오류가 발생했습니다.");
    } finally { setIsLoggingIn(false); }
  };

  const handleLogout = async () => {
    setAppState('login');
    setManualInfo({ displayName: '', photoURL: '', memberId: null });
    setMemberId(''); setMemberPw(''); setMemberName(''); setLoginErrorMsg('');
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150;
          let width = img.width, height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
          setManualInfo({...manualInfo, photoURL: canvas.toDataURL('image/jpeg', 0.8)});
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const navigateToProfile = () => {
    setPrevAppState(appState);
    setAppState('manualProfile');
  };

  const createNewProject = async () => {
    if (!newProjectName.trim() || !user) return;
    const newProjectId = `proj_${Date.now()}`;
    await setDoc(getPublicDoc('projects', newProjectId), {
      name: newProjectName.trim(), createdAt: Date.now(), order: Date.now(),
      createdBy: manualInfo.memberId || user.uid, createdByName: manualInfo.displayName || "GUEST", createdByPhoto: manualInfo.photoURL || null,
      isAnalyzing: false, status: 'READY', activeScan: null
    });
    setNewProjectName(''); 
    setIsNewProjectModalOpen(false);
    setCurrentProjectId(newProjectId);
    
    setAppState('projectLanding');
    setIsLandingExiting(false);
    setIsAuthorizedEntering(false);
    
    setTimeout(() => {
      setIsLandingExiting(true);
      setTimeout(() => {
        setAppState('authorized');
        setIsLandingExiting(false);
        setIsAuthorizedEntering(true);
        setTimeout(() => {
          setIsAuthorizedEntering(false);
        }, 1200);
      }, 1200);
    }, 2800);
  };

  const selectProject = (id) => { setCurrentProjectId(id); setAppState('authorized'); };

  // --- Project Action Handlers ---
  const handlePressStart = (proj) => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setShowActionsProjId(proj.id);
    }, 600);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleProjectClick = (id) => {
    if (!isLongPressTriggeredRef.current) {
      if (showActionsProjId) {
         setShowActionsProjId(null);
         return;
      }
      selectProject(id);
    }
    setTimeout(() => { isLongPressTriggeredRef.current = false; }, 100);
  };

  const handleDragStart = (e, id) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    setDraggedProjectId(id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (dragOverProjectId !== id) setDragOverProjectId(id);
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setDragOverProjectId(null);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    setDragOverProjectId(null);
    if (!draggedProjectId || draggedProjectId === targetId) return;

    const draggedIdx = projects.findIndex(p => p.id === draggedProjectId);
    const targetIdx = projects.findIndex(p => p.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newProjects = [...projects];
    const [draggedItem] = newProjects.splice(draggedIdx, 1);
    newProjects.splice(targetIdx, 0, draggedItem);

    const baseTime = Date.now();
    newProjects.forEach((proj, idx) => {
      const newOrder = baseTime - idx * 1000;
      if (proj.order !== newOrder) {
        updateDoc(getPublicDoc('projects', proj.id), { order: newOrder });
      }
    });
    setDraggedProjectId(null);
  };

  const renameProject = async () => {
    if (!longPressedProject || !editProjectNameVal.trim()) return;
    await updateDoc(getPublicDoc('projects', longPressedProject.id), { name: editProjectNameVal.trim() });
    setIsEditProjectName(false);
    setLongPressedProject(null);
  };

  const isProjectClosed = currentProjectData?.status === 'CLOSED';

  // --- Editor Core Actions (AI 분석 로직 - 404/400 오류 해결 완료) ---
  const analyzeScreenshot = async (base64Data, imageSrc) => {
    if (!base64Data || !currentProjectId || !user || isProjectClosed) return;
    const projectRef = getPublicDoc('projects', currentProjectId);
    
    await updateDoc(projectRef, {
      isAnalyzing: true, status: 'IN PROGRESS',
      activeScan: { image: imageSrc, base64Image: base64Data, title: '', description: '', category: appCategories[0] || '미분류', testObjects: [] }
    });

    const dynamicTypes = objectTypes.join(' | ');
    const systemPrompt = `당신은 모바일 앱 QA 테스트 전문가입니다. 스크린샷을 분석하여 UI 오브젝트를 식별하십시오. 결과는 반드시 JSON 형식으로만 응답하십시오: { "objects": [ { "id": "unique_id", "type": "${dynamicTypes}", "label": "오브젝트 이름", "description": "위치 설명" } ] }`;
    const payload = {
      contents: [{ role: "user", parts: [{ text: "이 앱 스크린샷에서 테스트 가능한 모든 UI 요소를 찾아 리스트로 정리해줘." }, { inlineData: { mimeType: "image/png", data: base64Data } }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: "application/json" }
    };

    const callApi = async (attempt = 0) => {
      try {
        // [핵심 수정] Vercel 배포 시 404, 400 에러를 방지하기 위해 gemini-2.0-flash 모델과 v1beta 엔드포인트 사용
        const aiModel = isCanvas ? 'gemini-2.5-flash-preview-09-2025' : 'gemini-2.0-flash';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          const errorMsg = errorData.error?.message || `HTTP 에러 ${response.status}`;
          throw new Error(errorMsg);
        }
        
        const data = await response.json();
        
        // [추가 안정화] 마크다운 백틱(```json)이 포함된 경우를 안전하게 제거 후 파싱
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const cleanText = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        const componentMap = appComponents.reduce((acc, curr) => {
           acc[curr.type] = curr.cases;
           return acc;
        }, {});

        const mappedObjects = (parsed.objects || []).map(obj => {
           const typeCases = componentMap[obj.type] || [];
           const tcArray = typeCases.map((c, i) => ({ id: `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`, label: c, status: 'PENDING' }));
           return { ...obj, id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, status: 'PENDING', testCases: tcArray };
        });
        return mappedObjects;

      } catch (err) {
        if (attempt < 2 && !err.message.includes('API key not valid')) { 
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000)); return callApi(attempt + 1); 
        }
        throw err;
      }
    };

    try {
      const results = await callApi();
      await updateDoc(projectRef, { 'activeScan.testObjects': results, isAnalyzing: false });
    } catch (err) {
      console.error("AI Analysis Error:", err);
      let korError = err.message;
      if (err.message.includes('API key not valid')) korError = "API 키가 올바르지 않거나 잘못 입력되었습니다. Vercel 환경 변수를 다시 확인하세요.";
      else if (err.message.includes('not found') || err.message.includes('404')) korError = "해당 AI 모델에 접근할 수 없습니다. 새 프로젝트에서 발급받은 키인지 확인하세요.";
      
      await updateDoc(projectRef, { 
        isAnalyzing: false,
        'activeScan.title': '⚠️ 분석 실패',
        'activeScan.description': '원인: ' + korError
      });
    }
  };

  const handleFileChange = (e) => {
    if (isProjectClosed) return;
    const file = e.target.files && e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => analyzeScreenshot(event.target.result.split(',')[1], event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const updateActiveScanField = async (field, value) => {
    if (!currentProjectId || !user || isProjectClosed) return;
    await updateDoc(getPublicDoc('projects', currentProjectId), { [`activeScan.${field}`]: value });
  };

  const saveMetaFields = async () => {
    if (!currentProjectId || !user || isProjectClosed) return;
    const projectRef = getPublicDoc('projects', currentProjectId);
    await updateDoc(projectRef, {
      'activeScan.title': scanMetaForm.title,
      'activeScan.category': scanMetaForm.category
    });
  };

  const toggleStatus = async (id, currentStatus) => {
    if (!currentProjectData?.activeScan?.testObjects || isProjectClosed) return;
    const nextStatus = currentStatus === 'PENDING' ? 'PASS' : (currentStatus === 'PASS' ? 'FAIL' : 'PENDING');
    const updatedObjects = currentProjectData.activeScan.testObjects.map(obj => obj.id === id ? { ...obj, status: nextStatus } : obj);
    await updateActiveScanField('testObjects', updatedObjects);
  };

  const toggleTestCaseStatus = async (objId, tcId, newStatus) => {
    if (!currentProjectData?.activeScan?.testObjects || isProjectClosed) return;
    
    const updatedObjects = currentProjectData.activeScan.testObjects.map(obj => {
      if (obj.id === objId) {
         const updatedCases = obj.testCases.map(tc => tc.id === tcId ? { ...tc, status: newStatus } : tc);
         
         const isFail = updatedCases.some(tc => tc.status === 'FAIL');
         const isPending = updatedCases.some(tc => tc.status === 'PENDING');
         let parentStatus = 'PENDING';
         if (isFail) parentStatus = 'FAIL';
         else if (!isPending && updatedCases.length > 0) parentStatus = 'PASS';
         
         return { ...obj, testCases: updatedCases, status: parentStatus };
      }
      return obj;
    });
    
    await updateActiveScanField('testObjects', updatedObjects);
  };

  const deleteObject = async (id) => {
    if (!currentProjectData?.activeScan?.testObjects || isProjectClosed) return;
    const updatedObjects = currentProjectData.activeScan.testObjects.filter(obj => obj.id !== id);
    await updateActiveScanField('testObjects', updatedObjects);
  };

  const saveEditedObject = async () => {
    if (!currentProjectData?.activeScan?.testObjects || isProjectClosed) return;
    if (!editObjForm.label.trim()) return;
    
    const componentMap = appComponents.reduce((acc, curr) => {
       acc[curr.type] = curr.cases;
       return acc;
    }, {});

    const updatedObjects = currentProjectData.activeScan.testObjects.map(obj => {
      if (obj.id === editingObjId) {
         let newTestCases = obj.testCases || [];
         let parentStatus = obj.status;
         
         if (obj.type !== editObjForm.type) {
             const typeCases = componentMap[editObjForm.type] || [];
             newTestCases = typeCases.map((c, i) => ({ id: `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`, label: c, status: 'PENDING' }));
             parentStatus = 'PENDING';
         }
         return { ...obj, ...editObjForm, testCases: newTestCases, status: parentStatus };
      }
      return obj;
    });
    
    await updateActiveScanField('testObjects', updatedObjects);
    setEditingObjId(null);
  };

  const addNewObject = async () => {
    if (!currentProjectData?.activeScan?.testObjects || isProjectClosed) return;
    if (!addObjForm.label.trim()) return;
    
    const componentMap = appComponents.reduce((acc, curr) => {
       acc[curr.type] = curr.cases;
       return acc;
    }, {});
    const typeCases = componentMap[addObjForm.type] || [];
    const tcArray = typeCases.map((c, i) => ({ id: `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`, label: c, status: 'PENDING' }));

    const newObj = {
      ...addObjForm,
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'PENDING',
      testCases: tcArray
    };
    
    const updatedObjects = [...currentProjectData.activeScan.testObjects, newObj];
    await updateActiveScanField('testObjects', updatedObjects);
    setIsAddingObj(false);
    setAddObjForm({ label: '', description: '', type: objectTypes[0] || 'Button' });
  };

  const addTestCaseToObject = async (objId) => {
    if (!currentProjectData?.activeScan?.testObjects || isProjectClosed) return;
    if (!newTestCaseLabel.trim()) return;

    const updatedObjects = currentProjectData.activeScan.testObjects.map(obj => {
      if (obj.id === objId) {
        const newCase = {
          id: `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          label: newTestCaseLabel.trim(),
          status: 'PENDING'
        };
        const updatedCases = [...(obj.testCases || []), newCase];
        
        const isFail = updatedCases.some(tc => tc.status === 'FAIL');
        const isPending = updatedCases.some(tc => tc.status === 'PENDING');
        let parentStatus = 'PENDING';
        if (isFail) parentStatus = 'FAIL';
        else if (!isPending && updatedCases.length > 0) parentStatus = 'PASS';

        return { ...obj, testCases: updatedCases, status: parentStatus };
      }
      return obj;
    });

    await updateActiveScanField('testObjects', updatedObjects);
    setNewTestCaseLabel('');
    setNewTestCaseLabelObjId(null);
  };

  const saveEditedTestCase = async (objId) => {
    if (!currentProjectData?.activeScan?.testObjects || isProjectClosed) return;
    if (!editingTestCaseLabel.trim()) return;

    const updatedObjects = currentProjectData.activeScan.testObjects.map(obj => {
      if (obj.id === objId) {
        const updatedCases = obj.testCases.map(tc => tc.id === editingTestCaseId ? { ...tc, label: editingTestCaseLabel.trim() } : tc);
        return { ...obj, testCases: updatedCases };
      }
      return obj;
    });

    await updateActiveScanField('testObjects', updatedObjects);
    setEditingTestCaseId(null);
  };

  const deleteTestCaseFromObject = async (objId, tcId) => {
    if (!currentProjectData?.activeScan?.testObjects || isProjectClosed) return;

    const updatedObjects = currentProjectData.activeScan.testObjects.map(obj => {
      if (obj.id === objId) {
        const updatedCases = obj.testCases.filter(tc => tc.id !== tcId);

        const isFail = updatedCases.some(tc => tc.status === 'FAIL');
        const isPending = updatedCases.some(tc => tc.status === 'PENDING');
        let parentStatus = 'PENDING';
        if (isFail) parentStatus = 'FAIL';
        else if (!isPending && updatedCases.length > 0) parentStatus = 'PASS';

        return { ...obj, testCases: updatedCases, status: parentStatus };
      }
      return obj;
    });

    await updateActiveScanField('testObjects', updatedObjects);
  };

  const saveCurrentToHistory = async () => {
    const scan = currentProjectData?.activeScan;
    if (!scan || !scan.image || scan.testObjects.length === 0 || !user || !currentProjectId || isProjectClosed) return;
    
    setIsSavingReport(true);
    
    try {
      const stats = {
        total: scan.testObjects.length,
        pass: scan.testObjects.filter(o => o.status === 'PASS').length,
        fail: scan.testObjects.filter(o => o.status === 'FAIL').length,
        pending: scan.testObjects.filter(o => o.status === 'PENDING').length
      };
      
      const minDelay = new Promise(resolve => setTimeout(resolve, 2500));
      
      const saveOp = async () => {
        await addDoc(getPublicCollection('history'), {
          projectId: currentProjectId, createdAt: Date.now(), order: Date.now(), timestamp: new Date().toLocaleString(),
          title: scanMetaForm.title || scan.title || "제목 없는 리포트", description: scan.description || "설명이 없습니다.",
          category: scanMetaForm.category || scan.category || appCategories[0] || '미분류', image: scan.image, base64Image: scan.base64Image,
          testObjects: [...scan.testObjects], stats,
          savedBy: manualInfo.memberId || user.uid, savedByName: manualInfo.displayName || "GUEST", savedByPhoto: manualInfo.photoURL || null
        });
      };

      await Promise.all([saveOp(), minDelay]);
      
      await updateDoc(getPublicDoc('projects', currentProjectId), { activeScan: null });
      setIsHistoryOpen(true);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSavingReport(false);
    }
  };

  const loadFromHistory = async (item) => {
    if (!currentProjectId || !user || isProjectClosed) return;
    await updateDoc(getPublicDoc('projects', currentProjectId), {
      status: 'IN PROGRESS',
      activeScan: { image: item.image, base64Image: item.base64Image, title: item.title, description: item.description, category: item.category, testObjects: [...item.testObjects] }
    });
    setSelectedHistoryItem(null); 
    setSelectedFolder(null);
    setIsHistoryOpen(false);
  };

  const handleCloseProject = async () => {
    if (!currentProjectId || !user) return;
    await updateDoc(getPublicDoc('projects', currentProjectId), { status: 'CLOSED' });
    setIsCloseProjectModalOpen(false);
  };

  // --- History Interaction Handlers ---
  const handleHistoryPressStart = (item) => {
    isHistoryLongPressTriggeredRef.current = false;
    historyLongPressTimerRef.current = setTimeout(() => {
      isHistoryLongPressTriggeredRef.current = true;
      setShowActionsHistoryId(item.id);
    }, 600);
  };

  const handleHistoryPressEnd = () => {
    if (historyLongPressTimerRef.current) clearTimeout(historyLongPressTimerRef.current);
  };

  const handleHistoryClick = (item) => {
    if (!isHistoryLongPressTriggeredRef.current) {
      if (showActionsHistoryId) {
         setShowActionsHistoryId(null);
         return;
      }
      setSelectedHistoryItem(item);
    }
    setTimeout(() => { isHistoryLongPressTriggeredRef.current = false; }, 100);
  };

  const deleteHistory = async (e, id) => {
     e.stopPropagation();
     await deleteDoc(getPublicDoc('history', id));
     setShowActionsHistoryId(null);
  };

  const handleHistoryDragStart = (e, id) => {
    if (historyLongPressTimerRef.current) clearTimeout(historyLongPressTimerRef.current);
    setDraggedHistoryId(id);
  };

  const handleHistoryDragOver = (e, id) => {
    e.preventDefault();
    if (dragOverHistoryId !== id) setDragOverHistoryId(id);
  };

  const handleHistoryDragEnd = () => {
    setDraggedHistoryId(null);
    setDragOverHistoryId(null);
  };

  const handleHistoryDrop = async (e, targetId) => {
    e.preventDefault();
    setDragOverHistoryId(null);
    if (!draggedHistoryId || draggedHistoryId === targetId) return;

    const folderHistories = groupedHistory[selectedFolder] || [];
    const draggedIdx = folderHistories.findIndex(h => h.id === draggedHistoryId);
    const targetIdx = folderHistories.findIndex(h => h.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newFolderHistories = [...folderHistories];
    const [draggedItem] = newFolderHistories.splice(draggedIdx, 1);
    newFolderHistories.splice(targetIdx, 0, draggedItem);

    const baseTime = Date.now();
    newFolderHistories.forEach((item, idx) => {
      const newOrder = baseTime - idx * 1000;
      if (item.order !== newOrder) {
        updateDoc(getPublicDoc('history', item.id), { order: newOrder });
      }
    });
    setDraggedHistoryId(null);
  };

  // --- History Direct Edit Handlers ---
  const toggleHistoryObjStatus = (objId) => {
     if (!selectedHistoryItem || isProjectClosed) return;
     const updatedObjects = selectedHistoryItem.testObjects.map(obj => {
        if (obj.id === objId) {
           const currentStatus = obj.status;
           const nextStatus = currentStatus === 'PENDING' ? 'PASS' : (currentStatus === 'PASS' ? 'FAIL' : 'PENDING');
           return { ...obj, status: nextStatus };
        }
        return obj;
     });
     const stats = {
        total: updatedObjects.length,
        pass: updatedObjects.filter(o => o.status === 'PASS').length,
        fail: updatedObjects.filter(o => o.status === 'FAIL').length,
        pending: updatedObjects.filter(o => o.status === 'PENDING').length
     };
     setSelectedHistoryItem({ ...selectedHistoryItem, testObjects: updatedObjects, stats });
  };

  const toggleHistoryTCStatus = (objId, tcId, newStatus) => {
     if (!selectedHistoryItem || isProjectClosed) return;
     const updatedObjects = selectedHistoryItem.testObjects.map(obj => {
        if (obj.id === objId) {
           const updatedCases = obj.testCases.map(tc => tc.id === tcId ? { ...tc, status: newStatus } : tc);
           const isFail = updatedCases.some(tc => tc.status === 'FAIL');
           const isPending = updatedCases.some(tc => tc.status === 'PENDING');
           let parentStatus = 'PENDING';
           if (isFail) parentStatus = 'FAIL';
           else if (!isPending && updatedCases.length > 0) parentStatus = 'PASS';
           return { ...obj, testCases: updatedCases, status: parentStatus };
        }
        return obj;
     });
     const stats = {
        total: updatedObjects.length,
        pass: updatedObjects.filter(o => o.status === 'PASS').length,
        fail: updatedObjects.filter(o => o.status === 'FAIL').length,
        pending: updatedObjects.filter(o => o.status === 'PENDING').length
     };
     setSelectedHistoryItem({ ...selectedHistoryItem, testObjects: updatedObjects, stats });
  };

  const saveHistoryChanges = async () => {
     if (!selectedHistoryItem || isProjectClosed) return;
     await updateDoc(getPublicDoc('history', selectedHistoryItem.id), {
        testObjects: selectedHistoryItem.testObjects,
        stats: selectedHistoryItem.stats
     });
     setSelectedHistoryItem(null);
  };

  // --- Group Action Handlers ---
  const handleGroupPressStart = (cat) => {
    isGroupLongPressTriggeredRef.current = false;
    groupLongPressTimerRef.current = setTimeout(() => {
      isGroupLongPressTriggeredRef.current = true;
      setShowActionsGroupCat(cat);
    }, 600);
  };

  const handleGroupPressEnd = () => {
    if (groupLongPressTimerRef.current) clearTimeout(groupLongPressTimerRef.current);
  };

  const handleGroupClick = (cat) => {
    if (!isGroupLongPressTriggeredRef.current) {
      if (showActionsGroupCat) {
         setShowActionsGroupCat(null);
         return;
      }
      setSelectedFolder(cat);
    }
    setTimeout(() => { isGroupLongPressTriggeredRef.current = false; }, 100);
  };

  const handleGroupDragStart = (e, cat) => {
    if (groupLongPressTimerRef.current) clearTimeout(groupLongPressTimerRef.current);
    setDraggedGroupCat(cat);
  };

  const handleGroupDragOver = (e, cat) => {
    e.preventDefault();
    if (dragOverGroupCat !== cat) setDragOverGroupCat(cat);
  };

  const handleGroupDragEnd = () => {
    setDraggedGroupCat(null);
    setDragOverGroupCat(null);
  };

  const handleGroupDrop = async (e, targetCat) => {
    e.preventDefault();
    setDragOverGroupCat(null);
    if (!draggedGroupCat || draggedGroupCat === targetCat) return;

    let newList = [...appCategories];
    if (!newList.includes(draggedGroupCat)) newList.push(draggedGroupCat);
    if (!newList.includes(targetCat)) newList.push(targetCat);

    const draggedIdx = newList.indexOf(draggedGroupCat);
    const targetIdx = newList.indexOf(targetCat);

    const [draggedItem] = newList.splice(draggedIdx, 1);
    newList.splice(targetIdx, 0, draggedItem);

    await updateDoc(getPublicDoc('settings', 'categories'), { list: newList });
    setDraggedGroupCat(null);
  };

  const renameGroup = async () => {
    if (!editGroupOldName || !editGroupNewName.trim() || !user) return;
    const oldName = editGroupOldName;
    const newName = editGroupNewName.trim();
    
    let newList = appCategories.map(c => c === oldName ? newName : c);
    if (!newList.includes(newName)) newList.push(newName);
    newList = [...new Set(newList)];
    await updateDoc(getPublicDoc('settings', 'categories'), { list: newList });

    const groupItems = groupedHistory[oldName] || [];
    for (const item of groupItems) {
      await updateDoc(getPublicDoc('history', item.id), { category: newName });
    }

    setIsEditGroupModalOpen(false);
    setShowActionsGroupCat(null);
  };

  const confirmDeleteGroup = (e, cat) => {
     e.stopPropagation();
     setDeleteGroupTarget(cat);
     setIsDeleteGroupModalOpen(true);
     setShowActionsGroupCat(null);
  };

  const executeDeleteGroup = async () => {
     if (!deleteGroupTarget || !user) return;
     const groupItems = groupedHistory[deleteGroupTarget] || [];
     for (const item of groupItems) {
        await deleteDoc(getPublicDoc('history', item.id));
     }
     
     let newList = appCategories.filter(c => c !== deleteGroupTarget);
     await updateDoc(getPublicDoc('settings', 'categories'), { list: newList });

     setIsDeleteGroupModalOpen(false);
     setDeleteGroupTarget(null);
     if (selectedFolder === deleteGroupTarget) setSelectedFolder(null);
  };

  // --- Category & Component Management ---
  const saveCategory = async () => {
    if (!newCatName.trim() || !user) return;
    const newList = [...appCategories, newCatName.trim()];
    await updateDoc(getPublicDoc('settings', 'categories'), { list: newList });
    setNewCatName('');
  };

  const deleteCategory = async (catToRemove) => {
    if (!user || catToRemove === '미분류') return;
    const newList = appCategories.filter(c => c !== catToRemove);
    await updateDoc(getPublicDoc('settings', 'categories'), { list: newList });
  };

  const addComponentType = async () => {
    if(!newCompType.trim() || !user) return;
    const newList = [...appComponents, { type: newCompType.trim(), cases: [] }];
    await updateDoc(getPublicDoc('settings', 'components'), { list: newList });
    setNewCompType('');
  };
  
  const deleteComponentType = async (type) => {
    if(!user) return;
    const newList = appComponents.filter(c => c.type !== type);
    await updateDoc(getPublicDoc('settings', 'components'), { list: newList });
  };

  const addTestCaseToComp = async (type) => {
    if(!newTestCase.trim() || !user) return;
    const newList = appComponents.map(c => {
       if (c.type === type) {
          return { ...c, cases: [...c.cases, newTestCase.trim()] };
       }
       return c;
    });
    await updateDoc(getPublicDoc('settings', 'components'), { list: newList });
    setNewTestCase('');
  };

  const deleteTestCaseFromComp = async (type, caseIndex) => {
    if(!user) return;
    const newList = appComponents.map(c => {
       if (c.type === type) {
          return { ...c, cases: c.cases.filter((_, idx) => idx !== caseIndex) };
       }
       return c;
    });
    await updateDoc(getPublicDoc('settings', 'components'), { list: newList });
  };

  // --- Derived Values ---
  const currentUserDisplayName = manualInfo.displayName || "사용자";
  const currentUserPhoto = manualInfo.photoURL || null;

  const groupedHistory = projectHistory.reduce((acc, item) => {
    const cat = item.category || '미분류';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const displayGroups = Object.keys(groupedHistory).sort((a, b) => {
     let idxA = appCategories.indexOf(a);
     let idxB = appCategories.indexOf(b);
     if (idxA === -1) idxA = 999;
     if (idxB === -1) idxB = 999;
     return idxA - idxB;
  });

  // --- Render Sections (인트로 ~ 메인까지 모든 레이아웃 원본 그대로 유지) ---
  if (appState === 'intro') {
    return (
      <div className="min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 text-white font-sans">
        <style>{styleSheet}</style>
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30 animate-pulse"></div>
          <div className="bg-white/10 p-5 rounded-[2.5rem] border border-white/20 backdrop-blur-xl mb-6 shadow-2xl relative z-10"><Building2 className="w-16 h-16 text-[#0066FF]" /></div>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-3 italic"><span className="text-[#0066FF] not-italic">APTNER</span> <span className="text-white opacity-90">QA PRO</span></h1>
          <p className="text-blue-300 font-bold tracking-[0.4em] text-[10px] uppercase">Collaborative UI Testing System</p>
        </div>
        <div className="w-72 h-1.5 bg-white/5 rounded-full overflow-hidden mb-5 border border-white/10">
          <div className="h-full bg-gradient-to-r from-[#0066FF] to-[#00CCFF] transition-all duration-300" style={{ width: `${introProgress}%` }} />
        </div>
      </div>
    );
  }

  if (appState === 'login') {
    return (
      <div className="min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 text-white overflow-hidden">
        <style>{styleSheet}</style>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight mb-2">Workspace Access</h1>
          <p className="text-blue-200/50 text-xs font-bold tracking-widest uppercase">팀 협업을 위한 계정 접속</p>
        </div>
        
        <div className="w-full max-w-xs">
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6 border border-white/10">
            <button onClick={() => {setAuthMode('login'); setLoginErrorMsg('');}} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${authMode === 'login' ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20' : 'text-white/40 hover:text-white'}`}>로그인</button>
            <button onClick={() => {setAuthMode('register'); setLoginErrorMsg('');}} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${authMode === 'register' ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20' : 'text-white/40 hover:text-white'}`}>멤버 등록</button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Connect ID</label>
              <input type="text" placeholder="영문 또는 숫자 입력" className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-[#0066FF] focus:bg-[#0066FF]/10 focus:ring-4 focus:ring-[#0066FF]/30 focus:shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-all duration-300 text-sm font-bold text-white placeholder-white/30" value={memberId} onChange={(e) => setMemberId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Password</label>
              <input type="password" placeholder="비밀번호 입력" className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-[#0066FF] focus:bg-[#0066FF]/10 focus:ring-4 focus:ring-[#0066FF]/30 focus:shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-all duration-300 text-sm font-bold text-white placeholder-white/30" value={memberPw} onChange={(e) => setMemberPw(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? handleCustomLogin() : handleCustomRegister())} />
            </div>
            {authMode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Display Name</label>
                <input type="text" placeholder="예: 홍길동" className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-[#0066FF] focus:bg-[#0066FF]/10 focus:ring-4 focus:ring-[#0066FF]/30 focus:shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-all duration-300 text-sm font-bold text-white placeholder-white/30" value={memberName} onChange={(e) => setMemberName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCustomRegister()} />
              </div>
            )}
            {loginErrorMsg && <p className="text-rose-400 text-center text-[11px] font-bold mt-2 animate-pulse">{loginErrorMsg}</p>}
            <button onClick={authMode === 'login' ? handleCustomLogin : handleCustomRegister} disabled={isLoggingIn || !isAuthReady} className="w-full py-4 mt-4 bg-white text-[#001529] rounded-2xl font-black text-sm shadow-xl active:scale-95 disabled:opacity-80 transition-all flex items-center justify-center gap-2">
              {(isLoggingIn || !isAuthReady) && <Loader2 className="w-5 h-5 animate-spin" />}
              {authMode === 'login' ? '워크스페이스 접속' : '계정 등록 및 시작'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'manualProfile') {
    return (
      <div className="min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 text-white">
        <style>{styleSheet}</style>
        <div className="max-w-xs w-full space-y-8">
          <div className="text-center space-y-4">
            <label className="cursor-pointer inline-block group relative">
              <div className="w-24 h-24 bg-blue-500/20 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-500/30 text-blue-400 overflow-hidden relative shadow-xl transition-all group-hover:border-blue-400">
                {manualInfo.photoURL ? <img src={manualInfo.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8" />}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-white uppercase tracking-widest">업로드</span></div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
            </label>
            <div>
              <h2 className="text-2xl font-black italic">PROFILE <span className="text-[#0066FF] not-italic">PHOTO</span></h2>
              <p className="text-blue-200/50 text-xs font-bold uppercase tracking-widest mt-1">{manualInfo.displayName}님, 프로필 사진을 등록하세요</p>
            </div>
          </div>
          
          <button onClick={async () => {
              if (manualInfo.memberId) await updateDoc(getPublicDoc('members', manualInfo.memberId), { photoURL: manualInfo.photoURL });
              setAppState(prevAppState && prevAppState !== 'login' && prevAppState !== 'intro' ? prevAppState : 'projects'); 
            }}
            className="w-full py-4 bg-[#0066FF] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {manualInfo.photoURL ? '설정 완료' : '사진 없이 입장'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (appState === 'projects') {
    return (
      <div className="min-h-screen bg-[#001224] text-white flex flex-col relative overflow-hidden">
        <style>{styleSheet}</style>
        <div className="relative z-10 flex flex-col min-h-screen p-8 md:p-16 max-w-[1400px] mx-auto w-full">
          <header className="mb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full"><Sparkles className="w-3 h-3 text-[#0066FF]" /><span className="text-[9px] font-black tracking-[0.2em] uppercase text-blue-300/80">Premium Workspace</span></div>
              <h1 className="text-5xl font-black tracking-tight text-white mb-2 italic uppercase">Team <span className="text-[#0066FF] not-italic">Boards</span></h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                  style={{ animation: 'heartbeatGlow 2s ease-in-out infinite' }}
                  className="w-9 h-9 rounded-full overflow-hidden border border-white/20 hover:border-[#0066FF] transition-all shrink-0 bg-slate-800 flex items-center justify-center"
                >
                  {currentUserPhoto ? <img src={currentUserPhoto} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-xs text-white">{currentUserDisplayName?.[0]}</span>}
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-[#001529]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-white/10 flex flex-col items-start cursor-pointer hover:bg-white/5 transition-colors" onClick={() => { setIsUserMenuOpen(false); navigateToProfile(); }}>
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">ID: {manualInfo.memberId}</span>
                      <span className="text-sm font-black tracking-tight text-white truncate w-full">{currentUserDisplayName}</span>
                    </div>
                    <button onClick={() => { setIsUserMenuOpen(false); handleLogout(); }} className="w-full px-4 py-3 flex items-center justify-between text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold">
                      로그아웃 <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-white/10 to-transparent backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(0,102,255,0.2)]">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span className="text-xs font-black tracking-widest uppercase text-white/90">{activeUsers.length} <span className="text-white/50">Online</span></span>
              </div>
            </div>
          </header>

          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-6">
            <div onClick={() => setIsNewProjectModalOpen(true)} className="group bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[130px] transition-all cursor-pointer shadow-lg hover:border-[#0066FF]/50">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0066FF] transition-all duration-300 shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Add Project</span>
            </div>

            {projects.map(proj => {
              const projectMembers = activeUsers.filter(u => u.currentProjectId === proj.id);
              return (
                <div key={proj.id} 
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, proj.id)}
                  onDragOver={(e) => handleDragOver(e, proj.id)}
                  onDrop={(e) => handleDrop(e, proj.id)}
                  onDragEnd={handleDragEnd}
                  onPointerDown={(e) => { if (e.button === 2) return; handlePressStart(proj); }}
                  onPointerUp={handlePressEnd}
                  onPointerLeave={handlePressEnd}
                  onPointerCancel={handlePressEnd}
                  onClick={() => handleProjectClick(proj.id)}
                  style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                  className={`group relative bg-gradient-to-br from-white/[0.07] to-white/[0.01] rounded-[2rem] p-6 border border-white/10 shadow-2xl transition-all cursor-pointer ${dragOverProjectId === proj.id ? 'border-[#0066FF] bg-white/[0.1] scale-105' : 'hover-cinematic-card'} ${draggedProjectId === proj.id ? 'opacity-50' : ''}`}
                >
                  {showActionsProjId === proj.id && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-20 animate-in fade-in zoom-in duration-200">
                      <button onClick={(e) => { e.stopPropagation(); setLongPressedProject(proj); setIsEditProjectName(true); setEditProjectNameVal(proj.name); setShowActionsProjId(null); }} className="p-2 bg-blue-500 hover:bg-blue-400 text-white rounded-full shadow-xl transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={async (e) => { e.stopPropagation(); await deleteDoc(getPublicDoc('projects', proj.id)); setShowActionsProjId(null); }} className="p-2 bg-rose-500 hover:bg-rose-400 text-white rounded-full shadow-xl transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  <div className="flex flex-col h-full justify-between min-h-[130px]">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <FolderPlus className="w-6 h-6 text-white/30 group-hover:text-[#0066FF] transition-colors" />
                        <span className={`px-2 py-1 rounded-full text-[8px] font-black tracking-widest uppercase ${proj.status === 'CLOSED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{proj.status}</span>
                      </div>
                      <h3 className="text-lg font-black text-white leading-tight mb-2 line-clamp-2 italic uppercase">{proj.name}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                          {proj.createdByPhoto ? <img src={proj.createdByPhoto} alt="" className="w-full h-full object-cover" /> : <div className="bg-slate-700 w-full h-full flex items-center justify-center text-[10px] font-bold">{proj.createdByName?.[0]}</div>}
                        </div>
                        <span className="text-xs font-bold text-white/40">{proj.createdByName || "익명"}</span>
                      </div>
                      <div className="flex -space-x-2">
                        {projectMembers.slice(0, 3).map((m, idx) => (
                          <div key={idx} className="w-6 h-6 rounded-full bg-slate-800 border border-[#001224] flex items-center justify-center text-[8px] font-black overflow-hidden shadow-xl">
                            {m.photoURL ? <img src={m.photoURL} alt="" className="w-full h-full object-cover" /> : m.displayName?.[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </main>

          {/* --- Project Action Modals --- */}
          {isNewProjectModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#001224]/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-gradient-to-b from-[#001529] to-[#000b14] border border-white/10 w-full max-w-sm rounded-[2rem] shadow-[0_0_40px_rgba(0,102,255,0.15)] p-6 flex flex-col text-white relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6 border-b pb-4 border-white/10">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-white italic">New <span className="text-[#0066FF] not-italic">Project</span></h2>
                      <p className="text-[9px] font-bold text-blue-300/50 uppercase tracking-widest mt-1">새로운 워크스페이스 생성</p>
                    </div>
                    <button onClick={() => { setIsNewProjectModalOpen(false); setNewProjectName(''); }} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Project Name</label>
                      <input type="text" placeholder="프로젝트 명칭 입력" className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-black outline-none focus:border-[#0066FF] focus:bg-[#0066FF]/10 focus:ring-4 focus:ring-[#0066FF]/20 text-white placeholder-white/20 transition-all shadow-inner" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && createNewProject()} autoFocus />
                    </div>
                  </div>
                  <button onClick={createNewProject} className="w-full py-4 bg-gradient-to-r from-[#0066FF] to-[#00aaFF] text-white rounded-xl font-black text-sm shadow-[0_0_20px_rgba(0,102,255,0.3)] hover:shadow-[0_0_30px_rgba(0,102,255,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> 시작하기</button>
                </div>
              </div>
            </div>
          )}

          {longPressedProject && isEditProjectName && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#001224]/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-gradient-to-b from-[#001529] to-[#000b14] border border-white/10 w-full max-w-sm rounded-[2rem] shadow-[0_0_40px_rgba(0,102,255,0.15)] p-6 flex flex-col text-white relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6 border-b pb-4 border-white/10">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Edit <span className="text-[#0066FF] not-italic">Name</span></h2>
                      <p className="text-[9px] font-bold text-blue-300/50 uppercase tracking-widest mt-1">프로젝트 이름 변경</p>
                    </div>
                    <button onClick={() => { setIsEditProjectName(false); setLongPressedProject(null); }} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">New Name</label>
                      <input type="text" className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-black outline-none focus:border-[#0066FF] focus:bg-[#0066FF]/10 focus:ring-4 focus:ring-[#0066FF]/20 text-white placeholder-white/20 transition-all shadow-inner" value={editProjectNameVal} onChange={(e) => setEditProjectNameVal(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && renameProject()} autoFocus />
                    </div>
                  </div>
                  <button onClick={renameProject} className="w-full py-4 bg-gradient-to-r from-[#0066FF] to-[#00aaFF] text-white rounded-xl font-black text-sm shadow-[0_0_20px_rgba(0,102,255,0.3)] hover:shadow-[0_0_30px_rgba(0,102,255,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> 저장하기</button>
                </div>
              </div>
            </div>
          )}

          {/* --- Close Project Confirm Modal --- */}
          {isCloseProjectModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 flex flex-col text-center">
                  <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertOctagon className="w-8 h-8" /></div>
                  <h2 className="text-xl font-black uppercase tracking-tight mb-2">Close Project?</h2>
                  <p className="text-sm text-slate-500 font-bold mb-6">프로젝트를 종료하면 더 이상 수정하거나 스크린샷을 업로드할 수 없습니다. 계속하시겠습니까?</p>
                  <div className="flex gap-3">
                     <button onClick={() => setIsCloseProjectModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-200">CANCEL</button>
                     <button onClick={handleCloseProject} className="flex-1 py-3 bg-rose-50 text-white rounded-xl font-black text-sm shadow-lg hover:bg-rose-600">YES, CLOSE IT</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- High Quality Project Transition Screen ---
  if (appState === 'projectLanding') {
    return (
      <div className={`min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative ${isLandingExiting ? 'anim-particle-exit' : ''}`}>
        <style>{styleSheet}</style>
        {isLandingExiting && <div className="cinematic-particles-overlay" />}
        <div className="absolute inset-0 bg-blue-500/5 blur-[120px] animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-12 max-w-4xl w-full px-10 animate-[projectEntry_0.8s_ease-out]">
           <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-2xl mb-2"><Layers className="w-10 h-10 text-blue-400" /></div>
           <div className="space-y-4 w-full">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Workspace Init...</h2>
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-tight break-words line-clamp-4">{currentProjectData?.name}</h1>
           </div>
           <div className="w-64 space-y-4">
              <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-blue-500 shadow-[0_0_15px_#0066FF] animate-[lineGrow_2.5s_ease-in-out_forwards]"></div>
              </div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] animate-pulse">프로젝트 환경을 구축하는 중입니다</p>
           </div>
        </div>
      </div>
    );
  }

  // --- Main Editor UI ---
  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex overflow-hidden ${isAuthorizedEntering ? 'anim-cinematic-enter' : ''}`}>
      <style>{styleSheet}</style>

      {/* --- Category Management Modal --- */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight">Category Settings</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2 mb-6">
              <input type="text" placeholder="새 카테고리" className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#0066FF]" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && saveCategory()} />
              <button onClick={saveCategory} className="px-4 py-2 bg-[#0066FF] text-white rounded-xl font-bold text-sm shadow hover:bg-blue-600 transition-colors">추가</button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-60">
              {appCategories.map(cat => (
                <div key={cat} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-sm font-bold">{cat}</span>
                  {cat !== '미분류' && <button onClick={() => deleteCategory(cat)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Component & Test Case Settings Modal --- */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-6 border-b pb-4 border-slate-100">
              <h2 className="text-lg font-black uppercase tracking-tight">Component Test Cases</h2>
              <button onClick={() => { setIsCompModalOpen(false); setEditingCompType(null); }} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            {!editingCompType ? (
              <>
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="새 컴포넌트 추가" className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#0066FF]" value={newCompType} onChange={(e) => setNewCompType(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addComponentType()} />
                  <button onClick={addComponentType} className="px-4 py-2 bg-[#001529] text-white rounded-xl font-bold text-sm shadow hover:bg-black transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {appComponents.map(comp => (
                    <div key={comp.type} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors cursor-pointer group" onClick={() => setEditingCompType(comp.type)}>
                      <div>
                         <span className="text-sm font-black text-slate-800">{comp.type}</span>
                         <p className="text-[10px] text-slate-400 font-bold mt-0.5">{comp.cases.length}개의 기본 케이스</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                         <button onClick={(e) => { e.stopPropagation(); deleteComponentType(comp.type); }} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <button onClick={() => setEditingCompType(null)} className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 hover:text-slate-700 mb-4 tracking-widest w-fit"><ChevronLeft className="w-4 h-4" /> BACK</button>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xl font-black text-blue-600">{editingCompType}</h3>
                   <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-black uppercase tracking-widest">Test Cases</span>
                </div>
                <div className="flex gap-2 mb-4 shrink-0">
                  <input type="text" placeholder="새 케이스 추가" className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#0066FF]" value={newTestCase} onChange={(e) => setNewTestCase(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTestCaseToComp(editingCompType)} />
                  <button onClick={() => addTestCaseToComp(editingCompType)} className="px-4 py-2 bg-[#0066FF] text-white rounded-xl font-bold text-sm shadow hover:bg-blue-600 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                   {(() => {
                      const currentComp = appComponents.find(c => c.type === editingCompType);
                      if (!currentComp || currentComp.cases.length === 0) return <p className="text-xs text-slate-400 font-bold italic text-center py-6">등록된 기본 케이스가 없습니다.</p>;
                      return currentComp.cases.map((tc, idx) => (
                         <div key={idx} className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                           <span className="text-sm font-bold text-slate-700">{tc}</span>
                           <button onClick={() => deleteTestCaseFromComp(editingCompType, idx)} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      ));
                   })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Close Project Confirm Modal --- */}
      {isCloseProjectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 flex flex-col text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertOctagon className="w-8 h-8" /></div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-2">Close Project?</h2>
              <p className="text-sm text-slate-500 font-bold mb-6">프로젝트를 종료하면 더 이상 수정하거나 스크린샷을 업로드할 수 없습니다. 계속하시겠습니까?</p>
              <div className="flex gap-3">
                 <button onClick={() => setIsCloseProjectModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-200">CANCEL</button>
                 <button onClick={handleCloseProject} className="flex-1 py-3 bg-rose-50 text-white rounded-xl font-black text-sm shadow-lg hover:bg-rose-600">YES, CLOSE IT</button>
              </div>
           </div>
        </div>
      )}

      {/* --- Edit Group Name Modal --- */}
      {isEditGroupModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 flex flex-col text-slate-800">
            <div className="flex items-center justify-between mb-4 border-b pb-4 border-slate-100">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">그룹 이름 변경</h2>
              <button onClick={() => setIsEditGroupModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-[#0066FF] text-slate-800 mb-4 transition-all" value={editGroupNewName} onChange={(e) => setEditGroupNewName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && renameGroup()} autoFocus />
            <button onClick={renameGroup} className="w-full py-3 bg-[#0066FF] text-white rounded-xl font-black text-sm shadow hover:bg-blue-600 transition-colors active:scale-95">저장하기</button>
          </div>
        </div>
      )}

      {/* --- Delete Group Confirm Modal --- */}
      {isDeleteGroupModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 flex flex-col text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertOctagon className="w-8 h-8" /></div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-2">Delete Group?</h2>
              <p className="text-sm text-slate-500 font-bold mb-6">[{deleteGroupTarget}] 그룹과 그룹에 포함된 <span className="text-rose-500 font-black">모든 레포트</span>가 삭제됩니다. 계속하시겠습니까?</p>
              <div className="flex gap-3">
                 <button onClick={() => setIsDeleteGroupModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-200 transition-all">CANCEL</button>
                 <button onClick={executeDeleteGroup} className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-sm shadow-lg hover:bg-rose-500 hover:text-white transition-all">YES, DELETE</button>
              </div>
           </div>
        </div>
      )}

      {/* --- Saving Report Cinematic Overlay --- */}
      {isSavingReport && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#001529]/90 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden">
          <div className="relative flex flex-col items-center">
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] animate-pulse rounded-full pointer-events-none"></div>
            <div className="w-24 h-24 mb-8 rounded-[2rem] border border-blue-500/50 bg-[#001529]/50 backdrop-blur-md flex items-center justify-center relative overflow-hidden" style={{ animation: 'saveGlow 2s ease-in-out infinite' }}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent w-full h-full" style={{ animation: 'scanline 1.5s linear infinite' }} />
              <Save className="w-10 h-10 text-blue-400 relative z-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white mb-2 italic">Saving <span className="text-blue-500 not-italic">Report</span></h2>
            <p className="text-[10px] font-bold text-blue-300/60 uppercase tracking-widest animate-pulse">아카이브로 데이터를 안전하게 전송 중입니다...</p>
            
            <div className="mt-8 w-64 h-1 bg-white/10 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 animate-[lineGrow_2.5s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* --- Archive Sidebar Backdrop --- */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 z-[45] bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {/* --- Archive Sidebar --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#001529] text-white transition-transform duration-500 transform ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl rounded-r-2xl`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
            <h2 className="font-black text-sm uppercase tracking-widest">Archive</h2>
            <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             {displayGroups.length === 0 ? (
                <p className="text-xs text-white/40 text-center mt-10">저장된 아카이브가 없습니다.</p>
             ) : (
                displayGroups.map(cat => {
                  const groupStats = groupedHistory[cat].reduce((acc, item) => {
                     acc.pass += (item.stats?.pass || 0);
                     acc.fail += (item.stats?.fail || 0);
                     return acc;
                  }, { pass: 0, fail: 0 });

                  return (
                  <div key={cat} 
                       draggable={true}
                       onDragStart={(e) => handleGroupDragStart(e, cat)}
                       onDragOver={(e) => handleGroupDragOver(e, cat)}
                       onDrop={(e) => handleGroupDrop(e, cat)}
                       onDragEnd={handleGroupDragEnd}
                       onPointerDown={(e) => { if (e.button === 2) return; handleGroupPressStart(cat); }}
                       onPointerUp={handleGroupPressEnd}
                       onPointerLeave={handleGroupPressEnd}
                       onPointerCancel={handleGroupPressEnd}
                       onClick={() => handleGroupClick(cat)}
                       style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                       className={`group p-4 bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-2xl cursor-pointer transition-all flex items-center gap-4 relative ${dragOverGroupCat === cat ? 'border-[#0066FF] bg-white/[0.1] scale-105' : 'hover:bg-[#0066FF]/20 hover:border-[#0066FF]/50 shadow-lg'} ${draggedGroupCat === cat ? 'opacity-50' : ''}`}
                  >
                     {showActionsGroupCat === cat && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20 animate-in fade-in zoom-in duration-200">
                           <button onClick={(e) => { e.stopPropagation(); setEditGroupOldName(cat); setEditGroupNewName(cat); setIsEditGroupModalOpen(true); setShowActionsGroupCat(null); }} className="p-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-full shadow-xl transition-all"><Edit2 className="w-3 h-3" /></button>
                           <button onClick={(e) => confirmDeleteGroup(e, cat)} className="p-1.5 bg-rose-500 hover:bg-rose-400 text-white rounded-full shadow-xl transition-all"><Trash2 className="w-3 h-3" /></button>
                        </div>
                     )}
                     <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_4px_12px_rgba(37,99,235,0.4)] relative shrink-0">
                        <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Folder className="w-6 h-6 text-white relative z-10" />
                     </div>
                     <div className="flex-1 min-w-0 pr-6">
                        <p className="text-sm font-black text-white truncate uppercase tracking-tight">{cat}</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{groupedHistory[cat].length} Reports</p>
                        <div className="flex gap-1.5 mt-1.5">
                           <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 uppercase tracking-tighter">{groupStats.pass} Pass</span>
                           <span className="text-[8px] font-black px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded border border-rose-500/30 uppercase tracking-tighter">{groupStats.fail} Fail</span>
                        </div>
                     </div>
                     {!showActionsGroupCat && <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors absolute right-4" />}
                  </div>
                  );
                })
             )}
          </div>
        </div>
      </aside>

      {/* --- Folder Contents Popup (Modal Overlay Style) --- */}
      {selectedFolder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-[90vw] md:max-w-7xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] flex flex-col h-[85vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shadow-sm">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-xl shadow-lg shadow-blue-500/20"><FolderOpen className="w-5 h-5" /></div>
                    <div>
                       <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">{selectedFolder}</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">총 {groupedHistory[selectedFolder].length}건의 히스토리 리포트</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedFolder(null)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-200/90 relative">
                 <style>{`
                   .hover-soft-glow:hover {
                     animation: heartbeatGlow 1.5s ease-in-out infinite;
                     transform: translateY(-4px);
                     z-index: 20;
                   }
                 `}</style>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {groupedHistory[selectedFolder].map(item => (
                       <div key={item.id} 
                            draggable={true}
                            onDragStart={(e) => handleHistoryDragStart(e, item.id)}
                            onDragOver={(e) => handleHistoryDragOver(e, item.id)}
                            onDrop={(e) => handleHistoryDrop(e, item.id)}
                            onDragEnd={handleHistoryDragEnd}
                            onPointerDown={(e) => { if (e.button === 2) return; handleHistoryPressStart(item); }}
                            onPointerUp={handleHistoryPressEnd}
                            onPointerLeave={handleHistoryPressEnd}
                            onPointerCancel={handleHistoryPressEnd}
                            onClick={() => handleHistoryClick(item)}
                            style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                            className={`group p-4 bg-white rounded-2xl shadow-sm border border-transparent transition-all cursor-pointer flex flex-col items-center justify-center relative ${dragOverHistoryId === item.id ? 'border-[#0066FF] bg-blue-50 scale-105' : 'hover-soft-glow'} ${draggedHistoryId === item.id ? 'opacity-50' : ''}`}
                       >
                          {showActionsHistoryId === item.id && (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20 animate-in fade-in zoom-in duration-200">
                               <button onClick={(e) => deleteHistory(e, item.id)} className="p-1.5 bg-rose-500 hover:bg-rose-400 text-white rounded-full shadow-md transition-all"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          )}
                          <div className="flex-1 min-w-0 w-full text-center py-2">
                             <p className="font-black text-slate-800 text-[13px] truncate mb-3 uppercase tracking-tight" title={item.title}>{item.title}</p>
                             <div className="flex justify-center gap-1.5">
                                <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 uppercase tracking-tighter">{item.stats?.pass} Pass</span>
                                <span className="text-[9px] font-black px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md border border-rose-100 uppercase tracking-tighter">{item.stats?.fail} Fail</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- History View Modal --- */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="px-8 py-6 border-b flex items-center justify-between bg-slate-50">
                 <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">{selectedHistoryItem.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                       <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200">
                          {selectedHistoryItem.savedByPhoto ? <img src={selectedHistoryItem.savedByPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{selectedHistoryItem.savedByName?.[0]}</div>}
                       </div>
                       <span className="text-[10px] font-bold text-slate-500">Saved by <span className="text-slate-800">{selectedHistoryItem.savedByName}</span></span>
                       <span className="text-[10px] font-bold text-slate-400 mx-1">•</span>
                       <span className="text-[10px] font-bold text-slate-500">{new Date(selectedHistoryItem.createdAt).toLocaleString()}</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedHistoryItem(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X /></button>
              </div>
              
              <div className="px-8 py-4 bg-white border-b">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round(((selectedHistoryItem.stats?.pass || 0) / (selectedHistoryItem.stats?.total || 1)) * 100)}% PASS</span>
                 </div>
                 <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div style={{ width: `${((selectedHistoryItem.stats?.pass || 0)/(selectedHistoryItem.stats?.total || 1))*100}%` }} className="bg-emerald-500 transition-all h-full" />
                    <div style={{ width: `${((selectedHistoryItem.stats?.fail || 0)/(selectedHistoryItem.stats?.total || 1))*100}%` }} className="bg-rose-500 transition-all h-full" />
                    <div style={{ width: `${((selectedHistoryItem.stats?.pending || 0)/(selectedHistoryItem.stats?.total || 1))*100}%` }} className="bg-slate-300 transition-all h-full" />
                 </div>
                 <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mt-2">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> PASS ({selectedHistoryItem.stats?.pass || 0})</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"/> FAIL ({selectedHistoryItem.stats?.fail || 0})</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"/> PENDING ({selectedHistoryItem.stats?.pending || 0})</span>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-50">
                 <div className="bg-white rounded-3xl p-4 flex items-center justify-center border border-slate-100 shadow-sm"><img src={selectedHistoryItem.image} className="max-w-full rounded-xl shadow-md" /></div>
                 <div className="space-y-4">
                    {selectedHistoryItem.testObjects.map(obj => (
                       <div key={obj.id} className="p-4 border rounded-2xl flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center w-full">
                             <div>
                                <span className="text-[8px] font-black px-2 py-0.5 bg-slate-900 text-white rounded uppercase mb-1.5 inline-block">{obj.type}</span>
                                <p className="font-black text-sm text-slate-800">{obj.label}</p>
                             </div>
                             <button disabled={isProjectClosed} onClick={() => toggleHistoryObjStatus(obj.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm transition-all ${isProjectClosed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-90'} ${obj.status === 'PASS' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : obj.status === 'FAIL' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                {obj.status}
                             </button>
                          </div>
                          {obj.testCases && obj.testCases.length > 0 && (
                             <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                                {obj.testCases.map(tc => (
                                   <div key={tc.id} className="flex justify-between items-center">
                                      <span className="text-[10px] text-slate-500 font-bold">• {tc.label}</span>
                                      <div className="flex gap-1 shrink-0">
                                         <button disabled={isProjectClosed} onClick={() => toggleHistoryTCStatus(obj.id, tc.id, 'PASS')} className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${tc.status === 'PASS' ? 'text-white bg-emerald-500 shadow-sm' : `text-slate-400 bg-slate-100 ${isProjectClosed ? '' : 'hover:bg-emerald-50 hover:text-emerald-500'}`} ${isProjectClosed ? 'opacity-60 cursor-not-allowed' : ''}`}>PASS</button>
                                         <button disabled={isProjectClosed} onClick={() => toggleHistoryTCStatus(obj.id, tc.id, 'FAIL')} className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${tc.status === 'FAIL' ? 'text-white bg-rose-500 shadow-sm' : `text-slate-400 bg-slate-100 ${isProjectClosed ? '' : 'hover:bg-emerald-50 hover:text-emerald-500'}`} ${isProjectClosed ? 'opacity-60 cursor-not-allowed' : ''}`}>FAIL</button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
              </div>
              <div className="p-6 border-t bg-white flex justify-end gap-3 relative z-10">
                 <button onClick={() => setSelectedHistoryItem(null)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">{isProjectClosed ? 'CLOSE' : 'CANCEL'}</button>
                 {!isProjectClosed && (
                    <button onClick={saveHistoryChanges} className="px-8 py-4 bg-[#0066FF] text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-600 active:scale-95 transition-all">SAVE CHANGES & APPLY</button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* --- Main Workspace --- */}
      <div 
        ref={mainScrollRef}
        onScroll={handleScroll}
        className="flex-1 flex flex-col min-w-0 overflow-y-auto relative"
      >
        <div className="p-8 max-w-7xl mx-auto w-full">
          <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setAppState('projects')} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all"><ChevronLeft className="w-5 h-5 text-slate-400" /></button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black tracking-tight">{currentProjectData?.name || 'Loading...'}</h1>
                  {isProjectClosed && <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase tracking-widest border border-rose-200">CLOSED</span>}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Shared Environment
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* --- Close Project Button (Only for Creator) --- */}
              {!isProjectClosed && (currentProjectData?.createdBy === manualInfo.memberId || currentProjectData?.createdBy === user?.uid) && (
                <button onClick={() => setIsCloseProjectModalOpen(true)} className="px-5 py-3 bg-rose-50 text-rose-500 border border-rose-200 rounded-xl shadow-sm font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">CLOSE PROJECT</button>
              )}

              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                  className="w-11 h-11 rounded-full overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 hover:border-blue-300 transition-all"
                  title="사용자 정보"
                >
                  {currentUserPhoto ? <img src={currentUserPhoto} className="w-full h-full object-cover" alt="" /> : <span className="text-blue-600 font-black text-sm">{currentUserDisplayName?.[0]}</span>}
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 flex flex-col items-start cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => { setIsUserMenuOpen(false); navigateToProfile(); }}>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ID: {manualInfo.memberId}</span>
                      <span className="text-sm font-black tracking-tight text-slate-800 truncate w-full">{currentUserDisplayName}</span>
                      <p className="text-[9px] font-bold text-blue-500 mt-1 uppercase tracking-tighter">Edit Profile</p>
                    </div>
                    <button onClick={() => { setIsUserMenuOpen(false); handleLogout(); }} className="w-full px-4 py-3 flex items-center justify-between text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all text-xs font-black">
                      LOGOUT <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setIsHistoryOpen(true)} className="px-5 py-3 bg-[#001529] text-white rounded-xl shadow-lg font-black text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all">Archive</button>
              {!isProjectClosed && activeScan?.image && <button onClick={saveCurrentToHistory} disabled={!activeScan.title?.trim()} className="px-6 py-3 bg-emerald-500 text-white rounded-xl shadow-lg font-black text-xs uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-30">Save Report</button>}
            </div>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* --- Left Column: Viewfinder --- */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[450px]">
                <div className="p-6 border-b flex items-center justify-between bg-slate-50/50"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Viewfinder</span></div>
                <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/20 relative">
                  {!activeScan?.image ? (
                    <div onClick={() => !isProjectClosed && fileInputRef.current?.click()} className={`w-full h-full border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-6 transition-all p-8 ${isProjectClosed ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-white hover:border-[#0066FF] group'}`}>
                      <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-all"><Upload /></div>
                      <div className="text-center"><p className="font-black text-slate-800 uppercase tracking-tight">{isProjectClosed ? 'Project Closed' : 'Upload Screenshot'}</p><p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-widest leading-relaxed">{isProjectClosed ? '더 이상 스크린샷을 업로드할 수 없습니다' : '이미지를 업로드하면 실시간 분석을 시작합니다'}</p></div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isAnalyzing || isProjectClosed} />
                    </div>
                  ) : (
                    <div className="relative group w-full h-full flex items-center justify-center">
                      <img src={activeScan.image} className="max-w-full max-h-[600px] rounded-2xl shadow-2xl transition-all" />
                      
                      {/* --- Viewfinder Simple Scan Effect --- */}
                      {isAnalyzing && (
                         <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/80 shadow-[0_0_10px_white]" style={{ animation: 'smoothScan 2s ease-in-out infinite' }} />
                            <div className="px-6 py-3 bg-white/10 rounded-full backdrop-blur-md font-bold text-sm text-white shadow-sm flex items-center gap-3">
                               <Loader2 className="w-5 h-5 animate-spin" /> 분석 중...
                            </div>
                         </div>
                      )}
                      
                      {!isAnalyzing && !isProjectClosed && (
                         <button onClick={async () => { if (user) await updateDoc(getPublicDoc('projects', currentProjectId), { activeScan: null }); }} className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"><RefreshCcw className="w-5 h-5" /></button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- Right Column: Analysis Console --- */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 flex-1 flex flex-col overflow-hidden relative">
                
                <div className="p-6 border-b flex items-center justify-between bg-slate-50/50 relative z-10">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analysis Console</span>
                   {!isProjectClosed && (
                      <button onClick={() => setIsCompModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all uppercase tracking-widest">
                         <SettingsIcon className="w-3.5 h-3.5" /> Component Cases
                      </button>
                   )}
                </div>
                
                {/* --- Console Content --- */}
                <div 
                  ref={consoleScrollRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6 relative z-10"
                >
                  {activeScan?.image && !isAnalyzing && (
                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Screen Title</label>
                          <div className="relative w-full">
                            <input type="text" placeholder="예: 메인 화면 리스트" className="w-full pl-5 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-blue-500 transition-all disabled:opacity-50" 
                              value={scanMetaForm.title} 
                              onChange={(e) => setScanMetaForm({...scanMetaForm, title: e.target.value})}
                              onFocus={() => setIsMetaFocused(true)}
                              onBlur={() => { setIsMetaFocused(false); saveMetaFields(); }}
                              disabled={isProjectClosed}
                            />
                            <div className="absolute right-[2px] top-[2px] bottom-[2px] w-8 bg-gradient-to-l from-white to-transparent pointer-events-none rounded-r-[10px]"></div>
                          </div>
                        </div>
                        <div className="space-y-1.5 relative min-w-0">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                          <div className="flex items-center gap-2 min-w-0">
                            {/* --- Custom Category Dropdown --- */}
                            <div className="flex-1 relative min-w-0" ref={categoryDropdownRef}>
                                <button 
                                  onClick={() => !isProjectClosed && setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                  onFocus={() => setIsMetaFocused(true)}
                                  onBlur={() => setIsMetaFocused(false)}
                                  disabled={isProjectClosed}
                                  className={`w-full flex items-center justify-between px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none transition-all ${isCategoryDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : ''} disabled:opacity-50`}
                                >
                                  <div className="relative flex-1 min-w-0 flex items-center">
                                    <span className="block whitespace-nowrap overflow-hidden text-clip w-full text-left pr-4">{scanMetaForm.category}</span>
                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                                  </div>
                                  <ChevronDown className={`shrink-0 ml-2 w-4 h-4 text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isCategoryDropdownOpen && (
                                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                                    {appCategories.map(cat => (
                                      <button 
                                        key={cat} 
                                        onClick={() => {
                                          setScanMetaForm({...scanMetaForm, category: cat});
                                          setIsCategoryDropdownOpen(false);
                                          setTimeout(saveMetaFields, 0);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors hover:bg-blue-50 hover:text-blue-600 ${scanMetaForm.category === cat ? 'bg-blue-50 text-blue-600' : 'text-slate-600'} truncate`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                )}
                            </div>
                            <button onClick={() => setIsCatModalOpen(true)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors shrink-0" title="카테고리 관리"><SettingsIcon className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAnalyzing ? (
                    // --- Console Simple Animation ---
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2rem]">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                        <h3 className="text-lg font-black text-slate-700 tracking-tight mb-2">AI 분석 진행 중</h3>
                        <p className="text-xs text-slate-500 font-bold">화면의 UI 컴포넌트를 식별하고 있습니다...</p>
                    </div>
                  ) : testObjects.length === 0 ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center py-24 text-slate-200"><Layout className="w-20 h-20 mb-4 opacity-20" /><p className="font-black uppercase tracking-widest text-[10px]">No Data Captured</p></div>
                  ) : (
                    <div className="space-y-4 pb-12">
                      {/* --- Progress Bar --- */}
                      <div className="mb-6 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span>Overall Progress</span>
                          <span>{Math.round((testObjects.filter(o => o.status === 'PASS').length / testObjects.length) * 100) || 0}% PASS</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                          {(() => {
                            const total = testObjects.length;
                            const pass = testObjects.filter(o => o.status === 'PASS').length;
                            const fail = testObjects.filter(o => o.status === 'FAIL').length;
                            const pending = testObjects.filter(o => o.status === 'PENDING').length;
                            return (
                              <>
                                <div style={{ width: `${(pass/total)*100}%` }} className="bg-emerald-500 transition-all h-full" />
                                <div style={{ width: `${(fail/total)*100}%` }} className="bg-rose-500 transition-all h-full" />
                                <div style={{ width: `${(pending/total)*100}%` }} className="bg-slate-300 transition-all h-full" />
                              </>
                            )
                          })()}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> PASS ({testObjects.filter(o => o.status === 'PASS').length})</span>
                           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"/> FAIL ({testObjects.filter(o => o.status === 'FAIL').length})</span>
                           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"/> PENDING ({testObjects.filter(o => o.status === 'PENDING').length})</span>
                        </div>
                      </div>

                      {testObjects.map(obj => {
                        // --- Edit Mode Rendering ---
                        if (editingObjId === obj.id) {
                           return (
                             <div key={obj.id} className="p-5 rounded-[1.5rem] bg-blue-50 border border-blue-200 shadow-sm space-y-3">
                                <div className="flex gap-3">
                                   <select className="w-32 px-3 py-2 rounded-lg border border-blue-200 bg-white text-xs font-black outline-none" value={editObjForm.type} onChange={(e)=>setEditObjForm({...editObjForm, type: e.target.value})}>
                                      {objectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                   </select>
                                   <input type="text" placeholder="항목 이름" className="flex-1 px-4 py-2 rounded-lg border border-blue-200 bg-white text-sm font-black outline-none" value={editObjForm.label} onChange={(e)=>setEditObjForm({...editObjForm, label: e.target.value})} />
                                </div>
                                <input type="text" placeholder="위치 및 설명" className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-white text-xs font-bold text-slate-600 outline-none" value={editObjForm.description} onChange={(e)=>setEditObjForm({...editObjForm, description: e.target.value})} />
                                <div className="flex justify-end gap-2 pt-2">
                                   <button onClick={() => setEditingObjId(null)} className="px-4 py-2 rounded-lg bg-white text-slate-500 font-bold text-xs border border-slate-200">취소</button>
                                   <button onClick={saveEditedObject} className="px-4 py-2 rounded-lg bg-blue-500 text-white font-bold text-xs shadow-md hover:bg-blue-600 flex items-center gap-1"><Check className="w-3 h-3" /> 저장</button>
                                </div>
                             </div>
                           );
                        }

                        // --- Normal View Rendering with Accordion ---
                        return (
                          <div key={obj.id} className={`p-5 rounded-[1.5rem] border transition-all flex flex-col group ${obj.status === 'PASS' ? 'bg-emerald-50 border-emerald-100' : obj.status === 'FAIL' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200'}`}>
                             
                             <div className="flex items-center justify-between cursor-pointer w-full" onClick={() => setExpandedObjId(prev => prev === obj.id ? null : obj.id)}>
                                <div className="flex-1 min-w-0 pr-4">
                                   <div className="flex items-center gap-2 mb-1.5"><span className="text-[8px] font-black px-2 py-0.5 bg-slate-900 text-white rounded-md uppercase tracking-widest">{obj.type}</span><h3 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{obj.label}</h3></div>
                                   <p className="text-[10px] text-slate-400 font-bold italic line-clamp-1">{obj.description}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                   {!isProjectClosed && (
                                      <>
                                         <button onClick={() => { setEditingObjId(obj.id); setEditObjForm({ label: obj.label, description: obj.description, type: obj.type || (objectTypes[0] || 'Button') }); }} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 bg-white rounded-lg border border-slate-100 shadow-sm"><Edit2 className="w-3.5 h-3.5" /></button>
                                         <button onClick={() => deleteObject(obj.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 bg-white rounded-lg border border-slate-100 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                      </>
                                   )}
                                   <button disabled={isProjectClosed || (obj.testCases && obj.testCases.length > 0)} onClick={() => { 
                                      if (obj.testCases && obj.testCases.length > 0) {
                                         setExpandedObjId(prev => prev === obj.id ? null : obj.id);
                                      } else {
                                         toggleStatus(obj.id, obj.status); 
                                      }
                                   }} className={`w-24 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg transition-all ml-1 ${(isProjectClosed || (obj.testCases && obj.testCases.length > 0)) ? 'cursor-pointer' : 'active:scale-90'} ${obj.status === 'PASS' ? 'bg-emerald-500 text-white' : obj.status === 'FAIL' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}>
                                      {obj.status}
                                   </button>
                                   <button onClick={() => setExpandedObjId(prev => prev === obj.id ? null : obj.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-500 bg-white rounded-lg border border-slate-100 shadow-sm ml-1 transition-colors">
                                      {expandedObjId === obj.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                   </button>
                                </div>
                             </div>

                             {expandedObjId === obj.id && (
                                <div className="w-full mt-4 pt-4 border-t border-slate-200/60 space-y-2 cursor-default" onClick={e => e.stopPropagation()}>
                                    {obj.testCases && obj.testCases.length > 0 ? obj.testCases.map(tc => {
                                       if (editingTestCaseId === tc.id) {
                                          return (
                                             <div key={tc.id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100 shadow-sm gap-2">
                                                <input type="text" className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold outline-none" value={editingTestCaseLabel} onChange={(e) => setEditingTestCaseLabel(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && saveEditedTestCase(obj.id)} autoFocus />
                                                <div className="flex gap-1 shrink-0">
                                                   <button onClick={() => setEditingTestCaseId(null)} className="px-2 py-1.5 rounded-lg text-[9px] font-black uppercase bg-white text-slate-400 border border-slate-200 hover:bg-slate-50">취소</button>
                                                   <button onClick={() => saveEditedTestCase(obj.id)} className="px-2 py-1.5 rounded-lg text-[9px] font-black uppercase bg-blue-500 text-white shadow-md hover:bg-blue-600">저장</button>
                                                </div>
                                             </div>
                                          )
                                       }
                                       return (
                                       <div key={tc.id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100 shadow-sm group/tc">
                                          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                             <span className="text-xs font-bold text-slate-700 truncate">{tc.label}</span>
                                             {!isProjectClosed && (
                                                <div className="hidden group-hover/tc:flex items-center gap-1 shrink-0">
                                                   <button onClick={() => { setEditingTestCaseId(tc.id); setEditingTestCaseLabel(tc.label); }} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 className="w-3 h-3" /></button>
                                                   <button onClick={() => deleteTestCaseFromObject(obj.id, tc.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                             )}
                                          </div>
                                          <div className="flex gap-2 shrink-0">
                                             <button disabled={isProjectClosed} onClick={() => toggleTestCaseStatus(obj.id, tc.id, 'PASS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${tc.status === 'PASS' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-emerald-500 hover:text-emerald-500'} ${isProjectClosed ? 'opacity-50 cursor-not-allowed' : ''}`}>PASS</button>
                                             <button disabled={isProjectClosed} onClick={() => toggleTestCaseStatus(obj.id, tc.id, 'FAIL')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${tc.status === 'FAIL' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-rose-500 hover:text-rose-500'} ${isProjectClosed ? 'opacity-50 cursor-not-allowed' : ''}`}>FAIL</button>
                                          </div>
                                       </div>
                                    )}) : (
                                       <p className="text-xs text-slate-400 font-bold italic text-center py-2">등록된 하위 테스트 케이스가 없습니다.</p>
                                    )}

                                    {!isProjectClosed && (
                                       newTestCaseLabelObjId === obj.id ? (
                                          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-2 gap-2">
                                             <input type="text" placeholder="새 케이스 입력" className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold outline-none" value={newTestCaseLabel} onChange={(e) => setNewTestCaseLabel(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTestCaseToObject(obj.id)} autoFocus />
                                             <div className="flex gap-1 shrink-0">
                                                <button onClick={() => { setNewTestCaseLabelObjId(null); setNewTestCaseLabel(''); }} className="px-2 py-1.5 rounded-lg text-[9px] font-black uppercase bg-white text-slate-400 border border-slate-200 hover:bg-slate-50">취소</button>
                                                <button onClick={addTestCaseToObject(obj.id)} className="px-2 py-1.5 rounded-lg text-[9px] font-black uppercase bg-slate-800 text-white shadow-md hover:bg-slate-900">추가</button>
                                             </div>
                                          </div>
                                       ) : (
                                          <button onClick={() => { setNewTestCaseLabelObjId(obj.id); setNewTestCaseLabel(''); }} className="w-full mt-2 py-2 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 transition-colors text-[10px] font-black uppercase flex items-center justify-center gap-1">
                                             <Plus className="w-3 h-3" /> Add Test Case
                                          </button>
                                       )
                                    )}
                                </div>
                             )}

                          </div>
                        );
                      })}
                      
                      {/* --- Add New Object UI --- */}
                      {!isProjectClosed && (
                         isAddingObj ? (
                           <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-200 shadow-inner space-y-3 mt-8 relative">
                              <div className="absolute -top-3 left-4 bg-slate-800 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Add Item</div>
                              <div className="flex gap-3 pt-2">
                                 {/* --- Custom Type Dropdown for Adding --- */}
                                 <div className="w-32 relative" ref={addTypeDropdownRef}>
                                     <button 
                                       onClick={() => setIsAddTypeDropdownOpen(!isAddTypeDropdownOpen)}
                                       className={`w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none transition-all ${isAddTypeDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : ''}`}
                                     >
                                       <span className="truncate">{addObjForm.type}</span>
                                       <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAddTypeDropdownOpen ? 'rotate-180' : ''}`} />
                                     </button>
                                     
                                     {isAddTypeDropdownOpen && (
                                       <div className="absolute bottom-full left-0 w-48 mb-2 bg-white border border-slate-100 rounded-xl shadow-2xl py-2 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-60 overflow-y-auto">
                                         {objectTypes.map(t => (
                                           <button 
                                             key={t} 
                                             onClick={() => {
                                               setAddObjForm({...addObjForm, type: t});
                                               setIsAddTypeDropdownOpen(false);
                                             }}
                                             className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors hover:bg-blue-50 hover:text-blue-600 ${addObjForm.type === t ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                                           >
                                             {t}
                                           </button>
                                         ))}
                                       </div>
                                     )}
                                 </div>
                                 <input type="text" placeholder="새로운 항목 이름" className="flex-1 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-black outline-none focus:border-blue-500" value={addObjForm.label} onChange={(e)=>setAddObjForm({...addObjForm, label: e.target.value})} />
                              </div>
                              <input type="text" placeholder="위치 및 설명을 입력하세요" className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 outline-none focus:border-blue-500" value={addObjForm.description} onChange={(e)=>setAddObjForm({...addObjForm, description: e.target.value})} />
                              <div className="flex justify-end gap-2 pt-2">
                                 <button onClick={() => setIsAddingObj(false)} className="px-4 py-2 rounded-lg bg-white text-slate-500 font-bold text-xs border border-slate-200">취소</button>
                                 <button onClick={addNewObject} className="px-4 py-2 rounded-lg bg-[#001529] text-white font-bold text-xs shadow-md hover:bg-black">추가하기</button>
                              </div>
                           </div>
                         ) : (
                           <button onClick={() => setIsAddingObj(true)} className="w-full py-4 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 mt-4"><PlusCircle className="w-4 h-4" /> Add Test Object</button>
                         )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* --- Scroll to Top Button --- */}
        <div className={`fixed bottom-8 right-8 z-[150] transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          <button 
            onClick={scrollToTop}
            className="w-14 h-14 bg-white/95 backdrop-blur-md text-slate-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-[0_10px_30px_rgba(0,102,255,0.25)] hover:-translate-y-1 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 group"
          >
            <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[8px] font-black uppercase tracking-widest leading-none">Top</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
