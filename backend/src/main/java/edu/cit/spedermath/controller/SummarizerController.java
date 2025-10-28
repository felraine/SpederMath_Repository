package edu.cit.spedermath.controller;

import edu.cit.spedermath.dto.SummarizeReq;
import edu.cit.spedermath.dto.SummarizeResp;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

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

            String text = req.text() != null ? req.text() : "";
            int maxWords = req.maxWords() != null ? req.maxWords() : 180;
            boolean useGpt = req.useGpt() != null && req.useGpt();

            // choose model
            String model = useGpt ? "gpt-4o-mini" : "gpt-5-nano";

            // call API
            String result = callOpenAI(text, maxWords, model);
            return new SummarizeResp(result);

        } catch (Exception e) {
            e.printStackTrace();
            return new SummarizeResp("Internal error: " + e.getMessage());
        }
    }

    private String callOpenAI(String text, int maxWords, String model) throws Exception {
        URL url = new URL(OPENAI_URL);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Authorization", "Bearer " + openAiKey);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        // prepare JSON payload
        JSONObject message = new JSONObject()
                .put("role", "user")
                .put("content", text);

        JSONObject payload = new JSONObject()
                .put("model", model)
                .put("messages", new JSONArray().put(message))
                .put("max_tokens", 200)
                .put("temperature", 0.2);

        // send
        byte[] out = payload.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(out);
        }

        // read
        int status = conn.getResponseCode();
        InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();

        StringBuilder respBuilder = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                respBuilder.append(line);
            }
        }

        String respStr = respBuilder.toString();

        if (status < 200 || status >= 300) {
            return "OpenAI API error: " + status + " " + conn.getResponseMessage() + " " + respStr;
        }

        JSONObject data = new JSONObject(respStr);
        JSONArray choices = data.getJSONArray("choices");
        if (choices.length() > 0) {
            JSONObject messageObj = choices.getJSONObject(0).getJSONObject("message");
            return messageObj.getString("content").trim();
        }

        return "No response from OpenAI.";
    }
}
