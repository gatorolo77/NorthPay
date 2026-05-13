import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() isLocalMock = true;
  @Input() selectedLang = 'es';
  @Input() whatsappPhone = '';

  dashboardTranslations: Record<string, Record<string, string>> = {
    es: {
      opTitle: "Panel de Operaciones de NorthPay",
      opDesc: "Monitoreo en tiempo real de los procesos de activación de contratistas internacionales.",
      active: "Contratistas Activos",
      avgTime: "Tiempo de Activación",
      days: "2.4 Días",
      inReview: "En Revisión",
      completed: "Completados",
      all: "Todos",
      inProgress: "En Progreso",
      onbProcs: "Procesos de Onboarding",
      country: "País",
      email: "Correo",
      started: "Iniciado",
      progLabel: "Progreso Onboarding",
      paid: "Pagado",
      revDocs: "Revisar Documentos",
      emitPay: "Emitir Pago",
      paySent: "✓ Nómina Enviada",
      onbProc: "Onboarding en proceso",
      noFound: "No se encontraron contratistas en este estado.",
      revTitle: "Revisar Documentos de Contratista",
      revInst: "Por favor valida que el documento cargado concuerda con los datos personales del contratista legal.",
      extData: "DATOS EXTRAÍDOS DEL DOCUMENTO:",
      names: "Nombres",
      lasts: "Apellidos",
      docType: "Tipo Documento",
      viewFile: "VER ARCHIVO EN CLOUDINARY",
      comments: "COMENTARIOS / FEEDBACK (SI SE RECHAZA)",
      placeholderFeed: "Ej. El pasaporte está borroso o incompleto...",
      rejectBtn: "Solicitar Corrección (Rechazar)",
      approveBtn: "Aprobar Documento",
      auditTitle: "Historial de Cambios / Registro de Auditoría",
      confPayTitle: "Confirmar Envío de Fondos",
      confPayDesc: "Estás a punto de procesar la nómina/pago para este contratista remoto certificado. Revisa la liquidación detallada:",
      bene: "Beneficiario",
      dest: "País / Destino",
      payMethod: "Método de Pago",
      amount: "MONTO A TRANSFERIR (USD)",
      cancel: "Cancelar",
      transferring: "Transfiriendo..."
    },
    en: {
      opTitle: "NorthPay Operator Panel",
      opDesc: "Real-time monitoring of international contractor activation processes.",
      active: "Active Contractors",
      avgTime: "Activation Time",
      days: "2.4 Days",
      inReview: "In Review",
      completed: "Completed",
      all: "All",
      inProgress: "In Progress",
      onbProcs: "Onboarding Processes",
      country: "Country",
      email: "Email",
      started: "Started",
      progLabel: "Onboarding Progress",
      paid: "Paid",
      revDocs: "Review Documents",
      emitPay: "Emit Payment",
      paySent: "✓ Payroll Sent",
      onbProc: "Onboarding in progress",
      noFound: "No contractors found in this status.",
      revTitle: "Review Contractor Documents",
      revInst: "Please validate that the uploaded document matches the legal contractor's personal data.",
      extData: "DATA EXTRACTED FROM DOCUMENT:",
      names: "First Names",
      lasts: "Last Names",
      docType: "Document Type",
      viewFile: "VIEW FILE IN CLOUDINARY",
      comments: "COMMENTS / FEEDBACK (IF REJECTED)",
      placeholderFeed: "E.g., The passport is blurry or incomplete...",
      rejectBtn: "Request Correction (Reject)",
      approveBtn: "Approve Document",
      auditTitle: "Change History / Audit Log",
      confPayTitle: "Confirm Fund Transfer",
      confPayDesc: "You are about to process payroll/payment for this certified remote contractor. Review detailed settlement:",
      bene: "Beneficiary",
      dest: "Country / Destination",
      payMethod: "Payment Method",
      amount: "AMOUNT TO TRANSFER (USD)",
      cancel: "Cancel",
      transferring: "Transferring..."
    },
    fr: {
      opTitle: "Panneau des Opérations NorthPay",
      opDesc: "Suivi en temps réel des processus d'activation des sous-traitants internationaux.",
      active: "Sous-traitants Actifs",
      avgTime: "Temps d'Activation",
      days: "2.4 Jours",
      inReview: "En Révision",
      completed: "Terminés",
      all: "Tous",
      inProgress: "En cours",
      onbProcs: "Processus d'Intégration",
      country: "Pays",
      email: "E-mail",
      started: "Commencé",
      progLabel: "Progrès de l'Intégration",
      paid: "Payé",
      revDocs: "Examiner les Documents",
      emitPay: "Émettre le Paiement",
      paySent: "✓ Paie Envoyée",
      onbProc: "Intégration en cours",
      noFound: "Aucun sous-traitant trouvé dans cet état.",
      revTitle: "Examiner les Documents du Sous-traitant",
      revInst: "Veuillez valider que le document téléchargé correspond aux données personnelles du sous-traitant légal.",
      extData: "DONNÉES EXTRAITES DU DOCUMENT :",
      names: "Prénoms",
      lasts: "Noms",
      docType: "Type de Document",
      viewFile: "VOIR LE FICHIER SUR CLOUDINARY",
      comments: "COMMENTAIRES / RETOURS (SI REJETÉ)",
      placeholderFeed: "Ex. Le passeport est flou ou incomplet...",
      rejectBtn: "Demander Correction (Rejeter)",
      approveBtn: "Approuver le Document",
      auditTitle: "Historique des Modifications / Journal d'Audit",
      confPayTitle: "Confirmer l'Envoi des Fonds",
      confPayDesc: "Vous êtes sur le point de traiter la paie/le paiement de ce sous-traitant à distance certifié. Consultez le décompte détaillé :",
      bene: "Bénéficiaire",
      dest: "Pays / Destination",
      payMethod: "Mode de Paiement",
      amount: "MONTANT À TRANSFÉRER (USD)",
      cancel: "Annuler",
      transferring: "Transfert en cours..."
    },
    pt: {
      opTitle: "Painel de Operações NorthPay",
      opDesc: "Monitoramento em tempo real dos processos de ativação de prestadores internacionais.",
      active: "Prestadores Ativos",
      avgTime: "Tempo de Ativação",
      days: "2.4 Dias",
      inReview: "Em Análise",
      completed: "Concluídos",
      all: "Todos",
      inProgress: "Em progresso",
      onbProcs: "Processos de Integração",
      country: "País",
      email: "E-mail",
      started: "Iniciado",
      progLabel: "Progresso da Integração",
      paid: "Pago",
      revDocs: "Revisar Documentos",
      emitPay: "Emitir Pagamento",
      paySent: "✓ Pagamento Enviado",
      onbProc: "Integração em progresso",
      noFound: "Nenhum prestador encontrado neste status.",
      revTitle: "Revisar Documentos do Prestador",
      revInst: "Por favor, valide se o documento enviado corresponde aos dados pessoais do prestador legal.",
      extData: "DADOS EXTRAÍDOS DO DOCUMENTO:",
      names: "Nomes",
      lasts: "Sobrenomes",
      docType: "Tipo de Documento",
      viewFile: "VER ARQUIVO NO CLOUDINARY",
      comments: "COMENTÁRIOS / FEEDBACK (SE REJEITADO)",
      placeholderFeed: "Ex. O passaporte está embaçado ou incompleto...",
      rejectBtn: "Solicitar Correção (Rejeitar)",
      approveBtn: "Aprovar Documento",
      auditTitle: "Histórico de Alterações / Registro de Auditoria",
      confPayTitle: "Confirmar Envio de Fundos",
      confPayDesc: "Você está prestes a processar o pagamento para este prestador remoto certificado. Revise o detalhamento:",
      bene: "Beneficiário",
      dest: "País / Destino",
      payMethod: "Forma de Pagamento",
      amount: "VALOR A TRANSFERIR (USD)",
      cancel: "Cancelar",
      transferring: "Transferindo..."
    },
    zh: {
      opTitle: "NorthPay 运营商面板",
      opDesc: "实时监控国际承包商的激活流程。",
      active: "活跃承包商",
      avgTime: "激活时间",
      days: "2.4 天",
      inReview: "审核中",
      completed: "已完成",
      all: "全部",
      inProgress: "进行中",
      onbProcs: "入职流程",
      country: "国家",
      email: "电子邮件",
      started: "已开始",
      progLabel: "入职进度",
      paid: "已支付",
      revDocs: "审核文档",
      emitPay: "发放付款",
      paySent: "✓ 薪资已发送",
      onbProc: "正在进行入职",
      noFound: "在此状态下未找到承包商。",
      revTitle: "审核承包商文档",
      revInst: "请验证上传的文档是否与法定承包商的个人资料相符。",
      extData: "从文档中提取的数据：",
      names: "名字",
      lasts: "姓氏",
      docType: "文档类型",
      viewFile: "在 CLOUDINARY 中查看文件",
      comments: "意见 / 反馈（如果拒绝）",
      placeholderFeed: "例如：护照模糊或不完整...",
      rejectBtn: "请求更正（拒绝）",
      approveBtn: "批准文档",
      auditTitle: "变更历史 / 审计日志",
      confPayTitle: "确认资金转账",
      confPayDesc: "您即将为这位获得认证的远程承包商处理薪资/付款。请查看详细的结算信息：",
      bene: "收款人",
      dest: "国家 / 目的地",
      payMethod: "付款方式",
      amount: "转账金额 (USD)",
      cancel: "取消",
      transferring: "正在转账..."
    },
    it: {
      opTitle: "Pannello Operativo NorthPay",
      opDesc: "Monitoraggio in tempo reale dei processi di attivazione dei collaboratori internazionali.",
      active: "Collaboratori Attivi",
      avgTime: "Tempo di Attivazione",
      days: "2.4 Giorni",
      inReview: "In Revisione",
      completed: "Completati",
      all: "Tutti",
      inProgress: "In corso",
      onbProcs: "Processi di Onboarding",
      country: "Paese",
      email: "E-mail",
      started: "Iniziato",
      progLabel: "Progresso Onboarding",
      paid: "Pagato",
      revDocs: "Esamina Documenti",
      emitPay: "Emetti Pagamento",
      paySent: "✓ Pagamento Inviato",
      onbProc: "Onboarding in corso",
      noFound: "Nessun collaboratore trovato in questo stato.",
      revTitle: "Esamina Documenti Collaboratore",
      revInst: "Si prega di verificare che il documento caricato corrisponda ai dati personali del collaboratore legale.",
      extData: "DATI ESTRATTI DAL DOCUMENTO:",
      names: "Nomi",
      lasts: "Cognomi",
      docType: "Tipo di Documento",
      viewFile: "VEDI FILE SU CLOUDINARY",
      comments: "COMMENTI / FEEDBACK (IN CASO DI RIFIUTO)",
      placeholderFeed: "Es. Il passaporte è sfocato o incompleto...",
      rejectBtn: "Richiedi Correzione (Rifiuta)",
      approveBtn: "Approva Documento",
      auditTitle: "Cronologia Modifiche / Registro di Audit",
      confPayTitle: "Conferma Invio Fondi",
      confPayDesc: "Stai per elaborare il pagamento per questo collaboratore da remoto certificato. Controlla il prospetto dettagliato:",
      bene: "Beneficiario",
      dest: "Paese / Destinazione",
      payMethod: "Metodo di Pagamento",
      amount: "IMPORTO DA TRASFERIRE (USD)",
      cancel: "Annulla",
      transferring: "Trasferimento in corso..."
    }
  };


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
  @Input() paidContractorIds: number[] = [];

  @Output() reviewCompleted = new EventEmitter<void>();
  @Output() paymentCompleted = new EventEmitter<number>();


  // Reused personalData fallback for simulation details inside review box
  @Input() personalData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+34 600 000 000',
    country: 'España'
  };

  // Reused local state fallback
  @Input() summary: OnboardingSummary = {
    status: 'IN_PROGRESS',
    currentStep: 'DOCUMENT_UPLOAD',
    progress: 32,
    steps: [
      { type: 'WHATSAPP_VERIFY', status: 'COMPLETED' },
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
      { id: 500, name: 'Juan Pérez', country: 'España', email: 'contractor@northpay.com', progress: this.summary.progress, status: this.paidContractorIds.includes(500) ? 'PAID' : (this.summary.steps[2].status === 'IN_REVIEW' ? 'IN_REVIEW' : this.summary.status), date: '07/05/2026', currentStep: this.summary.currentStep || 'COMPLETED', phone: this.whatsappPhone || '+34600123456' },
      { id: 501, name: 'María Gómez', country: 'Colombia', email: 'maria.gomez@gmail.com', progress: 100, status: this.paidContractorIds.includes(501) ? 'PAID' : 'COMPLETED', date: '05/05/2026', currentStep: 'COMPLETED', phone: '+573001234567' },
      { id: 502, name: 'Pierre Dubois', country: 'Francia', email: 'pierre.dubois@yahoo.fr', progress: 20, status: this.paidContractorIds.includes(502) ? 'PAID' : 'IN_PROGRESS', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD', phone: '+33612345678' },
      { id: 503, name: 'Yuki Tanaka', country: 'Japón', email: 'tanaka.yuki@gmail.com', progress: 40, status: this.paidContractorIds.includes(503) ? 'PAID' : 'IN_REVIEW', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD', phone: '+819012345678' }
    ];

    if (this.isLocalMock) {
      this.operatorProcesses = [
        {
          id: 500,
          contractorUserId: 100,
          status: this.summary.steps[2].status === 'IN_REVIEW' ? 'IN_REVIEW' : this.summary.status,
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
        this.summary.steps[2].status = 'COMPLETED';
        this.summary.steps[3].status = 'IN_PROGRESS';
        this.summary.progress = 49;
        this.summary.currentStep = 'CONTRACT_SIGN';
        this.changeHistory.unshift('Paso 2 APROBADO: Documentos aceptados por operaciones.');
      } else {
        this.summary.steps[2].status = 'REJECTED';
        this.changeHistory.unshift('Paso 2 RECHAZADO: Solicitud de corrección enviada.');
      }
      this.reviewFeedback = '';
      this.loadOperatorPanel();
      this.reviewCompleted.emit();
    } else {
      this.http.post(`${this.apiBaseUrl}/operator/steps/${stepId}/review?operatorId=1`, {
        approved: approved,
        feedback: feedbackMsg
      }).subscribe({
        next: () => {
          this.loadOperatorPanel();
          this.reviewCompleted.emit();
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
      
      // Notify the parent shell that payment occurred!
      this.paymentCompleted.emit(c.id);
    }, 1500);
  }

  openWhatsApp(phone: string) {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  }
}
