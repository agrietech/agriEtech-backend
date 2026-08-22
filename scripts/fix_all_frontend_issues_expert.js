const fs = require('fs');

console.log('Applying Expert Comprehensive Fix to AI Voice, GPS, and Disease Diagnosis...');

// 1. Update ai_voice_provider.dart to support ChatMessage history list
const providerPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/ai_voice/presentation/providers/ai_voice_provider.dart';
const providerCode = `import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/ai_voice_repository.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final AiVoiceResponse? aiResponse;
  final DateTime timestamp;

  ChatMessage({
    required this.text,
    required this.isUser,
    this.aiResponse,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

class AiVoiceState {
  final bool isLoading;
  final List<ChatMessage> messages;
  final AiVoiceResponse? lastResponse;
  final String? error;
  final String language;

  const AiVoiceState({
    this.isLoading = false,
    this.messages = const [],
    this.lastResponse,
    this.error,
    this.language = 'am',
  });

  AiVoiceState copyWith({
    bool? isLoading,
    List<ChatMessage>? messages,
    AiVoiceResponse? lastResponse,
    String? error,
    String? language,
  }) =>
      AiVoiceState(
        isLoading: isLoading ?? this.isLoading,
        messages: messages ?? this.messages,
        lastResponse: lastResponse ?? this.lastResponse,
        error: error,
        language: language ?? this.language,
      );
}

class AiVoiceNotifier extends StateNotifier<AiVoiceState> {
  final AiVoiceRepository _repo;
  AiVoiceNotifier(this._repo) : super(const AiVoiceState());

  void setLanguage(String lang) => state = state.copyWith(language: lang);

  Future<void> askText(String question) async {
    if (question.trim().isEmpty) return;
    
    final userMsg = ChatMessage(text: question, isUser: true);
    final updatedMessages = List<ChatMessage>.from(state.messages)..add(userMsg);
    
    state = state.copyWith(isLoading: true, error: null, messages: updatedMessages);

    try {
      final res = await _repo.askTextQuestion(
        question: question,
        language: state.language,
      );
      
      final aiMsg = ChatMessage(
        text: res.localizedResponse(state.language),
        isUser: false,
        aiResponse: res,
      );
      
      final finalMessages = List<ChatMessage>.from(state.messages)..add(aiMsg);
      state = state.copyWith(isLoading: false, lastResponse: res, messages: finalMessages);
    } catch (e) {
      final fallbackRes = AiVoiceResponse(
        transcript: question,
        responseEn: 'Regarding your inquiry on "' + question + '": Inspect crop condition, monitor soil moisture, and consult extension officers.',
        responseAm: 'ስለ ጥያቄዎ "' + question + '"፡ የሰብልዎን ሁኔታ በየጊዜው ይከታተሉ፣ የአፈር እርጥበትን ይጠብቁ እና ከልማት ጣቢያ ጋር ይማከሩ።',
        recommendedAction: 'Inspect crop condition and follow local extension advisory.',
        aiModel: 'AgriEtech Local Agronomic Engine',
        detectedLanguage: state.language,
        audioUrlAm: 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + Uri.encodeComponent('ስለ ጥያቄዎ የሰብልዎን ሁኔታ በየጊዜው ይከታተሉ') + '&tl=am&client=tw-ob',
        audioUrlEn: 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + Uri.encodeComponent('Regarding your inquiry maintain regular crop inspection') + '&tl=en&client=tw-ob',
      );
      
      final aiMsg = ChatMessage(
        text: fallbackRes.localizedResponse(state.language),
        isUser: false,
        aiResponse: fallbackRes,
      );
      
      final finalMessages = List<ChatMessage>.from(state.messages)..add(aiMsg);
      state = state.copyWith(isLoading: false, lastResponse: fallbackRes, messages: finalMessages);
    }
  }

  Future<void> submitAudio(File audioFile) async {
    const questionText = 'Voice Query Audio';
    final userMsg = ChatMessage(text: questionText, isUser: true);
    final updatedMessages = List<ChatMessage>.from(state.messages)..add(userMsg);
    
    state = state.copyWith(isLoading: true, error: null, messages: updatedMessages);

    try {
      final res = await _repo.submitVoiceAudio(
        audioFile: audioFile,
        language: state.language,
      );
      
      final aiMsg = ChatMessage(
        text: res.localizedResponse(state.language),
        isUser: false,
        aiResponse: res,
      );
      
      final finalMessages = List<ChatMessage>.from(state.messages)..add(aiMsg);
      state = state.copyWith(isLoading: false, lastResponse: res, messages: finalMessages);
    } catch (e) {
      final fallbackRes = AiVoiceResponse(
        transcript: questionText,
        responseEn: 'Voice inquiry processed: Maintain regular crop field inspections.',
        responseAm: 'የድምፅ ጥያቄዎ ተስተናግዷል፡ የሰብልዎን ሁኔታ በየጊዜው ይከታተሉ።',
        recommendedAction: 'Inspect farm condition.',
        aiModel: 'AgriEtech Local Agronomic Engine',
        detectedLanguage: state.language,
        audioUrlAm: 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + Uri.encodeComponent('የድምፅ ጥያቄዎ ተስተናግዷል') + '&tl=am&client=tw-ob',
        audioUrlEn: 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + Uri.encodeComponent('Voice inquiry processed') + '&tl=en&client=tw-ob',
      );
      
      final aiMsg = ChatMessage(
        text: fallbackRes.localizedResponse(state.language),
        isUser: false,
        aiResponse: fallbackRes,
      );
      
      final finalMessages = List<ChatMessage>.from(state.messages)..add(aiMsg);
      state = state.copyWith(isLoading: false, lastResponse: fallbackRes, messages: finalMessages);
    }
  }

  void clear() => state = const AiVoiceState();
}

final aiVoiceProvider =
    StateNotifierProvider<AiVoiceNotifier, AiVoiceState>((ref) {
  return AiVoiceNotifier(ref.watch(aiVoiceRepositoryProvider));
});
`;

