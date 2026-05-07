import { Component, OnInit } from '@angular/core';
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
  currentView: 'welcome' | 'register' | 'onboarding' | 'operator' = 'welcome';
  apiBaseUrl = 'http://localhost:8080/api';
  isLocalMock = true;

  invitationToken = '';
  invitationEmail = 'contractor@northpay.com';
  registerPassword = 'password123';
  loginEmail = 'contractor@northpay.com';
  loginPassword = 'password123';
  userId = 1;
  processId = 1;

  summary: OnboardingSummary = {
    status: 'CREATED',
    currentStep: 'PERSONAL_DATA',
    progress: 0,
    steps: [
      { type: 'PERSONAL_DATA', status: 'NOT_STARTED' },
      { type: 'DOCUMENT_UPLOAD', status: 'NOT_STARTED' },
      { type: 'CONTRACT_SIGN', status: 'NOT_STARTED' },
      { type: 'PAYMENT_METHOD', status: 'NOT_STARTED' },
      { type: 'IDENTITY_VERIFICATION', status: 'NOT_STARTED' }
    ],
    canProceed: true,
    blockingIssues: []
  };

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

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.testBackendConnection();
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
        this.addLocalNotification('Modo Simulación Activo (Servidor Spring Boot fuera de línea)', 'INFO');
        this.loadMockInitialState();
      }
    });
  }


  generateInvitation() {
    if (this.isLocalMock) {
      this.invitationToken = 'NP_INV_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      this.addLocalNotification(`Invitación creada localmente para ${this.invitationEmail}`, 'SUCCESS');
      this.currentView = 'register';
    } else {
      this.http.post(`${this.apiBaseUrl}/invitations/send`, {
        email: this.invitationEmail,
        operatorId: 1
      }).subscribe({
        next: (res: any) => {
          this.invitationToken = res.token;
          this.addLocalNotification(`Invitación enviada por backend para ${this.invitationEmail}`, 'SUCCESS');
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
      this.addLocalNotification('Usuario registrado con éxito (Local)', 'SUCCESS');
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
          this.addLocalNotification('Registrado correctamente via backend', 'SUCCESS');
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
      this.summary.steps[0].status = 'COMPLETED';
      this.summary.steps[1].status = 'IN_PROGRESS';
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
    this.selectedFile = event.target.files[0];
  }

  uploadDocument() {
    if (this.isLocalMock) {
      this.isUploadingDoc = true;
      setTimeout(() => {
        this.isUploadingDoc = false;
        const filename = this.selectedFile ? this.selectedFile.name : 'doc_id.pdf';
        this.uploadedDocs.push({
          type: this.selectedDocType,
          filename: filename,
          fileUrl: 'https://res.cloudinary.com/demo/document/temp/' + filename
        });
        this.summary.steps[1].status = 'IN_REVIEW';
        this.addLocalNotification(`Documento '${this.selectedDocType}' subido. Esperando aprobación del operador.`, 'INFO');
        this.selectedFile = null;
        this.refreshSummary();
      }, 1500);
    } else {
      if (!this.selectedFile) return;
      const formData = new FormData();
      formData.append('type', this.selectedDocType);
      formData.append('file', this.selectedFile);

      this.isUploadingDoc = true;
      this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/documents`, formData).subscribe({
        next: () => {
          this.isUploadingDoc = false;
          this.selectedFile = null;
          this.addLocalNotification('Documento subido con éxito al backend.', 'SUCCESS');
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
        this.summary.steps[2].status = 'COMPLETED';
        this.summary.steps[3].status = 'IN_PROGRESS';
        this.addLocalNotification('Contrato firmado digitalmente.', 'SUCCESS');
        this.refreshSummary();
      } else {
        // Mock a file for multipart sign
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
      this.summary.steps[3].status = 'COMPLETED';
      this.summary.steps[4].status = 'IN_PROGRESS';
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
            this.summary.steps[4].status = 'COMPLETED';
            this.summary.status = 'COMPLETED';
            this.addLocalNotification('Identidad verificada biométricamente. ¡Onboarding completado!', 'SUCCESS');
          } else {
            this.summary.steps[4].status = 'REJECTED';
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

    const currentName = this.personalData.firstName ? `${this.personalData.firstName} ${this.personalData.lastName} (Tú)` : 'Juan Pérez (Tú)';
    const currentCountry = this.personalData.country || 'España';
    const currentStatus = this.summary.steps[1].status === 'IN_REVIEW' ? 'IN_REVIEW' : this.summary.status;

    this.mockContractors = [
      { id: 500, name: currentName, country: currentCountry, email: this.invitationEmail, progress: this.summary.progress, status: currentStatus, date: '07/05/2026', currentStep: this.summary.currentStep || 'COMPLETED' },
      { id: 501, name: 'María Gómez', country: 'Colombia', email: 'maria.gomez@gmail.com', progress: 100, status: 'COMPLETED', date: '05/05/2026', currentStep: 'COMPLETED' },
      { id: 502, name: 'Pierre Dubois', country: 'Francia', email: 'pierre.dubois@yahoo.fr', progress: 20, status: 'IN_PROGRESS', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD' },
      { id: 503, name: 'Yuki Tanaka', country: 'Japón', email: 'tanaka.yuki@gmail.com', progress: 40, status: 'IN_REVIEW', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD' }
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
    const stepId = 2; // Simulated ID
    this.selectedProcessIdForReview = null;

    if (this.isLocalMock) {
      if (approved) {
        this.summary.steps[1].status = 'COMPLETED';
        this.summary.steps[2].status = 'IN_PROGRESS';
        this.addLocalNotification('Paso 2 APROBADO: Documentos aceptados por operaciones.', 'SUCCESS');
      } else {
        this.summary.steps[1].status = 'REJECTED';
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

      // Update contractor state to PAID in mockContractors
      const target = this.mockContractors.find(item => item.id === c.id);
      if (target) {
        target.status = 'PAID';
        target.paid = true;
      }

      const method = c.id === 500 ? this.paymentMethod.provider : 'BANK_TRANSFER';
      this.changeHistory.unshift(`Pago de $${this.paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD procesado y enviado a ${c.name} vía ${method}.`);
      this.addLocalNotification(`¡Pago de $${this.paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD enviado con éxito a ${c.name}! 💸`, 'SUCCESS');
    }, 1500);
  }

  resolveLocalState() {
    let progress = 0;
    let currentStep: string | null = 'PERSONAL_DATA';
    const blockingIssues: string[] = [];
    let canProceed = true;

    const s0 = this.summary.steps[0].status;
    const s1 = this.summary.steps[1].status;
    const s2 = this.summary.steps[2].status;
    const s3 = this.summary.steps[3].status;
    const s4 = this.summary.steps[4].status;

    if (s0 === 'COMPLETED') progress += 20;
    if (s1 === 'COMPLETED') progress += 20;
    if (s2 === 'COMPLETED') progress += 20;
    if (s3 === 'COMPLETED') progress += 20;
    if (s4 === 'COMPLETED') progress += 20;

    if (s0 !== 'COMPLETED') {
      currentStep = 'PERSONAL_DATA';
    } else if (s1 !== 'COMPLETED') {
      currentStep = 'DOCUMENT_UPLOAD';
      if (s1 === 'IN_REVIEW') {
        canProceed = false;
        blockingIssues.push('Los documentos están siendo revisados por el equipo de operaciones.');
      } else if (s1 === 'REJECTED') {
        blockingIssues.push('Documentos rechazados. Vuelve a subir una copia clara de tu pasaporte.');
      }
    } else if (s2 !== 'COMPLETED') {
      currentStep = 'CONTRACT_SIGN';
    } else if (s3 !== 'COMPLETED') {
      currentStep = 'PAYMENT_METHOD';
    } else if (s4 !== 'COMPLETED') {
      currentStep = 'IDENTITY_VERIFICATION';
      if (s4 === 'REJECTED') {
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
      currentStep: 'PERSONAL_DATA',
      progress: 0,
      steps: [
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
