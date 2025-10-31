package edu.cit.spedermath.controller;

import edu.cit.spedermath.dto.SummarizeReq;
import edu.cit.spedermath.dto.SummarizeResp;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.json.JSONArray;
import org.json.JSONObject;

import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;

@RestController
@RequestMapping("/api")
public class SummarizerController {

    @Value("${openai.api.key:}")
    private String openAiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    @PostMapping("/summarize")
    public SummarizeResp summarize(@RequestBody SummarizeReq req) {
        try {
            if (openAiKey == null || openAiKey.isBlank()) {
                return new SummarizeResp("Missing OpenAI API key. Add it in application.properties.");
            }

            final String text = req.text() != null ? req.text() : "";
            final int maxWordsReq = req.maxWords() != null ? req.maxWords() : 180;
            final boolean useGpt = req.useGpt() != null && req.useGpt();

            // Map words -> tokens (roughly 1 word ≈ 1.3 tokens). Add a little buffer.
            int maxTokens = (int) Math.round(maxWordsReq * 1.3) + 50;
            // Clamp to a sane range for small/mini models.
            maxTokens = Math.max(256, Math.min(2048, maxTokens));

            // Choose model (keep your logic)
            final String model = useGpt ? "gpt-4o-mini" : "gpt-5-nano";

            final String result = callOpenAI(text, maxTokens, model);
            return new SummarizeResp(result);

        } catch (Exception e) {
            e.printStackTrace();
            return new SummarizeResp("Internal error: " + e.getMessage());
        }
    }

    private String callOpenAI(String prompt, int maxTokens, String model) throws Exception {
        final URL url = new URL(OPENAI_URL);
        final HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Authorization", "Bearer " + openAiKey);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        // Optional: avoid early timeouts for longer outputs
        conn.setConnectTimeout(25_000);
        conn.setReadTimeout(60_000);

        // Messages
        JSONObject userMessage = new JSONObject()
                .put("role", "user")
                .put("content", prompt);

        // Encourage clean endings with your tag and avoid mid-sentence cutoffs
        JSONArray stopSeq = new JSONArray().put("</assessment>");

        JSONObject payload = new JSONObject()
                .put("model", model)
                .put("messages", new JSONArray().put(userMessage))
                .put("temperature", 0.2)
                .put("max_tokens", maxTokens)
                .put("stop", stopSeq);         

        byte[] out = payload.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(out);
        }

        int status = conn.getResponseCode();
        InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();

        StringBuilder respBuilder = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) respBuilder.append(line);
        }
        String respStr = respBuilder.toString();

        if (status < 200 || status >= 300) {
            return "OpenAI API error: " + status + " " + conn.getResponseMessage() + " " + respStr;
        }

        JSONObject data = new JSONObject(respStr);
        JSONArray choices = data.optJSONArray("choices");
        if (choices != null && choices.length() > 0) {
            JSONObject msg = choices.getJSONObject(0).optJSONObject("message");
            if (msg != null) {
                String content = msg.optString("content", "").trim();
                if (!content.isEmpty()) return content;
            }
        }
        return "No response from OpenAI.";
    }
}
