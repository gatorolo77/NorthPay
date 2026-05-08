package com.northpay.onboarding.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocuSealService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${docuseal.api.url:https://api.docuseal.co}")
    private String apiUrl;

    @Value("${docuseal.api.key:your_docuseal_api_key}")
    private String apiKey;

    /**
     * Generates an embedded signing URL for a contractor using DocuSeal API.
     */
    public String createEmbeddedSubmission(String templateId, String email, String contractorName) {
        log.info("[DocuSeal] Solicitando firma para: {} (Plantilla ID: {})", email, templateId);

        if ("your_docuseal_api_key".equals(apiKey)) {
            log.info("[DocuSeal] API Key por defecto detectada. Utilizando URL de demo simulada.");
            return "https://www.docuseal.com/d/demo";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Auth-Token", apiKey);

            // Construct payload body
            Map<String, Object> body = new HashMap<>();
            body.put("template_id", Integer.parseInt(templateId));
            
            Map<String, Object> submitter = new HashMap<>();
            submitter.put("email", email);
            submitter.put("role", "Signer");
            submitter.put("name", contractorName);

            body.put("submitter", submitter);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl + "/v1/submissions", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map responseBody = response.getBody();
                if (responseBody.containsKey("embed_src")) {
                    String embedSrc = responseBody.get("embed_src").toString();
                    log.info("[DocuSeal] Enlace embebido generado con éxito: {}", embedSrc);
                    return embedSrc;
                }
            }
        } catch (Exception e) {
            log.error("[DocuSeal] Error llamando a la API de DocuSeal: {}. Usando URL de respaldo.", e.getMessage());
        }

        return "https://www.docuseal.com/d/demo";
    }
}
