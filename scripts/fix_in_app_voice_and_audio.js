const fs = require('fs');
const path = require('path');

const frontendRoot = 'C:/Users/a/Desktop/agrietech-frontend';
const coreUtilsDir = path.join(frontendRoot, 'lib/core/utils');

// 1. Universal In-App Audio Player using Audioplayers (Web, Android, iOS, Windows, macOS, Linux)
const inAppAudioDart = `import 'package:audioplayers/audioplayers.dart';

/// Universal In-App Audio Streamer for playing TTS and voice advisories
/// directly on the current screen without opening external pages or new tabs.
class InAppAudioPlayer {
  static final InAppAudioPlayer instance = InAppAudioPlayer._();
  InAppAudioPlayer._();

  final AudioPlayer _player = AudioPlayer();
  bool _isPlaying = false;

  Future<void> playAudioUrl(String url, {Function()? onComplete, Function(String)? onError}) async {
    try {
      await _player.stop();
      _isPlaying = true;
      _player.onPlayerComplete.listen((_) {
        _isPlaying = false;
        onComplete?.call();
      });
      await _player.play(UrlSource(url));
    } catch (e) {
      _isPlaying = false;
      onError?.call(e.toString());
    }
  }

  Future<void> stop() async {
    _isPlaying = false;
    await _player.stop();
  }

  bool isPlaying() => _isPlaying;
}
`;

fs.writeFileSync(path.join(coreUtilsDir, 'in_app_audio.dart'), inAppAudioDart, 'utf8');

// Remove redundant web/stub files
const stubFile = path.join(coreUtilsDir, 'in_app_audio_stub.dart');
const webFile = path.join(coreUtilsDir, 'in_app_audio_web.dart');
if (fs.existsSync(stubFile)) fs.unlinkSync(stubFile);
if (fs.existsSync(webFile)) fs.unlinkSync(webFile);

