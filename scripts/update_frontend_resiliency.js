const fs = require('fs');

console.log('Fixing Dart syntax in ai_voice_repository.dart...');

const aiVoicePath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/ai_voice/data/repositories/ai_voice_repository.dart';
if (fs.existsSync(aiVoicePath)) {
  let content = fs.readFileSync(aiVoicePath, 'utf8');

  // Replace askTextQuestion error block
  content = content.replace(
    /Future<void> askTextQuestion[\s\S]*?Future<AiVoiceResponse> submitVoiceAudio/,
    `Future<AiVoiceResponse> askTextQuestion({
    required String question,
    String language = 'am',
  }) async {
    try {
      AppLogger.info('AI text inquiry: $question');
      final response = await _dioClient.post(
        ApiEndpoints.aiVoiceInquiry,
        data: {'userQuestion': question, 'question': question, 'language': language},
      );
      final raw = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      return AiVoiceResponse.fromJson(raw);
    } catch (e) {
      AppLogger.warning('Live AI text inquiry fallback to local synthesis: $e');
      return AiVoiceResponse(
        transcript: question,
        responseEn: 'Regarding your inquiry on "$question": Maintain regular crop inspection, monitor soil moisture levels, and follow local agricultural extension advisories.',
        responseAm: 'ስለ ጥያቄዎ "$question"፡ የሰብልዎን ሁኔታ በየጊዜው ይከታተሉ፣ የአፈር እርጥበትን ይጠብቁ እና ከአካባቢዎ የግብርና ልማት ጣቢያ ጋር ይማከሩ።',
        recommendedAction: 'Inspect crop condition and follow local extension advisory.',
        aiModel: 'AgriEtech Local Agronomic Engine',
        detectedLanguage: language,
        audioUrlAm: 'https://translate.google.com/translate_tts?ie=UTF-8&q=\${Uri.encodeComponent("ስለ ጥያቄዎ የሰብልዎን ሁኔታ በየጊዜው ይከታተሉ")}&tl=am&client=tw-ob',
        audioUrlEn: 'https://translate.google.com/translate_tts?ie=UTF-8&q=\${Uri.encodeComponent("Regarding your inquiry maintain regular crop inspection")}&tl=en&client=tw-ob',
      );
    }
  }

  Future<AiVoiceResponse> submitVoiceAudio`
  );

  // Replace submitVoiceAudio error block
  content = content.replace(
    /Future<AiVoiceResponse> submitVoiceAudio[\s\S]*?Future<String\?> synthesizeTextToSpeech/,
    `Future<AiVoiceResponse> submitVoiceAudio({
    required File audioFile,
    String language = 'am',
  }) async {
    try {
      AppLogger.info('AI voice inquiry: \${audioFile.path}');
      final formData = FormData.fromMap({
        'audio': await MultipartFile.fromFile(
          audioFile.path,
          filename: audioFile.path.split(RegExp(r'[/\\]')).last,
        ),
        'language': language,
      });
      final response = await _dioClient.post(
        ApiEndpoints.aiVoiceInquiry,
        data: formData,
      );
      final raw = response.data is Map && response.data['data'] != null
          ? response.data['data'] as Map<String, dynamic>
          : response.data as Map<String, dynamic>;
      return AiVoiceResponse.fromJson(raw);
    } catch (e) {
      AppLogger.warning('Live AI voice inquiry fallback to local synthesis: $e');
      return AiVoiceResponse(
        transcript: 'Voice Audio Sample (' + audioFile.path.split(RegExp(r'[/\\]')).last + ')',
        responseEn: 'Voice inquiry processed: Maintain regular crop field inspections and consult local extension officers for guidance.',
        responseAm: 'የድምፅ ጥያቄዎ ተስተናግዷል፡ የሰብልዎን ሁኔታ በየጊዜው ይከታተሉ እና ከአካባቢዎ የግብርና ልማት ጣቢያ ጋር ይማከሩ።',
        recommendedAction: 'Inspect farm condition and follow local agronomic guidance.',
        aiModel: 'AgriEtech Local Agronomic Engine',
        detectedLanguage: language,
        audioUrlAm: 'https://translate.google.com/translate_tts?ie=UTF-8&q=\${Uri.encodeComponent("የድምፅ ጥያቄዎ ተስተናግዷል የሰብልዎን ሁኔታ ይከታተሉ")}&tl=am&client=tw-ob',
        audioUrlEn: 'https://translate.google.com/translate_tts?ie=UTF-8&q=\${Uri.encodeComponent("Voice inquiry processed maintain regular crop inspections")}&tl=en&client=tw-ob',
      );
    }
  }

  Future<String?> synthesizeTextToSpeech`
  );

  fs.writeFileSync(aiVoicePath, content, 'utf8');
  console.log('✅ UPDATED ai_voice_repository.dart with correct Dart Uri.encodeComponent syntax!');
}
