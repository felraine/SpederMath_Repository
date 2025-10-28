package edu.cit.spedermath.dto;

public record SummarizeReq(String text, Boolean useGpt, Integer maxWords) {}