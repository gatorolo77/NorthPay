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

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent implements OnInit {
  currentView: 'welcome' | 'register' | 'onboarding' = 'welcome';
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

  notifications: Notification[] = [];

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
        console.log('[NorthPay] Running in Offline Local Simulation Mode.');
      }
    });
  }

  generateInvitation() {
    if (this.isLocalMock) {
      this.invitationToken = 'NP_INV_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      this.addLocalNotification('Invitación generada localmente. Usa el token para registrarte.', 'INFO');
      this.currentView = 'register';
    } else {
      this.http.post<any>(`${this.apiBaseUrl}/operator/invitation?email=${this.invitationEmail}`, {}).subscribe({
        next: (res) => {
          this.invitationToken = res.token;
          this.addLocalNotification('Invitación enviada con éxito.', 'SUCCESS');
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
      this.http.post<any>(`${this.apiBaseUrl}/auth/register`, {
        token: this.invitationToken,
        password: this.registerPassword
      }).subscribe({
        next: (res) => {
          this.userId = res.userId;
          this.processId = res.processId;
          this.addLocalNotification('Cuenta creada correctamente.', 'SUCCESS');
          this.refreshSummary();
          this.currentView = 'onboarding';
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  refreshSummary() {
    if (this.isLocalMock) {
      this.resolveLocalState();
    } else {
      this.http.get<OnboardingSummary>(`${this.apiBaseUrl}/onboarding/${this.processId}/summary`).subscribe({
        next: (sum) => this.summary = sum,
        error: (err) => this.handleError(err)
      });
    }
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
    if (!this.selectedFile) return;
    this.isUploadingDoc = true;

    setTimeout(() => {
      this.isUploadingDoc = false;
      const fakeUrl = 'https://res.cloudinary.com/demo/image/upload/sample_id.pdf';
      this.uploadedDocs.push({
        type: this.selectedDocType,
        filename: this.selectedFile?.name || 'document.pdf',
        fileUrl: fakeUrl
      });
      this.selectedFile = null;

      if (this.isLocalMock) {
        this.summary.steps[1].status = 'IN_REVIEW';
        this.addLocalNotification('Documentos subidos a Cloudinary. Pendiente de aprobación legal.', 'INFO');
        this.refreshSummary();
      } else {
        this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/documents`, {
          documentType: this.selectedDocType,
          fileUrl: fakeUrl
        }).subscribe({
          next: () => {
            this.addLocalNotification('Documentos cargados. Pendiente de validación.', 'SUCCESS');
            this.refreshSummary();
          },
          error: (err) => this.handleError(err)
        });
      }
    }, 1500);
  }

  signContract() {
    this.isSigningContract = true;
    setTimeout(() => {
      this.isSigningContract = false;
      this.signedContractUrl = 'https://res.cloudinary.com/demo/contract/signed_contract_doe.pdf';

      if (this.isLocalMock) {
        this.summary.steps[2].status = 'COMPLETED';
        this.summary.steps[3].status = 'IN_PROGRESS';
        this.addLocalNotification('Contrato firmado y certificado digitalmente.', 'SUCCESS');
        this.refreshSummary();
      } else {
        this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/contract/sign`, {
          signedContractUrl: this.signedContractUrl
        }).subscribe({
          next: () => {
            this.addLocalNotification('Contrato firmado exitosamente.', 'SUCCESS');
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
      this.scanProgress += 20;
      if (this.scanProgress >= 100) {
        clearInterval(interval);
        this.isScanningIdentity = false;

        if (this.isLocalMock) {
          if (this.scanSuccess) {
            this.summary.steps[4].status = 'COMPLETED';
            this.addLocalNotification('Verificación biométrica certificada con éxito.', 'SUCCESS');
          } else {
            this.summary.steps[4].status = 'REJECTED';
            this.addLocalNotification('Autenticación fallida. El rostro no coincide.', 'ERROR');
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

    if (s0 === 'NOT_STARTED' || s0 === 'IN_PROGRESS') {
      currentStep = 'PERSONAL_DATA';
    } else if (s1 === 'NOT_STARTED' || s1 === 'IN_PROGRESS' || s1 === 'IN_REVIEW' || s1 === 'REJECTED') {
      currentStep = 'DOCUMENT_UPLOAD';
      if (s1 === 'IN_REVIEW') {
        canProceed = false;
        blockingIssues.push('Tu pasaporte e identificación fiscal están siendo validados por operaciones.');
      } else if (s1 === 'REJECTED') {
        canProceed = false;
        blockingIssues.push('Tus documentos fueron rechazados por nitidez. Sube una copia a color.');
      }
    } else if (s2 === 'NOT_STARTED' || s2 === 'IN_PROGRESS') {
      currentStep = 'CONTRACT_SIGN';
    } else if (s3 === 'NOT_STARTED' || s3 === 'IN_PROGRESS') {
      currentStep = 'PAYMENT_METHOD';
    } else if (s4 === 'NOT_STARTED' || s4 === 'IN_PROGRESS' || s4 === 'REJECTED') {
      currentStep = 'IDENTITY_VERIFICATION';
      if (s4 === 'REJECTED') {
        canProceed = false;
        blockingIssues.push('Error biométrico. Vuelve a escanear tu rostro con mejor iluminación.');
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

  addLocalNotification(message: string, type: string) {
    const newNotif: Notification = {
      id: Date.now(),
      userId: this.userId,
      message: message,
      type: type,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(newNotif);
  }

  markNotificationRead(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  handleError(err: any) {
    console.error('[NorthPay] API Error:', err);
    this.addLocalNotification(err.error?.message || 'Error de conexión con el servidor.', 'ERROR');
  }
}
