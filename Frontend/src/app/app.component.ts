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
  currentView: 'landing' | 'welcome' | 'register' | 'onboarding' | 'operator' | 'login' = 'landing';
  previousView: 'landing' | 'welcome' | 'register' | 'onboarding' | 'login' = 'landing';
  apiBaseUrl = 'http://localhost:8080/api';
  isLocalMock = true;
  isOperatorDemoMode = true;
  cloudinaryCloudName = 'northpay-demo';
  cloudinaryUploadPreset = 'northpay_preset';

  invitationToken = '';
  invitationEmail = 'contractor@northpay.com';
  registerPassword = 'password123';
  loginEmail = 'contractor@northpay.com';
  loginPassword = 'password123';
  adminUser = 'admin@northpay.com';
  adminPass = 'admin123';
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
  globalPaidIds: number[] = [];

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

  currentAudio: HTMLAudioElement | null = null;
  audioVolume = 75;
  isMuted = false;

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
      btnOperator: "Panel de Operaciones (Demo)",
      btnActivate: "Iniciar Activación ",
      preloading: "Precargando recursos...",
      statusReady: "Portal NorthPay listo para operar ⚡",
      onboardingPortalTitle: "Portal de Onboarding",
      onboardingWelcomeText: "Bienvenido a NorthPay. Para iniciar el proceso de activación de tu cuenta de contratista remoto, ingresa el correo de invitación proporcionado por tu operador.",
      contractorEmailLabel: "CORREO ELECTRÓNICO DEL CONTRATISTA",
      generateInvitationBtn: "Generar Invitación de Acceso",
      stepLabel: "Paso",
      statusPending: "Pendiente",
      statusInProgress: "En Progreso",
      statusInReview: "En Revisión",
      statusRejected: "Requiere Ajustes",
      statusCompleted: "Completado",
      registerTitle: "Completar Registro",
      sidebarTitle: "Progreso de Activación",
      step0: "Verificar WhatsApp",
      step1: "Datos Personales",
      step2: "Documentación",
      step3: "Firma de Contrato",
      step4: "Método de Pago",
      step5: "Identidad Biométrica",
      wsDesc: "Para iniciar tu progreso de activación, ingresa tu número de WhatsApp para certificar tu identidad y desbloquear el onboarding. ¡El envío por nuestro canal corporativo es gratuito!",
      wsLabel: "NÚMERO DE WHATSAPP",
      wsBtnSend: "Enviar Código de Verificación",
      wsBtnSending: "Enviando WhatsApp...",
      wsLabelCode: "INGRESAR CÓDIGO (6 DÍGITOS)",
      wsBtnVerify: "Verificar y Desbloquear Onboarding",
      wsBtnVerifying: "Verificando Código...",
      regDesc: "Se ha detectado un token de invitación válido para registrar tu perfil de contratista.",
      regAssocEmail: "CORREO ASOCIADO",
      regTokenLabel: "TOKEN DE INVITACIÓN",
      regPassLabel: "CONFIGURAR CONTRASEÑA",
      regBtnStart: "Iniciar Mi Onboarding",
      persDesc: "Por favor, completa tus datos básicos fiscales. Esto nos permite generar de forma automatizada tu contrato legal.",
      persFirst: "NOMBRES",
      persLast: "APELLIDOS",
      persPhone: "NÚMERO DE TELÉFONO",
      persCountry: "PAÍS DE RESIDENCIA FISCAL",
      persBtnSave: "Guardar y Siguiente Paso",
      navOperator: "Panel de Operaciones",
      notifCodeSent: "Código de activación listo: escribe 123456 en pantalla.",
      notifWsSuccess: "WhatsApp verificado correctamente. ¡Onboarding desbloqueado!",
      notifWsFail: "Código incorrecto. Intenta de nuevo.",
      notifPersSave: "Datos personales guardados con éxito.",
      btnLogout: "Cerrar Sesión",
      btnBackToStart: "Volver al Inicio",
      btnBackToOnboarding: "Volver a Onboarding",
      loginEntryLink: "Ingreso Operador",
      loginTitle: "Acceso Operador",
      loginSubtitle: "Ingresa tus credenciales administrativas de NorthPay",
      loginUserLabel: "USUARIO O CORREO",
      loginPassLabel: "CONTRASEÑA",
      loginBtnBack: "Volver",
      loginBtnSubmit: "Iniciar Sesión",
      loginTip: "🔐 Usa admin@northpay.com / admin123"
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
      btnOperator: "Operator Panel (Demo)",
      btnActivate: "Start Activation",
      preloading: "Preloading resources...",
      statusReady: "NorthPay Portal ready to operate ⚡",
      onboardingPortalTitle: "Onboarding Portal",
      onboardingWelcomeText: "Welcome to NorthPay. To start the activation process for your remote contractor account, enter the invitation email provided by your operator.",
      contractorEmailLabel: "CONTRACTOR EMAIL ADDRESS",
      generateInvitationBtn: "Generate Access Invitation",
      stepLabel: "Step",
      statusPending: "Pending",
      statusInProgress: "In Progress",
      statusInReview: "In Review",
      statusRejected: "Action Required",
      statusCompleted: "Completed",
      registerTitle: "Complete Registration",
      sidebarTitle: "Activation Progress",
      step0: "Verify WhatsApp",
      step1: "Personal Data",
      step2: "Documentation",
      step3: "Sign Contract",
      step4: "Payment Method",
      step5: "Biometric Identity",
      wsDesc: "To start your activation progress, enter your WhatsApp number to certify your identity and unlock the onboarding. Shipping via our corporate channel is free!",
      wsLabel: "WHATSAPP NUMBER",
      wsBtnSend: "Send Verification Code",
      wsBtnSending: "Sending WhatsApp...",
      wsLabelCode: "ENTER CODE (6 DIGITS)",
      wsBtnVerify: "Verify and Unlock Onboarding",
      wsBtnVerifying: "Verifying Code...",
      regDesc: "A valid invitation token has been detected to register your contractor profile.",
      regAssocEmail: "ASSOCIATED EMAIL",
      regTokenLabel: "INVITATION TOKEN",
      regPassLabel: "SET PASSWORD",
      regBtnStart: "Start My Onboarding",
      persDesc: "Please complete your basic tax information. This allows us to automatically generate your legal contract.",
      persFirst: "FIRST NAMES",
      persLast: "LAST NAMES",
      persPhone: "PHONE NUMBER",
      persCountry: "TAX RESIDENCE COUNTRY",
      persBtnSave: "Save and Next Step",
      navOperator: "Operator Panel",
      notifCodeSent: "Activation code ready: type 123456 on screen.",
      notifWsSuccess: "WhatsApp verified successfully. Onboarding unlocked!",
      notifWsFail: "Incorrect code. Please try again.",
      notifPersSave: "Personal data saved successfully.",
      btnLogout: "Logout",
      btnBackToStart: "Back to Home",
      btnBackToOnboarding: "Back to Onboarding",
      loginEntryLink: "Operator Login",
      loginTitle: "Operator Access",
      loginSubtitle: "Enter your NorthPay administrative credentials",
      loginUserLabel: "USERNAME OR EMAIL",
      loginPassLabel: "PASSWORD",
      loginBtnBack: "Back",
      loginBtnSubmit: "Log In",
      loginTip: "🔐 Use admin@northpay.com / admin123"
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
      btnOperator: "Panneau Opérateur (Démo)",
      btnActivate: "Lancer l'activation ",
      preloading: "Préchargement des ressources...",
      statusReady: "Portail NorthPay prêt à fonctionner ⚡",
      onboardingPortalTitle: "Portail d'Intégration",
      onboardingWelcomeText: "Bienvenue sur NorthPay. Pour lancer le processus d'activation de votre compte de sous-traitant, saisissez l'e-mail d'invitation fourni par votre opérateur.",
      contractorEmailLabel: "ADRESSE E-MAIL DU SOUS-TRAITANT",
      generateInvitationBtn: "Générer l'Invitation d'Accès",
      stepLabel: "Étape",
      statusPending: "En attente",
      statusInProgress: "En cours",
      statusInReview: "En révision",
      statusRejected: "Action requise",
      statusCompleted: "Terminé",
      registerTitle: "Compléter l'Inscription",
      sidebarTitle: "Progrès de l'Activation",
      step0: "Vérifier WhatsApp",
      step1: "Données Personnelles",
      step2: "Documentation",
      step3: "Signature Contrat",
      step4: "Mode de Paiement",
      step5: "Identité Biométrique",
      wsDesc: "Pour lancer votre processus d'activation, saisissez votre numéro WhatsApp afin de certifier votre identité et débloquer l'intégration. L'envoi par notre canal d'entreprise est gratuit !",
      wsLabel: "NUMÉRO WHATSAPP",
      wsBtnSend: "Envoyer le code de vérification",
      wsBtnSending: "Envoi sur WhatsApp...",
      wsLabelCode: "ENTRER LE CODE (6 CHIFFRES)",
      wsBtnVerify: "Vérifier et Débloquer l'Intégration",
      wsBtnVerifying: "Vérification du Code...",
      regDesc: "Un jeton d'invitation valide a été détecté pour enregistrer votre profil de sous-traitant.",
      regAssocEmail: "E-MAIL ASSOCIÉ",
      regTokenLabel: "JETON D'INVITATION",
      regPassLabel: "CONFIGURER LE MOT DE PASSE",
      regBtnStart: "Lancer Mon Intégration",
      persDesc: "Veuillez compléter vos informations fiscales de base. Cela nous permet de générer automatiquement votre contrat légal.",
      persFirst: "PRÉNOMS",
      persLast: "NOMS DE FAMILLE",
      persPhone: "NUMÉRO DE TÉLÉPHONE",
      persCountry: "PAYS DE RÉSIDENCE FISCALE",
      persBtnSave: "Enregistrer et Étape Suivante",
      navOperator: "Panneau Opérateur",
      notifCodeSent: "Code d'activation prêt : tapez 123456 à l'écran.",
      notifWsSuccess: "WhatsApp vérifié avec succès. Intégration déverrouillée !",
      notifWsFail: "Code incorrect. Veuillez réessayer.",
      notifPersSave: "Données personnelles enregistrées avec succès.",
      btnLogout: "Se déconnecter",
      btnBackToStart: "Retour à l'accueil",
      btnBackToOnboarding: "Retour à l'intégration",
      loginEntryLink: "Connexion Opérateur",
      loginTitle: "Accès Opérateur",
      loginSubtitle: "Saisissez vos identifiants administratifs NorthPay",
      loginUserLabel: "UTILISATEUR OU EMAIL",
      loginPassLabel: "MOT DE PASSE",
      loginBtnBack: "Retour",
      loginBtnSubmit: "Se Connecter",
      loginTip: "🔐 Utilisez admin@northpay.com / admin123"
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
      btnOperator: "Painel do Operador (Demo)",
      btnActivate: "Iniciar Ativação ",
      preloading: "Pré-carregando recursos...",
      statusReady: "Portal NorthPay pronto para operar ⚡",
      onboardingPortalTitle: "Portal de Integração",
      onboardingWelcomeText: "Bem-vindo ao NorthPay. Para iniciar el proceso de ativação da sua conta de contratado, insira o e-mail de convite fornecido pelo seu operador.",
      contractorEmailLabel: "E-MAIL DO PRESTADOR DE SERVIÇOS",
      generateInvitationBtn: "Gerar Convite de Acesso",
      stepLabel: "Etapa",
      statusPending: "Pendente",
      statusInProgress: "Em progresso",
      statusInReview: "Em análise",
      statusRejected: "Requer Ajustes",
      statusCompleted: "Concluído",
      registerTitle: "Completar Cadastro",
      sidebarTitle: "Progresso de Ativação",
      step0: "Verificar WhatsApp",
      step1: "Dados Pessoais",
      step2: "Documentação",
      step3: "Assinatura do Contrato",
      step4: "Forma de Pagamento",
      step5: "Identidade Biométrica",
      wsDesc: "Para iniciar o seu progresso de ativação, insira o seu número de WhatsApp para certificar a sua identidade e desbloquear a integração. O envio pelo nosso canal corporativo é gratuito!",
      wsLabel: "NÚMERO DO WHATSAPP",
      wsBtnSend: "Enviar Código de Verificación",
      wsBtnSending: "Enviando WhatsApp...",
      wsLabelCode: "DIGITAR CÓDIGO (6 DÍGITOS)",
      wsBtnVerify: "Verificar e Desbloquear Integração",
      wsBtnVerifying: "Verificando Código...",
      regDesc: "Um token de convite válido foi detectado para registrar o seu perfil de contratado.",
      regAssocEmail: "E-MAIL ASSOCIADO",
      regTokenLabel: "TOKEN DE CONVITE",
      regPassLabel: "CONFIGURAR SENHA",
      regBtnStart: "Iniciar Minha Integração",
      persDesc: "Por favor, complete seus dados fiscais básicos. Isso nos permite gerar automaticamente seu contrato legal.",
      persFirst: "NOMES",
      persLast: "SOBRENOMES",
      persPhone: "NÚMERO DE TELEFONE",
      persCountry: "PAÍS DE RESIDÊNCIA FISCAL",
      persBtnSave: "Salvar e Próxima Etapa",
      navOperator: "Painel de Operações",
      notifCodeSent: "Código de ativação pronto: digite 123456 na tela.",
      notifWsSuccess: "WhatsApp verificado com sucesso. Integração desbloqueada!",
      notifWsFail: "Código incorreto. Por favor tente novamente.",
      notifPersSave: "Dados pessoais salvos com sucesso.",
      btnLogout: "Sair",
      btnBackToStart: "Voltar ao Início",
      btnBackToOnboarding: "Voltar ao Onboarding",
      loginEntryLink: "Acesso do Operador",
      loginTitle: "Acesso do Operador",
      loginSubtitle: "Insira suas credenciais administrativas da NorthPay",
      loginUserLabel: "USUÁRIO OU E-MAIL",
      loginPassLabel: "SENHA",
      loginBtnBack: "Voltar",
      loginBtnSubmit: "Iniciar Sessão",
      loginTip: "🔐 Use admin@northpay.com / admin123"
    },
    zh: {
      logoSubtitle: "欢迎门户",
      heroTitle: "您的全球薪酬网关",
      heroDesc: "加入面向远程承包商的领先国际薪酬平台。在几秒钟内激活您的个人资料、安全签署协议并管理您的全球提款。",
      propTitle1: "灵活提款",
      propDesc1: "通过银行转账或 Mercado Pago 以美元、欧元或本地货币接收付款。",
      propTitle2: "电子签名",
      propDesc2: "使用 DocuSeal Web 组件即时签署您的法律承包商协议。",
      propTitle3: "KYC 生物识别",
      propDesc3: "由先进 of 生物识别引擎支持的新一代身份验证。",
      btnOperator: "运营商面板 (演示)",
      btnActivate: "开始激活",
      preloading: "正在预载资源...",
      statusReady: "NorthPay 门户已准备就绪 ⚡",
      onboardingPortalTitle: "入职门户",
      onboardingWelcomeText: "欢迎来到 NorthPay。要开始远程承包商账户的激活流程，请输入您的运营商提供的邀请电子邮件。",
      contractorEmailLabel: "承包商电子邮件地址",
      generateInvitationBtn: "生成访问邀请",
      stepLabel: "步骤",
      statusPending: "待处理",
      statusInProgress: "进行中",
      statusInReview: "审核中",
      statusRejected: "需调整",
      statusCompleted: "已完成",
      registerTitle: "完成注册",
      sidebarTitle: "激活进度",
      step0: "验证 WhatsApp",
      step1: "个人资料",
      step2: "文档",
      step3: "合同签署",
      step4: "支付方式",
      step5: "生物识别身份",
      wsDesc: "要开始您的激活进度，请输入您的 WhatsApp 号码以验证您的身份并解锁入职流程。通过我们的企业渠道发送是免费的！",
      wsLabel: "WHATSAPP 号码",
      wsBtnSend: "发送验证码",
      wsBtnSending: "正在发送 WhatsApp...",
      wsLabelCode: "输入代码 (6 位数字)",
      wsBtnVerify: "验证并解锁入职",
      wsBtnVerifying: "正在验证代码...",
      regDesc: "已检测到有效的邀请令牌以注册您的承包商个人资料。",
      regAssocEmail: "相关电子邮件",
      regTokenLabel: "邀请令牌",
      regPassLabel: "设置密码",
      regBtnStart: "开始我的入职",
      persDesc: "请填写您的基本税务信息。这使我们能够自动生成您的法律合同。",
      persFirst: "名字",
      persLast: "姓氏",
      persPhone: "电话号码",
      persCountry: "税务居留国",
      persBtnSave: "保存并下一步",
      navOperator: "操作面板",
      notifCodeSent: "激活码已就绪：请在屏幕上输入 123456。",
      notifWsSuccess: "WhatsApp 验证成功。入职流程已解锁！",
      notifWsFail: "代码错误。请再试一次。",
      notifPersSave: "个人数据已成功保存。",
      btnLogout: "注销",
      btnBackToStart: "返回首页",
      btnBackToOnboarding: "返回入职",
      loginEntryLink: "运营商登录",
      loginTitle: "操作员访问权限",
      loginSubtitle: "输入您的 NorthPay 管理凭据",
      loginUserLabel: "用户名或电子邮件",
      loginPassLabel: "密码",
      loginBtnBack: "返回",
      loginBtnSubmit: "登录",
      loginTip: "🔐 请使用 admin@northpay.com / admin123"
    },
    it: {
      logoSubtitle: "PORTALE DI BENVENUTO",
      heroTitle: "Il Tuo Gateway di Pagamento Globale",
      heroDesc: "Unisciti alla piattaforma di payroll internazionale leader per i collaboratori da remoto. Attiva il tuo profilo, firma contratti in sicurezza e gestisci i tuoi prelievi globali in pochi secondi.",
      propTitle1: "Prelievi Flessibili",
      propDesc1: "Ricevi i tuoi pagamenti in USD, EUR o valuta locale tramite bonifici bancari o Mercado Pago.",
      propTitle2: "Firma Digitale",
      propDesc2: "Firma istantaneamente il tuo contratto legale utilizzando il Web Component di DocuSeal.",
      propTitle3: "Biometria KYC",
      propDesc3: "Verifica dell'identità di nuova generazione supportata da motori biometrici avanzati.",
      btnOperator: "Pannello Operazioni (Demo)",
      btnActivate: "Avvia Attivazione",
      preloading: "Precaricamento risorse...",
      statusReady: "Portale NorthPay pronto a operare ⚡",
      onboardingPortalTitle: "Portale di Onboarding",
      onboardingWelcomeText: "Benvenuto in NorthPay. Per avviare il processo di attivazione del tuo account collaboratore da remoto, inserisci l'e-mail di invito fornita dal tuo operatore.",
      contractorEmailLabel: "INDIRIZZO E-MAIL DEL COLLABORATORE",
      generateInvitationBtn: "Genera Invito di Accesso",
      stepLabel: "Passo",
      statusPending: "In attesa",
      statusInProgress: "In corso",
      statusInReview: "In revisione",
      statusRejected: "Modifiche richieste",
      statusCompleted: "Completato",
      registerTitle: "Completa Registrazione",
      sidebarTitle: "Progresso Attivazione",
      step0: "Verifica WhatsApp",
      step1: "Dati Personali",
      step2: "Documentazione",
      step3: "Firma del Contratto",
      step4: "Metodo di Pagamento",
      step5: "Identità Biometrica",
      wsDesc: "Per avviare il tuo progresso di attivazione, inserisci il tuo numero WhatsApp per certificare la tua identità e sbloccare l'onboarding. L'invio tramite il nostro canale aziendale è gratuito!",
      wsLabel: "NUMERO WHATSAPP",
      wsBtnSend: "Invia Codice di Verifica",
      wsBtnSending: "Invio WhatsApp...",
      wsLabelCode: "INSERISCI CODICE (6 CIFRE)",
      wsBtnVerify: "Verifica e Sblocca Onboarding",
      wsBtnVerifying: "Verifica Codice...",
      regDesc: "È stato rilevato un token di invito valido per registrare il tuo profilo collaboratore.",
      regAssocEmail: "E-MAIL ASSOCIATA",
      regTokenLabel: "TOKEN DI INVITO",
      regPassLabel: "IMPOSTA PASSWORD",
      regBtnStart: "Avvia Il Mio Onboarding",
      persDesc: "Per favore, completa i tuoi dati fiscali di base. Questo ci permette di generare automaticamente il tuo contratto legale.",
      persFirst: "NOMI",
      persLast: "COGNOMI",
      persPhone: "NUMERO DI TELEFONO",
      persCountry: "PAESE DI RESIDENZA FISCALE",
      persBtnSave: "Salva e Prossimo Passo",
      navOperator: "Pannello Operazioni",
      notifCodeSent: "Codice di attivazione pronto: digita 123456 sullo schermo.",
      notifWsSuccess: "WhatsApp verificato con successo. Onboarding sbloccato!",
      notifWsFail: "Codice non corretto. Riprova.",
      notifPersSave: "Dati personali salvati con successo.",
      btnLogout: "Disconnetti",
      btnBackToStart: "Torna alla Home",
      btnBackToOnboarding: "Torna all'Onboarding",
      loginEntryLink: "Ingresso Operatore",
      loginTitle: "Accesso Operatore",
      loginSubtitle: "Inserisci le tue credenziali amministrative NorthPay",
      loginUserLabel: "UTENTE O E-MAIL",
      loginPassLabel: "PASSWORD",
      loginBtnBack: "Indietro",
      loginBtnSubmit: "Accedi",
      loginTip: "🔐 Usa admin@northpay.com / admin123"
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
    return this.summary.status === 'PAID' || this.globalPaidIds.includes(500);
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

      // ✨ Warm Default Pre-fill for high-quality Sandbox UX
      if (!this.personalData.firstName) {
        this.personalData.firstName = 'Juan';
        this.personalData.lastName = 'Pérez';
      }

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
      this.addLocalNotification(this.translations[this.selectedLang]['notifPersSave'], 'SUCCESS');
      this.refreshSummary();
    } else {
      this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/personal-data`, this.personalData).subscribe({
        next: () => {
          this.addLocalNotification(this.translations[this.selectedLang]['notifPersSave'], 'SUCCESS');
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

  startOnboarding() {
    this.notifications = []; // Remove residual toasts from the landing page
    this.currentView = 'welcome';
    this.playGreetingAudio(); // Activate localized greeting audio
  }

  playGreetingAudio() {
    // Resilient format chain: scan sequentially for modern OGG, raw WAV, or universal MP3
    const formats = ['ogg', 'wav', 'mp3'];
    this.playFallbackAudio(formats, 0);
  }

  private playFallbackAudio(formats: string[], index: number) {
    if (index >= formats.length) {
      console.log(`[NorthPay Audio] End of fallback chain for ${this.selectedLang}. No supported asset responded.`);
      return;
    }

    const audio = new Audio();
    const currentFormat = formats[index];
    audio.src = `assets/audio/greeting_${this.selectedLang}.${currentFormat}`;

    // Apply global master settings from the topbar controls!
    audio.volume = this.audioVolume / 100;
    audio.muted = this.isMuted;

    // Clean reference completely upon track completion
    audio.onended = () => {
      this.currentAudio = null;
    };

    // Hook into errors (file not found or format unsupported) to advance the chain
    audio.onerror = () => {
      this.playFallbackAudio(formats, index + 1);
    };

    // Hook into successfully loaded metadata/buffers to start playback immediately
    audio.oncanplaythrough = () => {
      this.currentAudio = audio; // Register globally as actively playing
      audio.play().catch(e => {
        // In case play fails, suppress and continue scanning fallback chain
        this.playFallbackAudio(formats, index + 1);
      });
      // Remove listener once successfully fired to prevent double trigger re-entry
      audio.oncanplaythrough = null;
    };

    audio.load(); // Fire up the network load
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.currentAudio) {
      this.currentAudio.muted = this.isMuted;
    }
  }

  updateAudioVolume(event: any) {
    const inputVal = event.target.value;
    this.audioVolume = inputVal;
    if (this.currentAudio) {
      this.currentAudio.volume = this.audioVolume / 100;
      // Automatically unmute if user adjusts volume to give great immediate feedback
      if (this.isMuted && this.audioVolume > 0) {
        this.isMuted = false;
        this.currentAudio.muted = false;
      }
    }
  }

  submitAdminLogin() {
    if (this.isLocalMock) {
      // Soft Sandbox validation to enable a smooth user trial with realistic feel!
      if (this.adminUser.toLowerCase() === 'admin@northpay.com' && this.adminPass === 'admin123') {
        this.addLocalNotification('Acceso Autorizado. Cargando terminal de Operador Real...', 'SUCCESS');
        this.isOperatorDemoMode = false;
        this.loadOperatorPanel();
      } else {
        this.addLocalNotification('Error de Acceso: Credenciales incorrectas. Utiliza admin@northpay.com / admin123', 'ERROR');
      }
    } else {
      this.http.post(`${this.apiBaseUrl}/auth/login`, {
        username: this.adminUser,
        password: this.adminPass
      }).subscribe({
        next: () => {
          this.addLocalNotification('Bienvenido de vuelta, Administrador.', 'SUCCESS');
          this.isOperatorDemoMode = false;
          this.loadOperatorPanel();
        },
        error: (err) => {
          this.addLocalNotification('Acceso Denegado: Verifica usuario y clave.', 'ERROR');
        }
      });
    }
  }

  loadOperatorPanel() {
    this.notifications = []; // Clear alerts for cleaner operator interface
    this.previousView = this.currentView as any;
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

  exitOperatorPanel() {
    if (!this.isOperatorDemoMode) {
      this.currentView = 'landing';
      this.adminUser = '';
      this.adminPass = '';
      // Clean sandbox state upon logout for max realism!
      this.addLocalNotification(this.selectedLang === 'es' ? 'Sesión cerrada correctamente.' : 'Successfully logged out.', 'INFO');
    } else {
      this.currentView = this.previousView as any;
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
      this.addLocalNotification(this.translations[this.selectedLang]['notifCodeSent'], 'SUCCESS');
    }, 1200);
  }

  verifyWhatsappCode() {
    this.isVerifyingWhatsapp = true;
    setTimeout(() => {
      this.isVerifyingWhatsapp = false;
      if (this.whatsappCode === '123456') {
        this.whatsappVerified = true;
        this.personalData.phone = this.whatsappPhone;

        // 🌐 Smart Country Auto-Detection based on verification dial-code
        const cleanNum = this.whatsappPhone.replace(/\D/g, '');
        if (cleanNum.startsWith('54')) {
          this.personalData.country = 'Argentina';
        } else if (cleanNum.startsWith('34')) {
          this.personalData.country = 'Spain';
        } else if (cleanNum.startsWith('52')) {
          this.personalData.country = 'Mexico';
        } else if (cleanNum.startsWith('57')) {
          this.personalData.country = 'Colombia';
        } else if (cleanNum.startsWith('55')) {
          this.personalData.country = 'Brazil';
        } else if (cleanNum.startsWith('56')) {
          this.personalData.country = 'Chile';
        } else if (cleanNum.startsWith('1')) {
          this.personalData.country = 'United States';
        }
        this.summary.steps[0].status = 'COMPLETED';
        this.summary.steps[1].status = 'IN_PROGRESS';
        this.addLocalNotification(this.translations[this.selectedLang]['notifWsSuccess'], 'SUCCESS');
        this.refreshSummary();
      } else {
        this.addLocalNotification(this.translations[this.selectedLang]['notifWsFail'], 'ERROR');
      }
    }, 1200);
  }

  handlePaymentCompleted(contractorId: number) {
    if (contractorId === 500) { // 500 is our simulated process ID for the sandbox
      this.summary.status = 'PAID';
      this.addLocalNotification('¡Felicidades! Se ha emitido tu pago y el balance ha sido actualizado.', 'SUCCESS');
      this.refreshSummary();
    }

    // Persist the state globally in case the operator panel reloads!
    if (!this.globalPaidIds.includes(contractorId)) {
      this.globalPaidIds.push(contractorId);
    }
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
      ],
      zh: [
        '正在启动安全服务...',
        '正在加载 DocuSeal 数字签名...',
        '正在建立 WhatsApp 链接...',
        '正在加载 KYC 生物识别引擎...',
        'NorthPay 门户已准备就绪 ⚡'
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
      pt: 'Português',
      zh: '中文'
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
      ],
      zh: [
        '正在启动安全服务...',
        '正在加载 DocuSeal 数字签名...',
        '正在建立 WhatsApp 链接...',
        '正在加载 KYC 生物识别引擎...',
        'NorthPay 门户已准备就绪 ⚡'
      ],
      it: [
        'Avvio dei servizi sicuri...',
        'Caricamento firma digital DocuSeal...',
        'Stabilendo collegamento WhatsApp...',
        'Caricamento motore biometrico KYC...',
        'Portale NorthPay pronto a operare ⚡'
      ]
    };

    const stepIndex = Math.min(Math.floor(this.preloadProgress / 20), 4);
    const list = statusesMap[lang] || statusesMap['es'];
    this.preloadStatus = list[stepIndex];

    const toastMsgs: Record<string, string> = {
      es: 'Idioma cambiado a Español',
      en: 'Language changed to English',
      fr: 'Langue changée en Français',
      pt: 'Idioma alterado para Português',
      zh: '语言已切换为中文',
      it: 'Lingua cambiata in Italiano'
    };

    const msg = toastMsgs[lang] || toastMsgs['es'];
    if (this.currentView === 'landing') {
      this.addLocalNotification(msg, 'SUCCESS');
    }
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
