# Workflow: Phase 3 — Doctor Module

## Status: COMPLETED ✓ (validated 2026-06-02, TTS deferred to later)

## Objective
Build the doctor's workspace: patient files, visit history, appointment scheduling, and the AI-powered medical report system (voice → transcription → structured report).

## Steps

### 3.1 Patient Management
- Patient search (by name, phone, email)
- Patient file page: personal info, medical history, allergies
- Visit history list with date, doctor, diagnosis summary
- "Schedule next appointment" button from patient file

### 3.2 Visit & Report Flow
1. Doctor selects patient → starts visit
2. Doctor speaks into mic → Whisper API transcribes in real time
3. On "End Recording" → send transcription to Claude API
4. Claude structures it into: diagnosis, treatment, observations, prescription, follow-up
5. Doctor reviews structured report → edits if needed → clicks "Sign & Save"
6. Report status changes DRAFT → SIGNED
7. Patient can now see report in their portal

### 3.3 Speech-to-Text Integration (Whisper API)
- Use OpenAI Whisper API (not Web Speech API) for accuracy
- File: tools/whisper_transcribe.py (for batch testing)
- In frontend: MediaRecorder API → send audio chunks → backend endpoint → Whisper
- Model: whisper-1
- Language hint: set to Arabic or English based on clinic preference

### 3.4 Claude API Report Structuring
- Endpoint: POST /visits/:id/structure-report
- Sends transcription text to Claude with a medical prompt template
- Prompt instructs Claude to output JSON: { diagnosis, treatment, observations, prescription, followUpIn }
- Stores result in Report.rawStructured
- Populates individual fields for display

## Tools to Use
- tools/whisper_transcribe.py
- tools/claude_structure_report.py

## Expected Output
- Doctor can open any patient, view full history, add new visit with AI report