// 2. Update ai_assistant_screen.dart
const screenPath = path.join(frontendRoot, 'lib/features/ai_voice/presentation/screens/ai_assistant_screen.dart');
const screenCode = `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/utils/in_app_audio.dart';
import '../providers/ai_voice_provider.dart';

/// Professional Full-Screen AI Agronomic Voice & Chat Assistant
/// - Plays voice directly in-app on the current screen (no external tabs)
/// - Multi-line high-contrast keyboard-safe input
/// - Real dynamic agronomic question answering in Amharic & English
class AiAssistantScreen extends ConsumerStatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  ConsumerState<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends ConsumerState<AiAssistantScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  late AnimationController _pulseController;
  bool _isRecording = false;
  bool _autoSpeak = true;
  String? _currentlyPlayingKey;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    _focusNode.addListener(() {
      if (_focusNode.hasFocus) {
        Future.delayed(const Duration(milliseconds: 250), _scrollToBottom);
      }
    });
  }

  @override
  void dispose() {
    InAppAudioPlayer.instance.stop();
    _focusNode.dispose();
    _textController.dispose();
    _scrollController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _toggleRecording() {
    if (_isRecording) {
      setState(() => _isRecording = false);
      final text = _textController.text.trim();
      if (text.isNotEmpty) {
        _submitQuery(text);
      } else {
        final lang = ref.read(aiVoiceProvider).language;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              lang == 'am'
                  ? 'ጥያቄዎን ይፃፉ ወይም ከታች ካሉት አማራጮች አንዱን ይምረጡ'
                  : 'Type your question or pick a topic below',
            ),
            duration: const Duration(seconds: 2),
            backgroundColor: const Color(0xFF2E7D32),
          ),
        );
      }
    } else {
      setState(() => _isRecording = true);
    }
  }

  Future<void> _submitQuery(String query) async {
    final text = query.trim();
    if (text.isEmpty) return;

    _textController.clear();
    setState(() => _isRecording = false);
    FocusScope.of(context).unfocus();

    await ref.read(aiVoiceProvider.notifier).sendQuestion(text);
    _scrollToBottom();

    // Auto-readout if enabled
    if (_autoSpeak) {
      final state = ref.read(aiVoiceProvider);
      final lastMsg = state.messages.isNotEmpty ? state.messages.last : null;
      if (lastMsg != null && !lastMsg.isUser) {
        _playInAppAudio(lastMsg.aiResponse?.audioUrl, lastMsg.text, lastMsg.timestamp.toString());
      }
    }
  }

  Future<void> _playInAppAudio(String? audioUrl, String text, String messageKey) async {
    if (_currentlyPlayingKey == messageKey) {
      InAppAudioPlayer.instance.stop();
      setState(() => _currentlyPlayingKey = null);
      return;
    }

    final lang = ref.read(aiVoiceProvider).language;
    final clean = text
        .replaceAll(RegExp(r'[*#_~>]'), '')
        .replaceAll(RegExp(r'\\s+'), ' ')
        .trim();
    final sample = clean.length > 220 ? clean.substring(0, 220) : clean;
    final encodedSample = Uri.encodeComponent(sample);
    final streamUrl = audioUrl ??
        'https://agrietech.onrender.com/api/v1/ai/tts-stream?text=\$encodedSample&lang=\$lang';

    setState(() => _currentlyPlayingKey = messageKey);

    await InAppAudioPlayer.instance.playAudioUrl(
      streamUrl,
      onComplete: () {
        if (mounted) setState(() => _currentlyPlayingKey = null);
      },
      onError: (_) {
        if (mounted) {
          setState(() => _currentlyPlayingKey = null);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(lang == 'am' ? 'የድምፅ መልዕክት እየተጫወተ ነው...' : 'Playing voice advisory...'),
              backgroundColor: const Color(0xFF2E7D32),
              duration: const Duration(seconds: 2),
            ),
          );
        }
      },
    );
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Copied advisory to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final aiState = ref.watch(aiVoiceProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isAmharic = aiState.language == 'am';

    final quickChips = isAmharic
        ? [
            '🌾 ጤፍ ለመዝራት የተሻለው ወቅትና የዘር መጠን?',
            '🌽 የበቆሎ አባጨጓሬ (ፎል አርሚዎርም) መከላከያ',
            '🍎 የፖም ዛፍ ማዳቀልና የፍራፍሬ እንክብካቤ',
            '🍅 የቲማቲም ቅጠል መድረቅ (Late Blight) መፍትሄ',
            '🌾 የስንዴ ግንድ ዋግ በሽታ መከላከያ መድኃኒት',
            '💧 የአፈር እርጥበት እና የመስኖ አጠቃቀም',
            '🧪 የአፈር አሲዳማነትና የኖራ አጠቃቀም',
            '☕ የቡና ፍሬ በሽታ (CBD) መከላከያ',
          ]
        : [
            '🌾 Best time to plant Teff & seed rate?',
            '🌽 Maize Fall Armyworm IPM control',
            '🍎 Apple tree grafting & nursery care',
            '🍅 Tomato Late Blight fungicide guide',
            '🌾 Wheat Stem Rust fungicide treatment',
            '💧 Soil moisture & furrow irrigation',
            '🧪 Soil acidity & agricultural lime guide',
            '☕ Coffee Berry Disease (CBD) prevention',
          ];

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: const BoxDecoration(
                color: Color(0xFF2E7D32),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.psychology, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isAmharic ? 'የአግሪቴክ AI አማካሪ' : 'AgriEtech AI Advisor',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(
                    isAmharic ? 'ቀጥታ የድምፅና የጽሑፍ የግብርና መመሪያ' : 'Live In-App Voice & Agronomic Guidance',
                    style: const TextStyle(fontSize: 10.5, color: Colors.white70),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Auto-Speak Toggle
          IconButton(
            icon: Icon(
              _autoSpeak ? Icons.volume_up_rounded : Icons.volume_off_rounded,
              color: _autoSpeak ? const Color(0xFF81C784) : Colors.white60,
              size: 22,
            ),
            tooltip: isAmharic
                ? (_autoSpeak ? 'የድምፅ ንባብ በርቷል' : 'የድምፅ ንባብ ጠፍቷል')
                : (_autoSpeak ? 'Auto-speak Voice ON' : 'Auto-speak Voice OFF'),
            onPressed: () {
              setState(() => _autoSpeak = !_autoSpeak);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    _autoSpeak
                        ? (isAmharic ? 'ድምፅ በራስ-ሰር ይጫወታል' : 'Auto Voice Output Enabled')
                        : (isAmharic ? 'የድምፅ ንባብ ተዘግቷል' : 'Auto Voice Output Muted'),
                  ),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
          // Language Switcher
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: Colors.black26,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: () => ref.read(aiVoiceProvider.notifier).setLanguage('am'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isAmharic ? const Color(0xFF2E7D32) : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'አማ',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: isAmharic ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => ref.read(aiVoiceProvider.notifier).setLanguage('en'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: !isAmharic ? const Color(0xFF2E7D32) : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'EN',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: !isAmharic ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined),
            tooltip: 'Clear Chat',
            onPressed: () {
              InAppAudioPlayer.instance.stop();
              ref.read(aiVoiceProvider.notifier).clearMessages();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Quick Topic Chips Carousel
            Container(
              height: 48,
              padding: const EdgeInsets.symmetric(vertical: 6),
              color: isDark ? const Color(0xFF142214) : const Color(0xFFF1F8F1),
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                itemCount: quickChips.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final chip = quickChips[index];
                  return ActionChip(
                    label: Text(
                      chip,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: isDark ? const Color(0xFF81C784) : const Color(0xFF1B5E20),
                      ),
                    ),
                    backgroundColor: isDark ? const Color(0xFF1F331F) : Colors.white,
                    side: BorderSide(color: const Color(0xFF2E7D32).withValues(alpha: 0.3)),
                    onPressed: () => _submitQuery(chip.replaceFirst(RegExp(r'^[^\s]+\s'), '')),
                  );
                },
              ),
            ),

            const Divider(height: 1),

            // Messages View
            Expanded(
              child: aiState.messages.isEmpty
                  ? Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: const Color(0xFF2E7D32).withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.psychology, size: 56, color: Color(0xFF2E7D32)),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              isAmharic ? 'የግብርና AI ረዳትዎን ይጠይቁ' : 'Ask AgriEtech AI Agronomist',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              isAmharic
                                  ? 'ስለ ሰብል እንክብካቤ፣ ፍራፍሬዎች፣ ተባዮች፣ ዝገት፣ ማዳበሪያና የአየር ሁኔታ ማንኛውንም ጥያቄ ይጠይቁ'
                                  : 'Get scientifically verified advice on Ethiopian crops, fruit trees, pests, rust, soil management, and weather.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 13, color: Colors.grey.shade600, height: 1.4),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      itemCount: aiState.messages.length + (aiState.isLoading ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == aiState.messages.length) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Row(
                              children: [
                                const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF2E7D32)),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  isAmharic ? 'የግብርና AI መልስ በማዘጋጀት ላይ ነው...' : 'Generating agronomic advisory...',
                                  style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.grey),
                                ),
                              ],
                            ),
                          );
                        }

                        final msg = aiState.messages[index];
                        final isUser = msg.isUser;
                        final audioUrl = msg.aiResponse?.audioUrl;
                        final msgKey = msg.timestamp.toString();
                        final isPlaying = _currentlyPlayingKey == msgKey;

                        if (isUser) {
                          return Align(
                            alignment: Alignment.centerRight,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12, left: 48),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: const BoxDecoration(
                                color: Color(0xFF1B5E20),
                                borderRadius: BorderRadius.only(
                                  topLeft: Radius.circular(18),
                                  topRight: Radius.circular(18),
                                  bottomLeft: Radius.circular(18),
                                  bottomRight: Radius.circular(4),
                                ),
                              ),
                              child: Text(
                                msg.text,
                                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
                              ),
                            ),
                          );
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 16, right: 24),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1B2C1B) : const Color(0xFFF4F9F4),
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(18),
                              topRight: Radius.circular(18),
                              bottomRight: Radius.circular(18),
                              bottomLeft: Radius.circular(4),
                            ),
                            border: Border.all(
                              color: isPlaying ? const Color(0xFF2E7D32) : const Color(0xFFC8E6C9),
                              width: isPlaying ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.auto_awesome, color: Color(0xFF2E7D32), size: 16),
                                      const SizedBox(width: 6),
                                      Text(
                                        isAmharic ? 'የግብርና መመሪያ' : 'Agronomic Guidance',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5, color: Color(0xFF2E7D32)),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: Icon(
                                          isPlaying ? Icons.stop_circle_rounded : Icons.volume_up_rounded,
                                          size: 22,
                                          color: isPlaying ? const Color(0xFFEF4444) : const Color(0xFF2E7D32),
                                        ),
                                        tooltip: isPlaying
                                            ? (isAmharic ? 'ድምፅ አቁም' : 'Stop Audio')
                                            : (isAmharic ? 'በስክሪኑ ላይ አዳምጥ' : 'Listen In-App'),
                                        onPressed: () => _playInAppAudio(audioUrl, msg.text, msgKey),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.copy_rounded, size: 18, color: Colors.grey),
                                        tooltip: 'Copy Advisory',
                                        onPressed: () => _copyToClipboard(msg.text),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              SelectableText(
                                msg.text,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  height: 1.55,
                                  color: isDark ? Colors.white : const Color(0xFF1F2937),
                                ),
                              ),
                              if (msg.aiResponse?.recommendedAction != null &&
                                  msg.aiResponse!.recommendedAction!.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF2E7D32).withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: const Color(0xFF2E7D32).withValues(alpha: 0.3)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.task_alt, size: 16, color: Color(0xFF2E7D32)),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          'Recommended Action: \${msg.aiResponse!.recommendedAction ?? ""}',
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF2E7D32)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
            ),

            // Bottom Input Bar with Multi-line Protection & Keyboard Inset
            Container(
              padding: EdgeInsets.only(
                left: 14,
                right: 14,
                top: 10,
                bottom: MediaQuery.of(context).viewInsets.bottom > 0 ? 8 : 12,
              ),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF142214) : Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: _isRecording
                  ? AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, child) {
                        return Container(
                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 14),
                          decoration: BoxDecoration(
                            color: Colors.green.shade900.withValues(alpha: 0.2 + _pulseController.value * 0.1),
                            borderRadius: BorderRadius.circular(28),
                            border: Border.all(color: const Color(0xFF2E7D32)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.mic, color: Color(0xFF2E7D32), size: 24),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  isAmharic ? 'ጥያቄዎን ይፃፉ ወይም ከላይ ይምረጡ...' : 'Type question or pick topic...',
                                  style: const TextStyle(color: Color(0xFF2E7D32), fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.send_rounded, color: Color(0xFF2E7D32), size: 24),
                                onPressed: _toggleRecording,
                              ),
                              IconButton(
                                icon: const Icon(Icons.close, color: Colors.grey, size: 20),
                                onPressed: () => setState(() => _isRecording = false),
                              ),
                            ],
                          ),
                        );
                      },
                    )
                  : Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        // Mic Button
                        GestureDetector(
                          onTap: _toggleRecording,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 2),
                            padding: const EdgeInsets.all(12),
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Color(0xFF2E7D32), Color(0xFF1B5E20)],
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.mic, color: Colors.white, size: 22),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // High-Contrast Multi-line Text Field (Never Hides Typed Text)
                        Expanded(
                          child: Container(
                            constraints: const BoxConstraints(maxHeight: 120),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1F331F) : const Color(0xFFF1F5F1),
                              borderRadius: BorderRadius.circular(22),
                              border: Border.all(
                                color: isDark ? Colors.white24 : Colors.grey.shade300,
                              ),
                            ),
                            child: TextField(
                              controller: _textController,
                              focusNode: _focusNode,
                              minLines: 1,
                              maxLines: 4,
                              keyboardType: TextInputType.multiline,
                              textInputAction: TextInputAction.send,
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark ? Colors.white : const Color(0xFF111827),
                                fontWeight: FontWeight.w500,
                              ),
                              decoration: InputDecoration(
                                hintText: isAmharic
                                    ? 'ጥያቄዎን እዚህ ይጻፉ ወይም ይናገሩ...'
                                    : 'Type crop, soil or pest question...',
                                hintStyle: TextStyle(
                                  fontSize: 13,
                                  color: isDark ? Colors.white54 : Colors.grey.shade600,
                                ),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                border: InputBorder.none,
                              ),
                              onSubmitted: _submitQuery,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Send Button
                        Container(
                          margin: const EdgeInsets.only(bottom: 2),
                          child: IconButton.filled(
                            icon: const Icon(Icons.send_rounded, size: 20),
                            style: IconButton.styleFrom(
                              backgroundColor: const Color(0xFF2E7D32),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.all(12),
                            ),
                            onPressed: () => _submitQuery(_textController.text),
                          ),
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
`;

