package com.northpay.onboarding.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.client.url:http://localhost:4200}")
    private String clientUrl;

    @Value("${spring.mail.username:tu_correo@gmail.com}")
    private String fromEmail;

    public void sendInvitationEmail(String toEmail, String token) {
        String activationLink = clientUrl + "/onboarding?token=" + token;
        
        log.info("[NorthPay] Generando correo de invitación para: {} | Link: {}", toEmail, activationLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("¡Bienvenido a NorthPay! Completa tu Onboarding de Activación");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 30px;'>" +
                    "  <div style='max-width: 600px; margin: 0 auto; background-color: #111827; padding: 40px; border-radius: 12px; border: 1px solid #1f2937;'>" +
                    "    <h2 style='color: #00f0ff; text-align: center; font-family: sans-serif; letter-spacing: 1px;'>¡Hola, te damos la bienvenida a NorthPay!</h2>" +
                    "    <p style='font-size: 16px; line-height: 1.6; color: #9ca3af;'>Has sido invitado a registrarte en nuestra plataforma como contratista. Para comenzar tu proceso de activación, crear tu contraseña y configurar tus métodos de pago, presiona el botón de abajo:</p>" +
                    "    <div style='text-align: center; margin: 40px 0;'>" +
                    "      <a href='" + activationLink + "' style='background-color: #00f0ff; color: #0b0f19; padding: 15px 35px; font-weight: bold; font-size: 16px; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px; box-shadow: 0 0 15px rgba(0,240,255,0.4); display: inline-block;'>Comenzar Activación de Cuenta</a>" +
                    "    </div>" +
                    "    <p style='font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;'>Este enlace expira en 3 días.</p>" +
                    "    <hr style='border: 0; border-top: 1px solid #1f2937; margin: 30px 0;'>" +
                    "    <p style='font-size: 12px; color: #4b5563; text-align: center;'>Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href='" + activationLink + "' style='color: #00f0ff;'>" + activationLink + "</a></p>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("[NorthPay] Correo enviado exitosamente a: {}", toEmail);
        } catch (Exception e) {
            log.error("[NorthPay] Error enviando correo de invitación a {}: {}. ¿Están configuradas las propiedades SMTP en application.properties?", toEmail, e.getMessage());
        }
    }

    public void sendVerificationCodeEmail(String toEmail, String code) {
        log.info("[NorthPay] Generando correo de verificación de seguridad para: {} | Código: {}", toEmail, code);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Tu Código de Verificación de NorthPay");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 30px;'>" +
                    "  <div style='max-width: 600px; margin: 0 auto; background-color: #111827; padding: 40px; border-radius: 12px; border: 1px solid #1f2937;'>" +
                    "    <h2 style='color: #00f0ff; text-align: center; font-family: sans-serif; letter-spacing: 1px;'>Verificación de Seguridad NorthPay</h2>" +
                    "    <p style='font-size: 16px; line-height: 1.6; color: #9ca3af;'>Para completar el paso de verificación y continuar con tu proceso de onboarding, utiliza el siguiente código de verificación de 6 dígitos:</p>" +
                    "    <div style='text-align: center; margin: 40px 0;'>" +
                    "      <div style='background-color: #1f2937; color: #00f0ff; padding: 20px 40px; font-weight: bold; font-size: 32px; text-decoration: none; border-radius: 8px; letter-spacing: 5px; display: inline-block; border: 1px solid #00f0ff; box-shadow: 0 0 15px rgba(0,240,255,0.25);'>" + code + "</div>" +
                    "    </div>" +
                    "    <p style='font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;'>Este código expirará en 15 minutos. No compartas este código con nadie.</p>" +
                    "    <hr style='border: 0; border-top: 1px solid #1f2937; margin: 30px 0;'>" +
                    "    <p style='font-size: 12px; color: #4b5563; text-align: center;'>Este correo fue enviado de forma segura como parte de tu proceso de onboarding en NorthPay.</p>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("[NorthPay] Correo de verificación enviado exitosamente a: {}", toEmail);
        } catch (Exception e) {
            log.error("[NorthPay] Error enviando correo de verificación a {}: {}", toEmail, e.getMessage());
        }
    }
}
