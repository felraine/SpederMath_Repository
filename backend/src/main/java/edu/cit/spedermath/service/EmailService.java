package edu.cit.spedermath.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String html = """
                <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 16px;">
                  <h2 style="text-align:center; margin-bottom: 8px;">SpederMath Email Verification</h2>
                  <p>Hi there,</p>
                  <p>Thanks for signing up for <strong>SpederMath</strong>! Please use the code below to verify your teacher account:</p>
                  <div style="text-align:center; margin: 24px 0;">
                    <span style="display:inline-block; padding: 12px 24px; font-size: 24px; letter-spacing: 4px; border-radius: 8px; border: 1px solid #ddd; background:#f5f5f5;">
                      %s
                    </span>
                  </div>
                  <p>This code is valid for <strong>15 minutes</strong>.</p>
                  <p style="font-size: 13px; color:#666; margin-top:24px;">
                    If you didn’t try to create a SpederMath account, you can ignore this email.
                  </p>
                  <p style="margin-top:16px;">– SpederMath Team</p>
                </div>
                """.formatted(code);

            helper.setTo(to);
            helper.setFrom(from);
            helper.setSubject("Verify your SpederMath teacher account");
            helper.setText(html, true);

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {

            throw new RuntimeException("Failed to send verification email", e);
        }
    }
}