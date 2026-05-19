import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

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
      transferring: "Transfiriendo...",
      auditEmpty: "Sin eventos de auditoría registrados aún en esta sesión.",
      auditApp: "Paso 2 APROBADO para {name}: Documentos aceptados.",
      auditRej: "Paso 2 RECHAZADO para {name}: Solicitud de corrección enviada.",
      auditPaid: "Pago de ${amount} USD procesado y enviado a {name} vía transferencia bancaria.",
      auditDel: "🗑️ Contratista {name} eliminado del panel de operaciones.",
      confirmDel: "¿Estás seguro de que deseas eliminar a {name}?",
      delModalTitle: "🛡️ Confirmación de Seguridad",
      delModalDesc: "Para proceder a borrar a {name}, escribe su número de WhatsApp verificado como factor de confirmación:",
      delError: "Acceso Denegado: El WhatsApp no coincide con los registros.",
      delConfirmBtn: "Eliminar Permanentemente"
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
      transferring: "Transferring...",
      auditEmpty: "No audit events recorded yet in this session.",
      auditApp: "Step 2 APPROVED for {name}: Documents accepted.",
      auditRej: "Step 2 REJECTED for {name}: Correction request sent.",
      auditPaid: "Payment of ${amount} USD processed and sent to {name} via bank transfer.",
      auditDel: "🗑️ Contractor {name} deleted from operator panel.",
      confirmDel: "Are you sure you want to delete {name}?",
      delModalTitle: "🛡️ Security Confirmation",
      delModalDesc: "To proceed with deleting {name}, type their verified WhatsApp number as a confirmation factor:",
      delError: "Access Denied: The WhatsApp does not match our records.",
      delConfirmBtn: "Permanently Delete"
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
      transferring: "Transfert en cours...",
      auditEmpty: "Aucun événement d'audit enregistré pour le moment dans cette session.",
      auditApp: "Étape 2 APPROUVÉE pour {name} : Documents acceptés.",
      auditRej: "Étape 2 REJETÉE pour {name} : Demande de correction envoyée.",
      auditPaid: "Paiement de ${amount} USD traité et envoyé à {name} par virement bancaire.",
      auditDel: "🗑️ Prestataire {name} supprimé du panneau d'opérations.",
      confirmDel: "Êtes-vous sûr de vouloir supprimer {name}?",
      delModalTitle: "🛡️ Confirmation de Sécurité",
      delModalDesc: "Pour procéder à la suppression de {name}, saisissez son numéro WhatsApp vérifié comme facteur de confirmation:",
      delError: "Accès Refusé: Le WhatsApp ne correspond pas aux enregistrements.",
      delConfirmBtn: "Supprimer Définitivement"
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
      transferring: "Transferindo...",
      auditEmpty: "Nenhum evento de auditoria registrado ainda nesta sessão.",
      auditApp: "Passo 2 APROVADO para {name}: Documentos aceitos.",
      auditRej: "Passo 2 REJEITADO para {name}: Solicitação de correção enviada.",
      auditPaid: "Pagamento de ${amount} USD processado e enviado para {name} por transferência bancária.",
      auditDel: "🗑️ Contratado {name} removido do painel de operações.",
      confirmDel: "Tem certeza que deseja excluir {name}?",
      delModalTitle: "🛡️ Confirmação de Segurança",
      delModalDesc: "Para prosseguir com a exclusão de {name}, digite seu WhatsApp verificado como fator de confirmação:",
      delError: "Acesso Negado: O WhatsApp não coincide com os registros.",
      delConfirmBtn: "Excluir Permanentemente"
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
      transferring: "正在转账...",
      auditEmpty: "本次会话尚未记录审计事件。",
      auditApp: "第 2 步已批准 {name}：文件已接受。",
      auditRej: "第 2 步已拒绝 {name}：更正请求已发送。",
      auditPaid: "向 {name} 支付的 ${amount} USD 已通过银行转账处理完毕。",
      auditDel: "🗑️ 承包商 {name} 已从运营商面板删除。",
      confirmDel: "您确定要删除 {name} 吗？",
      delModalTitle: "🛡️ 安全确认",
      delModalDesc: "要继续删除 {name}，请输入其验证过的 WhatsApp 号码作为确认因子：",
      delError: "访问被拒绝：WhatsApp 与记录不符。",
      delConfirmBtn: "永久删除"
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
      transferring: "Trasferimento in corso...",
      auditEmpty: "Nessun evento di audit registrato ancora in questa sessione.",
      auditApp: "Passo 2 APPROVATO per {name}: Documenti accettati.",
      auditRej: "Passo 2 RESPINTO per {name}: Richiesta di correzione inviata.",
      auditPaid: "Pagamento di ${amount} USD elaborato e inviato a {name} tramite bonifico bancario.",
      auditDel: "🗑️ Appaltatore {name} eliminato dal pannello operativo.",
      confirmDel: "Sei sicuro di voler eliminare {name}?",
      delModalTitle: "🛡️ Conferma di Sicurezza",
      delModalDesc: "Per procedere con l'eliminazione di {name}, digita il suo numero WhatsApp verificato come fattore di conferma:",
      delError: "Accesso Negato: Il WhatsApp non corrisponde ai registri.",
      delConfirmBtn: "Elimina Permanentemente"
    }
  };


  operatorProcesses: OnboardingProcess[] = [];
  selectedProcessIdForReview: number | null = null;
  selectedProcessSummary: OnboardingSummary | null = null;
  reviewFeedback = '';

  selectedContractorForDelete: any | null = null;
  inputWhatsappConfirm = '';

  selectedProcessForPayment: any | null = null;
  paymentAmount = 2500;
  isProcessingPayment = false;

  operatorFilter = 'ALL';
  changeHistory: string[] = [];
  mockContractors: any[] = [];
  @Input() paidContractorIds: number[] = [];

  @Output() reviewCompleted = new EventEmitter<void>();
  @Output() paymentCompleted = new EventEmitter<number>();
  @Input() isDemoMode = true;
  @Input() email = 'contractor@northpay.com';
  @Input() realProcessId: number | null = null;
  @Input() uploadedDocs: any[] = [];
  reviewDocuments: any[] = [];

  @Input() paymentMethod = {
    provider: 'BANK_TRANSFER',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    mpAliasOrCvu: '',
    mpAccountHolder: '',
    paypalEmail: '',
    paypalName: '',
    currency: 'USD',
    cryptoNetwork: 'TRC20',
    cryptoAddress: ''
  };

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
    this.http.get(`${this.apiBaseUrl}/auth/health`, { responseType: 'text' }).subscribe({
      next: () => {
        this.isLocalMock = false;
      },
      error: () => {
        this.isLocalMock = true;
      }
    });
  }

  loadOperatorPanel() {
    if (this.isDemoMode) {
      // 🔒 MODO DEMO: Lista de simulación persistente por sesión del componente
      const fullName = this.personalData.firstName ? `${this.personalData.firstName} ${this.personalData.lastName}` : 'Juan Pérez';
      const countryName = this.personalData.country || 'España';
      const emailAddr = this.email || 'contractor@northpay.com';

      if (!this.mockContractors || this.mockContractors.length === 0) {
        this.mockContractors = [
          { id: 500, name: fullName, country: countryName, email: emailAddr, progress: this.summary.progress, status: this.paidContractorIds.includes(500) ? 'PAID' : (this.summary.steps[2].status === 'IN_REVIEW' ? 'IN_REVIEW' : this.summary.status), date: '07/05/2026', currentStep: this.summary.currentStep || 'COMPLETED', phone: this.whatsappPhone || '+34600123456' },
          { id: 501, name: 'María Gómez', country: 'Colombia', email: 'maria.gomez@gmail.com', progress: 100, status: this.paidContractorIds.includes(501) ? 'PAID' : 'COMPLETED', date: '05/05/2026', currentStep: 'COMPLETED', phone: '+573001234567' },
          { id: 502, name: 'Pierre Dubois', country: 'Francia', email: 'pierre.dubois@yahoo.fr', progress: 20, status: this.paidContractorIds.includes(502) ? 'PAID' : 'IN_PROGRESS', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD', phone: '+33612345678' },
          { id: 503, name: 'Yuki Tanaka', country: 'Japón', email: 'tanaka.yuki@gmail.com', progress: 40, status: this.paidContractorIds.includes(503) ? 'PAID' : 'IN_REVIEW', date: '06/05/2026', currentStep: 'DOCUMENT_UPLOAD', phone: '+819012345678' }
        ];
      } else {
        // Sincronizamos dinámicamente los avances del contratista principal
        const mainContractor = this.mockContractors.find(c => c.id === 500);
        if (mainContractor) {
          mainContractor.name = fullName;
          mainContractor.country = countryName;
          mainContractor.email = emailAddr;
          mainContractor.progress = this.summary.progress;
          mainContractor.status = this.paidContractorIds.includes(500) ? 'PAID' : (this.summary.steps[2].status === 'IN_REVIEW' ? 'IN_REVIEW' : this.summary.status);
          mainContractor.currentStep = this.summary.currentStep || 'COMPLETED';
        }
      }

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
      // 🏢 MODO REAL: Conectando al backend Spring Boot en vivo!
      this.mockContractors = [];
      this.operatorProcesses = [];

      if (this.isLocalMock) {
        // En modo Sandbox sin Spring Boot en vivo, garantizamos que el contratista simulado actual
        // esté visible para poder realizar y probar los flujos de aprobación oficiales!
        const fullName = this.personalData.firstName ? `${this.personalData.firstName} ${this.personalData.lastName}` : 'Juan Pérez';
        this.mockContractors = [
          { 
            id: 500, 
            name: fullName, 
            country: this.personalData.country || 'España', 
            email: 'contractor@northpay.com', 
            progress: this.summary.progress, 
            status: this.paidContractorIds.includes(500) ? 'PAID' : (this.summary.steps[2].status === 'IN_REVIEW' ? 'IN_REVIEW' : this.summary.status), 
            date: new Date().toLocaleDateString(), 
            currentStep: this.summary.currentStep || 'COMPLETED', 
            phone: this.whatsappPhone || '+34600123456' 
          }
        ];

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
        // Consultamos los datos del servidor en vivo
        this.http.get<OnboardingProcess[]>(`${this.apiBaseUrl}/operator/processes`).subscribe({
          next: (procs) => {
            this.operatorProcesses = procs;
            // Mapeamos procesos reales de BD a la tabla de interfaz
            this.mockContractors = procs.map(p => {
              return {
                id: p.id,
                name: `Contratista #${p.contractorUserId}`,
                country: 'Cargando...',
                email: `user-${p.contractorUserId}@northpay.com`,
                progress: p.progress,
                status: this.paidContractorIds.includes(p.id) ? 'PAID' : p.status,
                date: new Date(p.createdAt).toLocaleDateString(),
                currentStep: p.currentStep,
                phone: ''
              };
            });
          },
          error: (err) => console.error('[NorthPay Real Mode Error]', err)
        });
      }
    }
  }

  getFilteredContractors() {
    if (this.operatorFilter === 'ALL') {
      return this.mockContractors;
    }
    if (this.operatorFilter === 'IN_PROGRESS') {
      // Retorna todo lo que no está completado formalmente
      return this.mockContractors.filter(c => 
        c.status === 'IN_PROGRESS' || 
        c.status === 'IN_REVIEW' || 
        c.status === 'CREATED' || 
        c.status === 'ACTION_REQUIRED'
      );
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
    return this.mockContractors.filter(c => c.status === 'COMPLETED').length;
  }

  getSelectedContractorForReview() {
    return this.mockContractors.find(c => c.id === this.selectedProcessIdForReview);
  }

  openReviewModal(processId: number) {
    this.selectedProcessIdForReview = processId;
    this.reviewDocuments = [];

    let targetProcessId = processId;
    if (processId === 500 && this.realProcessId) {
      targetProcessId = this.realProcessId;
    }

    if (this.isLocalMock) {
      if (processId === 500) {
        this.reviewDocuments = this.uploadedDocs;
      }
    } else {
      this.http.get<any[]>(`${this.apiBaseUrl}/operator/processes/${targetProcessId}/documents`).subscribe({
        next: (docs) => {
          this.reviewDocuments = docs;
        },
        error: (err) => {
          console.error('[NorthPay Review Docs Error]', err);
          // Fallback to local mock if request fails
          if (processId === 500) {
            this.reviewDocuments = this.uploadedDocs;
          }
        }
      });
    }
  }

  reviewContractorStep(stepType: string, approved: boolean) {
    const feedbackMsg = approved ? 'Documentación válida y certificada.' : this.reviewFeedback || 'Faltan firmas o nitidez.';
    
    const targetId = this.selectedProcessIdForReview;
    this.selectedProcessIdForReview = null;

    let targetProcessId = targetId;
    if (targetId === 500 && this.realProcessId) {
      targetProcessId = this.realProcessId;
    }

    if (this.isLocalMock) {
      const targetContractor = this.mockContractors.find(c => c.id === targetId);
      
      if (approved) {
        if (targetContractor) {
          targetContractor.status = 'COMPLETED';
          targetContractor.progress = 100;
          targetContractor.currentStep = 'COMPLETED';
        }
        const auditMsg = this.dashboardTranslations[this.selectedLang]['auditApp']
          .replace('{name}', targetContractor?.name || 'Contratista');
        this.changeHistory.unshift(auditMsg);
        
        // Si aprobamos al contratista actual del onboarding (Juan Pérez, ID 500), sincronizamos su progreso real!
        if (targetId === 500) {
          this.summary.steps[2].status = 'COMPLETED';
          this.summary.steps[3].status = 'IN_PROGRESS';
          this.summary.progress = 49;
          this.summary.currentStep = 'CONTRACT_SIGN';
        }
      } else {
        if (targetContractor) {
          targetContractor.status = 'IN_PROGRESS'; // O requiere ajustes
        }
        const auditMsg = this.dashboardTranslations[this.selectedLang]['auditRej']
          .replace('{name}', targetContractor?.name || 'Contratista');
        this.changeHistory.unshift(auditMsg);
        
        if (targetId === 500) {
          this.summary.steps[2].status = 'REJECTED';
        }
      }
      
      this.reviewFeedback = '';
      this.loadOperatorPanel(); // Refresca visualizaciones
      this.reviewCompleted.emit();
    } else {
      this.http.post(`${this.apiBaseUrl}/operator/processes/${targetProcessId}/steps/DOCUMENT_UPLOAD/review?operatorId=1`, {
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

  getContractorPaymentMethod(c: any): string {
    if (c.id === 500) {
      return this.paymentMethod.provider === 'CRYPTO' ? `CRYPTO (${this.paymentMethod.cryptoNetwork})` : this.paymentMethod.provider;
    }
    return 'BANK_TRANSFER';
  }

  getCurrencySymbol(c: any): string {
    if (c && c.id === 500) {
      const curr = this.paymentMethod.currency;
      if (curr === 'EUR') return '€';
      if (curr === 'USDT') return '₮';
    }
    return '$';
  }

  getCurrencyLabel(c: any): string {
    if (c && c.id === 500) {
      return this.paymentMethod.currency || 'USD';
    }
    return 'USD';
  }

  openPaymentModal(contractor: any) {
    this.selectedProcessForPayment = contractor;
    let base = 2500;
    if (contractor.id === 500 && this.paymentMethod.currency === 'EUR') {
      base = 2500 * 0.92;
    }
    this.paymentAmount = parseFloat(base.toFixed(2));
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

      const formattedAmount = this.paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 });
      const auditMsg = this.dashboardTranslations[this.selectedLang]['auditPaid']
        .replace('{amount}', formattedAmount)
        .replace('{name}', c.name)
        .replace('$', this.getCurrencySymbol(c))
        .replace('USD', this.getCurrencyLabel(c));
      this.changeHistory.unshift(auditMsg);
      
      // Notify the parent shell that payment occurred!
      this.paymentCompleted.emit(c.id);
    }, 1500);
  }

  openWhatsApp(phone: string) {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  }

  deleteContractor(id: number) {
    const target = this.mockContractors.find(c => c.id === id);
    if (!target) return;
    
    // Abrir modal seguro de borrado
    this.selectedContractorForDelete = target;
    this.inputWhatsappConfirm = '';
  }

  confirmDeleteContractor() {
    if (!this.selectedContractorForDelete) return;

    const target = this.selectedContractorForDelete;
    const cleanInput = this.inputWhatsappConfirm.replace(/\D/g, '');
    const cleanTarget = target.phone ? target.phone.replace(/\D/g, '') : '';

    if (cleanInput === cleanTarget && cleanTarget !== '') {
      this.mockContractors = this.mockContractors.filter(c => c.id !== target.id);
      
      const auditMsg = this.dashboardTranslations[this.selectedLang]['auditDel'].replace('{name}', target.name);
      this.changeHistory.unshift(auditMsg);

      this.selectedContractorForDelete = null;
      this.inputWhatsappConfirm = '';
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        text: this.dashboardTranslations[this.selectedLang]['delError'],
        confirmButtonColor: '#f87171',
        background: '#1a1f2e',
        color: '#fff',
        customClass: {
          popup: 'glass-panel'
        }
      });
    }
  }
}
