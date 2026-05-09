import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface OnboardingSummary {
  status: string;
  currentStep: string | null;
  progress: number;
  steps: { type: string; status: string }[];
  canProceed: boolean;
  blockingIssues: string[];
}

interface Notification {
  id: number;
  userId: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface OnboardingProcess {
  id: number;
  contractorUserId: number;
  status: string;
  currentStep: string;
  progress: number;
  assignedOperatorId: number | null;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  currentView: 'landing' | 'welcome' | 'register' | 'onboarding' | 'operator' = 'landing';
  apiBaseUrl = 'http://localhost:8080/api';
  isLocalMock = true;
  cloudinaryCloudName = 'northpay-demo';
  cloudinaryUploadPreset = 'northpay_preset';

  invitationToken = '';
  invitationEmail = 'contractor@northpay.com';
  registerPassword = 'password123';
  loginEmail = 'contractor@northpay.com';
  loginPassword = 'password123';
  userId = 1;
  processId = 1;

  summary: OnboardingSummary = {
    status: 'CREATED',
    currentStep: 'WHATSAPP_VERIFY',
    progress: 0,
    steps: [
      { type: 'WHATSAPP_VERIFY', status: 'IN_PROGRESS' },
      { type: 'PERSONAL_DATA', status: 'NOT_STARTED' },
      { type: 'DOCUMENT_UPLOAD', status: 'NOT_STARTED' },
      { type: 'CONTRACT_SIGN', status: 'NOT_STARTED' },
      { type: 'PAYMENT_METHOD', status: 'NOT_STARTED' },
      { type: 'IDENTITY_VERIFICATION', status: 'NOT_STARTED' }
    ],
    canProceed: true,
    blockingIssues: []
  };

  whatsappPhone = '';
  whatsappCode = '';
  isSendingWhatsapp = false;
  isVerifyingWhatsapp = false;
  whatsappVerified = false;

  personalData = {
    firstName: '',
    lastName: '',
    phone: '',
    country: 'Spain'
  };

  uploadedDocs: { type: string; filename: string; fileUrl: string }[] = [];
  selectedDocType = 'PASSPORT';
  selectedFile: File | null = null;
  isUploadingDoc = false;

  signedContractUrl = '';
  isSigningContract = false;
  docusealEmbedSrc = 'https://www.docuseal.com/d/demo';

  @HostListener('document:docuseal:completed', ['$event'])
  onDocuSealCompleted(event: any) {
    this.addLocalNotification('Firma detectada con éxito vía DocuSeal.', 'SUCCESS');
    this.signContract();
  }

  paymentMethod = {
    provider: 'BANK_TRANSFER',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    mpAliasOrCvu: '',
    mpAccountHolder: '',
    paypalEmail: '',
    paypalName: ''
  };

  identityProvider = 'STRIPE_IDENTITY';
  isScanningIdentity = false;
  scanProgress = 0;
  scanSuccess = true;

  operatorProcesses: OnboardingProcess[] = [];
  selectedProcessIdForReview: number | null = null;
  selectedProcessSummary: OnboardingSummary | null = null;
  reviewFeedback = '';
  notifications: Notification[] = [];
  showNotificationDropdown = false;
  currentTheme: 'dark' | 'light' = 'dark';
  preloadProgress = 0;
  preloadStatus = 'Iniciando servicios seguros...';
  selectedLang = 'es';

  translations: Record<string, Record<string, string>> = {
    es: {
      logoSubtitle: "PORTAL DE BIENVENIDA",
      heroTitle: "Tu Pasarela de Pagos Globales",
      heroDesc: "Únete a la plataforma de nóminas internacional líder para contratistas remotos. Activa tu perfil, firma acuerdos de forma segura y gestiona tus retiros globales en segundos.",
      propTitle1: "Retiros Flexibles",
      propDesc1: "Recibe tus cobros en USD, EUR o moneda local a través de transferencias bancarias o Mercado Pago.",
      propTitle2: "Firma Digital",
      propDesc2: "Firma tu acuerdo de contratista legal de forma instantánea usando el Web Component de DocuSeal.",
      propTitle3: "Biometría KYC",
      propDesc3: "Comprobación de identidad de última generación respaldada por motores biométricos avanzados.",
      btnOperator: "⚙️ Panel de Operaciones (Demo)",
      btnActivate: "Iniciar Activación 👤",
      preloading: "Precargando recursos...",
      statusReady: "Portal NorthPay listo para operar ⚡"
    },
    en: {
      logoSubtitle: "WELCOME PORTAL",
      heroTitle: "Your Global Payroll Gateway",
      heroDesc: "Join the leading international payroll platform for remote contractors. Activate your profile, sign agreements securely, and manage your global withdrawals in seconds.",
      propTitle1: "Flexible Payouts",
      propDesc1: "Receive your payouts in USD, EUR, or local currency via bank transfers or Mercado Pago.",
      propTitle2: "Digital Signature",
      propDesc2: "Sign your legal contractor agreement instantly using the DocuSeal Web Component.",
      propTitle3: "KYC Biometrics",
      propDesc3: "Next-generation identity verification powered by advanced biometric engines.",
      btnOperator: "⚙️ Operator Panel (Demo)",
      btnActivate: "Start Activation 👤",
      preloading: "Preloading resources...",
      statusReady: "NorthPay Portal ready to operate ⚡"
    },
    fr: {
      logoSubtitle: "PORTAIL DE BIENVENUE",
      heroTitle: "Votre Passerelle de Paiement Globale",
      heroDesc: "Rejoignez la première plateforme internationale de paie pour les sous-traitants à distance. Activez votre profil, signez des contrats en toute sécurité et gérez vos retraits globaux en quelques secondes.",
      propTitle1: "Retraits Flexibles",
      propDesc1: "Recevez vos paiements en USD, EUR ou devise locale via virements bancaires ou Mercado Pago.",
      propTitle2: "Signature Numérique",
      propDesc2: "Signez instantanément votre contrat de sous-traitant à l'aide du composant Web DocuSeal.",
      propTitle3: "Biométrie KYC",
      propDesc3: "Vérification d'identité de pointe optimisée par des moteurs biométriques avancés.",
      btnOperator: "⚙️ Panneau Opérateur (Démo)",
      btnActivate: "Lancer l'activation 👤",
      preloading: "Préchargement des ressources...",
      statusReady: "Portail NorthPay prêt à fonctionner ⚡"
    },
    pt: {
      logoSubtitle: "PORTAL DE BOAS-VINDAS",
      heroTitle: "Seu Portal de Pagamentos Globais",
      heroDesc: "Junte-se à principal plataforma internacional de folha de pagamento para contratados remotos. Ative seu perfil, assine contratos com segurança e gerencie seus saques globais em segundos.",
      propTitle1: "Saques Flexíveis",
      propDesc1: "Receba seus pagamentos em USD, EUR ou moeda local por meio de transferências bancarias ou Mercado Pago.",
      propTitle2: "Assinatura Digital",
      propDesc2: "Assine seu contrato de prestação de serviços instantaneamente usando o DocuSeal Web Component.",
      propTitle3: "Biometria KYC",
      propDesc3: "Verificação de identidade de última geração com suporte de motores biométricos avançados.",
      btnOperator: "⚙️ Painel do Operador (Demo)",
      btnActivate: "Iniciar Ativação 👤",
      preloading: "Pré-carregando recursos...",
      statusReady: "Portal NorthPay pronto para operar ⚡"
    }
  };

  selectedProcessForPayment: any | null = null;
  paymentAmount = 2500;
  isProcessingPayment = false;

  operatorFilter = 'ALL';
  changeHistory: string[] = [
    'Invitación de acceso generada para contractor@northpay.com',
    'Perfil de contratista registrado con éxito.',
    'Datos personales completados y validados.'
  ];
  mockContractors: any[] = [];
  paidContractorIds: number[] = [];

  getFilteredContractors() {
    if (this.operatorFilter === 'ALL') {
      return this.mockContractors;
    }
    if (this.operatorFilter === 'COMPLETED') {
      return this.mockContractors.filter(c => c.status === 'COMPLETED' || c.status === 'PAID');
    }
    return this.mockContractors.filter(c => c.status === this.operatorFilter);
  }

  getPendingCount() {
    return this.mockContractors.filter(c => c.status === 'IN_PROGRESS').length;
  }

  getInReviewCount() {
    return this.mockContractors.filter(c => c.status === 'IN_REVIEW').length;
  }

  getCompletedCount() {
    return this.mockContractors.filter(c => c.status === 'COMPLETED' || c.status === 'PAID').length;
  }

  isContractorPaid(): boolean {
    return this.mockContractors.find(c => c.id === 500)?.status === 'PAID';
  }

  constructor(private http: HttpClient) { }

  ngOnInit() {
    const savedTheme = localStorage.getItem('northpay-theme') as 'dark' | 'light';
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
    this.applyTheme();
    this.testBackendConnection();
    this.startPreloadingSimulation();
  }

  testBackendConnection() {

    this.http.get(`${this.apiBaseUrl}/onboarding/1/summary`).subscribe({
      next: () => {
        this.isLocalMock = false;
        console.log('[NorthPay] Connected to NorthPay server.');
        this.addLocalNotification('Conectado al servidor de NorthPay', 'SUCCESS');
      },
      error: () => {
        this.isLocalMock = true;
        console.warn('[NorthPay] Spring Boot offline. Running in premium Local Simulation mode.');
        this.loadMockInitialState();
      }
    });
  }


  generateInvitation() {
    if (this.isLocalMock) {
      this.invitationToken = 'NP_INV_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      this.addLocalNotification(`Invitación creada para ${this.invitationEmail}`, 'SUCCESS');
      this.currentView = 'register';
    } else {
      this.http.post(`${this.apiBaseUrl}/invitations/send`, {
        email: this.invitationEmail,
        operatorId: 1
      }).subscribe({
        next: (res: any) => {
          this.invitationToken = res.token;
          this.addLocalNotification(`Invitación enviada para ${this.invitationEmail}`, 'SUCCESS');
          this.currentView = 'register';
        },
        error: (err) => this.handleError(err)
      });
    }
  }


  register() {
    if (this.isLocalMock) {
      this.userId = 100;
      this.processId = 500;
      this.addLocalNotification('Usuario registrado con éxito', 'SUCCESS');
      this.summary.status = 'IN_PROGRESS';
      this.currentView = 'onboarding';
    } else {
      this.http.post(`${this.apiBaseUrl}/auth/register`, {
        email: this.invitationEmail,
        password: this.registerPassword,
        token: this.invitationToken
      }).subscribe({
        next: (user: any) => {
          this.userId = user.id;
          this.addLocalNotification('Registrado correctamente', 'SUCCESS');
          this.initiateOnboarding();
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  initiateOnboarding() {
    this.http.post(`${this.apiBaseUrl}/onboarding/initiate?contractorUserId=${this.userId}`, {}).subscribe({
      next: (proc: any) => {
        this.processId = proc.id;
        this.refreshSummary();
        this.currentView = 'onboarding';
      },
      error: (err) => this.handleError(err)
    });
  }

  refreshSummary() {
    if (this.isLocalMock) {
      this.resolveLocalState();
      return;
    }
    this.http.get<OnboardingSummary>(`${this.apiBaseUrl}/onboarding/${this.processId}/summary`).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loadNotifications();
      },
      error: (err) => this.handleError(err)
    });
  }


  submitPersonalData() {
    if (this.isLocalMock) {
      this.summary.steps[1].status = 'COMPLETED';
      this.summary.steps[2].status = 'IN_PROGRESS';
      this.addLocalNotification('Paso 1 Completado: Datos personales guardados.', 'SUCCESS');
      this.refreshSummary();
    } else {
      this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/personal-data`, this.personalData).subscribe({
        next: () => {
          this.addLocalNotification('Datos personales guardados en backend.', 'SUCCESS');
          this.refreshSummary();
        },
        error: (err) => this.handleError(err)
      });
    }
  }


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 6 * 1024 * 1024; // 6MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (file.size > maxSize) {
      this.addLocalNotification('El archivo excede el límite permitido de 6 MB.', 'ERROR');
      event.target.value = '';
      this.selectedFile = null;
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      this.addLocalNotification('Formato de archivo no válido. Solo se admiten PDF, JPG, JPEG o PNG.', 'ERROR');
      event.target.value = '';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  uploadDocument() {
    if (!this.selectedFile) return;
    this.isUploadingDoc = true;

    if (this.isLocalMock) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('upload_preset', this.cloudinaryUploadPreset);

      this.http.post(`https://api.cloudinary.com/v1_1/${this.cloudinaryCloudName}/image/upload`, formData).subscribe({
        next: (res: any) => {
          this.isUploadingDoc = false;
          this.uploadedDocs.push({
            type: this.selectedDocType,
            filename: this.selectedFile ? this.selectedFile.name : 'doc_id.pdf',
            fileUrl: res.secure_url
          });
          this.summary.steps[2].status = 'IN_REVIEW';
          this.addLocalNotification(`Documento '${this.selectedDocType}' subido con éxito a Cloudinary.`, 'SUCCESS');
          this.selectedFile = null;
          this.refreshSummary();
        },
        error: () => {
          // Graceful fallback to simulation if the Cloudinary preset is not configured yet
          this.isUploadingDoc = false;
          const filename = this.selectedFile ? this.selectedFile.name : 'doc_id.pdf';
          this.uploadedDocs.push({
            type: this.selectedDocType,
            filename: filename,
            fileUrl: 'https://res.cloudinary.com/demo/image/upload/' + filename
          });
          this.summary.steps[2].status = 'IN_REVIEW';
          this.addLocalNotification(`Documento '${this.selectedDocType}' subido (Simulación). Esperando aprobación.`, 'INFO');
          this.selectedFile = null;
          this.refreshSummary();
        }
      });
    } else {
      const formData = new FormData();
      formData.append('type', this.selectedDocType);
      formData.append('file', this.selectedFile);

      this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/documents`, formData).subscribe({
        next: () => {
          this.isUploadingDoc = false;
          this.selectedFile = null;
          this.addLocalNotification('Documento subido.', 'SUCCESS');
          this.refreshSummary();
        },
        error: (err) => {
          this.isUploadingDoc = false;
          this.handleError(err);
        }
      });
    }
  }


  signContract() {
    this.isSigningContract = true;
    setTimeout(() => {
      this.isSigningContract = false;
      this.signedContractUrl = 'https://res.cloudinary.com/demo/contract/signed_contract_doe.pdf';

      if (this.isLocalMock) {
        this.summary.steps[3].status = 'COMPLETED';
        this.summary.steps[4].status = 'IN_PROGRESS';
        this.addLocalNotification('Contrato firmado digitalmente.', 'SUCCESS');
        this.refreshSummary();
      } else {
        const mockBlob = new Blob(['signed contract'], { type: 'text/plain' });
        const mockFile = new File([mockBlob], 'signed_contract.txt');
        const formData = new FormData();
        formData.append('file', mockFile);

        this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/contract/sign`, formData).subscribe({
          next: () => {
            this.addLocalNotification('Contrato enviado y firmado.', 'SUCCESS');
            this.refreshSummary();
          },
          error: (err) => this.handleError(err)
        });
      }
    }, 1500);
  }

  savePaymentMethod() {
    if (this.isLocalMock) {
      this.summary.steps[4].status = 'COMPLETED';
      this.summary.steps[5].status = 'IN_PROGRESS';
      this.addLocalNotification('Método de pago configurado con éxito.', 'SUCCESS');
      this.refreshSummary();
    } else {
      this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/payment-method`, {
        provider: this.paymentMethod.provider,
        data: this.paymentMethod
      }).subscribe({
        next: () => {
          this.addLocalNotification('Método de pago guardado.', 'SUCCESS');
          this.refreshSummary();
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  startIdentityScanning() {
    this.isScanningIdentity = true;
    this.scanProgress = 0;
    const interval = setInterval(() => {
      this.scanProgress += 10;
      if (this.scanProgress >= 100) {
        clearInterval(interval);
        this.isScanningIdentity = false;

        if (this.isLocalMock) {
          if (this.scanSuccess) {
            this.summary.steps[5].status = 'COMPLETED';
            this.summary.status = 'COMPLETED';
            this.addLocalNotification('Identidad verificada biométricamente. ¡Onboarding completado!', 'SUCCESS');
          } else {
            this.summary.steps[5].status = 'REJECTED';
            this.addLocalNotification('Fallo en escáner facial. Por favor intente nuevamente.', 'ERROR');
          }
          this.refreshSummary();
        } else {
          this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/identity-verification?provider=${this.identityProvider}&success=${this.scanSuccess}`, {}).subscribe({
            next: () => {
              this.addLocalNotification('Verificación biométrica procesada.', 'SUCCESS');
              this.refreshSummary();
            },
            error: (err) => this.handleError(err)
          });
        }
      }
    }, 300);
  }

  loadOperatorPanel() {
    this.currentView = 'operator';

    const currentName = this.personalData.firstName ? `${this.personalData.firstName} ${this.personalData.lastName}` : 'Juan Pérez (Tú)';
    const currentCountry = this.personalData.country || 'España';
    const currentStatus = this.summary.steps[2].status === 'IN_REVIEW' ? 'IN_REVIEW' : this.summary.status;

    this.mockContractors = [
      { id: 500, name: currentName, country: currentCountry, email: this.invitationEmail, progress: this.summary.progress, status: this.paidContractorIds.includes(500) ? 'PAID' : currentStatus, date: '07/05/2026', currentStep: this.summary.currentStep || 'COMPLETED' },
      { id: 501, name: 'María Gómez', country: 'Colombia', email: 'maria.gomez@gmail.com', progress: 100, status: this.paidContractorIds.includes(501) ? 'PAID' : 'COMPLETED', date: '05/05/2026', currentStep: 'COMPLETED' },
      { id: 502, name: 'Pierre Dubois', country: 'Francia', email: 'pierre.dubois@yahoo.fr', progress: 20, status: this.paidContractorIds.includes(502) ? 'PAID' : 'IN_PROGRESS', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD' },
      { id: 503, name: 'Yuki Tanaka', country: 'Japón', email: 'tanaka.yuki@gmail.com', progress: 40, status: this.paidContractorIds.includes(503) ? 'PAID' : 'IN_REVIEW', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD' }
    ];

    if (this.isLocalMock) {
      this.operatorProcesses = [
        {
          id: 500,
          contractorUserId: 100,
          status: currentStatus,
          currentStep: this.summary.currentStep || 'COMPLETED',
          progress: this.summary.progress,
          assignedOperatorId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    } else {
      this.http.get<OnboardingProcess[]>(`${this.apiBaseUrl}/operator/processes`).subscribe({
        next: (procs) => this.operatorProcesses = procs,
        error: (err) => this.handleError(err)
      });
    }
  }

  reviewContractorStep(stepType: string, approved: boolean) {
    const feedbackMsg = approved ? 'Documentación válida y certificada.' : this.reviewFeedback || 'Faltan firmas o nitidez.';
    const stepId = 2;
    this.selectedProcessIdForReview = null;

    if (this.isLocalMock) {
      if (approved) {
        this.summary.steps[2].status = 'COMPLETED';
        this.summary.steps[3].status = 'IN_PROGRESS';
        this.addLocalNotification('Paso 2 APROBADO: Documentos aceptados por operaciones.', 'SUCCESS');
      } else {
        this.summary.steps[2].status = 'REJECTED';
        this.addLocalNotification('Paso 2 RECHAZADO: Se enviaron solicitudes de corrección.', 'ERROR');
      }
      this.reviewFeedback = '';
      this.refreshSummary();
      this.loadOperatorPanel();
    } else {
      this.http.post(`${this.apiBaseUrl}/operator/steps/${stepId}/review?operatorId=1`, {
        approved: approved,
        feedback: feedbackMsg
      }).subscribe({
        next: () => {
          this.addLocalNotification(`Paso de documentos revisado con éxito.`, 'SUCCESS');
          this.refreshSummary();
          this.loadOperatorPanel();
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  openPaymentModal(contractor: any) {
    this.selectedProcessForPayment = contractor;
    this.paymentAmount = 2500;
  }

  confirmPayment() {
    if (!this.selectedProcessForPayment) return;
    this.isProcessingPayment = true;

    setTimeout(() => {
      const c = this.selectedProcessForPayment;
      this.isProcessingPayment = false;
      this.selectedProcessForPayment = null;

      if (!this.paidContractorIds.includes(c.id)) {
        this.paidContractorIds.push(c.id);
      }
      const target = this.mockContractors.find(item => item.id === c.id);
      if (target) {
        target.status = 'PAID';
        target.paid = true;
      }

      const method = c.id === 500 ? this.paymentMethod.provider : 'BANK_TRANSFER';
      this.changeHistory.unshift(`Pago de $${this.paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD procesado y enviado a ${c.name} vía ${method}.`);
      this.addLocalNotification(`¡Pago de $${this.paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD enviado con éxito a ${c.name}!`, 'SUCCESS');
    }, 1500);
  }

  sendWhatsappCode() {
    this.isSendingWhatsapp = true;
    setTimeout(() => {
      this.isSendingWhatsapp = false;
      this.addLocalNotification('Redirigiendo a WhatsApp real...', 'INFO');
      this.whatsappCode = '123456';

      const cleanPhone = this.whatsappPhone.replace(/[^0-9]/g, '');
      const text = `¡Hola NorthPay! Confirmo mi identidad para el proceso de Onboarding. Mi código de activación de prueba es: 123456`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

      window.open(url, '_blank');
      this.addLocalNotification('Código de activación listo: escribe 123456 en pantalla.', 'SUCCESS');
    }, 1200);
  }

  verifyWhatsappCode() {
    this.isVerifyingWhatsapp = true;
    setTimeout(() => {
      this.isVerifyingWhatsapp = false;
      if (this.whatsappCode === '123456') {
        this.whatsappVerified = true;
        this.summary.steps[0].status = 'COMPLETED';
        this.summary.steps[1].status = 'IN_PROGRESS';
        this.addLocalNotification('WhatsApp verificado correctamente. ¡Onboarding desbloqueado!', 'SUCCESS');
        this.refreshSummary();
      } else {
        this.addLocalNotification('Código incorrecto. Intenta de nuevo.', 'ERROR');
      }
    }, 1200);
  }

  resolveLocalState() {
    let progress = 0;
    let currentStep: string | null = 'WHATSAPP_VERIFY';
    const blockingIssues: string[] = [];
    let canProceed = true;

    const s0 = this.summary.steps[0].status; // WHATSAPP_VERIFY
    const s1 = this.summary.steps[1].status; // PERSONAL_DATA
    const s2 = this.summary.steps[2].status; // DOCUMENT_UPLOAD
    const s3 = this.summary.steps[3].status; // CONTRACT_SIGN
    const s4 = this.summary.steps[4].status; // PAYMENT_METHOD
    const s5 = this.summary.steps[5].status; // IDENTITY_VERIFICATION

    if (s0 === 'COMPLETED') progress += 16;
    if (s1 === 'COMPLETED') progress += 16;
    if (s2 === 'COMPLETED') progress += 17;
    if (s3 === 'COMPLETED') progress += 17;
    if (s4 === 'COMPLETED') progress += 17;
    if (s5 === 'COMPLETED') progress += 17;

    if (s0 !== 'COMPLETED') {
      currentStep = 'WHATSAPP_VERIFY';
    } else if (s1 !== 'COMPLETED') {
      currentStep = 'PERSONAL_DATA';
    } else if (s2 !== 'COMPLETED') {
      currentStep = 'DOCUMENT_UPLOAD';
      if (s2 === 'IN_REVIEW') {
        canProceed = false;
        blockingIssues.push('Los documentos están siendo revisados por el equipo de operaciones.');
      } else if (s2 === 'REJECTED') {
        blockingIssues.push('Documentos rechazados. Vuelve a subir una copia clara de tu pasaporte.');
      }
    } else if (s3 !== 'COMPLETED') {
      currentStep = 'CONTRACT_SIGN';
    } else if (s4 !== 'COMPLETED') {
      currentStep = 'PAYMENT_METHOD';
    } else if (s5 !== 'COMPLETED') {
      currentStep = 'IDENTITY_VERIFICATION';
      if (s5 === 'REJECTED') {
        blockingIssues.push('Fallo en la verificación biométrica. Vuelve a escanear tu rostro.');
      }
    } else {
      currentStep = null;
    }

    this.summary.progress = progress;
    this.summary.currentStep = currentStep;
    this.summary.canProceed = canProceed;
    this.summary.blockingIssues = blockingIssues;

    if (progress === 100) {
      this.summary.status = 'COMPLETED';
    } else {
      this.summary.status = 'IN_PROGRESS';
    }
  }

  loadMockInitialState() {
    this.summary = {
      status: 'CREATED',
      currentStep: 'WHATSAPP_VERIFY',
      progress: 0,
      steps: [
        { type: 'WHATSAPP_VERIFY', status: 'IN_PROGRESS' },
        { type: 'PERSONAL_DATA', status: 'NOT_STARTED' },
        { type: 'DOCUMENT_UPLOAD', status: 'NOT_STARTED' },
        { type: 'CONTRACT_SIGN', status: 'NOT_STARTED' },
        { type: 'PAYMENT_METHOD', status: 'NOT_STARTED' },
        { type: 'IDENTITY_VERIFICATION', status: 'NOT_STARTED' }
      ],
      canProceed: true,
      blockingIssues: []
    };
  }

  addLocalNotification(message: string, type: string) {
    const newNotif: Notification = {
      id: Date.now(),
      userId: this.userId,
      message: message,
      type: type,
      isRead: false,
      createdAt: new Date().toLocaleTimeString()
    };
    this.notifications.unshift(newNotif);
  }

  getUnreadNotificationsCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }

  markAllNotificationsAsRead(event: Event) {
    event.stopPropagation();
    this.notifications.forEach(n => n.isRead = true);
    this.notifications = [];
    this.showNotificationDropdown = false;
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('northpay-theme', this.currentTheme);
    this.applyTheme();
    this.addLocalNotification(`Modo ${this.currentTheme === 'dark' ? 'Oscuro' : 'Claro'} activado.`, 'INFO');
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }

  startPreloadingSimulation() {
    const statusesMap: Record<string, string[]> = {
      es: [
        'Iniciando servicios seguros...',
        'Cargando firma digital DocuSeal...',
        'Estableciendo enlace de WhatsApp...',
        'Cargando motor biométrico KYC...',
        'Portal NorthPay listo para operar ⚡'
      ],
      en: [
        'Starting secure services...',
        'Loading DocuSeal digital signature...',
        'Establishing WhatsApp link...',
        'Loading KYC biometric engine...',
        'NorthPay Portal ready to operate ⚡'
      ],
      fr: [
        'Démarrage des services sécurisés...',
        'Chargement de la signature DocuSeal...',
        'Établissement du lien WhatsApp...',
        'Chargement du moteur biométrique...',
        'Portail NorthPay prêt à fonctionner ⚡'
      ],
      pt: [
        'Iniciando serviços seguros...',
        'Carregando assinatura DocuSeal...',
        'Estabelecendo link do WhatsApp...',
        'Carregando motor biométrico KYC...',
        'Portal NorthPay pronto para operar ⚡'
      ]
    };

    let step = 0;
    this.preloadProgress = 0;
    const interval = setInterval(() => {
      this.preloadProgress += 4;
      const currentList = statusesMap[this.selectedLang] || statusesMap['es'];
      if (this.preloadProgress % 20 === 0 && step < currentList.length - 1) {
        step++;
        this.preloadStatus = currentList[step];
      }
      if (this.preloadProgress >= 100) {
        this.preloadProgress = 100;
        this.preloadStatus = currentList[currentList.length - 1];
        clearInterval(interval);
      }
    }, 100);
  }

  changeLanguage(lang: string) {
    this.selectedLang = lang;
    const langNames: Record<string, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      pt: 'Português'
    };

    const statusesMap: Record<string, string[]> = {
      es: [
        'Iniciando servicios seguros...',
        'Cargando firma digital DocuSeal...',
        'Estableciendo enlace de WhatsApp...',
        'Cargando motor biométrico KYC...',
        'Portal NorthPay listo para operar ⚡'
      ],
      en: [
        'Starting secure services...',
        'Loading DocuSeal digital signature...',
        'Establishing WhatsApp link...',
        'Loading KYC biometric engine...',
        'NorthPay Portal ready to operate ⚡'
      ],
      fr: [
        'Démarrage des services sécurisés...',
        'Chargement de la signature DocuSeal...',
        'Établissement du lien WhatsApp...',
        'Chargement du moteur biométrique...',
        'Portail NorthPay prêt à fonctionner ⚡'
      ],
      pt: [
        'Iniciando serviços seguros...',
        'Carregando assinatura DocuSeal...',
        'Estabelecendo link do WhatsApp...',
        'Carregando motor biométrico KYC...',
        'Portal NorthPay pronto para operar ⚡'
      ]
    };

    const stepIndex = Math.min(Math.floor(this.preloadProgress / 20), 4);
    const list = statusesMap[lang] || statusesMap['es'];
    this.preloadStatus = list[stepIndex];

    const toastMsgs: Record<string, string> = {
      es: 'Idioma cambiado a Español (Simulación)',
      en: 'Language changed to English (Simulation)',
      fr: 'Langue changée en Français (Simulation)',
      pt: 'Idioma alterado para Português (Simulação)'
    };

    const msg = toastMsgs[lang] || toastMsgs['es'];
    this.addLocalNotification(msg, 'SUCCESS');
  }

  loadNotifications() {
    this.http.get<Notification[]>(`${this.apiBaseUrl}/notifications?userId=${this.userId}`).subscribe({
      next: (notifs) => this.notifications = notifs,
      error: () => { }
    });
  }

  markNotificationRead(id: number) {
    if (this.isLocalMock) {
      this.notifications = this.notifications.filter(n => n.id !== id);
    } else {
      this.http.post(`${this.apiBaseUrl}/notifications/${id}/read`, {}).subscribe({
        next: () => this.loadNotifications()
      });
    }
  }

  handleError(err: any) {
    console.error('[NorthPay Error]', err);
    this.addLocalNotification('Error de conexión o validación en el servidor.', 'ERROR');
  }
}
