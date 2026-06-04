import { writable } from 'svelte/store';

// Retrieve saved language preference or default to English
const savedLocale = (typeof localStorage !== 'undefined' && localStorage.getItem('locale')) || 'en';
export const locale = writable<'en' | 'id'>(savedLocale as 'en' | 'id');

// Subscribe to update localStorage when locale changes
locale.subscribe(val => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('locale', val);
  }
});

export const translations = {
  en: {
    dashboard: "Dashboard",
    sandbox: "FBD Sandbox",
    conceptLibrary: "Concept Library",
    futureExpansion: "Future Expansion",
    comingSoon: "Stage 2",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    workspace: "Workspace",
    credit: "© 2026 StaticsLab MVP",
    homeWebsite: "Home Website",
    
    // Dashboard page
    undergradMechanics: "Undergraduate Engineering Mechanics",
    learningPortal: "Statics Learning Portal",
    portalDesc: "Learn the fundamentals of rigid-body equilibrium, boundary support reactions, and free-body diagramming (FBD).",
    openSandbox: "Open Free Sandbox FBD Builder",
    conceptModules: "1. Concept Modules",
    conceptDesc: "Study the theoretical foundation of 2D rigid-body statics.",
    practiceProblems: "2. Practice Problems",
    practiceDesc: "Load preset problems into the interactive FBD builder to verify supports, loads, and reactions.",
    determinate: "Determinate",
    indeterminate: "Indeterminate",
    unstable: "Unstable",
    body: "Body",
    supports: "Supports",
    
    // Sandbox / Practice Page
    interactiveSandbox: "Interactive FBD Sandbox",
    presetProblem: "Preset Problem:",
    customSandbox: "-- Custom Sandbox (Clear) --",
    resetDiagram: "Reset Diagram",
    targetGoal: "Target Goal:",
    expected: "Expected:",
    canvasTitle: "Free-Body Diagram Canvas",
    showLabels: "Show Labels",
    showReactions: "Show Reactions",
    canvasTip: "Tip: You can click anywhere on the grey body to pick coordinates while creating elements.",
    editBodyProps: "Edit Body Properties",
    addSupport: "Add Support Reactions",
    addAppliedLoad: "Add Applied Load",
    elementInspector: "Element Inspector",
    deleteElement: "Delete Element",
    deselect: "Deselect",
    solvingHints: "Solving Hints",
    
    // Body Form
    editBodyDimensions: "Edit Rigid Body Dimensions",
    bodyType: "Type",
    beamLinear: "Beam (Linear)",
    blockPlanar: "Block (Planar)",
    widthLength: "Width (Length, m)",
    height: "Height (m)",
    selfWeight: "Self-Weight (N)",
    close: "Close",
    
    // Support Form
    addSupportConstraint: "Add Boundary Support Constraint",
    supportType: "Support Type",
    pinSupport: "Pin Support (2 Reactions: Rx, Ry)",
    rollerSupport: "Roller Support (1 Reaction: Rn)",
    fixedJoint: "Fixed Joint (3 Reactions: Rx, Ry, M)",
    positionX: "Position X",
    labelPrefix: "Label Prefix",
    rollerIncline: "Roller Inclination (θ°)",
    cancel: "Cancel",
    saveSupport: "Save Support",
    
    // Load Form
    addExternalLoad: "Add External Applied Load",
    loadType: "Load Type",
    pointForce: "Point Force (Concentrated Load)",
    appliedMoment: "Applied Couple / Moment",
    distributedLoad: "Uniform Distributed Load (UDL)",
    label: "Label",
    forceMag: "Force Magnitude (N)",
    momentMag: "Moment Magnitude (N·m, +CCW / -CW)",
    forceAngle: "Force Direction Angle (θ°, CCW from +x)",
    startX: "Start X (m)",
    endX: "End X (m)",
    loadStartMag: "Load Start Magnitude (N/m)",
    loadEndMag: "Load End Magnitude (N/m)",
    applyLoad: "Apply Load",
    
    // Inspector Edit Form
    editSupport: "Edit Boundary Support",
    editLoad: "Edit Applied Load",
    
    // Feedback / Status
    determinacy: "Determinacy:",
    stability: "Stability:",
    systemFeedback: "System Feedback",
    noDiagnostics: "No diagnostics. Try placing supports and loads to analyze the model.",
    whyThisMatters: "Why this matters:",
    staticallyDeterminateText: "Statically Determinate",
    staticallyIndeterminateText: "Statically Indeterminate",
    unstableText: "Unstable / Under-restrained",
    stableText: "STABLE",
    unstableTextUpper: "UNSTABLE",
    
    // Equations / Equilibrium Helper
    equilibriumHelper: "Equilibrium Helper",
    momentPivotChosen: "Moment pivot point is chosen at",
    support: "Support",
    bodyCenter: "Body center",
    sumHorizontalDesc: "Sum of horizontal forces must be zero",
    sumVerticalDesc: "Sum of vertical forces must be zero",
    sumMomentDesc: "Sum of moments about pivot point must be zero",
    momentCalcExplanation: "Moment is calculated as: M = F_y * Δx - F_x * Δy, where Δx = x_force - x_pivot and Δy = y_force - y_pivot. Counter-clockwise is positive (↺).",
    calculatedReactions: "Calculated Reactions",
    waitingStableLayout: "Waiting for a stable support layout to solve reactions...",
    ccw: "Counter-clockwise (↺)",
    cw: "Clockwise (↻)",
    right: "Right (→)",
    left: "Left (←)",
    up: "Up (↑)",
    down: "Down (↓)",
  },
  id: {
    dashboard: "Dasbor",
    sandbox: "FBD Sandbox",
    conceptLibrary: "Perpustakaan Konsep",
    futureExpansion: "Ekspansi Masa Depan",
    comingSoon: "Tahap 2",
    darkMode: "Mode Gelap",
    lightMode: "Mode Terang",
    workspace: "Ruang Kerja",
    credit: "© 2026 StaticsLab MVP",
    homeWebsite: "Situs Utama",
    
    // Dashboard page
    undergradMechanics: "Mekanika Teknik S1",
    learningPortal: "Portal Belajar Statika",
    portalDesc: "Pelajari prinsip dasar kesetimbangan benda tegar, reaksi tumpuan batas, dan diagram benda bebas (FBD).",
    openSandbox: "Buka FBD Sandbox Gratis",
    conceptModules: "1. Modul Konsep",
    conceptDesc: "Pelajari landasan teori statika benda tegar 2D.",
    practiceProblems: "2. Soal Latihan",
    practiceDesc: "Muat contoh soal ke pembuat FBD interaktif untuk memverifikasi tumpuan, beban, dan reaksi.",
    determinate: "Determinat",
    indeterminate: "Indeterminat",
    unstable: "Labil (Unstable)",
    body: "Batang",
    supports: "Tumpuan",
    
    // Sandbox / Practice Page
    interactiveSandbox: "FBD Sandbox Interaktif",
    presetProblem: "Contoh Soal:",
    customSandbox: "-- Sandbox Kustom (Kosong) --",
    resetDiagram: "Reset Diagram",
    targetGoal: "Tujuan Soal:",
    expected: "Ekspektasi:",
    canvasTitle: "Kanvas Diagram Benda Bebas",
    showLabels: "Tampilkan Label",
    showReactions: "Tampilkan Reaksi",
    canvasTip: "Tips: Anda dapat mengklik di mana saja pada batang abu-abu untuk memilih koordinat saat membuat elemen.",
    editBodyProps: "Edit Properti Batang",
    addSupport: "Tambah Tumpuan Reaksi",
    addAppliedLoad: "Tambah Beban Luar",
    elementInspector: "Inspektur Elemen",
    deleteElement: "Hapus Elemen",
    deselect: "Batal Pilih",
    solvingHints: "Petunjuk Penyelesaian",
    
    // Body Form
    editBodyDimensions: "Edit Dimensi Benda Tegar",
    bodyType: "Jenis",
    beamLinear: "Balok (Linear)",
    blockPlanar: "Plat (Planar)",
    widthLength: "Lebar (Panjang, m)",
    height: "Tinggi (m)",
    selfWeight: "Berat Sendiri (N)",
    close: "Tutup",
    
    // Support Form
    addSupportConstraint: "Tambah Batasan Tumpuan Batas",
    supportType: "Jenis Tumpuan",
    pinSupport: "Tumpuan Sendi/Engsel (2 Reaksi: Rx, Ry)",
    rollerSupport: "Tumpuan Rol (1 Reaksi: Rn)",
    fixedJoint: "Tumpuan Jepit (3 Reaksi: Rx, Ry, M)",
    positionX: "Posisi X",
    labelPrefix: "Awalan Label",
    rollerIncline: "Kemiringan Rol (θ°)",
    cancel: "Batal",
    saveSupport: "Simpan Tumpuan",
    
    // Load Form
    addExternalLoad: "Tambah Beban Luar",
    loadType: "Jenis Beban",
    pointForce: "Gaya Terpusat (Point Force)",
    appliedMoment: "Momen / Kopel",
    distributedLoad: "Beban Merata (UDL)",
    label: "Label",
    forceMag: "Besar Gaya (N)",
    momentMag: "Besar Momen (N·m, +CCW / -CW)",
    forceAngle: "Arah Gaya (θ°, CCW dari +x)",
    startX: "Posisi Awal X (m)",
    endX: "Posisi Akhir X (m)",
    loadStartMag: "Beban Awal Merata (N/m)",
    loadEndMag: "Beban Akhir Merata (N/m)",
    applyLoad: "Terapkan Beban",
    
    // Inspector Edit Form
    editSupport: "Edit Tumpuan Batas",
    editLoad: "Edit Beban Luar",
    
    // Feedback / Status
    determinacy: "Determinasi:",
    stability: "Stabilitas:",
    systemFeedback: "Umpan Balik Sistem",
    noDiagnostics: "Tidak ada diagnostik. Coba tempatkan tumpuan dan beban untuk menganalisis model.",
    whyThisMatters: "Mengapa ini penting:",
    staticallyDeterminateText: "Statis Tertentu (Determinate)",
    staticallyIndeterminateText: "Statis Tak Tentu (Indeterminate)",
    unstableText: "Labil (Unstable / Under-restrained)",
    stableText: "STABIL",
    unstableTextUpper: "LABIL (UNSTABLE)",
    
    // Equations / Equilibrium Helper
    equilibriumHelper: "Pembantu Kesetimbangan",
    momentPivotChosen: "Titik pusat momen dipilih di",
    support: "Tumpuan",
    bodyCenter: "Pusat batang",
    sumHorizontalDesc: "Jumlah gaya horizontal harus sama dengan nol",
    sumVerticalDesc: "Jumlah gaya vertikal harus sama dengan nol",
    sumMomentDesc: "Jumlah momen terhadap titik pusat harus sama dengan nol",
    momentCalcExplanation: "Momen dihitung sebagai: M = F_y * Δx - F_x * Δy, di mana Δx = x_gaya - x_pusat dan Δy = y_gaya - y_pusat. Putaran berlawanan jarum jam bernilai positif (↺).",
    calculatedReactions: "Reaksi yang Dihitung",
    waitingStableLayout: "Menunggu susunan tumpuan yang stabil untuk menghitung reaksi...",
    ccw: "Berlawanan arah jarum jam (↺)",
    cw: "Searah jarum jam (↻)",
    right: "Kanan (→)",
    left: "Kiri (←)",
    up: "Atas (↑)",
    down: "Bawah (↓)",
  }
};
