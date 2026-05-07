package com.northpay.onboarding.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class CloudinaryService {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;
    private boolean isMockMode = false;

    @PostConstruct
    public void init() {
        if ("cloudinary_cloud_name".equals(cloudName) || "cloudinary_api_key".equals(apiKey) || "cloudinary.api-secret".equals(apiSecret)) {
            log.warn("Cloudinary credentials are using default placeholders. CloudinaryService will run in MOCK mode.");
            this.isMockMode = true;
        } else {
            try {
                this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key", apiKey,
                        "api_secret", apiSecret
                ));
                log.info("Cloudinary successfully initialized.");
            } catch (Exception e) {
                log.error("Failed to initialize Cloudinary. Switching to MOCK mode.", e);
                this.isMockMode = true;
            }
        }
    }

    public String uploadFile(MultipartFile file, String folder) {
        if (isMockMode) {
            String mockUrl = "https://res.cloudinary.com/demo/image/upload/v1570975200/sample.jpg";
            if (file != null && !file.isEmpty()) {
                String filename = file.getOriginalFilename();
                log.info("[MOCK Cloudinary] Uploaded file '{}' to folder '{}'. Generated URL: https://res.cloudinary.com/demo/document/{}/{}", 
                        filename, folder, UUID.randomUUID().toString().substring(0, 8), filename);
                mockUrl = "https://res.cloudinary.com/demo/document/" + UUID.randomUUID().toString().substring(0, 8) + "/" + filename;
            }
            return mockUrl;
        }

        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("File cannot be empty");
            }
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "auto"
            ));
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            log.error("Error uploading file to Cloudinary", e);
            throw new RuntimeException("Could not upload file to Cloudinary: " + e.getMessage(), e);
        }
    }
}
