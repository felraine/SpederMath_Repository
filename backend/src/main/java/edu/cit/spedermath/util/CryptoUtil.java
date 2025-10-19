package edu.cit.spedermath.util;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class CryptoUtil {

    private static final String AES = "AES";
    private static final String AES_GCM_NO_PADDING = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH_BITS = 128; // authentication tag length
    private static final int IV_LENGTH_BYTES = 12; // recommended for GCM
    private static final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.crypto.key-base64}")
    private String keyBase64;

    private SecretKeySpec keySpec;

    @PostConstruct
    public void init() {
        if (keyBase64 == null || keyBase64.isBlank()) {
            throw new IllegalStateException("Crypto key not configured. Set APP_CRYPTO_KEY_BASE64 env var.");
        }
        byte[] key = Base64.getDecoder().decode(keyBase64);
        if (key.length != 16 && key.length != 24 && key.length != 32) {
            throw new IllegalArgumentException("Invalid AES key length. Expected 16, 24 or 32 bytes.");
        }
        keySpec = new SecretKeySpec(key, AES);
    }

    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_GCM_NO_PADDING);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, spec);

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes("UTF-8"));

            // store iv + ciphertext together
            ByteBuffer bb = ByteBuffer.allocate(iv.length + ciphertext.length);
            bb.put(iv);
            bb.put(ciphertext);
            return Base64.getEncoder().encodeToString(bb.array());
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decrypt(String base64IvCipher) {
        try {
            byte[] ivCipher = Base64.getDecoder().decode(base64IvCipher);
            ByteBuffer bb = ByteBuffer.wrap(ivCipher);

            byte[] iv = new byte[IV_LENGTH_BYTES];
            bb.get(iv);

            byte[] ciphertext = new byte[bb.remaining()];
            bb.get(ciphertext);

            Cipher cipher = Cipher.getInstance(AES_GCM_NO_PADDING);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, spec);

            byte[] plain = cipher.doFinal(ciphertext);
            return new String(plain, "UTF-8");
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