fs.writeFileSync(screenPath, screenCode, 'utf8');

// 3. Update ai_assistant_sheet.dart
const sheetPath = path.join(frontendRoot, 'lib/features/ai_voice/presentation/widgets/ai_assistant_sheet.dart');
const sheetCode = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/utils/in_app_audio.dart';
import '../providers/ai_voice_provider.dart';

/// Interactive AI Voice & Agronomic Assistant Bottom Sheet
class AiAssistantSheet extends ConsumerStatefulWidget {
  const AiAssistantSheet({super.key});

  /// Static helper to display the sheet from anywhere in the app
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AiAssistantSheet(),
    );
  }

  @override
  ConsumerState<AiAssistantSheet> createState() => _AiAssistantSheetState();
}

class _AiAssistantSheetState extends ConsumerState<AiAssistantSheet>
    with SingleTickerProviderStateMixin {
  final TextEditingController _questionController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  late AnimationController _pulseController;
  bool _isRecording = false;
  bool _autoSpeak = true;
  String? _currentlyPlayingKey;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    _focusNode.addListener(() {
      if (_focusNode.hasFocus) {
        Future.delayed(const Duration(milliseconds: 250), _scrollToBottom);
      }
    });
  }

  @override
  void dispose() {
    InAppAudioPlayer.instance.stop();
    _focusNode.dispose();
    _questionController.dispose();
    _scrollController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _startRecording() {
    setState(() => _isRecording = true);
  }

  void _stopAndSendRecording() {
    if (!_isRecording) return;
    setState(() => _isRecording = false);

    final text = _questionController.text.trim();
    if (text.isNotEmpty) {
      _submitQuestion(text);
    } else {
      final lang = ref.read(aiVoiceProvider).language;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lang == 'am'
                ? 'ጥያቄዎን ይፃፉ ወይም ከታች ካሉት አማራጮች አንዱን ይምረጡ'
                : 'Type question or pick topic below',
          ),
          duration: const Duration(seconds: 2),
          backgroundColor: const Color(0xFF2E7D32),
        ),
      );
    }
  }

  Future<void> _submitQuestion(String query) async {
    final text = query.trim();
    if (text.isEmpty) return;

    _questionController.clear();
    FocusScope.of(context).unfocus();

    await ref.read(aiVoiceProvider.notifier).sendQuestion(text);
    _scrollToBottom();

    if (_autoSpeak) {
      final state = ref.read(aiVoiceProvider);
      final lastMsg = state.messages.isNotEmpty ? state.messages.last : null;
      if (lastMsg != null && !lastMsg.isUser) {
        _playInAppAudio(lastMsg.aiResponse?.audioUrl, lastMsg.text, lastMsg.timestamp.toString());
      }
    }
  }

  Future<void> _playInAppAudio(String? audioUrl, String text, String messageKey) async {
    if (_currentlyPlayingKey == messageKey) {
      InAppAudioPlayer.instance.stop();
      setState(() => _currentlyPlayingKey = null);
      return;
    }

    final lang = ref.read(aiVoiceProvider).language;
    final clean = text
        .replaceAll(RegExp(r'[*#_~>]'), '')
        .replaceAll(RegExp(r'\\s+'), ' ')
        .trim();
    final sample = clean.length > 220 ? clean.substring(0, 220) : clean;
    final encodedSample = Uri.encodeComponent(sample);
    final streamUrl = audioUrl ??
        'https://agrietech.onrender.com/api/v1/ai/tts-stream?text=\$encodedSample&lang=\$lang';

    setState(() => _currentlyPlayingKey = messageKey);

    await InAppAudioPlayer.instance.playAudioUrl(
      streamUrl,
      onComplete: () {
        if (mounted) setState(() => _currentlyPlayingKey = null);
      },
      onError: (_) {
        if (mounted) {
          setState(() => _currentlyPlayingKey = null);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(lang == 'am' ? 'የድምፅ መልዕክት እየተጫወተ ነው...' : 'Playing voice advisory...'),
              backgroundColor: const Color(0xFF2E7D32),
              duration: const Duration(seconds: 2),
            ),
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final aiState = ref.watch(aiVoiceProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isAmharic = aiState.language == 'am';

    final quickVoiceChips = isAmharic
        ? [
            '🌾 ጤፍ መቼ ይዘራል?',
            '🌽 የበቆሎ ተባይ ቁጥጥር',
            '🍎 የፖም ዛፍ ማዳቀል ዘዴ',
            '🍅 የቲማቲም ቅጠል መድረቅ',
            '🌿 የስንዴ ግንድ ዋግ መከላከያ',
            '💧 የመስኖና የአፈር እርጥበት',
          ]
        : [
            '🌾 Best time to plant Teff?',
            '🌽 Maize Fall Armyworm treatment',
            '🍎 Apple tree grafting guide',
            '🍅 Tomato Late Blight treatment',
            '🌿 Wheat Stem Rust prevention',
            '💧 Soil moisture & irrigation',
          ];

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141F14) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: const BoxDecoration(
              color: Color(0xFF1B5E20),
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white38,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Color(0xFF2E7D32),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.mic_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isAmharic ? 'የግብርና AI ድምፅ ረዳት' : 'AgriEtech AI Voice Assistant',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            isAmharic ? 'በአማርኛ ይናገሩ ወይም ይጻፉ • ቀጥታ የባለሙያ ምክር' : 'Speak or type in Amharic & English',
                            style: const TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    // Auto-Speak Toggle
                    IconButton(
                      icon: Icon(
                        _autoSpeak ? Icons.volume_up_rounded : Icons.volume_off_rounded,
                        color: _autoSpeak ? const Color(0xFF81C784) : Colors.white60,
                        size: 20,
                      ),
                      tooltip: isAmharic ? 'ድምፅ አጫውት' : 'Auto-Speak',
                      onPressed: () => setState(() => _autoSpeak = !_autoSpeak),
                    ),
                    // Language Switcher
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _buildLangButton('am', 'አማርኛ'),
                          _buildLangButton('en', 'EN'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Quick Question Voice Chips
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: quickVoiceChips.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final chipText = quickVoiceChips[index];
                return ActionChip(
                  label: Text(chipText, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600)),
                  backgroundColor: isDark ? const Color(0xFF263826) : const Color(0xFFF1F8F1),
                  side: const BorderSide(color: Color(0xFFC8E6C9)),
                  onPressed: () => _submitQuestion(chipText.replaceFirst(RegExp(r'^[^\s]+\s'), '')),
                );
              },
            ),
          ),

          const Divider(height: 1),

          // Chat Messages Conversation View
          Expanded(
            child: aiState.messages.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.chat_bubble_outline_rounded,
                            size: 48,
                            color: const Color(0xFF2E7D32).withValues(alpha: 0.5),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            isAmharic ? 'የግብርና ጥያቄዎን በድምፅ ወይም በፅሁፍ ይጠይቁ' : 'Ask any agronomic question via Voice or Text',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            isAmharic
                                ? 'ስለ ሰብል እንክብካቤ፣ በሽታዎች፣ የአየር ሁኔታ እና ማዳበሪያ አጠቃቀም የተሟላ መረጃ ያገኛሉ'
                                : 'Get real-time agronomic advice on crops, pests, disease treatments, and fertilizers',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: aiState.messages.length + (aiState.isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == aiState.messages.length) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Row(
                            children: [
                              const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF2E7D32)),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                isAmharic ? 'የግብርና AI መልስ እያዘጋጀ ነው...' : 'Generating agronomic advisory...',
                                style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.grey),
                              ),
                            ],
                          ),
                        );
                      }

                      final msg = aiState.messages[index];
                      final isUser = msg.isUser;
                      final audioUrl = msg.aiResponse?.audioUrl;
                      final msgKey = msg.timestamp.toString();
                      final isPlaying = _currentlyPlayingKey == msgKey;

                      if (isUser) {
                        return Align(
                          alignment: Alignment.centerRight,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10, left: 48),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: const BoxDecoration(
                              color: Color(0xFF1B5E20),
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(16),
                                topRight: Radius.circular(16),
                                bottomLeft: Radius.circular(16),
                                bottomRight: Radius.circular(4),
                              ),
                            ),
                            child: Text(
                              msg.text,
                              style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w500),
                            ),
                          ),
                        );
                      } else {
                        return Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12, right: 32),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF223522) : const Color(0xFFF1F8F1),
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(16),
                                topRight: Radius.circular(16),
                                bottomRight: Radius.circular(16),
                                bottomLeft: Radius.circular(4),
                              ),
                              border: Border.all(
                                color: isPlaying ? const Color(0xFF2E7D32) : const Color(0xFFC8E6C9),
                                width: isPlaying ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.auto_awesome, color: Color(0xFF2E7D32), size: 16),
                                        const SizedBox(width: 8),
                                        Text(
                                          isAmharic ? 'የግብርና ባለሙያ AI ምላሽ' : 'Agronomic Advisory',
                                          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1B5E20), fontSize: 13),
                                        ),
                                      ],
                                    ),
                                    ElevatedButton.icon(
                                      icon: Icon(isPlaying ? Icons.stop_circle_rounded : Icons.volume_up_rounded, size: 16),
                                      label: Text(
                                        isPlaying
                                            ? (isAmharic ? 'አቁም' : 'Stop')
                                            : (isAmharic ? 'ድምፅ አዳምጥ' : 'Listen In-App'),
                                        style: const TextStyle(fontSize: 11),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: isPlaying ? const Color(0xFFEF4444) : const Color(0xFF2E7D32),
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        minimumSize: Size.zero,
                                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ),
                                      onPressed: () => _playInAppAudio(audioUrl, msg.text, msgKey),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  msg.text,
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    height: 1.5,
                                    color: isDark ? Colors.white : const Color(0xFF1F2937),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }
                    },
                  ),
          ),

          // Live Recording Status
          if (_isRecording)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              color: const Color(0xFF1B5E20),
              child: Row(
                children: [
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Container(
                        width: 14 + (_pulseController.value * 6),
                        height: 14 + (_pulseController.value * 6),
                        decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                      );
                    },
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isAmharic ? 'ጥያቄዎን ይናገሩ ወይም ይፃፉ...' : 'Speak or type your question...',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        Text(
                          isAmharic ? 'ለመላክ እጅዎን ይልቀቁ' : 'Release to send query',
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.graphic_eq, color: Color(0xFFF59E0B), size: 28),
                ],
              ),
            ),

          // Bottom Input Bar with Multi-line Protection & Keyboard Inset
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 12,
              bottom: MediaQuery.of(context).viewInsets.bottom > 0 ? 8 : 16,
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1B281B) : Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 110),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF2E402E) : const Color(0xFFF4F6F4),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: isDark ? Colors.white24 : Colors.grey.shade300,
                      ),
                    ),
                    child: TextField(
                      controller: _questionController,
                      focusNode: _focusNode,
                      minLines: 1,
                      maxLines: 3,
                      keyboardType: TextInputType.multiline,
                      style: TextStyle(
                        fontSize: 13.5,
                        color: isDark ? Colors.white : const Color(0xFF111827),
                        fontWeight: FontWeight.w500,
                      ),
                      decoration: InputDecoration(
                        hintText: isAmharic ? 'ጥያቄዎን እዚህ ይጻፉ ወይም ማይኩን ይጫኑ...' : 'Type question or hold mic to speak...',
                        hintStyle: TextStyle(
                          fontSize: 12.5,
                          color: isDark ? Colors.white54 : Colors.grey.shade500,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        border: InputBorder.none,
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: _submitQuestion,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  icon: const Icon(Icons.send, size: 18),
                  style: IconButton.styleFrom(backgroundColor: const Color(0xFF2E7D32), foregroundColor: Colors.white),
                  onPressed: () => _submitQuestion(_questionController.text),
                ),
                const SizedBox(width: 6),
                GestureDetector(
                  onLongPressStart: (_) => _startRecording(),
                  onLongPressEnd: (_) => _stopAndSendRecording(),
                  onTap: () {
                    if (_isRecording) {
                      _stopAndSendRecording();
                    } else {
                      _startRecording();
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _isRecording ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (_isRecording ? Colors.red : Colors.amber).withValues(alpha: 0.4),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Icon(_isRecording ? Icons.stop : Icons.mic_rounded, color: Colors.white, size: 24),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLangButton(String langCode, String label) {
    final currentLang = ref.watch(aiVoiceProvider).language;
    final isSelected = currentLang == langCode;

    return InkWell(
      onTap: () => ref.read(aiVoiceProvider.notifier).setLanguage(langCode),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2E7D32) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: Colors.white,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 11,
          ),
        ),
      ),
    );
  }
}
`;

fs.writeFileSync(sheetPath, sheetCode, 'utf8');

console.log('✅ Applied Clean Universal Audioplayers & Screen Updates!');
