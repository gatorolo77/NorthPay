import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface OnboardingSummary {
  status: string;
  currentStep: string | null;
  progress: number;
  steps: { type: string; status: string }[];
  canProceed: boolean;
  blockingIssues: string[];
  whatsappVerificationCode?: string;
  whatsappPhone?: string;
}

interface Notification {
  id: number;
  userId: number;
  message: string;
  type: string;
  isRead: boolean;
  isFadingOut?: boolean;
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
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('langCarousel') langCarousel!: ElementRef;

  languagesList = [
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/us.svg' },
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/es.svg' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/fr.svg' },
    { code: 'pt', name: 'Português', flag: 'https://flagcdn.com/pt.svg' },
    { code: 'zh', name: '中文', flag: 'https://flagcdn.com/cn.svg' },
    { code: 'it', name: 'Italiano', flag: 'https://flagcdn.com/it.svg' }
  ];

  currentView: 'landing' | 'welcome' | 'register' | 'onboarding' | 'operator' | 'login' | 'contractor_login' = 'landing';
  previousView: 'landing' | 'welcome' | 'register' | 'onboarding' | 'login' | 'contractor_login' = 'landing';
  apiBaseUrl = 'http://localhost:8080/api';
  isOperatorDemoMode = true;
  userRole = 'OPERATOR';
  cloudinaryCloudName = 'northpay-demo';
  cloudinaryUploadPreset = 'northpay_preset';

  initialToken: string | null = null;
  invitationToken = '';
  invitationEmail = '';
  invitationRole = 'CONTRACTOR';
  registerPassword = '';
  registerConfirmPassword = '';
  registerSecretKey = '';
  showRegisterPassword = false;
  loginEmail = '';
  loginPassword = '';
  showLoginPassword = false;
  adminUser = '';
  adminPass = '';
  adminSetupKey = '';
  isOperatorRegisterMode = false;
  isOwnerMode = false;
  showAdminPassword = false;
  userId = 1;
  processId = 1;
  showContractorSettings = false;

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

  whatsappInterval: any;
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

  get currentLocalDateString(): string {
    return new Date().toLocaleDateString(this.selectedLang === 'es' ? 'es-AR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

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
    paypalName: '',
    currency: 'USD',
    cryptoNetwork: 'TRC20',
    cryptoAddress: ''
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
      tooltipOperator: "🧪 Este es un panel de pruebas con datos simulados. No afecta operaciones reales.",
      btnActivate: "Iniciar Activación ",
      tooltipActivate: "🛡️ Al iniciar la activación aceptas nuestros Términos de Servicio y Políticas de Privacidad de NorthPay.",
      btnPortalLogin: "Ingresar al Portal",
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
      step2Desc: "Sube un documento oficial de identificación para que nuestro departamento legal lo valide. Los formatos permitidos son PDF o imágenes claras.",
      step3Desc: "Lee detenidamente el acuerdo de contratista remoto de NorthPay y firma digitalmente usando la tecnología de DocuSeal integrada.",
      step4Desc: "Indícanos dónde deseas recibir tus honorarios mensuales. Soportamos transferencias bancarias, Payoneer, Mercado Pago, PayPal y Criptomonedas.",
      step5Desc: "Para prevenir fraudes y asegurar el cumplimiento, utilizaremos la webcam de tu dispositivo para realizar una autenticación facial rápida.",
      docTypeLabel: "TIPO DE DOCUMENTO",
      docTypePassport: "Pasaporte o D.N.I",
      docTypeTax: "Identificación Fiscal",
      docSelectFileLabel: "SELECCIONAR ARCHIVO",
      docBrowseBtn: "Buscar archivo local",
      docUploading: "Subiendo archivo...",
      docSubmitBtn: "Enviar para Revisión Legal",
      docUploadedTitle: "Archivos Subidos",
      docInReviewLabel: "EN REVISIÓN",
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
      notifCodeSent: "✅ Código de WhatsApp generado con éxito. Se abrirá WhatsApp para enviar el código.",
      notifWsSuccess: "WhatsApp verificado correctamente. ¡Onboarding desbloqueado!",
      notifWsFail: "Código incorrecto. Intenta de nuevo.",
      notifPersSave: "Datos personales guardados con éxito.",
      notifStep2App: "Paso 2 APROBADO: Documentos aceptados por operaciones.",
      notifStep2Rej: "Paso 2 RECHAZADO: Se enviaron solicitudes de corrección.",
      btnLogout: "Cerrar Sesión",
      btnBackToStart: "Volver al Inicio",
      btnBackToOnboarding: "Volver a Onboarding",
      loginEntryLink: "Ingreso Operador",
      loginContractorEntry: "Ingreso Contratista",
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
      tooltipOperator: "🧪 This is a test panel with simulated data. It does not affect real operations.",
      btnActivate: "Start Activation",
      tooltipActivate: "🛡️ By starting activation you accept NorthPay’s Terms of Service and Privacy Policy.",
      btnPortalLogin: "Access Portal",
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
      step2Desc: "Upload an official identification document for our legal department to validate. Allowed formats are PDF or clear images.",
      step3Desc: "Read the NorthPay remote contractor agreement carefully and sign digitally using the integrated DocuSeal technology.",
      step4Desc: "Tell us where you want to receive your monthly fees. We support bank transfers, Payoneer, Mercado Pago, PayPal, and Cryptocurrencies.",
      step5Desc: "To prevent fraud and ensure compliance, we will use your device's webcam to perform a quick facial authentication.",
      docTypeLabel: "DOCUMENT TYPE",
      docTypePassport: "Passport or ID",
      docTypeTax: "Tax Identification",
      docSelectFileLabel: "SELECT FILE",
      docBrowseBtn: "Browse local file",
      docUploading: "Uploading file...",
      docSubmitBtn: "Send for Legal Review",
      docUploadedTitle: "Uploaded Files",
      docInReviewLabel: "UNDER REVIEW",
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
      notifCodeSent: "✅ WhatsApp verification code generated. WhatsApp will open to send the code.",
      notifWsSuccess: "WhatsApp verified successfully. Onboarding unlocked!",
      notifWsFail: "Incorrect code. Please try again.",
      notifPersSave: "Personal data saved successfully.",
      notifStep2App: "Step 2 APPROVED: Documents accepted by operations.",
      notifStep2Rej: "Step 2 REJECTED: Correction requests sent.",
      btnLogout: "Logout",
      btnBackToStart: "Back to Home",
      btnBackToOnboarding: "Back to Onboarding",
      loginEntryLink: "Operator Login",
      loginContractorEntry: "Contractor Login",
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
      tooltipOperator: "🧪 Il s’agit d’un panneau de test avec des données simulées. Il n’affecte pas les opérations réelles.",
      btnActivate: "Lancer l'activation ",
      tooltipActivate: "🛡️ En lançant l’activation, vous acceptez les Conditions d’Utilisation et la Politique de Confidentialité de NorthPay.",
      btnPortalLogin: "Accéder au Portail",
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
      step2Desc: "Téléchargez une pièce d'identité officielle pour validation par notre service juridique. Les formats autorisés sont PDF ou images nettes.",
      step3Desc: "Lisez attentivement l'accord de sous-traitant NorthPay et signez numériquement via la technologie intégrée DocuSeal.",
      step4Desc: "Indiquez où recevoir vos honoraires. Nous acceptons virements bancaires, Payoneer, Mercado Pago, PayPal et Cryptomonnaies.",
      step5Desc: "Pour prévenir la fraude et assurer la conformité, nous utiliserons votre webcam pour une authentification faciale rapide.",
      docTypeLabel: "TYPE DE DOCUMENT",
      docTypePassport: "Passeport ou C.N.I",
      docTypeTax: "Identifiant Fiscal",
      docSelectFileLabel: "SÉLECTIONNER LE FICHIER",
      docBrowseBtn: "Parcourir le fichier local",
      docUploading: "Téléchargement du fichier...",
      docSubmitBtn: "Envoyer pour Révision Juridique",
      docUploadedTitle: "Fichiers Téléchargés",
      docInReviewLabel: "EN RÉVISION",
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
      notifCodeSent: "✅ Code WhatsApp généré. WhatsApp s'ouvrira pour envoyer le code.",
      notifWsSuccess: "WhatsApp vérifié avec succès. Intégration déverrouillée !",
      notifWsFail: "Code incorrect. Veuillez réessayer.",
      notifPersSave: "Données personnelles enregistrées avec succès.",
      notifStep2App: "Étape 2 APPROUVÉE : Documents acceptés par les opérations.",
      notifStep2Rej: "Étape 2 REJETÉE : Demandes de correction envoyées.",
      btnLogout: "Se déconnecter",
      btnBackToStart: "Retour à l'accueil",
      btnBackToOnboarding: "Retour à l'intégration",
      loginEntryLink: "Connexion Opérateur",
      loginContractorEntry: "Accès Prestataire",
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
      tooltipOperator: "🧪 Este é um painel de testes com dados simulados. Não afeta operações reais.",
      btnActivate: "Iniciar Ativação ",
      tooltipActivate: "🛡️ Ao iniciar a ativação você aceita os Termos de Serviço e a Política de Privacidade da NorthPay.",
      btnPortalLogin: "Acessar o Portal",
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
      step2Desc: "Envie um documento de identificação oficial para validação jurídica. Os formatos permitidos são PDF ou imagens nítidas.",
      step3Desc: "Leia atentamente o acordo de prestação de serviços NorthPay e assine digitalmente com a tecnologia DocuSeal integrada.",
      step4Desc: "Informe onde deseja receber seus honorários. Aceitamos transferências bancárias, Payoneer, Mercado Pago, PayPal e Criptomoedas.",
      step5Desc: "Para evitar fraudes e garantir conformidade, usaremos a webcam do seu dispositivo para uma autenticação facial rápida.",
      docTypeLabel: "TIPO DE DOCUMENTO",
      docTypePassport: "Passaporte ou R.G",
      docTypeTax: "Identificação Fiscal",
      docSelectFileLabel: "SELECIONAR ARQUIVO",
      docBrowseBtn: "Buscar arquivo local",
      docUploading: "Enviando arquivo...",
      docSubmitBtn: "Enviar para Revisão Legal",
      docUploadedTitle: "Arquivos Enviados",
      docInReviewLabel: "EM REVISÃO",
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
      notifCodeSent: "✅ Código do WhatsApp gerado com sucesso. O WhatsApp abrirá para enviar o código.",
      notifWsSuccess: "WhatsApp verificado com sucesso. Integração desbloqueada!",
      notifWsFail: "Código incorreto. Por favor tente novamente.",
      notifPersSave: "Dados pessoais salvos com sucesso.",
      notifStep2App: "Passo 2 APROVADO: Documentos aceitos pelas operações.",
      notifStep2Rej: "Passo 2 REJEITADO: Solicitações de correção enviadas.",
      btnLogout: "Sair",
      btnBackToStart: "Voltar ao Início",
      btnBackToOnboarding: "Voltar ao Onboarding",
      loginEntryLink: "Acesso do Operador",
      loginContractorEntry: "Acesso do Contratado",
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
      tooltipOperator: "🧪 这是一个使用模拟数据的测试面板，不会影响真实操作。",
      btnActivate: "开始激活",
      tooltipActivate: "🛡️ 开始激活即表示您接受 NorthPay 的服务条款和隐私政策。",
      btnPortalLogin: "登录门户",
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
      step2Desc: "上传官方身份证件供我们的法律部门验证。允许的格式为 PDF 或清晰图片。",
      step3Desc: "仔细阅读 NorthPay 远程承包商协议，并使用集成的 DocuSeal 技术进行数字签名。",
      step4Desc: "告诉我们您希望在哪里接收您的月度费用。我们支持银行转账、Payoneer、Mercado Pago、PayPal 和加密货币。",
      step5Desc: "为了防止欺诈并确保合规，我们将使用您设备的网络摄像头进行快速人脸认证。",
      docTypeLabel: "文件类型",
      docTypePassport: "护照或身份证",
      docTypeTax: "税务识别码",
      docSelectFileLabel: "选择文件",
      docBrowseBtn: "浏览本地文件",
      docUploading: "正在上传文件...",
      docSubmitBtn: "提交法律审查",
      docUploadedTitle: "已上传文件",
      docInReviewLabel: "审查中",
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
      notifCodeSent: "✅ 已生成 WhatsApp 验证码。将自动打开 WhatsApp 并发送消息。",
      notifWsSuccess: "WhatsApp 验证成功。入职流程已解锁！",
      notifWsFail: "代码错误。请再试一次。",
      notifPersSave: "个人数据已成功保存。",
      notifStep2App: "第 2 步审核通过：运营已接受文档。",
      notifStep2Rej: "第 2 步已拒绝：已发送更正请求。",
      btnLogout: "注销",
      btnBackToStart: "返回首页",
      btnBackToOnboarding: "返回入职",
      loginEntryLink: "运营商登录",
      loginContractorEntry: "承包商登录",
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
      tooltipOperator: "🧪 Questo è un pannello di test con dati simulati. Non influisce sulle operazioni reali.",
      btnActivate: "Avvia Attivazione",
      tooltipActivate: "🛡️ Avviando l’attivazione accetti i Termini di Servizio e l’Informativa sulla Privacy di NorthPay.",
      btnPortalLogin: "Accedi al Portale",
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
      step2Desc: "Carica un documento d'identità ufficiale per la convalida legale. I formati consentiti sono PDF o immagini chiare.",
      step3Desc: "Leggi attentamente il contratto NorthPay e firma digitalmente utilizzando la tecnologia integrata DocuSeal.",
      step4Desc: "Indicaci dove ricevere i tuoi compensi. Supportiamo bonifici bancari, Payoneer, Mercado Pago, PayPal e Criptovalute.",
      step5Desc: "Per prevenire frodi e garantire la conformità, utilizzeremo la webcam del dispositivo per una rapida autenticazione facciale.",
      docTypeLabel: "TIPO DI DOCUMENTO",
      docTypePassport: "Passaporto o C.I.",
      docTypeTax: "Identificazione Fiscale",
      docSelectFileLabel: "SELEZIONA FILE",
      docBrowseBtn: "Sfoglia file locale",
      docUploading: "Caricamento file in corso...",
      docSubmitBtn: "Invia per Revisione Legale",
      docUploadedTitle: "File Caricati",
      docInReviewLabel: "IN REVISIONE",
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
      notifCodeSent: "✅ Codice di verifica WhatsApp generato con successo. Si aprirà WhatsApp per inviare il messaggio.",
      notifWsSuccess: "WhatsApp verificato con successo. Onboarding sbloccato!",
      notifWsFail: "Codice non corretto. Riprova.",
      notifPersSave: "Dati personali salvati con successo.",
      notifStep2App: "Passo 2 APPROVATO: Documenti accettati dalle operazioni.",
      notifStep2Rej: "Passo 2 RESPINTO: Inviate richieste di correzione.",
      btnLogout: "Disconnetti",
      btnBackToStart: "Torna alla Home",
      btnBackToOnboarding: "Torna all'Onboarding",
      loginEntryLink: "Ingresso Operatore",
      loginContractorEntry: "Ingresso Appaltatore",
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

  getFormattedAmount(showPlus = false): string {
    const baseAmount = this.paymentAmount || 2500;
    const curr = this.paymentMethod.currency || 'USD';
    let converted = baseAmount;
    let symbol = '$';

    if (curr === 'EUR') {
      if (baseAmount === 2500) {
        converted = baseAmount * 0.92;
      }
      symbol = '€';
    } else if (curr === 'USDT') {
      symbol = '₮';
    }

    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return `${showPlus ? '+' : ''}${symbol}${formatted} ${curr}`;
  }

  constructor(private http: HttpClient) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    let finalToken = token;
    if (!finalToken && window.location.href.includes('token=')) {
      const parts = window.location.href.split('token=');
      if (parts.length > 1) {
        finalToken = parts[1].split('&')[0];
      }
    }

    if (finalToken) {
      this.initialToken = finalToken;
      console.log('[NorthPay] Token capturado sincrónicamente:', this.initialToken);
    }
  }

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
    this.http.get(`${this.apiBaseUrl}/auth/health`, { responseType: 'text' }).subscribe({
      next: () => {
        console.log('[NorthPay] Connected to NorthPay server.');
        this.addLocalNotification('Conectado al servidor de NorthPay', 'SUCCESS');
        this.checkUrlForToken();
      },
      error: () => {
        console.warn('[NorthPay] Spring Boot offline.');
        this.checkUrlForToken();
      }
    });
  }

  checkUrlForToken() {
    const finalToken = this.initialToken;

    if (finalToken) {
      console.log('[NorthPay] RUTA DE ACTIVACIÓN DETECTADA. Token:', finalToken);
      this.http.get(`${this.apiBaseUrl}/invitations/${finalToken}`).subscribe({
        next: (invitation: any) => {
          console.log('[NorthPay] Invitación obtenida:', invitation);
          if (invitation && invitation.status === 'PENDING') {
            this.invitationToken = invitation.token;
            this.invitationEmail = invitation.email;
            this.invitationRole = invitation.role || 'CONTRACTOR';
            this.currentView = 'register';
            this.addLocalNotification('Token de activación válido detectado. Configura tu contraseña.', 'SUCCESS');
          } else {
            this.addLocalNotification('El token de activación ya ha sido utilizado o ha expirado.', 'ERROR');
          }
        },
        error: (err) => {
          console.error('[NorthPay] Error validando token:', err);
          this.invitationToken = finalToken!;
          this.invitationRole = 'CONTRACTOR';
          this.currentView = 'register';
          this.addLocalNotification('Token detectado. Por favor ingresa tu correo y contraseña.', 'INFO');
        }
      });

      this.initialToken = null;
    }
  }


  generateInvitation() {
    this.http.post(`${this.apiBaseUrl}/invitations/send`, {
      email: this.invitationEmail,
      operatorId: 1
    }).subscribe({
      next: (res: any) => {
        this.invitationToken = res.token;
        this.addLocalNotification(`Invitación enviada para ${this.invitationEmail}`, 'SUCCESS');
        this.currentView = 'landing';
      },
      error: (err) => this.handleError(err)
    });
  }


  sendOperatorInvitation() {
    if (!this.adminUser || !this.adminUser.includes('@')) {
      this.addLocalNotification('Por favor ingresa un correo electrónico válido.', 'ERROR');
      return;
    }
    this.http.post(`${this.apiBaseUrl}/auth/invite-operator`, {
      email: this.adminUser
    }).subscribe({
      next: () => {
        this.addLocalNotification(`Enlace de registro enviado a ${this.adminUser}. Revisá tu correo.`, 'SUCCESS');
        this.isOperatorRegisterMode = false;
        this.adminUser = '';
      },
      error: (err) => this.handleError(err)
    });
  }


  register() {
    if (this.registerPassword !== this.registerConfirmPassword) {
      this.addLocalNotification('Las contraseñas no coinciden. Por favor verificalas.', 'ERROR');
      return;
    }
    if (this.registerPassword.length < 6) {
      this.addLocalNotification('La contraseña debe tener al menos 6 caracteres.', 'ERROR');
      return;
    }

    this.http.post(`${this.apiBaseUrl}/auth/register`, {
      email: this.invitationEmail,
      password: this.registerPassword,
      token: this.invitationToken,
      secretKey: this.registerSecretKey ? this.registerSecretKey.trim().toUpperCase() : ''
    }).subscribe({
      next: (user: any) => {
        this.addLocalNotification('Registrado correctamente', 'SUCCESS');
        this.registerPassword = '';
        this.registerConfirmPassword = '';
        this.registerSecretKey = '';
        
        if (this.invitationRole === 'OPERATOR') {
          this.adminUser = this.invitationEmail;
          this.currentView = 'login'; // Redirect to operator login
          this.addLocalNotification('Tu cuenta de operador ha sido activada. Ya podés iniciar sesión.', 'SUCCESS');
        } else {
          this.userId = user.id;
          this.initiateOnboarding();
        }
      },
      error: (err) => this.handleError(err)
    });
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
    this.http.get<OnboardingSummary>(`${this.apiBaseUrl}/onboarding/${this.processId}/summary`).subscribe({
      next: (summary) => {
        this.summary = summary;
        if (summary.whatsappPhone) {
          this.whatsappPhone = summary.whatsappPhone;
        }
        this.loadNotifications();
      },
      error: (err) => this.handleError(err)
    });
  }


  submitPersonalData() {
    this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/personal-data`, this.personalData).subscribe({
      next: () => {
        this.addLocalNotification(this.translations[this.selectedLang]['notifPersSave'], 'SUCCESS');
        this.refreshSummary();
      },
      error: (err) => this.handleError(err)
    });
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


  signContract() {
    this.isSigningContract = true;
    setTimeout(() => {
      this.isSigningContract = false;
      this.signedContractUrl = 'https://res.cloudinary.com/demo/contract/signed_contract_doe.pdf';
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
    }, 1500);
  }

  savePaymentMethod() {
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

  startIdentityScanning() {
    this.isScanningIdentity = true;
    this.scanProgress = 0;
    const interval = setInterval(() => {
      this.scanProgress += 10;
      if (this.scanProgress >= 100) {
        clearInterval(interval);
        this.isScanningIdentity = false;

        this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/identity-verification?provider=${this.identityProvider}&success=${this.scanSuccess}`, {}).subscribe({
            next: () => {
              this.addLocalNotification('Verificación biométrica procesada.', 'SUCCESS');
              this.refreshSummary();
            },
            error: (err) => this.handleError(err)
          });
      }
    }, 300);
  }

  startOnboarding() {
    this.notifications = [];
    this.currentView = 'welcome';
    this.playGreetingAudio();
  }

  playGreetingAudio() {
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

    audio.volume = this.audioVolume / 100;
    audio.muted = this.isMuted;

    audio.onended = () => {
      this.currentAudio = null;
    };

    audio.onerror = () => {
      this.playFallbackAudio(formats, index + 1);
    };
    audio.oncanplaythrough = () => {
      this.currentAudio = audio;
      audio.play().catch(e => {
        this.playFallbackAudio(formats, index + 1);
      });
      audio.oncanplaythrough = null;
    };

    audio.load();
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
      if (this.isMuted && this.audioVolume > 0) {
        this.isMuted = false;
        this.currentAudio.muted = false;
      }
    }
  }

  submitAdminLogin() {
    this.http.post<any>(`${this.apiBaseUrl}/auth/login`, {
      email: this.adminUser,
      password: this.adminPass
    }).subscribe({
      next: (user) => {
        this.userId = user.id;
        this.userRole = user.role;
        this.isOperatorDemoMode = false;
        this.isOwnerMode = false;
        if (user.role === 'OWNER') {
          this.addLocalNotification('Bienvenido de vuelta, Propietario (Owner).', 'SUCCESS');
        } else {
          this.addLocalNotification('Bienvenido de vuelta, Operador.', 'SUCCESS');
        }
        this.loadOperatorPanel();
      },
      error: () => {
        this.addLocalNotification('Acceso Denegado: Verifica usuario y clave.', 'ERROR');
      }
    });
  }

  openOwnerDirectLogin() {
    this.currentView = 'login';
    this.isOperatorRegisterMode = false;
    this.isOwnerMode = true;
    this.adminUser = 'owner@northpay.com';
    this.adminPass = '';
    this.addLocalNotification('Terminal de Propietario: Por favor ingresá tu Llave de Oro.', 'INFO');
  }

  goBackToLanding() {
    this.currentView = 'landing';
    this.isOperatorRegisterMode = false;
    this.isOwnerMode = false;
    this.adminUser = '';
    this.adminPass = '';
  }

  submitOperatorRegister() {
    this.http.post(`${this.apiBaseUrl}/auth/register-operator`, {
      email: this.adminUser,
      password: this.adminPass,
      setupKey: this.adminSetupKey
    }).subscribe({
      next: () => {
        this.addLocalNotification('¡Operador registrado con éxito! Ahora podés iniciar sesión.', 'SUCCESS');
        this.isOperatorRegisterMode = false;
        this.adminSetupKey = '';
      },
      error: (err) => {
        const msg = err?.error || 'Error al registrar operador. Verificá la clave de configuración.';
        this.addLocalNotification(msg, 'ERROR');
      }
    });
  }

  submitContractorPortalLogin() {
    this.http.post<any>(`${this.apiBaseUrl}/auth/login`, {
      email: this.loginEmail,
      password: this.loginPassword
    }).subscribe({
      next: (user) => {
        this.addLocalNotification('Sesión iniciada correctamente. Cargando tu Dashboard...', 'SUCCESS');
        this.userId = user.id;
        this.invitationEmail = this.loginEmail;
        this.http.post<any>(`${this.apiBaseUrl}/onboarding/initiate?contractorUserId=${this.userId}`, {}).subscribe({
          next: (process) => {
            this.processId = process.id;
            this.http.get<OnboardingSummary>(`${this.apiBaseUrl}/onboarding/${this.processId}/summary`).subscribe({
              next: (sum) => {
                this.summary = sum;
                this.currentView = 'onboarding';
              },
              error: (err) => {
                console.error('[NorthPay] Failed to load summary:', err);
                this.addLocalNotification('Error al cargar resumen de onboarding', 'ERROR');
              }
            });
          },
          error: (err) => {
            console.error('[NorthPay] Failed to initiate process:', err);
            this.addLocalNotification('Error al inicializar proceso de onboarding', 'ERROR');
          }
        });
      },
      error: (err) => {
        console.error('[NorthPay] Live contractor login failed:', err);
        this.addLocalNotification('Credenciales incorrectas o usuario no registrado.', 'ERROR');
      }
    });
  }

  openContractorSettings() {
    this.showContractorSettings = true;
    if (!this.whatsappPhone) {
      this.whatsappPhone = this.personalData.phone || '+34 600 000 000';
    }
  }

  saveContractorSettings() {
    const pData: Record<string, any> = {};
    const provider = this.paymentMethod.provider;

    if (provider === 'BANK_TRANSFER') {
      pData['bankName'] = this.paymentMethod.bankName;
      pData['accountNumber'] = this.paymentMethod.accountNumber;
      pData['swiftCode'] = this.paymentMethod.swiftCode;
    } else if (provider === 'MERCADO_PAGO') {
      pData['mpAliasOrCvu'] = this.paymentMethod.mpAliasOrCvu;
      pData['mpAccountHolder'] = this.paymentMethod.mpAccountHolder;
    } else if (provider === 'PAYONEER' || provider === 'PAYPAL') {
      pData['paypalEmail'] = this.paymentMethod.paypalEmail;
      pData['paypalName'] = this.paymentMethod.paypalName;
    } else if (provider === 'CRYPTO') {
      pData['cryptoNetwork'] = this.paymentMethod.cryptoNetwork;
      pData['cryptoAddress'] = this.paymentMethod.cryptoAddress;
    }

    const payload = {
      whatsappPhone: this.whatsappPhone,
      paymentProvider: provider,
      paymentData: pData
    };


    this.http.put(`${this.apiBaseUrl}/onboarding/${this.processId}/settings`, payload).subscribe({
      next: (updatedSummary: any) => {
        this.addLocalNotification('Perfil y método de pago actualizados con éxito', 'SUCCESS');
        this.personalData.phone = this.whatsappPhone;
        if (updatedSummary) {
          this.summary = updatedSummary;
        }
        this.showContractorSettings = false;
      },
      error: (err) => {
        console.error('[NorthPay] Failed to save settings:', err);
        this.addLocalNotification('Error al guardar ajustes en el servidor', 'ERROR');
      }
    });
  }

  loadOperatorPanel() {
    this.notifications = [];
    this.previousView = this.currentView as any;
    this.currentView = 'operator';
    if (this.isOperatorDemoMode) {
      this.userRole = 'OPERATOR';
      return;
    }
    this.http.get<OnboardingProcess[]>(`${this.apiBaseUrl}/operator/processes`).subscribe({
      next: (procs) => this.operatorProcesses = procs,
      error: (err) => this.handleError(err)
    });
  }

  exitOperatorPanel() {
    if (!this.isOperatorDemoMode) {
      this.currentView = 'landing';
      this.adminUser = '';
      this.adminPass = '';
      this.isOperatorDemoMode = true;
      this.userRole = 'OPERATOR';
      this.addLocalNotification(this.selectedLang === 'es' ? 'Sesión cerrada correctamente.' : 'Successfully logged out.', 'INFO');
    } else {
      this.currentView = this.previousView as any;
    }
  }

  reviewContractorStep(stepType: string, approved: boolean) {
    const feedbackMsg = approved ? 'Documentación válida y certificada.' : this.reviewFeedback || 'Faltan firmas o nitidez.';
    const stepId = 2;
    this.selectedProcessIdForReview = null;
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
    // Open a blank tab synchronously to prevent popup blocker from blocking it
    const waWindow = window.open('', '_blank');
    
    this.http.post<OnboardingSummary>(`${this.apiBaseUrl}/onboarding/${this.processId}/whatsapp/send?phone=${encodeURIComponent(this.whatsappPhone)}`, {}).subscribe({
      next: (summary) => {
        this.isSendingWhatsapp = false;
        this.summary = summary;
        this.addLocalNotification(this.translations[this.selectedLang]['notifCodeSent'], 'SUCCESS');
        
        // Generate the WhatsApp Link dynamically and navigate the tab
        const companyPhone = '5493415109918';
        const code = summary.whatsappVerificationCode || 'NP-XXXX';
        const text = `Hola NorthPay, mi código de verificación es: ${code}`;
        const waLink = `https://wa.me/${companyPhone}?text=${encodeURIComponent(text)}`;
        
        if (waWindow) {
          waWindow.location.href = waLink;
        }
        
        this.refreshSummary();
        this.startWhatsappPolling();
      },
      error: (err) => {
        this.isSendingWhatsapp = false;
        if (waWindow) {
          waWindow.close();
        }
        this.handleError(err);
      }
    });
  }

  verifyWhatsappCode() {
    this.isVerifyingWhatsapp = true;
    this.http.post(`${this.apiBaseUrl}/onboarding/${this.processId}/whatsapp/verify?code=${encodeURIComponent(this.whatsappCode)}`, {}).subscribe({
      next: () => {
        this.isVerifyingWhatsapp = false;
        this.whatsappVerified = true;
        this.personalData.phone = this.whatsappPhone;
        const cleanNum = this.whatsappPhone.replace(/\D/g, '');
        if (cleanNum.startsWith('54')) this.personalData.country = 'Argentina';
        else if (cleanNum.startsWith('34')) this.personalData.country = 'Spain';
        else if (cleanNum.startsWith('52')) this.personalData.country = 'Mexico';
        else if (cleanNum.startsWith('57')) this.personalData.country = 'Colombia';
        else if (cleanNum.startsWith('55')) this.personalData.country = 'Brazil';
        else if (cleanNum.startsWith('56')) this.personalData.country = 'Chile';
        else if (cleanNum.startsWith('1')) this.personalData.country = 'United States';
        this.addLocalNotification(this.translations[this.selectedLang]['notifWsSuccess'], 'SUCCESS');
        this.refreshSummary();
        this.stopWhatsappPolling();
      },
      error: (err) => {
        this.isVerifyingWhatsapp = false;
        this.handleError(err);
      }
    });
  }

  getWhatsAppLink(): string {
    const companyPhone = '5493415109918';
    const code = this.summary.whatsappVerificationCode || 'NP-XXXX';
    const text = `Hola NorthPay, mi código de verificación es: ${code}`;
    return `https://wa.me/${companyPhone}?text=${encodeURIComponent(text)}`;
  }

  startWhatsappPolling() {
    this.stopWhatsappPolling();
    this.whatsappInterval = setInterval(() => {
      this.http.get<OnboardingSummary>(`${this.apiBaseUrl}/onboarding/${this.processId}/summary`).subscribe({
        next: (sum) => {
          this.summary = sum;
          const step0 = sum.steps.find(s => s.type === 'WHATSAPP_VERIFY');
          if (sum.currentStep !== 'WHATSAPP_VERIFY' || (step0 && step0.status === 'COMPLETED')) {
            this.stopWhatsappPolling();
            this.addLocalNotification('¡WhatsApp verificado! Avance automático al Paso 1.', 'SUCCESS');
            this.personalData.phone = this.whatsappPhone;
            const cleanNum = this.whatsappPhone.replace(/\D/g, '');
            if (cleanNum.startsWith('54')) this.personalData.country = 'Argentina';
            else if (cleanNum.startsWith('34')) this.personalData.country = 'Spain';
            else if (cleanNum.startsWith('52')) this.personalData.country = 'Mexico';
            else if (cleanNum.startsWith('57')) this.personalData.country = 'Colombia';
            else if (cleanNum.startsWith('55')) this.personalData.country = 'Brazil';
            else if (cleanNum.startsWith('56')) this.personalData.country = 'Chile';
            else if (cleanNum.startsWith('1')) this.personalData.country = 'United States';
          }
        },
        error: (err) => console.error('[NorthPay] Error polling WhatsApp step status:', err)
      });
    }, 4000);
  }

  stopWhatsappPolling() {
    if (this.whatsappInterval) {
      clearInterval(this.whatsappInterval);
      this.whatsappInterval = null;
    }
  }

  simulateOtpReceived() {
    if (this.summary.whatsappVerificationCode) {
      this.whatsappCode = this.summary.whatsappVerificationCode;
      this.addLocalNotification('Código de prueba recibido (Simulación). Presiona Verificar.', 'INFO');
    } else {
      this.addLocalNotification('No se ha generado ningún código aún.', 'ERROR');
    }
  }

  ngOnDestroy() {
    this.stopWhatsappPolling();
  }

  handlePaymentCompleted(event: any) {
    const contractorId = typeof event === 'object' ? event.id : event;
    const amount = typeof event === 'object' ? event.amount : null;

    if (amount !== null) {
      this.paymentAmount = amount;
    }

    if (contractorId === 500) {
      this.summary.status = 'PAID';
      const curr = this.paymentMethod.currency || 'USD';
      let symbol = curr === 'EUR' ? '€' : curr === 'USDT' ? '₮' : '$';
      const formatted = this.paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 });
      this.addLocalNotification(`¡Felicidades! Se ha emitido tu pago de ${symbol}${formatted} ${curr} y el balance ha sido actualizado.`, 'SUCCESS');
      this.refreshSummary();
    }

    if (!this.globalPaidIds.includes(contractorId)) {
      this.globalPaidIds.push(contractorId);
    }
  }

  resolveLocalState() {
    let progress = 0;
    let currentStep: string | null = 'WHATSAPP_VERIFY';
    const blockingIssues: string[] = [];
    let canProceed = true;

    const s0 = this.summary.steps[0].status;
    const s1 = this.summary.steps[1].status;
    const s2 = this.summary.steps[2].status;
    const s3 = this.summary.steps[3].status;
    const s4 = this.summary.steps[4].status;
    const s5 = this.summary.steps[5].status;

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
      createdAt: new Date().toLocaleTimeString(),
      isFadingOut: false
    };
    this.notifications.unshift(newNotif);

    setTimeout(() => {
      newNotif.isFadingOut = true;
      setTimeout(() => {
        newNotif.isRead = true;
      }, 500);
    }, 4500);
  }

  getUnreadNotificationsCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getUnreadNotifications() {
    return this.notifications.filter(n => !n.isRead);
  }

  trackById(index: number, item: Notification) {
    return item.id;
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

  getD(langCode: string): number {
    const targetIndex = this.languagesList.findIndex(l => l.code === langCode);
    const activeIndex = this.languagesList.findIndex(l => l.code === this.selectedLang);
    if (targetIndex === -1 || activeIndex === -1) return 0;
    
    let diff = targetIndex - activeIndex;
    const n = this.languagesList.length;
    
    if (diff > n / 2) {
      diff -= n;
    } else if (diff < -n / 2) {
      diff += n;
    }
    return diff;
  }

  getAbsD(langCode: string): number {
    return Math.abs(this.getD(langCode));
  }

  onLangWheel(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.scrollLanguages('up');
    } else if (event.deltaY > 0) {
      this.scrollLanguages('down');
    }
  }

  scrollLanguages(direction: 'up' | 'down') {
    const activeIndex = this.languagesList.findIndex(l => l.code === this.selectedLang);
    if (activeIndex === -1) return;
    
    let newIndex = activeIndex;
    if (direction === 'up') {
      newIndex = (activeIndex - 1 + this.languagesList.length) % this.languagesList.length;
    } else {
      newIndex = (activeIndex + 1) % this.languagesList.length;
    }
    this.changeLanguage(this.languagesList[newIndex].code);
  }

  loadNotifications() {
    this.http.get<Notification[]>(`${this.apiBaseUrl}/notifications?userId=${this.userId}`).subscribe({
      next: (notifs) => this.notifications = notifs,
      error: () => { }
    });
  }

  markNotificationRead(id: number) {
    this.http.post(`${this.apiBaseUrl}/notifications/${id}/read`, {}).subscribe({
      next: () => this.loadNotifications()
    });
  }

  handleError(err: any) {
    console.error('[NorthPay Error]', err);
    let errorMsg = 'Error de conexión o validación en el servidor.';
    if (err) {
      if (typeof err.error === 'string' && err.error.trim().length > 0) {
        errorMsg = err.error;
      } else if (err.error && typeof err.error.message === 'string' && err.error.message.trim().length > 0) {
        errorMsg = err.error.message;
      } else if (err.message && typeof err.message === 'string' && err.message.trim().length > 0) {
        errorMsg = err.message;
      }
    }
    this.addLocalNotification(errorMsg, 'ERROR');
  }
}
