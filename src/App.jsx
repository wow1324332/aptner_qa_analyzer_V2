import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Loader2, Layout, RefreshCcw, Building2, Plus, Trash2, X, Save, 
  ChevronRight, ChevronLeft, FolderOpen, FolderPlus, Layers, PlusCircle, 
  Sparkles, LogOut, Camera, Edit2, Check, Settings as SettingsIcon, 
  AlertOctagon, ChevronUp, ChevronDown, Folder, Download
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import { initializeFirestore, collection, doc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

// --- 환경 변수 로직 ---
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
const canvasAppId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '-') : 'default-app-id';
const apiKey = isCanvas ? "" : (getEnv('GEMINI') || "");

// 흰 화면 방지: Firebase 설정 파싱 중 에러 발생 시 앱 크래시 방지
let firebaseConfig;
try {
  firebaseConfig = isCanvas ? JSON.parse(__firebase_config) : {
    apiKey: getEnv('FB_API') || "dummy-key",
    authDomain: getEnv('FB_DOMAIN') || "dummy",
    projectId: getEnv('FB_PROJECT') || "dummy",
    storageBucket: getEnv('FB_BUCKET') || "dummy",
    messagingSenderId: getEnv('FB_SENDER') || "dummy",
    appId: getEnv('FB_APP_ID') || "dummy"
  };
} catch (e) {
  firebaseConfig = { apiKey: "error" };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

const getPublicCollection = (colName) => 
  isCanvas ? collection(db, 'artifacts', canvasAppId, 'public', 'data', colName) : collection(db, colName);
const getPublicDoc = (colName, docId) => 
  isCanvas ? doc(db, 'artifacts', canvasAppId, 'public', 'data', colName, docId) : doc(db, colName, docId);

// --- CSS 시네마틱 효과 ---
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
  animation: screenDissolveToLeft 1.2s cubic-bezier(0.3, 0, 0.2, 1) forwards, maskWipeLeft 1.2s cubic-bezier(0.3, 0, 0.2, 1) forwards;
}
@keyframes cinematicRevealLeft {
  0% { transform: translateX(15vw) scale(1.05); opacity: 0; filter: blur(20px) saturate(0); }
  100% { transform: translateX(0) scale(1); opacity: 1; filter: blur(0px) saturate(1); }
}
.anim-cinematic-enter {
  animation: cinematicRevealLeft 1.4s cubic-bezier(0.16, 1, 0.2, 1) forwards;
}
@keyframes cinematicHeartbeat {
  0%, 100% { box-shadow: 0 0 0 1px rgba(0, 102, 255, 0.4), 0 0 20px rgba(0, 102, 255, 0.3), inset 0 0 15px rgba(0, 102, 255, 0.1); border-color: rgba(0, 102, 255, 0.6); }
  50% { box-shadow: 0 0 0 3px rgba(50, 150, 255, 1), 0 0 45px rgba(0, 102, 255, 0.9), inset 0 0 35px rgba(0, 102, 255, 0.5); border-color: rgba(100, 200, 255, 1); }
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
::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
* { -ms-overflow-style: none !important; scrollbar-width: none !important; }
.scrollbar-hide::-webkit-scrollbar { display: none !important; }
.scrollbar-hide { -ms-overflow-style: none !important; scrollbar-width: none !important; }
`;

const App = () => {
  // --- States ---
  const [appState, setAppState] = useState('intro');
  const [prevAppState, setPrevAppState] = useState(null);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [introProgress, setIntroProgress] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);

  const [authMode, setAuthMode] = useState('login');
  const [memberId, setMemberId] = useState('');
  const [memberPw, setMemberPw] = useState('');
  const [memberName, setMemberName] = useState('');
  const [manualInfo, setManualInfo] = useState({ displayName: '', photoURL: '', memberId: null });

  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectData, setCurrentProjectData] = useState(null);
  const [history, setHistory] = useState([]);
  
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
  
  const [appCategories, setAppCategories] = useState(['미분류', '홈화면', '결제', '등록', '커뮤니티']);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [departments, setDepartments] = useState([{ id: 'default', name: '공통 사업부', order: 0 }]);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [draggedDeptId, setDraggedDeptId] = useState(null);
  const [dragOverDeptId, setDragOverDeptId] = useState(null);
  const [adminErrorMsg, setAdminErrorMsg] = useState('');

  const [appComponents, setAppComponents] = useState([]);
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingCompType, setEditingCompType] = useState(null);
  const [newCompType, setNewCompType] = useState('');
  const [newTestCase, setNewTestCase] = useState('');
  const [expandedObjId, setExpandedObjId] = useState(null);

  // 흰 화면 방지: appComponents가 없을 때를 대비한 안전망
  const objectTypes = (appComponents || []).length > 0 ? appComponents.map(c => c.type) : ['Button', 'Input', 'Select', 'Checkbox', 'Toggle', 'Tab', 'Text', 'Image', 'Icon', 'Container'];

  const [longPressedProject, setLongPressedProject] = useState(null);
  const [isEditProjectName, setIsEditProjectName] = useState(false);
  const [editProjectNameVal, setEditProjectNameVal] = useState('');
  const [showActionsProjId, setShowActionsProjId] = useState(null);
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [dragOverProjectId, setDragOverProjectId] = useState(null);
  const longPressTimerRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);

  const [scanMetaForm, setScanMetaForm] = useState({ title: '', category: '미분류' });
  const [isMetaFocused, setIsMetaFocused] = useState(false);

  const [editingObjId, setEditingObjId] = useState(null);
  const [editObjForm, setEditObjForm] = useState({ label: '', description: '', type: 'Button' });
  const [isAddingObj, setIsAddingObj] = useState(false);
  const [addObjForm, setAddObjForm] = useState({ label: '', description: '', type: 'Button' });

  const [editingTestCaseId, setEditingTestCaseId] = useState(null);
  const [editingTestCaseLabel, setEditingTestCaseLabel] = useState('');
  const [newTestCaseLabelObjId, setNewTestCaseLabelObjId] = useState(null);
  const [newTestCaseLabel, setNewTestCaseLabel] = useState('');

  const [showActionsHistoryId, setShowActionsHistoryId] = useState(null);
  const [draggedHistoryId, setDraggedHistoryId] = useState(null);
  const [dragOverHistoryId, setDragOverHistoryId] = useState(null);
  const historyLongPressTimerRef = useRef(null);
  const isHistoryLongPressTriggeredRef = useRef(false);

  const [showActionsGroupCat, setShowActionsGroupCat] = useState(null);
  const [draggedGroupCat, setDraggedGroupCat] = useState(null);
  const [dragOverGroupCat, setDragOverGroupCat] = useState(null);
  const groupLongPressTimerRef = useRef(null);
  const isGroupLongPressTriggeredRef = useRef(false);

  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editGroupOldName, setEditGroupOldName] = useState('');
  const [editGroupNewName, setEditGroupNewName] = useState('');
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState(null);
  const [isCloseProjectModalOpen, setIsCloseProjectModalOpen] = useState(false);

  const [isLandingExiting, setIsLandingExiting] = useState(false);
  const [isAuthorizedEntering, setIsAuthorizedEntering] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scanAbortController, setScanAbortController] = useState(null);
  const [scanConditions, setScanConditions] = useState('');
  
  // PWA 설치 관련 State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  
  const mainScrollRef = useRef(null);
  const consoleScrollRef = useRef(null);

  const handleScroll = () => {
    const mainTop = mainScrollRef.current?.scrollTop || 0;
    const winTop = window.scrollY || document.documentElement.scrollTop || 0;
    setShowScrollTop(mainTop > 10 || winTop > 10);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const scrollToTop = () => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- PWA Install Logic ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // 기본 브라우저 설치 프롬프트 표시 방지
      e.preventDefault();
      // 이벤트 보관
      setDeferredPrompt(e);
      // 설치 가능 상태로 업데이트
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA app installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setLoginErrorMsg("Vercel 배포 및 PWA(manifest) 설정 후 실제 환경에서 설치가 활성화됩니다.");
      setTimeout(() => setLoginErrorMsg(''), 4000);
      return;
    }
    
    // 보관해둔 프롬프트 띄우기
    deferredPrompt.prompt();
    
    // 사용자의 선택 결과 대기
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation prompt choice: ${outcome}`);
    
    // 프롬프트는 한 번만 사용할 수 있으므로 상태 초기화
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // --- Auth Initialization ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isCanvas && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.warn(err); } finally { setIsAuthReady(true); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- External Clicks ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) setIsCategoryDropdownOpen(false);
      if (addTypeDropdownRef.current && !addTypeDropdownRef.current.contains(event.target)) setIsAddTypeDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Realtime Sync ---
  useEffect(() => {
    if (!isAuthReady || !user) return;
    const presenceRef = getPublicDoc('presence', user.uid);
    const updatePresence = async () => {
      try {
        await setDoc(presenceRef, { 
          lastSeen: Date.now(), uid: user.uid, email: manualInfo.memberId || "Guest",
          displayName: manualInfo.displayName || "GUEST", photoURL: manualInfo.photoURL || null,
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
        snapshot.forEach(doc => { if (Date.now() - doc.data().lastSeen < 300000) usersList.push(doc.data()); });
        setActiveUsers(list => JSON.stringify(list) === JSON.stringify(usersList) ? list : usersList);
      });
      return () => { clearInterval(interval); unsubPresence(); deleteDoc(presenceRef).catch(()=>{}); };
    }
  }, [isAuthReady, user, currentProjectId, appState, manualInfo]);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    const catRef = getPublicDoc('settings', 'categories');
    const unsubCat = onSnapshot(catRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().list) setAppCategories(docSnap.data().list);
      else setDoc(catRef, { list: ['미분류', '홈화면', '결제', '등록', '커뮤니티'] });
    });
    const compRef = getPublicDoc('settings', 'components');
    const unsubComp = onSnapshot(compRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().list) setAppComponents(docSnap.data().list);
      else setDoc(compRef, { list: [
        { type: 'Button', cases: ['클릭 이벤트 정상 동작 확인', '비활성화 상태 스타일 확인'] },
        { type: 'Input', cases: ['키보드 입력 정상 확인', '포커스 아웃 시 데이터 유지 확인'] },
        { type: 'Image', cases: ['이미지 정상 노출 확인', '이미지 비율 찌그러짐 확인'] },
        { type: 'Icon', cases: ['아이콘 선명도 확인', '클릭 영역 적절성 확인'] },
        { type: 'Text', cases: ['텍스트 잘림 현상 확인', '오탈자 확인'] }
      ]});
    });

    const deptRef = getPublicDoc('settings', 'departments');
    const unsubDept = onSnapshot(deptRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().list) setDepartments(docSnap.data().list.sort((a, b) => a.order - b.order));
      else setDoc(deptRef, { list: [{ id: 'default', name: '공통 사업부', order: 0 }] });
    });

    return () => { unsubCat(); unsubComp(); unsubDept(); };
  }, [isAuthReady, user]);

  useEffect(() => {
    if (!isAuthReady || !user || appState === 'intro' || appState === 'login') return;
    const unsubProjects = onSnapshot(getPublicCollection('projects'), (snapshot) => {
      const projList = [];
      snapshot.forEach(doc => projList.push({ id: doc.id, ...doc.data() }));
      setProjects(projList.sort((a, b) => (b.order || b.createdAt) - (a.order || a.createdAt)));
    });
    const unsubHistory = onSnapshot(getPublicCollection('history'), (snapshot) => {
      const histList = [];
      snapshot.forEach(doc => histList.push({ id: doc.id, ...doc.data() }));
      setHistory(histList.sort((a, b) => (b.order || b.createdAt) - (a.order || a.createdAt)));
    });
    return () => { unsubProjects(); unsubHistory(); };
  }, [isAuthReady, user, appState]);

  useEffect(() => {
    if (!isAuthReady || !user || !currentProjectId) return;
    const unsubProject = onSnapshot(getPublicDoc('projects', currentProjectId), (docSnap) => {
      if (docSnap.exists()) setCurrentProjectData(docSnap.data());
      else { setCurrentProjectData(null); setAppState('projects'); }
    });
    return () => unsubProject();
  }, [isAuthReady, user, currentProjectId]);

  useEffect(() => {
    const activeScan = currentProjectData?.activeScan;
    if (!isMetaFocused && activeScan) {
      setScanMetaForm({ title: activeScan.title || '', category: activeScan.category || (appCategories[0] || '미분류') });
    }
  }, [currentProjectData?.activeScan?.title, currentProjectData?.activeScan?.category, isMetaFocused, appCategories]);

  useEffect(() => {
    if (appState === 'intro') {
      const interval = setInterval(() => {
        setIntroProgress(prev => {
          if (prev >= 100) { clearInterval(interval); setTimeout(() => setAppState('login'), 800); return 100; }
          return prev + 2.5;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [appState]);

  // --- Action Handlers ---
  const handleCustomRegister = async () => {
    const safeId = memberId.trim();
    if (!safeId || !memberPw || !memberName) { setLoginErrorMsg("모든 필드를 입력해주세요."); return; }
    if (safeId.includes('/')) { setLoginErrorMsg("사용 불가한 문자가 포함되어 있습니다."); return; }
    setIsLoggingIn(true); setLoginErrorMsg('');
    try {
      const memberRef = getPublicDoc('members', safeId);
      if ((await getDoc(memberRef)).exists()) { setLoginErrorMsg("이미 사용 중인 접속 ID입니다."); setIsLoggingIn(false); return; }
      await setDoc(memberRef, { id: safeId, password: memberPw, displayName: memberName, photoURL: '', createdAt: Date.now() });
      setManualInfo({ displayName: memberName, photoURL: '', memberId: safeId });
      setAppState('manualProfile');
    } catch (e) { setLoginErrorMsg("가입 중 오류가 발생했습니다."); } finally { setIsLoggingIn(false); }
  };

  const handleCustomLogin = async () => {
    const safeId = memberId.trim();
    if (!safeId || !memberPw) { setLoginErrorMsg("접속 ID와 비밀번호를 입력해주세요."); return; }
    setIsLoggingIn(true); setLoginErrorMsg('');
    try {
      const snap = await getDoc(getPublicDoc('members', safeId));
      if (!snap.exists() || snap.data().password !== memberPw) { setLoginErrorMsg("ID나 비밀번호가 틀립니다."); setIsLoggingIn(false); return; }
      setManualInfo({ displayName: snap.data().displayName, photoURL: snap.data().photoURL, memberId: safeId });
      setAppState('departmentSelect');
    } catch (e) { setLoginErrorMsg("로그인 중 오류가 발생했습니다."); } finally { setIsLoggingIn(false); }
  };

  const handleLogout = async () => {
    setAppState('login'); setManualInfo({ displayName: '', photoURL: '', memberId: null });
    setMemberId(''); setMemberPw(''); setMemberName(''); setLoginErrorMsg('');
    setCurrentDepartment(null);
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height, MAX = 150;
          if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          setManualInfo({...manualInfo, photoURL: canvas.toDataURL('image/jpeg', 0.8)});
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const navigateToProfile = () => { setPrevAppState(appState); setAppState('manualProfile'); };

  const createNewProject = async () => {
    if (!newProjectName.trim() || !user) return;
    const pid = `proj_${Date.now()}`;
    await setDoc(getPublicDoc('projects', pid), {
      name: newProjectName.trim(), createdAt: Date.now(), order: Date.now(),
      createdBy: manualInfo.memberId || user.uid, createdByName: manualInfo.displayName || "GUEST", createdByPhoto: manualInfo.photoURL || null,
      isAnalyzing: false, status: 'READY', activeScan: null,
      departmentId: currentDepartment?.id || 'default'
    });
    setNewProjectName(''); setIsNewProjectModalOpen(false); setCurrentProjectId(pid);
    setAppState('projectLanding'); setIsLandingExiting(false); setIsAuthorizedEntering(false);
    setTimeout(() => {
      setIsLandingExiting(true);
      setTimeout(() => { setAppState('authorized'); setIsLandingExiting(false); setIsAuthorizedEntering(true); setTimeout(() => setIsAuthorizedEntering(false), 1200); }, 1200);
    }, 2800);
  };

  // --- Project Action Handlers ---
  const handlePressStart = (id) => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => { isLongPressTriggeredRef.current = true; setShowActionsProjId(id); }, 600);
  };
  const handlePressEnd = () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };
  const handleProjectClick = (id) => {
    if (!isLongPressTriggeredRef.current) { if (showActionsProjId) { setShowActionsProjId(null); return; } setCurrentProjectId(id); setAppState('authorized'); }
    setTimeout(() => { isLongPressTriggeredRef.current = false; }, 100);
  };
  const handleDragStart = (e, id) => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); setDraggedProjectId(id); };
  const handleDragOver = (e, id) => { e.preventDefault(); setDragOverProjectId(id); };
  const handleDragEnd = () => { setDraggedProjectId(null); setDragOverProjectId(null); };
  const handleDrop = async (e, targetId) => {
    e.preventDefault(); setDragOverProjectId(null);
    if (!draggedProjectId || draggedProjectId === targetId) return;
    const newProjs = [...projects];
    const from = newProjs.findIndex(p => p.id === draggedProjectId);
    const to = newProjs.findIndex(p => p.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = newProjs.splice(from, 1);
    newProjs.splice(to, 0, moved);
    newProjs.forEach((p, i) => updateDoc(getPublicDoc('projects', p.id), { order: Date.now() - i * 1000 }));
    setDraggedProjectId(null);
  };
  const renameProject = async () => {
    if (!longPressedProject || !editProjectNameVal.trim()) return;
    await updateDoc(getPublicDoc('projects', longPressedProject.id), { name: editProjectNameVal.trim() });
    setIsEditProjectName(false); setLongPressedProject(null);
  };

  const handleDeptDragStart = (e, id) => setDraggedDeptId(id);
  const handleDeptDragOver = (e, id) => { e.preventDefault(); setDragOverDeptId(id); };
  const handleDeptDrop = async (e, targetId) => {
    e.preventDefault(); setDragOverDeptId(null);
    if (!draggedDeptId || draggedDeptId === targetId) return;
    const newList = [...departments];
    const fromIdx = newList.findIndex(d => d.id === draggedDeptId);
    const toIdx = newList.findIndex(d => d.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, moved);
    const updatedList = newList.map((d, i) => ({ ...d, order: i }));
    await updateDoc(getPublicDoc('settings', 'departments'), { list: updatedList });
    setDraggedDeptId(null);
  };
  const addDepartment = async () => {
    if (!newDeptName.trim() || !user) return;
    const newDept = { id: `dept_${Date.now()}`, name: newDeptName.trim(), order: departments.length };
    await updateDoc(getPublicDoc('settings', 'departments'), { list: [...departments, newDept] });
    setNewDeptName(''); setAdminErrorMsg('');
  };
  const deleteDepartment = async (id) => {
    if (departments.length <= 1) { setAdminErrorMsg('최소 1개의 사업부는 유지해야 합니다.'); return; }
    const updatedList = departments.filter(d => d.id !== id).map((d, i) => ({ ...d, order: i }));
    await updateDoc(getPublicDoc('settings', 'departments'), { list: updatedList });
    setAdminErrorMsg('');
  };

  const isProjectClosed = currentProjectData?.status === 'CLOSED';

  const handleScanButtonClick = () => {
    if (isAnalyzing) {
       if (scanAbortController) {
          scanAbortController.abort();
          setScanAbortController(null);
       }
       updateDoc(getPublicDoc('projects', currentProjectId), { isAnalyzing: false });
    } else {
       if (activeScan?.base64Image && activeScan?.image) {
          analyzeScreenshot(activeScan.base64Image, activeScan.image);
       }
    }
  };

  // --- API Analysis Logic (빌드 에러 및 흰화면 완벽 대응) ---
  const analyzeScreenshot = async (base64Data, imageSrc) => {
    if (!base64Data || !currentProjectId || !user || isProjectClosed) return;
    const projectRef = getPublicDoc('projects', currentProjectId);
    
    const currentScan = currentProjectData?.activeScan || {};
    await updateDoc(projectRef, {
      isAnalyzing: true, status: 'IN PROGRESS',
      activeScan: { ...currentScan, image: imageSrc, base64Image: base64Data, testObjects: [] }
    });

    const abortController = new AbortController();
    setScanAbortController(abortController);

    const dynamicTypes = objectTypes.join(' | ');
    const systemPrompt = `당신은 모바일 앱 QA 테스트 전문가입니다. 스크린샷을 분석하여 UI 오브젝트를 식별하십시오. 결과는 반드시 JSON 형식으로만 응답하십시오: { "objects": [ { "id": "unique_id", "type": "${dynamicTypes}", "label": "오브젝트 이름", "description": "위치 설명" } ] }`;
    
    const baseText = "이 앱 스크린샷에서 테스트 가능한 모든 UI 요소를 찾아 리스트로 정리해줘.";
    const conditionText = scanConditions.trim() ? `\n다음 추가 조건 및 지시사항을 반드시 엄격하게 준수할 것: ${scanConditions}` : "";
    const combinedText = baseText + conditionText;

    const payload = {
      contents: [{ role: "user", parts: [{ text: combinedText }, { inlineData: { mimeType: "image/png", data: base64Data } }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: "application/json" }
    };

    const callApi = async (attempt = 0) => {
      try {
        const aiModel = isCanvas ? 'gemini-2.5-flash-preview-09-2025' : 'gemini-2.5-flash';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload),
          signal: abortController.signal
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || "API 통신 실패");
        }
        const data = await response.json();
        
        // 정규식 오류 회피
        const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const bt = String.fromCharCode(96, 96, 96);
        const cleanText = textResult.split(bt + 'json').join('').split(bt).join('').trim();
        const parsed = JSON.parse(cleanText);
        
        const componentMap = (appComponents || []).reduce((acc, curr) => { acc[curr.type] = curr.cases; return acc; }, {});
        return (parsed.objects || []).map(obj => {
           const typeCases = componentMap[obj.type] || [];
           const tcArray = typeCases.map((c, i) => ({ id: `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`, label: c, status: 'PENDING' }));
           return { ...obj, id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, status: 'PENDING', testCases: tcArray };
        });
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        if (attempt < 2 && !err.message.includes('API key')) { 
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000)); return callApi(attempt + 1); 
        }
        throw err;
      }
    };

    try {
      const results = await callApi();
      await updateDoc(projectRef, { 'activeScan.testObjects': results, isAnalyzing: false });
    } catch (err) {
      if (err.name === 'AbortError') {
         await updateDoc(projectRef, { isAnalyzing: false });
      } else {
         await updateDoc(projectRef, { isAnalyzing: false, 'activeScan.title': '⚠️ 분석 실패', 'activeScan.description': '원인: ' + err.message });
      }
    } finally {
      setScanAbortController(null);
    }
  };

  const handleFileChange = (e) => {
    if (isProjectClosed) return;
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result.split(',')[1];
        const imageSrc = event.target.result;
        setScanConditions('');
        const newScan = currentProjectData?.activeScan ? {
          ...currentProjectData.activeScan,
          image: imageSrc,
          base64Image: base64Data,
          testObjects: []
        } : {
          title: '', description: '', category: appCategories[0] || '미분류',
          image: imageSrc, base64Image: base64Data, testObjects: []
        };
        
        await updateDoc(getPublicDoc('projects', currentProjectId), {
          activeScan: newScan,
          isAnalyzing: false
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveMetaFields = async () => {
    if (!currentProjectId || !user || isProjectClosed) return;
    await updateDoc(getPublicDoc('projects', currentProjectId), { 'activeScan.title': scanMetaForm.title, 'activeScan.category': scanMetaForm.category });
  };

  const toggleStatus = async (id, currentStatus) => {
    if (isProjectClosed) return;
    const testObjects = currentProjectData?.activeScan?.testObjects || [];
    const nextStatus = currentStatus === 'PENDING' ? 'PASS' : (currentStatus === 'PASS' ? 'FAIL' : 'PENDING');
    const updatedObjects = testObjects.map(obj => obj.id === id ? { ...obj, status: nextStatus } : obj);
    await updateDoc(getPublicDoc('projects', currentProjectId), { 'activeScan.testObjects': updatedObjects });
  };

  const toggleTestCaseStatus = async (objId, tcId, newStatus) => {
    if (isProjectClosed) return;
    const testObjects = currentProjectData?.activeScan?.testObjects || [];
    const updatedObjects = testObjects.map(obj => {
      if (obj.id === objId) {
         const updatedCases = (obj.testCases || []).map(tc => tc.id === tcId ? { ...tc, status: newStatus } : tc);
         const isFail = updatedCases.some(tc => tc.status === 'FAIL');
         const isPending = updatedCases.some(tc => tc.status === 'PENDING');
         let parentStatus = 'PENDING';
         if (isFail) parentStatus = 'FAIL'; else if (!isPending && updatedCases.length > 0) parentStatus = 'PASS';
         return { ...obj, testCases: updatedCases, status: parentStatus };
      }
      return obj;
    });
    await updateDoc(getPublicDoc('projects', currentProjectId), { 'activeScan.testObjects': updatedObjects });
  };

  const deleteObject = async (id) => {
    if (isProjectClosed) return;
    const testObjects = currentProjectData?.activeScan?.testObjects || [];
    const updatedObjects = testObjects.filter(obj => obj.id !== id);
    await updateDoc(getPublicDoc('projects', currentProjectId), { 'activeScan.testObjects': updatedObjects });
  };

  const saveEditedObject = async () => {
    if (isProjectClosed || !editObjForm.label.trim()) return;
    const componentMap = (appComponents || []).reduce((acc, curr) => { acc[curr.type] = curr.cases; return acc; }, {});
    const testObjects = currentProjectData?.activeScan?.testObjects || [];
    const updatedObjects = testObjects.map(obj => {
      if (obj.id === editingObjId) {
         let newTestCases = obj.testCases || [];
         let parentStatus = obj.status;
         if (obj.type !== editObjForm.type) {
             const typeCases = componentMap[editObjForm.type] || [];
             newTestCases = typeCases.map((c, i) => ({ id: `tc_${Date.now()}_${i}`, label: c, status: 'PENDING' }));
             parentStatus = 'PENDING';
         }
         return { ...obj, ...editObjForm, testCases: newTestCases, status: parentStatus };
      }
      return obj;
    });
    await updateDoc(getPublicDoc('projects', currentProjectId), { 'activeScan.testObjects': updatedObjects });
    setEditingObjId(null);
  };

  const addNewObject = async () => {
    if (isProjectClosed || !addObjForm.label.trim()) return;
    const componentMap = (appComponents || []).reduce((acc, curr) => { acc[curr.type] = curr.cases; return acc; }, {});
    const typeCases = componentMap[addObjForm.type] || [];
    const tcArray = typeCases.map((c, i) => ({ id: `tc_${Date.now()}_${i}`, label: c, status: 'PENDING' }));
    const newObj = { ...addObjForm, id: `manual_${Date.now()}`, status: 'PENDING', testCases: tcArray };
    const testObjects = currentProjectData?.activeScan?.testObjects || [];
    await updateDoc(getPublicDoc('projects', currentProjectId), { 'activeScan.testObjects': [...testObjects, newObj] });
    setIsAddingObj(false); setAddObjForm({ label: '', description: '', type: objectTypes[0] || 'Button' });
  };

  const addTestCaseToObject = async (objId) => {
    if (isProjectClosed || !newTestCaseLabel.trim()) return;
    const testObjects = currentProjectData?.activeScan?.testObjects || [];
    const updatedObjects = testObjects.map(obj => {
      if (obj.id === objId) {
        const newCase = { id: `tc_${Date.now()}`, label: newTestCaseLabel.trim(), status: 'PENDING' };
        const updatedCases = [...(obj.testCases || []), newCase];
        const isFail = updatedCases.some(tc => tc.status === 'FAIL');
        const isPending = updatedCases.some(tc => tc.status === 'PENDING');
        let parentStatus = 'PENDING';
        if (isFail) parentStatus = 'FAIL'; else if (!isPending && updatedCases.length > 0) parentStatus = 'PASS';
        return { ...obj, testCases: updatedCases, status: parentStatus };
      }
      return obj;
    });
    await updateDoc(getPublicDoc('projects', currentProjectId), { 'activeScan.testObjects': updatedObjects });
    setNewTestCaseLabel(''); setNewTestCaseLabelObjId(null);
  };

  const saveEditedTestCase = async (objId) => {
    if (isProjectClosed || !editingTestCaseLabel.trim()) return;
    const testObjects = currentProjectData?.activeScan?.testObjects || [];
    const updatedObjects = testObjects.map(obj => {
      if (obj.id === objId) {
        const updatedCases = (obj.testCases || []).map(tc => tc.id === editingTestCaseId ? { ...tc, label: editingTestCaseLabel.trim() } : tc);
        return { ...obj, testCases: updatedCases };
      }
      return obj;
    });
    await updateDoc(getPublicDoc('projects', currentProjectId), { 'activeScan.testObjects': updatedObjects });
    setEditingTestCaseId(null);
  };

  const deleteTestCaseFromObject = async (objId, tcId) => {
    if (isProjectClosed) return;
    const testObjects = currentProjectData?.activeScan?.testObjects || [];
    const updatedObjects = testObjects.map(obj => {
      if (obj.id === objId) {
        const updatedCases = (obj.testCases || []).filter(tc => tc.id !== tcId);
        const isFail = updatedCases.some(tc => tc.status === 'FAIL');
        const isPending = updatedCases.some(tc => tc.status === 'PENDING');
        let parentStatus = 'PENDING';
        if (isFail) parentStatus = 'FAIL'; else if (!isPending && updatedCases.length > 0) parentStatus = 'PASS';
        return { ...obj, testCases: updatedCases, status: parentStatus };
      }
      return obj;
    });
    await updateDoc(getPublicDoc('projects', currentProjectId), { 'activeScan.testObjects': updatedObjects });
  };

  const saveCurrentToHistory = async () => {
    const scan = currentProjectData?.activeScan;
    if (!scan || !scan.image || isProjectClosed) return;
    setIsSavingReport(true);
    try {
      const testObjects = scan.testObjects || [];
      const stats = {
        total: testObjects.length,
        pass: testObjects.filter(o => o.status === 'PASS').length,
        fail: testObjects.filter(o => o.status === 'FAIL').length,
        pending: testObjects.filter(o => o.status === 'PENDING').length
      };
      await addDoc(getPublicCollection('history'), {
        projectId: currentProjectId, createdAt: Date.now(), order: Date.now(), timestamp: new Date().toLocaleString(),
        title: scanMetaForm.title || scan.title || "제목 없는 리포트", description: scan.description || "설명이 없습니다.",
        category: scanMetaForm.category || scan.category || appCategories[0] || '미분류', image: scan.image, base64Image: scan.base64Image,
        testObjects: [...testObjects], stats, savedBy: manualInfo.memberId || user.uid, savedByName: manualInfo.displayName || "GUEST", savedByPhoto: manualInfo.photoURL || null
      });
      await updateDoc(getPublicDoc('projects', currentProjectId), { activeScan: null });
      setIsHistoryOpen(true);
    } catch (e) {} finally { setIsSavingReport(false); }
  };

  const handleCloseProject = async () => {
    if (!currentProjectId || !user) return;
    await updateDoc(getPublicDoc('projects', currentProjectId), { status: 'CLOSED' });
    setIsCloseProjectModalOpen(false);
  };

  // --- History Logic ---
  const handleHistoryPressStart = (id) => {
    isHistoryLongPressTriggeredRef.current = false;
    historyLongPressTimerRef.current = setTimeout(() => { isHistoryLongPressTriggeredRef.current = true; setShowActionsHistoryId(id); }, 600);
  };
  const handleHistoryPressEnd = () => { if (historyLongPressTimerRef.current) clearTimeout(historyLongPressTimerRef.current); };
  const handleHistoryClick = (item) => {
    if (!isHistoryLongPressTriggeredRef.current) { if (showActionsHistoryId) { setShowActionsHistoryId(null); return; } setSelectedHistoryItem(item); }
    setTimeout(() => { isHistoryLongPressTriggeredRef.current = false; }, 100);
  };
  const handleHistoryDragStart = (e, id) => { setDraggedHistoryId(id); };
  const handleHistoryDragOver = (e, id) => { e.preventDefault(); setDragOverHistoryId(id); };
  const handleHistoryDragEnd = () => { setDraggedHistoryId(null); setDragOverHistoryId(null); };
  const handleHistoryDrop = async (e, targetId) => {
    e.preventDefault(); setDragOverHistoryId(null);
    if (!draggedHistoryId || draggedHistoryId === targetId) return;
    const folderHistories = groupedHistory[selectedFolder] || [];
    const fromIdx = folderHistories.findIndex(h => h.id === draggedHistoryId);
    const toIdx = folderHistories.findIndex(h => h.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newFolderHistories = [...folderHistories];
    const [draggedItem] = newFolderHistories.splice(fromIdx, 1);
    newFolderHistories.splice(toIdx, 0, draggedItem);
    const baseTime = Date.now();
    newFolderHistories.forEach((item, idx) => { updateDoc(getPublicDoc('history', item.id), { order: baseTime - idx * 1000 }); });
    setDraggedHistoryId(null);
  };

  const toggleHistoryObjStatus = (objId) => {
     if (!selectedHistoryItem || isProjectClosed) return;
     const updatedObjects = (selectedHistoryItem.testObjects || []).map(obj => {
        if (obj.id === objId) {
           const nextStatus = obj.status === 'PENDING' ? 'PASS' : (obj.status === 'PASS' ? 'FAIL' : 'PENDING');
           return { ...obj, status: nextStatus };
        }
        return obj;
     });
     const stats = { total: updatedObjects.length, pass: updatedObjects.filter(o => o.status === 'PASS').length, fail: updatedObjects.filter(o => o.status === 'FAIL').length, pending: updatedObjects.filter(o => o.status === 'PENDING').length };
     setSelectedHistoryItem({ ...selectedHistoryItem, testObjects: updatedObjects, stats });
  };
  const toggleHistoryTCStatus = (objId, tcId, newStatus) => {
     if (!selectedHistoryItem || isProjectClosed) return;
     const updatedObjects = (selectedHistoryItem.testObjects || []).map(obj => {
        if (obj.id === objId) {
           const updatedCases = (obj.testCases || []).map(tc => tc.id === tcId ? { ...tc, status: newStatus } : tc);
           const isFail = updatedCases.some(tc => tc.status === 'FAIL');
           const isPending = updatedCases.some(tc => tc.status === 'PENDING');
           return { ...obj, testCases: updatedCases, status: isFail ? 'FAIL' : (isPending ? 'PENDING' : 'PASS') };
        }
        return obj;
     });
     const stats = { total: updatedObjects.length, pass: updatedObjects.filter(o => o.status === 'PASS').length, fail: updatedObjects.filter(o => o.status === 'FAIL').length, pending: updatedObjects.filter(o => o.status === 'PENDING').length };
     setSelectedHistoryItem({ ...selectedHistoryItem, testObjects: updatedObjects, stats });
  };
  const saveHistoryChanges = async () => {
     if (!selectedHistoryItem || isProjectClosed) return;
     await updateDoc(getPublicDoc('history', selectedHistoryItem.id), { testObjects: selectedHistoryItem.testObjects || [], stats: selectedHistoryItem.stats });
     setSelectedHistoryItem(null);
  };

  // --- Group Logic ---
  const handleGroupPressStart = (cat) => {
    isGroupLongPressTriggeredRef.current = false;
    groupLongPressTimerRef.current = setTimeout(() => { isGroupLongPressTriggeredRef.current = true; setShowActionsGroupCat(cat); }, 600);
  };
  const handleGroupPressEnd = () => { if (groupLongPressTimerRef.current) clearTimeout(groupLongPressTimerRef.current); };
  const handleGroupClick = (cat) => {
    if (!isGroupLongPressTriggeredRef.current) { if (showActionsGroupCat) { setShowActionsGroupCat(null); return; } setSelectedFolder(cat); }
  };
  const handleGroupDragStart = (e, cat) => { setDraggedGroupCat(cat); };
  const handleGroupDragOver = (e, cat) => { e.preventDefault(); setDragOverGroupCat(cat); };
  const handleGroupDragEnd = () => { setDraggedGroupCat(null); setDragOverGroupCat(null); };
  const handleGroupDrop = async (e, targetCat) => {
    e.preventDefault(); setDragOverGroupCat(null);
    if (!draggedGroupCat || draggedGroupCat === targetCat) return;
    let newList = [...appCategories];
    if (!newList.includes(draggedGroupCat)) newList.push(draggedGroupCat);
    if (!newList.includes(targetCat)) newList.push(targetCat);
    const fromIdx = newList.indexOf(draggedGroupCat);
    const toIdx = newList.indexOf(targetCat);
    const [moved] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, moved);
    await updateDoc(getPublicDoc('settings', 'categories'), { list: newList });
    setDraggedGroupCat(null);
  };
  const renameGroup = async () => {
    if (!editGroupNewName.trim()) return;
    const newList = appCategories.map(c => c === editGroupOldName ? editGroupNewName.trim() : c);
    await updateDoc(getPublicDoc('settings', 'categories'), { list: [...new Set(newList)] });
    const items = history.filter(h => h.projectId === currentProjectId && h.category === editGroupOldName);
    for (const item of items) await updateDoc(getPublicDoc('history', item.id), { category: editGroupNewName.trim() });
    setIsEditGroupModalOpen(false); setShowActionsGroupCat(null);
  };
  const executeDeleteGroup = async () => {
     const items = history.filter(h => h.projectId === currentProjectId && h.category === deleteGroupTarget);
     for (const item of items) await deleteDoc(getPublicDoc('history', item.id));
     await updateDoc(getPublicDoc('settings', 'categories'), { list: appCategories.filter(c => c !== deleteGroupTarget) });
     setIsDeleteGroupModalOpen(false); setDeleteGroupTarget(null); if (selectedFolder === deleteGroupTarget) setSelectedFolder(null);
  };

  // --- Category & Component Management ---
  const saveCategory = async () => {
    if (!newCatName.trim() || !user) return;
    await updateDoc(getPublicDoc('settings', 'categories'), { list: [...appCategories, newCatName.trim()] });
    setNewCatName('');
  };
  const deleteCategory = async (catToRemove) => {
    if (catToRemove === '미분류') return;
    await updateDoc(getPublicDoc('settings', 'categories'), { list: appCategories.filter(c => c !== catToRemove) });
  };
  const addComponentType = async () => {
    if(!newCompType.trim() || !user) return;
    await updateDoc(getPublicDoc('settings', 'components'), { list: [...appComponents, { type: newCompType.trim(), cases: [] }] });
    setNewCompType('');
  };
  const deleteComponentType = async (type) => {
    await updateDoc(getPublicDoc('settings', 'components'), { list: appComponents.filter(c => c.type !== type) });
  };
  const addTestCaseToComp = async (type) => {
    if(!newTestCase.trim() || !user) return;
    const newList = appComponents.map(c => c.type === type ? { ...c, cases: [...c.cases, newTestCase.trim()] } : c);
    await updateDoc(getPublicDoc('settings', 'components'), { list: newList });
    setNewTestCase('');
  };
  const deleteTestCaseFromComp = async (type, caseIndex) => {
    const newList = appComponents.map(c => c.type === type ? { ...c, cases: c.cases.filter((_, idx) => idx !== caseIndex) } : c);
    await updateDoc(getPublicDoc('settings', 'components'), { list: newList });
  };

  // --- Derived Values & Safeguards ---
  const isAnalyzing = currentProjectData?.isAnalyzing || false;
  const activeScan = currentProjectData?.activeScan || null;
  // 흰 화면의 주범 차단: 모든 렌더링 파트에서 사용하는 testObjects 배열 안전 참조
  const safeTestObjects = activeScan?.testObjects || [];
  
  const projectHistory = history.filter(h => h.projectId === currentProjectId);
  const currentUserDisplayName = manualInfo.displayName || "사용자";
  const currentUserPhoto = manualInfo.photoURL || null;

  const groupedHistory = projectHistory.reduce((acc, item) => {
    const cat = item.category || '미분류';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const displayGroups = Object.keys(groupedHistory).sort((a, b) => {
     let idxA = appCategories.indexOf(a); let idxB = appCategories.indexOf(b);
     return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  // --- Rendering UI Sections ---
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
        <div className="w-72 h-1.5 bg-white/5 rounded-full overflow-hidden mb-5 border border-white/10"><div className="h-full bg-gradient-to-r from-[#0066FF] to-[#00CCFF] transition-all duration-300" style={{ width: `${introProgress}%` }} /></div>
      </div>
    );
  }

  if (appState === 'login') {
    return (
      <div className="min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 text-white overflow-hidden font-sans relative">
        <style>{styleSheet}</style>
        
        {/* 앱 설치 버튼 (뷰에서 항상 확인할 수 있도록 조건문 제거 및 z-index 추가) */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-3 z-20">
          <button 
            onClick={() => setIsAdminModalOpen(true)}
            className="p-2.5 bg-white/5 hover:bg-[#0066FF] border border-white/10 hover:border-[#0066FF] rounded-full flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-95 group"
            title="사업부 관리"
          >
            <SettingsIcon className="w-4 h-4 text-white/70 group-hover:text-white transition-transform duration-500 group-hover:rotate-180" />
          </button>
          <button 
            onClick={handleInstallClick}
            className="px-5 py-2.5 bg-white/5 hover:bg-[#0066FF] border border-white/10 hover:border-[#0066FF] rounded-full flex items-center gap-2.5 text-xs font-black transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-95 group"
          >
            <Download className="w-4 h-4 text-white/70 group-hover:text-white transition-colors animate-bounce" />
            앱 설치하기
          </button>
        </div>

        <div className="w-full max-w-xs space-y-6 z-10 relative">
          <h2 className="text-3xl font-black text-center mb-10 tracking-tight">Workspace Access</h2>
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6 border border-white/10">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${authMode === 'login' ? 'bg-[#0066FF] text-white shadow-lg' : 'text-white/40'}`}>로그인</button>
            <button onClick={() => setAuthMode('register')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${authMode === 'register' ? 'bg-[#0066FF] text-white shadow-lg' : 'text-white/40'}`}>멤버 등록</button>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="Connect ID" className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-[#0066FF] text-white text-sm font-bold transition-all" value={memberId} onChange={e => setMemberId(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-[#0066FF] text-white text-sm font-bold transition-all" value={memberPw} onChange={e => setMemberPw(e.target.value)} onKeyPress={e => e.key === 'Enter' && (authMode === 'login' ? handleCustomLogin() : handleCustomRegister())} />
            {authMode === 'register' && <input type="text" placeholder="Display Name" className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-[#0066FF] text-white text-sm font-bold transition-all" value={memberName} onChange={e => setMemberName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCustomRegister()} />}
          </div>
          {loginErrorMsg && <p className="text-rose-400 text-center text-xs font-bold animate-pulse">{loginErrorMsg}</p>}
          <button onClick={authMode === 'login' ? handleCustomLogin : handleCustomRegister} disabled={isLoggingIn} className="w-full py-4 mt-4 bg-white text-[#001529] rounded-2xl font-black text-sm active:scale-95 flex items-center justify-center gap-2 shadow-xl transition-all">
            {isLoggingIn && <Loader2 className="w-5 h-5 animate-spin" />} {authMode === 'login' ? '워크스페이스 접속' : '계정 등록 및 시작'}
          </button>
        </div>

        {/* --- Department Admin Modal --- */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#001224]/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-gradient-to-b from-[#001529] to-[#000b14] border border-white/10 w-full max-w-sm rounded-[2rem] shadow-[0_0_40px_rgba(0,102,255,0.15)] p-6 flex flex-col text-white relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-6 border-b pb-4 border-white/10">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Admin <span className="text-[#0066FF] not-italic">Config</span></h2>
                  <p className="text-[9px] font-bold text-blue-300/50 uppercase tracking-widest mt-1">사업부 서버 목록 관리</p>
                </div>
                <button onClick={() => { setIsAdminModalOpen(false); setAdminErrorMsg(''); }} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="새 사업부 추가" className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold outline-none focus:border-[#0066FF] text-white" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addDepartment()} />
                <button onClick={addDepartment} className="px-4 py-3 bg-[#0066FF] text-white rounded-xl font-bold text-sm shadow hover:bg-blue-500 transition-colors"><Plus className="w-5 h-5" /></button>
              </div>
              
              {adminErrorMsg && <p className="text-rose-400 text-center text-xs font-bold mb-4">{adminErrorMsg}</p>}

              <div className="space-y-2 overflow-y-auto max-h-60 pr-1">
                {departments.map(dept => (
                  <div 
                    key={dept.id} 
                    draggable 
                    onDragStart={(e) => handleDeptDragStart(e, dept.id)} 
                    onDragOver={(e) => handleDeptDragOver(e, dept.id)} 
                    onDrop={(e) => handleDeptDrop(e, dept.id)} 
                    className={`flex items-center justify-between px-4 py-3 bg-white/5 border rounded-xl cursor-grab active:cursor-grabbing transition-all ${dragOverDeptId === dept.id ? 'border-[#0066FF] bg-white/10' : 'border-white/10'}`}
                  >
                    <span className="text-sm font-bold text-white/90">{dept.name}</span>
                    <button onClick={() => deleteDepartment(dept.id)} className="text-white/30 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (appState === 'manualProfile') {
    return (
      <div className="min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 text-white font-sans text-center">
        <style>{styleSheet}</style>
        <div className="max-w-xs w-full space-y-8">
          <label className="cursor-pointer inline-block group">
            <div className="w-24 h-24 bg-blue-500/20 rounded-[2rem] border border-blue-500/30 flex items-center justify-center mx-auto overflow-hidden shadow-xl transition-all group-hover:border-blue-400 relative">
              {manualInfo.photoURL ? <img src={manualInfo.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-blue-400" />}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-white uppercase tracking-widest">업로드</span></div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
          </label>
          <div><h2 className="text-2xl font-black italic uppercase">Profile Photo</h2><p className="text-blue-200/50 text-xs font-bold uppercase tracking-widest mt-1">{manualInfo.displayName}님, 프로필 사진을 등록하세요</p></div>
          <button onClick={async () => { if (manualInfo.memberId) await updateDoc(getPublicDoc('members', manualInfo.memberId), { photoURL: manualInfo.photoURL }); setAppState(prevAppState && prevAppState !== 'login' && prevAppState !== 'intro' ? prevAppState : 'departmentSelect'); }} className="w-full py-4 bg-[#0066FF] text-white rounded-2xl font-black text-sm active:scale-95 shadow-xl flex items-center justify-center gap-2 transition-all">
            {manualInfo.photoURL ? '설정 완료' : '사진 없이 입장'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (appState === 'departmentSelect') {
    return (
      <div className="min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 text-white overflow-hidden font-sans relative anim-cinematic-enter">
        <style>{styleSheet}</style>
        <div className="absolute inset-0 bg-blue-500/5 blur-[120px] animate-pulse"></div>
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-2 tracking-tight uppercase italic drop-shadow-2xl">Select <span className="text-[#0066FF] not-italic">Server</span></h2>
          <p className="text-blue-300/50 text-[10px] font-bold uppercase tracking-[0.3em] mb-16 text-center">입장할 사업부 서버를 선택하십시오</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full px-4">
            {departments.map(dept => (
              <button 
                key={dept.id} 
                onClick={() => { setCurrentDepartment(dept); setAppState('projects'); }} 
                className="group relative p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-[2rem] hover:bg-[#0066FF]/10 hover:border-[#0066FF]/50 transition-all duration-300 text-left overflow-hidden hover-cinematic-card shadow-xl active:scale-95 flex flex-col min-h-[160px]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066FF]/20 rounded-full blur-[50px] group-hover:bg-[#0066FF]/40 transition-all"></div>
                <div className="flex justify-between items-start relative z-10 mb-auto">
                  <div className="w-12 h-12 rounded-[1rem] bg-[#001224] border border-white/10 flex items-center justify-center group-hover:border-[#0066FF]/50 group-hover:bg-[#0066FF]/20 transition-all shadow-inner"><Building2 className="w-6 h-6 text-blue-400 group-hover:text-blue-300" /></div>
                  <span className="text-[9px] px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase font-black tracking-widest flex items-center gap-1.5 shadow-sm"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> Online</span>
                </div>
                <div className="relative z-10 mt-6">
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-50 transition-colors uppercase tracking-tight">{dept.name}</h3>
                  <div className="flex items-center gap-2 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Connect to Workspace</span>
                    <ChevronRight className="w-3 h-3 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'projects') {
    return (
      <div className="min-h-screen bg-[#001224] text-white flex flex-col relative overflow-hidden font-sans">
        <style>{styleSheet}</style>
        <div className="relative z-10 flex flex-col min-h-screen p-8 md:p-16 max-w-[1400px] mx-auto w-full">
          <header className="mb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-4">
              <button onClick={() => setAppState('departmentSelect')} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-blue-400 transition-colors mb-4"><ChevronLeft className="w-4 h-4" /> Change Server</button>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full"><Sparkles className="w-3 h-3 text-[#0066FF]" /><span className="text-[9px] font-black tracking-[0.2em] uppercase text-blue-300/80">Premium Workspace</span></div>
              <h1 className="text-5xl font-black tracking-tight text-white mb-2 italic uppercase">Team <span className="text-[#0066FF] not-italic">Boards</span></h1>
              <p className="text-blue-300/60 font-bold tracking-[0.2em] text-xs uppercase">{currentDepartment?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} style={{ animation: 'heartbeatGlow 2s ease-in-out infinite' }} className="w-9 h-9 rounded-full overflow-hidden border border-white/20 hover:border-[#0066FF] transition-all shrink-0 bg-slate-800 flex items-center justify-center">
                  {currentUserPhoto ? <img src={currentUserPhoto} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-xs text-white">{currentUserDisplayName?.[0]}</span>}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-[#001529]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-white/10 flex flex-col items-start cursor-pointer hover:bg-white/5 transition-colors" onClick={() => { setIsUserMenuOpen(false); navigateToProfile(); }}>
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">ID: {manualInfo.memberId}</span><span className="text-sm font-black tracking-tight text-white truncate w-full">{currentUserDisplayName}</span>
                    </div>
                    <button onClick={() => { setIsUserMenuOpen(false); handleLogout(); }} className="w-full px-4 py-3 flex items-center justify-between text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold">로그아웃 <LogOut className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-white/10 to-transparent backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(0,102,255,0.2)]">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
                <span className="text-xs font-black tracking-widest uppercase text-white/90">{(activeUsers || []).length} Online</span>
              </div>
            </div>
          </header>

          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-6">
            <div onClick={() => setIsNewProjectModalOpen(true)} className="group bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[130px] transition-all cursor-pointer shadow-lg hover:border-[#0066FF]/50">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0066FF] transition-all duration-300 shadow-lg"><Plus className="w-6 h-6 text-white" /></div>
              <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Add Project</span>
            </div>

            {(projects || []).filter(p => (p.departmentId || 'default') === (currentDepartment?.id || 'default')).map(proj => {
              const projectMembers = (activeUsers || []).filter(u => u.currentProjectId === proj.id);
              return (
                <div key={proj.id} draggable={true} onDragStart={(e) => handleDragStart(e, proj.id)} onDragOver={(e) => handleDragOver(e, proj.id)} onDrop={(e) => handleDrop(e, proj.id)} onDragEnd={handleDragEnd} onPointerDown={(e) => { if (e.button === 2) return; handlePressStart(proj.id); }} onPointerUp={handlePressEnd} onPointerLeave={handlePressEnd} onPointerCancel={handlePressEnd} onClick={() => handleProjectClick(proj.id)} style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }} className={`group relative bg-gradient-to-br from-white/[0.07] to-white/[0.01] rounded-[2rem] p-6 border border-white/10 shadow-2xl transition-all cursor-pointer ${dragOverProjectId === proj.id ? 'border-[#0066FF] bg-white/[0.1] scale-105' : 'hover-cinematic-card'} ${draggedProjectId === proj.id ? 'opacity-50' : ''}`}>
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
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">{proj.createdByPhoto ? <img src={proj.createdByPhoto} alt="" className="w-full h-full object-cover" /> : <div className="bg-slate-700 w-full h-full flex items-center justify-center text-[10px] font-bold">{proj.createdByName?.[0]}</div>}</div>
                        <span className="text-xs font-bold text-white/40">{proj.createdByName || "익명"}</span>
                      </div>
                      <div className="flex -space-x-2">
                        {projectMembers.slice(0, 3).map((m, idx) => (
                          <div key={idx} className="w-6 h-6 rounded-full bg-slate-800 border border-[#001224] flex items-center justify-center text-[8px] font-black overflow-hidden shadow-xl">{m.photoURL ? <img src={m.photoURL} alt="" className="w-full h-full object-cover" /> : m.displayName?.[0]}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </main>

          {/* --- Project Modals --- */}
          {isNewProjectModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#001224]/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-gradient-to-b from-[#001529] to-[#000b14] border border-white/10 w-full max-w-sm rounded-[2rem] shadow-[0_0_40px_rgba(0,102,255,0.15)] p-6 flex flex-col text-white relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6 border-b pb-4 border-white/10">
                    <div><h2 className="text-xl font-black uppercase tracking-tight text-white italic">New <span className="text-[#0066FF] not-italic">Project</span></h2><p className="text-[9px] font-bold text-blue-300/50 uppercase tracking-widest mt-1">새로운 워크스페이스 생성</p></div>
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
                    <div><h2 className="text-xl font-black uppercase tracking-tight text-white italic">Edit <span className="text-[#0066FF] not-italic">Name</span></h2><p className="text-[9px] font-bold text-blue-300/50 uppercase tracking-widest mt-1">프로젝트 이름 변경</p></div>
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
        </div>
      </div>
    );
  }

  // --- Transition Screen ---
  if (appState === 'projectLanding') {
    return (
      <div className={`min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative font-sans ${isLandingExiting ? 'anim-particle-exit' : ''}`}>
        <style>{styleSheet}</style>
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

      {/* 설정/모달 부분들 (전체 복구) */}
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
              {(appCategories || []).map(cat => (
                <div key={cat} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-sm font-bold">{cat}</span>
                  {cat !== '미분류' && <button onClick={() => deleteCategory(cat)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  {(appComponents || []).map(comp => (
                    <div key={comp.type} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors cursor-pointer group" onClick={() => setEditingCompType(comp.type)}>
                      <div>
                         <span className="text-sm font-black text-slate-800">{comp.type}</span>
                         <p className="text-[10px] text-slate-400 font-bold mt-0.5">{(comp.cases || []).length}개의 기본 케이스</p>
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
                      const currentComp = (appComponents || []).find(c => c.type === editingCompType);
                      if (!currentComp || (currentComp.cases || []).length === 0) return <p className="text-xs text-slate-400 font-bold italic text-center py-6">등록된 기본 케이스가 없습니다.</p>;
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

      {isCloseProjectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 flex flex-col text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertOctagon className="w-8 h-8" /></div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-2">Close Project?</h2>
              <p className="text-sm text-slate-500 font-bold mb-6">프로젝트를 종료하면 더 이상 수정하거나 스크린샷을 업로드할 수 없습니다.</p>
              <div className="flex gap-3">
                 <button onClick={() => setIsCloseProjectModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-200">CANCEL</button>
                 <button onClick={handleCloseProject} className="flex-1 py-3 bg-rose-50 text-white rounded-xl font-black text-sm shadow-lg hover:bg-rose-600">YES, CLOSE IT</button>
              </div>
           </div>
        </div>
      )}

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

      {isDeleteGroupModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 flex flex-col text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertOctagon className="w-8 h-8" /></div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-2">Delete Group?</h2>
              <p className="text-sm text-slate-500 font-bold mb-6">[{deleteGroupTarget}] 그룹과 <span className="text-rose-500 font-black">모든 레포트</span>가 삭제됩니다.</p>
              <div className="flex gap-3">
                 <button onClick={() => setIsDeleteGroupModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-200 transition-all">CANCEL</button>
                 <button onClick={executeDeleteGroup} className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-sm shadow-lg hover:bg-rose-500 hover:text-white transition-all">YES, DELETE</button>
              </div>
           </div>
        </div>
      )}

      {isSavingReport && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#001529]/90 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden">
          <div className="relative flex flex-col items-center">
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] animate-pulse rounded-full pointer-events-none"></div>
            <div className="w-24 h-24 mb-8 rounded-[2rem] border border-blue-500/50 bg-[#001529]/50 backdrop-blur-md flex items-center justify-center relative overflow-hidden" style={{ animation: 'saveGlow 2s ease-in-out infinite' }}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent w-full h-full" style={{ animation: 'scanline 1.5s linear infinite' }} />
              <Save className="w-10 h-10 text-blue-400 relative z-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white mb-2 italic">Saving <span className="text-blue-500 not-italic">Report</span></h2>
            <p className="text-[10px] font-bold text-blue-300/60 uppercase tracking-widest animate-pulse">데이터를 안전하게 전송 중입니다...</p>
            <div className="mt-8 w-64 h-1 bg-white/10 rounded-full overflow-hidden relative"><div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 animate-[lineGrow_2.5s_ease-in-out_infinite]" /></div>
          </div>
        </div>
      )}

      {/* --- 아카이브 사이드바 --- */}
      {isHistoryOpen && <div className="fixed inset-0 z-[45] bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsHistoryOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#001529] text-white transition-transform duration-500 transform ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl rounded-r-2xl`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
            <h2 className="font-black text-sm uppercase tracking-widest">Archive</h2>
            <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             {(displayGroups || []).length === 0 ? (
                <p className="text-xs text-white/40 text-center mt-10">저장된 아카이브가 없습니다.</p>
             ) : (
                (displayGroups || []).map(cat => {
                  const groupStats = (groupedHistory[cat] || []).reduce((acc, item) => {
                     acc.pass += (item.stats?.pass || 0);
                     acc.fail += (item.stats?.fail || 0);
                     return acc;
                  }, { pass: 0, fail: 0 });

                  return (
                  <div key={cat} 
                       draggable={true} onDragStart={(e) => handleGroupDragStart(e, cat)} onDragOver={(e) => handleGroupDragOver(e, cat)} onDrop={(e) => handleGroupDrop(e, cat)} onDragEnd={handleGroupDragEnd} onPointerDown={(e) => { if (e.button === 2) return; handleGroupPressStart(cat); }} onPointerUp={handleGroupPressEnd} onPointerLeave={handleGroupPressEnd} onPointerCancel={handleGroupPressEnd} onClick={() => handleGroupClick(cat)}
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
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{(groupedHistory[cat] || []).length} Reports</p>
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

      {/* --- 폴더 아카이브 팝업 --- */}
      {selectedFolder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-[90vw] md:max-w-7xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] flex flex-col h-[85vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shadow-sm">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-xl shadow-lg shadow-blue-500/20"><FolderOpen className="w-5 h-5" /></div>
                    <div>
                       <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">{selectedFolder}</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">총 {(groupedHistory[selectedFolder] || []).length}건의 히스토리 리포트</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedFolder(null)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-200/90 relative">
                 <style>{` .hover-soft-glow:hover { animation: heartbeatGlow 1.5s ease-in-out infinite; transform: translateY(-4px); z-index: 20; } `}</style>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {(groupedHistory[selectedFolder] || []).map(item => (
                       <div key={item.id} 
                            draggable={true} onDragStart={(e) => handleHistoryDragStart(e, item.id)} onDragOver={(e) => handleHistoryDragOver(e, item.id)} onDrop={(e) => handleHistoryDrop(e, item.id)} onDragEnd={handleHistoryDragEnd} onPointerDown={(e) => { if (e.button === 2) return; handleHistoryPressStart(item.id); }} onPointerUp={handleHistoryPressEnd} onPointerLeave={handleHistoryPressEnd} onPointerCancel={handleHistoryPressEnd} onClick={() => handleHistoryClick(item)}
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

      {/* --- History View Detail Modal --- */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="px-8 py-6 border-b flex items-center justify-between bg-slate-50">
                 <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">{selectedHistoryItem.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                       <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200">
                          {selectedHistoryItem.savedByPhoto ? <img src={selectedHistoryItem.savedByPhoto} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{selectedHistoryItem.savedByName?.[0]}</div>}
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
                    <span>{Math.round(((selectedHistoryItem.stats?.pass || 0) / Math.max((selectedHistoryItem.stats?.total || 1), 1)) * 100)}% PASS</span>
                 </div>
                 <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div style={{ width: `${((selectedHistoryItem.stats?.pass || 0)/Math.max((selectedHistoryItem.stats?.total || 1), 1))*100}%` }} className="bg-emerald-500 transition-all h-full" />
                    <div style={{ width: `${((selectedHistoryItem.stats?.fail || 0)/Math.max((selectedHistoryItem.stats?.total || 1), 1))*100}%` }} className="bg-rose-500 transition-all h-full" />
                    <div style={{ width: `${((selectedHistoryItem.stats?.pending || 0)/Math.max((selectedHistoryItem.stats?.total || 1), 1))*100}%` }} className="bg-slate-300 transition-all h-full" />
                 </div>
                 <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mt-2">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> PASS ({selectedHistoryItem.stats?.pass || 0})</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"/> FAIL ({selectedHistoryItem.stats?.fail || 0})</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"/> PENDING ({selectedHistoryItem.stats?.pending || 0})</span>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-50">
                 <div className="bg-white rounded-3xl p-4 flex items-center justify-center border border-slate-100 shadow-sm"><img src={selectedHistoryItem.image} className="max-w-full rounded-xl shadow-md" alt="history" /></div>
                 <div className="space-y-4">
                    {(selectedHistoryItem.testObjects || []).map(obj => (
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
                          {(obj.testCases || []).length > 0 && (
                             <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                                {(obj.testCases || []).map(tc => (
                                   <div key={tc.id} className="flex justify-between items-center">
                                      <span className="text-[10px] text-slate-500 font-bold">• {tc.label}</span>
                                      <div className="flex gap-1 shrink-0">
                                         <button disabled={isProjectClosed} onClick={() => toggleHistoryTCStatus(obj.id, tc.id, 'PASS')} className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${tc.status === 'PASS' ? 'text-white bg-emerald-500 shadow-sm' : `text-slate-400 bg-slate-100 ${isProjectClosed ? '' : 'hover:bg-emerald-50 hover:text-emerald-500'}`} ${isProjectClosed ? 'opacity-60 cursor-not-allowed' : ''}`}>PASS</button>
                                         <button disabled={isProjectClosed} onClick={() => toggleHistoryTCStatus(obj.id, tc.id, 'FAIL')} className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${tc.status === 'FAIL' ? 'text-white bg-rose-500 shadow-sm' : `text-slate-400 bg-slate-100 ${isProjectClosed ? '' : 'hover:bg-rose-50 hover:text-rose-500'}`} ${isProjectClosed ? 'opacity-60 cursor-not-allowed' : ''}`}>FAIL</button>
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
              {!isProjectClosed && activeScan?.image && <button onClick={saveCurrentToHistory} disabled={!(scanMetaForm.title || '').trim()} className="px-6 py-3 bg-emerald-500 text-white rounded-xl shadow-lg font-black text-xs uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-30">Save Report</button>}
            </div>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* --- Left Column: Viewfinder --- */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[450px]">
                <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Viewfinder</span>
                  {!isProjectClosed && activeScan?.image && (
                    <button 
                       onClick={handleScanButtonClick}
                       className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isAnalyzing ? 'bg-rose-500 text-white shadow-md hover:bg-rose-600' : 'bg-blue-500 text-white shadow-md hover:bg-blue-600'}`}
                    >
                       {isAnalyzing ? 'STOP SCAN' : (activeScan?.testObjects?.length > 0 ? 'RESCAN' : 'SCAN')}
                    </button>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/20 relative">
                  {!activeScan?.image ? (
                    <div onClick={() => !isProjectClosed && fileInputRef.current?.click()} className={`w-full h-full border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-6 transition-all p-8 ${isProjectClosed ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-white hover:border-[#0066FF] group'}`}>
                      <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-all"><Upload /></div>
                      <div className="text-center"><p className="font-black text-slate-800 uppercase tracking-tight">{isProjectClosed ? 'Project Closed' : 'Upload Screenshot'}</p><p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-widest leading-relaxed">{isProjectClosed ? '더 이상 스크린샷을 업로드할 수 없습니다' : '이미지를 업로드하고 분석을 시작하세요'}</p></div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isAnalyzing || isProjectClosed} />
                    </div>
                  ) : (
                    <div className="relative group w-full h-full flex flex-col items-center justify-center gap-4">
                      <div className="relative flex items-center justify-center flex-1 min-h-0 w-full">
                        <img src={activeScan.image} className="max-w-full max-h-[400px] xl:max-h-[500px] rounded-2xl shadow-2xl transition-all object-contain" alt="Viewfinder" />
                        
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

                      {!isAnalyzing && !isProjectClosed && (
                        <div className="w-full max-w-md shrink-0 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="absolute -top-2 left-4 bg-slate-50 px-2 text-[10px] font-black text-blue-500 uppercase tracking-widest z-10 rounded-full">AI Scan Condition</div>
                          <textarea
                            placeholder="예: 헤더 영역은 스캔하지 마. 버튼 위주로 찾아줘."
                            value={scanConditions}
                            onChange={(e) => setScanConditions(e.target.value)}
                            className="w-full p-4 pt-5 bg-white border-2 border-blue-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 resize-none h-20 shadow-inner transition-all placeholder:text-slate-300 scrollbar-hide"
                          />
                        </div>
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
                                    {(appCategories || []).map(cat => (
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
                  ) : safeTestObjects.length === 0 ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center py-24 text-slate-200"><Layout className="w-20 h-20 mb-4 opacity-20" /><p className="font-black uppercase tracking-widest text-[10px]">No Data Captured</p></div>
                  ) : (
                    <div className="space-y-4 pb-12">
                      {/* --- Progress Bar --- */}
                      <div className="mb-6 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span>Overall Progress</span>
                          <span>{Math.round((safeTestObjects.filter(o => o.status === 'PASS').length / Math.max(safeTestObjects.length, 1)) * 100) || 0}% PASS</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                          {(() => {
                            const total = Math.max(safeTestObjects.length, 1);
                            const pass = safeTestObjects.filter(o => o.status === 'PASS').length;
                            const fail = safeTestObjects.filter(o => o.status === 'FAIL').length;
                            const pending = safeTestObjects.filter(o => o.status === 'PENDING').length;
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
                           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> PASS ({safeTestObjects.filter(o => o.status === 'PASS').length})</span>
                           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"/> FAIL ({safeTestObjects.filter(o => o.status === 'FAIL').length})</span>
                           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"/> PENDING ({safeTestObjects.filter(o => o.status === 'PENDING').length})</span>
                        </div>
                      </div>

                      {safeTestObjects.map(obj => {
                        // --- Edit Mode Rendering ---
                        if (editingObjId === obj.id) {
                           return (
                             <div key={obj.id} className="p-5 rounded-[1.5rem] bg-blue-50 border border-blue-200 shadow-sm space-y-3">
                                <div className="flex gap-3">
                                   <select className="w-32 px-3 py-2 rounded-lg border border-blue-200 bg-white text-xs font-black outline-none" value={editObjForm.type} onChange={(e)=>setEditObjForm({...editObjForm, type: e.target.value})}>
                                      {(objectTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
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
                                   {(obj.testCases || []).length > 0 ? (obj.testCases || []).map(tc => {
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
                                                <button onClick={() => addTestCaseToObject(obj.id)} className="px-2 py-1.5 rounded-lg text-[9px] font-black uppercase bg-slate-800 text-white shadow-md hover:bg-slate-900">추가</button>
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
                                         {(objectTypes || []).map(t => (
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