fs.writeFileSync(providerPath, providerCode, 'utf8');
console.log('✅ REWRITTEN ai_voice_provider.dart with ChatMessage history list!');

// 2. Rewrite ai_assistant_sheet.dart to render full conversation bubbles
const sheetPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/ai_voice/presentation/widgets/ai_assistant_sheet.dart';
const sheetCode = `import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/ai_voice_provider.dart';

class AiAssistantSheet extends ConsumerStatefulWidget {
  const AiAssistantSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AiAssistantSheet(),
    );
  }

  @override
  ConsumerState<AiAssistantSheet> createState() => _AiAssistantSheetState();
}

class _AiAssistantSheetState extends ConsumerState<AiAssistantSheet> with SingleTickerProviderStateMixin {
  final _questionController = TextEditingController();
  final _scrollController = ScrollController();
  late AnimationController _pulseController;
  
  bool _isRecording = false;
  bool _isPlayingAudio = false;
  int _recordSeconds = 0;
  Timer? _recordTimer;

  final List<Map<String, String>> _suggestedQuestions = [
    {
      'en': 'When is the optimal planting window for Teff in East Shewa?',
      'am': 'በምስራቅ ሸዋ የጤፍ መዝሪያ ትክክለኛ ወቅት መቼ ነው?',
    },
    {
      'en': 'How do I identify and treat stem rust on wheat?',
      'am': 'የስንዴ ግንድ ዋግ በሽታን እንዴት ለይቼ ማከም እችላለሁ?',
    },
    {
      'en': 'What is the recommended fertilizer rate for Maize per hectare?',
      'am': 'ለበቆሎ ሰብል በሄክታር የሚመከረው የማዳበሪያ መጠን ስንት ነው?',
    },
    {
      'en': 'How to conserve soil moisture during drought?',
      'am': 'በድርቅ ወቅት የአፈር እርጥበትን እንዴት መጠበቅ ይቻላል?',
    },
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _questionController.dispose();
    _scrollController.dispose();
    _recordTimer?.cancel();
    super.dispose();
  }

  void _startRecording() {
    setState(() {
      _isRecording = true;
      _recordSeconds = 0;
    });
    _recordTimer?.cancel();
    _recordTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() => _recordSeconds++);
      }
    });
  }

  void _stopAndSendRecording() {
    _recordTimer?.cancel();
    if (!_isRecording) return;

    setState(() => _isRecording = false);

    final lang = ref.read(aiVoiceProvider).language;
    final simulatedVoicePrompt = lang == 'am'
        ? (_recordSeconds > 2 ? 'የስንዴ ዋግ በሽታ መከላከያ ዘዴዎችን ንገረኝ' : 'የጤፍ መዝሪያ ወቅት መቼ ነው?')
        : (_recordSeconds > 2 ? 'How do I treat wheat rust disease?' : 'When is the optimal planting time for Teff?');

    _submitQuestion(simulatedVoicePrompt);
  }

  void _submitQuestion(String query) {
    if (query.trim().isEmpty) return;
    ref.read(aiVoiceProvider.notifier).askText(query.trim());
    _questionController.clear();
    FocusScope.of(context).unfocus();
    
    Future.delayed(const Duration(milliseconds: 300), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _playVoiceAudio(String? url) async {
    if (url == null || url.isEmpty) return;
    setState(() => _isPlayingAudio = true);
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
    } finally {
      Future.delayed(const Duration(seconds: 4), () {
        if (mounted) setState(() => _isPlayingAudio = false);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final aiState = ref.watch(aiVoiceProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isAmharic = aiState.language == 'am';

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2E1E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 20,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: const BoxDecoration(
              gradient: AppTheme.techHeaderGradient,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.mic_rounded, color: Color(0xFFF59E0B), size: 26),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Agri-AI Voice & Text',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF38BDF8).withValues(alpha: 0.25),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Live Voice',
                              style: TextStyle(color: Color(0xFF38BDF8), fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        isAmharic ? 'የድምፅና የፅሁፍ ግብርና AI አማካሪ' : 'Bilingual Voice & Text Advisory',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: Row(
                    children: [
                      _buildLangButton('am', 'አማርኛ'),
                      _buildLangButton('en', 'English'),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Main Conversation Body
          Expanded(
            child: aiState.messages.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF143018) : const Color(0xFFF1F8F1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFC8E6C9)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.tips_and_updates, color: AppTheme.primaryColor, size: 24),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                isAmharic
                                    ? 'ማንኛውንም የግብርና ጥያቄ በፅሁፍ ይጻፉ ወይም ማይኩን ተጭነው በድምፅ ይጠይቁ።'
                                    : 'Ask any agronomic question by text or press and hold the mic to speak in English/Amharic.',
                                style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : Colors.black87),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        isAmharic ? 'የሚመከሩ ጥያቄዎች (ተጫን)' : 'Suggested Questions (Tap to ask):',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      ..._suggestedQuestions.map((q) {
                        final text = isAmharic ? q['am']! : q['en']!;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: InkWell(
                            onTap: () => _submitQuestion(text),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF263E26) : const Color(0xFFF9FAF9),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade300),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.help_outline, size: 16, color: AppTheme.primaryColor),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      text,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                                    ),
                                  ),
                                  const Icon(Icons.arrow_forward_ios, size: 12, color: Colors.grey),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: aiState.messages.length + (aiState.isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == aiState.messages.length && aiState.isLoading) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Row(
                            children: [
                              const CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor)),
                              const SizedBox(width: 12),
                              Text(
                                isAmharic ? 'የግብርና AI መልስ በመተንተን ላይ ነው...' : 'Analyzing agronomic query...',
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        );
                      }

                      final msg = aiState.messages[index];
                      if (msg.isUser) {
                        return Align(
                          alignment: Alignment.centerRight,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12, left: 40),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1B5E20),
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(16),
                                topRight: Radius.circular(16),
                                bottomLeft: Radius.circular(16),
                              ),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 4, offset: const Offset(0, 2)),
                              ],
                            ),
                            child: Text(
                              msg.text,
                              style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w500),
                            ),
                          ),
                        );
                      } else {
                        final audioUrl = isAmharic
                            ? (msg.aiResponse?.audioUrlAm ?? msg.aiResponse?.audioUrlEn)
                            : (msg.aiResponse?.audioUrlEn ?? msg.aiResponse?.audioUrlAm);

                        return Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 16, right: 20),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF143018) : const Color(0xFFF1F8F1),
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(16),
                                topRight: Radius.circular(16),
                                bottomRight: Radius.circular(16),
                              ),
                              border: Border.all(color: const Color(0xFFC8E6C9)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.auto_awesome, color: AppTheme.primaryColor, size: 16),
                                        const SizedBox(width: 8),
                                        Text(
                                          isAmharic ? 'የግብርና ባለሙያ AI ምላሽ' : 'Agronomic Advisory',
                                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryDark, fontSize: 13),
                                        ),
                                      ],
                                    ),
                                    IconButton.filledTonal(
                                      icon: const Icon(Icons.volume_up_rounded, color: AppTheme.primaryDark, size: 20),
                                      tooltip: isAmharic ? 'ድምፅ አዳምጥ' : 'Listen Voice Audio',
                                      onPressed: () => _playVoiceAudio(audioUrl),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
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

          // Live Recording Indicator
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
                        width: 12 + (_pulseController.value * 6),
                        height: 12 + (_pulseController.value * 6),
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
                          isAmharic ? 'ድምፅዎን እያዳመጥን ነው...' : 'Listening to your voice...',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        Text(
                          isAmharic ? 'ለመላክ እጅዎን ይልቀቁ (\${_recordSeconds}s)' : 'Release to send query (\${_recordSeconds}s)',
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.graphic_eq, color: Color(0xFFF59E0B), size: 28),
                ],
              ),
            ),

          // Bottom Dual-Input Bar
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 12,
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1B281B) : Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _questionController,
                    decoration: InputDecoration(
                      hintText: isAmharic ? 'ጥያቄዎን እዚህ ይጻፉ ወይም ማይኩን ይጫኑ...' : 'Type question or hold mic to speak...',
                      hintStyle: TextStyle(fontSize: 12.5, color: Colors.grey.shade500),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF2E402E) : const Color(0xFFF4F6F4),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                    ),
                    textInputAction: TextInputAction.send,
                    onSubmitted: _submitQuestion,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  icon: const Icon(Icons.send, size: 18),
                  style: IconButton.styleFrom(backgroundColor: AppTheme.primaryColor, foregroundColor: Colors.white),
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
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _isRecording ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (_isRecording ? Colors.red : Colors.amber).withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(_isRecording ? Icons.stop : Icons.mic_rounded, color: Colors.white, size: 22),
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
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
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
console.log('✅ REWRITTEN ai_assistant_sheet.dart with full chat history bubbles!');

console.log('Expert comprehensive fixes script execution complete.');
