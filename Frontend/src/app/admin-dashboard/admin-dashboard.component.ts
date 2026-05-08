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
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  apiBaseUrl = 'http://localhost:8080/api';
  isLocalMock = true;

  operatorProcesses: OnboardingProcess[] = [];
  selectedProcessIdForReview: number | null = null;
  selectedProcessSummary: OnboardingSummary | null = null;
  reviewFeedback = '';

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

  // Reused personalData fallback for simulation details inside review box
  personalData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+34 600 000 000',
    country: 'España'
  };

  // Reused local state fallback
  summary: OnboardingSummary = {
    status: 'IN_PROGRESS',
    currentStep: 'DOCUMENT_UPLOAD',
    progress: 20,
    steps: [
      { type: 'PERSONAL_DATA', status: 'COMPLETED' },
      { type: 'DOCUMENT_UPLOAD', status: 'IN_REVIEW' },
      { type: 'CONTRACT_SIGN', status: 'NOT_STARTED' },
      { type: 'PAYMENT_METHOD', status: 'NOT_STARTED' },
      { type: 'IDENTITY_VERIFICATION', status: 'NOT_STARTED' }
    ],
    canProceed: true,
    blockingIssues: []
  };

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.testBackendConnection();
    this.loadOperatorPanel();
  }

  testBackendConnection() {
    this.http.get(`${this.apiBaseUrl}/onboarding/1/summary`).subscribe({
      next: () => {
        this.isLocalMock = false;
      },
      error: () => {
        this.isLocalMock = true;
      }
    });
  }

  loadOperatorPanel() {
    this.mockContractors = [
      { id: 500, name: 'Juan Pérez', country: 'España', email: 'contractor@northpay.com', progress: this.summary.progress, status: this.paidContractorIds.includes(500) ? 'PAID' : (this.summary.steps[1].status === 'IN_REVIEW' ? 'IN_REVIEW' : this.summary.status), date: '07/05/2026', currentStep: this.summary.currentStep || 'COMPLETED' },
      { id: 501, name: 'María Gómez', country: 'Colombia', email: 'maria.gomez@gmail.com', progress: 100, status: this.paidContractorIds.includes(501) ? 'PAID' : 'COMPLETED', date: '05/05/2026', currentStep: 'COMPLETED' },
      { id: 502, name: 'Pierre Dubois', country: 'Francia', email: 'pierre.dubois@yahoo.fr', progress: 20, status: this.paidContractorIds.includes(502) ? 'PAID' : 'IN_PROGRESS', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD' },
      { id: 503, name: 'Yuki Tanaka', country: 'Japón', email: 'tanaka.yuki@gmail.com', progress: 40, status: this.paidContractorIds.includes(503) ? 'PAID' : 'IN_REVIEW', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD' }
    ];

    if (this.isLocalMock) {
      this.operatorProcesses = [
        {
          id: 500,
          contractorUserId: 100,
          status: this.summary.steps[1].status === 'IN_REVIEW' ? 'IN_REVIEW' : this.summary.status,
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
        error: (err) => console.error(err)
      });
    }
  }

  getFilteredContractors() {
    if (this.operatorFilter === 'ALL') {
      return this.mockContractors;
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
    return this.mockContractors.filter(c => c.status === 'COMPLETED').length;
  }

  reviewContractorStep(stepType: string, approved: boolean) {
    const feedbackMsg = approved ? 'Documentación válida y certificada.' : this.reviewFeedback || 'Faltan firmas o nitidez.';
    const stepId = 2; // Simulated ID
    this.selectedProcessIdForReview = null;

    if (this.isLocalMock) {
      if (approved) {
        this.summary.steps[1].status = 'COMPLETED';
        this.summary.steps[2].status = 'IN_PROGRESS';
        this.summary.progress = 40;
        this.summary.currentStep = 'CONTRACT_SIGN';
        this.changeHistory.unshift('Paso 2 APROBADO: Documentos aceptados por operaciones.');
      } else {
        this.summary.steps[1].status = 'REJECTED';
        this.changeHistory.unshift('Paso 2 RECHAZADO: Solicitud de corrección enviada.');
      }
      this.reviewFeedback = '';
      this.loadOperatorPanel();
    } else {
      this.http.post(`${this.apiBaseUrl}/operator/steps/${stepId}/review?operatorId=1`, {
        approved: approved,
        feedback: feedbackMsg
      }).subscribe({
        next: () => {
          this.loadOperatorPanel();
        },
        error: (err) => console.error(err)
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

      // Update contractor state to PAID
      if (!this.paidContractorIds.includes(c.id)) {
        this.paidContractorIds.push(c.id);
      }
      const target = this.mockContractors.find(item => item.id === c.id);
      if (target) {
        target.status = 'PAID';
        target.paid = true;
      }

      this.changeHistory.unshift(`Pago de $${this.paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD procesado y enviado a ${c.name} vía transferencia bancaria.`);
    }, 1500);
  }
}
