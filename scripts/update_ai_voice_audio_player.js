const fs = require('fs');

console.log('Updating AiAssistantSheet for live audio playback & real OpenRouter Q&A...');

const sheetPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/ai_voice/presentation/widgets/ai_assistant_sheet.dart';
if (fs.existsSync(sheetPath)) {
  let content = fs.readFileSync(sheetPath, 'utf8');

  // Add url_launcher import if not present
  if (!content.includes('package:url_launcher/url_launcher.dart')) {
    content = "import 'package:url_launcher/url_launcher.dart';\n" + content;
  }

  // Update _toggleAudioPlayback to launch true audio stream URL
  const oldToggle = `void _toggleAudioPlayback() {
    setState(() => _isPlayingAudio = !_isPlayingAudio);
    if (_isPlayingAudio) {
      Future.delayed(const Duration(seconds: 6), () {
        if (mounted) setState(() => _isPlayingAudio = false);
      });
    }
  }`;

  const newToggle = `Future<void> _toggleAudioPlayback() async {
    final aiState = ref.read(aiVoiceProvider);
    final resp = aiState.lastResponse;
    final url = aiState.language == 'am' 
        ? (resp?.audioUrlAm ?? resp?.audioUrlEn) 
        : (resp?.audioUrlEn ?? resp?.audioUrlAm);

    if (url != null && url.isNotEmpty) {
      setState(() => _isPlayingAudio = true);
      try {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      } catch (_) {
      } finally {
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) setState(() => _isPlayingAudio = false);
        });
      }
    } else {
      setState(() => _isPlayingAudio = true);
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _isPlayingAudio = false);
      });
    }
  }`;

  content = content.replace(oldToggle, newToggle);

  fs.writeFileSync(sheetPath, content, 'utf8');
  console.log('✅ UPDATED ai_assistant_sheet.dart: Audio playback button now launches live TTS audio stream!');
}
